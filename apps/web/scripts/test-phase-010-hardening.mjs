import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-010 Production Hardening & CI/CD Verification Suite ---');

// Test 1: API Multi-Stage Dockerfile Verification
console.log('1. Testing API Multi-Stage Dockerfile...');
const apiDockerPath = path.resolve('apps/api/Dockerfile');
assert.ok(fs.existsSync(apiDockerPath), 'apps/api/Dockerfile must exist');

const apiDockerContent = fs.readFileSync(apiDockerPath, 'utf8');
assert.ok(apiDockerContent.includes('FROM node:20-alpine AS deps'), 'Must define deps stage');
assert.ok(apiDockerContent.includes('FROM node:20-alpine AS builder'), 'Must define builder stage');
assert.ok(apiDockerContent.includes('FROM node:20-alpine AS runner'), 'Must define runner stage');
assert.ok(apiDockerContent.includes('USER node'), 'Must enforce non-root user execution');
assert.ok(apiDockerContent.includes('HEALTHCHECK'), 'Must define container healthcheck');
console.log('  [PASS] API multi-stage Dockerfile verified');

// Test 2: Web Multi-Stage Dockerfile Verification
console.log('2. Testing Web Multi-Stage Dockerfile...');
const webDockerPath = path.resolve('apps/web/Dockerfile');
assert.ok(fs.existsSync(webDockerPath), 'apps/web/Dockerfile must exist');

const webDockerContent = fs.readFileSync(webDockerPath, 'utf8');
assert.ok(webDockerContent.includes('FROM node:20-alpine AS deps'), 'Must define deps stage');
assert.ok(webDockerContent.includes('FROM node:20-alpine AS builder'), 'Must define builder stage');
assert.ok(webDockerContent.includes('FROM node:20-alpine AS runner'), 'Must define runner stage');
assert.ok(webDockerContent.includes('USER nextjs'), 'Must enforce non-root user execution');
console.log('  [PASS] Web multi-stage Dockerfile verified');

// Test 3: Production Docker Compose Verification
console.log('3. Testing Production Docker Compose Configuration...');
const composeProdPath = path.resolve('docker-compose.prod.yml');
assert.ok(fs.existsSync(composeProdPath), 'docker-compose.prod.yml must exist');

const composeProdContent = fs.readFileSync(composeProdPath, 'utf8');
assert.ok(composeProdContent.includes('container_name: gapji-prod-postgres'), 'Must define production postgres');
assert.ok(composeProdContent.includes('container_name: gapji-prod-api'), 'Must define production api service');
assert.ok(composeProdContent.includes('container_name: gapji-prod-web'), 'Must define production web service');
assert.ok(composeProdContent.includes('gapji-internal'), 'Must define isolated internal network');
console.log('  [PASS] Production Docker Compose configuration verified');

// Test 4: GitHub Actions CI/CD Workflow Verification
console.log('4. Testing GitHub Actions CI/CD Workflow...');
const ciWorkflowPath = path.resolve('.github/workflows/ci.yml');
assert.ok(fs.existsSync(ciWorkflowPath), '.github/workflows/ci.yml must exist');

const ciWorkflowContent = fs.readFileSync(ciWorkflowPath, 'utf8');
assert.ok(ciWorkflowContent.includes('actions/checkout@v4'), 'Must checkout code');
assert.ok(ciWorkflowContent.includes('test-phase-001'), 'Must test Phase 1');
assert.ok(ciWorkflowContent.includes('test-phase-009'), 'Must test Phase 9');
assert.ok(ciWorkflowContent.includes('@gapji/api build'), 'Must validate API build');
assert.ok(ciWorkflowContent.includes('@gapji/web build'), 'Must validate Web build');
console.log('  [PASS] GitHub Actions CI/CD workflow verified');

// Test 5: Backend Health Endpoint Registration
console.log('5. Testing Backend HealthModule Registration in AppModule...');
const appModulePath = path.resolve('apps/api/src/app.module.ts');
const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

assert.ok(
  appModuleContent.includes('HealthModule'),
  'HealthModule must be registered in AppModule'
);

const healthControllerPath = path.resolve('apps/api/src/modules/health/health.controller.ts');
assert.ok(fs.existsSync(healthControllerPath), 'HealthController file must exist');
console.log('  [PASS] Health check module verified');

// Test 6: Disaster Recovery Backup Scripts
console.log('6. Testing Disaster Recovery Backup & Restore Scripts...');
const backupScriptPath = path.resolve('scripts/backup-database.sh');
const restoreScriptPath = path.resolve('scripts/restore-database.sh');
assert.ok(fs.existsSync(backupScriptPath), 'Backup script must exist');
assert.ok(fs.existsSync(restoreScriptPath), 'Restore script must exist');
console.log('  [PASS] Disaster recovery backup & restore scripts verified');

console.log('\n--- ALL PHASE-010 HARDENING TESTS PASSED (6/6) ---');
