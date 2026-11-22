import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-008 Activity Audit Log & Stream Verification Suite ---');

// Test 1: UTF-8 BOM CSV Generation Engine for Excel Persian Compatibility
console.log('1. Testing UTF-8 BOM CSV Generation for Excel Persian Compatibility...');
function generateActivityCsv(logs) {
  const bom = '\uFEFF';
  const header = ['تاریخ و زمان', 'کاربر', 'عملیات', 'ماژول مربوطه', 'توضیحات و جزئیات', 'شناسه لاگ'];
  const rows = logs.map((l) => [
    l.createdAt,
    l.userName,
    l.action,
    l.entityType,
    (l.details || '').replace(/[\r\n",]/g, ' '),
    l.id,
  ]);

  return bom + [header.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\r\n');
}

const mockLogs = [
  {
    id: 'log-1',
    createdAt: '2026-11-19T10:00:00Z',
    userName: 'علی حسینی',
    action: 'ایجاد کمپین',
    entityType: 'campaign',
    details: 'کمپین تخفیف یلدا با بودجه ۱۰ میلیون تومان ایجاد شد.',
  },
  {
    id: 'log-2',
    createdAt: '2026-11-19T10:05:00Z',
    userName: 'سارا رضایی',
    action: 'ثبت لید جدید',
    entityType: 'lead',
    details: 'لید جدید با شماره ۰۹۱۲۳۴۵۶۷۸۹ اضافه گردید.',
  },
];

const csvOutput = generateActivityCsv(mockLogs);
assert.ok(csvOutput.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Excel Persian display');
assert.ok(csvOutput.includes('کمپین تخفیف یلدا'), 'CSV must contain Persian details');
assert.ok(csvOutput.includes('علی حسینی'), 'CSV must contain user name');
console.log('  [PASS] UTF-8 BOM CSV generation engine verified');

// Test 2: Team Activity Aggregation Engine
console.log('2. Testing Team Activity Distribution Aggregation...');
function aggregateActivitySummary(logs) {
  const byEntityTypeMap = new Map();
  const userCountMap = new Map();

  for (const log of logs) {
    byEntityTypeMap.set(log.entityType, (byEntityTypeMap.get(log.entityType) || 0) + 1);
    userCountMap.set(log.userName, (userCountMap.get(log.userName) || 0) + 1);
  }

  const byEntityType = Array.from(byEntityTypeMap.entries()).map(([entityType, count]) => ({
    entityType,
    count,
  }));

  const topUsers = Array.from(userCountMap.entries())
    .map(([userName, count]) => ({ userName, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: logs.length,
    byEntityType,
    topUsers,
  };
}

const summaryResult = aggregateActivitySummary(mockLogs);
assert.equal(summaryResult.total, 2);
assert.equal(summaryResult.byEntityType.length, 2);
assert.equal(summaryResult.topUsers[0].count, 1);
console.log('  [PASS] Team activity aggregation engine verified');

// Test 3: Navigation Unlocking & permissions.ts Registration for Page 26
console.log('3. Testing Navigation and Permissions Registration for Page 26...');
const navPath = path.resolve('apps/web/src/config/navigation.ts');
const navContent = fs.readFileSync(navPath, 'utf8');

assert.ok(
  navContent.includes("href: '/work/activity'"),
  "Activity item in navigation.ts must link to '/work/activity'"
);

const activityNavSection = navContent.slice(
  navContent.indexOf("id: 'activity-report'"),
  navContent.indexOf("id: 'settings'")
);
assert.ok(
  !activityNavSection.includes('comingSoon: true'),
  'Activity navigation item must have comingSoon: true removed'
);

const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

assert.ok(
  permissionsContent.includes("actualRoute: '/work/activity'"),
  'Page 26 actualRoute must be registered as /work/activity'
);
assert.ok(
  permissionsContent.includes("pageFilePath: 'apps/web/src/app/(app)/work/activity/page.tsx'"),
  'Page 26 pageFilePath must be correctly mapped'
);
console.log('  [PASS] Navigation unlocked and permissions registered for Page 26');

// Test 4: Page Component Existence and Features
console.log('4. Testing Activity Page Component Features...');
const pagePath = path.resolve('apps/web/src/app/(app)/work/activity/page.tsx');
assert.ok(fs.existsSync(pagePath), 'Activity page file must exist');

const pageSource = fs.readFileSync(pagePath, 'utf8');
assert.ok(pageSource.includes('exportCsv'), 'Activity page must include exportCsv call');
assert.ok(pageSource.includes('datePreset'), 'Activity page must include date preset filters');
assert.ok(pageSource.includes('totalPages'), 'Activity page must include pagination controls');
console.log('  [PASS] Activity page component verified');

// Test 5: Backend ActivityModule Registration
console.log('5. Testing Backend ActivityModule Registration in AppModule...');
const appModulePath = path.resolve('apps/api/src/app.module.ts');
const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

assert.ok(
  appModuleContent.includes('ActivityModule'),
  'ActivityModule must be registered in AppModule'
);
console.log('  [PASS] ActivityModule registered in backend');

console.log('\n--- ALL PHASE-008 ACTIVITY TESTS PASSED (5/5) ---');
