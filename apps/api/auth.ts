import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "./db";
import { loginRateLimiter, createLogger } from "./security";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "cniep-tickets-secret-key-2025";
const JWT_EXPIRES_IN = "7d";

// Lista de emails com permissão de admin (Super Admins)
const ADMIN_EMAILS = [
  "thiago.ramos.pro@gmail.com",
];

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string | null;
        role: string;
      };
    }
  }
}

// Helper to generate JWT
function generateToken(user: { id: number; email: string; name: string | null; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ============== AUTH MIDDLEWARE ==============
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      name: string | null;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// ============== ADMIN MIDDLEWARE ==============
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // Primeiro verifica autenticação
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      name: string | null;
      role: string;
    };

    req.user = decoded;

    // Verifica se é admin (pelo role ou pela lista de super admins)
    const isSuperAdmin = ADMIN_EMAILS.includes(decoded.email);
    const isAdminRole = decoded.role === "admin";

    if (!isSuperAdmin && !isAdminRole) {
      return res.status(403).json({ error: "Acesso restrito a administradores" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Helper para verificar se email é admin
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

// ============== REGISTER ==============
router.post("/register", loginRateLimiter, async (req: Request, res: Response) => {
  const logger = createLogger(req);
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn("Tentativa de registro com email já existente", { email });
      return res.status(400).json({ error: "Este email já está cadastrado" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // Se o email estiver na lista de super admins, define como admin automaticamente
    const role = ADMIN_EMAILS.includes(email) ? "admin" : "user";

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role,
      },
    });

    // Generate token
    const token = generateToken(user);

    logger.info("Novo usuário registrado", { userId: user.id, email: user.email });
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    logger.error("Erro no registro", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// ============== LOGIN ==============
router.post("/login", loginRateLimiter, async (req: Request, res: Response) => {
  const logger = createLogger(req);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn("Tentativa de login com email inexistente", { email });
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    // Check if user has password (might be OAuth only)
    if (!user.password) {
      logger.warn("Tentativa de login com senha em conta OAuth", { email });
      return res.status(401).json({
        error: "Esta conta usa login social. Use Google ou GitHub para entrar.",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      logger.warn("Tentativa de login com senha incorreta", { email });
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    // Check if should assume admin role from hardcoded list (legacy support)
    if (ADMIN_EMAILS.includes(user.email) && user.role !== "admin") {
       // Opcional: Auto-promover no DB? Por enquanto vamos apenas garantir que o token tenha a role correta se ele for superadmin
    }
    
    // Override role for token generation if super admin
    const tokenRole = ADMIN_EMAILS.includes(user.email) ? "admin" : user.role;
    
    // Generate token
    const token = generateToken({ ...user, role: tokenRole });

    logger.info("Login bem-sucedido", { userId: user.id, email: user.email });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: tokenRole,
      },
      token,
    });
  } catch (error) {
    logger.error("Erro no login", error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// ============== OAUTH GOOGLE ==============
router.post("/oauth/google", loginRateLimiter, async (req: Request, res: Response) => {
  const logger = createLogger(req);
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: "Token do Google é obrigatório" });
    }

    // Verify Google token
    const googleResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: { Authorization: `Bearer ${googleToken}` },
      }
    );

    if (!googleResponse.ok) {
      logger.warn("Token do Google inválido");
      return res.status(401).json({ error: "Token do Google inválido" });
    }

    const googleUser = await googleResponse.json() as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: googleUser.email },
          { provider: "google", providerId: googleUser.sub },
        ],
      },
    });

    if (!user) {
      // Create new user
      const role = ADMIN_EMAILS.includes(googleUser.email) ? "admin" : "user";
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          provider: "google",
          providerId: googleUser.sub,
          role,
        },
      });
      logger.info("Novo usuário criado via Google OAuth", { userId: user.id, email: user.email });
    } else if (!user.provider) {
      // Link existing email user to Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: "google",
          providerId: googleUser.sub,
          name: user.name || googleUser.name,
        },
      });
      logger.info("Conta vinculada ao Google", { userId: user.id, email: user.email });
    }

    // Override role for token if super admin
    const tokenRole = ADMIN_EMAILS.includes(user.email) ? "admin" : user.role;

    // Generate token
    const token = generateToken({ ...user, role: tokenRole });

    logger.info("Login via Google bem-sucedido", { userId: user.id, email: user.email });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: tokenRole,
      },
      token,
    });
  } catch (error) {
    logger.error("Erro no OAuth Google", error);
    res.status(500).json({ error: "Erro ao autenticar com Google" });
  }
});

// ============== OAUTH GITHUB ==============
router.post("/oauth/github", loginRateLimiter, async (req: Request, res: Response) => {
  const logger = createLogger(req);
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Código do GitHub é obrigatório" });
    }

    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return res.status(500).json({ error: "GitHub OAuth não configurado" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };

    if (tokenData.error || !tokenData.access_token) {
      logger.warn("Código do GitHub inválido");
      return res.status(401).json({ error: "Código do GitHub inválido" });
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const githubUser = await userResponse.json() as {
      id: number;
      login: string;
      name: string | null;
      email: string | null;
    };

    // Get user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean }>;
      const primaryEmail = emails.find((e) => e.primary);
      email = primaryEmail?.email || `${githubUser.login}@github.local`;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { provider: "github", providerId: String(githubUser.id) },
        ],
      },
    });

    if (!user) {
      // Create new user
      const role = ADMIN_EMAILS.includes(email) ? "admin" : "user";
      user = await prisma.user.create({
        data: {
          email,
          name: githubUser.name || githubUser.login,
          provider: "github",
          providerId: String(githubUser.id),
          role,
        },
      });
      logger.info("Novo usuário criado via GitHub OAuth", { userId: user.id, email: user.email });
    } else if (!user.provider) {
      // Link existing email user to GitHub
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: "github",
          providerId: String(githubUser.id),
          name: user.name || githubUser.name || githubUser.login,
        },
      });
      logger.info("Conta vinculada ao GitHub", { userId: user.id, email: user.email });
    }

    // Override role for token if super admin
    const tokenRole = ADMIN_EMAILS.includes(user.email) ? "admin" : user.role;

    // Generate token
    const token = generateToken({ ...user, role: tokenRole });

    logger.info("Login via GitHub bem-sucedido", { userId: user.id, email: user.email });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: tokenRole,
      },
      token,
    });
  } catch (error) {
    logger.error("Erro no OAuth GitHub", error);
    res.status(500).json({ error: "Erro ao autenticar com GitHub" });
  }
});

// ============== GET CURRENT USER ==============
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Adiciona flag isAdmin
    res.json({
      ...user,
      isAdmin: user.role === "admin" || ADMIN_EMAILS.includes(user.email),
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

// ============== UPDATE PROFILE ==============
router.put("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

// ============== UPDATE AVATAR ==============
router.put("/avatar", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ error: "URL do avatar é obrigatória" });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    res.status(500).json({ error: "Erro ao atualizar avatar" });
  }
});

// ============== CHANGE PASSWORD ==============
router.put("/password", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // If user has password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Senha atual é obrigatória" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
});

export default router;
