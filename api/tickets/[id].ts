import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;
  const ticketId = parseInt(id as string);

  if (isNaN(ticketId)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  if (req.method === "GET") {
    // Buscar um ticket por ID
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
      if (!ticket) {
        return res.status(404).json({ error: "Ticket não encontrado" });
      }
      return res.status(200).json(ticket);
    } catch (error) {
      console.error("Erro ao buscar ticket:", error);
      return res.status(500).json({ error: "Erro ao buscar ticket" });
    }
  } else if (req.method === "PUT") {
    // Atualizar um ticket
    try {
      const { title, description, status, priority } = req.body;
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { title, description, status, priority },
      });
      return res.status(200).json(ticket);
    } catch (error) {
      console.error("Erro ao atualizar ticket:", error);
      return res.status(500).json({ error: "Erro ao atualizar ticket" });
    }
  } else if (req.method === "DELETE") {
    // Deletar um ticket
    try {
      await prisma.ticket.delete({
        where: { id: ticketId },
      });
      return res.status(204).end();
    } catch (error) {
      console.error("Erro ao deletar ticket:", error);
      return res.status(500).json({ error: "Erro ao deletar ticket" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
