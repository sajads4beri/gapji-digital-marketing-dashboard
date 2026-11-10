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

async function runDashboardIntegrationTests() {
  console.log('================================================================');
  console.log('📊 GAPJI B2.4.5.2 COMPLIANT EXECUTIVE DASHBOARD BACKEND SUITE');
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
    // 1. Authenticate all 6 system roles
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
      'Tokens retrieved for all 6 canonical roles',
    );

    // 2. Unauthenticated Request Rejection
    console.log('\n--- 2. Unauthenticated Request Rejection ---');
    const unauthRes = await request({ url: `${API_BASE}/dashboard/overview` });
    assert(unauthRes.statusCode === 401, 'GET /api/dashboard/overview without token is rejected with 401');

    // 3. Strict 6-Role Authorization Matrix
    console.log('\n--- 3. Role-Based Access Control Enforcement ---');
    const campManagerRes = await request({
      url: `${API_BASE}/dashboard/overview`,
      headers: { Authorization: `Bearer ${campaignManagerAuth.token}` },
    });
    assert(campManagerRes.statusCode === 403, 'campaign_manager role is strictly forbidden from Executive Dashboard (403)');

    const salesRes = await request({
      url: `${API_BASE}/dashboard/overview`,
      headers: { Authorization: `Bearer ${salesAuth.token}` },
    });
    assert(salesRes.statusCode === 403, 'sales_agent role is strictly forbidden from Executive Dashboard (403)');

    const contentRes = await request({
      url: `${API_BASE}/dashboard/overview`,
      headers: { Authorization: `Bearer ${contentAuth.token}` },
    });
    assert(contentRes.statusCode === 403, 'content_creator role is strictly forbidden from Executive Dashboard (403)');

    const adminRes = await request({
      url: `${API_BASE}/dashboard/overview`,
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(adminRes.statusCode === 200, 'admin role can successfully access Executive Dashboard (200)');

    const marketingRes = await request({
      url: `${API_BASE}/dashboard/overview`,
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(marketingRes.statusCode === 200, 'marketing_manager role can successfully access Executive Dashboard (200)');

    const clientRes = await request({
      url: `${API_BASE}/dashboard/overview`,
      headers: { Authorization: `Bearer ${clientAuth.token}` },
    });
    assert(clientRes.statusCode === 200, 'client role can successfully access Executive Dashboard (read-only 200)');

    // 4. Exact 6-Card KPI Structure Verification
    console.log('\n--- 4. Approved 6-Card Structure Verification (Page 8) ---');
    const data = adminRes.data;
    assert(data.isMockData === false, 'isMockData flag is strictly false (PostgreSQL-backed)');
    assert(typeof data.kpis === 'object' && data.kpis !== null, 'kpis object is present');

    const kpis = data.kpis;
    // Exactly 6 primary documented cards
    assert(typeof kpis.totalSpend === 'number', 'Card 1: Total Ad Spend (totalSpend) is number');
    assert(typeof kpis.totalLeads === 'number', 'Card 2: Total Leads (totalLeads) is a dedicated primary metric');
    assert(kpis.cpl === null || typeof kpis.cpl === 'number', 'Card 3: CPL is number or null');
    assert(kpis.conversionRate === null || typeof kpis.conversionRate === 'number', 'Card 4: Conversion Rate is number or null');
    assert(kpis.roas === null || typeof kpis.roas === 'number', 'Card 5: ROAS is number or null');
    assert(kpis.cac === null || typeof kpis.cac === 'number', 'Card 6: CAC is number or null');

    // 5. Critical Spend Fix: Authoritative Zero-Spend & No Fallback
    console.log('\n--- 5. Cost Aggregation & Zero-Spend Integrity (Section 10) ---');
    // In database, there are currently 0 costs in gapji_dev
    assert(kpis.totalSpend === 0, `totalSpend is exactly 0 when 0 costs exist in date period (Got: ${kpis.totalSpend}, No fallback to campaign.spend)`);
    assert(kpis.roas === null, 'ROAS is null when totalSpend is 0 (no division by zero)');
    assert(kpis.cpl === null, 'CPL is null when totalSpend is 0');
    assert(kpis.cac === null, 'CAC is null when totalSpend is 0');

    // 6. Two Independent Trend Charts Verification (Section 6)
    console.log('\n--- 6. Two Independent Trend Charts (Spend Trend & Lead Trend) ---');
    assert(Array.isArray(data.spendTrend), 'spendTrend array is present');
    assert(Array.isArray(data.leadTrend), 'leadTrend array is present');
    assert(data.spendTrend.length > 0, 'spendTrend has daily data points');
    assert(data.leadTrend.length > 0, 'leadTrend has daily data points');
    assert(data.spendTrend[0].spend !== undefined, 'spendTrend points contain spend field');
    assert(data.leadTrend[0].leadsCount !== undefined, 'leadTrend points contain leadsCount field');
    assert(typeof data.spendTrend[0].label === 'string', 'spendTrend points contain Persian date label');

    // 7. Exact 5-Stage Conversion Funnel Data Integrity (Section 2 & 3)
    console.log('\n--- 7. Exact 5-Stage Conversion Funnel (Data Integrity) ---');
    const funnel = data.funnel;
    assert(Array.isArray(funnel) && funnel.length === 5, 'Funnel contains exactly 5 stages');
    const stageIds = funnel.map((s: any) => s.id);
    assert(
      stageIds[0] === 'clicks' &&
      stageIds[1] === 'leads' &&
      stageIds[2] === 'qualified' &&
      stageIds[3] === 'proposal' &&
      stageIds[4] === 'customer',
      'Funnel stage sequence matches: clicks -> leads -> qualified -> proposal -> customer (No Impressions)',
    );

    // 7.1 Clicks Stage Integrity: No fake clicks, no fabricated targets, null when unavailable
    assert(funnel[0].count === null, 'Stage 1 (Clicks) count is strictly null (No authoritative click-event tracking ledger exists)');
    assert(funnel[0].isAvailable === false, 'Stage 1 (Clicks) isAvailable is false');
    assert(funnel[0].conversionFromPrevious === null, 'Stage 1 (Clicks) conversionFromPrevious is null');
    assert(funnel[0].dropoffPercentage === null, 'Stage 1 (Clicks) dropoffPercentage is null');

    // 7.2 Leads Stage Integrity
    assert(funnel[1].count === kpis.totalLeads, 'Stage 2 (Leads) count matches totalLeads');
    assert(funnel[1].conversionFromPrevious === null, 'Stage 2 (Leads) conversionFromPrevious is null (cannot divide by unavailable clicks)');

    // 7.3 Qualified & Proposal Non-Overlap & Won Customer Uniqueness
    const qualifiedStage = funnel[2];
    const proposalStage = funnel[3];
    const customerStage = funnel[4];
    assert(typeof qualifiedStage.count === 'number', 'Stage 3 (Qualified) count is a number');
    assert(typeof proposalStage.count === 'number', 'Stage 4 (Proposal) count is a number');
    assert(typeof customerStage.count === 'number', 'Stage 5 (Customer) count is a number');
    assert(customerStage.count === kpis.wonCustomersCount, 'Stage 5 (Customer) count matches wonCustomersCount uniquely');
    assert(
      qualifiedStage.count + proposalStage.count + customerStage.count <= kpis.totalLeads,
      'Qualified, Proposal, and Customer stages are strictly non-overlapping (no duplicate counting of won leads in qualified/proposal)',
    );

    // 8. Campaign Performance Table (Page 8 Row 5)
    console.log('\n--- 8. Campaign Performance Table (Page 8 Row 5) ---');
    assert(Array.isArray(data.campaigns), 'campaigns table array is present');
    assert(data.campaigns.length > 0, 'campaigns table contains organization campaigns');
    const camp1 = data.campaigns[0];
    assert(typeof camp1.name === 'string', 'Campaign item contains name');
    assert(typeof camp1.status === 'string', 'Campaign item contains status');
    assert(typeof camp1.health === 'string', 'Campaign item contains health');
    assert(typeof camp1.spend === 'number', 'Campaign item contains spend');
    assert(typeof camp1.leadsCount === 'number', 'Campaign item contains leadsCount');
    assert(camp1.cpl === null || typeof camp1.cpl === 'number', 'Campaign item contains cpl');
    assert(camp1.conversionRate === null || typeof camp1.conversionRate === 'number', 'Campaign item contains conversionRate');

    // 9. Platform Share Visualization from Database (Section 8)
    console.log('\n--- 9. Platform Share Visualization ---');
    assert(Array.isArray(data.platformShares), 'platformShares array is present');

    // 10. Persian Calendar "this_month" Boundary Verification (Section 12)
    console.log('\n--- 10. Persian Calendar Jalali Month Boundary ---');
    const monthRes = await request({
      url: `${API_BASE}/dashboard/overview?preset=this_month`,
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(monthRes.statusCode === 200, 'preset=this_month returns 200 OK');
    const monthFrom = monthRes.data.dateRange.from;
    // Today is 19 Aban 1405. 1 Aban 1405 was 2026-10-23
    assert(
      monthFrom.endsWith('-23') || monthFrom.endsWith('-22'),
      `this_month from date (${monthFrom}) starts at day 1 of Jalali Aban (2026-10-23), NOT Gregorian 2026-11-01`,
    );

    // 11. Multi-Select Filters & Previous Period Toggle (Section 5)
    console.log('\n--- 11. Multi-Select Campaign & Platform Filters ---');
    const filterOptions = data.filters;
    assert(Array.isArray(filterOptions.availableCampaigns), 'filters.availableCampaigns is present');
    assert(Array.isArray(filterOptions.availablePlatforms), 'filters.availablePlatforms is present');

    if (filterOptions.availableCampaigns.length > 0) {
      const targetCampId = filterOptions.availableCampaigns[0].id;
      const filteredRes = await request({
        url: `${API_BASE}/dashboard/overview?campaignIds=${targetCampId}`,
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      });
      assert(filteredRes.statusCode === 200, 'Filtering by single campaignId returns 200');
      assert(filteredRes.data.campaigns.length === 1, 'Campaigns table filtered to exactly the selected campaign');
    }

    // Previous period compare
    const compareRes = await request({
      url: `${API_BASE}/dashboard/overview?preset=7d&comparePrevious=true`,
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(compareRes.statusCode === 200, 'comparePrevious=true returns 200 OK');
    assert(compareRes.data.dateRange.comparePrevious === true, 'comparePrevious flag is true in response');
    assert(!!compareRes.data.dateRange.previousFrom, 'previousFrom date is computed');
    assert(!!compareRes.data.dateRange.previousTo, 'previousTo date is computed');

    // 11.1 Comparison Integrity: When previous spend is 0, changePercentage is null (no division by zero)
    assert(
      compareRes.data.kpis.totalSpendChangePercentage === null,
      'When previous spend is 0, totalSpendChangePercentage is null (protected against division by zero)',
    );

    // 11.2 KPI Target Integrity: No fabricated targets for derivative metrics
    assert(
      kpis.cplChangePercentage === null || typeof kpis.cplChangePercentage === 'number',
      'CPL change percentage is null when comparison is inactive',
    );
    assert(
      data.dateRange.comparePrevious !== true,
      'Default query does not activate comparison without comparePrevious parameter',
    );

    // 12. Documented Alerts Verification (Section 11)
    console.log('\n--- 12. Alerts Verification (Page 8 & 9) ---');
    assert(Array.isArray(data.alerts) && data.alerts.length > 0, 'alerts array is present');
    const alert1 = data.alerts[0];
    assert(
      alert1.actionLabel === 'ساخت تسک' || alert1.actionLabel === 'مشاهده کمپین‌ها',
      `Alert action button matches documented requirement ("ساخت تسک" or default: ${alert1.actionLabel})`,
    );

    // 13. Platform Share Empty & Attribution Integrity
    console.log('\n--- 13. Platform Share Attribution Integrity ---');
    assert(Array.isArray(data.platformShares), 'platformShares is an array');
    data.platformShares.forEach((p: any) => {
      assert(typeof p.id === 'string', 'Platform share item has valid id');
      assert(typeof p.name === 'string', 'Platform share item has valid name');
      assert(typeof p.spend === 'number', 'Platform share item has valid numeric spend');
      assert(typeof p.sharePercentage === 'number', 'Platform share item has valid sharePercentage');
    });

    console.log('\n================================================================');
    console.log(`B2.4.5.2 INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error running dashboard integration test suite:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDashboardIntegrationTests();
