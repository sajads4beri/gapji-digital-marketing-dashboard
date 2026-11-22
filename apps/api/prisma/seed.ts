import * as fs from 'fs';
import * as path from 'path';

// Load .env automatically if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
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

import { PrismaClient, Role, MembershipStatus, Currency, CampaignStatus, CampaignHealth } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Deterministic UUIDs for seed records
export const SEED_DATA = {
  organizations: {
    primary: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'آژانس دیجیتال مارکتینگ گپ‌جی',
      slug: 'gapji-marketing',
      currency: Currency.TOMAN,
    },
    secondary: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'آژانس رشد پارس',
      slug: 'pars-growth-agency',
      currency: Currency.TOMAN,
    },
  },
  commonPassword: 'Password123!',
  users: [
    {
      id: '10000000-0000-0000-0000-000000000001',
      email: 'admin@gapji.dev',
      mobile: '09120000001',
      fullName: 'مدیر ارشد گپ‌جی',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000001',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.admin,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      email: 'marketing@gapji.dev',
      mobile: '09120000002',
      fullName: 'سارا راد (مدیر مارکتینگ)',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000002',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.marketing_manager,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      email: 'campaign@gapji.dev',
      mobile: '09120000003',
      fullName: 'امیر نوری (کمپین‌چی)',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000003',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.campaign_manager,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      email: 'sales@gapji.dev',
      mobile: '09120000004',
      fullName: 'نیما باقری (کارشناس فروش)',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000004',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.sales_agent,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      email: 'content@gapji.dev',
      mobile: '09120000005',
      fullName: 'مینا صادقی (تولید محتوا)',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000005',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.content_creator,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      email: 'client@gapji.dev',
      mobile: '09120000006',
      fullName: 'رضا بهرامی (کارفرما)',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000006',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.client,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000007',
      email: 'inactive@gapji.dev',
      mobile: '09120000007',
      fullName: 'کاربر غیرفعال سیستم',
      isActive: false, // Testing inactive rejection
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000007',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.campaign_manager,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000008',
      email: 'ambiguous@gapji.dev',
      mobile: '09120000008',
      fullName: 'کاربر با چند عضویت فعال',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000008',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.marketing_manager,
          status: MembershipStatus.active,
        },
        {
          id: '20000000-0000-0000-0000-000000000009',
          organizationId: '00000000-0000-0000-0000-000000000002',
          role: Role.admin,
          status: MembershipStatus.active,
        },
      ],
    },
    {
      id: '10000000-0000-0000-0000-000000000009',
      email: 'multisession@gapji.dev',
      mobile: '09120000009',
      fullName: 'کاربر چند نشست همزمان',
      isActive: true,
      memberships: [
        {
          id: '20000000-0000-0000-0000-000000000010',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: Role.campaign_manager,
          status: MembershipStatus.active,
        },
      ],
    },
  ],
  campaigns: [
    {
      id: '30000000-0000-0000-0000-000000000001',
      organizationId: '00000000-0000-0000-0000-000000000001',
      name: 'کمپین تبلیغات سرچ ادز گوگل',
      type: 'search_ads',
      objective: 'lead_generation',
      channel: 'google_search',
      status: CampaignStatus.active,
      health: CampaignHealth.healthy,
      budget: 80000000,
      spend: 45000000,
      impressions: 125000,
      clicks: 8400,
      conversions: 420,
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      organizationId: '00000000-0000-0000-0000-000000000001',
      name: 'کمپین آگاهی از برند اینستاگرام',
      type: 'social_media',
      objective: 'brand_awareness',
      channel: 'instagram',
      status: CampaignStatus.active,
      health: CampaignHealth.healthy,
      budget: 50000000,
      spend: 32000000,
      impressions: 450000,
      clicks: 18200,
      conversions: 310,
    },
    {
      id: '30000000-0000-0000-0000-000000000003',
      organizationId: '00000000-0000-0000-0000-000000000001',
      name: 'وبینار تخصصی سئو و استراتژی محتوا',
      type: 'webinar',
      objective: 'lead_generation',
      channel: 'webinar',
      status: CampaignStatus.planned,
      health: CampaignHealth.healthy,
      budget: 15000000,
      spend: 2000000,
      impressions: 35000,
      clicks: 1200,
      conversions: 85,
    },
    {
      id: '30000000-0000-0000-0000-000000000004',
      organizationId: '00000000-0000-0000-0000-000000000001',
      name: 'کمپین پیامکی بازگشت مشتریان پاییزه',
      type: 'sms',
      objective: 'retention',
      channel: 'sms',
      status: CampaignStatus.completed,
      health: CampaignHealth.healthy,
      budget: 20000000,
      spend: 19500000,
      impressions: 80000,
      clicks: 5600,
      conversions: 940,
    },
  ],
};

export async function seedDatabase() {
  console.log('🌱 Starting idempotent development database seeding...');

  // 1. Seed Organizations
  console.log('  -> Seeding organizations...');
  for (const org of Object.values(SEED_DATA.organizations)) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: {
        name: org.name,
        slug: org.slug,
        currency: org.currency,
      },
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        currency: org.currency,
      },
    });
  }

  // 2. Hash Password using Argon2id
  const passwordHash = await argon2.hash(SEED_DATA.commonPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // 3. Seed Users and Memberships
  console.log('  -> Seeding users and memberships...');
  for (const user of SEED_DATA.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        mobile: user.mobile,
        fullName: user.fullName,
        isActive: user.isActive,
        passwordHash,
      },
      create: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        fullName: user.fullName,
        isActive: user.isActive,
        passwordHash,
      },
    });

    for (const mem of user.memberships) {
      await prisma.organizationMembership.upsert({
        where: { id: mem.id },
        update: {
          organizationId: mem.organizationId,
          userId: user.id,
          role: mem.role,
          status: mem.status,
        },
        create: {
          id: mem.id,
          organizationId: mem.organizationId,
          userId: user.id,
          role: mem.role,
          status: mem.status,
        },
      });
    }
  }

  // 4. Seed Campaigns
  console.log('  -> Seeding campaigns...');
  for (const camp of SEED_DATA.campaigns) {
    await prisma.campaign.upsert({
      where: { id: camp.id },
      update: {
        organizationId: camp.organizationId,
        name: camp.name,
        type: camp.type,
        objective: camp.objective,
        channel: camp.channel,
        status: camp.status,
        health: camp.health,
        budget: camp.budget,
        spend: camp.spend,
        impressions: camp.impressions,
        clicks: camp.clicks,
        conversions: camp.conversions,
      },
      create: {
        id: camp.id,
        organizationId: camp.organizationId,
        name: camp.name,
        type: camp.type,
        objective: camp.objective,
        channel: camp.channel,
        status: camp.status,
        health: camp.health,
        budget: camp.budget,
        spend: camp.spend,
        impressions: camp.impressions,
        clicks: camp.clicks,
        conversions: camp.conversions,
      },
    });
  }

  const counts = {
    organizations: await prisma.organization.count(),
    users: await prisma.user.count(),
    memberships: await prisma.organizationMembership.count(),
    campaigns: await prisma.campaign.count(),
  };

  console.log('✅ Seeding completed successfully!');
  console.log(`   Organizations: ${counts.organizations}`);
  console.log(`   Users: ${counts.users}`);
  console.log(`   Memberships: ${counts.memberships}`);
  console.log(`   Campaigns: ${counts.campaigns}`);

  return counts;
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
