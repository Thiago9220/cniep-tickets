import prisma from "../lib/prisma";

export class ManualService {
  async listManuals(userId: number) {
    return prisma.manual.findMany({
      where: {
        OR: [
          { userId: userId },
          { isGlobal: true }
        ]
      },
      orderBy: [
        { isGlobal: "desc" }, // Globais primeiro
        { createdAt: "desc" }
      ],
    });
  }

  async createManual(userId: number, role: string, data: any) {
    const { titulo, conteudo, isGlobal } = data;

    // Apenas admin pode criar manuais globais
    let finalIsGlobal = false;
    if (isGlobal === true) {
      if (role === "admin") {
        finalIsGlobal = true;
      } else {
        finalIsGlobal = false; 
      }
    }

    return prisma.manual.create({
      data: {
        userId,
        title: titulo,
        content: conteudo,
        isGlobal: finalIsGlobal,
      },
    });
  }

  async deleteManual(id: string, userId: number, role: string) {
    const manual = await prisma.manual.findUnique({
      where: { id },
    });

    if (!manual) {
      throw new Error("Manual não encontrado");
    }

    const isOwner = manual.userId === userId;
    const isAdmin = role === "admin";

    if (!isOwner && !isAdmin) {
      throw new Error("Sem permissão para deletar este manual");
    }

    if (manual.isGlobal && !isOwner && !isAdmin) {
       throw new Error("Apenas administradores podem remover manuais globais");
    }

    return prisma.manual.delete({
      where: { id },
    });
  }
}

export const manualService = new ManualService();
