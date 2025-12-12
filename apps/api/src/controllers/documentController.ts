import { Request, Response } from "express";
import { documentService } from "../services/documentService";
import { createLogger } from "../utils/logger";
import { scanFileWithClamAV } from "../utils/clamav";
import { UPLOADS_DIR } from "../config/paths";
import path from "path";
import fs from "fs";

export class DocumentController {
  async upload(req: Request, res: Response) {
    const logger = createLogger(req);
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { originalname, filename, size, mimetype } = req.file;

      // Optional ClamAV scan in production
      const filePath = path.join(UPLOADS_DIR, filename);
      const scanResult = await scanFileWithClamAV(filePath);
      if (!scanResult.clean) {
        // Delete infected file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        logger.warn("Arquivo infectado detectado", { filename, scanResult: scanResult.message });
        return res.status(400).json({ error: "Arquivo rejeitado por motivos de segurança" });
      }

      const document = await documentService.createDocument({
        userId,
        title: originalname,
        filename,
        fileType: mimetype,
        size,
        category: req.body.category || undefined,
      });

      logger.info("Documento criado", { documentId: document.id, filename, size });
      res.status(201).json(document);
    } catch (error) {
      logger.error("Erro ao fazer upload de documento", error);
      res.status(500).json({ error: "Erro ao salvar documento" });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const documents = await documentService.listDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Erro ao listar documentos:", error);
      res.status(500).json({ error: "Erro ao listar documentos" });
    }
  }

  async download(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const { id } = req.params;
      const { filePath, title } = await documentService.getDocumentFile(parseInt(id), userId);

      res.download(filePath, title);
    } catch (error: any) {
      console.error("Erro ao baixar documento:", error);
      if (error.message === "Documento não encontrado" || error.message === "Arquivo físico não encontrado") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Acesso negado") {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Erro ao baixar documento" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;
      await documentService.deleteDocument(parseInt(id), userId);

      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao deletar documento:", error);
      if (error.message === "Documento não encontrado") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Acesso negado") {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Erro ao deletar documento" });
    }
  }
}

export const documentController = new DocumentController();
