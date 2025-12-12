-- AlterTable: add position column for ordering inside a stage
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "position" INTEGER;

-- Create composite index to speed up queries by stage and position
CREATE INDEX IF NOT EXISTS "Ticket_stage_position_idx" ON "Ticket"("stage", "position");

