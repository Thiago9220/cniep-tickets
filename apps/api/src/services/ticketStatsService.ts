import prisma from "../lib/prisma";

// Mapeamento de tipos de ticket para categorias de causa raiz
const ROOT_CAUSE_MAPPING: Record<string, string> = {
  correcao_tecnica: "Software (Bug)",
  melhorias: "Software (Bug)",
  erro_temporario: "Infraestrutura",
  orientacao: "Usuário (Treinamento)",
  duvida_negocial: "Usuário (Treinamento)",
  outros: "Acesso/Permissão",
};

export class TicketStatsService {
  async getOverviewStats() {
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

    return {
      total,
      pendentes,
      abertos,
      fechados,
      taxaResolucao: total > 0 ? ((fechados / total) * 100).toFixed(1) : 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count.type])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count.priority])),
    };
  }

  async getMonthlyEvolution() {
    const tickets = await prisma.ticket.findMany({
      select: {
        registrationDate: true,
        status: true,
      },
      where: {
        registrationDate: { not: null },
      },
      orderBy: { registrationDate: "asc" },
    });

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

    return Object.entries(byMonth)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getCriticalTickets() {
    return prisma.ticket.findMany({
      where: {
        status: "pendente",
        priority: "alta",
      },
      orderBy: { registrationDate: "desc" },
    });
  }

  async getWeeklyStats(weekKey: string) {
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

    return {
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
    };
  }

  async getMonthStats(monthKey: string) {
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

    return {
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
    };
  }

  async getAvailablePeriods() {
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

    return {
      weeks: Array.from(weeks).sort().reverse(),
      months: Array.from(months).sort().reverse(),
    };
  }

  async getQuarterlyStats(quarterKey: string) {
    const match = quarterKey.match(/^(\d{4})-Q([1-4])$/);

    if (!match) {
      throw new Error("Formato inválido. Use YYYY-QX (ex: 2025-Q4)");
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

    return {
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
    };
  }

  async getAvailableQuarters() {
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

    return {
      quarters: Array.from(quarters).sort().reverse(),
    };
  }
}

export const ticketStatsService = new TicketStatsService();
