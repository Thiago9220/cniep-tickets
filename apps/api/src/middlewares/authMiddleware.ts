import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "cniep-tickets-secret-key-2025";

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
