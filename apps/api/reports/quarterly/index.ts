import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === "GET") {
    // Listar todos os relatórios trimestrais
    try {
      const reports = await prisma.quarterlyReport.findMany({
        orderBy: { quarterKey: "desc" },
      });
      return res.status(200).json(reports);
    } catch (error) {
      console.error("Erro ao buscar relatórios trimestrais:", error);
      return res.status(500).json({ error: "Erro ao buscar relatórios trimestrais" });
    }
  } else if (req.method === "POST") {
    // Criar ou atualizar um relatório trimestral
    try {
      const { quarterKey, data } = req.body;

      if (!quarterKey || !data) {
        return res.status(400).json({ error: "quarterKey e data são obrigatórios" });
      }

      const report = await prisma.quarterlyReport.upsert({
        where: { quarterKey },
        update: { data },
        create: { quarterKey, data },
      });

      return res.status(200).json(report);
    } catch (error) {
      console.error("Erro ao salvar relatório trimestral:", error);
      return res.status(500).json({ error: "Erro ao salvar relatório trimestral" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
