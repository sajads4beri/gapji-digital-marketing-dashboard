import * as fs from 'fs';
import * as path from 'path';

// Automatically load .env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

import { PrismaClient } from '@prisma/client';
import http from 'http';

const API_BASE = 'http://localhost:3001/api';
const prisma = new PrismaClient();

function request(options: { url: string; method?: string; headers?: Record<string, string> }, body: any = null): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  data: any;
}> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(options.url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ statusCode: res.statusCode || 500, headers: res.headers, data });
        });
      },
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function loginUser(identifier: string): Promise<string> {
  const res = await request(
    {
      url: `${API_BASE}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier, password: 'Password123!' },
  );
  if (res.statusCode !== 200 || !res.data.accessToken) {
    throw new Error(`Login failed for ${identifier}: ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken;
}

async function runLeadIntegrationTests() {
  console.log('================================================================');
  console.log('🐘 GAPJI B2.4.1 LEADS BACKEND INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details: string = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate test users
    console.log('--- 1. Authenticating Roles ---');
    const adminToken = await loginUser('admin@gapji.dev');
    const marketingToken = await loginUser('marketing@gapji.dev');
    const salesToken = await loginUser('sales@gapji.dev');
    const campaignToken = await loginUser('campaign@gapji.dev');
    const contentToken = await loginUser('content@gapji.dev');
    const clientToken = await loginUser('client@gapji.dev');
    assert(!!adminToken && !!salesToken && !!campaignToken, 'Tokens retrieved for all test roles');

    // Clean up any previous test leads for isolated runs
    const testPhone = '09129990001';
    const testPhone2 = '09129990002';
    const testPhoneConcurrency = '09129990003';
    const testPhoneStatus = '09129990004';
    const testPhoneAdmin = '09129990005';
    const allTestPhones = [testPhone, testPhone2, testPhoneConcurrency, testPhoneStatus, testPhoneAdmin];
    await prisma.leadActivity.deleteMany({
      where: { lead: { mobile: { in: allTestPhones } } },
    });
    await prisma.lead.deleteMany({
      where: { mobile: { in: allTestPhones } },
    });

    // 2. Unauthenticated rejection
    console.log('\n--- 2. Unauthenticated Request Rejection ---');
    const unauthPost = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { fullName: 'تست', mobile: testPhone });
    assert(unauthPost.statusCode === 401, 'POST /api/leads without token is rejected with 401');

    const unauthGet = await request({ url: `${API_BASE}/leads` });
    assert(unauthGet.statusCode === 401, 'GET /api/leads without token is rejected with 401');

    // 3. Validation and Invalid Input Handling
    console.log('\n--- 3. Validation & Invalid Input Handling ---');
    const emptyName = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, { fullName: '', mobile: testPhone });
    assert(emptyName.statusCode === 400, 'Missing/empty fullName is rejected with 400');

    const invalidPhone = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, { fullName: 'تست نامعتبر', mobile: '12345' });
    assert(invalidPhone.statusCode === 400, 'Invalid phone number format is rejected with 400');

    const invalidEmail = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, { fullName: 'تست ایمیل', mobile: testPhone, email: 'not-an-email' });
    assert(invalidEmail.statusCode === 400, 'Invalid email format is rejected with 400');

    // 4. Successful Lead Creation by Admin & PostgreSQL Persistence
    console.log('\n--- 4. Successful Lead Creation & PostgreSQL Persistence ---');
    const createRes = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, {
      fullName: 'امیررضا علوی',
      mobile: '۰۹۱۲۹۹۹۰۰۰۱', // Test Persian digits normalization
      email: 'reza.alavi@example.com',
      city: 'تهران',
      source: 'manual',
      nextFollowUpNote: 'پیگیری اولیه پکیج',
    });
    assert(createRes.statusCode === 201, 'Admin lead creation returns 201 Created', `Status: ${createRes.statusCode}`);
    assert(createRes.data.fullName === 'امیررضا علوی', 'Returned lead name matches');
    assert(createRes.data.mobile === testPhone, 'Persian phone number normalized to standard 09129990001');
    assert(createRes.data.status === 'new', 'Default status is new');
    const createdLeadId = createRes.data.id;
    assert(!!createdLeadId, 'Lead ID returned');

    // Verify row directly in PostgreSQL
    const dbLead = await prisma.lead.findUnique({
      where: { id: createdLeadId },
      include: { activities: true },
    });
    assert(!!dbLead, 'Lead record successfully persisted in PostgreSQL');
    assert(dbLead?.mobile === testPhone, 'DB mobile matches normalized phone');
    assert(dbLead?.activities.length === 1, 'Initial leadActivity automatically recorded in DB');
    assert(dbLead?.activities[0].type === 'form_submit', 'Activity type is form_submit');

    // 5. Duplicate Phone Rejection & Existing Lead Reference
    console.log('\n--- 5. Duplicate Phone Handling (Page 15 Requirement) ---');
    const duplicateRes = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, {
      fullName: 'امیررضا علوی (تلاش مجدد)',
      mobile: '+989129990001', // Normalized equivalent of testPhone
      email: 'another@example.com',
    });
    assert(duplicateRes.statusCode === 409, 'Duplicate phone returns 409 Conflict', `Status: ${duplicateRes.statusCode}`);
    assert(
      duplicateRes.data.message === 'این شماره قبلاً ثبت شده' ||
      (typeof duplicateRes.data.message === 'object' && duplicateRes.data.message?.message === 'این شماره قبلاً ثبت شده'),
      'Error message matches documented specification: "این شماره قبلاً ثبت شده"',
    );
    const existing = duplicateRes.data.existingLead || duplicateRes.data.message?.existingLead;
    assert(!!existing && existing.id === createdLeadId, 'Duplicate response provides identifier and link target of existing lead');

    // 6. Role Invariants & Restrictions (DEC-AUTH-11)
    console.log('\n--- 6. Role-Based Access Invariants (DEC-AUTH-11) ---');
    // campaign_manager strictly denied
    const campaignLeadCreate = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${campaignToken}` },
    }, { fullName: 'تست کمپین منیجر', mobile: testPhone2 });
    assert(campaignLeadCreate.statusCode === 403, 'campaign_manager is strictly denied POST /api/leads (403)');

    const campaignLeadGet = await request({
      url: `${API_BASE}/leads`,
      method: 'GET',
      headers: { Authorization: `Bearer ${campaignToken}` },
    });
    assert(campaignLeadGet.statusCode === 403, 'campaign_manager is strictly denied GET /api/leads (403)');

    // client strictly denied
    const clientLeadGet = await request({
      url: `${API_BASE}/leads`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assert(clientLeadGet.statusCode === 403, 'client is strictly denied GET /api/leads (403)');

    // content_creator strictly denied
    const contentLeadGet = await request({
      url: `${API_BASE}/leads`,
      method: 'GET',
      headers: { Authorization: `Bearer ${contentToken}` },
    });
    assert(contentLeadGet.statusCode === 403, 'content_creator is strictly denied GET /api/leads (403)');

    // 7. Sales Agent Ownership & Creation Behavior
    console.log('\n--- 7. Sales Agent Ownership Enforcement ---');
    // Sales agent creating a lead
    const salesCreate = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
    }, {
      fullName: 'لید کارشناس فروش',
      mobile: testPhone2,
      assignedToId: '10000000-0000-0000-0000-000000000001', // Attempting to assign to admin
    });
    console.log('salesCreate response:', salesCreate.statusCode, salesCreate.data);
    assert(salesCreate.statusCode === 201, 'Sales agent lead creation succeeds with 201');
    const salesUserId = '10000000-0000-0000-0000-000000000004'; // sales@gapji.dev
    assert(salesCreate.data.assignedToId === salesUserId, 'Sales agent lead is strictly assigned to the sales agent themselves');

    // Sales agent listing leads: should only see their own assigned lead, NOT admin's unassigned lead
    const salesList = await request({
      url: `${API_BASE}/leads`,
      method: 'GET',
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert(salesList.statusCode === 200, 'Sales agent GET /api/leads returns 200');
    assert(
      Array.isArray(salesList.data) && salesList.data.every((l: any) => l.assignedToId === salesUserId),
      'Sales agent inbox list strictly limited to assignedToId === user.id',
    );
    assert(
      salesList.data.some((l: any) => l.id === salesCreate.data.id),
      'Sales agent sees their newly created lead in their inbox',
    );
    assert(
      !salesList.data.some((l: any) => l.id === createdLeadId),
      'Sales agent CANNOT see leads not assigned to them',
    );

    // Sales agent accessing another rep's lead via GET /api/leads/:id
    const crossAccess = await request({
      url: `${API_BASE}/leads/${createdLeadId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert(crossAccess.statusCode === 403, 'Sales agent access to unassigned / other lead detail returns 403 Forbidden');

    // Sales agent accessing their own lead
    const ownAccess = await request({
      url: `${API_BASE}/leads/${salesCreate.data.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert(ownAccess.statusCode === 200, 'Sales agent access to own lead returns 200 OK');

    // 8. Marketing Manager Full Access
    console.log('\n--- 8. Marketing Manager Authorization ---');
    const managerList = await request({
      url: `${API_BASE}/leads`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingToken}` },
    });
    assert(managerList.statusCode === 200, 'Marketing manager GET /api/leads returns 200');
    assert(managerList.data.length >= 2, 'Marketing manager can view all organization leads');

    // 9. Assignees Listing Endpoint
    console.log('\n--- 9. Active Assignees Listing ---');
    const assigneesRes = await request({
      url: `${API_BASE}/leads/assignees`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(assigneesRes.statusCode === 200, 'GET /api/leads/assignees returns 200');
    assert(Array.isArray(assigneesRes.data) && assigneesRes.data.length > 0, 'Assignees returned as active members list');

    // 10. Concurrency & Race Condition Safety (Advisory Lock)
    console.log('\n--- 10. True Concurrent Creation with Same Phone (Race Condition Test) ---');
    const concurrentPhone = testPhoneConcurrency;
    const concurrentRequests = await Promise.all([
      request({
        url: `${API_BASE}/leads`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      }, { fullName: 'هم‌زمان ۱', mobile: concurrentPhone }),
      request({
        url: `${API_BASE}/leads`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      }, { fullName: 'هم‌زمان ۲', mobile: concurrentPhone }),
      request({
        url: `${API_BASE}/leads`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      }, { fullName: 'هم‌زمان ۳', mobile: concurrentPhone }),
      request({
        url: `${API_BASE}/leads`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      }, { fullName: 'هم‌زمان ۴', mobile: concurrentPhone }),
      request({
        url: `${API_BASE}/leads`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      }, { fullName: 'هم‌زمان ۵', mobile: concurrentPhone }),
    ]);

    const createdCount = concurrentRequests.filter((r) => r.statusCode === 201).length;
    const conflictCount = concurrentRequests.filter((r) => r.statusCode === 409).length;

    assert(createdCount === 1, 'Exactly 1 request succeeded with 201 Created under concurrent execution', `Got ${createdCount}`);
    assert(conflictCount === 4, 'Remaining 4 concurrent requests safely rejected with 409 Conflict', `Got ${conflictCount}`);

    // --- B2.4.2 Lead Status Update & Lifecycle Tests ---
    console.log('\n--- 11. Lead Status Update Authentication & Validation ---');
    const statusLeadRes = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, {
      fullName: 'لید تست تغییر وضعیت',
      mobile: testPhoneStatus,
      assignedToId: salesUserId,
    });
    assert(statusLeadRes.statusCode === 201, 'Created dedicated test lead for status lifecycle tests');
    const statusLeadId = statusLeadRes.data.id;

    // Unauthenticated status update
    const unauthStatus = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }, { status: 'in_progress' });
    assert(unauthStatus.statusCode === 401, 'PATCH /api/leads/:id/status without token is rejected with 401');

    // Invalid status value
    const invalidStatusVal = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, { status: 'non_existent_status' });
    assert(invalidStatusVal.statusCode === 400, 'Invalid status value rejected with 400 Bad Request');

    // Negative deal value
    const negativeDeal = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, { status: 'won', dealValue: -5000 });
    assert(negativeDeal.statusCode === 400, 'Negative deal value rejected with 400 Bad Request');

    // Non-existent lead ID
    const notFoundStatus = await request({
      url: `${API_BASE}/leads/00000000-0000-0000-0000-000000000999/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, { status: 'in_progress' });
    assert(notFoundStatus.statusCode === 404, 'Non-existent lead ID returns 404 Not Found');

    // Unauthorized roles
    const campaignStatus = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${campaignToken}` },
    }, { status: 'in_progress' });
    assert(campaignStatus.statusCode === 403, 'Campaign manager PATCH status rejected with 403 Forbidden');

    const clientStatus = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
    }, { status: 'in_progress' });
    assert(clientStatus.statusCode === 403, 'Client role PATCH status rejected with 403 Forbidden');

    console.log('\n--- 12. Sales Agent Role & Ownership Enforcement on Status Change ---');
    // Create lead assigned to Admin (NOT assigned to Sales Agent)
    const adminAssignedLead = await request({
      url: `${API_BASE}/leads`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, {
      fullName: 'لید منتسب به ادمین',
      mobile: testPhoneAdmin,
      assignedToId: '10000000-0000-0000-0000-000000000001',
    });
    assert(adminAssignedLead.statusCode === 201, 'Created admin-assigned lead');

    // Sales agent trying to update admin-assigned lead
    const salesUnauthorizedUpdate = await request({
      url: `${API_BASE}/leads/${adminAssignedLead.data.id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
    }, { status: 'in_progress' });
    assert(salesUnauthorizedUpdate.statusCode === 403, 'Sales agent forbidden from updating another rep/admin lead (403)');

    // Sales agent updating lead assigned to themselves
    const salesOwnUpdate = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
    }, { status: 'in_progress' });
    assert(salesOwnUpdate.statusCode === 200, 'Sales agent successfully updates status of own assigned lead (200 OK)');
    assert(salesOwnUpdate.data.status === 'in_progress', 'Returned lead data reflects new status in_progress');

    console.log('\n--- 13. Persistent Status Lifecycle & Field Persistence ---');
    // Update to qualified
    const qualifiedUpdate = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
    }, { status: 'qualified', note: 'مشتری شرایط لازم را دارد' });
    assert(qualifiedUpdate.statusCode === 200, 'Update to qualified succeeds with 200 OK');
    assert(qualifiedUpdate.data.status === 'qualified', 'Status updated to qualified');

    // Update to proposal
    const proposalUpdate = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
    }, { status: 'proposal' });
    assert(proposalUpdate.statusCode === 200, 'Update to proposal succeeds with 200 OK');

    // Update to won with dealValue
    const wonUpdate = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
    }, { status: 'won', dealValue: 18500000 });
    assert(wonUpdate.statusCode === 200, 'Update to won with dealValue succeeds with 200 OK');
    assert(wonUpdate.data.status === 'won', 'Status is won');
    assert(wonUpdate.data.estimatedValue === 18500000, 'estimatedValue is persisted and returned as 18,500,000 Toman');

    // Verify directly in PostgreSQL
    const dbLeadWon = await prisma.lead.findUnique({ where: { id: statusLeadId } });
    assert(dbLeadWon?.statusKey === 'won', 'Direct DB check: lead statusKey is won in PostgreSQL');
    assert(Number(dbLeadWon?.salesValue) === 18500000, 'Direct DB check: lead salesValue is 18500000 in PostgreSQL');

    // Update to lost with lostReason
    const lostUpdate = await request({
      url: `${API_BASE}/leads/${statusLeadId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
    }, { status: 'lost', lostReason: 'محدودیت بودجه در این فصل مالی' });
    assert(lostUpdate.statusCode === 200, 'Update to lost with lostReason succeeds with 200 OK');
    assert(lostUpdate.data.status === 'lost', 'Status is lost');
    assert(lostUpdate.data.lostReason === 'محدودیت بودجه در این فصل مالی', 'lostReason returned in API response');

    // Direct DB check for lost
    const dbLeadLost = await prisma.lead.findUnique({ where: { id: statusLeadId } });
    assert(dbLeadLost?.statusKey === 'lost', 'Direct DB check: lead statusKey is lost');
    assert(dbLeadLost?.lostReason === 'محدودیت بودجه در این فصل مالی', 'Direct DB check: lostReason persisted in DB');

    console.log('\n--- 14. Activity History & Timeline Persistence ---');
    // Check activities in DB
    const dbActivities = await prisma.leadActivity.findMany({
      where: { leadId: statusLeadId },
      orderBy: { createdAt: 'asc' },
    });
    assert(dbActivities.length >= 5, `Database has ${dbActivities.length} activities logged for statusLead (initial + 4 status transitions)`);
    const statusChangeActs = dbActivities.filter((a) => a.type === 'status_change');
    assert(statusChangeActs.length >= 4, 'All 4 status transitions recorded as status_change type');

    // GET /api/leads/:id/activities endpoint test
    const activitiesRes = await request({
      url: `${API_BASE}/leads/${statusLeadId}/activities`,
      method: 'GET',
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert(activitiesRes.statusCode === 200, 'GET /api/leads/:id/activities returns 200 OK');
    assert(Array.isArray(activitiesRes.data), 'Activities returned as array');
    assert(activitiesRes.data.length >= 5, 'Activities count matches database records');
    assert(activitiesRes.data[0].type === 'status_change', 'Most recent activity is status_change');
    assert(!!activitiesRes.data[0].metadata?.toStatus, 'Metadata contains toStatus');
    assert(!!activitiesRes.data[0].actor?.name, 'Activity actor name is populated');

    // Unauthorized access to activities for sales agent on another rep's lead
    const unauthorizedActs = await request({
      url: `${API_BASE}/leads/${adminAssignedLead.data.id}/activities`,
      method: 'GET',
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    assert(unauthorizedActs.statusCode === 403, 'Sales agent forbidden from viewing activities of another lead (403)');

    // Marketing manager can view activities of any lead
    const managerActs = await request({
      url: `${API_BASE}/leads/${adminAssignedLead.data.id}/activities`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingToken}` },
    });
    assert(managerActs.statusCode === 200, 'Marketing manager can view activities of any lead (200 OK)');

    // Clean up test records
    await prisma.leadActivity.deleteMany({
      where: { lead: { mobile: { in: allTestPhones } } },
    });
    await prisma.lead.deleteMany({
      where: { mobile: { in: allTestPhones } },
    });

    console.log('\n================================================================');
    console.log(`LEADS INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    await prisma.$disconnect();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runLeadIntegrationTests();
