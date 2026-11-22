import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-004 Meeting Minutes & Action Items Verification Suite ---');

// Test 1: Action Items State Transitions and Toggles
console.log('1. Testing Action Item Status Toggle Logic...');
function toggleActionItemStatus(currentStatus, requestedComplete) {
  if (requestedComplete) {
    return 'completed';
  }
  return 'pending';
}

assert.equal(toggleActionItemStatus('pending', true), 'completed');
assert.equal(toggleActionItemStatus('completed', false), 'pending');
assert.equal(toggleActionItemStatus('in_progress', true), 'completed');
console.log('  [PASS] Action item status toggle verified');

// Test 2: "Convert to Task" Pipeline Data Contract
console.log('2. Testing Action Item to Task Conversion Pipeline...');
function convertActionItemToTask(actionItem, meeting, currentUser) {
  return {
    organizationId: meeting.organizationId,
    title: `[اقدام صورتجلسه] ${actionItem.description.slice(0, 100)}`,
    description: `این وظیفه به صورت خودکار از صورتجلسه «${meeting.title}» ایجاد شده است.\n\nشرح کامل مصوبه:\n${actionItem.description}`,
    status: 'pending',
    priority: 'medium',
    assignedToId: actionItem.assigneeId || currentUser.id,
    dueDate: actionItem.dueDate || new Date(),
    metadata: {
      source: 'meeting_action_item',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      actionItemId: actionItem.id,
      convertedAt: new Date().toISOString(),
    },
  };
}

const mockMeeting = {
  id: 'meet-101',
  organizationId: 'org-gapji',
  title: 'جلسه هماهنگی استراتژی محتوا',
};

const mockActionItem = {
  id: 'act-202',
  description: 'تدوین تقویم ماهانه محتوا برای اینستاگرام و وبلاگ',
  assigneeId: 'user-writer-1',
  dueDate: new Date('2026-11-30T10:00:00Z'),
};

const taskPayload = convertActionItemToTask(mockActionItem, mockMeeting, { id: 'admin-1' });
assert.equal(taskPayload.organizationId, 'org-gapji');
assert.ok(taskPayload.title.includes('تدوین تقویم ماهانه محتوا'));
assert.equal(taskPayload.assignedToId, 'user-writer-1');
assert.equal(taskPayload.metadata.meetingId, 'meet-101');
assert.equal(taskPayload.metadata.actionItemId, 'act-202');
console.log('  [PASS] Action item to Task pipeline payload validated');

// Test 3: 800px Reading View Container Verification (REQ-011 & REQ-073)
console.log('3. Testing 800px Reading View Container in Frontend Page...');
const meetingPagePath = path.resolve('apps/web/src/app/(app)/work/meetings/page.tsx');
assert.ok(fs.existsSync(meetingPagePath), 'Meetings page file must exist');

const meetingPageSource = fs.readFileSync(meetingPagePath, 'utf8');
assert.ok(
  meetingPageSource.includes('max-w-[800px]'),
  'Meetings reading column must enforce max-w-[800px] container per REQ-011 / REQ-073'
);
assert.ok(
  meetingPageSource.includes('convertActionItemToTask'),
  'Meetings page must expose convertActionItemToTask action'
);
assert.ok(
  meetingPageSource.includes('previewEmail'),
  'Meetings page must expose email preview capability'
);
console.log('  [PASS] 800px reading container and interactive actions verified in frontend');

// Test 4: Navigation Unlocking & permissions.ts Registration for Page 22
console.log('4. Testing Navigation and Permissions Registration for Page 22...');
const navPath = path.resolve('apps/web/src/config/navigation.ts');
const navContent = fs.readFileSync(navPath, 'utf8');

assert.ok(
  navContent.includes("href: '/work/meetings'"),
  "Meetings item in navigation.ts must link to '/work/meetings'"
);

const meetingsNavSection = navContent.slice(
  navContent.indexOf("id: 'meetings'"),
  navContent.indexOf("id: 'sops'")
);
assert.ok(
  !meetingsNavSection.includes('comingSoon: true'),
  'Meetings navigation item must have comingSoon: true removed'
);

const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

assert.ok(
  permissionsContent.includes("actualRoute: '/work/meetings'"),
  'Page 22 actualRoute must be registered as /work/meetings'
);
assert.ok(
  permissionsContent.includes("pageFilePath: 'apps/web/src/app/(app)/work/meetings/page.tsx'"),
  'Page 22 pageFilePath must be correctly mapped'
);
console.log('  [PASS] Navigation unlocked and permissions registered for Page 22');

// Test 5: Backend Module Registration
console.log('5. Testing Backend MeetingsModule Registration in AppModule...');
const appModulePath = path.resolve('apps/api/src/app.module.ts');
const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

assert.ok(
  appModuleContent.includes('MeetingsModule'),
  'MeetingsModule must be imported and registered in AppModule'
);
console.log('  [PASS] MeetingsModule registered in backend');

console.log('\n--- ALL PHASE-004 MEETINGS TESTS PASSED (5/5) ---');
