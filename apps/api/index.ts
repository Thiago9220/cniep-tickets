import cors from "cors";
import express from "express";
import multer from "multer";
import prisma from "./db";
import { processExcelBuffer } from "@cniep/shared/import-excel";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRouter, { authMiddleware, adminMiddleware } from "./auth";
import {
  helmetMiddleware,
  getCorsConfig,
  requestIdMiddleware,
  loggingMiddleware,
  generalRateLimiter,
  uploadRateLimiter,
  createLogger,
  DOCUMENT_UPLOAD_CONFIG,
  documentFileFilter,
  scanFileWithClamAV,
} from "./security";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Allow configuring uploads directory via env var
const DEFAULT_UPLOADS_DIR = path.join(__dirname, "uploads");
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : DEFAULT_UPLOADS_DIR;

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)){
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (_req, file, cb) {
    // Save with timestamp to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const uploadDocs = multer({
  storage: storage,
  limits: { fileSize: DOCUMENT_UPLOAD_CONFIG.maxSize },
  fileFilter: documentFileFilter,
});

// Security middlewares
app.use(requestIdMiddleware);
app.use(helmetMiddleware);
app.use(cors(getCorsConfig()));
app.use(express.json());
app.use(generalRateLimiter);
app.use(loggingMiddleware);

router.get("/hello", (_req, res) => {
  res.json({ message: "API funcionando" });
});

// ============== DOCUMENTOS ==============

// Upload de documento
router.post("/documents", authMiddleware, uploadRateLimiter, uploadDocs.single("file"), async (req, res) => {
  const logger = createLogger(req);
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { originalname, filename, size, mimetype } = req.file;

    // Optional ClamAV scan in production
    const filePath = path.join(UPLOADS_DIR, filename);
    const scanResult = await scanFileWithClamAV(filePath);
    if (!scanResult.clean) {
      // Delete infected file
      fs.unlinkSync(filePath);
      logger.warn("Arquivo infectado detectado", { filename, scanResult: scanResult.message });
      return res.status(400).json({ error: "Arquivo rejeitado por motivos de segurança" });
    }

    const document = await prisma.document.create({
      data: {
        userId: userId,
        title: originalname,
        filename: filename,
        fileType: mimetype,
        size: size,
        url: `/api/documents/download/${filename}`
      }
    });

    logger.info("Documento criado", { documentId: document.id, filename, size });
    res.status(201).json(document);
  } catch (error) {
    logger.error("Erro ao fazer upload de documento", error);
    res.status(500).json({ error: "Erro ao salvar documento" });
  }
});

// Listar documentos do usuário
router.get("/documents", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const documents = await prisma.document.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(documents);
  } catch (error) {
    console.error("Erro ao listar documentos:", error);
    res.status(500).json({ error: "Erro ao listar documentos" });
  }
});

// Download de documento
router.get("/documents/:id/download", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const document = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!document) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }

    // Verificar se o documento pertence ao usuário
    if (document.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const filePath = path.join(UPLOADS_DIR, document.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo físico não encontrado" });
    }

    res.download(filePath, document.title);
  } catch (error) {
    console.error("Erro ao baixar documento:", error);
    res.status(500).json({ error: "Erro ao baixar documento" });
  }
});

// Deletar documento
router.delete("/documents/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const document = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!document) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }

    // Verificar se o documento pertence ao usuário
    if (document.userId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Delete DB record
    await prisma.document.delete({
      where: { id: parseInt(req.params.id) }
    });

    // Delete physical file
    const filePath = path.join(UPLOADS_DIR, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar documento:", error);
    res.status(500).json({ error: "Erro ao deletar documento" });
  }
});

// Importar Excel (apenas admin)
router.post("/tickets/import", adminMiddleware, upload.single("file"), async (req, res) => {
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

// Criar um novo ticket (apenas admin)
router.post("/tickets", adminMiddleware, async (req, res) => {
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

// Atualizar um ticket (apenas admin)
router.put("/tickets/:id", adminMiddleware, async (req, res) => {
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

// Deletar um ticket (apenas admin)
router.delete("/tickets/:id", adminMiddleware, async (req, res) => {
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

// ============== ESTATÍSTICAS TRIMESTRAIS ==============

// Mapeamento de tipos de ticket para categorias de causa raiz
const ROOT_CAUSE_MAPPING: Record<string, string> = {
  correcao_tecnica: "Software (Bug)",
  melhorias: "Software (Bug)",
  erro_temporario: "Infraestrutura",
  orientacao: "Usuário (Treinamento)",
  duvida_negocial: "Usuário (Treinamento)",
  outros: "Acesso/Permissão",
};

// Estatísticas de um trimestre específico (YYYY-QX)
router.get("/tickets/stats/quarterly/:quarterKey", async (req, res) => {
  try {
    const { quarterKey } = req.params;
    const match = quarterKey.match(/^(\d{4})-Q([1-4])$/);

    if (!match) {
      return res.status(400).json({ error: "Formato inválido. Use YYYY-QX (ex: 2025-Q4)" });
    }

    const year = parseInt(match[1]);
    const quarter = parseInt(match[2]);

    // Calcular início e fim do trimestre
    const quarterStartMonth = (quarter - 1) * 3;
    const quarterStart = new Date(year, quarterStartMonth, 1);
    const quarterEnd = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999);

    const tickets = await prisma.ticket.findMany({
      where: {
        registrationDate: {
          gte: quarterStart,
          lte: quarterEnd,
        },
      },
    });

    // Calcular métricas gerais
    const total = tickets.length;
    const fechados = tickets.filter((t) => t.status === "fechado").length;
    const pendentes = tickets.filter((t) => t.status === "pendente").length;

    // Agrupar por tipo
    const byType: Record<string, number> = {};
    tickets.forEach((t) => {
      byType[t.type] = (byType[t.type] || 0) + 1;
    });

    // Calcular causa raiz baseado no mapeamento
    const rootCauseCounts: Record<string, number> = {};
    tickets.forEach((t) => {
      const rootCause = ROOT_CAUSE_MAPPING[t.type] || "Outros";
      rootCauseCounts[rootCause] = (rootCauseCounts[rootCause] || 0) + 1;
    });

    // Converter para percentuais
    const rootCause = Object.entries(rootCauseCounts)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count,
      }))
      .sort((a, b) => b.value - a.value);

    // Garantir que a soma seja 100%
    if (rootCause.length > 0 && total > 0) {
      const sumPercent = rootCause.reduce((sum, item) => sum + item.value, 0);
      if (sumPercent !== 100) {
        rootCause[0].value += 100 - sumPercent;
      }
    }

    // Buscar trimestre anterior para comparação
    const prevQuarterStart = new Date(year, quarterStartMonth - 3, 1);
    const prevQuarterEnd = new Date(year, quarterStartMonth, 0, 23, 59, 59, 999);
    const prevQuarterTickets = await prisma.ticket.count({
      where: {
        registrationDate: {
          gte: prevQuarterStart,
          lte: prevQuarterEnd,
        },
      },
    });

    // Determinar a principal causa raiz para análise textual
    const topCause = rootCause[0];
    let analysisText = "";
    if (topCause) {
      if (topCause.name === "Software (Bug)") {
        analysisText = `A maior parte dos incidentes (${topCause.value}%) é causada por bugs de software, justificando o foco da equipe de desenvolvimento em correções de estabilidade no próximo ciclo.`;
      } else if (topCause.name === "Infraestrutura") {
        analysisText = `Problemas de infraestrutura representam ${topCause.value}% dos incidentes, indicando necessidade de investimento em estabilidade do ambiente.`;
      } else if (topCause.name === "Usuário (Treinamento)") {
        analysisText = `${topCause.value}% dos chamados são relacionados a dúvidas e orientações, sugerindo oportunidade de investir em treinamento e documentação.`;
      } else {
        analysisText = `${topCause.name} representa ${topCause.value}% dos incidentes no trimestre.`;
      }
    }

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const periodLabel = `Q${quarter} ${year} (${monthNames[quarterStartMonth]}-${monthNames[quarterStartMonth + 2]})`;

    res.json({
      quarterKey,
      period: periodLabel,
      periodDates: `${quarterStart.toLocaleDateString("pt-BR")} a ${quarterEnd.toLocaleDateString("pt-BR")}`,
      summary: {
        total,
        fechados,
        pendentes,
        taxaResolucao: total > 0 ? ((fechados / total) * 100).toFixed(1) : "0",
        variacao: prevQuarterTickets > 0
          ? (((total - prevQuarterTickets) / prevQuarterTickets) * 100).toFixed(1)
          : "0",
      },
      byType,
      rootCause,
      analysis: analysisText,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas trimestrais:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas trimestrais" });
  }
});

// Listar trimestres disponíveis
router.get("/tickets/stats/available-quarters", async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      select: { registrationDate: true },
      where: { registrationDate: { not: null } },
      orderBy: { registrationDate: "desc" },
    });

    const quarters = new Set<string>();

    tickets.forEach((t) => {
      if (t.registrationDate) {
        const year = t.registrationDate.getFullYear();
        const quarter = Math.ceil((t.registrationDate.getMonth() + 1) / 3);
        quarters.add(`${year}-Q${quarter}`);
      }
    });

    res.json({
      quarters: Array.from(quarters).sort().reverse(),
    });
  } catch (error) {
    console.error("Erro ao buscar trimestres disponíveis:", error);
    res.status(500).json({ error: "Erro ao buscar trimestres disponíveis" });
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


// Avatar upload route
const avatarStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const avatarsDir = path.join(UPLOADS_DIR, "avatars");
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    cb(null, avatarsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP."));
    }
  },
});

router.post("/auth/avatar/upload", authMiddleware, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user avatar in database
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Erro ao fazer upload do avatar:", error);
    res.status(500).json({ error: "Erro ao salvar avatar" });
  }
});

// Auth routes (public) - rate limited for login
app.use("/api/auth", authRouter);
app.use("/auth", authRouter);

// Serve uploaded avatars (static files - public but helmet protected)
app.use("/uploads", express.static(UPLOADS_DIR));

// Mount router on /api AND / with authMiddleware for protected routes by default
app.use("/api", authMiddleware, router);
app.use("/", authMiddleware, router);

// ============== LEMBRETES (Reminders) ==============

// Helper: reset recurring reminders concluded in previous days
async function resetRecurringReminders(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    await prisma.reminder.updateMany({
      where: {
        userId,
        recorrente: true,
        concluido: true,
        ultimaConclusao: { lt: today },
      },
      data: { concluido: false },
    });
  } catch (e) {
    console.warn("Falha ao resetar lembretes recorrentes:", e);
  }
}

// Listar lembretes do usuário
router.get("/reminders", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    await resetRecurringReminders(userId);
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: [
        { concluido: "asc" },
        { ordem: "asc" },
        { createdAt: "desc" },
      ],
    });
    res.json(reminders);
  } catch (error) {
    console.error("Erro ao listar lembretes:", error);
    res.status(500).json({ error: "Erro ao listar lembretes" });
  }
});

// Criar lembrete
router.post("/reminders", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { titulo, descricao, dataEntrega, recorrente, prioridade, categoria, ordem } = req.body || {};
    if (!titulo || typeof titulo !== "string") {
      return res.status(400).json({ error: "Título é obrigatório" });
    }
    const parsedDue = dataEntrega ? new Date(String(dataEntrega).includes("T") ? dataEntrega : `${dataEntrega}T00:00:00`) : null;
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        titulo,
        descricao: descricao || "",
        dataEntrega: parsedDue || undefined,
        recorrente: !!recorrente,
        prioridade: prioridade || "media",
        categoria: categoria || undefined,
        ordem: typeof ordem === "number" ? ordem : undefined,
      },
    });
    res.status(201).json(reminder);
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);
    res.status(500).json({ error: "Erro ao criar lembrete" });
  }
});

// Atualizar lembrete
router.put("/reminders/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Lembrete não encontrado" });
    }

    const { titulo, descricao, dataEntrega, recorrente, prioridade, categoria, ordem, concluido } = req.body || {};
    const data: any = {};
    if (typeof titulo === "string") data.titulo = titulo;
    if (typeof descricao === "string") data.descricao = descricao;
    if (typeof prioridade === "string") data.prioridade = prioridade;
    if (typeof categoria === "string" || categoria === null) data.categoria = categoria ?? undefined;
    if (typeof ordem === "number" || ordem === null) data.ordem = ordem ?? undefined;
    if (typeof recorrente === "boolean") data.recorrente = recorrente;
    if (typeof concluido === "boolean") {
      data.concluido = concluido;
      if (concluido === true) {
        data.ultimaConclusao = new Date();
      }
    }
    if (dataEntrega !== undefined) {
      data.dataEntrega = dataEntrega ? new Date(String(dataEntrega).includes("T") ? dataEntrega : `${dataEntrega}T00:00:00`) : null;
    }

    const updated = await prisma.reminder.update({ where: { id }, data });
    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar lembrete:", error);
    res.status(500).json({ error: "Erro ao atualizar lembrete" });
  }
});

// Deletar lembrete
router.delete("/reminders/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Lembrete não encontrado" });
    }
    await prisma.reminder.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar lembrete:", error);
    res.status(500).json({ error: "Erro ao deletar lembrete" });
  }
});

// Atualização em lote de ordem
router.post("/reminders/reorder", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const updates: Array<{ id: string; ordem: number | null }> = req.body?.updates || [];
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Formato inválido: updates" });
    }
    const ids = updates.map((u) => u.id);
    const owned = await prisma.reminder.findMany({ where: { id: { in: ids }, userId } });
    const ownedIds = new Set(owned.map((r) => r.id));
    const tx = updates
      .filter((u) => ownedIds.has(u.id))
      .map((u) =>
        prisma.reminder.update({
          where: { id: u.id },
          data: { ordem: u.ordem ?? undefined },
        })
      );
    await prisma.$transaction(tx);
    res.json({ updated: tx.length });
  } catch (error) {
    console.error("Erro ao reordenar lembretes:", error);
    res.status(500).json({ error: "Erro ao reordenar lembretes" });
  }
});

// Contadores
router.get("/reminders/counts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    await resetRecurringReminders(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [pendentes, urgentes, atrasados] = await Promise.all([
      prisma.reminder.count({ where: { userId, concluido: false } }),
      prisma.reminder.count({ where: { userId, concluido: false, prioridade: "urgente" } }),
      prisma.reminder.count({ where: { userId, concluido: false, dataEntrega: { lt: today } } }),
    ]);
    res.json({ pendentes, atrasados, urgentes });
  } catch (error) {
    console.error("Erro ao calcular contadores de lembretes:", error);
    res.status(500).json({ error: "Erro ao calcular contadores" });
  }
});

// Ensure multer and other errors return JSON consistently
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Arquivo muito grande. Tamanho máximo: 5MB" });
    }
    const message = typeof err.message === "string" ? err.message : "Erro no upload";
    if (message.includes("Tipo de arquivo") || message.toLowerCase().includes("tipo de arquivo")) {
      return res.status(415).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
  return res.status(500).json({ error: "Erro interno do servidor" });
});

if (process.env.NODE_ENV !== "production") {
  const port = 5000;
  app.listen(port, () => {
    console.log(`api server running on port ${port}`);
  });
}

export default app;
