import { Request, Response } from "express";
import { userService } from "../services/userService";
import { createLogger } from "../utils/logger";

export class UserController {
  async list(_req: Request, res: Response) {
    try {
      const users = await userService.listUsers();
      res.json(users);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({ error: "Erro ao listar usuários" });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ error: "Papel inválido. Use 'user' ou 'admin'." });
      }

      const user = await userService.updateUserRole(userId, role, req.user!.id);
      res.json(user);
    } catch (error: any) {
      console.error("Erro ao atualizar papel do usuário:", error);
      if (error.message.includes("não pode") || error.message.includes("Super Admin")) {
          return res.status(403).json({ error: error.message });
      }
      if (error.message === "Usuário não encontrado.") {
          return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Erro ao atualizar papel do usuário" });
    }
  }

  async delete(req: Request, res: Response) {
    const logger = createLogger(req);
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID de usuário inválido" });
      }

      await userService.deleteUser(userId, req.user!.id);

      logger.info("Usuário deletado por admin", {
        deletedUserId: userId,
        deletedBy: req.user!.id
      });

      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error: any) {
      logger.error("Erro ao deletar usuário", error);
      if (error.message.includes("não é possível") || error.message.includes("Super Administrador")) {
          return res.status(403).json({ error: error.message });
      }
      if (error.message === "Usuário não encontrado") {
          return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  }
}

export const userController = new UserController();
