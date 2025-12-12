import prisma from "../lib/prisma";
import { processExcelBuffer } from "@cniep/shared/import-excel";

export class TicketService {
  async listTickets() {
    try {
      return await prisma.ticket.findMany({
        orderBy: [
          { stage: "asc" },
          // @ts-ignore
          { position: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          creator: { select: { id: true, name: true, avatar: true, email: true } },
          assignee: { select: { id: true, name: true, avatar: true, email: true } },
        },
      });
    } catch (err) {
      return prisma.ticket.findMany({
        orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
        include: {
          creator: { select: { id: true, name: true, avatar: true, email: true } },
          assignee: { select: { id: true, name: true, avatar: true, email: true } },
        },
      });
    }
  }

  async getTicketById(id: number) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatar: true, email: true } },
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
      },
    });
  }

  async createTicket(data: any, userId: number) {
    const { title, description, status, priority, type, url, ticketNumber, registrationDate, stage, assigneeId } = data;
    const stageValue = stage || "backlog";
    const maxPos = await prisma.ticket.aggregate({ _max: { position: true }, where: { stage: stageValue } });
    const nextPos = (maxPos._max.position ?? 0) + 1;
    
    // @ts-ignore
    return prisma.ticket.create({
      data: {
        title,
        description,
        status,
        priority,
        type,
        url,
        ticketNumber,
        registrationDate: registrationDate ? new Date(registrationDate) : null,
        stage: stageValue,
        position: nextPos,
        creatorId: userId,
        assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
      },
    });
  }

  async updateTicket(id: number, data: any) {
    const { title, description, status, priority, type, stage, url, ticketNumber, registrationDate, assigneeId } = data;
    return prisma.ticket.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        type,
        stage,
        url,
        ticketNumber,
        registrationDate: registrationDate ? new Date(registrationDate) : undefined,
        assigneeId: assigneeId !== undefined ? (assigneeId ? parseInt(assigneeId) : null) : undefined,
      },
    });
  }

  async deleteTicket(id: number) {
    return prisma.ticket.delete({ where: { id } });
  }

  async updateTicketStage(id: number, stage: string, userId: number | null) {
    const current = await prisma.ticket.findUnique({ where: { id } });
    
    try {
        const maxPos = await prisma.ticket.aggregate({
            // @ts-ignore
            _max: { position: true },
            where: { stage },
        });
        // @ts-ignore
        const nextPos = (maxPos._max.position ?? 0) + 1;
        // @ts-ignore
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { stage, position: nextPos },
        });

        await this.logActivity(ticket.id, userId, "move", `Movido de ${current?.stage || "?"} para ${stage}`, current?.stage || null, stage);
        return ticket;
    } catch (e) {
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { stage },
        });
        await this.logActivity(ticket.id, userId, "move", `Movido de ${current?.stage || "?"} para ${stage}`, current?.stage || null, stage);
        return ticket;
    }
  }

  async reorderTickets(stage: string, order: number[]) {
      const ops = order.map((id, idx) =>
        // @ts-ignore
        prisma.ticket.update({ where: { id }, data: { position: idx, stage } })
      );
      return prisma.$transaction(ops);
  }

  async importTicketsFromExcel(buffer: Buffer) {
      return processExcelBuffer(buffer, prisma);
  }

  async listComments(ticketId: number) {
    return prisma.ticketComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async addComment(ticketId: number, userId: number, content: string) {
    const created = await prisma.ticketComment.create({
      data: { ticketId, userId, content },
    });
    
    await this.logActivity(ticketId, userId, "comment", content.slice(0, 280));
    
    await this.handleAutoFollow(ticketId, userId, content);
    
    return created;
  }

  async listActivities(ticketId: number) {
    return prisma.ticketActivity.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        fromStage: true,
        toStage: true,
        message: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async toggleFollow(ticketId: number, userId: number) {
    const existing = await prisma.ticketFollower.findFirst({ where: { ticketId, userId } });
    if (existing) {
      await prisma.ticketFollower.delete({ where: { id: existing.id } });
      return { following: false };
    }
    await prisma.ticketFollower.create({ data: { ticketId, userId } });
    return { following: true };
  }

  async listFollowers(ticketId: number) {
    const followers = await prisma.ticketFollower.findMany({
      where: { ticketId },
      select: { user: { select: { id: true, name: true, email: true } }, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return followers.map((f) => ({ ...f.user, createdAt: f.createdAt }));
  }

  private async logActivity(ticketId: number, userId: number | null, type: string, message: string, fromStage: string | null = null, toStage: string | null = null) {
      try {
        await prisma.ticketActivity.create({
          data: {
            ticketId,
            userId,
            type,
            fromStage,
            toStage,
            message,
          },
        });
      } catch {}
  }

  private async handleAutoFollow(ticketId: number, authorId: number, content: string) {
      try {
        await prisma.ticketFollower.upsert({
            where: { ticketId_userId: { ticketId, userId: authorId } as any },
            update: {},
            create: { ticketId, userId: authorId },
        } as any);

        const emails = String(content)
            .match(/@[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)
            ?.map((s) => s.slice(1)) || [];
        
        if (emails.length > 0) {
            const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
            const tx = users.map((u) =>
            prisma.ticketFollower.upsert({
                where: { ticketId_userId: { ticketId, userId: u.id } as any },
                update: {},
                create: { ticketId, userId: u.id },
            } as any)
            );
            if (tx.length) await prisma.$transaction(tx);
        }
      } catch {}
  }
}

export const ticketService = new TicketService();