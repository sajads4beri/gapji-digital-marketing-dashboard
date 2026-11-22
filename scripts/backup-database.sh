#!/bin/sh
# ==============================================================================
# Gapji Platform - Automated Database Backup Script
# Creates a compressed PostgreSQL dump and enforces a 7-day retention policy
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/gapji_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

echo "[INFO] Starting database backup at $(date)..."
mkdir -p "${BACKUP_DIR}"

# Execute pg_dump with gzip compression
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER:-gapji_user}" \
  -d "${POSTGRES_DB:-gapji_marketing}" \
  --clean --if-exists --no-owner | gzip > "${BACKUP_FILE}"

echo "[SUCCESS] Backup created successfully: ${BACKUP_FILE} ($(du -sh "${BACKUP_FILE}" | cut -f1))"

# Clean up backups older than retention policy
echo "[INFO] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "gapji_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "[SUCCESS] Backup rotation complete."
