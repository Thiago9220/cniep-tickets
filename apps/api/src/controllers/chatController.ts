import { Request, Response } from "express";
import { chatService } from "../services/chatService";

export class ChatController {
  async completion(req: Request, res: Response) {
    try {
      const { contents, generationConfig } = req.body;
      const data = await chatService.generateCompletion(contents, generationConfig);
      res.json(data);
    } catch (error: any) {
      console.error("Erro no endpoint de chat:", error);
      res.status(500).json({ error: error.message || "Erro interno ao processar solicitação de IA" });
    }
  }
}

export const chatController = new ChatController();
