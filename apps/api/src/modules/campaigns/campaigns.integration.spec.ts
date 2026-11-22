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

async function runCampaignIntegrationTests() {
  console.log('================================================================');
  console.log('📢 GAPJI B2.4.3 CAMPAIGNS BACKEND INTEGRATION TEST SUITE');
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
    // 1. Authenticate users with different roles
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
      'Tokens retrieved for all test roles (admin, marketing_manager, campaign_manager, sales_agent, content_creator, client)',
    );

    // 2. Unauthenticated Request Rejection
    console.log('\n--- 2. Unauthenticated Request Rejection ---');
    const unauthPost = await request({ url: `${API_BASE}/campaigns`, method: 'POST' }, { name: 'Test' });
    assert(unauthPost.statusCode === 401, 'POST /api/campaigns without token is rejected with 401');

    const unauthGet = await request({ url: `${API_BASE}/campaigns`, method: 'GET' });
    assert(unauthGet.statusCode === 401, 'GET /api/campaigns without token is rejected with 401');

    const unauthStats = await request({ url: `${API_BASE}/campaigns/stats`, method: 'GET' });
    assert(unauthStats.statusCode === 401, 'GET /api/campaigns/stats without token is rejected with 401');

    // 3. Validation & Invalid Input Handling
    console.log('\n--- 3. Validation & Invalid Input Handling ---');
    const missingName = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
      },
      { budget: 50000000 },
    );
    assert(missingName.statusCode === 400, 'Missing campaign name is rejected with 400 Bad Request');

    const negativeBudget = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
      },
      { name: 'کمپین تست', budget: -10000 },
    );
    assert(negativeBudget.statusCode === 400, 'Negative budget is rejected with 400 Bad Request');

    const invalidDate = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
      },
      { name: 'کمپین تست', budget: 50000000, startDate: 'not-a-date' },
    );
    assert(invalidDate.statusCode === 400, 'Invalid startDate format is rejected with 400 Bad Request');

    const invalidUuid = await request({
      url: `${API_BASE}/campaigns/not-a-uuid`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(invalidUuid.statusCode === 400, 'Invalid UUID parameter is rejected with 400 Bad Request');

    const notFoundUuid = await request({
      url: `${API_BASE}/campaigns/00000000-0000-0000-0000-000000000099`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(notFoundUuid.statusCode === 404, 'Non-existent UUID returns 404 Not Found');

    // 4. Role-Based Access Enforcement
    console.log('\n--- 4. Role-Based Access Enforcement (DEC-AUTH-11 & Product PDF) ---');
    // sales_agent forbidden
    const salesPost = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesAuth.token}` },
      },
      { name: 'کمپین غیرمجاز فروش', budget: 10000000, channel: 'گوگل ادز' },
    );
    assert(salesPost.statusCode === 403, 'sales_agent role is strictly forbidden from POST /api/campaigns (403)');

    const salesGet = await request({
      url: `${API_BASE}/campaigns`,
      method: 'GET',
      headers: { Authorization: `Bearer ${salesAuth.token}` },
    });
    assert(salesGet.statusCode === 403, 'sales_agent role is strictly forbidden from GET /api/campaigns (403)');

    // content_creator forbidden
    const contentPost = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${contentAuth.token}` },
      },
      { name: 'کمپین غیرمجاز تولیدکننده محتوا', budget: 10000000, channel: 'اینستاگرام' },
    );
    assert(contentPost.statusCode === 403, 'content_creator role is strictly forbidden from POST /api/campaigns (403)');

    const contentGet = await request({
      url: `${API_BASE}/campaigns`,
      method: 'GET',
      headers: { Authorization: `Bearer ${contentAuth.token}` },
    });
    assert(contentGet.statusCode === 403, 'content_creator role is strictly forbidden from GET /api/campaigns (403)');

    // client read-only permission (can read, cannot create/update/delete)
    const clientPost = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientAuth.token}` },
      },
      { name: 'کمپین غیرمجاز کلاینت', budget: 10000000, channel: 'گوگل ادز' },
    );
    assert(clientPost.statusCode === 403, 'client role is strictly forbidden from POST /api/campaigns (403)');

    const clientGet = await request({
      url: `${API_BASE}/campaigns`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientAuth.token}` },
    });
    assert(clientGet.statusCode === 200, 'client role can successfully read campaigns via GET /api/campaigns (200)');

    // 5. Successful Campaign Creation & PostgreSQL Persistence (Admin & Marketing Manager)
    console.log('\n--- 5. Successful Campaign Creation & PostgreSQL Persistence ---');
    const campaignPayload = {
      name: 'کمپین یکپارچه‌سازی زمستانه Gapji',
      description: 'کمپین تبلیغاتی چندکاناله برای جذب لید B2B و فروش نرم‌افزار',
      channel: 'گوگل ادز',
      budget: 65000000,
      startDate: '2026-11-15',
      endDate: '2026-12-15',
      status: 'active',
      objective: 'lead_generation',
      targetAudience: {
        ageRanges: ['25-34', '35-44'],
        gender: 'all',
        locations: ['تهران', 'اصفهان'],
        interests: ['دیجیتال مارکتینگ', 'فروش آنلاین'],
      },
      platforms: [
        {
          platformId: 'google_ads',
          name: 'گوگل ادز',
          allocatedBudget: 40000000,
          percentage: 61.5,
          enabled: true,
        },
        {
          platformId: 'instagram',
          name: 'اینستاگرام',
          allocatedBudget: 25000000,
          percentage: 38.5,
          enabled: true,
        },
      ],
      targetKpis: {
        targetConversions: 450,
        targetCpa: 144000,
      },
      trackingUtm: {
        landingUrl: 'https://gapji.ir/landing/winter-sale',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'winter_sale_2026',
      },
    };

    const createRes = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      campaignPayload,
    );

    assert(createRes.statusCode === 201, 'Marketing Manager creation returns 201 Created', `Status: ${createRes.statusCode}`);
    assert(createRes.data.name === campaignPayload.name, 'Returned campaign name matches input');
    assert(createRes.data.budget === 65000000, 'Returned campaign budget matches input');
    assert(createRes.data.channel === 'گوگل ادز', 'Returned campaign channel matches input');
    assert(createRes.data.status === 'active', 'Returned campaign status is active');
    assert(!!createRes.data.id, 'Campaign ID is generated and returned');

    const createdId = createRes.data.id;

    // Direct PostgreSQL inspection
    const dbCampaign = await prisma.campaign.findUnique({
      where: { id: createdId },
      include: { owner: true },
    });

    assert(!!dbCampaign, 'Campaign record physically exists in PostgreSQL database');
    assert(dbCampaign?.name === campaignPayload.name, 'PostgreSQL campaign name matches exactly');
    assert(Number(dbCampaign?.budget) === 65000000, 'PostgreSQL campaign budget matches exactly');
    assert(dbCampaign?.organizationId === marketingAuth.user.organizationId, 'PostgreSQL organizationId derived strictly from JWT context');
    assert(dbCampaign?.ownerId === marketingAuth.user.id, 'PostgreSQL ownerId assigned correctly to creator');
    assert(dbCampaign?.targetLeads === 450, 'targetConversions correctly mapped to targetLeads in PostgreSQL');

    // 6. Campaign Retrieval (List & Detail)
    console.log('\n--- 6. Campaign Retrieval (List & Detail) ---');
    const detailRes = await request({
      url: `${API_BASE}/campaigns/${createdId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });

    assert(detailRes.statusCode === 200, 'GET /api/campaigns/:id returns 200 OK');
    assert(detailRes.data.id === createdId, 'Detail response ID matches created ID');
    assert(detailRes.data.budgetSpendPercentage !== undefined, 'Computed budgetSpendPercentage is returned');
    assert(detailRes.data.leadsCount !== undefined, 'Computed leadsCount is returned');
    assert(detailRes.data.cpl !== undefined, 'Computed cpl is returned');
    assert(detailRes.data.health === 'healthy', 'Health indicator is computed as healthy');

    const listRes = await request({
      url: `${API_BASE}/campaigns`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(listRes.statusCode === 200, 'GET /api/campaigns returns 200 OK');
    assert(Array.isArray(listRes.data), 'Campaign list is returned as array');
    const foundInList = listRes.data.find((c: any) => c.id === createdId);
    assert(!!foundInList, 'Newly created campaign is present in the list');

    // 7. Campaign Manager Role Scoping
    console.log('\n--- 7. Campaign Manager Role Scoping (Owner Isolation) ---');
    // Campaign manager creates their own campaign
    const cmCreateRes = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${campaignManagerAuth.token}` },
      },
      {
        name: 'کمپین اختصاصی کارشناس کمپین',
        budget: 20000000,
        channel: 'اینستاگرام',
      },
    );
    assert(cmCreateRes.statusCode === 201, 'campaign_manager role successfully creates a campaign (201)');
    const cmCampaignId = cmCreateRes.data.id;

    // Verify campaign_manager list only contains their own campaigns
    const cmListRes = await request({
      url: `${API_BASE}/campaigns`,
      method: 'GET',
      headers: { Authorization: `Bearer ${campaignManagerAuth.token}` },
    });
    assert(cmListRes.statusCode === 200, 'campaign_manager GET /api/campaigns returns 200 OK');
    const allOwnedByCm = cmListRes.data.every((c: any) => c.ownerId === campaignManagerAuth.user.id || c.owner?.id === campaignManagerAuth.user.id);
    assert(allOwnedByCm, 'campaign_manager sees ONLY campaigns assigned to themselves');
    const canSeeMarketingCampaign = cmListRes.data.some((c: any) => c.id === createdId);
    assert(!canSeeMarketingCampaign, 'campaign_manager CANNOT see marketing manager\'s campaign in list');

    // campaign_manager forbidden from viewing another user's campaign detail
    const cmDetailForbidden = await request({
      url: `${API_BASE}/campaigns/${createdId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${campaignManagerAuth.token}` },
    });
    assert(cmDetailForbidden.statusCode === 403, 'campaign_manager GET another user campaign detail returns 403 Forbidden');

    // 8. Campaign Update & Status Transition
    console.log('\n--- 8. Campaign Update & Status Transition ---');
    const updateRes = await request(
      {
        url: `${API_BASE}/campaigns/${createdId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      {
        status: 'paused',
        budget: 70000000,
        description: 'توضیحات به‌روزرسانی‌شده کمپین',
      },
    );

    assert(updateRes.statusCode === 200, 'PATCH /api/campaigns/:id returns 200 OK');
    assert(updateRes.data.status === 'paused', 'Campaign status updated to paused');
    assert(updateRes.data.budget === 70000000, 'Campaign budget updated to 70,000,000');

    // Check DB persistence of update
    const dbUpdated = await prisma.campaign.findUnique({ where: { id: createdId } });
    assert(dbUpdated?.status === 'paused', 'PostgreSQL campaign status updated to paused');
    assert(Number(dbUpdated?.budget) === 70000000, 'PostgreSQL campaign budget updated to 70000000');

    // 9. Campaign Stats Endpoint
    console.log('\n--- 9. Campaign Stats Endpoint ---');
    const statsRes = await request({
      url: `${API_BASE}/campaigns/stats`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(statsRes.statusCode === 200, 'GET /api/campaigns/stats returns 200 OK');
    assert(typeof statsRes.data.total === 'number' && statsRes.data.total > 0, 'Stats total count is positive integer');
    assert(typeof statsRes.data.active === 'number', 'Stats active count is returned');
    assert(typeof statsRes.data.totalSpend === 'number', 'Stats totalSpend is returned');

    // 10. Campaign Deletion
    console.log('\n--- 10. Campaign Deletion ---');
    // Client cannot delete
    const clientDelete = await request({
      url: `${API_BASE}/campaigns/${createdId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientAuth.token}` },
    });
    assert(clientDelete.statusCode === 403, 'client role cannot DELETE /api/campaigns/:id (403 Forbidden)');

    // Marketing manager deletes their campaign
    const deleteRes = await request({
      url: `${API_BASE}/campaigns/${createdId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(deleteRes.statusCode === 200, 'DELETE /api/campaigns/:id returns 200 OK');

    // Confirm physically deleted in PostgreSQL
    const dbDeleted = await prisma.campaign.findUnique({ where: { id: createdId } });
    assert(dbDeleted === null, 'Campaign is physically removed from PostgreSQL database');

    // Confirm 404 on subsequent get
    const getAfterDelete = await request({
      url: `${API_BASE}/campaigns/${createdId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(getAfterDelete.statusCode === 404, 'GET deleted campaign returns 404 Not Found');

    // Clean up campaign manager test campaign
    await prisma.campaign.deleteMany({ where: { id: cmCampaignId } });

  } catch (err) {
    console.error('Unexpected error during integration tests:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`CAMPAIGNS INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCampaignIntegrationTests();
