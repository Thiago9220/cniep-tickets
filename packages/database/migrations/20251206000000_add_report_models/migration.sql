-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" SERIAL NOT NULL,
    "weekKey" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" SERIAL NOT NULL,
    "monthKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterlyReport" (
    "id" SERIAL NOT NULL,
    "quarterKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_weekKey_key" ON "WeeklyReport"("weekKey");

-- CreateIndex
CREATE INDEX "WeeklyReport_weekKey_idx" ON "WeeklyReport"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_monthKey_key" ON "MonthlyReport"("monthKey");

-- CreateIndex
CREATE INDEX "MonthlyReport_monthKey_idx" ON "MonthlyReport"("monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyReport_quarterKey_key" ON "QuarterlyReport"("quarterKey");

-- CreateIndex
CREATE INDEX "QuarterlyReport_quarterKey_idx" ON "QuarterlyReport"("quarterKey");
