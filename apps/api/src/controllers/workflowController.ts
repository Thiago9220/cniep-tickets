import { Request, Response } from "express";
import { workflowService } from "../services/workflowService";

export class WorkflowController {
  async list(req: Request, res: Response) {
    try {
      const workflows = await workflowService.listWorkflows(req.user!.id);
      res.json(workflows);
    } catch (error) {
      console.error("Erro ao listar fluxos:", error);
      res.status(500).json({ error: "Erro ao listar fluxos" });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const workflow = await workflowService.getWorkflow(req.params.id, req.user!.id);
      if (!workflow) {
        return res.status(404).json({ error: "Fluxo não encontrado" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Erro ao buscar fluxo:", error);
      res.status(500).json({ error: "Erro ao buscar fluxo" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Título é obrigatório" });
      }

      const workflow = await workflowService.createWorkflow(req.user!.id, req.body);
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Erro ao criar fluxo:", error);
      res.status(500).json({ error: "Erro ao criar fluxo" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const workflow = await workflowService.updateWorkflow(req.params.id, req.user!.id, req.body);
      if (!workflow) {
        return res.status(404).json({ error: "Fluxo não encontrado" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Erro ao atualizar fluxo:", error);
      res.status(500).json({ error: "Erro ao atualizar fluxo" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await workflowService.deleteWorkflow(req.params.id, req.user!.id);
      if (!result) {
        return res.status(404).json({ error: "Fluxo não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar fluxo:", error);
      res.status(500).json({ error: "Erro ao deletar fluxo" });
    }
  }
}

export const workflowController = new WorkflowController();
