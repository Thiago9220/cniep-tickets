import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === "GET") {
    // Listar todos os tickets
    try {
      const tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(tickets);
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
      return res.status(500).json({ error: "Erro ao buscar tickets" });
    }
  } else if (req.method === "POST") {
    // Criar um novo ticket
    try {
      const { title, description, status, priority, type, url, ticketNumber, registrationDate } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Título é obrigatório" });
      }

      const ticket = await prisma.ticket.create({
        data: {
          title,
          description,
          status: status || "aberto",
          priority: priority || "media",
          type: type || "outros",
          url,
          ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : null,
          registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
        },
      });
      return res.status(201).json(ticket);
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      return res.status(500).json({ error: "Erro ao criar ticket" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
