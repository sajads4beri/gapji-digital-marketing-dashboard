import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { WebinarsService, CurrentUserPayload } from './webinars.service';
import { maskPhoneNumber } from '../sms/sms.utils';

const TEST_DB_URL = 'postgresql://shop:shop1234@127.0.0.1:5432/gapji_test?schema=public';

async function runWebinarIntegrationTests() {
  console.log('================================================================');
  console.log('🧪 GAPJI WEBINARS MODULE (PRD p. 17 & 18 §18) INTEGRATION SUITE');
  console.log('================================================================\n');

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });
  await prisma.$connect();

  const webinarsService = new WebinarsService(prisma as any);

  let passed = 0;
  let failed = 0;

  function testAssert(condition: boolean, testName: string, details: string = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  const testOrgA = '00000000-0000-0000-0000-000000000001';
  const testOrgB = '00000000-0000-0000-0000-000000000099';

  const userAdmin: CurrentUserPayload = {
    id: '00000000-0000-0000-0000-000000000088',
    email: 'admin@gapji.dev',
    role: 'admin',
    organizationId: testOrgA,
  };

  const userMarketing: CurrentUserPayload = {
    id: '00000000-0000-0000-0000-000000000089',
    email: 'marketing@gapji.dev',
    role: 'marketing_manager',
    organizationId: testOrgA,
  };

  const userWebinarMgr: CurrentUserPayload = {
    id: '00000000-0000-0000-0000-000000000093',
    email: 'creator@gapji.dev',
    role: 'content_creator', // مسئول وبینار طبق تعریف
    organizationId: testOrgA,
  };

  const userCampaignMgr: CurrentUserPayload = {
    id: '00000000-0000-0000-0000-000000000090',
    email: 'campaign@gapji.dev',
    role: 'campaign_manager',
    organizationId: testOrgA,
  };

  const userSales: CurrentUserPayload = {
    id: '00000000-0000-0000-0000-000000000091',
    email: 'sales@gapji.dev',
    role: 'sales_agent',
    organizationId: testOrgA,
  };

  const userOrgB: CurrentUserPayload = {
    id: '00000000-0000-0000-0000-000000000092',
    email: 'other@org-b.dev',
    role: 'marketing_manager',
    organizationId: testOrgB,
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Setup Test Campaign & Equipment Item
    // -------------------------------------------------------------
    console.log('--- 1. Setup Test Campaign & Equipment in gapji_test ---');
    let campaign = await prisma.campaign.findFirst({
      where: { organizationId: testOrgA, name: 'کمپین وبیناری جذب پاییز' },
    });
    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          organizationId: testOrgA,
          name: 'کمپین وبیناری جذب پاییز',
          type: 'webinar',
          channel: 'webinar',
          objective: 'lead',
          status: 'active',
          health: 'healthy',
          startDate: new Date(),
        },
      });
    }
    testAssert(Boolean(campaign.id), `Campaign exists: ${campaign.id}`);

    let equipItem = await prisma.equipmentItem.findFirst({
      where: { organizationId: testOrgA, name: 'میکروفون بی سیم رود' },
    });
    if (!equipItem) {
      equipItem = await prisma.equipmentItem.create({
        data: {
          organizationId: testOrgA,
          name: 'میکروفون بی سیم رود',
          category: 'صدا',
          description: 'میکروفون یقه‌ای برای وبینار و رکورد استودیو',
        },
      });
    }
    testAssert(Boolean(equipItem.id), `EquipmentItem exists: ${equipItem.id}`);

    // Clean up old test webinars
    await prisma.eventEquipment.deleteMany({
      where: { webinar: { title: { startsWith: 'وبینار تست یکپارچه' } } },
    });
    await prisma.task.deleteMany({
      where: { relatedType: 'webinar', organizationId: testOrgA },
    });
    await prisma.webinarAttendee.deleteMany({
      where: { webinar: { title: { startsWith: 'وبینار تست یکپارچه' } } },
    });
    await prisma.webinar.deleteMany({
      where: { organizationId: testOrgA, title: { startsWith: 'وبینار تست یکپارچه' } },
    });

    // -------------------------------------------------------------
    // Test 2: Create Webinar (ص ۱۷ - پیش‌نویس اولیه)
    // -------------------------------------------------------------
    console.log('\n--- 2. Create Webinar (پیش‌نویس اولیه - ص ۱۷) ---');
    const createdWebinar = await webinarsService.create(
      {
        title: 'وبینار تست یکپارچه استراتژی مارکتینگ ۱۴۰۵',
        description: 'راهکارهای نوین رشد و جذب مشتری',
        presenterName: 'دکتر علوی',
        platform: 'Skyroom',
        webinarDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        durationMinutes: 90,
        registrationUrl: 'https://skyroom.online/ch/gapji/marketing',
        capacity: 200,
        campaignId: campaign.id,
      },
      userWebinarMgr,
    );
    testAssert(Boolean(createdWebinar.id), 'Created webinar record in DB');
    testAssert(createdWebinar.status === 'draft', 'Initial status is draft (پیش‌نویس اولیه)');
    testAssert(createdWebinar.isPublished === false, 'isPublished is false in draft mode');
    testAssert(createdWebinar.campaignName === 'کمپین وبیناری جذب پاییز', 'Campaign relation linked');

    // -------------------------------------------------------------
    // Test 3: Webinar List Query (ص ۱۷)
    // -------------------------------------------------------------
    console.log('\n--- 3. Webinar List Query & Search (ص ۱۷) ---');
    const list = await webinarsService.findAll(
      { search: 'مارکتینگ ۱۴۰۵', page: 1, limit: 10 },
      userWebinarMgr,
    );
    testAssert(list.items.length >= 1, 'Found created webinar in search query');
    testAssert(list.items[0].title === 'وبینار تست یکپارچه استراتژی مارکتینگ ۱۴۰۵', 'Title matches');
    testAssert(list.items[0].campaignName === 'کمپین وبیناری جذب پاییز', 'Campaign displayed in table');

    // -------------------------------------------------------------
    // Test 4: Webinar Status Transitions & Publication Workflow (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 4. Publication Workflow & Status Transitions (ص ۱۸) ---');
    const pubRes = await webinarsService.updateStatus(
      createdWebinar.id,
      { status: 'scheduled' },
      userWebinarMgr,
    );
    testAssert(pubRes.status === 'scheduled', 'Transitioned from draft to scheduled');
    testAssert(pubRes.isPublished === true, 'isPublished became true upon publication');

    // -------------------------------------------------------------
    // Test 5: Action 1 - Import Registration & Attendance (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 5. Action 1: Import Registration & Attendance (ص ۱۸) ---');
    const csvAttendees = `نام و نام خانوادگی,شماره تلفن,ایمیل,وضعیت حضور
سارا حسینی,09121112233,sara@test.com,حاضر
علی راد,09122223344,ali@test.com,غایب
مهسا کریمی,09123334455,mahsa@test.com,حاضر
رضا نوری,09124445566,reza@test.com,حاضر
سارا حسینی,09121112233,sara@test.com,حاضر`; // duplicate in batch

    const importRes = await webinarsService.importAttendees(
      createdWebinar.id,
      { csvContent: csvAttendees },
      userWebinarMgr,
    );
    testAssert(importRes.totalRows === 5, 'Parsed 5 rows from CSV');
    testAssert(importRes.successfullyImported === 4, 'Successfully imported 4 unique attendees');
    testAssert(importRes.duplicates === 1, 'Identified 1 duplicate attendee in batch');

    // Verify database counts updated
    const countCheck = await prisma.webinar.findUnique({
      where: { id: createdWebinar.id },
      select: { registeredCount: true, attendedCount: true },
    });
    testAssert(countCheck?.registeredCount === 4, 'Webinar registeredCount updated to 4');
    testAssert(countCheck?.attendedCount === 3, 'Webinar attendedCount updated to 3 (حاضر)');

    // -------------------------------------------------------------
    // Test 6: Tab 2 - Attendees List & Privacy Masking (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 6. Tab 2: Attendees List & Masked Phones (ص ۱۸) ---');
    const attendeesList = await webinarsService.findAttendees(
      createdWebinar.id,
      { page: 1, limit: 10 },
      userWebinarMgr,
    );
    testAssert(attendeesList.total === 4, 'Total attendees listed is 4');
    const firstAttendee = attendeesList.items[0];
    testAssert(firstAttendee.mobileMasked.includes('***'), 'Attendee phone masked (e.g. 0912***2233)');
    testAssert(!firstAttendee.mobileMasked.includes('1112233'), 'Raw phone number NOT exposed in API output');

    // Filter by attendance status
    const attendedOnly = await webinarsService.findAttendees(
      createdWebinar.id,
      { attendanceStatus: 'attended', page: 1, limit: 10 },
      userWebinarMgr,
    );
    testAssert(attendedOnly.total === 3, 'Filtered attended=true correctly (3 attendees)');

    // -------------------------------------------------------------
    // Test 7: Action 2-A - Lead Conversion Preview (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 7. Action 2-A: Lead Conversion Preview (ص ۱۸) ---');
    // Pre-create an existing lead for 09121112233
    await prisma.lead.deleteMany({
      where: { organizationId: testOrgA, mobile: { in: ['09121112233', '09123334455', '09124445566'] } },
    });
    await prisma.lead.create({
      data: {
        organizationId: testOrgA,
        fullName: 'سارا حسینی (لید قدیمی)',
        mobile: '09121112233',
        statusKey: 'contacted',
      },
    });

    const leadPreview = await webinarsService.convertAttendeesPreview(createdWebinar.id, userWebinarMgr);
    testAssert(leadPreview.totalEligibleAttendees === 3, 'Found 3 attended participants');
    testAssert(leadPreview.duplicateCount === 1, '1 duplicate lead detected (09121112233)');
    testAssert(leadPreview.eligibleCount === 2, '2 eligible new leads detected');

    // -------------------------------------------------------------
    // Test 8: Action 2-B - Transactional Lead Creation Confirm (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 8. Action 2-B: Transactional Lead Creation Confirm (ص ۱۸) ---');
    const leadConfirm = await webinarsService.convertAttendeesConfirm(createdWebinar.id, userWebinarMgr);
    testAssert(leadConfirm.createdCount === 2, 'Created exactly 2 new leads');
    testAssert(leadConfirm.skippedDuplicates === 1, 'Skipped 1 duplicate lead');

    // Verify attendee leadId was linked in DB
    const convertedAttendees = await prisma.webinarAttendee.findMany({
      where: { webinarId: createdWebinar.id, leadId: { not: null } },
    });
    testAssert(convertedAttendees.length === 2, '2 attendee records have leadId set');

    // Verify lead source & attribution
    const createdLead = await prisma.lead.findFirst({
      where: { organizationId: testOrgA, mobile: '09123334455' },
    });
    testAssert(createdLead?.source === 'webinar', 'Lead source is webinar');
    testAssert(createdLead?.campaignId === campaign.id, 'Lead attributed to webinar campaign');

    // -------------------------------------------------------------
    // Test 9: Tab 3 - Equipment Association (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 9. Tab 3: Equipment Association & Status (ص ۱۸) ---');
    const eqCreated = await webinarsService.addEquipment(
      createdWebinar.id,
      {
        equipmentItemId: equipItem.id,
        notes: 'بررسی باتری قبل از شروع لایو',
      },
      userWebinarMgr,
    );
    testAssert(Boolean(eqCreated.id), 'Equipment linked to webinar');
    testAssert(eqCreated.status === 'not_procured', 'Initial status not_procured');

    // -------------------------------------------------------------
    // Test 10: Tab 4 - Tasks Association (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 10. Tab 4: Tasks Association (ص ۱۸) ---');
    const taskCreated = await webinarsService.addTask(
      createdWebinar.id,
      {
        title: 'طراحی اسلایدهای ارائه وبینار',
        description: 'قالب رسمی گپجی طبق هویت بصری',
        priority: 'high',
      },
      userWebinarMgr,
    );
    testAssert(Boolean(taskCreated.id), 'Task linked to webinar');
    testAssert(taskCreated.relatedType === 'webinar', 'Task relatedType is webinar');
    testAssert(taskCreated.relatedId === createdWebinar.id, 'Task relatedId matches webinar.id');

    // -------------------------------------------------------------
    // Test 11: 4-Tab Details Complete Aggregation (ص ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 11. Complete 4-Tab Details Aggregation (ص ۱۸) ---');
    const fullWebinar = await webinarsService.findOne(createdWebinar.id, userWebinarMgr);

    // Tab 1 check
    testAssert(fullWebinar.title === 'وبینار تست یکپارچه استراتژی مارکتینگ ۱۴۰۵', 'Tab 1: Title matches');
    testAssert(fullWebinar.campaignName === 'کمپین وبیناری جذب پاییز', 'Tab 1: Campaign name matches');

    // Tab 2 check (Funnel: ثبت‌نام ← حضور ← لید)
    testAssert(fullWebinar.funnel.registeredCount === 4, 'Tab 2 Funnel: registeredCount = 4');
    testAssert(fullWebinar.funnel.attendedCount === 3, 'Tab 2 Funnel: attendedCount = 3');
    testAssert(fullWebinar.funnel.convertedLeadsCount === 2, 'Tab 2 Funnel: convertedLeadsCount = 2');
    testAssert(fullWebinar.funnel.attendanceRate === 75, 'Tab 2 Funnel: attendanceRate = 75% (3/4)');
    testAssert(fullWebinar.funnel.conversionRate === 67, 'Tab 2 Funnel: conversionRate = 67% (2/3)');

    // Tab 3 check
    testAssert(fullWebinar.equipments.length === 1, 'Tab 3: 1 equipment linked');
    testAssert(fullWebinar.equipmentSummary.total === 1, 'Tab 3 Summary: total = 1');
    testAssert(fullWebinar.equipmentSummary.notProcured === 1, 'Tab 3 Summary: notProcured = 1');

    // Tab 4 check
    testAssert(fullWebinar.tasks.length === 1, 'Tab 4: 1 task linked');
    testAssert(fullWebinar.tasks[0].title === 'طراحی اسلایدهای ارائه وبینار', 'Tab 4 Task: title matches');

    // -------------------------------------------------------------
    // Test 12: Role-Based Access Control (RBAC ص ۱۷ و ۱۸)
    // -------------------------------------------------------------
    console.log('\n--- 12. Role-Based Access Control (RBAC ص ۱۷ و ۱۸) ---');
    // Admin allowed
    const adminCheck = await webinarsService.findAll({}, userAdmin);
    testAssert(Boolean(adminCheck), 'Admin role is allowed access');

    // Marketing Manager allowed
    const mktCheck = await webinarsService.findAll({}, userMarketing);
    testAssert(Boolean(mktCheck), 'Marketing Manager role is allowed access');

    // Content Creator (مسئول وبینار) allowed
    const creatorCheck = await webinarsService.findAll({}, userWebinarMgr);
    testAssert(Boolean(creatorCheck), 'Content Creator role is allowed access');

    // Sales Agent denied
    let salesBlocked = false;
    try {
      await webinarsService.findAll({}, userSales);
    } catch (e: any) {
      salesBlocked = e.status === 403 || e.name === 'ForbiddenException';
    }
    testAssert(salesBlocked, 'Sales Agent is denied with 403 Forbidden');

    // Campaign Manager denied
    let cmBlocked = false;
    try {
      await webinarsService.findAll({}, userCampaignMgr);
    } catch (e: any) {
      cmBlocked = e.status === 403 || e.name === 'ForbiddenException';
    }
    testAssert(cmBlocked, 'Campaign Manager is denied with 403 Forbidden (سند محصول)');

    // -------------------------------------------------------------
    // Test 13: Multi-tenant Organization Isolation
    // -------------------------------------------------------------
    console.log('\n--- 13. Multi-Tenant Organization Data Isolation ---');
    let crossOrgBlocked = false;
    try {
      await webinarsService.findOne(createdWebinar.id, userOrgB);
    } catch (e: any) {
      crossOrgBlocked = e.status === 404 || e.name === 'NotFoundException';
    }
    testAssert(crossOrgBlocked, 'User from Org B cannot access Webinar from Org A (404 Isolated)');

    console.log('\n================================================================');
    console.log(`📊 WEBINARS SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runWebinarIntegrationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
