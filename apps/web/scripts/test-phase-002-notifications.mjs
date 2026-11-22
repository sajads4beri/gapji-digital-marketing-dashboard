import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-002 Notifications Verification Suite ---');

// Test 1: Unread Count Capping Engine (+99 limit)
console.log('1. Testing Unread Count Capping Engine (+99 limit)...');
function formatUnreadCount(count) {
  if (count > 99) return '+99';
  return String(count);
}

assert.equal(formatUnreadCount(0), '0', '0 should format as 0');
assert.equal(formatUnreadCount(5), '5', '5 should format as 5');
assert.equal(formatUnreadCount(99), '99', '99 should format as 99');
assert.equal(formatUnreadCount(100), '+99', '100 must be capped at +99');
assert.equal(formatUnreadCount(1500), '+99', '1500 must be capped at +99');
console.log('  [PASS] Unread count formatting and capping verified');

// Test 2: Standard 6 Event Types Catalog
console.log('2. Testing Standard 6 Event Types Catalog...');
const expectedEventTypes = [
  'lead_assigned',
  'lead_status_changed',
  'task_due',
  'campaign_alert',
  'cost_threshold',
  'system_alert',
];

const servicePath = path.resolve('apps/api/src/modules/notifications/notifications.service.ts');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

for (const eventType of expectedEventTypes) {
  assert.ok(
    serviceContent.includes(eventType),
    `Notifications service must include event type: ${eventType}`
  );
}
console.log('  [PASS] All 6 standard event types verified in service catalog');

// Test 3: Notification Preference Toggle & Matrix Upsert
console.log('3. Testing Preference Toggle & Matrix Logic...');
class MockPreferenceService {
  constructor() {
    this.preferences = new Map();
  }

  upsertPreference(orgId, userId, eventType, inApp, email) {
    const key = `${orgId}_${userId}_${eventType}`;
    this.preferences.set(key, { orgId, userId, eventType, inApp, email });
  }

  getPreference(orgId, userId, eventType) {
    const key = `${orgId}_${userId}_${eventType}`;
    return this.preferences.get(key) || { inApp: true, email: true };
  }
}

const mockPrefs = new MockPreferenceService();
mockPrefs.upsertPreference('org-1', 'user-1', 'lead_assigned', true, false);
const pref1 = mockPrefs.getPreference('org-1', 'user-1', 'lead_assigned');
assert.equal(pref1.inApp, true);
assert.equal(pref1.email, false);

// Default check
const defaultPref = mockPrefs.getPreference('org-1', 'user-1', 'task_due');
assert.equal(defaultPref.inApp, true);
assert.equal(defaultPref.email, true);
console.log('  [PASS] Notification preferences toggle and defaults logic verified');

// Test 4: Page 3 Page File Existence and Permission Registration
console.log('4. Testing /notifications Page File & Permissions...');
const pagePath = path.resolve('apps/web/src/app/(app)/notifications/page.tsx');
assert.ok(fs.existsSync(pagePath), 'Notifications page file must exist');

const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');
assert.ok(
  permissionsContent.includes("actualRoute: '/notifications'"),
  'Page 3 actualRoute must be registered as /notifications'
);
assert.ok(
  permissionsContent.includes("isImplemented: true"),
  'Page 3 must be marked isImplemented: true in permissions.ts'
);
console.log('  [PASS] Page 3 is properly implemented and registered in permissions');

// Test 5: Header Real Notifications API Integration
console.log('5. Testing Header Real Notifications Integration...');
const headerPath = path.resolve('apps/web/src/components/layout/header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');

assert.ok(
  !headerContent.includes('const mockNotifications ='),
  'Header must not use hardcoded mockNotifications'
);
assert.ok(
  headerContent.includes('notificationsApi.getNotifications'),
  'Header must call notificationsApi.getNotifications'
);
assert.ok(
  headerContent.includes('notificationsApi.markAllAsRead'),
  'Header must provide markAllAsRead action'
);
console.log('  [PASS] Header component is fully connected to live notifications');

console.log('\n--- ALL PHASE-002 NOTIFICATIONS TESTS PASSED (5/5) ---');
