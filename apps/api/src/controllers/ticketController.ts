import { Request, Response } from "express";
import { ticketService } from "../services/ticketService";
import { ticketStatsService } from "../services/ticketStatsService";

export class TicketController {
  // CRUD
  async importTickets(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const stats = await ticketService.importTicketsFromExcel(req.file.buffer);
      res.json(stats);
    } catch (error: any) {
      console.error("Erro ao importar Excel:", error);
      res.status(500).json({ error: "Erro ao processar arquivo Excel: " + error.message });
    }
  }

  async listTickets(_req: Request, res: Response) {
    try {
      const tickets = await ticketService.listTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
      res.status(500).json({ error: "Erro ao buscar tickets" });
    }
  }

  async getTicket(req: Request, res: Response) {
    try {
      const ticket = await ticketService.getTicketById(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ error: "Ticket não encontrado" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar ticket" });
    }
  }

  async createTicket(req: Request, res: Response) {
    try {
      const ticket = await ticketService.createTicket(req.body, req.user!.id);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Erro detalhado ao criar ticket:", error);
      res.status(500).json({ error: "Erro ao criar ticket" });
    }
  }

  async updateTicket(req: Request, res: Response) {
    try {
      const ticket = await ticketService.updateTicket(parseInt(req.params.id), req.body);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar ticket" });
    }
  }

  async updateTicketStage(req: Request, res: Response) {
    try {
      const { stage } = req.body;
      const validStages = ["backlog", "desenvolvimento", "homologacao", "producao"];

      if (!stage || !validStages.includes(stage)) {
        return res.status(400).json({ error: "Stage inválido" });
      }
      
      const ticket = await ticketService.updateTicketStage(parseInt(req.params.id), stage, req.user?.id || null);
      res.json(ticket);
    } catch (error) {
      console.error("Erro detalhado ao atualizar stage:", error);
      res.status(500).json({ error: "Erro ao atualizar stage do ticket" });
    }
  }

  async reorderTickets(req: Request, res: Response) {
    try {
      const { stage, order } = req.body as { stage?: string; order?: number[] };
      const validStages = ["backlog", "desenvolvimento", "homologacao", "producao"];
      if (!stage || !validStages.includes(stage)) {
        return res.status(400).json({ error: "Stage inválido" });
      }
      if (!Array.isArray(order)) {
        return res.status(400).json({ error: "Payload inválido" });
      }
      
      try {
        await ticketService.reorderTickets(stage, order);
        res.json({ updated: order.length });
      } catch (e) {
        res.status(501).json({ error: "Reorder não disponível: falta coluna 'position'. Rode as migrações." });
      }
    } catch (error) {
      console.error("Erro ao reordenar tickets:", error);
      res.status(500).json({ error: "Erro ao reordenar tickets" });
    }
  }

  async deleteTicket(req: Request, res: Response) {
    try {
      await ticketService.deleteTicket(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar ticket" });
    }
  }

  // Comments, Activities, Followers
  async listComments(req: Request, res: Response) {
    try {
      const comments = await ticketService.listComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      console.error("Erro ao listar comentários:", error);
      res.status(500).json({ error: "Erro ao listar comentários" });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { content } = req.body || {};
      if (!content || String(content).trim().length === 0) {
        return res.status(400).json({ error: "Comentário vazio" });
      }
      
      const created = await ticketService.addComment(parseInt(req.params.id), req.user!.id, content);
      res.status(201).json(created);
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      res.status(500).json({ error: "Erro ao adicionar comentário" });
    }
  }

  async listActivities(req: Request, res: Response) {
    try {
      const items = await ticketService.listActivities(parseInt(req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Erro ao listar atividades:", error);
      res.status(500).json({ error: "Erro ao listar atividades" });
    }
  }

  async toggleFollow(req: Request, res: Response) {
    try {
      const result = await ticketService.toggleFollow(parseInt(req.params.id), req.user!.id);
      res.json(result);
    } catch (error) {
      console.error("Erro ao alternar follow:", error);
      res.status(500).json({ error: "Erro ao seguir ticket" });
    }
  }

  async listFollowers(req: Request, res: Response) {
    try {
      const followers = await ticketService.listFollowers(parseInt(req.params.id));
      res.json(followers);
    } catch (error) {
      console.error("Erro ao listar seguidores:", error);
      res.status(500).json({ error: "Erro ao listar seguidores" });
    }
  }

  // Stats
  async getOverviewStats(_req: Request, res: Response) {
    try {
      const stats = await ticketStatsService.getOverviewStats();
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  }

  async getMonthlyEvolution(_req: Request, res: Response) {
    try {
      const data = await ticketStatsService.getMonthlyEvolution();
      res.json(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas mensais:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas mensais" });
    }
  }

  async getCriticalTickets(_req: Request, res: Response) {
    try {
      const tickets = await ticketStatsService.getCriticalTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Erro ao buscar tickets críticos:", error);
      res.status(500).json({ error: "Erro ao buscar tickets críticos" });
    }
  }

  async getWeeklyStats(req: Request, res: Response) {
    try {
      const stats = await ticketStatsService.getWeeklyStats(req.params.weekKey);
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas semanais:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas semanais" });
    }
  }

  async getMonthStats(req: Request, res: Response) {
    try {
      const stats = await ticketStatsService.getMonthStats(req.params.monthKey);
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas mensais:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas mensais" });
    }
  }

  async getAvailablePeriods(_req: Request, res: Response) {
    try {
      const data = await ticketStatsService.getAvailablePeriods();
      res.json(data);
    } catch (error) {
      console.error("Erro ao buscar períodos disponíveis:", error);
      res.status(500).json({ error: "Erro ao buscar períodos disponíveis" });
    }
  }

  async getQuarterlyStats(req: Request, res: Response) {
    try {
      const stats = await ticketStatsService.getQuarterlyStats(req.params.quarterKey);
      res.json(stats);
    } catch (error: any) {
      if (error.message.includes("Formato inválido")) {
          return res.status(400).json({ error: error.message });
      }
      console.error("Erro ao buscar estatísticas trimestrais:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas trimestrais" });
    }
  }

  async getAvailableQuarters(_req: Request, res: Response) {
    try {
      const data = await ticketStatsService.getAvailableQuarters();
      res.json(data);
    } catch (error) {
      console.error("Erro ao buscar trimestres disponíveis:", error);
      res.status(500).json({ error: "Erro ao buscar trimestres disponíveis" });
    }
  }
}

export const ticketController = new TicketController();
