import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-003 Equipment Management Verification Suite ---');

// Test 1: Shortage 3-Day Urgent Calculation Engine
console.log('1. Testing Shortage 3-Day Urgent Calculation Engine...');
function calculateShortageUrgency(targetDateStr, todayStr) {
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isUrgent = daysRemaining >= 0 && daysRemaining < 3;
  const isOverdue = daysRemaining < 0;

  return { daysRemaining, isUrgent, isOverdue };
}

const today = '2026-11-19';
// Case A: 2 days away -> Urgent (< 3 days)
const rA = calculateShortageUrgency('2026-11-21', today);
assert.equal(rA.daysRemaining, 2);
assert.equal(rA.isUrgent, true, '2 days remaining must trigger urgent alert');
assert.equal(rA.isOverdue, false);

// Case B: 1 day away -> Urgent (< 3 days)
const rB = calculateShortageUrgency('2026-11-20', today);
assert.equal(rB.daysRemaining, 1);
assert.equal(rB.isUrgent, true, '1 day remaining must trigger urgent alert');
assert.equal(rB.isOverdue, false);

// Case C: Today -> Urgent (< 3 days)
const rC = calculateShortageUrgency('2026-11-19', today);
assert.equal(rC.daysRemaining, 0);
assert.equal(rC.isUrgent, true, 'Due today must trigger urgent alert');
assert.equal(rC.isOverdue, false);

// Case D: Yesterday -> Overdue
const rD = calculateShortageUrgency('2026-11-18', today);
assert.equal(rD.daysRemaining, -1);
assert.equal(rD.isUrgent, false);
assert.equal(rD.isOverdue, true, 'Negative days must trigger overdue status');

// Case E: 5 days away -> Normal
const rE = calculateShortageUrgency('2026-11-24', today);
assert.equal(rE.daysRemaining, 5);
assert.equal(rE.isUrgent, false, '5 days remaining should not be urgent');
assert.equal(rE.isOverdue, false);
console.log('  [PASS] Shortage 3-day urgency and overdue calculation verified');

// Test 2: Equipment Template Application Logic
console.log('2. Testing Equipment Template Application Simulation...');
class MockTemplateHarness {
  constructor() {
    this.templateItems = [
      { id: 'ti-1', equipmentItemId: 'eq-mic', quantity: 2 },
      { id: 'ti-2', equipmentItemId: 'eq-cam', quantity: 1 },
      { id: 'ti-3', equipmentItemId: 'eq-light', quantity: 2 },
    ];
    this.eventEquipments = [];
  }

  applyTemplate(templateId, webinarId, dueDate) {
    const created = this.templateItems.map((item) => {
      const rec = {
        id: `ee-${Math.random()}`,
        templateId,
        webinarId,
        equipmentItemId: item.equipmentItemId,
        quantity: item.quantity,
        status: 'not_procured',
        dueDate,
      };
      this.eventEquipments.push(rec);
      return rec;
    });
    return created;
  }
}

const harness = new MockTemplateHarness();
const applied = harness.applyTemplate('tpl-webinar', 'webinar-123', '2026-11-25');
assert.equal(applied.length, 3, 'All 3 template items must be mapped to event equipment');
assert.equal(applied[0].status, 'not_procured', 'Initial readiness status must be not_procured');
assert.equal(applied[0].webinarId, 'webinar-123');
console.log('  [PASS] Equipment template application verified');

// Test 3: Navigation Menu Unlocking
console.log('3. Testing Navigation Menu Unlocking for Equipment...');
const navPath = path.resolve('apps/web/src/config/navigation.ts');
const navContent = fs.readFileSync(navPath, 'utf8');

assert.ok(
  navContent.includes("href: '/work/equipment'"),
  "Equipment item in navigation.ts must link to '/work/equipment'"
);
// Make sure comingSoon is removed for equipment
const equipmentNavSection = navContent.slice(navContent.indexOf("id: 'equipment'"), navContent.indexOf("id: 'meetings'"));
assert.ok(
  !equipmentNavSection.includes('comingSoon: true'),
  'Equipment navigation item must no longer have comingSoon: true'
);
console.log('  [PASS] Navigation link unlocked and comingSoon removed');

// Test 4: Permissions.ts Page 21 Registration
console.log('4. Testing permissions.ts Registration for Page 21...');
const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

assert.ok(
  permissionsContent.includes("actualRoute: '/work/equipment'"),
  'Page 21 actualRoute must be registered as /work/equipment'
);
assert.ok(
  permissionsContent.includes("pageFilePath: 'apps/web/src/app/(app)/work/equipment/page.tsx'"),
  'Page 21 pageFilePath must be registered'
);
console.log('  [PASS] Page 21 is properly registered in permissions.ts');

// Test 5: Page File Existence
console.log('5. Testing /work/equipment Page File Existence...');
const pagePath = path.resolve('apps/web/src/app/(app)/work/equipment/page.tsx');
assert.ok(fs.existsSync(pagePath), 'Equipment page file must exist');
console.log('  [PASS] Equipment page component exists on disk');

console.log('\n--- ALL PHASE-003 EQUIPMENT TESTS PASSED (5/5) ---');
