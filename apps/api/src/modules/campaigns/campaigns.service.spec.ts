import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CampaignsService, DEFAULT_ORGANIZATION_ID } from './campaigns.service';
import { PrismaService } from '../../database/prisma.service';
import { CampaignStatus, CampaignHealth } from './campaign.entity';

async function runCampaignsServiceTests() {
  console.log('🧪 Starting CampaignsService Unit Tests...');

  const mockPrismaCampaign = {
    findMany: async () => [
      {
        id: '11111111-1111-1111-1111-111111111111',
        organizationId: DEFAULT_ORGANIZATION_ID,
        name: 'Summer Campaign',
        description: 'Test description',
        channel: 'instagram',
        type: 'digital',
        objective: 'lead',
        status: CampaignStatus.ACTIVE,
        health: CampaignHealth.HEALTHY,
        budget: '50000000', // Decimal string
        spend: '12500000',  // Decimal string
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31'),
        ownerId: null,
        targetLeads: 500,
        targetSales: '50000000',
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (where.id === '11111111-1111-1111-1111-111111111111') {
        return {
          id: '11111111-1111-1111-1111-111111111111',
          organizationId: DEFAULT_ORGANIZATION_ID,
          name: 'Summer Campaign',
          description: 'Test description',
          channel: 'instagram',
          type: 'digital',
          objective: 'lead',
          status: CampaignStatus.ACTIVE,
          health: CampaignHealth.HEALTHY,
          budget: '50000000',
          spend: '12500000',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-08-31'),
          ownerId: null,
          targetLeads: 500,
          targetSales: null,
          impressions: 1000,
          clicks: 100,
          conversions: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    },
    create: async ({ data }: { data: any }) => ({
      id: '22222222-2222-2222-2222-222222222222',
      ...data,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async ({ where, data }: { where: { id: string }; data: any }) => ({
      id: where.id,
      organizationId: DEFAULT_ORGANIZATION_ID,
      name: data.name ?? 'Summer Campaign',
      description: data.description ?? null,
      channel: data.channel ?? 'instagram',
      type: 'digital',
      objective: 'lead',
      status: data.status ?? CampaignStatus.ACTIVE,
      health: CampaignHealth.HEALTHY,
      budget: data.budget ?? '50000000',
      spend: '12500000',
      startDate: null,
      endDate: null,
      ownerId: null,
      targetLeads: null,
      targetSales: null,
      impressions: 1000,
      clicks: 100,
      conversions: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    delete: async ({ where }: { where: { id: string } }) => ({
      id: where.id,
    }),
  };

  const mockPrismaService = {
    campaign: mockPrismaCampaign,
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CampaignsService,
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
    ],
  }).compile();

  const service = module.get<CampaignsService>(CampaignsService);

  // Test 1: findAll
  {
    console.log('  Testing findAll()...');
    const campaigns = await service.findAll();
    assert.strictEqual(campaigns.length, 1);
    assert.strictEqual(typeof campaigns[0].budget, 'number', 'budget should be number');
    assert.strictEqual(campaigns[0].budget, 50000000);
    assert.strictEqual(typeof campaigns[0].spend, 'number', 'spend should be number');
    assert.strictEqual(campaigns[0].spend, 12500000);
    assert.strictEqual(campaigns[0].organizationId, DEFAULT_ORGANIZATION_ID);
    console.log('  ✔ findAll() passed.');
  }

  // Test 2: findOne (Success)
  {
    console.log('  Testing findOne() with existing ID...');
    const campaign = await service.findOne('11111111-1111-1111-1111-111111111111');
    assert.strictEqual(campaign.id, '11111111-1111-1111-1111-111111111111');
    assert.strictEqual(campaign.budget, 50000000);
    assert.strictEqual(campaign.spend, 12500000);
    console.log('  ✔ findOne() existing ID passed.');
  }

  // Test 3: findOne (NotFoundException)
  {
    console.log('  Testing findOne() with non-existent ID...');
    let threw = false;
    try {
      await service.findOne('99999999-9999-9999-9999-999999999999');
    } catch (err) {
      threw = err instanceof NotFoundException;
    }
    assert.strictEqual(threw, true, 'Should throw NotFoundException');
    console.log('  ✔ findOne() NotFoundException passed.');
  }

  // Test 4: create with fallback default organizationId
  {
    console.log('  Testing create() without organizationId (fallback to default)...');
    const created = await service.create({
      name: 'Autumn Promo',
      channel: 'telegram',
      budget: 30000000,
    });
    assert.strictEqual(created.organizationId, DEFAULT_ORGANIZATION_ID);
    assert.strictEqual(created.name, 'Autumn Promo');
    assert.strictEqual(created.channel, 'telegram');
    assert.strictEqual(created.budget, 30000000);
    assert.strictEqual(created.status, CampaignStatus.DRAFT);
    console.log('  ✔ create() fallback to default organizationId passed.');
  }

  // Test 5: create with explicit organizationId
  {
    console.log('  Testing create() with explicit organizationId...');
    const customOrgId = '77777777-7777-7777-7777-777777777777';
    const created = await service.create({
      organizationId: customOrgId,
      name: 'Winter Promo',
      channel: 'google_ads',
      budget: 80000000,
      status: CampaignStatus.PLANNED,
    });
    assert.strictEqual(created.organizationId, customOrgId);
    assert.strictEqual(created.name, 'Winter Promo');
    assert.strictEqual(created.status, CampaignStatus.PLANNED);
    console.log('  ✔ create() with explicit organizationId passed.');
  }

  // Test 6: update
  {
    console.log('  Testing update()...');
    const updated = await service.update('11111111-1111-1111-1111-111111111111', {
      name: 'Updated Campaign Name',
      budget: 60000000,
    });
    assert.strictEqual(updated.name, 'Updated Campaign Name');
    assert.strictEqual(updated.budget, 60000000);
    console.log('  ✔ update() passed.');
  }

  // Test 7: remove
  {
    console.log('  Testing remove()...');
    await service.remove('11111111-1111-1111-1111-111111111111');
    console.log('  ✔ remove() passed.');
  }

  // Test 8: getStats
  {
    console.log('  Testing getStats()...');
    const stats = await service.getStats();
    assert.strictEqual(stats.total, 1);
    assert.strictEqual(stats.active, 1);
    assert.strictEqual(stats.totalSpend, 12500000);
    assert.strictEqual(stats.totalImpressions, 1000);
    assert.strictEqual(stats.totalClicks, 100);
    assert.strictEqual(stats.totalConversions, 10);
    console.log('  ✔ getStats() passed.');
  }

  // Test 9: CRIT-A Foreign Key Restrict Protection on Campaign Deletion
  {
    console.log('  Testing CRIT-A: Campaign deletion rejection when related costs/leads exist (Restrict)...');
    const restrictedMockPrisma = {
      campaign: {
        findUnique: mockPrismaCampaign.findUnique,
        delete: async () => {
          throw new Prisma.PrismaClientKnownRequestError(
            'Foreign key constraint failed on the field: `campaignId`',
            {
              code: 'P2003',
              clientVersion: '5.22.0',
              meta: { field_name: 'campaignId' },
            },
          );
        },
      },
    };

    const restrictedModule: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: PrismaService,
          useValue: restrictedMockPrisma,
        },
      ],
    }).compile();

    const restrictedService = restrictedModule.get<CampaignsService>(CampaignsService);
    let restrictedThrew = false;
    try {
      await restrictedService.remove('11111111-1111-1111-1111-111111111111');
    } catch (err: any) {
      restrictedThrew = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003';
    }
    assert.strictEqual(restrictedThrew, true, 'Campaign deletion must be rejected when related records exist');
    console.log('  ✔ CRIT-A: Campaign deletion restriction (P2003) verified.');
  }

  // Test 10: Static Verification of Schema & SQL DDL Constraints
  {
    console.log('  Testing Schema & Migration DDL Constraints (Static Verification)...');
    const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Verify Cost.campaign has onDelete: Restrict
    assert.ok(
      schemaContent.includes('campaign       Campaign?     @relation(fields: [campaignId, organizationId], references: [id, organizationId], onDelete: Restrict)'),
      'schema.prisma must specify onDelete: Restrict on Cost.campaign',
    );

    // Verify Lead.campaign has onDelete: Restrict
    assert.ok(
      schemaContent.includes('campaign          Campaign?         @relation(fields: [campaignId, organizationId], references: [id, organizationId], onDelete: Restrict)'),
      'schema.prisma must specify onDelete: Restrict on Lead.campaign',
    );

    // Verify Idea.task has onDelete: Restrict
    assert.ok(
      schemaContent.includes('task           Task?        @relation("IdeaCreatedTask", fields: [taskId, organizationId], references: [id, organizationId], onDelete: Restrict)'),
      'schema.prisma must specify onDelete: Restrict on Idea.task',
    );

    // Verify Cost.importJob has compound foreign key with onDelete: Restrict
    assert.ok(
      schemaContent.includes('importJob      ImportJob?    @relation(fields: [importJobId, organizationId], references: [id, organizationId], onDelete: Restrict)'),
      'schema.prisma must specify compound FK with onDelete: Restrict on Cost.importJob',
    );

    // Verify ImportJob has @@unique([id, organizationId])
    assert.ok(
      schemaContent.includes('@@unique([id, organizationId]) // Compound Foreign Key Target (MAJ-A)'),
      'schema.prisma must specify @@unique([id, organizationId]) on ImportJob',
    );

    // Verify migration.sql contains corresponding DDL constraints
    const migrationPath = path.resolve(__dirname, '../../../prisma/migrations/20261108103000_foundation_database_schema/migration.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(
      migrationSql.includes('ALTER TABLE "costs" ADD CONSTRAINT "costs_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;'),
      'migration.sql must contain costs_campaignId_organizationId_fkey with ON DELETE RESTRICT',
    );

    assert.ok(
      migrationSql.includes('ALTER TABLE "leads" ADD CONSTRAINT "leads_campaignId_organizationId_fkey" FOREIGN KEY ("campaignId", "organizationId") REFERENCES "campaigns"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;'),
      'migration.sql must contain leads_campaignId_organizationId_fkey with ON DELETE RESTRICT',
    );

    assert.ok(
      migrationSql.includes('ALTER TABLE "ideas" ADD CONSTRAINT "ideas_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "tasks"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;'),
      'migration.sql must contain ideas_taskId_organizationId_fkey with ON DELETE RESTRICT',
    );

    assert.ok(
      migrationSql.includes('ALTER TABLE "costs" ADD CONSTRAINT "costs_importJobId_organizationId_fkey" FOREIGN KEY ("importJobId", "organizationId") REFERENCES "import_jobs"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;'),
      'migration.sql must contain costs_importJobId_organizationId_fkey compound FK with ON DELETE RESTRICT',
    );

    console.log('  ✔ Static Schema and Migration DDL constraints verified.');
  }

  console.log('🎉 All 10 CampaignsService and Integrity Tests passed successfully!');
}

runCampaignsServiceTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
