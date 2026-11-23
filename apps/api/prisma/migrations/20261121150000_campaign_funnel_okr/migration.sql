-- CreateTable
CREATE TABLE IF NOT EXISTS "campaign_funnel_objectives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "stageKey" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_funnel_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "campaign_funnel_key_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "objectiveId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "currentValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "targetValue" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "unit" VARCHAR(50) NOT NULL DEFAULT 'عدد',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_funnel_key_results_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "okrKeyResultId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_funnel_objectives_id_organizationId_key" ON "campaign_funnel_objectives"("id", "organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_funnel_objectives_campaignId_stageKey_organizationId_key" ON "campaign_funnel_objectives"("campaignId", "stageKey", "organizationId");
CREATE INDEX IF NOT EXISTS "campaign_funnel_objectives_organizationId_idx" ON "campaign_funnel_objectives"("organizationId");
CREATE INDEX IF NOT EXISTS "campaign_funnel_objectives_campaignId_idx" ON "campaign_funnel_objectives"("campaignId");
CREATE INDEX IF NOT EXISTS "campaign_funnel_objectives_campaignId_stageKey_idx" ON "campaign_funnel_objectives"("campaignId", "stageKey");

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_funnel_key_results_id_organizationId_key" ON "campaign_funnel_key_results"("id", "organizationId");
CREATE INDEX IF NOT EXISTS "campaign_funnel_key_results_organizationId_idx" ON "campaign_funnel_key_results"("organizationId");
CREATE INDEX IF NOT EXISTS "campaign_funnel_key_results_objectiveId_idx" ON "campaign_funnel_key_results"("objectiveId");

CREATE INDEX IF NOT EXISTS "tasks_okrKeyResultId_idx" ON "tasks"("okrKeyResultId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaign_funnel_objectives_organizationId_fkey'
  ) THEN
    ALTER TABLE "campaign_funnel_objectives" ADD CONSTRAINT "campaign_funnel_objectives_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaign_funnel_objectives_campaignId_organizationId_fkey'
  ) THEN
    ALTER TABLE "campaign_funnel_objectives" ADD CONSTRAINT "campaign_funnel_objectives_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaign_funnel_key_results_organizationId_fkey'
  ) THEN
    ALTER TABLE "campaign_funnel_key_results" ADD CONSTRAINT "campaign_funnel_key_results_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaign_funnel_key_results_objectiveId_organizationId_fkey'
  ) THEN
    ALTER TABLE "campaign_funnel_key_results" ADD CONSTRAINT "campaign_funnel_key_results_objectiveId_organizationId_fkey" FOREIGN KEY ("objectiveId", "organizationId") REFERENCES "campaign_funnel_objectives"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_okrKeyResultId_fkey'
  ) THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_okrKeyResultId_fkey" FOREIGN KEY ("okrKeyResultId") REFERENCES "campaign_funnel_key_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
