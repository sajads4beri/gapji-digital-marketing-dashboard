/**
 * تست‌های یکپارچگی سایدبار، تم تاریک، shadcn/ui و ایران‌سنس
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('   SIDEBAR AUDIT, DARK MODE, SHADCN/UI & IRANSANS TEST SUITE');
console.log('============================================================\n');

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Navigation config & PDF alignment
test('NAV-01: Navigation config defines 4 groups according to PDF', async () => {
  const navPath = path.join(webDir, 'src/config/navigation.ts');
  const content = fs.readFileSync(navPath, 'utf8');

  assert.ok(content.includes("title: 'عملکرد و کمپین‌ها'"), 'Group 1 must match');
  assert.ok(content.includes("title: 'فروش و سرنخ‌ها'"), 'Group 2 must match');
  assert.ok(content.includes("title: 'فرآیندها و ابزارها'"), 'Group 3 must match');
  assert.ok(content.includes("title: 'تنظیمات'"), 'Group 4 must be titled تنظیمات');
});

test('NAV-02: Navigation config contains canonical PDF permission routes for all items', () => {
  const navPath = path.join(webDir, 'src/config/navigation.ts');
  const content = fs.readFileSync(navPath, 'utf8');

  const requiredRoutes = [
    "permissionRoute: '/performance/dashboard'",
    "permissionRoute: '/campaigns'",
    "permissionRoute: '/campaigns/new'",
    "permissionRoute: '/performance/platforms'",
    "permissionRoute: '/performance/costs'",
    "permissionRoute: '/performance/imports'",
    "permissionRoute: '/performance/kpis'",
    "permissionRoute: '/performance/audiences'",
    "permissionRoute: '/performance/landing'",
    "permissionRoute: '/leads'",
    "permissionRoute: '/leads/board'",
    "permissionRoute: '/leads/:id'",
    "permissionRoute: '/leads/sms'",
    "permissionRoute: '/leads/webinars'",
    "permissionRoute: '/work/tasks'",
    "permissionRoute: '/work/calendar'",
    "permissionRoute: '/work/equipment'",
    "permissionRoute: '/work/meetings'",
    "permissionRoute: '/work/sops'",
    "permissionRoute: '/work/learning'",
    "permissionRoute: '/work/ideas'",
    "permissionRoute: '/work/activity'",
    "permissionRoute: '/settings/users'",
    "permissionRoute: '/settings/organization'",
    "permissionRoute: '/settings/wordpress'",
  ];

  for (const r of requiredRoutes) {
    assert.ok(content.includes(r), `Navigation must define ${r}`);
  }
});

test('NAV-03: Sidebar components consume permissionRoute and hide empty groups', () => {
  const sidebarPath = path.join(webDir, 'src/components/layout/sidebar.tsx');
  const content = fs.readFileSync(sidebarPath, 'utf8');

  assert.ok(content.includes('item.permissionRoute'), 'Sidebar must inspect permissionRoute');
  assert.ok(content.includes('visibleItems.length === 0) return null'), 'Empty group must not render');
});

test('THEME-01: ThemeProvider, context, and toggle infrastructure completely removed', () => {
  const contextPath = path.join(webDir, 'src/features/theme/theme-context.tsx');
  const providerPath = path.join(webDir, 'src/features/theme/theme-provider.tsx');
  const togglePath = path.join(webDir, 'src/features/theme/theme-toggle.tsx');

  assert.ok(!fs.existsSync(contextPath), 'theme-context.tsx must be removed');
  assert.ok(!fs.existsSync(providerPath), 'theme-provider.tsx must be removed');
  assert.ok(!fs.existsSync(togglePath), 'theme-toggle.tsx must be removed');
});

test('THEME-02: Anti-flash script and ThemeProvider removed from layout.tsx', () => {
  const layoutPath = path.join(webDir, 'src/app/layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(!content.includes('ThemeProvider'), 'Root layout must not use ThemeProvider');
  assert.ok(!content.includes('gapji_theme'), 'Anti-flash script must be removed');
  assert.ok(!content.includes('suppressHydrationWarning'), 'suppressHydrationWarning must be removed');
});

test('THEME-03: ThemeToggle is completely removed from desktop Sidebar and mobile Sidebar', () => {
  const desktopSidebarPath = path.join(webDir, 'src/components/layout/sidebar.tsx');
  const mobileSidebarPath = path.join(webDir, 'src/components/layout/mobile-sidebar.tsx');

  const desktopContent = fs.readFileSync(desktopSidebarPath, 'utf8');
  const mobileContent = fs.readFileSync(mobileSidebarPath, 'utf8');

  assert.ok(!desktopContent.includes('ThemeToggle'), 'Desktop sidebar must not include ThemeToggle');
  assert.ok(!mobileContent.includes('ThemeToggle'), 'Mobile sidebar must not include ThemeToggle');
});

test('THEME-04: Dark Mode disabled, .dark CSS removed, and pure Light Mode semantic variables active', () => {
  const tailwindPath = path.join(webDir, 'tailwind.config.ts');
  const globalsPath = path.join(webDir, 'src/app/globals.css');

  const twContent = fs.readFileSync(tailwindPath, 'utf8');
  const cssContent = fs.readFileSync(globalsPath, 'utf8');

  assert.ok(!twContent.includes("darkMode: 'class'"), 'Tailwind must not enable darkMode: class');
  assert.ok(!cssContent.includes('.dark {'), 'globals.css must not define .dark variables');
  assert.ok(cssContent.includes('--background:'), 'globals.css must retain light semantic tokens');
});

test('SHADCN-01: Shared UI components Card and Badge implemented according to shadcn/ui principles', () => {
  const cardPath = path.join(webDir, 'src/components/ui/card.tsx');
  const badgePath = path.join(webDir, 'src/components/ui/badge.tsx');
  const indexPath = path.join(webDir, 'src/components/ui/index.ts');

  assert.ok(fs.existsSync(cardPath), 'card.tsx exists');
  assert.ok(fs.existsSync(badgePath), 'badge.tsx exists');

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  assert.ok(indexContent.includes("export * from './card'"), 'index.ts exports card');
  assert.ok(indexContent.includes("export * from './badge'"), 'index.ts exports badge');
});

test('IRANSANS-01: IranSans configuration documents missing assets and required formats without downloading unverified fonts', () => {
  const fontConfigPath = path.join(webDir, 'src/config/font-iransans.ts');
  assert.ok(fs.existsSync(fontConfigPath), 'font-iransans.ts exists');

  const configContent = fs.readFileSync(fontConfigPath, 'utf8');
  assert.ok(configContent.includes('PENDING_ASSETS'), 'Status is correctly marked as PENDING_ASSETS');
  assert.ok(configContent.includes('apps/web/public/fonts/iransans/'), 'Specifies exact directory');
  assert.ok(configContent.includes('IRANSansWeb.woff2'), 'Specifies required files');
});

console.log(`\nAll ${passCount} tests passed successfully!`);
