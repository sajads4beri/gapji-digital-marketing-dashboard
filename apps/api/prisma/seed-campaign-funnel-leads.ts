import * as fs from 'fs';
import * as path from 'path';

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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

const COMPANIES = [
  'توسعه تجارت آریا', 'هلدینگ رایان پارس', 'فناوری اطلاعات فردا', 'صنایع الکترونیک سینا',
  'گروه سرمایه‌گذاری آینده', 'پتروشیمی سپهر', 'شرکت مهندسی پویا فن', 'فروشگاه آنلاین آوین',
  'آژانس تبلیغاتی مهرگان', 'صنایع بسته‌بندی امید', 'نرم‌افزاری پارس دیتا', 'سامانه هوشمند سپهر'
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMobile(idx: number): string {
  const prefixes = ['0912', '0935', '0919', '0936', '0939', '0913', '0915', '0917', '0918', '0930'];
  const prefix = prefixes[idx % prefixes.length];
  const num = (1000000 + (idx * 37) % 9000000).toString().slice(0, 7);
  return `${prefix}${num}`;
}

async function main() {
  console.log('🚀 Seeding comprehensive campaign funnel leads...');
  const campaigns = await prisma.campaign.findMany({ take: 10 });
  const statuses = await prisma.leadStatusConfig.findMany({ orderBy: { sortOrder: 'asc' } });
  const users = await prisma.user.findMany({ take: 10 });

  if (campaigns.length === 0 || statuses.length === 0) {
    console.log('No campaigns or statuses found.');
    return;
  }

  const salesAgents = users.filter((u) => u.email?.includes('sales') || u.email?.includes('admin')) || users;

  // Distribution: realistic sales funnel shape
  // new: 45, in_progress: 28, qualified: 18, proposal: 10, won: 6, lost: 4
  const stageDistribution: Record<string, number> = {
    new: 45,
    in_progress: 28,
    qualified: 18,
    proposal: 10,
    won: 6,
    lost: 4,
  };

  let globalLeadCounter = 0;

  for (const campaign of campaigns) {
    console.log(`Seeding leads for: "${campaign.name}" (${campaign.id})`);
    // Delete existing leads for this campaign to ensure clean realistic state
    await prisma.leadActivity.deleteMany({ where: { lead: { campaignId: campaign.id } } });
    await prisma.smsRecipient.deleteMany({ where: { convertedLead: { campaignId: campaign.id } } });
    await prisma.webinarAttendee.deleteMany({ where: { lead: { campaignId: campaign.id } } });
    await prisma.lead.deleteMany({ where: { campaignId: campaign.id } });

    for (const status of statuses) {
      const count = stageDistribution[status.key] || 5;

      for (let i = 0; i < count; i++) {
        globalLeadCounter++;
        const fullName = `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`;
        const company = getRandomItem(COMPANIES);
        const mobile = generateMobile(globalLeadCounter);
        const city = getRandomItem(CITIES);
        const assignedTo = salesAgents[globalLeadCounter % salesAgents.length];

        let salesValue: number | null = null;
        let lostReason: string | null = null;
        let nextNote: string | null = null;

        if (status.key === 'won') {
          salesValue = getRandomInt(18, 95) * 1000000; // 18M to 95M Toman deal
        } else if (status.key === 'lost') {
          lostReason = getRandomItem([
            'بودجه ناکافی برای اجرای پلن سازمانی',
            'عدم تطابق نیازمندی فنی با امکانات پلتفرم',
            'انصراف کارفرما به دلیل تغییر اولویت‌های فصلی',
            'عدم پاسخگویی پس از ۵ نوبت تماس تلفنی',
            'همکاری با آژانس تبلیغاتی رقیب',
          ]);
        } else if (status.key === 'in_progress') {
          nextNote = 'تماس مجدد جهت هماهنگی جلسه دمو و ارسال نمونه کار';
        } else if (status.key === 'qualified') {
          nextNote = 'تنظیم پروپوزال فنی و مالی بر اساس سگمنت مخاطبان B2B';
        } else if (status.key === 'proposal') {
          nextNote = 'پیگیری تایید پیش‌فاکتور با مدیر مالی شرکت کارفرما';
        }

        const hoursAgo = getRandomInt(1, 720); // within last 30 days
        const createdAt = new Date(Date.now() - hoursAgo * 3600000);

        await prisma.lead.create({
          data: {
            organizationId: campaign.organizationId,
            campaignId: campaign.id,
            fullName: `${fullName} (${company})`,
            mobile,
            email: `lead.${globalLeadCounter}@example.com`,
            city,
            source: 'گوگل ادز سرچ',
            utmSource: 'google',
            utmMedium: 'cpc',
            utmCampaign: campaign.name,
            statusKey: status.key,
            statusConfigId: status.id,
            assignedToId: assignedTo?.id,
            salesValue,
            lostReason,
            nextFollowUpAt: nextNote ? new Date(Date.now() + 86400000 * 2) : null,
            nextFollowUpNote: nextNote,
            createdAt,
            updatedAt: createdAt,
          },
        });
      }
    }
  }

  console.log(`✅ Successfully seeded realistic funnel leads across ${campaigns.length} campaigns!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
