-- Migration: 20261112133000_lead_status_config_restrict_delete
-- Purpose: Prevent cascade deletion of Leads when LeadStatusConfig is deleted (P0 Referential Integrity)
-- Drop the existing CASCADE foreign key constraint
ALTER TABLE "leads" DROP CONSTRAINT "leads_statusConfigId_organizationId_fkey";

-- Re-create the foreign key constraint with ON DELETE RESTRICT and ON UPDATE CASCADE
ALTER TABLE "leads" ADD CONSTRAINT "leads_statusConfigId_organizationId_fkey" 
  FOREIGN KEY ("statusConfigId", "organizationId") 
  REFERENCES "lead_status_configs"("id", "organizationId") 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;
