import cors from "cors";
import express from "express";
import multer from "multer";
import prisma from "./db";
import { processExcelBuffer } from "@cniep/shared/import-excel";

const app = express();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Log middleware para debug
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

router.get("/hello", (_req, res) => {
  res.json({ message: "API funcionando" });
});

// Importar Excel
router.post("/tickets/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const stats = await processExcelBuffer(req.file.buffer, prisma);
    res.json(stats);
  } catch (error: any) {
    console.error("Erro ao importar Excel:", error);
    res.status(500).json({ error: "Erro ao processar arquivo Excel: " + error.message });
  }
});

// Listar todos os tickets
router.get("/tickets", async (_req, res) => {
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
router.get("/tickets/:id", async (req, res) => {
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
router.post("/tickets", async (req, res) => {
  try {
    const { title, description, status, priority, type, url, ticketNumber, registrationDate } = req.body;
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        status,
        priority,
        type,
        url,
        ticketNumber,
        registrationDate: registrationDate ? new Date(registrationDate) : null
      },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar ticket" });
  }
});

// Atualizar um ticket
router.put("/tickets/:id", async (req, res) => {
  try {
    const { title, description, status, priority, type, url, ticketNumber, registrationDate } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        description,
        status,
        priority,
        type,
        url,
        ticketNumber,
        registrationDate: registrationDate ? new Date(registrationDate) : undefined
      },
    });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar ticket" });
  }
});

// Deletar um ticket
router.delete("/tickets/:id", async (req, res) => {
  try {
    await prisma.ticket.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar ticket" });
  }
});

// ============== MÉTRICAS/ESTATÍSTICAS ==============

// Estatísticas gerais dos tickets
router.get("/tickets/stats/overview", async (_req, res) => {
  try {
    const total = await prisma.ticket.count();
    const pendentes = await prisma.ticket.count({ where: { status: "pendente" } });
    const abertos = await prisma.ticket.count({ where: { status: "aberto" } });
    const fechados = await prisma.ticket.count({ where: { status: "fechado" } });

    const byStatus = await prisma.ticket.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const byType = await prisma.ticket.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    const byPriority = await prisma.ticket.groupBy({
      by: ["priority"],
      _count: { priority: true },
    });

    res.json({
      total,
      pendentes,
      abertos,
      fechados,
      taxaResolucao: total > 0 ? ((fechados / total) * 100).toFixed(1) : 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count.type])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count.priority])),
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

// Tickets por mês (para gráfico de evolução)
router.get("/tickets/stats/monthly", async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      select: {
        registrationDate: true,
        status: true,
        type: true,
        priority: true,
      },
      where: {
        registrationDate: { not: null },
      },
      orderBy: { registrationDate: "asc" },
    });

    // Agrupar por mês
    const byMonth: Record<string, { total: number; fechados: number; pendentes: number }> = {};

    tickets.forEach((ticket) => {
      if (ticket.registrationDate) {
        const monthKey = ticket.registrationDate.toISOString().slice(0, 7); // YYYY-MM
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = { total: 0, fechados: 0, pendentes: 0 };
        }
        byMonth[monthKey].total++;
        if (ticket.status === "fechado") byMonth[monthKey].fechados++;
        if (ticket.status === "pendente") byMonth[monthKey].pendentes++;
      }
    });

    const monthlyData = Object.entries(byMonth)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json(monthlyData);
  } catch (error) {
    console.error("Erro ao buscar estatísticas mensais:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas mensais" });
  }
});

// Tickets pendentes de alta prioridade
router.get("/tickets/stats/critical", async (_req, res) => {
  try {
    const criticalTickets = await prisma.ticket.findMany({
      where: {
        status: "pendente",
        priority: "alta",
      },
      orderBy: { registrationDate: "desc" },
    });

    res.json(criticalTickets);
  } catch (error) {
    console.error("Erro ao buscar tickets críticos:", error);
    res.status(500).json({ error: "Erro ao buscar tickets críticos" });
  }
});

// Estatísticas de uma semana específica (YYYY-WXX)
router.get("/tickets/stats/weekly/:weekKey", async (req, res) => {
  try {
    const { weekKey } = req.params;
    const [year, weekStr] = weekKey.split("-W");
    const weekNum = parseInt(weekStr);

    // Calcular início e fim da semana
    const startOfYear = new Date(parseInt(year), 0, 1);
    const daysToAdd = (weekNum - 1) * 7 - startOfYear.getDay() + 1;
    const weekStart = new Date(parseInt(year), 0, 1 + daysToAdd);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const tickets = await prisma.ticket.findMany({
      where: {
        registrationDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: { registrationDate: "asc" },
    });

    // Calcular métricas
    const total = tickets.length;
    const fechados = tickets.filter((t) => t.status === "fechado").length;
    const pendentes = tickets.filter((t) => t.status === "pendente").length;
    const abertos = tickets.filter((t) => t.status === "aberto").length;

    // Por prioridade
    const byPriority = {
      alta: tickets.filter((t) => t.priority === "alta").length,
      media: tickets.filter((t) => t.priority === "media").length,
      baixa: tickets.filter((t) => t.priority === "baixa").length,
    };

    // Por tipo
    const byType: Record<string, number> = {};
    tickets.forEach((t) => {
      byType[t.type] = (byType[t.type] || 0) + 1;
    });

    // Por dia da semana
    const byDay: Record<string, { abertos: number; fechados: number }> = {};
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    tickets.forEach((t) => {
      if (t.registrationDate) {
        const dayName = dayNames[t.registrationDate.getDay()];
        if (!byDay[dayName]) byDay[dayName] = { abertos: 0, fechados: 0 };
        byDay[dayName].abertos++;
        if (t.status === "fechado") byDay[dayName].fechados++;
      }
    });

    // Tickets críticos pendentes
    const criticalPending = tickets.filter(
      (t) => t.status === "pendente" && t.priority === "alta"
    );

    // Top tipos (mais frequentes)
    const topTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    res.json({
      weekKey,
      period: `${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}`,
      summary: {
        total,
        fechados,
        pendentes,
        abertos,
        taxaResolucao: total > 0 ? ((fechados / total) * 100).toFixed(1) : "0",
        criticalCount: criticalPending.length,
      },
      byPriority,
      byType,
      byDay: dayNames.slice(1, 6).map((day) => ({
        day,
        abertos: byDay[day]?.abertos || 0,
        fechados: byDay[day]?.fechados || 0,
      })),
      topTypes,
      criticalPending,
      tickets,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas semanais:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas semanais" });
  }
});

// Estatísticas de um mês específico (YYYY-MM)
router.get("/tickets/stats/month/:monthKey", async (req, res) => {
  try {
    const { monthKey } = req.params;
    const [year, month] = monthKey.split("-").map(Number);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const tickets = await prisma.ticket.findMany({
      where: {
        registrationDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: { registrationDate: "asc" },
    });

    // Calcular métricas
    const total = tickets.length;
    const fechados = tickets.filter((t) => t.status === "fechado").length;
    const pendentes = tickets.filter((t) => t.status === "pendente").length;

    // Por prioridade
    const byPriority = {
      alta: tickets.filter((t) => t.priority === "alta").length,
      media: tickets.filter((t) => t.priority === "media").length,
      baixa: tickets.filter((t) => t.priority === "baixa").length,
    };

    // Por tipo
    const byType: Record<string, number> = {};
    tickets.forEach((t) => {
      byType[t.type] = (byType[t.type] || 0) + 1;
    });

    // Por semana do mês
    const byWeek: Record<string, { total: number; fechados: number; pendentes: number }> = {};
    tickets.forEach((t) => {
      if (t.registrationDate) {
        const weekOfMonth = Math.ceil(t.registrationDate.getDate() / 7);
        const weekLabel = `Semana ${weekOfMonth}`;
        if (!byWeek[weekLabel]) byWeek[weekLabel] = { total: 0, fechados: 0, pendentes: 0 };
        byWeek[weekLabel].total++;
        if (t.status === "fechado") byWeek[weekLabel].fechados++;
        if (t.status === "pendente") byWeek[weekLabel].pendentes++;
      }
    });

    // Tickets críticos pendentes
    const criticalPending = tickets.filter(
      (t) => t.status === "pendente" && t.priority === "alta"
    );

    // Top tipos
    const topTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Buscar mês anterior para comparação
    const prevMonthStart = new Date(year, month - 2, 1);
    const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
    const prevMonthTickets = await prisma.ticket.count({
      where: {
        registrationDate: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
    });

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    res.json({
      monthKey,
      monthName: `${monthNames[month - 1]} ${year}`,
      period: `${monthStart.toLocaleDateString("pt-BR")} a ${monthEnd.toLocaleDateString("pt-BR")}`,
      summary: {
        total,
        fechados,
        pendentes,
        taxaResolucao: total > 0 ? ((fechados / total) * 100).toFixed(1) : "0",
        criticalCount: criticalPending.length,
        variacao: prevMonthTickets > 0
          ? (((total - prevMonthTickets) / prevMonthTickets) * 100).toFixed(1)
          : "0",
      },
      byPriority,
      byType,
      byWeek: Object.entries(byWeek).map(([week, data]) => ({
        week,
        ...data,
      })),
      topTypes,
      criticalPending,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas mensais:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas mensais" });
  }
});

// Listar semanas e meses disponíveis
router.get("/tickets/stats/available-periods", async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      select: { registrationDate: true },
      where: { registrationDate: { not: null } },
      orderBy: { registrationDate: "desc" },
    });

    const weeks = new Set<string>();
    const months = new Set<string>();

    tickets.forEach((t) => {
      if (t.registrationDate) {
        // Mês
        const monthKey = t.registrationDate.toISOString().slice(0, 7);
        months.add(monthKey);

        // Semana
        const startOfYear = new Date(t.registrationDate.getFullYear(), 0, 1);
        const days = Math.floor(
          (t.registrationDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
        );
        const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        weeks.add(`${t.registrationDate.getFullYear()}-W${String(weekNum).padStart(2, "0")}`);
      }
    });

    res.json({
      weeks: Array.from(weeks).sort().reverse(),
      months: Array.from(months).sort().reverse(),
    });
  } catch (error) {
    console.error("Erro ao buscar períodos disponíveis:", error);
    res.status(500).json({ error: "Erro ao buscar períodos disponíveis" });
  }
});

// ============== RELATÓRIOS SEMANAIS ==============

// Listar todos os relatórios semanais
router.get("/reports/weekly", async (_req, res) => {
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
router.get("/reports/weekly/:weekKey", async (req, res) => {
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
router.post("/reports/weekly", async (req, res) => {
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
router.delete("/reports/weekly/:weekKey", async (req, res) => {
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
router.get("/reports/monthly", async (_req, res) => {
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
router.post("/reports/monthly", async (req, res) => {
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
router.get("/reports/quarterly", async (_req, res) => {
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
router.post("/reports/quarterly", async (req, res) => {
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

// Mount router on /api AND / to handle Vercel rewrites or direct access
app.use("/api", router);
app.use("/", router);

if (process.env.NODE_ENV !== "production") {
  const port = 5000;
  app.listen(port, () => {
    console.log(`api server running on port ${port}`);
  });
}

export default app;
