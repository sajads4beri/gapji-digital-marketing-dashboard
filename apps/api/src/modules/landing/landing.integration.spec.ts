import http from 'http';
import { UtmUrlBuilder } from './utm-url-builder';

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

async function runLandingTests() {
  console.log('================================================================');
  console.log('🎯 GAPJI LANDING & UTM MODULE (PRD p. 14 §13) INTEGRATION SUITE');
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
    // Part 1: UTM URL Builder Unit Logic & Validation
    // -------------------------------------------------------------
    console.log('--- 1. UTM URL Builder & Validation Verification ---');
    const u1 = UtmUrlBuilder.validateDestinationUrl('https://gapji.ir/sale');
    assert(u1.isValid === true, 'Valid HTTPS URL accepted: https://gapji.ir/sale');

    const u2 = UtmUrlBuilder.validateDestinationUrl('http://gapji.ir/sale');
    assert(u2.isValid === false && Boolean(u2.error?.includes('HTTPS')), 'Non-HTTPS (HTTP) URL rejected with clear error');

    const u3 = UtmUrlBuilder.validateDestinationUrl('not-a-valid-url');
    assert(u3.isValid === false, 'Malformed URL rejected');

    const built1 = UtmUrlBuilder.build({
      destinationUrl: 'https://gapji.ir/landing',
      utmSource: 'google_ads',
      utmMedium: 'cpc',
      utmCampaign: 'autumn_sale',
    });
    assert(built1 === 'https://gapji.ir/landing?utm_source=google_ads&utm_medium=cpc&utm_campaign=autumn_sale', 'Standard UTM URL constructed properly');

    const built2 = UtmUrlBuilder.build({
      destinationUrl: 'https://gapji.ir/landing?ref=partner_123#faq',
      utmSource: 'یکتانت',
      utmMedium: 'banner',
      utmCampaign: 'کمپین_پاییزه',
      utmTerm: 'تخفیف ویژه',
      utmContent: 'دکمه_سبز',
    });
    assert(built2.includes('ref=partner_123'), 'Existing query parameter preserved (?ref=partner_123)');
    assert(built2.endsWith('#faq'), 'Hash fragment (#faq) preserved at the very end');
    assert(built2.includes(encodeURIComponent('یکتانت')), 'Persian utm_source encoded correctly');
    assert(built2.includes(encodeURIComponent('کمپین_پاییزه')), 'Persian utm_campaign encoded correctly');

    // -------------------------------------------------------------
    // Part 2: Authenticate Test Roles
    // -------------------------------------------------------------
    console.log('\n--- 2. Authenticating Test Roles ---');
    const admin = await loginUser('admin@gapji.dev');
    const marketing = await loginUser('marketing@gapji.dev');
    const campaignManager = await loginUser('campaign@gapji.dev');
    const sales = await loginUser('sales@gapji.dev');

    assert(!!admin.token && !!marketing.token && !!campaignManager.token && !!sales.token, 'Logged in all test roles');

    // -------------------------------------------------------------
    // Part 3: Role-Based Access Control (RBAC)
    // -------------------------------------------------------------
    console.log('\n--- 3. RBAC Enforcement (PRD p. 14: Marketing & Campaign Manager) ---');
    const unauth = await request({ url: `${API_BASE}/landing/pages` });
    assert(unauth.statusCode === 401, 'Unauthenticated request returns 401 Unauthorized');

    const salesRes = await request({
      url: `${API_BASE}/landing/pages`,
      headers: { Authorization: `Bearer ${sales.token}` },
    });
    assert(salesRes.statusCode === 403, 'Sales Agent denied with 403 Forbidden (not authorized for Landing/UTM)');

    const cmRes = await request({
      url: `${API_BASE}/landing/pages`,
      headers: { Authorization: `Bearer ${campaignManager.token}` },
    });
    assert(cmRes.statusCode === 200, 'Campaign Manager authorized for Landing/UTM (200 OK)');

    const mmRes = await request({
      url: `${API_BASE}/landing/pages`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(mmRes.statusCode === 200, 'Marketing Manager authorized for Landing/UTM (200 OK)');

    // -------------------------------------------------------------
    // Part 4: Landing Pages CRUD & Metrics
    // -------------------------------------------------------------
    console.log('\n--- 4. Landing Pages CRUD, HTTPS Check & Metrics ---');
    // Reject HTTP
    const httpRejectRes = await request(
      {
        url: `${API_BASE}/landing/pages`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      {
        title: 'صفحه ناامن تست',
        url: 'http://gapji.ir/insecure',
      },
    );
    assert(httpRejectRes.statusCode === 400, 'Reject non-HTTPS landing page with 400 Bad Request');

    // Create valid landing page
    const createLpRes = await request(
      {
        url: `${API_BASE}/landing/pages`,
        method: 'POST',
        headers: { Authorization: `Bearer ${marketing.token}`, 'Content-Type': 'application/json' },
      },
      {
        title: 'صفحه اختصاصی جشنواره نوروز ۱۴۰۵',
        url: 'https://gapji.ir/landing/nowruz-1405',
      },
    );
    assert(createLpRes.statusCode === 201, 'POST /api/landing/pages created landing page (201)');
    const createdLandingPage = createLpRes.data;
    assert(createdLandingPage.title === 'صفحه اختصاصی جشنواره نوروز ۱۴۰۵', 'Landing page title stored correctly');

    // List landing pages
    const listLpRes = await request({
      url: `${API_BASE}/landing/pages`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(listLpRes.statusCode === 200, 'GET /api/landing/pages returns 200 OK');
    const myLp = listLpRes.data.find((p: any) => p.id === createdLandingPage.id);
    assert(!!myLp, 'Found created landing page in list');
    assert(typeof myLp?.totalLeads === 'number', 'totalLeads is numeric');
    assert(typeof myLp?.recent7DaysLeads === 'number', 'recent7DaysLeads is numeric');
    assert(typeof myLp?.has30DayNoLeadWarning === 'boolean', 'has30DayNoLeadWarning is boolean');
    assert(typeof myLp?.connectionStatus === 'boolean', 'connectionStatus is boolean');

    // -------------------------------------------------------------
    // Part 5: UTM Builder Preview & Persistence
    // -------------------------------------------------------------
    console.log('\n--- 5. UTM Builder Preview & Link Creation ---');
    const previewRes = await request(
      {
        url: `${API_BASE}/landing/utm/preview`,
        method: 'POST',
        headers: { Authorization: `Bearer ${campaignManager.token}`, 'Content-Type': 'application/json' },
      },
      {
        destinationUrl: 'https://gapji.ir/landing/nowruz-1405',
        utmSource: 'google_ads',
        utmMedium: 'cpc',
        utmCampaign: 'nowruz_search',
        utmTerm: 'نرم_افزار',
        utmContent: 'link_1',
      },
    );
    assert(previewRes.statusCode === 200 || previewRes.statusCode === 201, 'POST /api/landing/utm/preview returns 200/201');
    assert(previewRes.data.isValid === true && previewRes.data.finalUrl.includes('utm_source=google_ads'), 'Live preview generates valid UTM URL');

    // Persist UTM link
    const createUtmRes = await request(
      {
        url: `${API_BASE}/landing/utm`,
        method: 'POST',
        headers: { Authorization: `Bearer ${campaignManager.token}`, 'Content-Type': 'application/json' },
      },
      {
        landingPageId: createdLandingPage.id,
        destinationUrl: 'https://gapji.ir/landing/nowruz-1405',
        utmSource: 'google_ads',
        utmMedium: 'cpc',
        utmCampaign: 'nowruz_search',
        utmTerm: 'خرید_نرم_افزار',
        utmContent: 'cta_button',
      },
    );
    assert(createUtmRes.statusCode === 201, 'POST /api/landing/utm persisted UTM link (201)');
    const createdUtmLink = createUtmRes.data;
    assert(createdUtmLink.id && createdUtmLink.finalUrl.includes('utm_campaign=nowruz_search'), 'UTM record returned with final URL');

    // List UTM links history
    const listUtmRes = await request({
      url: `${API_BASE}/landing/utm`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(listUtmRes.statusCode === 200, 'GET /api/landing/utm returns 200 OK');
    const myUtm = listUtmRes.data.find((u: any) => u.id === createdUtmLink.id);
    assert(!!myUtm, 'Found created UTM link in history list');
    assert(myUtm.isClickTrackingActive === false, 'Click tracking explicitly marked as unmeasured (prevents fake zero)');
    assert(typeof myUtm.attributedLeadsCount === 'number', 'Attributed leads count calculated from database');

    // -------------------------------------------------------------
    // Part 6: Options & WordPress Status Endpoints
    // -------------------------------------------------------------
    console.log('\n--- 6. Options & WordPress Status APIs ---');
    const optionsRes = await request({
      url: `${API_BASE}/landing/options`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(optionsRes.statusCode === 200, 'GET /api/landing/options returns 200 OK');
    assert(Array.isArray(optionsRes.data.landingPages), 'Options include landingPages');
    assert(Array.isArray(optionsRes.data.campaigns), 'Options include campaigns');
    assert(Array.isArray(optionsRes.data.platforms) && optionsRes.data.platforms.length > 0, 'Options include platforms');
    assert(Array.isArray(optionsRes.data.commonMediums), 'Options include common mediums');

    const wpRes = await request({
      url: `${API_BASE}/landing/wordpress-status`,
      headers: { Authorization: `Bearer ${marketing.token}` },
    });
    assert(wpRes.statusCode === 200, 'GET /api/landing/wordpress-status returns 200 OK');
    assert(typeof wpRes.data.isConfigured === 'boolean', 'WordPress status reported truthfully');
    assert(!!wpRes.data.webhookEndpoint, 'Webhook endpoint provided for receiving leads');

    // -------------------------------------------------------------
    // Part 7: Cleanup of Test Artifacts
    // -------------------------------------------------------------
    console.log('\n--- 7. Cleaning up Test Artifacts ---');
    const delLpRes = await request({
      url: `${API_BASE}/landing/pages/${createdLandingPage.id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(delLpRes.statusCode === 200, 'Deleted test landing page and cascaded links (200 OK)');

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

runLandingTests();
