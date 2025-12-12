import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "cniep-tickets-secret-key-2025";
const JWT_EXPIRES_IN = "7d";

export const ADMIN_EMAILS = [
  "thiago.ramos.pro@gmail.com",
];

export class AuthService {
  generateToken(user: { id: number; email: string; name: string | null; role: string }) {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    let finalRole = data.role === "admin" ? "admin" : "user";
    if (ADMIN_EMAILS.includes(data.email)) {
      finalRole = "admin";
    }

    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || null,
        role: finalRole,
      },
    });
  }

  async validatePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  async generatePasswordResetToken(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    
    if (!user.password && user.provider) {
        throw new Error("SocialLogin");
    }

    const token = crypto.randomBytes(20).toString("hex");
    const now = new Date();
    const expires = new Date(now.getTime() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) return null;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return user;
  }
}

export const authService = new AuthService();