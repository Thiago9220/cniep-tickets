import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const reports = await prisma.monthlyReport.findMany({
        orderBy: { monthKey: "desc" },
      });
      return res.status(200).json(reports);
    } catch (error) {
      console.error("Erro ao buscar relatórios mensais:", error);
      return res.status(500).json({ error: "Erro ao buscar relatórios mensais" });
    }
  } else if (req.method === "POST") {
    try {
      const { monthKey, data } = req.body;

      if (!monthKey || !data) {
        return res.status(400).json({ error: "monthKey e data são obrigatórios" });
      }

      const report = await prisma.monthlyReport.upsert({
        where: { monthKey },
        update: { data },
        create: { monthKey, data },
      });

      return res.status(200).json(report);
    } catch (error) {
      console.error("Erro ao salvar relatório mensal:", error);
      return res.status(500).json({ error: "Erro ao salvar relatório mensal" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
