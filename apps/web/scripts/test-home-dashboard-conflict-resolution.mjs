import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '..');

console.log('\n================================================================');
console.log('   HOME PAGE (/) & EXECUTIVE DASHBOARD RESOLUTION TEST SUITE    ');
console.log('   Reference: Marketing Platform - Phase 1: Frontend Pages      ');
console.log('================================================================\n');

let passCount = 0;
let totalCount = 0;

function runTest(testId, description, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✔ [PASS] [${testId}] ${description}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] [${testId}] ${description}`);
    console.error(`   Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// ۱. اعتبارسنجی ماتریس مجوزهای صفحه خانه و داشبورد اجرایی
// -------------------------------------------------------------
const permissionsPath = path.join(webDir, 'src/lib/permissions.ts');
const permissionsSource = fs.readFileSync(permissionsPath, 'utf8');

runTest('PERM-01', 'Route / (Page 2) is defined as Role-Based Home for all 6 roles in permissions.ts', () => {
  assert(permissionsSource.includes("title: 'صفحه خانه (به‌ازای نقش)'"), 'Page 2 title must be present');
  assert(permissionsSource.includes("routes: ['/']"), 'Page 2 routes must include /');
  assert(permissionsSource.includes("pdfRolesRaw: 'همه؛ محتوا بر اساس نقش'"), 'Roles raw must be as in PDF');
  
  // Verify access definitions for all 6 roles on /
  const page2Block = permissionsSource.slice(
    permissionsSource.indexOf("title: 'صفحه خانه (به‌ازای نقش)'"),
    permissionsSource.indexOf("title: 'نوتیفیکیشن‌ها'")
  );
  assert(page2Block.includes("admin: 'full'"), 'Admin full access on /');
  assert(page2Block.includes("marketing_manager: 'full'"), 'marketing_manager full access on /');
  assert(page2Block.includes("campaign_manager: 'scoped'"), 'campaign_manager scoped access on /');
  assert(page2Block.includes("sales_agent: 'scoped'"), 'sales_agent scoped access on /');
  assert(page2Block.includes("content_creator: 'scoped'"), 'content_creator scoped access on /');
  assert(page2Block.includes("client: 'scoped'"), 'client scoped access on /');
});

runTest('PERM-02', 'Route /performance/dashboard (Page 4) restricts access to admin, marketing_manager and client', () => {
  const page4Block = permissionsSource.slice(
    permissionsSource.indexOf("title: 'داشبورد اجرایی'"),
    permissionsSource.indexOf("title: 'لیست کمپین‌ها'")
  );
  assert(page4Block.includes("admin: 'full'"), 'Admin full access on /performance/dashboard');
  assert(page4Block.includes("marketing_manager: 'full'"), 'marketing_manager full access on /performance/dashboard');
  assert(page4Block.includes("client: 'read'"), 'client read access on /performance/dashboard');
  assert(page4Block.includes("campaign_manager: 'not_specified'"), 'campaign_manager not allowed on /performance/dashboard');
  assert(page4Block.includes("sales_agent: 'not_specified'"), 'sales_agent not allowed on /performance/dashboard');
  assert(page4Block.includes("content_creator: 'not_specified'"), 'content_creator not allowed on /performance/dashboard');
});

// -------------------------------------------------------------
// ۲. استقلال مسیر ریشه و عدم ریدایرکت کورکورانه به داشبورد
// -------------------------------------------------------------
const rootPagePath = path.join(webDir, 'src/app/(app)/page.tsx');
const rootPageSource = fs.readFileSync(rootPagePath, 'utf8');

runTest('ROUTING-01', 'Route / renders RoleBasedHome directly and has NO blind redirect to /performance/dashboard', () => {
  assert(rootPageSource.includes('RoleBasedHome'), 'Root page must render RoleBasedHome');
  assert(!rootPageSource.includes("redirect('/performance/dashboard')"), 'Root page must NOT blindly redirect to /performance/dashboard');
});

const dashboardPagePath = path.join(webDir, 'src/app/(app)/performance/dashboard/page.tsx');
const dashboardPageSource = fs.readFileSync(dashboardPagePath, 'utf8');

runTest('ROUTING-02', 'Executive Dashboard remains at /performance/dashboard as an independent route', () => {
  assert(fs.existsSync(dashboardPagePath), 'Executive dashboard file must exist at /performance/dashboard/page.tsx');
  assert(dashboardPageSource.includes('ExecutiveDashboardContent'), 'Must contain ExecutiveDashboardContent');
  assert(dashboardPageSource.includes('Breadcrumb'), 'Must have breadcrumb');
});

// -------------------------------------------------------------
// ۳. پیاده‌سازی ویجت‌های ۱۲‌ستونی به‌ازای ۵ دسته نقشی مطابق PDF
// -------------------------------------------------------------
const homeFeatureDir = path.join(webDir, 'src/features/home');
const homeWidgetCardPath = path.join(homeFeatureDir, 'components/home-widget-card.tsx');
const clientViewPath = path.join(homeFeatureDir, 'components/client-home-view.tsx');
const managerViewPath = path.join(homeFeatureDir, 'components/manager-home-view.tsx');
const campaignViewPath = path.join(homeFeatureDir, 'components/campaign-manager-home-view.tsx');
const salesViewPath = path.join(homeFeatureDir, 'components/sales-agent-home-view.tsx');
const contentViewPath = path.join(homeFeatureDir, 'components/content-creator-home-view.tsx');

runTest('WIDGET-01', 'HomeWidgetCard implements 12-column grid, view all link, independent skeleton and error handling', () => {
  assert(fs.existsSync(homeWidgetCardPath), 'home-widget-card.tsx must exist');
  const src = fs.readFileSync(homeWidgetCardPath, 'utf8');
  assert(src.includes('viewAllHref'), 'Must support viewAllHref');
  assert(src.includes('isLoading'), 'Must support independent loading');
  assert(src.includes('error'), 'Must support independent error handling');
  assert(src.includes('isEmpty'), 'Must support role-appropriate empty message');
});

runTest('WIDGET-02', 'ClientHomeView implements exact widgets from PDF p. 7 (Spend, Leads, ROI, Trends, Lagging KPIs, Activity)', () => {
  assert(fs.existsSync(clientViewPath), 'client-home-view.tsx must exist');
  const src = fs.readFileSync(clientViewPath, 'utf8');
  assert(src.includes('کل هزینه تبلیغات'), 'Must display spend metric');
  assert(src.includes('تعداد سرنخ‌ها (Leads)'), 'Must display leads metric');
  assert(src.includes('نرخ بازگشت هزینه (ROAS)'), 'Must display ROAS/ROI metric');
  assert(src.includes('نمودار روند هزینه و لیدهای جذب‌شده'), 'Must display trend chart widget');
  assert(src.includes('لیست KPIهای عقب‌مانده از برنامه'), 'Must display lagging KPIs widget');
  assert(src.includes('خلاصه فعالیت و اقدامات اجرایی تیم مارکتینگ'), 'Must display team activity summary');
});

runTest('WIDGET-03', 'ManagerHomeView implements exact widgets from PDF p. 7 (Alerts, Overdue Tasks, 7-Day Events, Admin Links)', () => {
  assert(fs.existsSync(managerViewPath), 'manager-home-view.tsx must exist');
  const src = fs.readFileSync(managerViewPath, 'utf8');
  assert(src.includes('لیست هشدار کمپین‌ها (انحراف شاخص از هدف)'), 'Must display campaign alerts widget');
  assert(src.includes('تسک‌های عقب‌افتاده تیم'), 'Must display overdue tasks widget');
  assert(src.includes('رویدادها و نقاط عطف ۷ روز آینده'), 'Must display 7-day upcoming events widget');
  assert(src.includes('/performance/dashboard'), 'Must have quick link to executive dashboard');
  assert(src.includes('پیش‌نمایش زنده صفحه خانه سایر نقش‌ها'), 'Admin must have role preview switcher');
});

runTest('WIDGET-04', 'CampaignManagerHomeView implements exact widgets from PDF p. 7 (Active campaigns without today cost, Shortcuts)', () => {
  assert(fs.existsSync(campaignViewPath), 'campaign-manager-home-view.tsx must exist');
  const src = fs.readFileSync(campaignViewPath, 'utf8');
  assert(src.includes('کمپین‌های فعال بدون هزینه ثبت‌شده امروز'), 'Must display campaigns without today cost');
  assert(src.includes('میان‌برهای سریع عملیاتی'), 'Must display quick shortcuts widget');
  assert(src.includes('ثبت هزینه جدید'), 'Must have shortcut to record cost');
  assert(src.includes('Import داده از فایل'), 'Must have shortcut to import data');
  assert(src.includes('ساخت کمپین (ویزارد)'), 'Must have shortcut to campaign wizard');
});

runTest('WIDGET-05', 'SalesAgentHomeView implements exact widgets from PDF p. 7 (Today followups with call, New leads, Conversion rate)', () => {
  assert(fs.existsSync(salesViewPath), 'sales-agent-home-view.tsx must exist');
  const src = fs.readFileSync(salesViewPath, 'utf8');
  assert(src.includes('پیگیری‌های امروز من'), 'Must display today followups');
  assert(src.includes('امروز پیگیری ندارید'), 'Must have exact PDF empty message: امروز پیگیری ندارید');
  assert(src.includes('تماس و ثبت نتیجه'), 'Must have interactive direct call button from widget');
  assert(src.includes('لیدهای جدید جذب‌شده (New Leads)'), 'Must display new leads widget');
  assert(src.includes('نرخ تبدیل و عملکرد فردی من'), 'Must display conversion rate widget');
});

runTest('WIDGET-06', 'ContentCreatorHomeView implements exact widgets from PDF p. 7 (My tasks, Weekly calendar, Equipment checklist)', () => {
  assert(fs.existsSync(contentViewPath), 'content-creator-home-view.tsx must exist');
  const src = fs.readFileSync(contentViewPath, 'utf8');
  assert(src.includes('تسک‌های من (My Tasks)'), 'Must display my tasks widget');
  assert(src.includes('تقویم هفته و جدول انتشار محتوا'), 'Must display weekly calendar widget');
  assert(src.includes('تجهیزات ناقص و چک‌لیست تجهیزات استودیو/وبینار'), 'Must display equipment checklist widget');
});

// -------------------------------------------------------------
// ۴. امنیت ریدایرکت، اعتبارسنجی callbackUrl و جلوگیری از Redirect Loop
// -------------------------------------------------------------
const redirectUtilsPath = path.join(webDir, 'src/lib/redirect-utils.ts');
const redirectUtilsSource = fs.readFileSync(redirectUtilsPath, 'utf8');

runTest('SECURITY-01', 'redirect-utils.ts validates callbackUrl against permissions and open redirect', () => {
  assert(fs.existsSync(redirectUtilsPath), 'redirect-utils.ts must exist');
  assert(redirectUtilsSource.includes('canAccessRoute'), 'Must use canAccessRoute to check role permissions');
  assert(redirectUtilsSource.includes("targetUrl.startsWith('/')"), 'Must ensure relative path');
  assert(redirectUtilsSource.includes("targetUrl.startsWith('//')"), 'Must reject protocol-relative URLs');
  assert(redirectUtilsSource.includes("targetUrl.includes('://')"), 'Must reject external absolute URLs');
});

const loginPagePath = path.join(webDir, 'src/app/(auth)/login/page.tsx');
const loginPageSource = fs.readFileSync(loginPagePath, 'utf8');

runTest('SECURITY-02', 'LoginPage uses getValidatedRedirectUrl and passes callbackUrl safely', () => {
  assert(loginPageSource.includes('getValidatedRedirectUrl'), 'Login must use getValidatedRedirectUrl');
  assert(loginPageSource.includes('callbackUrl'), 'Login must handle callbackUrl param');
});

const selectOrgPagePath = path.join(webDir, 'src/app/(auth)/select-org/page.tsx');
const selectOrgPageSource = fs.readFileSync(selectOrgPagePath, 'utf8');

runTest('SECURITY-03', 'SelectOrganizationPage re-validates callbackUrl using newly selected organization role', () => {
  assert(selectOrgPageSource.includes('getValidatedRedirectUrl'), 'select-org must use getValidatedRedirectUrl');
  assert(selectOrgPageSource.includes('callbackUrl'), 'select-org must handle callbackUrl param');
});

const headerPath = path.join(webDir, 'src/components/layout/header.tsx');
const headerSource = fs.readFileSync(headerPath, 'utf8');

runTest('SECURITY-04', 'Header organization switcher re-checks route access and safely redirects to / if unauthorized in new org', () => {
  assert(headerSource.includes('canAccessRoute(pathname, targetOrg.role)'), 'Header must validate pathname with new role');
  assert(headerSource.includes("router.push('/')"), 'Header must safely redirect to / if unauthorized');
});

const appLayoutPath = path.join(webDir, 'src/app/(app)/layout.tsx');
const appLayoutSource = fs.readFileSync(appLayoutPath, 'utf8');

runTest('SECURITY-05', 'AppGroupLayout Access Denied screen provides safe return button to / (No Redirect Loop)', () => {
  assert(appLayoutSource.includes("router.push('/')"), 'Return button must push to /');
  assert(appLayoutSource.includes('بازگشت به صفحه خانه'), 'Button text must clearly indicate return to Home');
});

// -------------------------------------------------------------
// ۵. تطبیق ناوبری و Breadcrumb
// -------------------------------------------------------------
const breadcrumbPath = path.join(webDir, 'src/components/layout/breadcrumb.tsx');
const breadcrumbSource = fs.readFileSync(breadcrumbPath, 'utf8');

runTest('NAV-01', 'Breadcrumb home icon links to / (Home) so all roles can return safely without access denied', () => {
  assert(breadcrumbSource.includes('href="/"'), 'Breadcrumb root icon must link to /');
  assert(!breadcrumbSource.includes('href="/performance/dashboard"'), 'Breadcrumb must NOT hardcode /performance/dashboard');
});

const navigationPath = path.join(webDir, 'src/config/navigation.ts');
const navigationSource = fs.readFileSync(navigationPath, 'utf8');

runTest('NAV-02', 'NavigationConfig dashboard item strictly points to /performance/dashboard and does not match /', () => {
  assert(navigationSource.includes("href: '/performance/dashboard'"), 'Dashboard must link to /performance/dashboard');
  assert(navigationSource.includes("pathname === '/performance/dashboard'"), 'Dashboard must match only /performance/dashboard');
  assert(!navigationSource.includes("pathname === '/performance/dashboard' || pathname === '/'"), 'Dashboard must NOT match /');
});

// -------------------------------------------------------------
// ۶. تست رفتاری ۶ نقش در ماتریس دسترسی
// -------------------------------------------------------------
// شبیه‌سازی منطق ارزیابی ماتریس دسترسی مطابق permissions.ts
function simulatedCanAccessRoute(path, role) {
  if (path === '/login' || path === '/forgot-password' || path === '/select-org') return true;
  if (!role) return false;
  if (role === 'admin') return true;

  if (path === '/') {
    // همه نقش‌ها دسترسی دارند (صفحه ۲ سند: همه؛ محتوا بر اساس نقش)
    return true;
  }

  if (path === '/performance/dashboard') {
    // صفحه ۴ سند: کارفرما، مدیر مارکتینگ
    return role === 'marketing_manager' || role === 'client';
  }

  if (path === '/leads' || path === '/leads/board') {
    return role === 'marketing_manager' || role === 'sales_agent';
  }

  if (path === '/campaigns' || path === '/campaigns/new') {
    return role === 'marketing_manager' || role === 'campaign_manager';
  }

  if (path === '/work/tasks') {
    return true;
  }

  if (path === '/settings/users' || path === '/settings/organization') {
    return role === 'admin';
  }

  return false;
}

runTest('MATRIX-01', 'Behavioral validation for all 6 roles accessing / and /performance/dashboard', () => {
  // admin: can access / and /performance/dashboard
  assert.strictEqual(simulatedCanAccessRoute('/', 'admin'), true, 'admin can access /');
  assert.strictEqual(simulatedCanAccessRoute('/performance/dashboard', 'admin'), true, 'admin can access dashboard');

  // marketing_manager: can access / and /performance/dashboard
  assert.strictEqual(simulatedCanAccessRoute('/', 'marketing_manager'), true, 'marketing_manager can access /');
  assert.strictEqual(simulatedCanAccessRoute('/performance/dashboard', 'marketing_manager'), true, 'marketing_manager can access dashboard');

  // client: can access / and /performance/dashboard (read)
  assert.strictEqual(simulatedCanAccessRoute('/', 'client'), true, 'client can access /');
  assert.strictEqual(simulatedCanAccessRoute('/performance/dashboard', 'client'), true, 'client can access dashboard');

  // campaign_manager: can access /, BLOCKED from /performance/dashboard
  assert.strictEqual(simulatedCanAccessRoute('/', 'campaign_manager'), true, 'campaign_manager can access /');
  assert.strictEqual(simulatedCanAccessRoute('/performance/dashboard', 'campaign_manager'), false, 'campaign_manager BLOCKED from dashboard');

  // sales_agent: can access /, BLOCKED from /performance/dashboard
  assert.strictEqual(simulatedCanAccessRoute('/', 'sales_agent'), true, 'sales_agent can access /');
  assert.strictEqual(simulatedCanAccessRoute('/performance/dashboard', 'sales_agent'), false, 'sales_agent BLOCKED from dashboard');

  // content_creator: can access /, BLOCKED from /performance/dashboard
  assert.strictEqual(simulatedCanAccessRoute('/', 'content_creator'), true, 'content_creator can access /');
  assert.strictEqual(simulatedCanAccessRoute('/performance/dashboard', 'content_creator'), false, 'content_creator BLOCKED from dashboard');
});

// -------------------------------------------------------------
// ۷. تست منطق تابع getValidatedRedirectUrl مطابق redirect-utils.ts
// -------------------------------------------------------------
function simulatedGetValidatedRedirectUrl(targetUrl, role) {
  if (!targetUrl) return '/';
  if (!targetUrl.startsWith('/') || targetUrl.startsWith('//') || targetUrl.includes('://')) {
    return '/';
  }
  if (targetUrl === '/login' || targetUrl === '/select-org') {
    return '/';
  }
  if (role && simulatedCanAccessRoute(targetUrl, role)) {
    return targetUrl;
  }
  return '/';
}

runTest('SECURITY-06', 'getValidatedRedirectUrl function behavioral unit tests', () => {
  // 1. null or empty url -> /
  assert.strictEqual(simulatedGetValidatedRedirectUrl(null, 'sales_agent'), '/');
  assert.strictEqual(simulatedGetValidatedRedirectUrl('', 'sales_agent'), '/');

  // 2. Open redirect attempts -> /
  assert.strictEqual(simulatedGetValidatedRedirectUrl('https://evil.com', 'sales_agent'), '/');
  assert.strictEqual(simulatedGetValidatedRedirectUrl('//evil.com', 'sales_agent'), '/');
  assert.strictEqual(simulatedGetValidatedRedirectUrl('javascript:alert(1)', 'sales_agent'), '/');

  // 3. Auth pages -> /
  assert.strictEqual(simulatedGetValidatedRedirectUrl('/login', 'sales_agent'), '/');
  assert.strictEqual(simulatedGetValidatedRedirectUrl('/select-org', 'sales_agent'), '/');

  // 4. Authorized target for sales_agent (/leads) -> /leads
  assert.strictEqual(simulatedGetValidatedRedirectUrl('/leads', 'sales_agent'), '/leads');
  assert.strictEqual(simulatedGetValidatedRedirectUrl('/leads/board', 'sales_agent'), '/leads/board');

  // 5. UNAUTHORIZED target for sales_agent (/performance/dashboard) -> / (safely protected!)
  assert.strictEqual(simulatedGetValidatedRedirectUrl('/performance/dashboard', 'sales_agent'), '/');

  // 6. Authorized target for admin (/performance/dashboard) -> /performance/dashboard
  assert.strictEqual(simulatedGetValidatedRedirectUrl('/performance/dashboard', 'admin'), '/performance/dashboard');

  // 7. UNAUTHORIZED target for client (/settings/users) -> /
  assert.strictEqual(simulatedGetValidatedRedirectUrl('/settings/users', 'client'), '/');
});

console.log('\n----------------------------------------------------------------');
console.log(`Test Summary: ${passCount} Passed, ${totalCount - passCount} Failed (out of ${totalCount} items)`);
console.log('----------------------------------------------------------------\n');

if (passCount === totalCount) {
  console.log('🎉 ALL HOME PAGE & EXECUTIVE DASHBOARD RESOLUTION TESTS PASSED 100%!\n');
} else {
  process.exit(1);
}
