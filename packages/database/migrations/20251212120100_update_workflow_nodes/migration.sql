-- Align Workflow model: remove old columns and add new ones
ALTER TABLE "Workflow" DROP COLUMN IF EXISTS "contacts";
ALTER TABLE "Workflow" DROP COLUMN IF EXISTS "links";
ALTER TABLE "Workflow" DROP COLUMN IF EXISTS "steps";

ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "nodes" JSONB;
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "startNodeId" TEXT;

