const http = require('http');

function post(url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function patch(url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + (u.search || ''),
      method: 'GET',
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function del(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('=== B2.4.3 Campaign Creation End-to-End Verification ===\n');
  let passed = 0;
  let failed = 0;

  function assert(cond, name, info = '') {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${info}`);
      failed++;
    }
  }

  // 1. Login as marketing manager
  console.log('1. Logging in as Marketing Manager (marketing@gapji.dev)...');
  const loginRes = await post('http://localhost:3001/api/auth/login', {
    identifier: 'marketing@gapji.dev',
    password: 'Password123!',
  });
  assert(loginRes.status === 200 && loginRes.body.accessToken, 'Marketing Manager login successful');
  const token = loginRes.body.accessToken;

  // 2. Wizard Submission payload (Steps 1 to 5)
  console.log('\n2. Submitting Campaign Wizard Form...');
  const wizardPayload = {
    name: 'کمپین جذب لید پاییزی Gapji E2E',
    description: 'کمپین اختصاصی ۶ مرحله‌ای ویزارد برای جذب مشتریان جدید',
    channel: 'گوگل ادز',
    status: 'active',
    budget: 45000000,
    startDate: '2026-11-10',
    endDate: '2026-12-10',
    objective: 'lead_generation',
    targetAudience: {
      ageRanges: ['25-34', '35-44'],
      gender: 'all',
      locations: ['تهران', 'اصفهان', 'مشهد'],
      interests: ['دیجیتال مارکتینگ', 'کسب‌وکار'],
      estimatedReach: 450000,
      selectedAudienceIds: ['aud_ecommerce_heavy'],
    },
    platforms: [
      {
        platformId: 'google_ads',
        name: 'گوگل ادز (Google Ads)',
        allocatedBudget: 30000000,
        percentage: 66.7,
        enabled: true,
      },
      {
        platformId: 'instagram',
        name: 'اینستاگرام (Instagram)',
        allocatedBudget: 15000000,
        percentage: 33.3,
        enabled: true,
      },
    ],
    targetKpis: {
      targetConversions: 350,
      targetCpa: 128500,
    },
    trackingUtm: {
      landingUrl: 'https://gapji.ir/landing/autumn-sale',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'autumn_sale_2026',
    },
  };

  const createRes = await post('http://localhost:3001/api/campaigns', wizardPayload, token);
  assert(createRes.status === 201, 'POST /api/campaigns returns 201 Created', `Got ${createRes.status}: ${JSON.stringify(createRes.body)}`);
  assert(createRes.body.name === wizardPayload.name, 'Created campaign name matches');
  assert(createRes.body.budget === 45000000, 'Created campaign budget matches');
  assert(createRes.body.status === 'active', 'Created campaign status is active');
  assert(createRes.body.health === 'healthy', 'Health badge computed as healthy');
  assert(createRes.body.owner && createRes.body.owner.id, 'Campaign owner populated');
  const campaignId = createRes.body.id;
  assert(Boolean(campaignId), 'Valid Campaign UUID generated and returned');

  // 3. Fetch from Campaign List
  console.log('\n3. Verifying Campaign List (/campaigns)...');
  const listRes = await get('http://localhost:3001/api/campaigns', token);
  assert(listRes.status === 200, 'GET /api/campaigns returns 200 OK');
  assert(Array.isArray(listRes.body), 'List returns array of campaigns');
  const foundInList = listRes.body.find(c => c.id === campaignId);
  assert(Boolean(foundInList), 'Newly created campaign found in list endpoint');
  assert(foundInList?.budgetSpendPercentage !== undefined, 'Computed budgetSpendPercentage present in list');

  // 4. Fetch Campaign Detail
  console.log('\n4. Verifying Campaign Detail (/campaigns/:id)...');
  const detailRes = await get(`http://localhost:3001/api/campaigns/${campaignId}`, token);
  assert(detailRes.status === 200, 'GET /api/campaigns/:id returns 200 OK');
  assert(detailRes.body.id === campaignId, 'Detail ID matches');
  assert(detailRes.body.startDate === '2026-11-10', 'Detail startDate matches');
  assert(detailRes.body.endDate === '2026-12-10', 'Detail endDate matches');

  // 5. Update Status (e.g. Pause campaign)
  console.log('\n5. Verifying Status Transition (active -> paused)...');
  const pauseRes = await patch(`http://localhost:3001/api/campaigns/${campaignId}`, { status: 'paused' }, token);
  assert(pauseRes.status === 200, 'PATCH /api/campaigns/:id returns 200 OK');
  assert(pauseRes.body.status === 'paused', 'Campaign status updated to paused');

  // 6. Verify Dashboard Stats
  console.log('\n6. Verifying Dashboard Statistics (/campaigns/stats)...');
  const statsRes = await get('http://localhost:3001/api/campaigns/stats', token);
  assert(statsRes.status === 200, 'GET /api/campaigns/stats returns 200 OK');
  assert(typeof statsRes.body.total === 'number' && statsRes.body.total > 0, 'Stats total count is positive');

  // 7. Cleanup
  console.log('\n7. Cleaning up test campaign...');
  const delRes = await del(`http://localhost:3001/api/campaigns/${campaignId}`, token);
  assert(delRes.status === 200, 'DELETE /api/campaigns/:id returns 200 OK');

  const afterDel = await get(`http://localhost:3001/api/campaigns/${campaignId}`, token);
  assert(afterDel.status === 404, 'Campaign successfully deleted (subsequent GET returns 404)');

  console.log(`\n=== Verification Complete: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
