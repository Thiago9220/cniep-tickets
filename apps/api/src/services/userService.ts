import prisma from "../lib/prisma";
import { ADMIN_EMAILS } from "./authService";

export class UserService {
  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        canEditKanban: true,
        provider: true,
        createdAt: true,
        _count: {
          select: { documents: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async updateUserRole(userId: number, role: string, adminId: number) {
    // Prevenir que um usuário remova seu próprio admin (segurança básica)
    if (userId === adminId && role !== "admin") {
      throw new Error("Você não pode remover seu próprio privilégio de administrador.");
    }

    // Buscar usuário alvo para verificar se é Super Admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!targetUser) {
      throw new Error("Usuário não encontrado.");
    }

    // Proteger Super Admin de ter seu papel alterado
    if (ADMIN_EMAILS.includes(targetUser.email)) {
      throw new Error("Não é possível alterar o papel de um Super Admin.");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
  }

  async updateKanbanPermission(userId: number, canEditKanban: boolean) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true }
    });

    if (!targetUser) {
      throw new Error("Usuário não encontrado.");
    }

    // Super Admins e Admins já têm acesso completo, não precisam dessa flag
    if (ADMIN_EMAILS.includes(targetUser.email) || targetUser.role === "admin") {
      throw new Error("Administradores já possuem acesso total ao Kanban.");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { canEditKanban },
      select: {
        id: true,
        email: true,
        canEditKanban: true
      }
    });
  }

  async deleteUser(userId: number, adminId: number) {
    // Impedir deletar a própria conta por esta rota
    if (userId === adminId) {
       throw new Error("Não é possível deletar sua própria conta por aqui");
    }

    // Buscar usuário a ser deletado
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      throw new Error("Usuário não encontrado");
    }

    // Impedir deletar super admins
    if (ADMIN_EMAILS.includes(userToDelete.email)) {
      throw new Error("Não é possível deletar um Super Administrador");
    }

    return prisma.user.delete({
      where: { id: userId },
    });
  }
}

export const userService = new UserService();
