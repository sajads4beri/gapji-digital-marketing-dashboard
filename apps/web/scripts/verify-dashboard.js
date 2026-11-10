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

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
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

async function login(email, password = 'Password123!') {
  const res = await post('http://localhost:3001/api/auth/login', {
    identifier: email,
    password,
  });
  if (res.status !== 200 || !res.body?.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken;
}

async function verify() {
  console.log('================================================================');
  console.log('📊 B2.4.5 REAL DASHBOARD & KPI INTEGRATION VERIFICATION SCRIPT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate all 6 roles
    console.log('--- 1. Authenticating Roles ---');
    const adminToken = await login('admin@gapji.dev');
    const marketingToken = await login('marketing@gapji.dev');
    const campaignToken = await login('campaign@gapji.dev');
    const salesToken = await login('sales@gapji.dev');
    const contentToken = await login('content@gapji.dev');
    const clientToken = await login('client@gapji.dev');

    assert(
      !!adminToken && !!marketingToken && !!campaignToken &&
      !!salesToken && !!contentToken && !!clientToken,
      'JWT tokens obtained for all 6 canonical roles',
    );

    // 2. Unauthenticated access
    console.log('\n--- 2. Unauthenticated Access Rejection ---');
    const unauth = await get('http://localhost:3001/api/dashboard/overview');
    assert(unauth.status === 401, 'Unauthenticated request rejected with 401 Unauthorized');

    // 3. Strict 6-Role Model Enforcement
    console.log('\n--- 3. Strict 6-Role Authorization Matrix ---');
    const campRes = await get('http://localhost:3001/api/dashboard/overview', campaignToken);
    assert(campRes.status === 403, 'campaign_manager denied access to Executive Dashboard (403)');

    const salesRes = await get('http://localhost:3001/api/dashboard/overview', salesToken);
    assert(salesRes.status === 403, 'sales_agent denied access to Executive Dashboard (403)');

    const contentRes = await get('http://localhost:3001/api/dashboard/overview', contentToken);
    assert(contentRes.status === 403, 'content_creator denied access to Executive Dashboard (403)');

    const clientRes = await get('http://localhost:3001/api/dashboard/overview', clientToken);
    assert(clientRes.status === 200, 'client granted read-only access (200 OK)');

    const marketingRes = await get('http://localhost:3001/api/dashboard/overview', marketingToken);
    assert(marketingRes.status === 200, 'marketing_manager granted full access (200 OK)');

    const adminRes = await get('http://localhost:3001/api/dashboard/overview', adminToken);
    assert(adminRes.status === 200, 'admin granted full access (200 OK)');

    // 4. Data Payload & KPI Validation
    console.log('\n--- 4. Real PostgreSQL Data Integrity ---');
    const payload = adminRes.body;
    assert(payload.isMockData === false, 'isMockData is strictly false');
    assert(typeof payload.generatedAt === 'string', 'generatedAt timestamp present');

    const kpis = payload.kpis;
    assert(typeof kpis.approvedBudget === 'number', 'approvedBudget present');
    assert(typeof kpis.totalSpend === 'number', 'totalSpend present');
    assert(typeof kpis.totalRevenue === 'number', 'totalRevenue present');
    assert(kpis.roas !== undefined, 'ROAS present');
    assert(kpis.cac !== undefined, 'CAC present');
    assert(kpis.cpl !== undefined, 'CPL present');
    assert(typeof kpis.leadConversionRate === 'number', 'leadConversionRate present');
    assert(typeof kpis.budgetConsumedPercentage === 'number', 'budgetConsumedPercentage present');

    // 5. Funnel and Channels Validation
    console.log('\n--- 5. Conversion Funnel & Channel Breakdown ---');
    assert(Array.isArray(payload.funnel) && payload.funnel.length === 5, 'Funnel has 5 stages');
    assert(Array.isArray(payload.channels) && payload.channels.length === 5, 'Channels has 5 items');
    assert(Array.isArray(payload.trends) && payload.trends.length > 0, 'Trends array has data points');
    assert(Array.isArray(payload.alerts) && payload.alerts.length > 0, 'Alerts array has items');

    // 6. Date Range Filtering
    console.log('\n--- 6. Date Range Filtering ---');
    const filter7d = await get('http://localhost:3001/api/dashboard/overview?preset=7d', adminToken);
    assert(filter7d.status === 200, 'preset=7d returns 200 OK');
    assert(filter7d.body.dateRange?.preset === '7d', 'dateRange preset matches 7d');

    const customFilter = await get('http://localhost:3001/api/dashboard/overview?preset=custom&from=2026-11-01&to=2026-11-08', adminToken);
    assert(customFilter.status === 200, 'Custom date range returns 200 OK');
    assert(customFilter.body.dateRange?.from === '2026-11-01', 'from date correctly reflected');
    assert(customFilter.body.dateRange?.to === '2026-11-08', 'to date correctly reflected');

    // 7. Frontend Route Verification
    console.log('\n--- 7. Next.js Frontend Dashboard Page Verification ---');
    const frontendPage = await get('http://localhost:3000/performance/dashboard');
    assert(
      frontendPage.status === 200 || frontendPage.status === 307 || frontendPage.status === 302,
      `Frontend route /performance/dashboard is responsive (status: ${frontendPage.status})`,
    );

    console.log('\n================================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal verification error:', err);
    process.exit(1);
  }
}

verify();
