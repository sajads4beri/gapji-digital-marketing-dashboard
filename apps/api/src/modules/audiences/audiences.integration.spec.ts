import * as fs from 'fs';
import * as path from 'path';
import http from 'http';

// Load .env
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

const API_BASE = 'http://localhost:3001/api';

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

async function runAudienceTests() {
  console.log('================================================================');
  console.log('🎯 GAPJI AUDIENCES MODULE (PRD REQ-23/24) INTEGRATION TEST SUITE');
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
    // 1. Auth Tokens
    console.log('--- 1. Authenticating Roles ---');
    const admin = await loginUser('admin@gapji.dev');
    const marketing = await loginUser('marketing@gapji.dev');
    const campaignManager = await loginUser('campaign@gapji.dev');
    const sales = await loginUser('sales@gapji.dev');

    assert(!!admin.token && !!marketing.token && !!campaignManager.token && !!sales.token, 'Logged in all test roles');

    // 2. Unauthenticated Request
    console.log('\n--- 2. Unauthenticated Access Check ---');
    const unauthRes = await request({ url: `${API_BASE}/audiences` });
    assert(unauthRes.statusCode === 401, 'Unauthenticated GET /api/audiences returns 401');

    // 3. RBAC Read/Write
    console.log('\n--- 3. Role-Based Access Control ---');
    const salesRead = await request({
      url: `${API_BASE}/audiences`,
      headers: { Authorization: `Bearer ${sales.token}` },
    });
    assert(salesRead.statusCode === 403, 'Sales Agent read denied (403)');

    const cmRead = await request({
      url: `${API_BASE}/audiences`,
      headers: { Authorization: `Bearer ${campaignManager.token}` },
    });
    assert(cmRead.statusCode === 200, 'Campaign Manager read allowed (200)');

    const cmWrite = await request(
      {
        url: `${API_BASE}/audiences`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${campaignManager.token}`,
          'Content-Type': 'application/json',
        },
      },
      { name: 'مخاطب غیرمجاز' },
    );
    assert(cmWrite.statusCode === 403, 'Campaign Manager write denied (403)');

    // 4. Create Audience (Admin / Marketing Manager)
    console.log('\n--- 4. Create Audience (POST /api/audiences) ---');
    const testAudiencePayload = {
      name: 'مدیران ارشد بازاریابی تهران',
      description: 'مدیران عامل و مدیران بازاریابی شرکت‌های B2B و دانش‌بنیان در استان تهران',
      ageMin: 28,
      ageMax: 50,
      gender: 'all',
      location: 'تهران، کرج',
      interests: 'دیجیتال مارکتینگ، مدیریت استارتاپ، تبلیغات هوشمند',
      channel: 'لینکدین و اینستاگرام',
    };

    const createRes = await request(
      {
        url: `${API_BASE}/audiences`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${marketing.token}`,
          'Content-Type': 'application/json',
        },
      },
      testAudiencePayload,
    );

    assert(createRes.statusCode === 201, 'Marketing Manager created audience successfully (201)');
    const createdAudience = createRes.data;
    assert(createdAudience.name === testAudiencePayload.name, 'Created audience name matches');
    assert(createdAudience.channel === testAudiencePayload.channel, 'Channel field persisted and returned');
    assert(createdAudience.campaignsCount === 0, 'Initial campaignsCount is 0');

    // 5. Query Audiences with Search & Filters
    console.log('\n--- 5. Query Audiences with Search & Filters ---');
    const listRes = await request({
      url: `${API_BASE}/audiences?search=مدیران`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(listRes.statusCode === 200, 'List audiences returns 200');
    assert(Array.isArray(listRes.data.items), 'Returns paginated items array');
    assert(listRes.data.items.some((a: any) => a.id === createdAudience.id), 'Search returns newly created audience');

    // 6. Duplicate Audience (POST /api/audiences/:id/duplicate)
    console.log('\n--- 6. Duplicate Audience (Clone) ---');
    const dupRes = await request({
      url: `${API_BASE}/audiences/${createdAudience.id}/duplicate`,
      method: 'POST',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(dupRes.statusCode === 201, 'Audience duplicated successfully (201)');
    const duplicated = dupRes.data;
    assert(duplicated.name === `کپی از ${testAudiencePayload.name}`, 'Duplicated name has copy prefix');
    assert(duplicated.id !== createdAudience.id, 'Duplicated has new unique UUID');
    assert(duplicated.channel === testAudiencePayload.channel, 'Duplicated preserved channel');

    // Delete the duplicate right away (campaignsCount === 0)
    const delDupRes = await request({
      url: `${API_BASE}/audiences/${duplicated.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(delDupRes.statusCode === 200, 'Unused duplicate deleted successfully (200)');

    // 7. Update Audience
    console.log('\n--- 7. Update Audience (PATCH /api/audiences/:id) ---');
    const updateRes = await request(
      {
        url: `${API_BASE}/audiences/${createdAudience.id}`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${marketing.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        name: 'مدیران ارشد بازاریابی تهران (ویرایش شده)',
        ageMin: 30,
      },
    );
    assert(updateRes.statusCode === 200, 'Audience updated successfully (200)');
    assert(updateRes.data.name.includes('(ویرایش شده)'), 'Updated name reflected');
    assert(updateRes.data.ageMin === 30, 'Updated ageMin reflected');

    // 8. Campaign Wizard Connection
    console.log('\n--- 8. Campaign Linking & Persistence ---');
    const campaignPayload = {
      name: 'کمپین آزمایشی تست اتصال مخاطب هدف',
      channel: 'instagram',
      budget: 15000000,
      targetAudience: {
        selectedAudienceIds: [createdAudience.id],
      },
    };

    const campRes = await request(
      {
        url: `${API_BASE}/campaigns`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${admin.token}`,
          'Content-Type': 'application/json',
        },
      },
      campaignPayload,
    );

    assert(campRes.statusCode === 201, 'Created campaign with connected audience');
    const campaignId = campRes.data.id;
    assert(
      Array.isArray(campRes.data.targetAudienceIds) && campRes.data.targetAudienceIds.includes(createdAudience.id),
      'Campaign response includes targetAudienceIds with createdAudience.id',
    );

    // 9. Audience Detail Page (GET /api/audiences/:id) with Performance Stats
    console.log('\n--- 9. Audience Detail Page with Connected Campaigns ---');
    const detailRes = await request({
      url: `${API_BASE}/audiences/${createdAudience.id}`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(detailRes.statusCode === 200, 'Get audience detail returns 200');
    assert(detailRes.data.campaignsCount === 1, 'Audience detail shows campaignsCount = 1');
    assert(Array.isArray(detailRes.data.campaigns), 'Audience detail includes campaigns array');
    assert(detailRes.data.campaigns.some((c: any) => c.id === campaignId), 'Connected campaign listed in audience detail');

    // 10. Deletion Prevention when Connected (PRD p. 14 Requirement)
    console.log('\n--- 10. PRD Delete Restriction Rule Verification ---');
    const blockedDelete = await request({
      url: `${API_BASE}/audiences/${createdAudience.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(blockedDelete.statusCode === 400, 'Deleting connected audience is REJECTED with 400 Bad Request');
    assert(
      blockedDelete.data.message && blockedDelete.data.message.includes('امکان حذف آن وجود ندارد'),
      'Detailed Persian error message returned explaining campaign dependency',
    );

    // 11. Clean Up Test Campaign and Delete Audience
    console.log('\n--- 11. Cleanup and Final Deletion ---');
    const delCampRes = await request({
      url: `${API_BASE}/campaigns/${campaignId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(delCampRes.statusCode === 200, 'Cleaned up test campaign');

    const finalDelete = await request({
      url: `${API_BASE}/audiences/${createdAudience.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(finalDelete.statusCode === 200, 'Audience successfully deleted after campaign unlinking (200)');

    console.log('\n================================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runAudienceTests();
