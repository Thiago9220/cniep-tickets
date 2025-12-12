-- Comments table
CREATE TABLE IF NOT EXISTS "TicketComment" (
  "id" SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");
CREATE INDEX IF NOT EXISTS "TicketComment_userId_idx" ON "TicketComment"("userId");

-- Activities table
CREATE TABLE IF NOT EXISTS "TicketActivity" (
  "id" SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL,
  "userId" INTEGER,
  "type" TEXT NOT NULL,
  "fromStage" TEXT,
  "toStage" TEXT,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TicketActivity_ticketId_idx" ON "TicketActivity"("ticketId");

-- Followers table
CREATE TABLE IF NOT EXISTS "TicketFollower" (
  "id" SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique follower per user/ticket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'TicketFollower_ticketId_userId_key'
  ) THEN
    CREATE UNIQUE INDEX "TicketFollower_ticketId_userId_key" ON "TicketFollower"("ticketId", "userId");
  END IF;
END $$;

