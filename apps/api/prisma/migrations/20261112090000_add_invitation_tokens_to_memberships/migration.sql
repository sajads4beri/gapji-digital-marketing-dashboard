-- AlterTable
ALTER TABLE "organization_memberships" 
  ADD COLUMN "invitationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "invitationTokenHash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_invitationTokenHash_key" ON "organization_memberships"("invitationTokenHash");
