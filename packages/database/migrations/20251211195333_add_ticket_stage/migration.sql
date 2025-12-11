-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "stage" TEXT NOT NULL DEFAULT 'backlog';

-- CreateIndex
CREATE INDEX "Ticket_stage_idx" ON "Ticket"("stage");
