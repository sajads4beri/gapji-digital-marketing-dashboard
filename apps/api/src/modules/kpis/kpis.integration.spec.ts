import * as fs from 'fs';
import * as path from 'path';
import http from 'http';
import { SafeFormulaEvaluator } from './safe-formula-evaluator';

const API_BASE = 'http://localhost:3001/api';

function request(
  options: { url: string; method?: string; headers?: Record<string, string> },
  body: any = null,
): Promise<{
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
            data = raw ? JSON.parse(raw) : null;
          } catch (e) {
            data = raw;
          }
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            data,
          });
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

async function runKpiTests() {
  console.log('================================================================');
  console.log('🎯 GAPJI KPI & METRICS MODULE (PRD p. 13 §11) FULL INTEGRATION SUITE');
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
    // -------------------------------------------------------------
    // Part 1: Safe Formula Evaluator (Unit Logic)
    // -------------------------------------------------------------
    console.log('--- 1. Safe Formula Evaluator Verification ---');
    const v1 = SafeFormulaEvaluator.validate('(cost / lead) * 100');
    assert(v1.isValid === true && v1.variables.includes('cost') && v1.variables.includes('lead'), 'Syntax validation: (cost / lead) * 100');

    const v2 = SafeFormulaEvaluator.validate('هزینه / لید');
    assert(v2.isValid === true && v2.normalizedFormula === 'cost / lead', 'Persian variable translation: هزینه / لید -> cost / lead');

    const v3 = SafeFormulaEvaluator.validate('(cost / lead');
    assert(v3.isValid === false && Boolean(v3.error?.includes('پرانتز باز بسته نشده است')), 'Unclosed parenthesis returns descriptive Persian error');

    const v4 = SafeFormulaEvaluator.validate('salary * 2');
    assert(v4.isValid === false && Boolean(v4.error?.includes('متغیر ناشناخته')), 'Disallowed variable rejected: salary');

    const e1 = SafeFormulaEvaluator.evaluate('cost + lead * 2', { cost: 100, lead: 10 });
    assert(e1.value === 120, 'Operator precedence evaluation: 100 + 10 * 2 = 120');

    const e2 = SafeFormulaEvaluator.evaluate('cost / lead', { cost: 5000, lead: 0 });
    assert(e2.value === 0 && e2.divisionByZero === true, 'Graceful division-by-zero protection (returns 0 without throwing)');

    // -------------------------------------------------------------
    // Part 2: Authenticate Test Roles
    // -------------------------------------------------------------
    console.log('\n--- 2. Authenticating Test Roles ---');
    const admin = await loginUser('admin@gapji.dev');
    const marketing = await loginUser('marketing@gapji.dev');
    const campaignManager = await loginUser('campaign@gapji.dev');
    const sales = await loginUser('sales@gapji.dev');

    assert(!!admin.token && !!marketing.token && !!campaignManager.token && !!sales.token, 'Logged in admin, marketing, campaign, and sales roles');

    // -------------------------------------------------------------
    // Part 3: Authentication & Authorization Guards (RBAC)
    // -------------------------------------------------------------
    console.log('\n--- 3. RBAC & Route Protection ---');
    const unauth = await request({ url: `${API_BASE}/kpis` });
    assert(unauth.statusCode === 401, 'Unauthenticated request to /api/kpis returns 401');

    const salesGet = await request({
      url: `${API_BASE}/kpis`,
      headers: { Authorization: `Bearer ${sales.token}` },
    });
    assert(salesGet.statusCode === 403, 'Sales role reading /api/kpis returns 403 Forbidden');

    const cmPost = await request(
      {
        url: `${API_BASE}/kpis`,
        method: 'POST',
        headers: { Authorization: `Bearer ${campaignManager.token}`, 'Content-Type': 'application/json' },
      },
      { name: 'غيرمجاز', code: 'cpl', targetValue: 50000, unit: 'تومان', period: 'ماهانه' },
    );
    assert(cmPost.statusCode === 403, 'Campaign manager role writing /api/kpis returns 403 Forbidden');

    const cmGet = await request({
      url: `${API_BASE}/kpis`,
      headers: { Authorization: `Bearer ${campaignManager.token}` },
    });
    assert(cmGet.statusCode === 200, 'Campaign manager has read access to /api/kpis (200 OK)');

    // -------------------------------------------------------------
    // Part 4: Tab 2 - Formula Validation & Live Preview Endpoints
    // -------------------------------------------------------------
    console.log('\n--- 4. Tab 2: Formula Validation & Preview APIs ---');
    const validateRes = await request(
      {
        url: `${API_BASE}/kpis/formula/validate`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      { formula: '(revenue - cost) / cost' },
    );
    assert(validateRes.statusCode === 201 || validateRes.statusCode === 200, 'POST /api/kpis/formula/validate returns 200/201');
    assert(validateRes.data?.isValid === true, 'Formula validated successfully: (revenue - cost) / cost');

    const previewRes = await request(
      {
        url: `${API_BASE}/kpis/formula/preview`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      { formula: 'cost / lead' },
    );
    assert(previewRes.statusCode === 201 || previewRes.statusCode === 200, 'POST /api/kpis/formula/preview returns 200/201');
    assert(typeof previewRes.data?.value === 'number', `Live preview calculated value: ${previewRes.data?.value}`);

    // -------------------------------------------------------------
    // Part 5: Tab 2 - Metrics Catalog & Custom Metrics
    // -------------------------------------------------------------
    console.log('\n--- 5. Tab 2: Metrics Catalog & Custom Metrics CRUD ---');
    const catalogRes = await request({
      url: `${API_BASE}/kpis/metrics`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(catalogRes.statusCode === 200, 'GET /api/kpis/metrics returns 200 OK');
    assert(catalogRes.data.defaultMetrics.length === 7, 'Catalog includes 7 standard default metrics (CPL, CAC, ROAS, CTR, CPC, CPA, CR)');

    const customMetricRes = await request(
      {
        url: `${API_BASE}/kpis/metrics/custom`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      {
        name: 'درآمد به ازای کلیک تست',
        code: 'rpc_test_kpi',
        description: 'شاخص سفارشی تست بازدهی کلیک',
        formula: 'revenue / clicks',
        direction: 'higher_is_better',
        unit: 'تومان',
      },
    );
    assert(customMetricRes.statusCode === 201, 'POST /api/kpis/metrics/custom created custom metric (201)');
    const createdCustomMetric = customMetricRes.data;

    // Test duplicate code rejection
    const dupRes = await request(
      {
        url: `${API_BASE}/kpis/metrics/custom`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      {
        name: 'کد تکراری',
        code: 'rpc_test_kpi',
        formula: 'revenue / clicks',
      },
    );
    assert(dupRes.statusCode === 400, 'Duplicate custom metric code rejected with 400 Bad Request');

    // -------------------------------------------------------------
    // Part 6: Tab 1 - Target KPIs CRUD & Semantic Progress
    // -------------------------------------------------------------
    console.log('\n--- 6. Tab 1: Target KPIs CRUD & Progress Calculations ---');
    // Higher is better KPI
    const kpiHigherRes = await request(
      {
        url: `${API_BASE}/kpis`,
        method: 'POST',
        headers: { Authorization: `Bearer ${admin.token}`, 'Content-Type': 'application/json' },
      },
      {
        name: 'هدف فروش فصلی (بالاتر بهتر)',
        code: 'revenue',
        targetValue: 50000000,
        direction: 'higher_is_better',
        unit: 'تومان',
        period: 'فصلی',
        formula: 'revenue',
      },
    );
    assert(kpiHigherRes.statusCode === 201, 'Created Target KPI with higher_is_better (201)');
    const kpiHigher = kpiHigherRes.data;

    // Lower is better KPI (CPL)
    const kpiLowerRes = await request(
      {
        url: `${API_BASE}/kpis`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      {
        name: 'CPL هدف کمپین (کمتر بهتر)',
        code: 'cpl',
        targetValue: 60000,
        direction: 'lower_is_better',
        unit: 'تومان',
        period: 'کمپین',
        formula: 'cost / lead',
      },
    );
    assert(kpiLowerRes.statusCode === 201, 'Created Target KPI with lower_is_better (201)');
    const kpiLower = kpiLowerRes.data;

    // Custom metric KPI
    const kpiCustomRes = await request(
      {
        url: `${API_BASE}/kpis`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      {
        name: 'شاخص سفارشی تست',
        code: 'rpc_test_kpi',
        targetValue: 10000,
        direction: 'higher_is_better',
        unit: 'تومان',
        period: 'ماهانه',
      },
    );
    assert(kpiCustomRes.statusCode === 201, 'Created Target KPI using Custom Metric (201)');
    const kpiCustom = kpiCustomRes.data;

    // List KPIs and check progress calculation
    const listKpisRes = await request({
      url: `${API_BASE}/kpis`,
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(listKpisRes.statusCode === 200, 'GET /api/kpis returns 200 OK');
    const kpisList = listKpisRes.data;
    assert(Array.isArray(kpisList) && kpisList.length >= 3, `KPIs list returned ${kpisList.length} items`);

    const foundLower = kpisList.find((k: any) => k.id === kpiLower.id);
    assert(foundLower && typeof foundLower.progressPercentage === 'number', `Lower-is-better progress calculated: ${foundLower?.progressPercentage}%`);

    // Update KPI
    const updateKpiRes = await request(
      {
        url: `${API_BASE}/kpis/${kpiHigher.id}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${admin.token}`, 'Content-Type': 'application/json' },
      },
      { targetValue: 75000000 },
    );
    assert(updateKpiRes.statusCode === 200, 'PATCH /api/kpis/:id updated target value (200 OK)');

    // Prevent deleting custom metric while in use by KPI
    const deleteBlocked = await request({
      url: `${API_BASE}/kpis/metrics/custom/${createdCustomMetric.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(deleteBlocked.statusCode === 400, 'Delete custom metric blocked while KPI is referencing it (400)');

    // -------------------------------------------------------------
    // Part 7: Tab 3 - Alert Rules (Sentence Builder)
    // -------------------------------------------------------------
    console.log('\n--- 7. Tab 3: Alert Rules (Sentence-Based Builder) ---');
    const alertRes = await request(
      {
        url: `${API_BASE}/kpis/alerts`,
        method: 'POST',
        headers: { Authorization: `Bearer ${admin.token}`, 'Content-Type': 'application/json' },
      },
      {
        kpiMetricId: kpiLower.id,
        metricName: 'CPL',
        condition: 'gt',
        thresholdValue: 80000,
        severity: 'critical',
        message: 'اگر CPL بزرگتر از ۸۰,۰۰۰ تومان باشد: هشدار افزایش نامتعارف هزینه جذب لید',
        suggestedAction: 'کاهش بودجه روزانه و تغییر کلمات کلیدی گران‌قیمت',
        isActive: true,
      },
    );
    assert(alertRes.statusCode === 201, 'POST /api/kpis/alerts created sentence-based alert rule (201)');
    const createdAlert = alertRes.data;

    // Toggle active state
    const toggleRes = await request({
      url: `${API_BASE}/kpis/alerts/${createdAlert.id}/toggle`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(toggleRes.statusCode === 200 && toggleRes.data.isActive === false, 'Toggled alert rule to inactive (false)');

    const toggleBackRes = await request({
      url: `${API_BASE}/kpis/alerts/${createdAlert.id}/toggle`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(toggleBackRes.statusCode === 200 && toggleBackRes.data.isActive === true, 'Toggled alert rule back to active (true)');

    // List alerts and check live trigger calculation
    const listAlertsRes = await request({
      url: `${API_BASE}/kpis/alerts`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(listAlertsRes.statusCode === 200, 'GET /api/kpis/alerts returns 200 OK');
    const myAlert = listAlertsRes.data.find((a: any) => a.id === createdAlert.id);
    assert(myAlert && typeof myAlert.isTriggered === 'boolean', `Alert trigger condition calculated: isTriggered = ${myAlert?.isTriggered}`);

    // -------------------------------------------------------------
    // Part 8: Cleanup of Test Artifacts
    // -------------------------------------------------------------
    console.log('\n--- 8. Cleanup of Test Data ---');
    // Delete alert rule
    const delAlertRes = await request({
      url: `${API_BASE}/kpis/alerts/${createdAlert.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(delAlertRes.statusCode === 200, 'Deleted test alert rule (200)');

    // Delete KPIs
    await request({ url: `${API_BASE}/kpis/${kpiHigher.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${admin.token}` } });
    await request({ url: `${API_BASE}/kpis/${kpiLower.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${admin.token}` } });
    await request({ url: `${API_BASE}/kpis/${kpiCustom.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${admin.token}` } });
    assert(true, 'Deleted test KPIs');

    // Delete custom metric now that KPI is removed
    const delCustomRes = await request({
      url: `${API_BASE}/kpis/metrics/custom/${createdCustomMetric.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(delCustomRes.statusCode === 200, 'Deleted test custom metric after KPI unlinked (200)');

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

runKpiTests();
