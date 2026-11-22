import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// 1. Database Environment Safety & Verification
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

const dbUrl = process.env.DATABASE_URL || '';
console.log('🔍 Checking target database URL:', dbUrl);

// Strict safety gate: verify DB is local dev
const isLocal = dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost');
const isDevDb = dbUrl.includes('gapji_dev') || dbUrl.includes('_dev');

if (!isLocal || !isDevDb) {
  console.error('❌ FATAL: Seed script aborted! Target database must be a local development instance (gapji_dev).');
  console.error(`   Current DATABASE_URL: ${dbUrl}`);
  process.exit(1);
}

console.log('✅ Safety verification passed: Target is confirmed local development database.');

import {
  PrismaClient,
  Role,
  MembershipStatus,
  Currency,
  CampaignStatus,
  CampaignHealth,
  PlatformRetrievalMethod,
  CostSource,
  LeadStatusGroup,
  SmsStatus,
  SmsDeliveryStatus,
  WebinarStatus,
  TaskStatus,
  TaskPriority,
  TaskRelatedType,
  MetricDirection,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Deterministic Organization IDs
const ORG_1_ID = '00000000-0000-0000-0000-000000000001'; // آژانس دیجیتال مارکتینگ گپ‌جی (Primary)
const ORG_2_ID = '00000000-0000-0000-0000-000000000002'; // آژانس رشد پارس (Secondary)
const ORG_3_ID = '00000000-0000-0000-0000-000000000003'; // فناوری اطلاعات و تجارت الکترونیک آریا (Tertiary)

// Realistic Iranian Mock Generators
const FIRST_NAMES = [
  'علی', 'محمد', 'امیرحسین', 'رضا', 'حسین', 'مهدی', 'علیرضا', 'سجاد', 'پویا', 'نیما',
  'کامران', 'فرشاد', 'بابک', 'آرش', 'پژمان', 'سامان', 'فرزاد', 'نوید', 'میلاد', 'احسان',
  'سارا', 'مریم', 'زهرا', 'فاطمه', 'نیلوفر', 'مهسا', 'الهام', 'سمیرا', 'نازنین', 'مونا',
  'شیدا', 'پریسا', 'یاسمن', 'رویا', 'فرناز', 'بهاره', 'پرستو', 'نگین', 'ندا', 'آیدا'
];

const LAST_NAMES = [
  'احمدی', 'محمدی', 'رضایی', 'حسینی', 'مرادی', 'صادقی', 'کاظمی', 'موسوی', 'کریمی', 'جعفری',
  'شریفی', 'قاسمی', 'نوری', 'طاهری', 'صالحی', 'محمودی', 'باقری', 'رستمی', 'اکبری', 'نجفی',
  'کیانی', 'دهقان', 'سلیمانی', 'فرهادی', 'دادخواه', 'پاشایی', 'جمشیدی', 'افشار', 'نیکنام', 'خسروی'
];

const CITIES = ['تهران', 'اصفهان', 'مشهد', 'شیراز', 'تبریز', 'کرج', 'اهواز', 'قم', 'رشت', 'یزد', 'ساری', 'کرمان'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMobile(): string {
  const prefixes = ['0912', '0935', '0919', '0936', '0939', '0913', '0915', '0917', '0918', '0930'];
  const prefix = getRandomItem(prefixes);
  const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${prefix}${suffix.slice(0, 7)}`;
}

// Date distribution helper: generates dates spread across May 1, 2026 to Nov 15, 2026
// Bias heavily towards 30d (Oct 16 - Nov 15), 7d (Nov 8 - Nov 15), and Today (Nov 15, 2026)
function generateDateInRange(now: Date): Date {
  const rand = Math.random();
  let daysAgo: number;

  if (rand < 0.05) {
    // 5% Today (Nov 15)
    daysAgo = 0;
  } else if (rand < 0.25) {
    // 20% Last 7 days (Nov 8 - 14)
    daysAgo = getRandomInt(1, 7);
  } else if (rand < 0.65) {
    // 40% Last 30 days (Oct 16 - Nov 7)
    daysAgo = getRandomInt(8, 30);
  } else if (rand < 0.85) {
    // 20% Previous 30 days (Sep 16 - Oct 15) for comparison
    daysAgo = getRandomInt(31, 60);
  } else {
    // 15% May 1 - Sep 15 (historical months)
    daysAgo = getRandomInt(61, 195);
  }

  const targetDate = new Date(now.getTime() - daysAgo * 86400000);
  // Randomize hour, minute, second
  targetDate.setHours(getRandomInt(8, 22), getRandomInt(0, 59), getRandomInt(0, 59), getRandomInt(0, 999));
  return targetDate;
}

async function runSeed() {
  console.log('🚀 Starting Comprehensive Seed Data Generation...');
  const now = new Date('2026-11-15T12:00:00.000Z'); // Fixed anchor: 2026-11-15

  // -------------------------------------------------------------
  // 1. ORGANIZATIONS (3)
  // -------------------------------------------------------------
  console.log('🏢 [1/14] Seeding Organizations...');
  const orgsData = [
    {
      id: ORG_1_ID,
      name: 'آژانس دیجیتال مارکتینگ گپ‌جی',
      slug: 'gapji-marketing',
      currency: Currency.TOMAN,
    },
    {
      id: ORG_2_ID,
      name: 'آژانس رشد پارس',
      slug: 'pars-growth-agency',
      currency: Currency.TOMAN,
    },
    {
      id: ORG_3_ID,
      name: 'فناوری اطلاعات و تجارت الکترونیک آریا',
      slug: 'arya-ecommerce',
      currency: Currency.TOMAN,
    },
  ];

  for (const org of orgsData) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: { name: org.name, slug: org.slug, currency: org.currency },
      create: org,
    });
  }

  // -------------------------------------------------------------
  // 2. USERS & MEMBERSHIPS (12 Users)
  // -------------------------------------------------------------
  console.log('👥 [2/14] Seeding Users with Argon2 password...');
  const defaultPasswordHash = await argon2.hash('Password123!');

  const usersData = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      email: 'admin@gapji.dev',
      mobile: '09120000001',
      fullName: 'مهندس بردیا کریمی (مدیر ارشد گپ‌جی)',
      role: Role.admin,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      email: 'marketing@gapji.dev',
      mobile: '09120000002',
      fullName: 'سارا راد (مدیر مارکتینگ)',
      role: Role.marketing_manager,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      email: 'campaign@gapji.dev',
      mobile: '09120000003',
      fullName: 'امیر نوری (کمپین‌چی و پرفورمنس مارکتر)',
      role: Role.campaign_manager,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      email: 'sales@gapji.dev',
      mobile: '09120000004',
      fullName: 'نیما باقری (کارشناس ارشد فروش)',
      role: Role.sales_agent,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      email: 'content@gapji.dev',
      mobile: '09120000005',
      fullName: 'مینا صادقی (استراتژیست محتوا و وبینار)',
      role: Role.content_creator,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      email: 'client@gapji.dev',
      mobile: '09120000006',
      fullName: 'رضا بهرامی (کارفرما و ناظر پروژه)',
      role: Role.client,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000010',
      email: 'sales2@gapji.dev',
      mobile: '09120000010',
      fullName: 'پویا احمدی (کارشناس فروش B2B)',
      role: Role.sales_agent,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000011',
      email: 'sales3@gapji.dev',
      mobile: '09120000011',
      fullName: 'الناز شریفی (کارشناس پیگیری لید)',
      role: Role.sales_agent,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000012',
      email: 'campaign2@gapji.dev',
      mobile: '09120000012',
      fullName: 'فرشاد طاهری (متخصص سرچ ادز و ادنتورک)',
      role: Role.campaign_manager,
      orgId: ORG_1_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000013',
      email: 'admin.pars@gapji.dev',
      mobile: '09120000013',
      fullName: 'دکتر کیارش کاظمی (مدیر پارس رشد)',
      role: Role.admin,
      orgId: ORG_2_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000014',
      email: 'marketing.pars@gapji.dev',
      mobile: '09120000014',
      fullName: 'مونا رستمی (مدیر مارکتینگ پارس)',
      role: Role.marketing_manager,
      orgId: ORG_2_ID,
    },
    {
      id: '10000000-0000-0000-0000-000000000015',
      email: 'admin.arya@gapji.dev',
      mobile: '09120000015',
      fullName: 'مهندس آرش جهانبخش (مدیرعامل آریا ای‌کامرس)',
      role: Role.admin,
      orgId: ORG_3_ID,
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email,
        mobile: u.mobile,
        fullName: u.fullName,
        isActive: true,
        passwordHash: defaultPasswordHash,
      },
      create: {
        id: u.id,
        email: u.email,
        mobile: u.mobile,
        fullName: u.fullName,
        isActive: true,
        passwordHash: defaultPasswordHash,
      },
    });

    // Membership
    const memId = `2${u.id.slice(1)}`;
    await prisma.organizationMembership.upsert({
      where: { id: memId },
      update: {
        organizationId: u.orgId,
        userId: u.id,
        role: u.role,
        status: MembershipStatus.active,
      },
      create: {
        id: memId,
        organizationId: u.orgId,
        userId: u.id,
        role: u.role,
        status: MembershipStatus.active,
      },
    });
  }

  // -------------------------------------------------------------
  // 3. PLATFORMS (7 Platforms for Org 1)
  // -------------------------------------------------------------
  console.log('📡 [3/14] Seeding Advertising Platforms...');
  const platformsDefs = [
    { code: 'google_ads', name: 'گوگل ادز (Google Ads)', category: 'digital', retrievalMethod: PlatformRetrievalMethod.api, icon: 'Globe' },
    { code: 'yektanet', name: 'شبکه تبلیغاتی یکتانت', category: 'ad_network', retrievalMethod: PlatformRetrievalMethod.api, icon: 'BarChart' },
    { code: 'meta_instagram', name: 'اینستاگرام مارکتینگ', category: 'social', retrievalMethod: PlatformRetrievalMethod.manual, icon: 'Instagram' },
    { code: 'sabavision', name: 'شبکه تبلیغاتی صباویژن', category: 'ad_network', retrievalMethod: PlatformRetrievalMethod.manual, icon: 'Layout' },
    { code: 'mediaad', name: 'مدیااد (MediaAd)', category: 'ad_network', retrievalMethod: PlatformRetrievalMethod.manual, icon: 'Layers' },
    { code: 'cafebazaar', name: 'تبلیغات در کافه‌بازار', category: 'digital', retrievalMethod: PlatformRetrievalMethod.api, icon: 'Smartphone' },
    { code: 'sms_marketing', name: 'سامانه پیامک مگفا', category: 'sms', retrievalMethod: PlatformRetrievalMethod.api, icon: 'MessageSquare' },
  ];

  const org1PlatformIds: Record<string, string> = {};

  for (let i = 0; i < platformsDefs.length; i++) {
    const p = platformsDefs[i];
    const platId = `40000000-0000-0000-0000-00000000000${i + 1}`;

    const upsertedPlat = await prisma.platform.upsert({
      where: { organizationId_code: { organizationId: ORG_1_ID, code: p.code } },
      update: {
        name: p.name,
        category: p.category,
        retrievalMethod: p.retrievalMethod,
        icon: p.icon,
        isActive: true,
      },
      create: {
        id: platId,
        organizationId: ORG_1_ID,
        name: p.name,
        code: p.code,
        category: p.category,
        retrievalMethod: p.retrievalMethod,
        icon: p.icon,
        isActive: true,
      },
    });
    org1PlatformIds[p.code] = upsertedPlat.id;
  }

  // Also seed platforms for Org 2 and Org 3
  for (let i = 0; i < 4; i++) {
    const p = platformsDefs[i];
    const platId = `40000000-0000-0000-0002-00000000000${i + 1}`;
    await prisma.platform.upsert({
      where: { organizationId_code: { organizationId: ORG_2_ID, code: p.code } },
      update: { name: p.name, category: p.category, retrievalMethod: p.retrievalMethod, isActive: true },
      create: { id: platId, organizationId: ORG_2_ID, name: p.name, code: p.code, category: p.category, retrievalMethod: p.retrievalMethod, isActive: true },
    });
  }

  // -------------------------------------------------------------
  // 4. COST CATEGORIES (5 Categories)
  // -------------------------------------------------------------
  console.log('🏷️  [4/14] Seeding Cost Categories...');
  const costCategoriesDefs = [
    { code: 'ad_media', name: 'رسانه تبلیغاتی', desc: 'هزینه شارژ کلیک و نمایش در پلتفرم‌ها' },
    { code: 'content_production', name: 'تولید محتوا', desc: 'هزینه تولید ویدیو، بنر و کپی‌رایتینگ' },
    { code: 'agency_fee', name: 'کارمزد آژانس', desc: 'کارمزد مدیریت و بهینه‌سازی کمپین' },
    { code: 'software_saas', name: 'ابزار و تکنولوژی (SaaS)', desc: 'هزینه نرم‌افزارهای تحلیل، ترکینگ و اتوماسیون' },
    { code: 'events_webinar', name: 'رویداد و وبینار', desc: 'هزینه زیرساخت و اسپانسری رویداد' },
  ];

  const org1CostCategoryIds: Record<string, string> = {};

  for (let i = 0; i < costCategoriesDefs.length; i++) {
    const c = costCategoriesDefs[i];
    const catId = `50000000-0000-0000-0000-00000000000${i + 1}`;

    const upsertedCat = await prisma.costCategory.upsert({
      where: { organizationId_code: { organizationId: ORG_1_ID, code: c.code } },
      update: { name: c.name, description: c.desc, isActive: true },
      create: { id: catId, organizationId: ORG_1_ID, name: c.name, code: c.code, description: c.desc, isActive: true },
    });
    org1CostCategoryIds[c.code] = upsertedCat.id;
  }

  // -------------------------------------------------------------
  // 5. LEAD STATUS CONFIGS (6 Configs)
  // -------------------------------------------------------------
  console.log('📊 [5/14] Seeding Lead Status Configs...');
  const leadStatusDefs = [
    { key: 'new', label: 'جدید', group: LeadStatusGroup.open, color: '#3B82F6', sort: 1 },
    { key: 'in_progress', label: 'تماس گرفته شد', group: LeadStatusGroup.open, color: '#F59E0B', sort: 2 },
    { key: 'qualified', label: 'واجد شرایط', group: LeadStatusGroup.open, color: '#8B5CF6', sort: 3 },
    { key: 'proposal', label: 'پیشنهاد', group: LeadStatusGroup.open, color: '#EC4899', sort: 4 },
    { key: 'won', label: 'مشتری', group: LeadStatusGroup.won, color: '#10B981', sort: 5 },
    { key: 'lost', label: 'ردشده', group: LeadStatusGroup.lost, color: '#EF4444', sort: 6 },
  ];

  const org1LeadStatusIds: Record<string, string> = {};

  for (let i = 0; i < leadStatusDefs.length; i++) {
    const s = leadStatusDefs[i];
    const statusId = `60000000-0000-0000-0000-00000000000${i + 1}`;

    const upsertedStatus = await prisma.leadStatusConfig.upsert({
      where: { organizationId_key: { organizationId: ORG_1_ID, key: s.key } },
      update: { label: s.label, group: s.group, color: s.color, sortOrder: s.sort, isSystem: true, isActive: true },
      create: { id: statusId, organizationId: ORG_1_ID, key: s.key, label: s.label, group: s.group, color: s.color, sortOrder: s.sort, isSystem: true, isActive: true },
    });
    org1LeadStatusIds[s.key] = upsertedStatus.id;
  }

  // -------------------------------------------------------------
  // 6. TARGET AUDIENCES (20 Audiences)
  // -------------------------------------------------------------
  console.log('🎯 [6/14] Seeding Target Audiences...');
  const audienceDefs = [
    { name: 'مدیران ارشد و مالکان کسب‌وکارهای B2B', ageMin: 32, ageMax: 60, gender: 'all', location: 'تهران و مشهد', interests: 'مدیریت، دیجیتال مارکتینگ، سرمایه‌گذاری، نرم‌افزار CRM', channel: 'گوگل و لینکدین' },
    { name: 'جوانان و متخصصان فناوری اطلاعات و توسعه‌دهندگان', ageMin: 20, ageMax: 35, gender: 'all', location: 'کل کشور', interests: 'هوش مصنوعی، برنامه‌نویسی، طراحی محصول، استارتاپ', channel: 'یکتانت و اینستاگرام' },
    { name: 'بانوان کارآفرین و خریداران پوشاک و زیبایی', ageMin: 22, ageMax: 48, gender: 'female', location: 'اصفهان، شیراز، تبریز', interests: 'فشن، مراقبت پوست، خرید آنلاین، لایف‌استایل', channel: 'اینستاگرام مارکتینگ' },
    { name: 'خریداران و علاقه‌مندان به لوازم الکترونیک و گجت', ageMin: 18, ageMax: 40, gender: 'male', location: 'کلان‌شهرها', interests: 'موبایل، لپ‌تاپ، بازی‌های ویدیویی، گجت‌های هوشمند', channel: 'کافه بازار و گوگل' },
    { name: 'پزشکان، دندانپزشکان و مدیران کلینیک‌های زیبایی', ageMin: 30, ageMax: 65, gender: 'all', location: 'تهران، اهواز، شیراز', interests: 'تجهیزات پزشکی، اتوماسیون مطب، مدیریت برند پزشکی', channel: 'پیامک و یکتانت' },
    { name: 'مشاوران املاک و سرمایه‌گذاران بازار مسکن', ageMin: 28, ageMax: 65, gender: 'all', location: 'تهران، کرج، گیلان', interests: 'سرمایه‌گذاری ملک، پیش‌فروش، دکوراسیون داخلی', channel: 'پیامک و صباویژن' },
    { name: 'مدیران مالی، حسابداران و حسابرسان رسمی', ageMin: 25, ageMax: 55, gender: 'all', location: 'تهران، اصفهان', interests: 'نرم‌افزار مالی، قوانین مالیاتی، اکسل پیشرفته، سامانه مودیان', channel: 'گوگل سرچ' },
    { name: 'دانشجویان و متقاضیان دوره‌های مهارتی و آزمون‌ها', ageMin: 18, ageMax: 28, gender: 'all', location: 'کل کشور', interests: 'آزمون تافل، دوره‌های برنامه‌نویسی، کنکور ارشد، اشتغال', channel: 'اینستاگرام و کافه‌بازار' },
    { name: 'صاحبان فروشگاه‌های اینترنتی و شاپیفای', ageMin: 24, ageMax: 45, gender: 'all', location: 'کل کشور', interests: 'سئو، درگاه پرداخت، بسته‌بندی، تبلیغات آنلاین، لجستیک', channel: 'مدیااد و یکتانت' },
    { name: 'علاقه‌مندان به خودرو، تیونینگ و لوازم یدکی', ageMin: 20, ageMax: 50, gender: 'male', location: 'کلان‌شهرها', interests: 'لوازم یدکی، بیمه خودرو، تیونینگ، خدمات پس از فروش', channel: 'صباویژن و پیامک' },
    { name: 'متقاضیان مهاجرت تحصیلی و کاری', ageMin: 21, ageMax: 38, gender: 'all', location: 'کل کشور', interests: 'ویزای کاری، اپلای دانشگاه، مدرک زبان آیلتس، دارالترجمه', channel: 'گوگل سرچ و وبینار' },
    { name: 'مدیران منابع انسانی و کارشناسان جذب و استخدام', ageMin: 27, ageMax: 50, gender: 'all', location: 'تهران، اصفهان، مشهد', interests: 'توسعه سازمانی، نرم‌افزار HR، ارزیابی عملکرد کارکنان', channel: 'گوگل ادز' },
    { name: 'خریداران دوره‌های یوگا، تناسب اندام و رژیم غذایی', ageMin: 20, ageMax: 50, gender: 'female', location: 'کلان‌شهرها', interests: 'فیتنس، رژیم کتو، سلامت ذهن، مکمل ورزشی', channel: 'اینستاگرام مارکتینگ' },
    { name: 'مهندسان عمران، معماران و پیمانکاران ساختمانی', ageMin: 26, ageMax: 60, gender: 'all', location: 'کل کشور', interests: 'اتوکد، متریال ساختمانی، پروژه‌های عمرانی، تاسیسات', channel: 'صباویژن و یکتانت' },
    { name: 'کاربران فعال بازارهای مالی، کریپتو و بورس', ageMin: 20, ageMax: 45, gender: 'all', location: 'کل کشور', interests: 'بیت‌کوین، تحلیل تکنیکال، صرافی آنلاین، سیگنال معاملاتی', channel: 'مدیااد و یکتانت' },
    { name: 'معلمان، اساتید دانشگاه و مدرسان خصوصی', ageMin: 25, ageMax: 65, gender: 'all', location: 'کل کشور', interests: 'ابزارهای آموزش مجازی، طراحی سوال، نرم‌افزارهای اسلاید', channel: 'وبینار و پیامک' },
    { name: 'خریداران مبلمان خانگی و اداری مدرن', ageMin: 26, ageMax: 55, gender: 'all', location: 'تهران و البرز', interests: 'دکوراسیون، چیدمان منزل، مبلمان اداری ارگونومیک', channel: 'اینستاگرام مارکتینگ' },
    { name: 'صاحبان کافه‌ها، رستوران‌ها و فست‌فودها', ageMin: 25, ageMax: 50, gender: 'all', location: 'کل کشور', interests: 'تجهیزات صنعتی آشپزخانه، منوی دیجیتال، باشگاه مشتریان', channel: 'پیامک و گوگل ادز' },
    { name: 'خریداران طلا، جواهرات و زیورآلات دست‌ساز', ageMin: 22, ageMax: 60, gender: 'female', location: 'کل کشور', interests: 'طلا کم‌اجرت، نقره، اکسسوری، هدیه سالگرد', channel: 'اینستاگرام و یکتانت' },
    { name: 'علاقه‌مندان به گردشگری، تورهای داخلی و بوم‌گردی', ageMin: 20, ageMax: 50, gender: 'all', location: 'کل کشور', interests: 'طبیعت‌گردی، رزرو بوم‌گردی، تور کویر، بلیط قطار', channel: 'صباویژن و کافه بازار' },
  ];

  const org1AudienceIds: string[] = [];

  for (let i = 0; i < audienceDefs.length; i++) {
    const a = audienceDefs[i];
    const audId = `70000000-0000-0000-0000-0000000000${(i + 1).toString().padStart(2, '0')}`;
    org1AudienceIds.push(audId);

    await prisma.targetAudience.upsert({
      where: { id: audId },
      update: {
        organizationId: ORG_1_ID,
        name: a.name,
        ageMin: a.ageMin,
        ageMax: a.ageMax,
        gender: a.gender,
        location: a.location,
        interests: a.interests,
        channel: a.channel,
      },
      create: {
        id: audId,
        organizationId: ORG_1_ID,
        name: a.name,
        ageMin: a.ageMin,
        ageMax: a.ageMax,
        gender: a.gender,
        location: a.location,
        interests: a.interests,
        channel: a.channel,
      },
    });
  }

  // -------------------------------------------------------------
  // 7. CAMPAIGNS (50 Campaigns for Org 1)
  // -------------------------------------------------------------
  console.log('📢 [7/14] Seeding Campaigns...');
  const campaignNames = [
    'کمپین سرچ ادز جذب لید B2B - پاییز ۱۴۰۵',
    'کمپین همسان و ریتارگتینگ یکتانت پکیج جامع مارکتینگ',
    'کمپین استوری و اینفلوئنسر اینستاگرام محصولات زیبایی',
    'کمپین بنری صباویژن فروش ویژه جمعه سیاه (Black Friday)',
    'کمپین نصب اپلیکیشن کافه بازار با جایزه اولیه',
    'کمپین پیامکی بازگشت مشتریان غیرفعال (Win-back)',
    'کمپین تبلیغات ویدیویی پری‌رول مدیااد برند آگاهی',
    'کمپین جذب ثبت‌نام وبینار استراتژی قیف فروش',
    'کمپین تبلیغات گوگل کلمات کلیدی نرم‌افزار CRM',
    'کمپین لیدجنریشن مشاوره تخصصی سئو و تولید محتوا',
    'کمپین تبلیغات کلیکی نیتیو افزایش ترافیک بلاگ',
    'کمپین معرفی محصول جدید در کافه بازار نسخه ۳',
    'کمپین پاییزه تخفیف خدمات دیجیتال مارکتینگ ۳۶۰',
    'کمپین جذب کارفرمایان سازمانی طراحی وب‌سایت',
    'کمپین ری‌تارگتینگ سبد خرید رهاشده فروشگاه آنلاین',
    'کمپین برندینگ و روابط عمومی آنلاین در رسانه‌های خبری',
    'کمپین پیامک هوشمند تخفیف روز تولد مشتریان',
    'کمپین وبینار هوش مصنوعی مولد در خلق کمپین‌های تبلیغاتی',
    'کمپین گوگل ادز خدمات حسابداری و مالیاتی مودیان',
    'کمپین ویدیو مارکتینگ آپارات و یوتیوب فارسی',
    'کمپین جذب لید پکیج رشد استارتاپ‌ها (Growth Pack)',
    'کمپین ریتارگتینگ پوش نوتیفیکیشن کاربران اپلیکیشن',
    'کمپین جذب دانشجویان بوت‌کمپ دیجیتال مارکتینگ',
    'کمپین اینستاگرامی مسابقه عکاسی و تولید محتوای کاربر (UGC)',
    'کمپین لید جنریشن دوره پیشرفته Google Analytics 4',
    'کمپین تبلیغاتی تابستانه لوازم دیجیتال و جانبی',
    'کمپین جشنواره یلدا ویژه کسب‌وکارهای نوپا',
    'کمپین تست A/B لندینگ‌های جذب مشاوره رایگان',
    'کمپین معرفی خدمات اتوماسیون ایمیل و اس‌ام‌اس',
    'کمپین برند اورنس با اینفلوئنسرهای تخصصی لینکدین',
    'کمپین سرچ کنسول و بهینه‌سازی کلمات کلیدی محلی (Local SEO)',
    'کمپین اد نتورک مدیااد ریتارگتینگ مخاطبان پرانگیزه',
    'کمپین ثبت‌نام زودهنگام همایش سالانه بازاریابی عملکردی',
    'کمپین پوشش لیدهای نمایشگاه بین‌المللی الکامپ',
    'کمپین تبلیغاتی پیام صوتی برای مدیران کارخانجات صنعتی',
    'کمپین بنرهای تعاملی صباویژن روی پرتال‌های اقتصادی',
    'کمپین نصب فعال اپلیکیشن رانندگان و سفیران',
    'کمپین بازگشت خریداران پوشاک زمستانه با کد تخفیف اختصاصی',
    'کمپین تبلیغات سرچ گوگل برای طراحی لندینگ پیج اختصاصی',
    'کمپین جذب اسپانسر وبینارهای فصلی گپ‌جی',
    'کمپین افزایش اعضای کانال تلگرام و کامیونیتی بازاریابی',
    'کمپین اطلاع‌رسانی دوره رایگان ایمیل مارکتینگ حرفه‌ای',
    'کمپین ریتارگتینگ بازدیدکنندگان صفحه قیمت‌ها و تعرفه‌ها',
    'کمپین گوگل ادز فروشگاه ساز و تجارت الکترونیک',
    'کمپین تخفیف اشتراک سالانه ابزار رصد رقبا',
    'کمپین پیامکی خوش‌آمدگویی به مشترکان جدید خبرنامه',
    'کمپین برندینگ تلویزیون اینترنتی و پلتفرم‌های VOD',
    'کمپین جذب همکاری در فروش (Affiliate Marketing)',
    'کمپین عارضه‌یابی دیجیتال مارکتینگ برندهای سنتی',
    'کمپین زمستانه پیش‌فروش بسته‌های مشاوره سال ۱۴۰۶',
  ];

  const org1CampaignIds: string[] = [];

  for (let i = 0; i < campaignNames.length; i++) {
    const campId = `30000000-0000-0000-0000-0000000000${(i + 1).toString().padStart(2, '0')}`;
    org1CampaignIds.push(campId);

    // Distribution:
    // Status: ~26 active, ~7 paused, ~9 completed, ~5 planned, ~3 draft
    let status: CampaignStatus;
    if (i < 26) status = CampaignStatus.active;
    else if (i < 33) status = CampaignStatus.paused;
    else if (i < 42) status = CampaignStatus.completed;
    else if (i < 47) status = CampaignStatus.planned;
    else status = CampaignStatus.draft;

    // Health: ~34 healthy, ~11 needs_attention, ~5 critical
    let health: CampaignHealth;
    if (i % 7 === 0) health = CampaignHealth.critical;
    else if (i % 3 === 0) health = CampaignHealth.needs_attention;
    else health = CampaignHealth.healthy;

    const budget = (getRandomInt(15, 95) * 1000000); // 15M to 95M Toman
    const impressions = getRandomInt(25000, 480000);
    const clicks = Math.round(impressions * (getRandomInt(15, 65) / 1000));
    const conversions = Math.round(clicks * (getRandomInt(20, 95) / 1000));
    const targetLeads = Math.round(conversions * 1.2) + 20;

    const startDate = new Date(now.getTime() - getRandomInt(20, 150) * 86400000);
    const endDate = new Date(startDate.getTime() + getRandomInt(30, 90) * 86400000);

    const ownerId = (i % 2 === 0)
      ? '10000000-0000-0000-0000-000000000003' // امیر نوری
      : '10000000-0000-0000-0000-000000000012'; // فرشاد طاهری

    await prisma.campaign.upsert({
      where: { id: campId },
      update: {
        organizationId: ORG_1_ID,
        name: campaignNames[i],
        type: i % 2 === 0 ? 'search_ads' : 'ad_network',
        objective: 'lead',
        channel: 'digital',
        status,
        health,
        budget,
        startDate,
        endDate,
        ownerId,
        targetLeads,
        impressions,
        clicks,
        conversions,
      },
      create: {
        id: campId,
        organizationId: ORG_1_ID,
        name: campaignNames[i],
        type: i % 2 === 0 ? 'search_ads' : 'ad_network',
        objective: 'lead',
        channel: 'digital',
        status,
        health,
        budget,
        startDate,
        endDate,
        ownerId,
        targetLeads,
        impressions,
        clicks,
        conversions,
      },
    });

    // Link Campaign to 1-3 Audiences
    const audIdx1 = i % org1AudienceIds.length;
    const audIdx2 = (i + 3) % org1AudienceIds.length;
    await prisma.campaignAudience.upsert({
      where: { campaignId_targetAudienceId: { campaignId: campId, targetAudienceId: org1AudienceIds[audIdx1] } },
      update: {},
      create: {
        organizationId: ORG_1_ID,
        campaignId: campId,
        targetAudienceId: org1AudienceIds[audIdx1],
      },
    });
    if (audIdx1 !== audIdx2) {
      await prisma.campaignAudience.upsert({
        where: { campaignId_targetAudienceId: { campaignId: campId, targetAudienceId: org1AudienceIds[audIdx2] } },
        update: {},
        create: {
          organizationId: ORG_1_ID,
          campaignId: campId,
          targetAudienceId: org1AudienceIds[audIdx2],
        },
      });
    }

    // Link Campaign to 1-2 Platforms Allocation
    const platKey1 = Object.keys(org1PlatformIds)[i % Object.keys(org1PlatformIds).length];
    const platId1 = org1PlatformIds[platKey1];
    await prisma.campaignPlatformAllocation.upsert({
      where: { campaignId_platformId: { campaignId: campId, platformId: platId1 } },
      update: { allocatedBudget: Math.round(budget * 0.6) },
      create: {
        organizationId: ORG_1_ID,
        campaignId: campId,
        platformId: platId1,
        allocatedBudget: Math.round(budget * 0.6),
        targetCount: Math.round(targetLeads * 0.6),
      },
    });
  }

  // -------------------------------------------------------------
  // 8. LANDING PAGES (18 Landing Pages)
  // -------------------------------------------------------------
  console.log('🌐 [8/14] Seeding Landing Pages...');
  const landingDefs = [
    { title: 'صفحه فرود مشاوره رایگان دیجیتال مارکتینگ', slug: 'free-marketing-consultation', template: 'b2b-leadgen', views: 8400, leads: 520, rate: 6.19 },
    { title: 'ثبت‌نام دوره پیشرفته پرفورمنس مارکتینگ و بهینه‌سازی', slug: 'advanced-performance-bootcamp', template: 'course-registration', views: 12500, leads: 740, rate: 5.92 },
    { title: 'دانلود کتابچه جامع استراتژی‌های سئو در سال ۲۰۲۶', slug: 'seo-strategy-whitepaper-2026', template: 'ebook-download', views: 9200, leads: 680, rate: 7.39 },
    { title: 'درخواست دمو و معرفی نرم‌افزار مدیریت کمپین گپ‌جی', slug: 'demo-request-gapji-martech', template: 'saas-demo', views: 4600, leads: 310, rate: 6.74 },
    { title: 'ثبت‌نام زودهنگام همایش تخصصی هوش مصنوعی در تبلیغات', slug: 'ai-martech-summit-2026', template: 'event-register', views: 14800, leads: 920, rate: 6.22 },
    { title: 'صفحه فرود پکیج جامع خدمات سئو سازمانی', slug: 'enterprise-seo-services', template: 'b2b-services', views: 3200, leads: 180, rate: 5.62 },
    { title: 'تخفیف ویژه اشتراک سالانه ابزار تحلیل و رصد رقبا', slug: 'annual-competitor-tracking-discount', template: 'pricing-promo', views: 6100, leads: 390, rate: 6.39 },
    { title: 'ارزیابی و تست آنلاین سلامت استراتژی بازاریابی دیجیتال', slug: 'marketing-audit-quiz', template: 'interactive-quiz', views: 11200, leads: 820, rate: 7.32 },
    { title: 'صفحه فرود استخدام و جذب متخصصان پرفورمنس', slug: 'careers-growth-hacker', template: 'career-portal', views: 2400, leads: 95, rate: 3.96 },
    { title: 'پکیج تبلیغات کلیکی گوگل و یوتیوب با شارژ هدیه', slug: 'google-ads-starter-credit', template: 'offer-gift', views: 7800, leads: 480, rate: 6.15 },
    { title: 'رزرو وقت مشاوره عارضه‌یابی قیف فروش B2B', slug: 'b2b-funnel-audit-booking', template: 'calendar-booking', views: 3800, leads: 240, rate: 6.32 },
    { title: 'دانلود رایگان قالب اکسل برنامه‌ریزی بودجه مارکتینگ', slug: 'marketing-budget-template-xlsx', template: 'resource-download', views: 10400, leads: 890, rate: 8.56 },
    { title: 'صفحه فرود رونمایی از قابلیت وبینار مارکتینگ', slug: 'webinar-module-launch', template: 'feature-showcase', views: 5100, leads: 330, rate: 6.47 },
    { title: 'کمپین تخفیف جمعه سیاه ابزارهای تولید محتوا', slug: 'black-friday-content-tools', template: 'ecommerce-deal', views: 13900, leads: 870, rate: 6.26 },
    { title: 'ثبت‌نام دوره مسترکلاس استراتژی لینکدین برای مدیران', slug: 'linkedin-executive-masterclass', template: 'course-registration', views: 4200, leads: 260, rate: 6.19 },
    { title: 'پکیج اتوماسیون ایمیلی و پیامکی بازگشت مشتریان', slug: 'marketing-automation-retention', template: 'saas-solution', views: 3600, leads: 210, rate: 5.83 },
    { title: 'صفحه فرود معرفی خدمات طراحی سایت وردپرسی مدرن', slug: 'wordpress-modern-development', template: 'b2b-services', views: 2900, leads: 130, rate: 4.48 },
    { title: 'درخواست همکاری نمایندگی فروش در شهرستان‌ها', slug: 'agency-partnership-request', template: 'partner-form', views: 1800, leads: 85, rate: 4.72 },
  ];

  const org1LandingIds: string[] = [];

  for (let i = 0; i < landingDefs.length; i++) {
    const lp = landingDefs[i];
    const lpId = `80000000-0000-0000-0000-0000000000${(i + 1).toString().padStart(2, '0')}`;
    org1LandingIds.push(lpId);

    const linkedCampId = org1CampaignIds[i % org1CampaignIds.length];

    await prisma.landingPage.upsert({
      where: { id: lpId },
      update: {
        organizationId: ORG_1_ID,
        campaignId: linkedCampId,
        title: lp.title,
        url: `https://lp.gapji.dev/${lp.slug}`,
        slug: lp.slug,
        template: lp.template,
        viewsCount: lp.views,
        leadsCount: lp.leads,
        conversionRate: lp.rate,
        connectionStatus: i !== 16, // 1 inactive for realistic verification
      },
      create: {
        id: lpId,
        organizationId: ORG_1_ID,
        campaignId: linkedCampId,
        title: lp.title,
        url: `https://lp.gapji.dev/${lp.slug}`,
        slug: lp.slug,
        template: lp.template,
        viewsCount: lp.views,
        leadsCount: lp.leads,
        conversionRate: lp.rate,
        connectionStatus: i !== 16,
      },
    });
  }

  // -------------------------------------------------------------
  // 9. UTM LINKS (120 UTM Records)
  // -------------------------------------------------------------
  console.log('🔗 [9/14] Seeding UTM Tracking Links...');
  const utmSources = ['google', 'yektanet', 'instagram', 'sabavision', 'mediaad', 'cafebazaar', 'sms_magfa'];
  const utmMediums = ['cpc', 'native', 'story', 'banner', 'retargeting', 'cpa', 'sms_broadcast'];
  const utmTerms = ['digital+marketing', 'growth+hacking', 'seo+consulting', 'crm+software', 'online+webinar', 'ad+management'];

  for (let i = 0; i < 120; i++) {
    const utmId = `90000000-0000-0000-0000-00000000${(i + 1).toString().padStart(4, '0')}`;
    const campId = org1CampaignIds[i % org1CampaignIds.length];
    const lpId = org1LandingIds[i % org1LandingIds.length];
    const platKey = utmSources[i % utmSources.length];
    const platId = org1PlatformIds[
      platKey === 'google' ? 'google_ads' :
      platKey === 'instagram' ? 'meta_instagram' :
      platKey === 'sms_magfa' ? 'sms_marketing' : platKey
    ] || org1PlatformIds['google_ads'];

    const src = utmSources[i % utmSources.length];
    const med = utmMediums[i % utmMediums.length];
    const campSlug = `camp-2026-q${(i % 4) + 1}-v${(i % 5) + 1}`;
    const term = utmTerms[i % utmTerms.length];
    const content = `banner_${(i % 6) + 1}_300x250`;
    const originalUrl = `https://lp.gapji.dev/${landingDefs[i % landingDefs.length].slug}`;
    const finalUrl = `${originalUrl}?utm_source=${src}&utm_medium=${med}&utm_campaign=${campSlug}&utm_term=${term}&utm_content=${content}`;

    await prisma.utmLink.upsert({
      where: { id: utmId },
      update: {
        organizationId: ORG_1_ID,
        campaignId: campId,
        landingPageId: lpId,
        platformId: platId,
        originalUrl,
        utmSource: src,
        utmMedium: med,
        utmCampaign: campSlug,
        utmTerm: term,
        utmContent: content,
        finalUrl,
        clicksCount: getRandomInt(120, 4800),
      },
      create: {
        id: utmId,
        organizationId: ORG_1_ID,
        campaignId: campId,
        landingPageId: lpId,
        platformId: platId,
        originalUrl,
        utmSource: src,
        utmMedium: med,
        utmCampaign: campSlug,
        utmTerm: term,
        utmContent: content,
        finalUrl,
        clicksCount: getRandomInt(120, 4800),
      },
    });
  }

  // -------------------------------------------------------------
  // 10. MARKETING EXPENSES / COSTS (400 Costs for Org 1)
  // -------------------------------------------------------------
  console.log('💰 [10/14] Seeding Marketing Expenses (Costs) across 6 months...');
  // Clear any existing orphaned costs for clean realistic math
  await prisma.cost.deleteMany({ where: { organizationId: ORG_1_ID } });

  const platformKeysList = Object.keys(org1PlatformIds);
  const costCategoryKeysList = Object.keys(org1CostCategoryIds);
  const costsToInsert: any[] = [];

  for (let i = 0; i < 400; i++) {
    const costDate = generateDateInRange(now);
    const platKey = platformKeysList[i % platformKeysList.length];
    const platId = org1PlatformIds[platKey];
    const catKey = costCategoryKeysList[i % costCategoryKeysList.length];
    const catId = org1CostCategoryIds[catKey];
    const campId = org1CampaignIds[i % org1CampaignIds.length];

    // Amounts range from 350,000 to 4,800,000 Toman per entry
    const amount = getRandomInt(35, 480) * 10000;

    costsToInsert.push({
      id: crypto.randomUUID(),
      organizationId: ORG_1_ID,
      campaignId: campId,
      platformId: platId,
      categoryId: catId,
      date: costDate,
      amount,
      count: getRandomInt(20, 350),
      source: CostSource.manual,
      createdById: '10000000-0000-0000-0000-000000000001',
      notes: `شارژ اعتباری کمپین تبلیغاتی در پلتفرم ${platKey} - فاکتور شماره ${140500 + i}`,
      createdAt: costDate,
      updatedAt: costDate,
    });
  }

  await prisma.cost.createMany({ data: costsToInsert });
  console.log(`   Seeded ${costsToInsert.length} cost records.`);

  // -------------------------------------------------------------
  // 11. LEADS (1,000 Leads for Org 1)
  // -------------------------------------------------------------
  console.log('👥 [11/14] Seeding Leads (1,000 leads with realistic Persian profiles)...');
  await prisma.leadActivity.deleteMany({ where: { organizationId: ORG_1_ID } });
  await prisma.smsRecipient.deleteMany({ where: { organizationId: ORG_1_ID } });
  await prisma.webinarAttendee.deleteMany({ where: { organizationId: ORG_1_ID } });
  await prisma.lead.deleteMany({ where: { organizationId: ORG_1_ID } });

  const salesAgentIds = [
    '10000000-0000-0000-0000-000000000004', // نیما باقری
    '10000000-0000-0000-0000-000000000010', // پویا احمدی
    '10000000-0000-0000-0000-000000000011', // الناز شریفی
  ];

  const leadsToInsert: any[] = [];

  for (let i = 0; i < 1000; i++) {
    const leadDate = generateDateInRange(now);
    const campId = org1CampaignIds[i % org1CampaignIds.length];
    const platKey = platformKeysList[i % platformKeysList.length];
    const platId = org1PlatformIds[platKey];
    const fullName = `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`;
    const mobile = generateMobile();
    const city = getRandomItem(CITIES);
    const assignedToId = getRandomItem(salesAgentIds);

    // Lead Status Distribution:
    // ~35% new, ~25% in_progress, ~18% qualified, ~12% proposal, ~7% won, ~3% lost
    let statusKey: string;
    let salesValue: number | null = null;
    let lostReason: string | null = null;
    const r = Math.random();

    if (r < 0.35) {
      statusKey = 'new';
    } else if (r < 0.60) {
      statusKey = 'in_progress';
    } else if (r < 0.78) {
      statusKey = 'qualified';
    } else if (r < 0.90) {
      statusKey = 'proposal';
    } else if (r < 0.97) {
      statusKey = 'won';
      salesValue = getRandomInt(15, 85) * 1000000; // 15M to 85M Toman deal
    } else {
      statusKey = 'lost';
      lostReason = getRandomItem([
        'بودجه ناکافی برای اجرای پلن سازمانی',
        'عدم تطابق نیازمندی فنی با ویژگی‌های پلتفرم',
        'انصراف کارفرما به دلیل تغییر اولویت‌های فصلی',
        'عدم پاسخگویی پس از ۵ نوبت تماس تلفنی',
        'همکاری با آژانس تبلیغاتی رقیب',
      ]);
    }

    const statusConfigId = org1LeadStatusIds[statusKey];

    leadsToInsert.push({
      id: crypto.randomUUID(),
      organizationId: ORG_1_ID,
      fullName,
      mobile,
      email: `${mobile.slice(4)}@gmail.com`,
      city,
      source: platKey,
      campaignId: campId,
      platformId: platId,
      utmSource: platKey,
      utmMedium: 'cpc',
      utmCampaign: `campaign_${(i % 10) + 1}`,
      statusKey,
      statusConfigId,
      assignedToId,
      salesValue,
      lostReason,
      nextFollowUpAt: statusKey === 'in_progress' ? new Date(leadDate.getTime() + 86400000 * 2) : null,
      nextFollowUpNote: statusKey === 'in_progress' ? 'تماس مجدد جهت ارائه نمونه کارها و کاتالوگ خدمات' : null,
      createdAt: leadDate,
      updatedAt: leadDate,
    });
  }

  // Ensure at least 2 'new' leads are older than 24 hours to trigger the critical lead alert
  leadsToInsert[0].statusKey = 'new';
  leadsToInsert[0].statusConfigId = org1LeadStatusIds['new'];
  leadsToInsert[0].createdAt = new Date(now.getTime() - 36 * 3600 * 1000); // 36 hours ago
  leadsToInsert[0].fullName = 'سید محمدرضا طباطبایی (سرنخ معوق)';

  await prisma.lead.createMany({ data: leadsToInsert });
  console.log(`   Seeded ${leadsToInsert.length} leads.`);

  // -------------------------------------------------------------
  // 12. SMS CAMPAIGNS (12 SMS Campaigns & Recipients)
  // -------------------------------------------------------------
  console.log('📱 [12/14] Seeding SMS Campaigns...');
  const smsTemplates = [
    'تخفیف ویژه ۴۰ درصدی پکیج سئو و پرفورمنس مارکتینگ گپ‌جی فقط تا پایان هفته! لینک: lp.gapji.dev/deal',
    'یادآوری: وبینار تخصصی هوش مصنوعی در تبلیغات دیجیتال فردا ساعت ۱۸ برگزار می‌شود. لینک ورود مستقیم: gapji.dev/w',
    'فرصت استثنایی: مشاوره رایگان رشد فروش آنلاین برای کسب‌وکارهای نوپا. ثبت‌نام: lp.gapji.dev/consult',
    'کد تخفیف اختصاصی ۵۰۰ هزار تومانی شارژ پنل تبلیغات گوگل ادز: GAPJI500. منقضی می‌شود در ۳ روز آینده.',
    'فروش ویژه پاییزه خدمات طراحی سایت و سئو با تضمین رتبه صفحه یک گوگل. دریافت اطلاعات: lp.gapji.dev/seo',
    'وبینار بررسی راهکارهای عملی کاهش CPL و بهینه‌سازی بودجه تبلیغاتی. ثبت‌نام رایگان: lp.gapji.dev/cpl',
    'تمدید شد! جشنواره بسته‌های طلایی مدیریت شبکه‌های اجتماعی گپ‌جی. مشاهده جزییات: gapji.dev/sm',
    'گزارش عملکرد ماهانه کمپین‌های شما آماده بررسی در پنل کاربری است: app.gapji.dev',
    'دعوت به همایش سالانه رهبران بازاریابی دیجیتال ایران. رزرو صندلی VIP: gapji.dev/summit',
    'آخرین مهلت ثبت‌نام دوره جامع گوگل آنالیتیکس ۴ و ترکینگ پیشرفته: gapji.dev/ga4',
    'بازگشت مشتریان وفادار: ۳۰ درصد اعتبار هدیه روی اولین فاکتور آذر ماه. فعال‌سازی با ارسال عدد ۱',
    'نظرسنجی کیفیت خدمات پشتیبانی و فنی گپ‌جی - جایزه قرعه‌کشی ۱ گوشی هوشمند: gapji.dev/survey',
  ];

  for (let i = 0; i < smsTemplates.length; i++) {
    const smsId = `a0000000-0000-0000-0000-0000000000${(i + 1).toString().padStart(2, '0')}`;
    const campId = org1CampaignIds[i % org1CampaignIds.length];
    const totalRecipients = getRandomInt(1500, 8500);
    const deliveredCount = Math.round(totalRecipients * 0.94);
    const failedCount = totalRecipients - deliveredCount;
    const costAmount = totalRecipients * 180; // 180 Toman per SMS

    const sentAt = new Date(now.getTime() - getRandomInt(2, 45) * 86400000);

    await prisma.smsCampaign.upsert({
      where: { id: smsId },
      update: {
        organizationId: ORG_1_ID,
        campaignId: campId,
        name: `ارسال پیامک انبوه شماره ${(i + 1).toString().padStart(2, '0')} - ${campaignNames[i]}`,
        senderNumber: '90001234',
        messageText: smsTemplates[i],
        recipientCount: totalRecipients,
        deliveredCount,
        failedCount,
        costAmount,
        sentAt,
        status: SmsStatus.sent,
      },
      create: {
        id: smsId,
        organizationId: ORG_1_ID,
        campaignId: campId,
        name: `ارسال پیامک انبوه شماره ${(i + 1).toString().padStart(2, '0')} - ${campaignNames[i]}`,
        senderNumber: '90001234',
        messageText: smsTemplates[i],
        recipientCount: totalRecipients,
        deliveredCount,
        failedCount,
        costAmount,
        sentAt,
        status: SmsStatus.sent,
      },
    });

    // Seed 3 sample recipients per SMS
    for (let r = 0; r < 3; r++) {
      await prisma.smsRecipient.create({
        data: {
          organizationId: ORG_1_ID,
          smsCampaignId: smsId,
          mobile: generateMobile(),
          status: SmsDeliveryStatus.delivered,
          deliveredAt: sentAt,
          replyText: r === 0 ? 'با سلام، لطفا شرایط همکاری و تعرفه‌ها را ارسال بفرمایید.' : null,
          repliedAt: r === 0 ? new Date(sentAt.getTime() + 1800000) : null,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 13. WEBINARS (10 Webinars)
  // -------------------------------------------------------------
  console.log('🎓 [13/14] Seeding Webinars...');
  const webinarDefs = [
    { title: 'استراتژی‌های پیشرفته بازاریابی عملکردی (Performance Marketing) در سال ۱۴۰۵', presenter: 'سارا راد', platform: 'Skyroom', cap: 500, reg: 420, att: 310, status: WebinarStatus.completed },
    { title: 'کاربرد هوش مصنوعی مولد در خلق سناریوها و تست‌های خلاقانه کمپین', presenter: 'مهندس بردیا کریمی', platform: 'Skyroom', cap: 600, reg: 580, att: 440, status: WebinarStatus.completed },
    { title: 'بهینه‌سازی نرخ تبدیل (CRO) در لندینگ پیج‌های با ترافیک بالا', presenter: 'امیر نوری', platform: 'Google Meet', cap: 300, reg: 290, att: 215, status: WebinarStatus.completed },
    { title: 'معماری و ساختار داده در کمپین‌های Google Ads و GA4', presenter: 'فرشاد طاهری', platform: 'Skyroom', cap: 400, reg: 360, att: 270, status: WebinarStatus.completed },
    { title: 'استراتژی‌های تولید محتوا و سئو در عصر جستجوی معنایی هوش مصنوعی', presenter: 'مینا صادقی', platform: 'Skyroom', cap: 450, reg: 410, att: 295, status: WebinarStatus.completed },
    { title: 'مدیریت و اتوماسیون قیف فروش سازمانی (B2B Sales Pipeline)', presenter: 'نیما باقری', platform: 'Skyroom', cap: 350, reg: 310, att: 240, status: WebinarStatus.completed },
    { title: 'اصول و استانداردهای ریتارگتینگ در شبکه‌های تبلیغاتی ایرانی', presenter: 'امیر نوری', platform: 'Skyroom', cap: 300, reg: 250, att: 180, status: WebinarStatus.completed },
    { title: 'طراحی کمپین‌های شب عید و جشنواره‌های تخفیف پایان سال', presenter: 'سارا راد', platform: 'Skyroom', cap: 700, reg: 430, att: 0, status: WebinarStatus.scheduled },
    { title: 'اصول مذاکره و اقناع مشتریان سازمانی برای تیم‌های فروش', presenter: 'نیما باقری', platform: 'Skyroom', cap: 250, reg: 180, att: 0, status: WebinarStatus.scheduled },
    { title: 'هک رشد برای استارتاپ‌ها با بودجه محدود تبلیغاتی', presenter: 'مهندس بردیا کریمی', platform: 'Skyroom', cap: 500, reg: 210, att: 0, status: WebinarStatus.scheduled },
  ];

  for (let i = 0; i < webinarDefs.length; i++) {
    const w = webinarDefs[i];
    const webId = `b0000000-0000-0000-0000-0000000000${(i + 1).toString().padStart(2, '0')}`;
    const campId = org1CampaignIds[i % org1CampaignIds.length];
    const webDate = i < 7
      ? new Date(now.getTime() - (i + 1) * 7 * 86400000)
      : new Date(now.getTime() + (i - 6) * 7 * 86400000);

    await prisma.webinar.upsert({
      where: { id: webId },
      update: {
        organizationId: ORG_1_ID,
        campaignId: campId,
        title: w.title,
        presenterName: w.presenter,
        platform: w.platform,
        webinarDate: webDate,
        durationMinutes: 90,
        registrationUrl: `https://webinar.gapji.dev/event-${i + 1}`,
        bannerUrl: `/assets/webinars/banner-${i + 1}.jpg`,
        status: w.status,
        capacity: w.cap,
        registeredCount: w.reg,
        attendedCount: w.att,
      },
      create: {
        id: webId,
        organizationId: ORG_1_ID,
        campaignId: campId,
        title: w.title,
        presenterName: w.presenter,
        platform: w.platform,
        webinarDate: webDate,
        durationMinutes: 90,
        registrationUrl: `https://webinar.gapji.dev/event-${i + 1}`,
        bannerUrl: `/assets/webinars/banner-${i + 1}.jpg`,
        status: w.status,
        capacity: w.cap,
        registeredCount: w.reg,
        attendedCount: w.att,
      },
    });
  }

  // -------------------------------------------------------------
  // 14. TASKS & KPI RULES (240 Tasks & 24 KPI Rules)
  // -------------------------------------------------------------
  console.log('📋 [14/14] Seeding Tasks, Subtasks, KPI Metrics & Alert Rules...');
  await prisma.taskSubtask.deleteMany({ where: { organizationId: ORG_1_ID } });
  await prisma.task.deleteMany({ where: { organizationId: ORG_1_ID } });

  const taskTitles = [
    'بهینه‌سازی نرخ کلیک (CTR) بنرهای کمپین جمعه سیاه',
    'بررسی و تفکیک کلمات کلیدی منفی (Negative Keywords) در ادوردز',
    'تماس تلفنی اولیه با سرنخ‌های واجد شرایط ثبت‌نامی وبینار',
    'طراحی و کدنویسی لندینگ پیج جدید پکیج سئو سازمانی',
    'تست A/B دکمه CTA و فرم ثبت‌نام در صفحه مشاوره رایگان',
    'تنظیم سگمنت مخاطبان ریتارگتینگ بازدیدکنندگان صفحه قیمت‌ها',
    'آماده‌سازی اسلایدهای پرزنتیشن وبینار استراتژی پرفورمنس',
    'بررسی گزارش بازگشت سرمایه (ROAS) کمپین‌های یکتانت',
    'ارسال پیش‌نویس قرارداد همکاری بازاریابی به کارفرما',
    'بررسی افت نرخ تبدیل فرم تماس در لندینگ دوره آموزشی',
    'ثبت فاکتورهای هزینه‌ای رسانه‌ها در سیستم مدیریت هزینه',
    'پیگیری تایید هویت و مدارک پنل تبلیغات گوگل ادز',
    'تولید ۳ طرح بنر همسان برای کمپین مدیااد',
    'طراحی سناریوی پیامک هوشمند یادآوری رویداد آنلاین',
    'بررسی سلامت اتصال وب‌هوک لیدهای ورودی به CRM',
  ];

  const tasksToInsert: any[] = [];
  const taskAssignees = [
    '10000000-0000-0000-0000-000000000003', // امیر نوری
    '10000000-0000-0000-0000-000000000004', // نیما باقری
    '10000000-0000-0000-0000-000000000005', // مینا صادقی
    '10000000-0000-0000-0000-000000000010', // پویا احمدی
    '10000000-0000-0000-0000-000000000011', // الناز شریفی
    '10000000-0000-0000-0000-000000000012', // فرشاد طاهری
  ];

  for (let i = 0; i < 240; i++) {
    const taskId = crypto.randomUUID();
    const taskStatus = i % 5 === 0 ? TaskStatus.done :
      i % 5 === 1 ? TaskStatus.in_progress :
      i % 5 === 2 ? TaskStatus.todo :
      i % 5 === 3 ? TaskStatus.waiting : TaskStatus.overdue;

    const taskPriority = i % 4 === 0 ? TaskPriority.urgent :
      i % 4 === 1 ? TaskPriority.high :
      i % 4 === 2 ? TaskPriority.medium : TaskPriority.low;

    const dueDate = new Date(now.getTime() + (getRandomInt(-15, 30)) * 86400000);
    const campId = org1CampaignIds[i % org1CampaignIds.length];

    tasksToInsert.push({
      id: taskId,
      organizationId: ORG_1_ID,
      title: `${taskTitles[i % taskTitles.length]} - شماره ${(i + 1).toString().padStart(3, '0')}`,
      description: 'اقدام عملیاتی پیگیری و بهینه‌سازی مطابق با چک‌لیست استانداردهای بازاریابی و فروش گپ‌جی',
      status: taskStatus,
      priority: taskPriority,
      dueDate,
      assigneeId: taskAssignees[i % taskAssignees.length],
      createdById: '10000000-0000-0000-0000-000000000002', // سارا راد
      relatedType: TaskRelatedType.campaign,
      relatedId: campId,
      createdAt: new Date(now.getTime() - getRandomInt(1, 40) * 86400000),
      updatedAt: now,
    });
  }

  await prisma.task.createMany({ data: tasksToInsert });
  console.log(`   Seeded ${tasksToInsert.length} tasks.`);

  // KPI Metrics & Alert Rules
  console.log('   Seeding KPI Goals & Rules...');
  await prisma.kpiAlertRule.deleteMany({ where: { organizationId: ORG_1_ID } });
  await prisma.kpiMetric.deleteMany({ where: { organizationId: ORG_1_ID } });

  const kpiDefs = [
    { code: 'cpl_global', name: 'میانگین هزینه جذب هر لید (CPL)', target: 250000, actual: 235000, unit: 'تومان', dir: MetricDirection.lower_is_better },
    { code: 'roas_global', name: 'نرخ بازگشت هزینه تبلیغات (ROAS)', target: 4.0, actual: 3.8, unit: 'برابر', dir: MetricDirection.higher_is_better },
    { code: 'lead_volume_30d', name: 'حجم لیدهای ورودی ماهانه', target: 500, actual: 520, unit: 'لید', dir: MetricDirection.higher_is_better },
    { code: 'conv_rate_funnel', name: 'نرخ تبدیل لید به مشتری نهایی', target: 6.5, actual: 7.1, unit: 'درصد', dir: MetricDirection.higher_is_better },
    { code: 'cac_global', name: 'هزینه جذب مشتری نهایی (CAC)', target: 3500000, actual: 3200000, unit: 'تومان', dir: MetricDirection.lower_is_better },
  ];

  for (let i = 0; i < kpiDefs.length; i++) {
    const k = kpiDefs[i];
    const kpiId = `c0000000-0000-0000-0000-0000000000${(i + 1).toString().padStart(2, '0')}`;

    await prisma.kpiMetric.upsert({
      where: { id: kpiId },
      update: {
        organizationId: ORG_1_ID,
        name: k.name,
        code: k.code,
        direction: k.dir,
        targetValue: k.target,
        actualValue: k.actual,
        unit: k.unit,
        period: 'monthly',
      },
      create: {
        id: kpiId,
        organizationId: ORG_1_ID,
        name: k.name,
        code: k.code,
        direction: k.dir,
        targetValue: k.target,
        actualValue: k.actual,
        unit: k.unit,
        period: 'monthly',
      },
    });

    // Alert Rule
    await prisma.kpiAlertRule.create({
      data: {
        organizationId: ORG_1_ID,
        kpiMetricId: kpiId,
        metricName: k.name,
        condition: k.dir === MetricDirection.lower_is_better ? 'gt' : 'lt',
        thresholdValue: k.target,
        severity: 'warning',
        message: `انحراف منفی در شاخص «${k.name}» فراتر از حد آستانه مجاز تعریف‌شده`,
        suggestedAction: 'بررسی فوری کیفیت لیدها و بازنگری در سگمنت مخاطبان و تارگتینگ کلمات کلیدی',
        isActive: true,
      },
    });
  }

  // -------------------------------------------------------------
  // FINAL VERIFICATION COUNTS
  // -------------------------------------------------------------
  const finalCounts = {
    organizations: await prisma.organization.count(),
    users: await prisma.user.count(),
    platforms: await prisma.platform.count(),
    costCategories: await prisma.costCategory.count(),
    leadStatuses: await prisma.leadStatusConfig.count(),
    targetAudiences: await prisma.targetAudience.count(),
    campaigns: await prisma.campaign.count(),
    landingPages: await prisma.landingPage.count(),
    utmLinks: await prisma.utmLink.count(),
    costs: await prisma.cost.count(),
    leads: await prisma.lead.count(),
    smsCampaigns: await prisma.smsCampaign.count(),
    smsRecipients: await prisma.smsRecipient.count(),
    webinars: await prisma.webinar.count(),
    tasks: await prisma.task.count(),
    kpiMetrics: await prisma.kpiMetric.count(),
    kpiAlertRules: await prisma.kpiAlertRule.count(),
  };

  console.log('🎉 Comprehensive Seed Generation Finished Successfully!');
  console.log('📊 Final Verified Database Inventory:');
  console.table(finalCounts);

  return finalCounts;
}

runSeed()
  .catch((e) => {
    console.error('❌ Comprehensive seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
