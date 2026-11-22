import assert from 'node:assert';
import { PlatformsService, CurrentUserPayload } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformRetrievalMethod } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

async function runPlatformsServiceTests() {
  console.log('🧪 Starting PlatformsService (REQ-19) Unit Tests...');

  const mockAdminUser: CurrentUserPayload = {
    id: 'user-admin-1',
    email: 'admin@gapji.dev',
    organizationId: 'org-test-1',
    role: 'admin',
  };

  const mockMarketingManagerUser: CurrentUserPayload = {
    id: 'user-marketing-1',
    email: 'marketing@gapji.dev',
    organizationId: 'org-test-1',
    role: 'marketing_manager',
  };

  const mockCampaignManagerUser: CurrentUserPayload = {
    id: 'user-campaign-1',
    email: 'campaign@gapji.dev',
    organizationId: 'org-test-1',
    role: 'campaign_manager',
  };

  const mockSalesAgentUser: CurrentUserPayload = {
    id: 'user-sales-1',
    email: 'sales@gapji.dev',
    organizationId: 'org-test-1',
    role: 'sales_agent',
  };

  const mockClientUser: CurrentUserPayload = {
    id: 'user-client-1',
    email: 'client@gapji.dev',
    organizationId: 'org-test-1',
    role: 'client',
  };

  const mockPrisma: any = {
    platform: {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async ({ data }: any) => ({
        id: 'new-plat-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: async ({ where, data }: any) => ({
        id: where.id,
        ...data,
        updatedAt: new Date(),
      }),
    },
    campaignPlatformAllocation: {
      findMany: async () => [],
      count: async () => 0,
    },
    campaign: {
      findMany: async () => [],
    },
    organizationTaxonomy: {
      findMany: async () => [],
      create: async ({ data }: any) => ({ id: 'tax-1', ...data }),
      deleteMany: async () => ({ count: 0 }),
    },
  };

  const service = new PlatformsService(mockPrisma);

  // Test 1: Access Control & Roles (REQ-19 Section A)
  console.log('  1. Testing Role Access Control (admin & marketing_manager allowed; others denied)...');
  const adminRes = await service.findAll({}, mockAdminUser);
  assert.strictEqual(Array.isArray(adminRes), true, 'Admin should have access');

  const mmRes = await service.findAll({}, mockMarketingManagerUser);
  assert.strictEqual(Array.isArray(mmRes), true, 'Marketing Manager should have access');

  let campaignManagerDenied = false;
  try {
    await service.findAll({}, mockCampaignManagerUser);
  } catch (err: any) {
    if (err instanceof ForbiddenException) campaignManagerDenied = true;
  }
  assert.strictEqual(campaignManagerDenied, true, 'Campaign Manager must be denied with ForbiddenException');

  let salesAgentDenied = false;
  try {
    await service.findAll({}, mockSalesAgentUser);
  } catch (err: any) {
    if (err instanceof ForbiddenException) salesAgentDenied = true;
  }
  assert.strictEqual(salesAgentDenied, true, 'Sales Agent must be denied with ForbiddenException');

  let clientDenied = false;
  try {
    await service.findAll({}, mockClientUser);
  } catch (err: any) {
    if (err instanceof ForbiddenException) clientDenied = true;
  }
  assert.strictEqual(clientDenied, true, 'Client must be denied with ForbiddenException');
  console.log('  ✔ Role Access Control verified.');

  // Test 2: Predefined Templates (REQ-19 Section D)
  console.log('  2. Testing Predefined Templates...');
  const templates = service.getTemplates();
  assert.strictEqual(templates.length >= 4, true, 'Should provide at least 4 predefined templates');
  const googleAds = templates.find((t) => t.code === 'google_ads');
  assert.ok(googleAds, 'Google Ads template must exist');
  assert.strictEqual(googleAds.retrievalMethod, PlatformRetrievalMethod.api);
  assert.strictEqual(googleAds.defaultInputs.length > 0, true);
  assert.strictEqual(googleAds.defaultOutputs.length > 0, true);

  const yektanet = templates.find((t) => t.code === 'yektanet');
  assert.ok(yektanet, 'Yektanet template must exist');
  assert.strictEqual(yektanet.retrievalMethod, PlatformRetrievalMethod.import);
  console.log('  ✔ Predefined Templates verified.');

  // Test 3: Platform Creation from Template (REQ-19 Section D)
  console.log('  3. Testing Platform Creation from Template...');
  const createFromTplDto: CreatePlatformDto = {
    name: 'گوگل ادز اصلی سازمان',
    category: 'digital',
    retrievalMethod: PlatformRetrievalMethod.api,
    templateId: 'tpl_google_ads',
  };
  const createdFromTpl = await service.create(createFromTplDto, mockAdminUser);
  assert.strictEqual(createdFromTpl.name, 'گوگل ادز اصلی سازمان');
  assert.strictEqual(createdFromTpl.retrievalMethod, PlatformRetrievalMethod.api);
  assert.strictEqual(createdFromTpl.inputs.length > 0, true, 'Default inputs should be populated from template');
  assert.strictEqual(createdFromTpl.outputs.length > 0, true, 'Default outputs should be populated from template');
  console.log('  ✔ Creation from Template verified.');

  // Test 4: Platform Creation from Empty Configuration (REQ-19 Section D)
  console.log('  4. Testing Platform Creation from Empty Configuration...');
  const createEmptyDto: CreatePlatformDto = {
    name: 'کانال اختصاصی یوتیوب',
    category: 'video',
    retrievalMethod: PlatformRetrievalMethod.manual,
    inputs: [
      { name: 'هزینه تولید ویدیو', key: 'video_cost', dataType: 'number', isRequired: true },
      { name: 'لینک ویدیو', key: 'video_url', dataType: 'text', isRequired: false },
    ],
    outputs: [
      { key: 'views', label: 'تعداد بازدید' },
      { key: 'cost', label: 'هزینه کل' },
    ],
  };
  const createdEmpty = await service.create(createEmptyDto, mockMarketingManagerUser);
  assert.strictEqual(createdEmpty.name, 'کانال اختصاصی یوتیوب');
  assert.strictEqual(createdEmpty.inputs.length, 2);
  assert.strictEqual(createdEmpty.inputs[0].key, 'video_cost');
  assert.strictEqual(createdEmpty.outputs.length, 2);
  console.log('  ✔ Creation from Empty Configuration verified.');

  // Test 5: Safe Deactivation with Real Campaign Usage (REQ-19 Section E)
  console.log('  5. Testing Safe Deactivation & In-Use Warning...');
  const platformInUse = {
    id: 'plat-in-use',
    organizationId: 'org-test-1',
    name: 'یکتانت فعال',
    code: 'yektanet',
    category: 'ad_network',
    retrievalMethod: PlatformRetrievalMethod.import,
    isActive: true,
  };

  mockPrisma.platform.findFirst = async () => platformInUse;
  mockPrisma.campaignPlatformAllocation.findMany = async () => [
    { campaign: { id: 'c-1', name: 'کمپین ۱', status: 'active', budget: 1000 } },
    { campaign: { id: 'c-2', name: 'کمپین ۲', status: 'active', budget: 2000 } },
    { campaign: { id: 'c-3', name: 'کمپین ۳', status: 'active', budget: 3000 } },
  ];
  mockPrisma.campaign.findMany = async () => [];

  const deactivateRes = await service.deactivate('plat-in-use', mockAdminUser);
  assert.strictEqual(deactivateRes.platform.isActive, false, 'Should be marked inactive');
  assert.strictEqual(deactivateRes.activeCampaignsCount, 3, 'Must report exact 3 active campaigns');
  assert.strictEqual(
    deactivateRes.message.includes('3 کمپین در حال استفاده است') ||
      deactivateRes.message.includes('۳ کمپین در حال استفاده است'),
    true,
    'Message must contain exact active campaign count',
  );
  console.log('  ✔ Safe Deactivation & In-Use Warning verified.');

  console.log('🎉 All PlatformsService (REQ-19) Unit Tests Passed Successfully!');
}

runPlatformsServiceTests().catch((err) => {
  console.error('❌ PlatformsService test failed:', err);
  process.exit(1);
});
