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
  console.log('=== B2.4.4 Advertising Cost Management E2E Verification ===\n');
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

  // 1. Authenticate Marketing Manager & Other Roles
  console.log('1. Authenticating Roles...');
  const mktLogin = await post('http://localhost:3001/api/auth/login', {
    identifier: 'marketing@gapji.dev',
    password: 'Password123!',
  });
  assert(mktLogin.status === 200 && mktLogin.body.accessToken, 'Marketing Manager login successful');
  const mktToken = mktLogin.body.accessToken;

  const clientLogin = await post('http://localhost:3001/api/auth/login', {
    identifier: 'client@gapji.dev',
    password: 'Password123!',
  });
  assert(clientLogin.status === 200 && clientLogin.body.accessToken, 'Client login successful');
  const clientToken = clientLogin.body.accessToken;

  const salesLogin = await post('http://localhost:3001/api/auth/login', {
    identifier: 'sales@gapji.dev',
    password: 'Password123!',
  });
  assert(salesLogin.status === 200 && salesLogin.body.accessToken, 'Sales Agent login successful');
  const salesToken = salesLogin.body.accessToken;

  // 2. Create Campaign for cost attribution
  console.log('\n2. Creating Test Campaign for Cost Attribution...');
  const campRes = await post('http://localhost:3001/api/campaigns', {
    name: 'کمپین بررسی هزینه‌های بازاریابی E2E',
    budget: 80000000,
    channel: 'گوگل ادز',
    status: 'active',
  }, mktToken);
  assert(campRes.status === 201 && campRes.body.id, 'Test campaign created in PostgreSQL');
  const campaignId = campRes.body.id;

  // 3. Validation Handling
  console.log('\n3. Verifying Validation Rejections...');
  const valNoTitle = await post('http://localhost:3001/api/costs', { amount: 1000, date: '2026-11-10', category: 'ad_media' }, mktToken);
  assert(valNoTitle.status === 400, 'Missing title rejected with 400 Bad Request');

  const valNegAmount = await post('http://localhost:3001/api/costs', { title: 'تست', amount: -500, date: '2026-11-10', category: 'ad_media' }, mktToken);
  assert(valNegAmount.status === 400, 'Negative amount rejected with 400 Bad Request');

  // 4. Role Enforcement (DEC-AUTH-11)
  console.log('\n4. Verifying Role Enforcements...');
  const salesPost = await post('http://localhost:3001/api/costs', { title: 'تست فروش', amount: 1000, date: '2026-11-10', category: 'ad_media' }, salesToken);
  assert(salesPost.status === 403, 'sales_agent POST /api/costs rejected with 403 Forbidden');

  const salesGet = await get('http://localhost:3001/api/costs', salesToken);
  assert(salesGet.status === 403, 'sales_agent GET /api/costs rejected with 403 Forbidden');

  const clientPost = await post('http://localhost:3001/api/costs', { title: 'تست کارفرما', amount: 1000, date: '2026-11-10', category: 'ad_media' }, clientToken);
  assert(clientPost.status === 403, 'client role POST /api/costs rejected with 403 Forbidden');

  const clientGet = await get('http://localhost:3001/api/costs', clientToken);
  assert(clientGet.status === 200, 'client role GET /api/costs allowed with 200 OK (read-only)');

  // 5. Submit Real Advertising Cost
  console.log('\n5. Creating Real Advertising Cost...');
  const costPayload = {
    title: 'شارژ ادوردز کمپین E2E',
    category: 'ad_media',
    channel: 'google_ads',
    campaignId: campaignId,
    amount: 18000000,
    currency: 'TOMAN',
    exchangeRate: 1,
    date: '2026-11-10',
    vendor: 'آژانس واسط ادوردز',
    invoiceNumber: 'INV-E2E-1001',
    status: 'paid',
    notes: 'ثبت واقعی در دیتابیس PostgreSQL',
  };

  const createRes = await post('http://localhost:3001/api/costs', costPayload, mktToken);
  assert(createRes.status === 201, 'POST /api/costs returns 201 Created');
  assert(createRes.body.title === costPayload.title, 'Created cost title matches');
  assert(createRes.body.amount === 18000000, 'Created cost amount matches');
  assert(createRes.body.normalizedAmountToman === 18000000, 'normalizedAmountToman matches');
  assert(createRes.body.campaignId === campaignId, 'Attributed campaignId matches');
  assert(createRes.body.campaignName === campRes.body.name, 'Attributed campaignName populated');
  const costId = createRes.body.id;
  assert(Boolean(costId), 'Cost UUID generated and returned');

  // 6. Verify Campaign Spend Synchronization
  console.log('\n6. Verifying Dynamic Campaign Spend Synchronization...');
  const campCheck = await get(`http://localhost:3001/api/campaigns/${campaignId}`, mktToken);
  assert(campCheck.status === 200, 'GET /api/campaigns/:id returns 200 OK');
  assert(campCheck.body.spend === 18000000, 'Campaign.spend dynamically updated in PostgreSQL to 18,000,000');
  assert(campCheck.body.budgetSpendPercentage === 22.5, 'Campaign budgetSpendPercentage updated to 22.5%');

  // 7. Verify Cost List & Detail Retrieval
  console.log('\n7. Verifying Cost List & Detail Endpoints...');
  const listRes = await get('http://localhost:3001/api/costs', mktToken);
  assert(listRes.status === 200, 'GET /api/costs returns 200 OK');
  const foundInList = listRes.body.find(c => c.id === costId);
  assert(Boolean(foundInList), 'Newly created cost is present in list');

  const detailRes = await get(`http://localhost:3001/api/costs/${costId}`, mktToken);
  assert(detailRes.status === 200, 'GET /api/costs/:id returns 200 OK');
  assert(detailRes.body.vendor === costPayload.vendor, 'Detail vendor matches');
  assert(detailRes.body.invoiceNumber === costPayload.invoiceNumber, 'Detail invoiceNumber matches');

  // 8. Verify Cost Update
  console.log('\n8. Updating Cost Record...');
  const updateRes = await patch(`http://localhost:3001/api/costs/${costId}`, {
    amount: 24000000,
    status: 'pending',
    notes: 'به‌روزرسانی به ۲۴ میلیون تومان',
  }, mktToken);
  assert(updateRes.status === 200, 'PATCH /api/costs/:id returns 200 OK');
  assert(updateRes.body.amount === 24000000, 'Updated amount is 24,000,000');

  const campAfterUpdate = await get(`http://localhost:3001/api/campaigns/${campaignId}`, mktToken);
  assert(campAfterUpdate.body.spend === 24000000, 'Campaign.spend dynamically updated to 24,000,000');

  // 9. Verify Cost Statistics
  console.log('\n9. Verifying Dashboard Statistics (/costs/stats)...');
  const statsRes = await get('http://localhost:3001/api/costs/stats', mktToken);
  assert(statsRes.status === 200, 'GET /api/costs/stats returns 200 OK');
  assert(statsRes.body.totalSpendToman >= 24000000, 'totalSpendToman includes updated cost');
  assert(statsRes.body.directAdSpendToman >= 24000000, 'directAdSpendToman calculated');
  assert(statsRes.body.spendByCampaign.some(c => c.campaignId === campaignId), 'Attributed campaign in spendByCampaign');

  // 10. Delete Cost Record & Verify Campaign Spend Rollback
  console.log('\n10. Deleting Cost Record...');
  const delRes = await del(`http://localhost:3001/api/costs/${costId}`, mktToken);
  assert(delRes.status === 200, 'DELETE /api/costs/:id returns 200 OK');

  const afterDelCost = await get(`http://localhost:3001/api/costs/${costId}`, mktToken);
  assert(afterDelCost.status === 404, 'Cost successfully removed (subsequent GET returns 404)');

  const campAfterDel = await get(`http://localhost:3001/api/campaigns/${campaignId}`, mktToken);
  assert(campAfterDel.body.spend === 0, 'Campaign.spend safely reduced back to 0 in PostgreSQL');

  // 11. Cleanup test campaign
  await del(`http://localhost:3001/api/campaigns/${campaignId}`, mktToken);

  console.log(`\n=== Verification Complete: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
