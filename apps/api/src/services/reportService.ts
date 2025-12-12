import prisma from "../lib/prisma";

export class ReportService {
  // Weekly
  async listWeeklyReports() {
    return prisma.weeklyReport.findMany({
      orderBy: { weekKey: "desc" },
    });
  }

  async getWeeklyReport(weekKey: string) {
    return prisma.weeklyReport.findUnique({
      where: { weekKey },
    });
  }

  async upsertWeeklyReport(data: { weekKey: string; period: string; data: any }) {
    return prisma.weeklyReport.upsert({
      where: { weekKey: data.weekKey },
      update: { period: data.period, data: data.data },
      create: { weekKey: data.weekKey, period: data.period, data: data.data },
    });
  }

  async deleteWeeklyReport(weekKey: string) {
    return prisma.weeklyReport.delete({
      where: { weekKey },
    });
  }

  // Monthly
  async listMonthlyReports() {
    return prisma.monthlyReport.findMany({
      orderBy: { monthKey: "desc" },
    });
  }

  async upsertMonthlyReport(data: { monthKey: string; data: any }) {
    return prisma.monthlyReport.upsert({
      where: { monthKey: data.monthKey },
      update: { data: data.data },
      create: { monthKey: data.monthKey, data: data.data },
    });
  }

  // Quarterly
  async listQuarterlyReports() {
    return prisma.quarterlyReport.findMany({
      orderBy: { quarterKey: "desc" },
    });
  }

  async upsertQuarterlyReport(data: { quarterKey: string; data: any }) {
    return prisma.quarterlyReport.upsert({
      where: { quarterKey: data.quarterKey },
      update: { data: data.data },
      create: { quarterKey: data.quarterKey, data: data.data },
    });
  }
}

export const reportService = new ReportService();
