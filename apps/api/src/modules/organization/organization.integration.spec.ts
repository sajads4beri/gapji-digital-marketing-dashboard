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

import * as assert from 'assert';
import { PrismaClient, Currency, LeadStatusGroup, Role } from '@prisma/client';
import { OrganizationService, CurrentUserPayload } from './organization.service';
import { PrismaService } from '../../database/prisma.service';

const prisma = new PrismaClient();
const prismaService = new PrismaService();
const orgService = new OrganizationService(prismaService);

const PRIMARY_ORG_ID = '00000000-0000-0000-0000-000000000001';
const SECONDARY_ORG_ID = '00000000-0000-0000-0000-000000000002';

const ADMIN_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000001',
  email: 'admin@gapji.dev',
  organizationId: PRIMARY_ORG_ID,
  role: 'admin',
};

const MARKETING_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000002',
  email: 'marketing@gapji.dev',
  organizationId: PRIMARY_ORG_ID,
  role: 'marketing_manager',
};

const CLIENT_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000006',
  email: 'client@gapji.dev',
  organizationId: PRIMARY_ORG_ID,
  role: 'client',
};

async function runTests() {
  console.log('🏢 ========================================================');
  console.log('🏢 Real PostgreSQL Organization & Taxonomies Integration Tests');
  console.log('🏢 Target Database: gapji_dev (PostgreSQL Instance)');
  console.log('🏢 ========================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ ${name}`);
      console.error('     Error:', err?.message || err);
      failed++;
    }
  }

  // Ensure primary organization exists
  await prisma.organization.upsert({
    where: { id: PRIMARY_ORG_ID },
    update: {},
    create: {
      id: PRIMARY_ORG_ID,
      name: 'آژانس دیجیتال مارکتینگ گپ‌جی',
      slug: 'gapji-marketing',
      currency: Currency.TOMAN,
      timezone: 'Asia/Tehran',
    },
  });

  console.log('--- 1. General Settings & RBAC ---');

  await test('1.1: should allow any authenticated member to read general settings', async () => {
    const settings = await orgService.getGeneralSettings(CLIENT_USER);
    assert.ok(settings);
    assert.strictEqual(settings.id, PRIMARY_ORG_ID);
    assert.ok(settings.name);
    assert.ok(settings.currency === 'TOMAN' || settings.currency === 'IRR');
  });

  await test('1.2: should reject non-admin updating general settings with 403 Forbidden', async () => {
    await assert.rejects(
      async () => {
        await orgService.updateGeneralSettings(
          { name: 'نام غیرمجاز' },
          MARKETING_USER,
        );
      },
      (err: any) => {
        assert.strictEqual(err.status, 403);
        return true;
      },
    );
  });

  await test('1.3: should allow admin to update general settings (name, currency, timezone, logoUrl)', async () => {
    const updated = await orgService.updateGeneralSettings(
      {
        name: 'شرکت دیجیتال مارکتینگ گپ‌جی به‌روزشده',
        currency: 'TOMAN',
        timezone: 'Asia/Tehran',
        logoUrl: 'https://gapji.dev/logo.png',
      },
      ADMIN_USER,
    );

    assert.strictEqual(updated.name, 'شرکت دیجیتال مارکتینگ گپ‌جی به‌روزشده');
    assert.strictEqual(updated.currency, 'TOMAN');
    assert.strictEqual(updated.logoUrl, 'https://gapji.dev/logo.png');

    // Verify in DB
    const dbOrg = await prisma.organization.findUnique({ where: { id: PRIMARY_ORG_ID } });
    assert.strictEqual(dbOrg?.name, 'شرکت دیجیتال مارکتینگ گپ‌جی به‌روزشده');
  });

  console.log('\n--- 2. Idempotent Default Seeding & Listing ---');

  await test('2.1: should auto-seed and return default campaign types for organization', async () => {
    const items = await orgService.getListItems('campaign_types', MARKETING_USER);
    assert.ok(items.length >= 6);
    const googleAds = items.find((i) => i.key === 'google_ads');
    assert.ok(googleAds);
    assert.strictEqual(googleAds.label, 'گوگل ادز');
    assert.strictEqual(googleAds.isActive, true);
  });

  await test('2.2: should auto-seed and return default lead sources', async () => {
    const items = await orgService.getListItems('lead_sources', CLIENT_USER);
    assert.ok(items.length >= 5);
    const instagram = items.find((i) => i.key === 'instagram');
    assert.ok(instagram);
    assert.strictEqual(instagram.label, 'اینستاگرام');
  });

  await test('2.3: should auto-seed and return default lead statuses with group and colors', async () => {
    const items = await orgService.getListItems('lead_statuses', MARKETING_USER);
    assert.ok(items.length >= 6);
    const newStatus = items.find((i) => i.key === 'new');
    assert.ok(newStatus);
    assert.strictEqual(newStatus.group, LeadStatusGroup.open);
    assert.strictEqual(newStatus.color, 'blue');

    const wonStatus = items.find((i) => i.key === 'won');
    assert.ok(wonStatus);
    assert.strictEqual(wonStatus.group, LeadStatusGroup.won);
  });

  await test('2.4: should auto-seed and return default lost reasons', async () => {
    const items = await orgService.getListItems('lost_reasons', MARKETING_USER);
    assert.ok(items.length >= 5);
    const budgetLimit = items.find((i) => i.key === 'budget_limit');
    assert.ok(budgetLimit);
  });

  await test('2.5: should auto-seed and return default cost categories', async () => {
    const items = await orgService.getListItems('cost_categories', MARKETING_USER);
    assert.ok(items.length >= 5);
    const adMedia = items.find((i) => i.key === 'ad_media');
    assert.ok(adMedia);
    assert.strictEqual(adMedia.label, 'رسانه تبلیغاتی');
  });

  console.log('\n--- 3. Campaign Types CRUD & Protection (OrganizationTaxonomy) ---');

  let customTypeId: string;

  await test('3.1: should reject non-admin from creating a campaign type', async () => {
    await assert.rejects(
      async () => {
        await orgService.createListItem('campaign_types', { label: 'تیک‌تاک' }, MARKETING_USER);
      },
      (err: any) => {
        assert.strictEqual(err.status, 403);
        return true;
      },
    );
  });

  await test('3.2: should allow admin to create a new campaign type', async () => {
    const created = await orgService.createListItem(
      'campaign_types',
      { label: 'کمپین تیک‌تاک مارکتینگ', key: 'tiktok_ads' },
      ADMIN_USER,
    );

    assert.ok(created.id);
    assert.strictEqual(created.label, 'کمپین تیک‌تاک مارکتینگ');
    assert.strictEqual(created.key, 'tiktok_ads');
    assert.strictEqual(created.isActive, true);
    assert.strictEqual(created.usageCount, 0);
    customTypeId = created.id;
  });

  await test('3.3: should allow admin to update a campaign type label', async () => {
    const updated = await orgService.updateListItem(
      'campaign_types',
      customTypeId,
      { label: 'کمپین ویدیویی تیک‌تاک' },
      ADMIN_USER,
    );

    assert.strictEqual(updated.label, 'کمپین ویدیویی تیک‌تاک');
  });

  await test('3.4: should allow admin to toggle active status of a campaign type', async () => {
    const toggled = await orgService.toggleListItemStatus(
      'campaign_types',
      customTypeId,
      ADMIN_USER,
    );
    assert.strictEqual(toggled.isActive, false);

    const toggledBack = await orgService.toggleListItemStatus(
      'campaign_types',
      customTypeId,
      ADMIN_USER,
    );
    assert.strictEqual(toggledBack.isActive, true);
  });

  await test('3.5: should allow deleting an unreferenced campaign type', async () => {
    const res = await orgService.deleteListItem('campaign_types', customTypeId, ADMIN_USER);
    assert.strictEqual(res.success, true);

    await assert.rejects(async () => {
      await orgService.getListItemById('campaign_types', customTypeId, ADMIN_USER);
    });
  });

  console.log('\n--- 4. Lead Statuses CRUD & Reordering (LeadStatusConfig) ---');

  let customStatusId: string;

  await test('4.1: should allow admin to create a new lead status', async () => {
    const created = await orgService.createListItem(
      'lead_statuses',
      {
        label: 'جلسه حضوری هماهنگ شد',
        key: 'meeting_scheduled',
        group: LeadStatusGroup.open,
        color: 'teal',
      },
      ADMIN_USER,
    );

    assert.ok(created.id);
    assert.strictEqual(created.key, 'meeting_scheduled');
    assert.strictEqual(created.group, LeadStatusGroup.open);
    assert.strictEqual(created.color, 'teal');
    customStatusId = created.id;
  });

  await test('4.2: should allow admin to update lead status properties', async () => {
    const updated = await orgService.updateListItem(
      'lead_statuses',
      customStatusId,
      { color: 'cyan', label: 'جلسه دمو آنلاین' },
      ADMIN_USER,
    );

    assert.strictEqual(updated.color, 'cyan');
    assert.strictEqual(updated.label, 'جلسه دمو آنلاین');
  });

  await test('4.3: should allow admin to reorder lead statuses', async () => {
    const list = await orgService.getListItems('lead_statuses', ADMIN_USER);
    const reversedIds = list.map((i) => i.id).reverse();

    const reordered = await orgService.reorderListItems(
      'lead_statuses',
      { orderedIds: reversedIds },
      ADMIN_USER,
    );

    assert.strictEqual(reordered[0].id, reversedIds[0]);
    assert.strictEqual(reordered[0].order, 1);
  });

  await test('4.4: should allow deleting unreferenced lead status', async () => {
    const res = await orgService.deleteListItem('lead_statuses', customStatusId, ADMIN_USER);
    assert.strictEqual(res.success, true);
  });

  console.log('\n--- 5. Cost Categories CRUD (CostCategory) ---');

  let customCostCatId: string;

  await test('5.1: should allow admin to create a new cost category', async () => {
    const created = await orgService.createListItem(
      'cost_categories',
      {
        label: 'هزینه‌های چاپی و هدایای تبلیغاتی',
        key: 'print_merchandise',
        description: 'هدایای نمایشگاهی، کاتالوگ و بسته‌بندی برند',
      },
      ADMIN_USER,
    );

    assert.ok(created.id);
    assert.strictEqual(created.label, 'هزینه‌های چاپی و هدایای تبلیغاتی');
    assert.strictEqual(created.key, 'print_merchandise');
    customCostCatId = created.id;
  });

  await test('5.2: should allow admin to update cost category description', async () => {
    const updated = await orgService.updateListItem(
      'cost_categories',
      customCostCatId,
      { description: 'توضیحات به‌روزشده' },
      ADMIN_USER,
    );

    assert.strictEqual(updated.description, 'توضیحات به‌روزشده');
  });

  await test('5.3: should allow deleting unreferenced cost category', async () => {
    const res = await orgService.deleteListItem('cost_categories', customCostCatId, ADMIN_USER);
    assert.strictEqual(res.success, true);
  });

  console.log('\n--- 6. Usage Protection Against Physical Deletion ---');

  await test('6.1: should calculate usageCount > 0 and block physical deletion of referenced campaign type', async () => {
    const items = await orgService.getListItems('campaign_types', ADMIN_USER);
    const googleAds = items.find((i) => i.key === 'google_ads');
    assert.ok(googleAds);

    // Create a temporary campaign using google_ads type
    const testCamp = await prisma.campaign.create({
      data: {
        organizationId: PRIMARY_ORG_ID,
        name: 'کمپین تستی برای تست usageCount',
        type: googleAds.key,
        channel: googleAds.label,
      },
    });

    try {
      const reloaded = await orgService.getListItemById('campaign_types', googleAds.id, ADMIN_USER);
      assert.ok(reloaded.usageCount > 0);

      // Attempt deletion must fail with 400 Bad Request
      await assert.rejects(
        async () => {
          await orgService.deleteListItem('campaign_types', googleAds.id, ADMIN_USER);
        },
        (err: any) => {
          assert.strictEqual(err.status, 400);
          assert.ok(err.message.includes('امکان حذف فیزیکی'));
          return true;
        },
      );
    } finally {
      await prisma.campaign.delete({ where: { id: testCamp.id } });
    }
  });

  console.log('\n--- 7. Activity Logging ---');

  await test('7.1: should write audit log in UserActivityLog upon setting changes', async () => {
    const logsBefore = await prisma.userActivityLog.count({
      where: { organizationId: PRIMARY_ORG_ID, action: 'ORGANIZATION_SETTINGS_UPDATED' },
    });

    await orgService.updateGeneralSettings(
      { name: 'آژانس دیجیتال مارکتینگ گپ‌جی' },
      ADMIN_USER,
    );

    const logsAfter = await prisma.userActivityLog.count({
      where: { organizationId: PRIMARY_ORG_ID, action: 'ORGANIZATION_SETTINGS_UPDATED' },
    });

    assert.strictEqual(logsAfter, logsBefore + 1);
  });

  console.log('\n========================================');
  console.log('🏢 Organization & Taxonomies Test Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('========================================');

  await prisma.$disconnect();
  await prismaService.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  prisma.$disconnect();
  prismaService.$disconnect();
  process.exit(1);
});
