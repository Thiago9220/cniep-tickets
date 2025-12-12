import { Request, Response } from "express";
import { manualService } from "../services/manualService";

export class ManualController {
  async list(req: Request, res: Response) {
    try {
      const manuals = await manualService.listManuals(req.user!.id);
      res.json(manuals);
    } catch (error) {
      console.error("Erro detalhado ao listar manuais:", error);
      res.status(500).json({ error: "Erro ao listar manuais" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { titulo, conteudo } = req.body;

      if (!titulo || !conteudo) {
        return res.status(400).json({ error: "Título e conteúdo são obrigatórios" });
      }

      const manual = await manualService.createManual(req.user!.id, req.user!.role, req.body);
      res.status(201).json(manual);
    } catch (error) {
      console.error("Erro ao criar manual:", error);
      res.status(500).json({ error: "Erro ao criar manual" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await manualService.deleteManual(req.params.id, req.user!.id, req.user!.role);
      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao deletar manual:", error);
      if (error.message === "Manual não encontrado") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes("permissão") || error.message.includes("administradores")) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Erro ao deletar manual" });
    }
  }
}

export const manualController = new ManualController();
