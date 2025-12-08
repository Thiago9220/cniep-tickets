import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { weekKey } = req.query;

  if (!weekKey || typeof weekKey !== "string") {
    return res.status(400).json({ error: "weekKey inválido" });
  }

  if (req.method === "GET") {
    try {
      const report = await prisma.weeklyReport.findUnique({
        where: { weekKey },
      });

      if (!report) {
        return res.status(404).json({ error: "Relatório não encontrado" });
      }

      return res.status(200).json(report);
    } catch (error) {
      console.error("Erro ao buscar relatório semanal:", error);
      return res.status(500).json({ error: "Erro ao buscar relatório semanal" });
    }
  } else if (req.method === "DELETE") {
    try {
      await prisma.weeklyReport.delete({
        where: { weekKey },
      });
      return res.status(204).end();
    } catch (error) {
      console.error("Erro ao deletar relatório semanal:", error);
      return res.status(500).json({ error: "Erro ao deletar relatório semanal" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
