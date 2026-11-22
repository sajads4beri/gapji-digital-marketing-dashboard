-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'REVOKED', 'EXPIRED');

-- AlterTable
ALTER TABLE "sessions" 
  ADD COLUMN "isRevoked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedReason" VARCHAR(255),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: composite unique constraint on sessions for composite foreign key
CREATE UNIQUE INDEX "sessions_id_userId_key" ON "sessions"("id", "userId");

-- CreateIndex
CREATE INDEX "sessions_isRevoked_idx" ON "sessions"("isRevoked");

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "replacedByTokenId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_no_self_replace" CHECK ("replacedByTokenId" <> "id"),
    CONSTRAINT "chk_consumed_state" CHECK (("status" = 'CONSUMED' AND "replacedByTokenId" IS NOT NULL AND "consumedAt" IS NOT NULL) OR ("status" <> 'CONSUMED'))
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_replacedByTokenId_key" ON "refresh_tokens"("replacedByTokenId");

-- CreateIndex
CREATE INDEX "refresh_tokens_sessionId_idx" ON "refresh_tokens"("sessionId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_status_idx" ON "refresh_tokens"("userId", "status");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex: Engine-Level Invariant: At most one ACTIVE refresh token per session
CREATE UNIQUE INDEX "refresh_tokens_one_active_per_session_idx" ON "refresh_tokens" ("sessionId") WHERE ("status" = 'ACTIVE');

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_sessionId_userId_fkey" FOREIGN KEY ("sessionId", "userId") REFERENCES "sessions"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replacedByTokenId_fkey" FOREIGN KEY ("replacedByTokenId") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Pre-backfill data integrity validations (Strict Hex SHA-256, referential integrity, and uniqueness)
DO $$
DECLARE
  invalid_hash_count INTEGER;
  orphan_count INTEGER;
  duplicate_hash_count INTEGER;
BEGIN
  -- 1. Validate that all non-null tokenHash values match 64-character hexadecimal SHA-256 format
  SELECT COUNT(*) INTO invalid_hash_count
  FROM "sessions"
  WHERE "tokenHash" IS NOT NULL
    AND "tokenHash" !~ '^[0-9a-fA-F]{64}$';

  IF invalid_hash_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: % invalid tokenHash found in sessions table. Expected 64-character hexadecimal SHA-256 string.', invalid_hash_count;
  END IF;

  -- 2. Verify referential integrity with users table to prevent broken records
  SELECT COUNT(*) INTO orphan_count
  FROM "sessions" s
  LEFT JOIN "users" u ON s."userId" = u."id"
  WHERE s."tokenHash" IS NOT NULL AND u."id" IS NULL;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: % orphaned session records found without matching user.', orphan_count;
  END IF;

  -- 3. Verify uniqueness of non-null tokenHash values across sessions
  SELECT COUNT(*) INTO duplicate_hash_count
  FROM (
    SELECT "tokenHash"
    FROM "sessions"
    WHERE "tokenHash" IS NOT NULL
    GROUP BY "tokenHash"
    HAVING COUNT(*) > 1
  ) dups;

  IF duplicate_hash_count > 0 THEN
    RAISE EXCEPTION 'Backfill aborted: % duplicate tokenHash values found in sessions table.', duplicate_hash_count;
  END IF;
END $$;

-- Backfill existing session token hashes into refresh_tokens with verified status (DEC-AUTH-18)
INSERT INTO "refresh_tokens" ("id", "sessionId", "userId", "tokenHash", "status", "expiresAt", "createdAt", "revokedAt")
SELECT 
    gen_random_uuid(),
    s."id",
    s."userId",
    s."tokenHash",
    CASE 
      WHEN u."isActive" = false OR s."isRevoked" = true THEN 'REVOKED'::"TokenStatus"
      WHEN s."expiresAt" <= CURRENT_TIMESTAMP THEN 'EXPIRED'::"TokenStatus"
      ELSE 'ACTIVE'::"TokenStatus"
    END,
    s."expiresAt",
    s."createdAt",
    CASE 
      WHEN u."isActive" = false OR s."isRevoked" = true THEN COALESCE(s."revokedAt", CURRENT_TIMESTAMP)
      ELSE NULL
    END
FROM "sessions" s
JOIN "users" u ON s."userId" = u."id"
WHERE s."tokenHash" IS NOT NULL;

-- Drop legacy tokenHash column from sessions
ALTER TABLE "sessions" DROP COLUMN "tokenHash";
