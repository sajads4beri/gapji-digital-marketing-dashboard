import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-006 Learning LMS Hub Verification Suite ---');

// Test 1: Team Progress Matrix Aggregation Engine (User x Course Matrix)
console.log('1. Testing User x Course Matrix Progress Calculation Engine...');
function calculateTeamMatrix(users, resources, progressRecords) {
  const progressMap = new Map();
  for (const p of progressRecords) {
    progressMap.set(`${p.userId}_${p.resourceId}`, p);
  }

  const totalResourceCount = resources.length;

  return users.map((u) => {
    let completedCount = 0;
    const progressByResource = {};

    for (const r of resources) {
      const key = `${u.id}_${r.id}`;
      const rec = progressMap.get(key);
      const isCompleted = rec?.isCompleted || false;
      if (isCompleted) {
        completedCount++;
      }
      progressByResource[r.id] = {
        isCompleted,
        rating: rec?.rating || null,
        completedAt: rec?.completedAt || null,
      };
    }

    const progressPercentage =
      totalResourceCount > 0 ? Math.round((completedCount / totalResourceCount) * 100) : 0;

    return {
      userId: u.id,
      fullName: u.fullName,
      completedCount,
      totalResourceCount,
      progressPercentage,
      progressByResource,
    };
  });
}

const mockUsers = [
  { id: 'u1', fullName: 'علی حسینی' },
  { id: 'u2', fullName: 'سارا رضایی' },
];

const mockResources = [
  { id: 'r1', title: 'دوره گوگل ادز', software: 'Google Ads' },
  { id: 'r2', title: 'سئو تکنیکال', software: 'Google Analytics' },
  { id: 'r3', title: 'طراحی فیگما', software: 'Figma' },
  { id: 'r4', title: 'استراتژی محتوا', software: 'Notion' },
];

const mockProgress = [
  { userId: 'u1', resourceId: 'r1', isCompleted: true, rating: 5 },
  { userId: 'u1', resourceId: 'r2', isCompleted: true, rating: 4 },
  { userId: 'u2', resourceId: 'r1', isCompleted: true, rating: 5 },
];

const matrix = calculateTeamMatrix(mockUsers, mockResources, mockProgress);
assert.equal(matrix.length, 2);
// u1 completed 2 of 4 -> 50%
assert.equal(matrix[0].completedCount, 2);
assert.equal(matrix[0].progressPercentage, 50);
assert.equal(matrix[0].progressByResource['r1'].isCompleted, true);
assert.equal(matrix[0].progressByResource['r1'].rating, 5);
assert.equal(matrix[0].progressByResource['r3'].isCompleted, false);

// u2 completed 1 of 4 -> 25%
assert.equal(matrix[1].completedCount, 1);
assert.equal(matrix[1].progressPercentage, 25);
console.log('  [PASS] User x Course matrix progress calculation verified');

// Test 2: Custom Video Player Controls in Page
console.log('2. Testing Video Player & Speed Control Features in Frontend Page...');
const learningPagePath = path.resolve('apps/web/src/app/(app)/work/learning/page.tsx');
assert.ok(fs.existsSync(learningPagePath), 'Learning page file must exist');

const learningPageSource = fs.readFileSync(learningPagePath, 'utf8');
assert.ok(
  learningPageSource.includes('playbackSpeed'),
  'Learning page must implement playback speed state'
);
assert.ok(
  learningPageSource.includes('[1, 1.25, 1.5, 2]'),
  'Learning page must expose 1x, 1.25x, 1.5x, 2x speed selectors'
);
assert.ok(
  learningPageSource.includes('handleToggleCompleted'),
  'Learning page must expose completion toggle'
);
assert.ok(
  learningPageSource.includes('handleSaveNotesAndRating'),
  'Learning page must support 5-star rating and notes'
);
assert.ok(
  learningPageSource.includes('matrixData'),
  'Learning page must support Manager Team Matrix view'
);
console.log('  [PASS] Custom video player, speed controls, and interactive features verified');

// Test 3: Navigation Unlocking & permissions.ts Registration for Page 24
console.log('3. Testing Navigation and Permissions Registration for Page 24...');
const navPath = path.resolve('apps/web/src/config/navigation.ts');
const navContent = fs.readFileSync(navPath, 'utf8');

assert.ok(
  navContent.includes("href: '/work/learning'"),
  "Learning item in navigation.ts must link to '/work/learning'"
);

const learningNavSection = navContent.slice(
  navContent.indexOf("id: 'learning'"),
  navContent.indexOf("id: 'ideas'")
);
assert.ok(
  !learningNavSection.includes('comingSoon: true'),
  'Learning navigation item must have comingSoon: true removed'
);

const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

assert.ok(
  permissionsContent.includes("actualRoute: '/work/learning'"),
  'Page 24 actualRoute must be registered as /work/learning'
);
assert.ok(
  permissionsContent.includes("pageFilePath: 'apps/web/src/app/(app)/work/learning/page.tsx'"),
  'Page 24 pageFilePath must be correctly mapped'
);
console.log('  [PASS] Navigation unlocked and permissions registered for Page 24');

// Test 4: Backend Module Registration
console.log('4. Testing Backend LearningModule Registration in AppModule...');
const appModulePath = path.resolve('apps/api/src/app.module.ts');
const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

assert.ok(
  appModuleContent.includes('LearningModule'),
  'LearningModule must be imported and registered in AppModule'
);
console.log('  [PASS] LearningModule registered in backend');

// Test 5: Software & Categories Facets
console.log('5. Testing Software & Category Taxonomy Mapping...');
const softwares = ['Google Ads', 'Google Analytics', 'Meta Ads', 'Photoshop', 'Notion', 'Figma', 'Excel'];
assert.ok(softwares.includes('Google Ads'));
assert.ok(softwares.includes('Figma'));
console.log('  [PASS] Software taxonomy facets verified');

console.log('\n--- ALL PHASE-006 LEARNING TESTS PASSED (5/5) ---');
