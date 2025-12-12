import prisma from "../lib/prisma";

export class WorkflowService {
  async listWorkflows(userId: number) {
    return prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getWorkflow(id: string, userId: number) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow || workflow.userId !== userId) {
      return null;
    }
    return workflow;
  }

  async createWorkflow(userId: number, data: any) {
    const { title, description, category, nodes, startNodeId } = data;
    return prisma.workflow.create({
      data: {
        userId,
        title,
        description: description || null,
        category: category || null,
        nodes: nodes || null,
        startNodeId: startNodeId || null,
      },
    });
  }

  async updateWorkflow(id: string, userId: number, data: any) {
    const existing = await this.getWorkflow(id, userId);
    if (!existing) return null;

    const { title, description, category, nodes, startNodeId } = data;

    return prisma.workflow.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? category : existing.category,
        nodes: nodes !== undefined ? nodes : existing.nodes,
        startNodeId: startNodeId !== undefined ? startNodeId : existing.startNodeId,
      },
    });
  }

  async deleteWorkflow(id: string, userId: number) {
    const existing = await this.getWorkflow(id, userId);
    if (!existing) return null;

    return prisma.workflow.delete({
      where: { id },
    });
  }
}

export const workflowService = new WorkflowService();
