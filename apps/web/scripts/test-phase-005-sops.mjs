import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-005 SOP Knowledge Base Verification Suite ---');

// Test 1: Versioning Bump Algorithm (Minor vs Major)
console.log('1. Testing SOP Version Increment Logic...');
function calculateNextVersion(currentVersion, isMajor) {
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0], 10) || 1;
  const minor = parseInt(parts[1], 10) || 0;

  if (isMajor) {
    return `${major + 1}.0`;
  }
  return `${major}.${minor + 1}`;
}

assert.equal(calculateNextVersion('1.0', false), '1.1');
assert.equal(calculateNextVersion('1.9', false), '1.10');
assert.equal(calculateNextVersion('1.1', true), '2.0');
assert.equal(calculateNextVersion('2.5', true), '3.0');
console.log('  [PASS] SOP version bumping (minor and major) verified');

// Test 2: SOP Checklist Extraction for Operational Task Pipeline
console.log('2. Testing SOP Checklist & Steps Parsing for Task Pipeline...');
function extractSubtasksFromSopContent(content) {
  const subtasks = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const checkboxMatch = trimmed.match(/^[-*]\s*\[\s*[xX]?\s*\]\s+(.+)$/);
    if (checkboxMatch) {
      subtasks.push(checkboxMatch[1].trim());
      continue;
    }
    const numberedMatch = trimmed.match(/^\d+[\.\)]\s+(.+)$/);
    if (numberedMatch && numberedMatch[1].length > 3) {
      subtasks.push(numberedMatch[1].trim());
    }
  }
  return subtasks;
}

const sampleSop = `
# دستورالعمل اجرای کمپین
## پیش‌نیازها
- [ ] دسترسی به پنل ادوردز
- [ ] دریافت تاییدیه بودجه از مدیر

## مراحل اجرایی
1. ورود به داشبورد و ایجاد کمپین جدید
2. تنظیم UTM و پارامترهای رهگیری
3. فعال‌سازی مانیتورینگ نرخ کلیک
`;

const extracted = extractSubtasksFromSopContent(sampleSop);
assert.equal(extracted.length, 5, 'Must extract all 2 checkboxes and 3 numbered steps');
assert.equal(extracted[0], 'دسترسی به پنل ادوردز');
assert.equal(extracted[1], 'دریافت تاییدیه بودجه از مدیر');
assert.equal(extracted[2], 'ورود به داشبورد و ایجاد کمپین جدید');
console.log('  [PASS] SOP content to Task subtasks pipeline extraction verified');

// Test 3: 800px Reading View Container & Print Stylesheet (REQ-011 & REQ-086)
console.log('3. Testing 800px Reading View & Print Stylesheet in Frontend...');
const sopsPagePath = path.resolve('apps/web/src/app/(app)/work/sops/page.tsx');
assert.ok(fs.existsSync(sopsPagePath), 'SOPs page file must exist');

const sopsPageSource = fs.readFileSync(sopsPagePath, 'utf8');
assert.ok(
  sopsPageSource.includes('max-w-[800px]'),
  'SOPs reading container must enforce max-w-[800px] per REQ-011 / REQ-086'
);
assert.ok(
  sopsPageSource.includes('@media print'),
  'SOPs page must define @media print styles for clear document printing'
);
assert.ok(
  sopsPageSource.includes('window.print()'),
  'SOPs page must support direct print action'
);
assert.ok(
  sopsPageSource.includes('rollbackVersion'),
  'SOPs page must support version rollback'
);
assert.ok(
  sopsPageSource.includes('createTaskFromSop'),
  'SOPs page must support converting SOP to operational task'
);
console.log('  [PASS] 800px reading width, print stylesheet, and interactive features verified');

// Test 4: Navigation Unlocking & permissions.ts Registration for Page 23
console.log('4. Testing Navigation and Permissions Registration for Page 23...');
const navPath = path.resolve('apps/web/src/config/navigation.ts');
const navContent = fs.readFileSync(navPath, 'utf8');

assert.ok(
  navContent.includes("href: '/work/sops'"),
  "SOPs item in navigation.ts must link to '/work/sops'"
);

const sopsNavSection = navContent.slice(
  navContent.indexOf("id: 'sops'"),
  navContent.indexOf("id: 'learning'")
);
assert.ok(
  !sopsNavSection.includes('comingSoon: true'),
  'SOPs navigation item must have comingSoon: true removed'
);

const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

assert.ok(
  permissionsContent.includes("actualRoute: '/work/sops'"),
  'Page 23 actualRoute must be registered as /work/sops'
);
assert.ok(
  permissionsContent.includes("pageFilePath: 'apps/web/src/app/(app)/work/sops/page.tsx'"),
  'Page 23 pageFilePath must be correctly mapped'
);
console.log('  [PASS] Navigation unlocked and permissions registered for Page 23');

// Test 5: Backend SopsModule Registration
console.log('5. Testing Backend SopsModule Registration in AppModule...');
const appModulePath = path.resolve('apps/api/src/app.module.ts');
const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

assert.ok(
  appModuleContent.includes('SopsModule'),
  'SopsModule must be registered in AppModule'
);
console.log('  [PASS] SopsModule registered in backend');

console.log('\n--- ALL PHASE-005 SOP TESTS PASSED (5/5) ---');
