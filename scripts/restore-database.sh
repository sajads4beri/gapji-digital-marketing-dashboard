#!/bin/sh
# ==============================================================================
# Gapji Platform - Disaster Recovery Database Restore Script
# Restores a compressed PostgreSQL dump into target database
# ==============================================================================

set -e

BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Usage: $0 <path-to-gapji_backup.sql.gz>"
  exit 1
fi

echo "[WARNING] You are about to restore: ${BACKUP_FILE}"
echo "[WARNING] This will overwrite current database state. Proceeding in 5 seconds..."
sleep 5

echo "[INFO] Restoring database from ${BACKUP_FILE}..."

gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER:-gapji_user}" \
  -d "${POSTGRES_DB:-gapji_marketing}"

echo "[SUCCESS] Database restored successfully at $(date)."
