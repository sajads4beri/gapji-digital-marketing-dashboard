import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { SmsService, CurrentUserPayload } from './sms.service';
import { maskPhoneNumber, normalizeMobileNumber } from './sms.utils';

const TEST_DB_URL = 'postgresql://shop:shop1234@127.0.0.1:5432/gapji_test?schema=public';

async function runSmsIntegrationTests() {
  console.log('================================================================');
  console.log('🧪 GAPJI SMS MODULE (PRD p. 17 §17) INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });
  await prisma.$connect();

  const smsService = new SmsService(prisma as any);

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
    // Test 1: Phone Masking & Normalization Utility
    // -------------------------------------------------------------
    console.log('--- 1. Security & Privacy: Phone Masking Utility ---');
    const masked1 = maskPhoneNumber('09123456789');
    testAssert(masked1 === '0912***6789', 'Masks standard Iranian mobile (0912***6789)');
    const masked2 = maskPhoneNumber('+989351234567');
    testAssert(masked2.includes('***'), 'Masks international format with ***');
    const norm1 = normalizeMobileNumber('۰۹۱۲۳۴۵۶۷۸۹');
    testAssert(norm1 === '09123456789', 'Normalizes Persian digits to English digits');

    // -------------------------------------------------------------
    // Test 2: Create Campaign for SMS
    // -------------------------------------------------------------
    console.log('\n--- 2. Setting Up Test Campaign in gapji_test ---');
    let campaign = await prisma.campaign.findFirst({
      where: { organizationId: testOrgA, name: 'کمپین تست بلک فرایدی پیامکی' },
    });
    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          organizationId: testOrgA,
          name: 'کمپین تست بلک فرایدی پیامکی',
          type: 'sms',
          channel: 'sms',
          objective: 'conversion',
          status: 'active',
          health: 'healthy',
          startDate: new Date(),
        },
      });
    }
    testAssert(Boolean(campaign.id), `Test campaign exists: ${campaign.id}`);

    // Clean up any old test sms campaigns in testOrgA
    await prisma.smsRecipient.deleteMany({
      where: { smsCampaign: { name: { startsWith: 'تست یکپارچه' } } },
    });
    await prisma.smsCampaign.deleteMany({
      where: { organizationId: testOrgA, name: { startsWith: 'تست یکپارچه' } },
    });

    // -------------------------------------------------------------
    // Test 3: Create SMS Campaign
    // -------------------------------------------------------------
    console.log('\n--- 3. Create SMS Campaign (سند محصول ص ۱۷) ---');
    const createdSms = await smsService.create(
      {
        campaignId: campaign.id,
        name: 'تست یکپارچه ارسال جشنواره پاییزه',
        senderNumber: '3000505',
        messageText: 'سلام! کد تخفیف ۳۰ درصدی شما: OFF30. برای لغو عدد ۱ را بفرستید.',
        costAmount: 2500000,
      },
      userMarketing,
    );
    testAssert(Boolean(createdSms.id), 'Created SMS campaign record successfully');
    testAssert(createdSms.name === 'تست یکپارچه ارسال جشنواره پاییزه', 'Name matches input');
    testAssert(Number(createdSms.costAmount) === 2500000, 'costAmount matches input (2,500,000)');

    // -------------------------------------------------------------
    // Test 4: SMS List Query (تاریخچه ارسال)
    // -------------------------------------------------------------
    console.log('\n--- 4. SMS List Query & Filtering ---');
    const listRes = await smsService.findAll(
      { search: 'جشنواره پاییزه', page: 1, limit: 10 },
      userMarketing,
    );
    testAssert(listRes.items.length >= 1, 'Found created SMS campaign in search list');
    const firstItem = listRes.items[0];
    testAssert(Boolean(firstItem.campaignName), 'Campaign name is populated in list');
    testAssert(firstItem.messagePreview.length <= 63, 'Shortened preview generated');

    // -------------------------------------------------------------
    // Test 5: Import SMS Results (Action 1)
    // -------------------------------------------------------------
    console.log('\n--- 5. Action 1: Import SMS Results (ص ۱۷) ---');
    const csvData = `شماره تلفن,وضعیت ارسال,متن پاسخ
09121111111,delivered,علاقه‌مندم لطفاً تماس بگیرید
09122222222,delivered,
09123333333,failed,
09124444444,delivered,قیمت چنده؟
09121111111,delivered,علاقه‌مندم لطفاً تماس بگیرید`; // duplicate in batch

    const importRes = await smsService.importResults(
      createdSms.id,
      { csvContent: csvData },
      userMarketing,
    );
    testAssert(importRes.totalRows === 5, 'Detected 5 rows in CSV');
    testAssert(importRes.successfullyImported === 4, 'Successfully imported 4 unique recipients');
    testAssert(importRes.duplicates === 1, 'Detected 1 duplicate in CSV batch');

    // -------------------------------------------------------------
    // Test 6: SMS Detail Query & Unit Cost Calculation
    // -------------------------------------------------------------
    console.log('\n--- 6. SMS Detail Query & Metrics (ص ۱۷) ---');
    const details = await smsService.findOne(createdSms.id, userMarketing);
    testAssert(details.id === createdSms.id, 'Retrieved SMS detail successfully');
    testAssert(details.summary.totalCount === 4, 'Summary totalCount is accurate (4 recipients)');
    testAssert(details.summary.deliveredCount === 3, 'Summary deliveredCount is accurate (3 delivered)');
    testAssert(details.summary.failedCount === 1, 'Summary failedCount is accurate (1 failed)');
    testAssert(details.summary.repliesCount === 2, 'Summary repliesCount is accurate (2 replied)');
    // unitCost = 2500000 / 4 = 625000
    testAssert(details.summary.unitCost === 625000, 'unitCost calculated correctly: 625,000 Toman/SMS');

    // -------------------------------------------------------------
    // Test 7: Recipients Table & Phone Masking
    // -------------------------------------------------------------
    console.log('\n--- 7. Recipients Table & Phone Masking (ص ۱۷) ---');
    const recipientsRes = await smsService.findRecipients(
      createdSms.id,
      { status: 'all', page: 1, limit: 10 },
      userMarketing,
    );
    testAssert(recipientsRes.total === 4, 'Recipients count in DB is 4');

    // Test masking in recipient listing
    const maskedPhone = recipientsRes.items[0].mobileMasked;
    testAssert(maskedPhone.includes('***') && !maskedPhone.includes('1111111'), 'Phone is masked in recipient output (0912***1111)');

    // Verify filter by status
    const failedList = await smsService.findRecipients(
      createdSms.id,
      { status: 'failed', page: 1, limit: 10 },
      userMarketing,
    );
    testAssert(failedList.total === 1, 'Filtered by status=failed correctly (1 recipient)');

    // -------------------------------------------------------------
    // Test 8: Lead Conversion Preview (Action 2-A)
    // -------------------------------------------------------------
    console.log('\n--- 8. Action 2-A: Lead Conversion Preview (ص ۱۷) ---');
    // Clean up any test lead for 09124444444 before preview test
    await prisma.lead.deleteMany({
      where: { organizationId: testOrgA, mobile: '09124444444' },
    });

    // Pre-create a lead with 09121111111 in gapji_test to test duplicate detection
    let existingLead = await prisma.lead.findFirst({
      where: { organizationId: testOrgA, mobile: '09121111111' },
    });
    if (!existingLead) {
      existingLead = await prisma.lead.create({
        data: {
          organizationId: testOrgA,
          fullName: 'کاربر تکراری لید قبلی',
          mobile: '09121111111',
          statusKey: 'contacted',
        },
      });
    }

    const preview = await smsService.convertRepliesPreview(createdSms.id, userMarketing);
    testAssert(preview.totalRespondents === 2, 'Total replied recipients is 2');
    testAssert(preview.duplicateCount === 1, 'Duplicate lead detected: 1 duplicate');
    testAssert(preview.eligibleCount === 1, 'Eligible new leads: 1 eligible');

    // -------------------------------------------------------------
    // Test 9: Lead Conversion Confirm (Action 2-B)
    // -------------------------------------------------------------
    console.log('\n--- 9. Action 2-B: Transactional Lead Creation (ص ۱۷) ---');
    // Clean up any test lead for 09124444444 before running
    await prisma.lead.deleteMany({
      where: { organizationId: testOrgA, mobile: '09124444444' },
    });

    const confirmRes = await smsService.convertRepliesConfirm(createdSms.id, userMarketing);
    testAssert(confirmRes.createdCount === 1, 'Created exactly 1 new lead (non-duplicate)');
    testAssert(confirmRes.skippedDuplicates === 1, 'Skipped exactly 1 duplicate lead');

    // Verify new lead was created with source='sms' and campaign attributed
    const createdLead = await prisma.lead.findFirst({
      where: { organizationId: testOrgA, mobile: '09124444444' },
    });
    testAssert(Boolean(createdLead), 'Created lead found in DB');
    testAssert(createdLead?.source === 'sms', 'Lead source is sms');
    testAssert(createdLead?.campaignId === campaign.id, 'Lead attributed to SMS campaign');

    // -------------------------------------------------------------
    // Test 10: Export CSV (Action 3)
    // -------------------------------------------------------------
    console.log('\n--- 10. Action 3: Export CSV with UTF-8 BOM (ص ۱۷) ---');
    const csvExport = await smsService.exportRecipientsCsv(createdSms.id, userMarketing);
    testAssert(csvExport.startsWith('\uFEFF'), 'CSV starts with UTF-8 BOM marker (\\uFEFF)');
    testAssert(csvExport.includes('شماره تلفن (ماسک‌شده)') && csvExport.includes('وضعیت ارسال'), 'Contains Persian header');
    testAssert(csvExport.includes('0912***1111'), 'Phone is masked in export');
    testAssert(!csvExport.includes('09121111111'), 'Raw phone number is NOT exposed in export');

    // -------------------------------------------------------------
    // Test 11: Role-Based Access Control (RBAC)
    // -------------------------------------------------------------
    console.log('\n--- 11. Role-Based Access Control (RBAC ص ۱۷) ---');
    // Admin allowed
    const adminCheck = await smsService.findAll({}, userAdmin);
    testAssert(Boolean(adminCheck), 'Admin role is allowed access');

    // Campaign Manager allowed
    const cmCheck = await smsService.findAll({}, userCampaignMgr);
    testAssert(Boolean(cmCheck), 'Campaign Manager role is allowed access');

    // Sales Agent denied
    let salesBlocked = false;
    try {
      await smsService.findAll({}, userSales);
    } catch (e: any) {
      salesBlocked = e.status === 403 || e.name === 'ForbiddenException';
    }
    testAssert(salesBlocked, 'Sales agent role is blocked with 403 Forbidden');

    // -------------------------------------------------------------
    // Test 12: Multi-tenant Organization Isolation
    // -------------------------------------------------------------
    console.log('\n--- 12. Multi-Tenant Organization Data Isolation ---');
    let crossOrgBlocked = false;
    try {
      await smsService.findOne(createdSms.id, userOrgB);
    } catch (e: any) {
      crossOrgBlocked = e.status === 404 || e.name === 'NotFoundException';
    }
    testAssert(crossOrgBlocked, 'User from Org B cannot access SMS campaign from Org A (404 Isolated)');

    console.log('\n================================================================');
    console.log(`📊 SMS SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runSmsIntegrationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
