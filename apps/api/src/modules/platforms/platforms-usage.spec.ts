import assert from 'node:assert';
import { PlatformsService, CurrentUserPayload } from './platforms.service';
import { CampaignStatus } from '@prisma/client';

async function runPlatformUsageTests() {
  console.log('🧪 Running Rigorous Platform Campaign Usage Verification Tests...');

  const mockAdminUser: CurrentUserPayload = {
    id: 'user-admin-1',
    email: 'admin@gapji.dev',
    organizationId: 'org-test-1',
    role: 'admin',
  };

  const platform = {
    id: 'plat-100',
    organizationId: 'org-test-1',
    name: 'تست پلتفرم یکتانت',
    code: 'yektanet',
    category: 'ad_network',
    retrievalMethod: 'import' as any,
    isActive: true,
  };

  // Case 1: No campaign using the platform
  console.log('  Case 1: No campaign using the platform...');
  {
    const mockPrisma: any = {
      platform: { findFirst: async () => platform },
      campaignPlatformAllocation: { findMany: async () => [] },
      campaign: { findMany: async () => [] },
    };
    const service = new PlatformsService(mockPrisma);
    const usage = await service.getUsage(platform.id, mockAdminUser);
    assert.strictEqual(usage.activeCampaignsCount, 0, 'Active campaigns count should be 0');
    assert.strictEqual(usage.totalCampaignsCount, 0, 'Total campaigns count should be 0');
    assert.strictEqual(usage.activeCampaigns.length, 0);
    console.log('  ✔ Case 1 passed: 0 active, 0 total.');
  }

  // Case 2: One active campaign using the platform
  console.log('  Case 2: Exactly one active campaign using the platform...');
  {
    const mockPrisma: any = {
      platform: { findFirst: async () => platform },
      campaignPlatformAllocation: {
        findMany: async () => [
          {
            campaign: {
              id: 'camp-active-1',
              name: 'کمپین تخفیف یلدا',
              status: CampaignStatus.active,
              budget: 50000000,
            },
          },
        ],
      },
      campaign: { findMany: async () => [] },
    };
    const service = new PlatformsService(mockPrisma);
    const usage = await service.getUsage(platform.id, mockAdminUser);
    assert.strictEqual(usage.activeCampaignsCount, 1, 'Active campaigns count should be 1');
    assert.strictEqual(usage.totalCampaignsCount, 1, 'Total campaigns count should be 1');
    assert.strictEqual(usage.activeCampaigns[0].id, 'camp-active-1');
    console.log('  ✔ Case 2 passed: 1 active campaign correctly identified.');
  }

  // Case 3: Multiple active campaigns using the platform
  console.log('  Case 3: Multiple active campaigns using the platform...');
  {
    const mockPrisma: any = {
      platform: { findFirst: async () => platform },
      campaignPlatformAllocation: {
        findMany: async () => [
          { campaign: { id: 'camp-1', name: 'کمپین ۱', status: CampaignStatus.active, budget: 1000 } },
          { campaign: { id: 'camp-2', name: 'کمپین ۲', status: CampaignStatus.active, budget: 2000 } },
          { campaign: { id: 'camp-3', name: 'کمپین ۳', status: CampaignStatus.active, budget: 3000 } },
        ],
      },
      campaign: { findMany: async () => [] },
    };
    const service = new PlatformsService(mockPrisma);
    const usage = await service.getUsage(platform.id, mockAdminUser);
    assert.strictEqual(usage.activeCampaignsCount, 3, 'Active campaigns count should be 3');
    assert.strictEqual(usage.totalCampaignsCount, 3, 'Total campaigns count should be 3');
    console.log('  ✔ Case 3 passed: 3 active campaigns correctly counted.');
  }

  // Case 4: Inactive campaigns (draft, completed, planned, paused, archived)
  console.log('  Case 4: Inactive campaigns must NOT count towards activeCampaignsCount...');
  {
    const mockPrisma: any = {
      platform: { findFirst: async () => platform },
      campaignPlatformAllocation: {
        findMany: async () => [
          { campaign: { id: 'camp-draft', name: 'پیش‌نویس', status: CampaignStatus.draft, budget: 1000 } },
          { campaign: { id: 'camp-completed', name: 'تکمیل‌شده', status: CampaignStatus.completed, budget: 2000 } },
          { campaign: { id: 'camp-planned', name: 'برنامه‌ریزی', status: CampaignStatus.planned, budget: 3000 } },
          { campaign: { id: 'camp-paused', name: 'متوقف', status: CampaignStatus.paused, budget: 4000 } },
          { campaign: { id: 'camp-active', name: 'فعال واقعی', status: CampaignStatus.active, budget: 5000 } },
        ],
      },
      campaign: { findMany: async () => [] },
    };
    const service = new PlatformsService(mockPrisma);
    const usage = await service.getUsage(platform.id, mockAdminUser);
    assert.strictEqual(usage.activeCampaignsCount, 1, 'Only the active campaign should be counted');
    assert.strictEqual(usage.totalCampaignsCount, 5, 'Total campaigns includes inactive ones');
    assert.strictEqual(usage.activeCampaigns[0].id, 'camp-active');
    console.log('  ✔ Case 4 passed: Only genuinely active campaign counted (1 out of 5).');
  }

  // Case 5: Multiple allocations belonging to the same campaign (deduplication check)
  console.log('  Case 5: Deduplication check: multiple allocations for the same campaign...');
  {
    const sharedCampaign = {
      id: 'camp-shared-1',
      name: 'کمپین چندتخصیصه',
      status: CampaignStatus.active,
      budget: 100000000,
    };

    const mockPrisma: any = {
      platform: { findFirst: async () => platform },
      campaignPlatformAllocation: {
        findMany: async () => [
          { id: 'alloc-1', campaignId: sharedCampaign.id, campaign: sharedCampaign },
          { id: 'alloc-2', campaignId: sharedCampaign.id, campaign: sharedCampaign },
          { id: 'alloc-3', campaignId: sharedCampaign.id, campaign: sharedCampaign },
        ],
      },
      // همچنین این کمپین کانالش هم منطبق است
      campaign: {
        findMany: async () => [
          { id: sharedCampaign.id, name: sharedCampaign.name, status: sharedCampaign.status, budget: sharedCampaign.budget },
        ],
      },
    };
    const service = new PlatformsService(mockPrisma);
    const usage = await service.getUsage(platform.id, mockAdminUser);
    assert.strictEqual(
      usage.activeCampaignsCount,
      1,
      'Multiple allocations of the same campaign must be deduplicated into 1 distinct campaign',
    );
    assert.strictEqual(usage.totalCampaignsCount, 1, 'Total must also be 1 distinct campaign');
    console.log('  ✔ Case 5 passed: Deduplication verified. Count is 1, not 4.');
  }

  console.log('🎉 All Platform Campaign Usage Verification Tests Passed Successfully!');
}

runPlatformUsageTests().catch((err) => {
  console.error('❌ Platform usage test failed:', err);
  process.exit(1);
});
