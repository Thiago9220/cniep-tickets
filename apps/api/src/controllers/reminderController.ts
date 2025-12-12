import { Request, Response } from "express";
import { reminderService } from "../services/reminderService";

export class ReminderController {
  async list(req: Request, res: Response) {
    try {
      const reminders = await reminderService.listReminders(req.user!.id);
      res.json(reminders);
    } catch (error) {
      console.error("Erro ao listar lembretes:", error);
      res.status(500).json({ error: "Erro ao listar lembretes" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { titulo } = req.body || {};
      if (!titulo || typeof titulo !== "string") {
        return res.status(400).json({ error: "Título é obrigatório" });
      }
      const reminder = await reminderService.createReminder(req.user!.id, req.body);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Erro ao criar lembrete:", error);
      res.status(500).json({ error: "Erro ao criar lembrete" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updated = await reminderService.updateReminder(req.params.id, req.user!.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Lembrete não encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar lembrete:", error);
      res.status(500).json({ error: "Erro ao atualizar lembrete" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await reminderService.deleteReminder(req.params.id, req.user!.id);
      if (!result) {
        return res.status(404).json({ error: "Lembrete não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar lembrete:", error);
      res.status(500).json({ error: "Erro ao deletar lembrete" });
    }
  }

  async reorder(req: Request, res: Response) {
    try {
      const updates: Array<{ id: string; ordem: number | null }> = req.body?.updates || [];
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Formato inválido: updates" });
      }
      const result = await reminderService.reorderReminders(req.user!.id, updates);
      res.json({ updated: result.length });
    } catch (error) {
      console.error("Erro ao reordenar lembretes:", error);
      res.status(500).json({ error: "Erro ao reordenar lembretes" });
    }
  }

  async getCounts(req: Request, res: Response) {
    try {
      const counts = await reminderService.getCounts(req.user!.id);
      res.json(counts);
    } catch (error) {
      console.error("Erro ao calcular contadores de lembretes:", error);
      res.status(500).json({ error: "Erro ao calcular contadores" });
    }
  }
}

export const reminderController = new ReminderController();
