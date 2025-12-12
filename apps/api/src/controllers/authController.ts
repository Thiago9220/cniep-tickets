import { Request, Response } from "express";
import { authService, ADMIN_EMAILS } from "../services/authService";
import { createLogger } from "../utils/logger";
import prisma from "../lib/prisma";

export class AuthController {
  async login(req: Request, res: Response) {
    const logger = createLogger(req);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      const user = await authService.findUserByEmail(email);

      if (!user) {
        logger.warn("Tentativa de login com email inexistente", { email });
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      if (!user.password) {
        logger.warn("Tentativa de login com senha em conta OAuth", { email });
        return res.status(401).json({
          error: "Esta conta usa login social. Use Google ou GitHub para entrar.",
        });
      }

      const isValidPassword = await authService.validatePassword(password, user.password);

      if (!isValidPassword) {
        logger.warn("Tentativa de login com senha incorreta", { email });
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      const tokenRole = ADMIN_EMAILS.includes(user.email) ? "admin" : user.role;
      const token = authService.generateToken({ ...user, role: tokenRole });

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
  }

  async googleAuth(req: Request, res: Response) {
    const logger = createLogger(req);
    try {
      const { token: googleToken } = req.body;

      if (!googleToken) {
        return res.status(400).json({ error: "Token do Google é obrigatório" });
      }

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

      const googleUser = await googleResponse.json() as any;

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: googleUser.email },
            { provider: "google", providerId: googleUser.sub },
          ],
        },
      });

      if (!user) {
        logger.warn("Tentativa de login Google com email não cadastrado", { email: googleUser.email });
        return res.status(403).json({
          error: "Usuário não cadastrado. Entre em contato com um administrador para obter acesso."
        });
      } else if (!user.provider) {
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

      const tokenRole = ADMIN_EMAILS.includes(user.email) ? "admin" : user.role;
      const token = authService.generateToken({ ...user, role: tokenRole });

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
  }

  async githubAuth(req: Request, res: Response) {
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

      const tokenData = await tokenResponse.json() as any;

      if (tokenData.error || !tokenData.access_token) {
        logger.warn("Código do GitHub inválido");
        return res.status(401).json({ error: "Código do GitHub inválido" });
      }

      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const githubUser = await userResponse.json() as any;

      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        const emails = await emailsResponse.json() as any[];
        const primaryEmail = emails.find((e) => e.primary);
        email = primaryEmail?.email || `${githubUser.login}@github.local`;
      }

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { provider: "github", providerId: String(githubUser.id) },
          ],
        },
      });

      if (!user) {
        logger.warn("Tentativa de login GitHub com email não cadastrado", { email });
        return res.status(403).json({
          error: "Usuário não cadastrado. Entre em contato com um administrador para obter acesso."
        });
      } else if (!user.provider) {
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

      const tokenRole = ADMIN_EMAILS.includes(user.email) ? "admin" : user.role;
      const token = authService.generateToken({ ...user, role: tokenRole });

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
  }

  async getMe(req: Request, res: Response) {
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
          canEditKanban: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const isAdmin = user.role === "admin" || ADMIN_EMAILS.includes(user.email);

      res.json({
        ...user,
        isAdmin,
        canEditKanban: isAdmin || user.canEditKanban,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  }

  async updateProfile(req: Request, res: Response) {
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
  }

  async updateAvatar(req: Request, res: Response) {
      // This is for JSON update of avatar URL, not the file upload which is handled separately or we can combine
      // The original code had separated route for upload that returned user, and also a PUT /avatar that updated URL?
      // Re-reading original index.ts:
      // router.post("/auth/avatar/upload"...) -> Updates DB and returns user.
      // And apps/api/auth.ts had `router.put("/avatar")` -> Updates DB with URL string.
      
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
  }

  async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          provider: true,
          createdAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      res.status(500).json({ error: "Erro ao salvar avatar" });
    }
  }

  async createUserAdmin(req: Request, res: Response) {
    const logger = createLogger(req);
    try {
      const { email, password, name, role: userRole } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email inválido" });
      }

      const existingUser = await authService.findUserByEmail(email);

      if (existingUser) {
        logger.warn("Tentativa de criar usuário com email já existente", { email, adminId: req.user!.id });
        return res.status(400).json({ error: "Este email já está cadastrado" });
      }

      const user = await authService.createUser({ email, password, name, role: userRole });

      logger.info("Novo usuário criado por admin", {
        userId: user.id,
        email: user.email,
        createdBy: req.user!.id
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        message: "Usuário criado com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao criar usuário", error);
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const logger = createLogger(req);
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email é obrigatório" });

      try {
        const token = await authService.generatePasswordResetToken(email);
        if (token) {
           const resetLink = `${req.protocol}://localhost:3000/reset-password?token=${token}`;
           console.log(`[EMAIL SIMULATOR] Recuperação de senha para ${email}: ${resetLink}`);
           logger.info("Solicitação de recuperação de senha", { email });
        }
      } catch (e: any) {
         if (e.message === "SocialLogin") {
             return res.json({ message: "Este email está vinculado a uma conta social (Google/GitHub). Faça login diretamente por lá." });
         }
      }

      res.json({ message: "Se o email estiver cadastrado, você receberá um link de recuperação." });
    } catch (error) {
      logger.error("Erro no forgot-password", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  }

  async resetPassword(req: Request, res: Response) {
    const logger = createLogger(req);
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
      }

      const user = await authService.resetPassword(token, newPassword);

      if (!user) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      logger.info("Senha resetada com sucesso", { userId: user.id });
      res.json({ message: "Senha alterada com sucesso. Faça login com a nova senha." });
    } catch (error) {
      logger.error("Erro no reset-password", error);
      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  }
}

export const authController = new AuthController();
