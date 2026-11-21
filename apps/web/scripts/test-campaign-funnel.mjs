import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- Starting Campaign Sales Funnel Verification Suite ---');

async function runTests() {
  const API_BASE = 'http://localhost:3001/api';

  // 0. Authenticate to get JWT token
  console.log('0. Authenticating as admin user...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@gapji.dev',
      password: 'Password123!',
    }),
  });
  assert.strictEqual(loginRes.status, 200, 'Login must succeed with 200');
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  assert.ok(token, 'Access token must be returned');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('  [PASS] Authenticated successfully with JWT token');

  // 1. Verify Campaigns Endpoint and Get Sample Campaign
  console.log('1. Testing Campaigns API and fetching sample campaign...');
  const campaignsRes = await fetch(`${API_BASE}/campaigns`, { headers: authHeaders });
  assert.strictEqual(campaignsRes.status, 200, 'Campaigns API must respond with 200');
  const campaigns = await campaignsRes.json();
  assert.ok(Array.isArray(campaigns) && campaigns.length > 0, 'Must have at least one campaign');

  let sampleCampaign = campaigns[0];
  let funnel = null;
  for (const c of campaigns) {
    const fRes = await fetch(`${API_BASE}/campaigns/${c.id}/funnel`, { headers: authHeaders });
    if (fRes.status === 200) {
      const f = await fRes.json();
      if (f.totalLeads > 0) {
        sampleCampaign = c;
        funnel = f;
        break;
      }
    }
  }

  if (!funnel) {
    const fRes = await fetch(`${API_BASE}/campaigns/${sampleCampaign.id}/funnel`, { headers: authHeaders });
    funnel = await fRes.json();
  }
  console.log(`  [PASS] Selected campaign for verification: ${sampleCampaign.name} (${sampleCampaign.id}) with ${funnel.totalLeads} leads`);

  // 2. Testing Campaign Funnel Endpoint
  console.log('2. Testing Campaign Funnel Endpoint (GET /api/campaigns/:id/funnel)...');
  assert.strictEqual(funnel.campaignId, sampleCampaign.id, 'Campaign ID must match');
  assert.ok(typeof funnel.totalLeads === 'number', 'totalLeads must be a number');
  assert.ok(Array.isArray(funnel.stages) && funnel.stages.length > 0, 'Funnel must have stages');
  
  for (const stage of funnel.stages) {
    assert.ok(stage.id, 'Stage must have id');
    assert.ok(stage.key, 'Stage must have key');
    assert.ok(stage.label, 'Stage must have label');
    assert.ok(typeof stage.count === 'number', 'Stage count must be number');
    assert.ok(typeof stage.percentageOfTotal === 'number', 'percentageOfTotal must be number');
    assert.ok(typeof stage.conversionRate === 'number', 'conversionRate must be number');
  }
  console.log(`  [PASS] Verified funnel with ${funnel.stages.length} dynamic stages and ${funnel.totalLeads} total leads`);
  console.log(`         Stages: ${funnel.stages.map(s => `${s.label} (${s.count})`).join(' -> ')}`);

  // 3. Testing Stage Leads Query (GET /api/campaigns/:id/leads)
  console.log('3. Testing Stage Leads Query (GET /api/campaigns/:id/leads)...');
  const stageKey = funnel.stages.find(s => s.count > 0)?.key || funnel.stages[0].key;
  const stageLeadsRes = await fetch(`${API_BASE}/campaigns/${sampleCampaign.id}/leads?statusKey=${stageKey}`, { headers: authHeaders });
  assert.strictEqual(stageLeadsRes.status, 200, 'Stage leads query must respond with 200');
  const stageLeads = await stageLeadsRes.json();
  assert.ok(Array.isArray(stageLeads), 'Must return an array of leads');
  console.log(`  [PASS] Stage leads query responded successfully with ${stageLeads.length} leads for stage "${stageKey}"`);

  // 4. Verify Frontend Components & Integration
  console.log('4. Verifying Frontend Components & Code Integration...');
  const funnelComponentPath = path.resolve('apps/web/src/features/campaigns/components/campaign-sales-funnel.tsx');
  const drawerComponentPath = path.resolve('apps/web/src/features/campaigns/components/campaign-stage-leads-drawer.tsx');
  const detailsPagePath = path.resolve('apps/web/src/app/(app)/campaigns/[id]/page.tsx');
  const tableComponentPath = path.resolve('apps/web/src/components/campaigns-table.tsx');

  assert.ok(fs.existsSync(funnelComponentPath), 'CampaignSalesFunnel component must exist');
  assert.ok(fs.existsSync(drawerComponentPath), 'CampaignStageLeadsDrawer component must exist');
  
  const funnelContent = fs.readFileSync(funnelComponentPath, 'utf8');
  assert.ok(funnelContent.includes('CampaignStageLeadsDrawer'), 'Funnel component must integrate drawer');
  assert.ok(funnelContent.includes('نمایش لیدها'), 'Funnel component must contain view leads button');

  const drawerContent = fs.readFileSync(drawerComponentPath, 'utf8');
  assert.ok(drawerContent.includes('\\uFEFF'), 'Drawer must support UTF-8 BOM CSV export for Persian Excel');
  assert.ok(drawerContent.includes('searchQuery'), 'Drawer must support real-time debounced search');

  const detailsContent = fs.readFileSync(detailsPagePath, 'utf8');
  assert.ok(detailsContent.includes('CampaignSalesFunnel'), 'Campaign details page must render sales funnel');

  const tableContent = fs.readFileSync(tableComponentPath, 'utf8');
  assert.ok(tableContent.includes('onRowClick'), 'CampaignsTable must support onRowClick navigation');
  console.log('  [PASS] All frontend components, drawer export, and row click navigation verified');

  console.log('\n--- ALL CAMPAIGN SALES FUNNEL TESTS PASSED (4/4) ---');
}

runTests().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
