import prisma from "../lib/prisma";

export class ReminderService {
  async resetRecurringReminders(userId: number) {
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

  async listReminders(userId: number) {
    await this.resetRecurringReminders(userId);
    return prisma.reminder.findMany({
      where: { userId },
      orderBy: [
        { concluido: "asc" },
        { ordem: "asc" },
        { createdAt: "desc" },
      ],
    });
  }

  async createReminder(userId: number, data: any) {
    const { titulo, descricao, dataEntrega, recorrente, prioridade, categoria, ordem } = data;
    const parsedDue = dataEntrega ? new Date(String(dataEntrega).includes("T") ? dataEntrega : `${dataEntrega}T00:00:00`) : null;
    
    return prisma.reminder.create({
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
  }

  async updateReminder(id: string, userId: number, data: any) {
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return null;
    }

    const { titulo, descricao, dataEntrega, recorrente, prioridade, categoria, ordem, concluido } = data;
    const updateData: any = {};
    if (typeof titulo === "string") updateData.titulo = titulo;
    if (typeof descricao === "string") updateData.descricao = descricao;
    if (typeof prioridade === "string") updateData.prioridade = prioridade;
    if (typeof categoria === "string" || categoria === null) updateData.categoria = categoria ?? undefined;
    if (typeof ordem === "number" || ordem === null) updateData.ordem = ordem ?? undefined;
    if (typeof recorrente === "boolean") updateData.recorrente = recorrente;
    if (typeof concluido === "boolean") {
      updateData.concluido = concluido;
      if (concluido === true) {
        updateData.ultimaConclusao = new Date();
      }
    }
    if (dataEntrega !== undefined) {
      updateData.dataEntrega = dataEntrega ? new Date(String(dataEntrega).includes("T") ? dataEntrega : `${dataEntrega}T00:00:00`) : null;
    }

    return prisma.reminder.update({ where: { id }, data: updateData });
  }

  async deleteReminder(id: string, userId: number) {
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return null;
    }
    return prisma.reminder.delete({ where: { id } });
  }

  async reorderReminders(userId: number, updates: Array<{ id: string; ordem: number | null }>) {
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
    return prisma.$transaction(tx);
  }

  async getCounts(userId: number) {
    await this.resetRecurringReminders(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [pendentes, urgentes, atrasados] = await Promise.all([
      prisma.reminder.count({ where: { userId, concluido: false } }),
      prisma.reminder.count({ where: { userId, concluido: false, prioridade: "urgente" } }),
      prisma.reminder.count({ where: { userId, concluido: false, dataEntrega: { lt: today } } }),
    ]);
    return { pendentes, atrasados, urgentes };
  }
}

export const reminderService = new ReminderService();
