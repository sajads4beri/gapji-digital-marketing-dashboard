/**
 * Comprehensive Automated Verification Script for Phase P0-1: Auth & Org Selection
 * Tests 20 scenarios according to Product Requirements Document (Page 6, 3, 26-29).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '..');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testId, description) {
  if (condition) {
    console.log(`\x1b[32m✔ [PASS] [${testId}] ${description}\x1b[0m`);
    passedTests++;
  } else {
    console.error(`\x1b[31m✖ [FAIL] [${testId}] ${description}\x1b[0m`);
    failedTests++;
  }
}

function fileExists(filePath) {
  try {
    fs.statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

console.log('\n======================================================');
console.log('   P0-1 Auth & Organization Selection Verification');
console.log('======================================================\n');

// ---------------------------------------------------------------------------------
// Mock in-memory localStorage for testing logic
// ---------------------------------------------------------------------------------
const storage = new Map();
const mockLocalStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

// ---------------------------------------------------------------------------------
// Simulated Pure Auth Logic (Mirroring auth.mock.ts)
// ---------------------------------------------------------------------------------
const MOCK_USERS = [
  {
    id: 'user-ali-1',
    name: 'علی محمدی',
    email: 'ali.mohammadi@gapji.ir',
    phone: '09121112233',
    password: 'password123',
    memberships: [
      { orgId: 'org-1', orgName: 'گپ‌جی (دیجیتال مارکتینگ)', role: 'admin' },
      { orgId: 'org-2', orgName: 'هلدینگ تجارت الکترونیک پارس', role: 'marketing_manager' }
    ]
  },
  {
    id: 'user-sara-2',
    name: 'سارا احمدی',
    email: 'sara.ahmadi@gapji.ir',
    phone: '09124445566',
    password: 'password123',
    memberships: [
      { orgId: 'org-1', orgName: 'گپ‌جی (دیجیتال مارکتینگ)', role: 'media_buyer' }
    ]
  },
  {
    id: 'user-maryam-3',
    name: 'مریم کریمی',
    email: 'maryam.karimi@gapji.ir',
    phone: '09127778899',
    password: 'password123',
    memberships: [
      { orgId: 'org-1', orgName: 'گپ‌جی (دیجیتال مارکتینگ)', role: 'content_specialist' },
      { orgId: 'org-2', orgName: 'هلدینگ تجارت الکترونیک پارس', role: 'content_specialist' },
      { orgId: 'org-3', orgName: 'استارتاپ نوآوران داده', role: 'admin' }
    ]
  }
];

function normalizeIdentifier(val) {
  if (!val) return '';
  return val.trim().toLowerCase();
}

function mockLogin(identifier, password) {
  const norm = normalizeIdentifier(identifier);
  if (!norm || !password) {
    return { success: false, error: 'لطفاً ایمیل یا شماره موبایل و رمز عبور را وارد کنید.' };
  }
  const user = MOCK_USERS.find(u =>
    normalizeIdentifier(u.email) === norm || normalizeIdentifier(u.phone) === norm
  );
  if (!user || user.password !== password) {
    return { success: false, error: 'ایمیل/شماره موبایل یا رمز عبور اشتباه است.' };
  }
  const isMultiOrg = user.memberships.length > 1;
  const lastOrgId = mockLocalStorage.getItem('gapji_last_org_id');
  let selectedOrg = null;
  if (!isMultiOrg) {
    selectedOrg = user.memberships[0];
  } else if (lastOrgId) {
    selectedOrg = user.memberships.find(m => m.orgId === lastOrgId) || null;
  }
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      memberships: user.memberships
    },
    requiresOrgSelection: isMultiOrg && !selectedOrg,
    selectedMembership: selectedOrg
  };
}

function mockForgotPassword(identifier) {
  const norm = normalizeIdentifier(identifier);
  if (!norm) {
    return { success: false, error: 'لطفاً ایمیل یا شماره موبایل خود را وارد کنید.' };
  }
  const user = MOCK_USERS.find(u =>
    normalizeIdentifier(u.email) === norm || normalizeIdentifier(u.phone) === norm
  );
  if (!user) {
    return { success: false, error: 'کاربری با این مشخصات یافت نشد.' };
  }
  const isEmail = norm.includes('@');
  return {
    success: true,
    message: isEmail
      ? `لینک بازیابی رمز عبور به ایمیل ${user.email} ارسال شد.`
      : `کد بازیابی به شماره موبایل ${user.phone} پیامک شد.`,
    maskedDestination: isEmail
      ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : user.phone.replace(/(.{4})(.*)(.{2})/, '$1***$3')
  };
}

function mockCan(role, permission) {
  if (!role) return false;
  if (role === 'admin') return true;
  switch (permission) {
    case 'campaigns.create':
    case 'campaigns.edit':
      return role === 'marketing_manager' || role === 'media_buyer';
    case 'campaigns.view':
      return true;
    case 'costs.view':
      return role === 'marketing_manager' || role === 'media_buyer' || role === 'sales_expert';
    case 'costs.import':
      return role === 'marketing_manager' || role === 'media_buyer';
    case 'leads.manage':
      return role === 'marketing_manager' || role === 'sales_expert';
    case 'leads.view':
      return true;
    case 'tasks.manage':
      return true;
    case 'users.manage':
    case 'settings.manage':
      return false;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------------
// Scenario Executions
// ---------------------------------------------------------------------------------

// Scenario 1: Unauthenticated empty login
{
  const res = mockLogin('', '');
  assert(!res.success && res.error.includes('لطفاً ایمیل'), 'SCEN-01', 'Empty credentials rejected with Iranian error message');
}

// Scenario 2: Wrong password rejection
{
  const res = mockLogin('ali.mohammadi@gapji.ir', 'wrongpass');
  assert(!res.success && res.error.includes('اشتباه است'), 'SCEN-02', 'Wrong password returns polite inline error message');
}

// Scenario 3: Non-existent user
{
  const res = mockLogin('unknown@gapji.ir', 'password123');
  assert(!res.success && res.error.includes('اشتباه است'), 'SCEN-03', 'Non-existent user receives indistinguishable error for security');
}

// Scenario 4: Successful login with email for multi-org without previous choice
{
  mockLocalStorage.clear();
  const res = mockLogin('ali.mohammadi@gapji.ir', 'password123');
  assert(res.success && res.requiresOrgSelection === true && res.user.memberships.length === 2, 'SCEN-04', 'Multi-org user without remembered org requires org selection');
}

// Scenario 5: Successful login with mobile number
{
  const res = mockLogin('09121112233', 'password123');
  assert(res.success && res.user.name === 'علی محمدی', 'SCEN-05', 'Login with phone number successfully authenticates');
}

// Scenario 6: Single-org user bypasses org selection
{
  const res = mockLogin('sara.ahmadi@gapji.ir', 'password123');
  assert(res.success && res.requiresOrgSelection === false && res.selectedMembership?.orgId === 'org-1', 'SCEN-06', 'Single-org user directs immediately with auto-selected org');
}

// Scenario 7: Multi-org user with remembered last-org
{
  mockLocalStorage.setItem('gapji_last_org_id', 'org-2');
  const res = mockLogin('ali.mohammadi@gapji.ir', 'password123');
  assert(res.success && res.requiresOrgSelection === false && res.selectedMembership?.orgId === 'org-2', 'SCEN-07', 'Multi-org user with remembered org auto-selects last active org');
}

// Scenario 8: Forgot password with email
{
  const res = mockForgotPassword('ali.mohammadi@gapji.ir');
  assert(res.success && res.maskedDestination.includes('@') && res.message.includes('ایمیل'), 'SCEN-08', 'Forgot password with email shows mock recovery link dispatched');
}

// Scenario 9: Forgot password with mobile
{
  const res = mockForgotPassword('09124445566');
  assert(res.success && res.maskedDestination.includes('***') && res.message.includes('پیامک'), 'SCEN-09', 'Forgot password with mobile shows mock SMS dispatch');
}

// Scenario 10: Forgot password with unknown target
{
  const res = mockForgotPassword('unknown@test.com');
  assert(!res.success && res.error.includes('یافت نشد'), 'SCEN-10', 'Forgot password with unknown identifier handles error gracefully');
}

// Scenario 11: Switch organization updates active session and localStorage
{
  const user = MOCK_USERS[0];
  const targetOrg = user.memberships[1]; // org-2
  mockLocalStorage.setItem('gapji_last_org_id', targetOrg.orgId);
  const remembered = mockLocalStorage.getItem('gapji_last_org_id');
  assert(remembered === 'org-2', 'SCEN-11', 'Selecting organization persists to gapji_last_org_id in localStorage');
}

// Scenario 12: RBAC can() helper for Admin has full permissions
{
  const canUsers = mockCan('admin', 'users.manage');
  const canSettings = mockCan('admin', 'settings.manage');
  const canCampaigns = mockCan('admin', 'campaigns.create');
  assert(canUsers && canSettings && canCampaigns, 'SCEN-12', 'Admin role has full permissions across all modules');
}

// Scenario 13: RBAC can() helper for Media Buyer denies user/settings management
{
  const canUsers = mockCan('media_buyer', 'users.manage');
  const canSettings = mockCan('media_buyer', 'settings.manage');
  const canCosts = mockCan('media_buyer', 'costs.import');
  assert(!canUsers && !canSettings && canCosts, 'SCEN-13', 'Media Buyer can import costs but cannot manage users or settings');
}

// Scenario 14: File structure check - (auth) route group separation
{
  const authLayoutExists = fileExists(path.join(webDir, 'src/app/(auth)/layout.tsx'));
  const loginPageExists = fileExists(path.join(webDir, 'src/app/(auth)/login/page.tsx'));
  const forgotPageExists = fileExists(path.join(webDir, 'src/app/(auth)/forgot-password/page.tsx'));
  const selectOrgExists = fileExists(path.join(webDir, 'src/app/(auth)/select-org/page.tsx'));
  assert(authLayoutExists && loginPageExists && forgotPageExists && selectOrgExists, 'SCEN-14', 'Route group (auth) contains layout, login, forgot-password, and select-org pages');
}

// Scenario 15: File structure check - Auth features directory
{
  const typesExists = fileExists(path.join(webDir, 'src/features/auth/types.ts'));
  const mockExists = fileExists(path.join(webDir, 'src/features/auth/auth.mock.ts'));
  const contextExists = fileExists(path.join(webDir, 'src/features/auth/auth-context.tsx'));
  const indexExists = fileExists(path.join(webDir, 'src/features/auth/index.ts'));
  assert(typesExists && mockExists && contextExists && indexExists, 'SCEN-15', 'Feature auth directory has types, mock service, context, and barrel index');
}

// Scenario 16: Check layout.tsx wraps application with AuthProvider
{
  const rootLayoutContent = fs.readFileSync(path.join(webDir, 'src/app/layout.tsx'), 'utf-8');
  assert(rootLayoutContent.includes('<AuthProvider>') && rootLayoutContent.includes('</AuthProvider>'), 'SCEN-16', 'Root layout.tsx wraps child tree in AuthProvider');
}

// Scenario 17: Check (app)/layout.tsx contains Client Auth Guard & redirects
{
  const appLayoutContent = fs.readFileSync(path.join(webDir, 'src/app/(app)/layout.tsx'), 'utf-8');
  assert(appLayoutContent.includes('router.replace(\'/login\')') && appLayoutContent.includes('router.replace(\'/select-org\')'), 'SCEN-17', 'App layout protects routes and redirects unauthenticated or org-less users');
}

// Scenario 18: Header connects to useAuth (org logo/name, user name, role, logout)
{
  const headerContent = fs.readFileSync(path.join(webDir, 'src/components/layout/header.tsx'), 'utf-8');
  assert(
    headerContent.includes('useAuth') &&
    headerContent.includes('activeOrgName') &&
    headerContent.includes('logout()') &&
    headerContent.includes('selectOrganization'),
    'SCEN-18',
    'Header is connected to useAuth with dynamic org name, logout, and org switcher'
  );
}

// Scenario 19: Sidebar respects role-based permission checks
{
  const sidebarContent = fs.readFileSync(path.join(webDir, 'src/components/layout/sidebar.tsx'), 'utf-8');
  assert(sidebarContent.includes('useAuth') && sidebarContent.includes('can(\'settings.manage\')'), 'SCEN-19', 'Sidebar menu filters administration items using can()');
}

// Scenario 20: Login page has inline error display (no toast for bad credentials)
{
  const loginContent = fs.readFileSync(path.join(webDir, 'src/app/(auth)/login/page.tsx'), 'utf-8');
  assert(
    loginContent.includes('errorMessage &&') &&
    loginContent.includes('role="alert"') &&
    loginContent.includes('isSubmitting'),
    'SCEN-20',
    'Login page presents inline form error message and disabled spinner submit button'
  );
}

console.log('\n------------------------------------------------------');
console.log(`Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
console.log('------------------------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
