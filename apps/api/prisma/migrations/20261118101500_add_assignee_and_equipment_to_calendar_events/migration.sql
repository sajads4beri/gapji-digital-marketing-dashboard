-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "assigneeId" UUID;
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "equipmentStatus" "EquipmentReadinessStatus";
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "startTime" VARCHAR(10);
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "endTime" VARCHAR(10);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "calendar_events_organizationId_eventType_idx" ON "calendar_events"("organizationId", "eventType");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_assigneeId_fkey'
  ) THEN
    ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
