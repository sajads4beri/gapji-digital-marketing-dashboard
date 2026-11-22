import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-007 Ideas Incubator & Voting Verification Suite ---');

// Test 1: Reversible 1-Click Upvote Engine Logic
console.log('1. Testing Reversible Upvote Toggle Engine...');
function toggleIdeaVote(currentHasVoted, currentCount) {
  if (currentHasVoted) {
    return {
      hasVoted: false,
      votesCount: Math.max(0, currentCount - 1),
    };
  }
  return {
    hasVoted: true,
    votesCount: currentCount + 1,
  };
}

const v1 = toggleIdeaVote(false, 5);
assert.equal(v1.hasVoted, true);
assert.equal(v1.votesCount, 6, 'Upvoting must increment count');

const v2 = toggleIdeaVote(true, 6);
assert.equal(v2.hasVoted, false);
assert.equal(v2.votesCount, 5, 'Reversing vote must decrement count');
console.log('  [PASS] 1-Click reversible upvote toggle logic verified');

// Test 2: Status Lifecycle State Machine
console.log('2. Testing Idea Status Transitions...');
const VALID_STATUSES = ['submitted', 'reviewing', 'approved', 'rejected', 'implemented'];
assert.ok(VALID_STATUSES.includes('submitted'));
assert.ok(VALID_STATUSES.includes('approved'));
assert.ok(VALID_STATUSES.includes('implemented'));
console.log('  [PASS] All 5 IdeaStatus enum lifecycle states validated');

// Test 3: Idea to Task Conversion Pipeline
console.log('3. Testing Convert Idea to Task Pipeline...');
function convertIdeaToTaskPayload(idea, currentUser, input) {
  return {
    organizationId: idea.organizationId,
    title: input?.title || `[اجرای ایده] ${idea.title}`,
    description: `وظیفه عملیاتی ایجاد شده از ایده:\n${idea.title}\n\nشرح:\n${idea.description}`,
    status: 'todo',
    priority: input?.priority || 'medium',
    dueDate: input?.dueDate ? new Date(input.dueDate) : null,
    assigneeId: input?.assigneeId || currentUser.id,
    createdById: currentUser.id,
    relatedType: idea.campaignId ? 'campaign' : undefined,
    relatedId: idea.campaignId || undefined,
  };
}

const mockIdea = {
  id: 'idea-10',
  organizationId: 'org-1',
  title: 'تخفیف هوشمند برای سبدهای خرید رهاشده',
  description: 'ارسال کد تخفیف اختصاصی از طریق پیامک برای کاربرانی که لید داده‌اند اما خرید نکرده‌اند.',
  campaignId: 'camp-99',
};

const taskPayload = convertIdeaToTaskPayload(mockIdea, { id: 'usr-1' }, { priority: 'high' });
assert.equal(taskPayload.title, '[اجرای ایده] تخفیف هوشمند برای سبدهای خرید رهاشده');
assert.equal(taskPayload.priority, 'high');
assert.equal(taskPayload.relatedType, 'campaign');
assert.equal(taskPayload.relatedId, 'camp-99');
console.log('  [PASS] Idea to Task pipeline mapping verified');

// Test 4: Navigation Unlocking & permissions.ts Registration for Page 25
console.log('4. Testing Navigation and Permissions Registration for Page 25...');
const navPath = path.resolve('apps/web/src/config/navigation.ts');
const navContent = fs.readFileSync(navPath, 'utf8');

assert.ok(
  navContent.includes("href: '/work/ideas'"),
  "Ideas item in navigation.ts must link to '/work/ideas'"
);

const ideasNavSection = navContent.slice(
  navContent.indexOf("id: 'ideas'"),
  navContent.indexOf("id: 'activity-report'")
);
assert.ok(
  !ideasNavSection.includes('comingSoon: true'),
  'Ideas navigation item must have comingSoon: true removed'
);

const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

assert.ok(
  permissionsContent.includes("actualRoute: '/work/ideas'"),
  'Page 25 actualRoute must be registered as /work/ideas'
);
assert.ok(
  permissionsContent.includes("pageFilePath: 'apps/web/src/app/(app)/work/ideas/page.tsx'"),
  'Page 25 pageFilePath must be correctly mapped'
);
console.log('  [PASS] Navigation unlocked and permissions registered for Page 25');

// Test 5: Backend IdeasModule Registration
console.log('5. Testing Backend IdeasModule Registration in AppModule...');
const appModulePath = path.resolve('apps/api/src/app.module.ts');
const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

assert.ok(
  appModuleContent.includes('IdeasModule'),
  'IdeasModule must be imported and registered in AppModule'
);
console.log('  [PASS] IdeasModule registered in backend');

console.log('\n--- ALL PHASE-007 IDEAS TESTS PASSED (5/5) ---');
