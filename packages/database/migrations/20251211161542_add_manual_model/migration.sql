-- CreateTable
CREATE TABLE "Manual" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Manual_userId_idx" ON "Manual"("userId");

-- AddForeignKey
ALTER TABLE "Manual" ADD CONSTRAINT "Manual_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
