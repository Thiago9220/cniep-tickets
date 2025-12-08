import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const reports = await prisma.weeklyReport.findMany({
        orderBy: { weekKey: "desc" },
      });
      return res.status(200).json(reports);
    } catch (error) {
      console.error("Erro ao buscar relatórios semanais:", error);
      return res.status(500).json({ error: "Erro ao buscar relatórios semanais" });
    }
  } else if (req.method === "POST") {
    try {
      const { weekKey, period, data } = req.body;

      if (!weekKey || !period || !data) {
        return res.status(400).json({ error: "weekKey, period e data são obrigatórios" });
      }

      const report = await prisma.weeklyReport.upsert({
        where: { weekKey },
        update: { period, data },
        create: { weekKey, period, data },
      });

      return res.status(200).json(report);
    } catch (error) {
      console.error("Erro ao salvar relatório semanal:", error);
      return res.status(500).json({ error: "Erro ao salvar relatório semanal" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
