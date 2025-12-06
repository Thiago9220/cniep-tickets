import express from "express";
import prisma from "./db";

const app = express();

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

if (process.env.NODE_ENV !== "production") {
  const port = 5000;
  app.listen(port, () => {
    console.log(`api server running on port ${port}`);
  });
}

export default app;
