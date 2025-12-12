import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";
import { UPLOADS_DIR } from "../config/paths";

export class DocumentService {
  async createDocument(data: {
    userId: number;
    title: string;
    filename: string;
    fileType: string;
    size: number;
    category?: string;
  }) {
    return prisma.document.create({
      data: {
        userId: data.userId,
        title: data.title,
        filename: data.filename,
        fileType: data.fileType,
        size: data.size,
        url: `/api/documents/download/${data.filename}`,
        category: data.category,
      },
    });
  }

  async listDocuments(userId: number) {
    return prisma.document.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findDocumentById(id: number) {
    return prisma.document.findUnique({
      where: { id },
    });
  }

  async deleteDocument(id: number, userId: number) {
    const document = await this.findDocumentById(id);

    if (!document) {
      throw new Error("Documento não encontrado");
    }

    if (document.userId !== userId) {
      throw new Error("Acesso negado");
    }

    // Delete DB record
    await prisma.document.delete({
      where: { id },
    });

    // Delete physical file
    const filePath = path.join(UPLOADS_DIR, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getDocumentFile(id: number, userId: number) {
     const document = await this.findDocumentById(id);

    if (!document) {
      throw new Error("Documento não encontrado");
    }

    // Verificar se o documento pertence ao usuário
    if (document.userId !== userId) {
      throw new Error("Acesso negado");
    }

    const filePath = path.join(UPLOADS_DIR, document.filename);

    if (!fs.existsSync(filePath)) {
      throw new Error("Arquivo físico não encontrado");
    }
    
    return { filePath, title: document.title };
  }
}

export const documentService = new DocumentService();
