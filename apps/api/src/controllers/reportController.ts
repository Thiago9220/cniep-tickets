import { Request, Response } from "express";
import { reportService } from "../services/reportService";

export class ReportController {
  // Weekly
  async listWeekly(_req: Request, res: Response) {
    try {
      const reports = await reportService.listWeeklyReports();
      res.json(reports);
    } catch (error) {
      console.error("Erro ao buscar relatórios semanais:", error);
      res.status(500).json({ error: "Erro ao buscar relatórios semanais" });
    }
  }

  async getWeekly(req: Request, res: Response) {
    try {
      const report = await reportService.getWeeklyReport(req.params.weekKey);
      if (!report) {
        return res.status(404).json({ error: "Relatório não encontrado" });
      }
      res.json(report);
    } catch (error) {
      console.error("Erro ao buscar relatório semanal:", error);
      res.status(500).json({ error: "Erro ao buscar relatório semanal" });
    }
  }

  async upsertWeekly(req: Request, res: Response) {
    try {
      const { weekKey, period, data } = req.body;
      if (!weekKey || !period || !data) {
        return res.status(400).json({ error: "weekKey, period e data são obrigatórios" });
      }
      const report = await reportService.upsertWeeklyReport({ weekKey, period, data });
      res.json(report);
    } catch (error) {
      console.error("Erro ao salvar relatório semanal:", error);
      res.status(500).json({ error: "Erro ao salvar relatório semanal" });
    }
  }

  async deleteWeekly(req: Request, res: Response) {
    try {
      await reportService.deleteWeeklyReport(req.params.weekKey);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar relatório semanal:", error);
      res.status(500).json({ error: "Erro ao deletar relatório semanal" });
    }
  }

  // Monthly
  async listMonthly(_req: Request, res: Response) {
    try {
      const reports = await reportService.listMonthlyReports();
      res.json(reports);
    } catch (error) {
      console.error("Erro ao buscar relatórios mensais:", error);
      res.status(500).json({ error: "Erro ao buscar relatórios mensais" });
    }
  }

  async upsertMonthly(req: Request, res: Response) {
    try {
      const { monthKey, data } = req.body;
      if (!monthKey || !data) {
        return res.status(400).json({ error: "monthKey e data são obrigatórios" });
      }
      const report = await reportService.upsertMonthlyReport({ monthKey, data });
      res.json(report);
    } catch (error) {
      console.error("Erro ao salvar relatório mensal:", error);
      res.status(500).json({ error: "Erro ao salvar relatório mensal" });
    }
  }

  // Quarterly
  async listQuarterly(_req: Request, res: Response) {
    try {
      const reports = await reportService.listQuarterlyReports();
      res.json(reports);
    } catch (error) {
      console.error("Erro ao buscar relatórios trimestrais:", error);
      res.status(500).json({ error: "Erro ao buscar relatórios trimestrais" });
    }
  }

  async upsertQuarterly(req: Request, res: Response) {
    try {
      const { quarterKey, data } = req.body;
      if (!quarterKey || !data) {
        return res.status(400).json({ error: "quarterKey e data são obrigatórios" });
      }
      const report = await reportService.upsertQuarterlyReport({ quarterKey, data });
      res.json(report);
    } catch (error) {
      console.error("Erro ao salvar relatório trimestral:", error);
      res.status(500).json({ error: "Erro ao salvar relatório trimestral" });
    }
  }
}

export const reportController = new ReportController();
