import assert from 'node:assert';
import { PlatformsService, CurrentUserPayload } from './platforms.service';
import { PlatformRetrievalMethod } from '@prisma/client';

async function runStorageIsolationTests() {
  console.log('🧪 Running Taxonomy Storage Isolation & Safety Verification Tests...');

  const org1 = '00000000-0000-0000-0000-000000000001';
  const org2 = '00000000-0000-0000-0000-000000000002';

  const userOrg1: CurrentUserPayload = {
    id: 'u1',
    email: 'admin@org1.dev',
    organizationId: org1,
    role: 'admin',
  };

  const userOrg2: CurrentUserPayload = {
    id: 'u2',
    email: 'admin@org2.dev',
    organizationId: org2,
    role: 'admin',
  };

  // شبیه‌سازی دقیق دیتابیس در حافظه
  const dbPlatforms: any[] = [];
  const dbTaxonomies: any[] = [
    // رکوردهای موجود معمولی در سازمان
    { id: 'tax-1', organizationId: org1, taxonomyType: 'campaign_type', key: 'omnichannel', label: 'چندکاناله' },
    { id: 'tax-2', organizationId: org1, taxonomyType: 'lead_source', key: 'google_ads', label: 'گوگل ادز' },
    { id: 'tax-3', organizationId: org1, taxonomyType: 'lost_reason', key: 'budget_limit', label: 'محدودیت بودجه' },
  ];

  const mockPrisma: any = {
    platform: {
      findMany: async ({ where }: any) => {
        return dbPlatforms.filter((p) => p.organizationId === where.organizationId);
      },
      findFirst: async ({ where }: any) => {
        return dbPlatforms.find((p) => p.id === where.id && p.organizationId === where.organizationId) || null;
      },
      findUnique: async ({ where }: any) => {
        return dbPlatforms.find((p) => p.organizationId === where.organizationId_code?.organizationId && p.code === where.organizationId_code?.code) || null;
      },
      create: async ({ data }: any) => {
        const item = { id: `plat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        dbPlatforms.push(item);
        return item;
      },
      update: async ({ where, data }: any) => {
        const item = dbPlatforms.find((p) => p.id === where.id);
        if (item) Object.assign(item, data);
        return item;
      },
    },
    campaignPlatformAllocation: { findMany: async () => [] },
    campaign: { findMany: async () => [] },
    organizationTaxonomy: {
      findMany: async ({ where }: any) => {
        return dbTaxonomies.filter((t) => {
          if (t.organizationId !== where.organizationId) return false;
          if (where.taxonomyType?.in && !where.taxonomyType.in.includes(t.taxonomyType)) return false;
          if (where.key?.startsWith && !t.key.startsWith(where.key.startsWith)) return false;
          return true;
        });
      },
      create: async ({ data }: any) => {
        const item = { id: `tax-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...data };
        dbTaxonomies.push(item);
        return item;
      },
      deleteMany: async ({ where }: any) => {
        const initialLen = dbTaxonomies.length;
        const remaining = dbTaxonomies.filter((t) => {
          if (t.organizationId !== where.organizationId) return true;
          if (where.taxonomyType?.in && !where.taxonomyType.in.includes(t.taxonomyType)) return true;
          if (where.key?.startsWith && !t.key.startsWith(where.key.startsWith)) return true;
          return false;
        });
        const deletedCount = initialLen - remaining.length;
        dbTaxonomies.length = 0;
        dbTaxonomies.push(...remaining);
        return { count: deletedCount };
      },
    },
  };

  const service = new PlatformsService(mockPrisma);

  // 1. ایجاد پلتفرم اول در Org 1
  console.log('  1. Creating Platform A in Org 1...');
  const platA = await service.create(
    {
      name: 'پلتفرم A',
      category: 'digital',
      retrievalMethod: PlatformRetrievalMethod.api,
      inputs: [
        { name: 'فیلد ۱', key: 'field_1', dataType: 'number', isRequired: true },
        { name: 'فیلد ۲', key: 'field_2', dataType: 'text', isRequired: false },
      ],
      outputs: [{ key: 'col_1', label: 'ستون ۱' }],
    },
    userOrg1,
  );

  // 2. ایجاد پلتفرم دوم در Org 1
  console.log('  2. Creating Platform B in Org 1...');
  const platB = await service.create(
    {
      name: 'پلتفرم B',
      category: 'social',
      retrievalMethod: PlatformRetrievalMethod.import,
      inputs: [{ name: 'فیلد ۳', key: 'field_3', dataType: 'date', isRequired: true }],
      outputs: [{ key: 'col_2', label: 'ستون ۲' }],
    },
    userOrg1,
  );

  // 3. بررسی عدم تداخل پلتفرم A و B
  console.log('  3. Verifying isolation between Platform A and Platform B...');
  const fetchedA = await service.findOne(platA.id, userOrg1);
  const fetchedB = await service.findOne(platB.id, userOrg1);

  assert.strictEqual(fetchedA.inputs.length, 2, 'Platform A must have exactly 2 inputs');
  assert.strictEqual(fetchedA.outputs.length, 1, 'Platform A must have exactly 1 output');
  assert.strictEqual(fetchedB.inputs.length, 1, 'Platform B must have exactly 1 input');
  assert.strictEqual(fetchedB.outputs.length, 1, 'Platform B must have exactly 1 output');
  assert.strictEqual(fetchedB.inputs[0].key, 'field_3');

  // 4. ویرایش پلتفرم A و اطمینان از دست‌نخوردن پلتفرم B و تاکسونومی‌های عادی
  console.log('  4. Updating Platform A fields and verifying Platform B remains untouched...');
  await service.update(
    platA.id,
    {
      inputs: [
        { name: 'فیلد ۱ اصلاح‌شده', key: 'field_1', dataType: 'number', isRequired: true },
        { name: 'فیلد ۴ جدید', key: 'field_4', dataType: 'boolean', isRequired: false },
      ],
      outputs: [{ key: 'col_3', label: 'ستون ۳ جدید' }],
    },
    userOrg1,
  );

  const updatedA = await service.findOne(platA.id, userOrg1);
  const intactB = await service.findOne(platB.id, userOrg1);

  assert.strictEqual(updatedA.inputs[0].name, 'فیلد ۱ اصلاح‌شده');
  assert.strictEqual(updatedA.inputs[1].key, 'field_4');
  assert.strictEqual(updatedA.outputs[0].key, 'col_3');

  assert.strictEqual(intactB.inputs.length, 1, 'Platform B inputs must remain untouched');
  assert.strictEqual(intactB.inputs[0].key, 'field_3');
  assert.strictEqual(intactB.outputs[0].key, 'col_2');

  // 5. اطمینان از حفظ رکوردهای موجود سازمانی (campaign_type, lead_source, lost_reason)
  console.log('  5. Verifying original taxonomies (campaign_type, lead_source, lost_reason) are intact...');
  const campaignTypeTax = dbTaxonomies.find((t) => t.taxonomyType === 'campaign_type');
  const leadSourceTax = dbTaxonomies.find((t) => t.taxonomyType === 'lead_source');
  const lostReasonTax = dbTaxonomies.find((t) => t.taxonomyType === 'lost_reason');

  assert.ok(campaignTypeTax, 'campaign_type taxonomy must not be deleted');
  assert.ok(leadSourceTax, 'lead_source taxonomy must not be deleted');
  assert.ok(lostReasonTax, 'lost_reason taxonomy must not be deleted');
  console.log('  ✔ Original organization taxonomies fully preserved.');

  // 6. اطمینان از انزوای کامل سازمانی (Tenant Isolation)
  console.log('  6. Verifying Tenant Isolation between Org 1 and Org 2...');
  const org2Platforms = await service.findAll({}, userOrg2);
  assert.strictEqual(org2Platforms.length, 0, 'Org 2 should not see any platforms from Org 1');

  try {
    await service.findOne(platA.id, userOrg2);
    assert.fail('Org 2 should not be able to find Platform A');
  } catch (err: any) {
    assert.strictEqual(err.status, 404, 'Must throw 404 for cross-tenant access');
  }
  console.log('  ✔ Tenant Isolation verified.');

  console.log('🎉 All Storage Isolation & Safety Verification Tests Passed Successfully!');
}

runStorageIsolationTests().catch((err) => {
  console.error('❌ Storage isolation test failed:', err);
  process.exit(1);
});
