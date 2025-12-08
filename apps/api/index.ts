import cors from "cors";
import express from "express";
import prisma from "./db";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/hello", (_req, res) => {
  res.json({ message: "API funcionando" });
});

// Listar todos os tickets
app.get("/api/tickets", async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

// Buscar um ticket por ID
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar ticket" });
  }
});

// Criar um novo ticket
app.post("/api/tickets", async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    const ticket = await prisma.ticket.create({
      data: { title, description, status, priority },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar ticket" });
  }
});

// Atualizar um ticket
app.put("/api/tickets/:id", async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description, status, priority },
    });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar ticket" });
  }
});

// Deletar um ticket
app.delete("/api/tickets/:id", async (req, res) => {
  try {
    await prisma.ticket.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar ticket" });
  }
});

// ============== RELATÓRIOS SEMANAIS ==============

// Listar todos os relatórios semanais
app.get("/api/reports/weekly", async (_req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      orderBy: { weekKey: "desc" },
    });
    res.json(reports);
  } catch (error) {
    console.error("Erro ao buscar relatórios semanais:", error);
    res.status(500).json({ error: "Erro ao buscar relatórios semanais" });
  }
});

// Buscar relatório semanal por weekKey
app.get("/api/reports/weekly/:weekKey", async (req, res) => {
  try {
    const report = await prisma.weeklyReport.findUnique({
      where: { weekKey: req.params.weekKey },
    });
    if (!report) {
      return res.status(404).json({ error: "Relatório não encontrado" });
    }
    res.json(report);
  } catch (error) {
    console.error("Erro ao buscar relatório semanal:", error);
    res.status(500).json({ error: "Erro ao buscar relatório semanal" });
  }
});

// Criar ou atualizar relatório semanal
app.post("/api/reports/weekly", async (req, res) => {
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
    res.json(report);
  } catch (error) {
    console.error("Erro ao salvar relatório semanal:", error);
    res.status(500).json({ error: "Erro ao salvar relatório semanal" });
  }
});

// Deletar relatório semanal
app.delete("/api/reports/weekly/:weekKey", async (req, res) => {
  try {
    await prisma.weeklyReport.delete({
      where: { weekKey: req.params.weekKey },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar relatório semanal:", error);
    res.status(500).json({ error: "Erro ao deletar relatório semanal" });
  }
});

// ============== RELATÓRIOS MENSAIS ==============

// Listar todos os relatórios mensais
app.get("/api/reports/monthly", async (_req, res) => {
  try {
    const reports = await prisma.monthlyReport.findMany({
      orderBy: { monthKey: "desc" },
    });
    res.json(reports);
  } catch (error) {
    console.error("Erro ao buscar relatórios mensais:", error);
    res.status(500).json({ error: "Erro ao buscar relatórios mensais" });
  }
});

// Criar ou atualizar relatório mensal
app.post("/api/reports/monthly", async (req, res) => {
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
    res.json(report);
  } catch (error) {
    console.error("Erro ao salvar relatório mensal:", error);
    res.status(500).json({ error: "Erro ao salvar relatório mensal" });
  }
});

// ============== RELATÓRIOS TRIMESTRAIS ==============

// Listar todos os relatórios trimestrais
app.get("/api/reports/quarterly", async (_req, res) => {
  try {
    const reports = await prisma.quarterlyReport.findMany({
      orderBy: { quarterKey: "desc" },
    });
    res.json(reports);
  } catch (error) {
    console.error("Erro ao buscar relatórios trimestrais:", error);
    res.status(500).json({ error: "Erro ao buscar relatórios trimestrais" });
  }
});

// Criar ou atualizar relatório trimestral
app.post("/api/reports/quarterly", async (req, res) => {
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
    res.json(report);
  } catch (error) {
    console.error("Erro ao salvar relatório trimestral:", error);
    res.status(500).json({ error: "Erro ao salvar relatório trimestral" });
  }
});

if (process.env.NODE_ENV !== "production") {
  const port = 5000;
  app.listen(port, () => {
    console.log(`api server running on port ${port}`);
  });
}

export default app;
