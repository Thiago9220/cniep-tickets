import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "cniep-tickets-secret-key-2025";

const ADMIN_EMAILS = [
  "thiago.ramos.pro@gmail.com",
];

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

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
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

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

// Middleware para verificar se pode editar o Kanban (admin OU canEditKanban)
export async function kanbanMiddleware(req: Request, res: Response, next: NextFunction) {
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

    const isSuperAdmin = ADMIN_EMAILS.includes(decoded.email);
    const isAdminRole = decoded.role === "admin";

    // Se é admin, permite acesso
    if (isSuperAdmin || isAdminRole) {
      return next();
    }

    // Se não é admin, verifica canEditKanban no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { canEditKanban: true }
    });

    if (user?.canEditKanban) {
      return next();
    }

    return res.status(403).json({ error: "Acesso restrito. Você não tem permissão para editar o Kanban." });
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}