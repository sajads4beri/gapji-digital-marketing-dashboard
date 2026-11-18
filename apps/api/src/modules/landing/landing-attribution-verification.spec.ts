import { PrismaClient } from '@prisma/client';
import { LandingService, CurrentUserPayload } from './landing.service';

const TEST_DB_URL = 'postgresql://shop:shop1234@127.0.0.1:5432/gapji_test?schema=public';

async function runTargetedVerification() {
  console.log('========================================================================');
  console.log('🔍 TARGETED VERIFICATION: LANDING & UTM MODULE');
  console.log('Database: gapji_test (Isolated Verification Database)');
  console.log('========================================================================\n');

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });
  const service = new LandingService(prisma as any);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      failed++;
    }
  }

  const testOrgId = '00000000-0000-0000-0000-000000000099';
  const testUser: CurrentUserPayload = {
    id: '00000000-0000-0000-0000-000000000088',
    email: 'admin@gapji.test',
    role: 'admin',
    organizationId: testOrgId,
  };

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  async function cleanup() {
    await prisma.lead.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.utmLink.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.landingPage.deleteMany({ where: { organizationId: testOrgId } });
    await prisma.campaign.deleteMany({ where: { organizationId: testOrgId } });
  }

  try {
    // 0. Setup Organization in gapji_test
    await cleanup();
    await prisma.organization.upsert({
      where: { id: testOrgId },
      update: {},
      create: {
        id: testOrgId,
        name: 'Targeted Verification Test Organization',
        slug: 'test-org-verify',
      },
    });

    // ========================================================================
    // PART 1: VERIFY 30-DAY INACTIVITY WARNING (has30DayNoLeadWarning)
    // ========================================================================
    console.log('--- PART 1: 30-Day Inactivity Warning Scenarios ---\n');

    // Scenario 1.1: Landing page created 90 days ago, with a lead yesterday: no warning
    console.log('Scenario 1.1: Created 90 days ago, with a lead yesterday');
    const lp1 = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        title: 'LP-90d-LeadYesterday',
        url: 'https://gapji.ir/test/lp-1',
        createdAt: daysAgo(90),
      },
    });
    await prisma.utmLink.create({
      data: {
        organizationId: testOrgId,
        landingPageId: lp1.id,
        originalUrl: lp1.url,
        finalUrl: `${lp1.url}?utm_source=google&utm_campaign=promo1`,
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'promo1',
      },
    });
    await prisma.lead.create({
      data: {
        organizationId: testOrgId,
        fullName: 'Active User Yesterday',
        mobile: '09121111111',
        createdAt: daysAgo(1),
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'promo1',
      },
    });

    let pages = await service.findAllLandingPages(testUser);
    let targetLp = pages.find((p) => p.id === lp1.id);
    assert(targetLp !== undefined, 'Landing page 1 retrieved');
    assert(targetLp?.totalLeads === 1, 'Landing page 1 has 1 attributed lead');
    assert(targetLp?.has30DayNoLeadWarning === false, 'has30DayNoLeadWarning is FALSE (lead received within 30 days)');
    assert(targetLp?.inactivityStatus === 'active', 'inactivityStatus is ACTIVE');

    // Scenario 1.2: Landing page created 90 days ago, with its last lead 35 days ago: warning
    console.log('\nScenario 1.2: Created 90 days ago, last lead 35 days ago');
    const lp2 = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        title: 'LP-90d-Lead35dAgo',
        url: 'https://gapji.ir/test/lp-2',
        createdAt: daysAgo(90),
      },
    });
    await prisma.utmLink.create({
      data: {
        organizationId: testOrgId,
        landingPageId: lp2.id,
        originalUrl: lp2.url,
        finalUrl: `${lp2.url}?utm_source=meta&utm_campaign=promo2`,
        utmSource: 'meta',
        utmMedium: 'story',
        utmCampaign: 'promo2',
      },
    });
    await prisma.lead.create({
      data: {
        organizationId: testOrgId,
        fullName: 'Stale User 35d ago',
        mobile: '09122222222',
        createdAt: daysAgo(35),
        utmSource: 'meta',
        utmMedium: 'story',
        utmCampaign: 'promo2',
      },
    });

    pages = await service.findAllLandingPages(testUser);
    targetLp = pages.find((p) => p.id === lp2.id);
    assert(targetLp !== undefined, 'Landing page 2 retrieved');
    assert(targetLp?.totalLeads === 1, 'Landing page 2 has 1 attributed lead');
    assert(targetLp?.has30DayNoLeadWarning === true, 'has30DayNoLeadWarning is TRUE (last lead was 35 days ago > 30 days)');
    assert(targetLp?.inactivityStatus === 'inactive_30_days', 'inactivityStatus is INACTIVE_30_DAYS');

    // Scenario 1.3: Landing page created 10 days ago, with no leads: no 30-day warning
    console.log('\nScenario 1.3: Created 10 days ago, with no leads');
    const lp3 = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        title: 'LP-10d-NoLeads',
        url: 'https://gapji.ir/test/lp-3',
        createdAt: daysAgo(10),
      },
    });

    pages = await service.findAllLandingPages(testUser);
    targetLp = pages.find((p) => p.id === lp3.id);
    assert(targetLp !== undefined, 'Landing page 3 retrieved');
    assert(targetLp?.totalLeads === 0, 'Landing page 3 has 0 leads');
    assert(targetLp?.has30DayNoLeadWarning === false, 'has30DayNoLeadWarning is FALSE (insufficient history: only 10 days old)');
    assert(targetLp?.inactivityStatus === 'insufficient_history', 'inactivityStatus is INSUFFICIENT_HISTORY');

    // Scenario 1.4: Landing page created 90 days ago, with no leads ever: confirmed inactivity warning
    console.log('\nScenario 1.4: Created 90 days ago, with no leads ever');
    const lp4 = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        title: 'LP-90d-NoLeadsEver',
        url: 'https://gapji.ir/test/lp-4',
        createdAt: daysAgo(90),
      },
    });

    pages = await service.findAllLandingPages(testUser);
    targetLp = pages.find((p) => p.id === lp4.id);
    assert(targetLp !== undefined, 'Landing page 4 retrieved');
    assert(targetLp?.totalLeads === 0, 'Landing page 4 has 0 leads');
    assert(targetLp?.has30DayNoLeadWarning === true, 'has30DayNoLeadWarning is TRUE (confirmed 30+ days inactivity)');
    assert(targetLp?.inactivityStatus === 'inactive_30_days', 'inactivityStatus is INACTIVE_30_DAYS');

    // Scenario 1.5: Distinguish insufficient history (< 30d) from confirmed inactivity (>= 30d with 0 leads)
    console.log('\nScenario 1.5: Distinguishing insufficient history from confirmed inactivity');
    const lp10 = pages.find((p) => p.id === lp3.id);
    const lp90 = pages.find((p) => p.id === lp4.id);
    assert(
      lp10?.has30DayNoLeadWarning === false && lp90?.has30DayNoLeadWarning === true,
      'System correctly distinguishes 10d landing page (no warning) from 90d landing page (warning) when both have 0 leads',
    );
    assert(
      lp10?.inactivityStatus === 'insufficient_history' && lp90?.inactivityStatus === 'inactive_30_days',
      'System attaches precise semantic status: insufficient_history vs inactive_30_days',
    );

    // ========================================================================
    // PART 2: VERIFY CORRECT LEAD ATTRIBUTION IN MULTI-LP CAMPAIGNS
    // ========================================================================
    console.log('\n--- PART 2: Lead Attribution in Multi-LP & Single-LP Campaigns ---\n');

    // 1. Create a campaign that has THREE landing pages
    const multiLpCampaign = await prisma.campaign.create({
      data: {
        organizationId: testOrgId,
        name: 'Multi-LP Summer Campaign',
        channel: 'digital',
        budget: 50000000,
        startDate: new Date(),
      },
    });

    const lpGoogle = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        campaignId: multiLpCampaign.id,
        title: 'Landing Page Google Search',
        url: 'https://gapji.ir/summer/google',
      },
    });

    const lpInstagram = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        campaignId: multiLpCampaign.id,
        title: 'Landing Page Instagram Stories',
        url: 'https://gapji.ir/summer/instagram',
      },
    });

    const lpSms = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        campaignId: multiLpCampaign.id,
        title: 'Landing Page SMS Direct',
        url: 'https://gapji.ir/summer/sms',
      },
    });

    // 2. Create distinct UTM links for each landing page
    const utmGoogle = await prisma.utmLink.create({
      data: {
        organizationId: testOrgId,
        campaignId: multiLpCampaign.id,
        landingPageId: lpGoogle.id,
        originalUrl: lpGoogle.url,
        finalUrl: `${lpGoogle.url}?utm_source=google&utm_medium=cpc&utm_campaign=summer_2026`,
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'summer_2026',
      },
    });

    const utmInstagram = await prisma.utmLink.create({
      data: {
        organizationId: testOrgId,
        campaignId: multiLpCampaign.id,
        landingPageId: lpInstagram.id,
        originalUrl: lpInstagram.url,
        finalUrl: `${lpInstagram.url}?utm_source=instagram&utm_medium=story&utm_campaign=summer_2026`,
        utmSource: 'instagram',
        utmMedium: 'story',
        utmCampaign: 'summer_2026',
      },
    });

    const utmSms = await prisma.utmLink.create({
      data: {
        organizationId: testOrgId,
        campaignId: multiLpCampaign.id,
        landingPageId: lpSms.id,
        originalUrl: lpSms.url,
        finalUrl: `${lpSms.url}?utm_source=sms&utm_medium=direct&utm_campaign=summer_2026`,
        utmSource: 'sms',
        utmMedium: 'direct',
        utmCampaign: 'summer_2026',
      },
    });

    // 3. Create a campaign that has EXACTLY ONE landing page (Unambiguous)
    const singleLpCampaign = await prisma.campaign.create({
      data: {
        organizationId: testOrgId,
        name: 'Single-LP Autumn Campaign',
        channel: 'digital',
        budget: 20000000,
        startDate: new Date(),
      },
    });

    const lpSingle = await prisma.landingPage.create({
      data: {
        organizationId: testOrgId,
        campaignId: singleLpCampaign.id,
        title: 'Landing Page Single Autumn',
        url: 'https://gapji.ir/autumn/exclusive',
      },
    });

    // 4. Create Leads for Multi-LP Campaign with distinct UTM links
    console.log('Scenario 2.1: Multi-LP Campaign with 3 distinct UTM-linked leads');
    await prisma.lead.create({
      data: {
        organizationId: testOrgId,
        fullName: 'Lead From Google Ads',
        mobile: '09121000001',
        campaignId: multiLpCampaign.id,
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'summer_2026',
      },
    });

    await prisma.lead.create({
      data: {
        organizationId: testOrgId,
        fullName: 'Lead From Instagram Story',
        mobile: '09121000002',
        campaignId: multiLpCampaign.id,
        utmSource: 'instagram',
        utmMedium: 'story',
        utmCampaign: 'summer_2026',
      },
    });

    await prisma.lead.create({
      data: {
        organizationId: testOrgId,
        fullName: 'Lead From SMS',
        mobile: '09121000003',
        campaignId: multiLpCampaign.id,
        utmSource: 'sms',
        utmMedium: 'direct',
        utmCampaign: 'summer_2026',
      },
    });

    pages = await service.findAllLandingPages(testUser);
    const pageGoogle = pages.find((p) => p.id === lpGoogle.id);
    const pageInstagram = pages.find((p) => p.id === lpInstagram.id);
    const pageSms = pages.find((p) => p.id === lpSms.id);

    assert(pageGoogle?.totalLeads === 1, 'LP Google receives EXACTLY 1 lead (Google lead only)');
    assert(pageInstagram?.totalLeads === 1, 'LP Instagram receives EXACTLY 1 lead (Instagram lead only)');
    assert(pageSms?.totalLeads === 1, 'LP SMS receives EXACTLY 1 lead (SMS lead only)');

    const totalMulti = (pageGoogle?.totalLeads || 0) + (pageInstagram?.totalLeads || 0) + (pageSms?.totalLeads || 0);
    assert(totalMulti === 3, 'Total leads across the 3 landing pages is exactly 3 (NO DUPLICATION / NO LEAKAGE)');

    // Scenario 2.2: Lead with no UTM in multi-LP campaign
    console.log('\nScenario 2.2: Lead with no UTM in multi-LP campaign (Ambiguous relationship)');
    await prisma.lead.create({
      data: {
        organizationId: testOrgId,
        fullName: 'Ambiguous Lead Without UTM',
        mobile: '09121000004',
        campaignId: multiLpCampaign.id,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
      },
    });

    pages = await service.findAllLandingPages(testUser);
    const pGoogle2 = pages.find((p) => p.id === lpGoogle.id);
    const pInsta2 = pages.find((p) => p.id === lpInstagram.id);
    const pSms2 = pages.find((p) => p.id === lpSms.id);

    assert(pGoogle2?.totalLeads === 1, 'LP Google did NOT arbitrarily claim the ambiguous lead (stays at 1)');
    assert(pInsta2?.totalLeads === 1, 'LP Instagram did NOT arbitrarily claim the ambiguous lead (stays at 1)');
    assert(pSms2?.totalLeads === 1, 'LP SMS did NOT arbitrarily claim the ambiguous lead (stays at 1)');

    // Scenario 2.3: Lead with no UTM in single-LP campaign
    console.log('\nScenario 2.3: Lead with no UTM in single-LP campaign (Unambiguous relationship)');
    await prisma.lead.create({
      data: {
        organizationId: testOrgId,
        fullName: 'Unambiguous Single Campaign Lead',
        mobile: '09121000005',
        campaignId: singleLpCampaign.id,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
      },
    });

    pages = await service.findAllLandingPages(testUser);
    const pSingle = pages.find((p) => p.id === lpSingle.id);
    assert(pSingle?.totalLeads === 1, 'Single-LP campaign attributes lead unambiguously even without UTM (totalLeads: 1)');

    // Scenario 2.4: UtmLinks history attribution
    console.log('\nScenario 2.4: UTM Links history isolation');
    const allUtmLinks = await service.findAllUtmLinks(testUser);
    const utmG = allUtmLinks.find((l) => l.id === utmGoogle.id);
    const utmI = allUtmLinks.find((l) => l.id === utmInstagram.id);
    const utmS = allUtmLinks.find((l) => l.id === utmSms.id);

    assert(utmG?.attributedLeadsCount === 1, 'Google UTM link has exactly 1 attributed lead');
    assert(utmI?.attributedLeadsCount === 1, 'Instagram UTM link has exactly 1 attributed lead');
    assert(utmS?.attributedLeadsCount === 1, 'SMS UTM link has exactly 1 attributed lead');

    // Clean up test data
    await cleanup();
    console.log('\n--- Test Data Cleanup Completed Successfully ---');

    console.log('\n========================================================================');
    console.log(`🏁 TARGETED VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal verification error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTargetedVerification();
