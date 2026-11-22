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

async function loginUser(identifier: string): Promise<{ token: string; user: any }> {
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
  return { token: res.data.accessToken, user: res.data.user };
}

async function runCostIntegrationTests() {
  console.log('================================================================');
  console.log('💰 GAPJI B2.4.4 ADVERTISING COSTS BACKEND INTEGRATION TEST SUITE');
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
    // 1. Authenticate users
    console.log('--- 1. Authenticating Roles ---');
    const adminAuth = await loginUser('admin@gapji.dev');
    const marketingAuth = await loginUser('marketing@gapji.dev');
    const campaignManagerAuth = await loginUser('campaign@gapji.dev');
    const salesAuth = await loginUser('sales@gapji.dev');
    const contentAuth = await loginUser('content@gapji.dev');
    const clientAuth = await loginUser('client@gapji.dev');

    assert(
      !!adminAuth.token && !!marketingAuth.token && !!campaignManagerAuth.token &&
      !!salesAuth.token && !!contentAuth.token && !!clientAuth.token,
      'Tokens retrieved for all roles',
    );

    // 2. Unauthenticated Rejection
    console.log('\n--- 2. Unauthenticated Request Rejection ---');
    const unauthPost = await request({ url: `${API_BASE}/costs`, method: 'POST' }, { title: 'Test' });
    assert(unauthPost.statusCode === 401, 'POST /api/costs without token is rejected with 401');

    const unauthGet = await request({ url: `${API_BASE}/costs`, method: 'GET' });
    assert(unauthGet.statusCode === 401, 'GET /api/costs without token is rejected with 401');

    const unauthStats = await request({ url: `${API_BASE}/costs/stats`, method: 'GET' });
    assert(unauthStats.statusCode === 401, 'GET /api/costs/stats without token is rejected with 401');

    // 3. Validation & Invalid Input Handling
    console.log('\n--- 3. Validation & Invalid Input Handling ---');
    const missingTitle = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      { amount: 5000000, date: '2026-11-10', category: 'ad_media' },
    );
    assert(missingTitle.statusCode === 400, 'Missing cost title is rejected with 400 Bad Request');

    const negativeAmount = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      { title: 'شارژ تستی منفی', amount: -50000, date: '2026-11-10', category: 'ad_media' },
    );
    assert(negativeAmount.statusCode === 400, 'Negative amount is rejected with 400 Bad Request');

    const invalidDate = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      { title: 'شارژ با تاریخ نامعتبر', amount: 5000000, date: 'not-a-date', category: 'ad_media' },
    );
    assert(invalidDate.statusCode === 400, 'Invalid date format is rejected with 400 Bad Request');

    const invalidUuid = await request({
      url: `${API_BASE}/costs/invalid-uuid`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(invalidUuid.statusCode === 400, 'Invalid UUID parameter is rejected with 400 Bad Request');

    const notFoundUuid = await request({
      url: `${API_BASE}/costs/00000000-0000-0000-0000-000000000099`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(notFoundUuid.statusCode === 404, 'Non-existent UUID returns 404 Not Found');

    // 4. Role-Based Access Enforcement
    console.log('\n--- 4. Role-Based Access Enforcement (DEC-AUTH-11 & Product PDF) ---');
    // sales_agent forbidden
    const salesPost = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesAuth.token}` },
      },
      { title: 'هزینه غیرمجاز فروش', amount: 1000000, date: '2026-11-10', category: 'ad_media' },
    );
    assert(salesPost.statusCode === 403, 'sales_agent role is strictly forbidden from POST /api/costs (403)');

    const salesGet = await request({
      url: `${API_BASE}/costs`,
      method: 'GET',
      headers: { Authorization: `Bearer ${salesAuth.token}` },
    });
    assert(salesGet.statusCode === 403, 'sales_agent role is strictly forbidden from GET /api/costs (403)');

    // content_creator forbidden
    const contentPost = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${contentAuth.token}` },
      },
      { title: 'هزینه غیرمجاز تولید محتوا', amount: 1000000, date: '2026-11-10', category: 'content_production' },
    );
    assert(contentPost.statusCode === 403, 'content_creator role is strictly forbidden from POST /api/costs (403)');

    const contentGet = await request({
      url: `${API_BASE}/costs`,
      method: 'GET',
      headers: { Authorization: `Bearer ${contentAuth.token}` },
    });
    assert(contentGet.statusCode === 403, 'content_creator role is strictly forbidden from GET /api/costs (403)');

    // client read-only permission (can read, cannot create/update/delete)
    const clientPost = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientAuth.token}` },
      },
      { title: 'هزینه غیرمجاز کارفرما', amount: 1000000, date: '2026-11-10', category: 'ad_media' },
    );
    assert(clientPost.statusCode === 403, 'client role is strictly forbidden from POST /api/costs (403)');

    const clientGet = await request({
      url: `${API_BASE}/costs`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientAuth.token}` },
    });
    assert(clientGet.statusCode === 200, 'client role can successfully read costs via GET /api/costs (200)');

    // 5. Campaign Association & Cross-Tenant Protection
    console.log('\n--- 5. Campaign Association & Cross-Tenant Protection ---');
    // Create a real campaign in Org 1
    const testCampaign = await prisma.campaign.create({
      data: {
        organizationId: marketingAuth.user.organizationId,
        name: 'کمپین تست انتساب هزینه',
        channel: 'گوگل ادز',
        budget: 100000000,
        spend: 0,
        ownerId: marketingAuth.user.id,
      },
    });

    // Attempt to associate cost with campaign from Org 2 (cross-tenant attack)
    const crossTenantCampaign = await prisma.campaign.create({
      data: {
        organizationId: '00000000-0000-0000-0000-000000000002',
        name: 'کمپین سازمان ۲',
        channel: 'اینستاگرام',
        budget: 50000000,
        spend: 0,
      },
    });

    const crossTenantCost = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      {
        title: 'تلاش انتساب متقابل غیرمجاز',
        amount: 5000000,
        date: '2026-11-10',
        category: 'ad_media',
        campaignId: crossTenantCampaign.id,
      },
    );
    assert(
      crossTenantCost.statusCode === 400,
      'Associating cost with another organization campaign is strictly rejected with 400 Bad Request',
    );

    // 6. Successful Cost Creation & PostgreSQL Persistence
    console.log('\n--- 6. Successful Cost Creation & PostgreSQL Persistence ---');
    const costPayload = {
      title: 'شارژ حساب گوگل ادز — آژانس دیجیتال',
      category: 'ad_media',
      channel: 'google_ads',
      campaignId: testCampaign.id,
      amount: 25000000,
      currency: 'TOMAN',
      exchangeRate: 1,
      date: '2026-11-10',
      vendor: 'نمایندگی رسمی گوگل ادز',
      invoiceNumber: 'INV-2026-9041',
      status: 'paid',
      notes: 'تراکنش موفق بانکی بابت شارژ اکانت اختصاصی',
    };

    const createRes = await request(
      {
        url: `${API_BASE}/costs`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      costPayload,
    );

    assert(createRes.statusCode === 201, 'Marketing Manager cost creation returns 201 Created');
    assert(createRes.data.title === costPayload.title, 'Returned cost title matches');
    assert(createRes.data.amount === costPayload.amount, 'Returned cost amount matches');
    assert(createRes.data.normalizedAmountToman === 25000000, 'Computed normalizedAmountToman is 25,000,000');
    assert(createRes.data.campaignId === testCampaign.id, 'Returned campaignId matches');
    assert(createRes.data.campaignName === testCampaign.name, 'Returned campaignName resolved correctly');
    assert(createRes.data.status === 'paid', 'Returned status is paid');
    const costId = createRes.data.id;
    assert(Boolean(costId), 'Cost ID generated and returned');

    // Direct PostgreSQL inspection
    const dbCost = await prisma.cost.findUnique({
      where: { id: costId },
      include: { campaign: true },
    });
    assert(Boolean(dbCost), 'Cost physically exists in PostgreSQL costs table');
    assert(Number(dbCost?.amount) === 25000000, 'PostgreSQL amount matches Decimal');
    assert(dbCost?.organizationId === marketingAuth.user.organizationId, 'PostgreSQL organizationId derived strictly from JWT context');
    assert(dbCost?.createdById === marketingAuth.user.id, 'PostgreSQL createdById assigned to user');

    // Check Campaign.spend synchronization in PostgreSQL
    const updatedCampaign = await prisma.campaign.findUnique({ where: { id: testCampaign.id } });
    assert(Number(updatedCampaign?.spend) === 25000000, 'Campaign.spend in PostgreSQL automatically synced to 25,000,000');

    // 7. Cost Retrieval (List, Detail & Filter)
    console.log('\n--- 7. Cost Retrieval (List, Detail & Filter) ---');
    const detailRes = await request({
      url: `${API_BASE}/costs/${costId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(detailRes.statusCode === 200, 'GET /api/costs/:id returns 200 OK');
    assert(detailRes.data.id === costId, 'Detail ID matches');
    assert(detailRes.data.vendor === costPayload.vendor, 'Detail vendor matches');
    assert(detailRes.data.invoiceNumber === costPayload.invoiceNumber, 'Detail invoiceNumber matches');

    const listRes = await request({
      url: `${API_BASE}/costs`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(listRes.statusCode === 200, 'GET /api/costs returns 200 OK');
    assert(Array.isArray(listRes.data), 'Returns array of costs');
    const foundInList = listRes.data.find((c: any) => c.id === costId);
    assert(Boolean(foundInList), 'Newly created cost is present in list');

    // Filter by campaign
    const filterRes = await request({
      url: `${API_BASE}/costs?campaignId=${testCampaign.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(filterRes.statusCode === 200, 'GET /api/costs?campaignId returns 200 OK');
    assert(filterRes.data.every((c: any) => c.campaignId === testCampaign.id), 'All returned items match campaignId');

    // 8. Cost Update Lifecycle
    console.log('\n--- 8. Cost Update Lifecycle ---');
    const updateRes = await request(
      {
        url: `${API_BASE}/costs/${costId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      {
        amount: 30000000,
        status: 'pending',
        notes: 'تغییر مبلغ به ۳۰ میلیون تومان',
      },
    );
    assert(updateRes.statusCode === 200, 'PATCH /api/costs/:id returns 200 OK');
    assert(updateRes.data.amount === 30000000, 'Updated amount is 30,000,000');
    assert(updateRes.data.status === 'pending', 'Updated status is pending');

    // Confirm Campaign.spend updated
    const campAfterUpdate = await prisma.campaign.findUnique({ where: { id: testCampaign.id } });
    assert(Number(campAfterUpdate?.spend) === 30000000, 'Campaign.spend updated to 30,000,000');

    // 9. Cost Statistics
    console.log('\n--- 9. Cost Statistics Endpoint ---');
    const statsRes = await request({
      url: `${API_BASE}/costs/stats`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(statsRes.statusCode === 200, 'GET /api/costs/stats returns 200 OK');
    assert(typeof statsRes.data.totalSpendToman === 'number' && statsRes.data.totalSpendToman >= 30000000, 'totalSpendToman is calculated');
    assert(typeof statsRes.data.directAdSpendToman === 'number', 'directAdSpendToman is calculated');
    assert(typeof statsRes.data.pendingInvoicesAmountToman === 'number', 'pendingInvoicesAmountToman is calculated');
    assert(Array.isArray(statsRes.data.spendByCampaign), 'spendByCampaign is returned as array');

    // 10. Cost Deletion Lifecycle
    console.log('\n--- 10. Cost Deletion Lifecycle ---');
    // Client forbidden
    const clientDel = await request({
      url: `${API_BASE}/costs/${costId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientAuth.token}` },
    });
    assert(clientDel.statusCode === 403, 'client role cannot DELETE /api/costs/:id (403)');

    // Marketing manager deletes
    const deleteRes = await request({
      url: `${API_BASE}/costs/${costId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(deleteRes.statusCode === 200, 'DELETE /api/costs/:id returns 200 OK');

    const dbAfterDel = await prisma.cost.findUnique({ where: { id: costId } });
    assert(dbAfterDel === null, 'Cost is physically deleted from PostgreSQL');

    const campAfterDel = await prisma.campaign.findUnique({ where: { id: testCampaign.id } });
    assert(Number(campAfterDel?.spend) === 0, 'Campaign.spend automatically reduced to 0 after cost deletion');

    // 11. Batch Import
    console.log('\n--- 11. Batch Import ---');
    const batchRes = await request(
      {
        url: `${API_BASE}/costs/batch`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      [
        { title: 'ایمپورت ۱', category: 'ad_media', amount: 5000000, date: '2026-11-10' },
        { title: 'ایمپورت ۲', category: 'software_saas', amount: 8000000, date: '2026-11-11' },
      ],
    );
    assert(batchRes.statusCode === 201, 'POST /api/costs/batch returns 201 Created');
    assert(batchRes.data.importedCount === 2, 'Batch imported 2 items successfully');

    // Cleanup batch items and test campaign
    await prisma.cost.deleteMany({ where: { organizationId: marketingAuth.user.organizationId } });
    await prisma.campaign.deleteMany({ where: { id: { in: [testCampaign.id, crossTenantCampaign.id] } } });

  } catch (err) {
    console.error('Unexpected error during cost tests:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`COSTS INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCostIntegrationTests();
