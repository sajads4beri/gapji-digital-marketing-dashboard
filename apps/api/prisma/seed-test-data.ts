import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
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

import {
  PrismaClient,
  EquipmentReadinessStatus,
  SopStatus,
  IdeaStatus,
  VoteType,
  NotificationType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Test Data Generation for Marketing Platform Modules...');

  // 1. Resolve Organization & Core Users
  const org = await prisma.organization.findFirst({
    where: { slug: 'gapji-marketing' },
  }) || await prisma.organization.findFirst();

  if (!org) {
    throw new Error('No organization found in database! Please run basic seed first.');
  }

  const organizationId = org.id;
  console.log(`🏢 Target Organization: ${org.name} (${organizationId})`);

  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: { organizationId },
      },
    },
    take: 10,
  });

  if (users.length === 0) {
    throw new Error('No users found in organization.');
  }

  const adminUser = users.find((u) => u.email?.includes('admin')) || users[0];
  const marketingUser = users.find((u) => u.email?.includes('marketing')) || users[1] || users[0];
  const campaignUser = users.find((u) => u.email?.includes('campaign')) || users[2] || users[0];
  const salesUser = users.find((u) => u.email?.includes('sales')) || users[3] || users[0];

  console.log(`👤 Primary Users: Admin (${adminUser.fullName}), Marketing (${marketingUser.fullName}), Campaign (${campaignUser.fullName}), Sales (${salesUser.fullName})`);

  const campaign = await prisma.campaign.findFirst({ where: { organizationId } });
  const webinar = await prisma.webinar.findFirst({ where: { organizationId } });

  // --------------------------------------------------------------------------
  // 2. LEARNING RESOURCES & PROGRESS
  // --------------------------------------------------------------------------
  console.log('📚 Seeding Learning Resources & Progress...');
  const learningResourcesData = [
    {
      title: 'آموزش جامع گوگل ادز ۲۰۲۶ (از مبتدی تا پیشرفته)',
      category: 'تبلیغات کلیکی',
      software: 'گوگل ادز',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 65,
      description: 'راهنمای راه‌اندازی کمپین‌های Search و Display در Google Ads با بهینه‌سازی کلمات کلیدی منفی، تنظیم Quality Score و اد اکستنشن‌های مدرن.',
    },
    {
      title: 'مسترکلاس متا ادز و کمپین‌های اینستاگرام',
      category: 'شبکه‌های اجتماعی',
      software: 'متا بیزینس',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 45,
      description: 'استراتژی لیدجنریشن با فرم‌های Lead Gen اختصاصی اینستاگرام، سگمنت‌های Lookalike و پیاده‌سازی تست‌های A/B هوشمند.',
    },
    {
      title: 'اصول و تکنیک‌های پیاده‌سازی GA4 و تگ منیجر (GTM)',
      category: 'تحلیل داده',
      software: 'گوگل آنالیتیکس',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 55,
      description: 'تنظیم ایونت‌های اختصاصی ثبت‌نام، ردیابی رویدادهای لندینگ پیج و ساخت فانل‌های تبدیل (Funnel Exploration) در گوگل آنالیتیکس ۴.',
    },
    {
      title: 'چک‌لیست سئو تکنیکال و استراتژی محتوای لندینگ‌ها',
      category: 'سئو و کانتنت',
      software: 'گوگل سرچ کنسول',
      type: 'article',
      url: null,
      durationMinutes: 30,
      description: 'بهینه‌سازی Core Web Vitals، رفع ارورهای ایندکسینگ سرچ کنسول و تدوین استراتژی کلمات کلیدی با نرخ تبدیل بالا برای صفحات فرود.',
    },
    {
      title: 'راهنمای جامع کار با CRM و مدیریت لیدهای فروش B2B',
      category: 'فروش و CRM',
      software: 'CRM',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 40,
      description: 'مراحل پیگیری سریع لید (SLA)، ثبت یادداشت تماس‌های تلفنی، انتقال به کانبان و نهایی‌سازی قراردادهای فروش.',
    },
    {
      title: 'تبلیغات بنری و همسان در صباویژن و یکتانت',
      category: 'تبلیغات بومی',
      software: 'یکتانت',
      type: 'article',
      url: null,
      durationMinutes: 25,
      description: 'تکنیک‌های بهینه‌سازی ریتارگتینگ محصول، تنظیم بیدینگ هوشمند و انتخاب وب‌سایت‌های نمایش‌دهنده با بالاترین CTR.',
    },
    {
      title: 'روانشناسی کپی‌رایتینگ در پیامک‌های تبلیغاتی (SMS Marketing)',
      category: 'اس‌ام‌اس مارکتینگ',
      software: 'مگفا',
      type: 'book',
      url: null,
      durationMinutes: 50,
      description: 'نگارش کال تو اکشن‌های (CTA) مقاومت‌ناپذیر، تنظیم هوشمند ساعات ارسال و جلوگیری از افتادن پیام در لیست سیاه مخاطبان.',
    },
    {
      title: 'طراحی پرسونای مخاطب و تدوین استراتژی قیف بازاریابی',
      category: 'استراتژی',
      software: 'فیگما',
      type: 'article',
      url: null,
      durationMinutes: 35,
      description: 'تعیین مشخصات مشتری ایده‌آل (ICP)، نقشه‌برداری نقاط تماس در مسیر خرید و یکپارچه‌سازی کانال‌های جذب کاربر.',
    },
  ];

  const createdResources = [];
  for (const item of learningResourcesData) {
    let res = await prisma.learningResource.findFirst({
      where: { organizationId, title: item.title },
    });
    if (!res) {
      res = await prisma.learningResource.create({
        data: {
          organizationId,
          ...item,
        },
      });
    }
    createdResources.push(res);
  }
  console.log(`   ✅ Seeded ${createdResources.length} learning resources.`);

  // Seed User Progress
  for (const user of users.slice(0, 4)) {
    for (let i = 0; i < createdResources.length; i++) {
      const resource = createdResources[i];
      const isCompleted = (i + user.fullName.length) % 2 === 0;
      const rating = isCompleted ? 4 + (i % 2) : null;
      const notes = isCompleted
        ? 'مفاهیم دوره بسیار کاربردی بود و بلافاصله در کمپین‌های اخیر پیاده‌سازی شد.'
        : 'در حال مشاهده و مطالعه بخش‌های اولیه دوره.';

      await prisma.userLearningProgress.upsert({
        where: {
          userId_resourceId: {
            userId: user.id,
            resourceId: resource.id,
          },
        },
        update: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          rating,
          notes,
        },
        create: {
          organizationId,
          userId: user.id,
          resourceId: resource.id,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          rating,
          notes,
        },
      });
    }
  }
  console.log('   ✅ Seeded user learning progress for team members.');

  // --------------------------------------------------------------------------
  // 3. EQUIPMENT & SHORTAGES
  // --------------------------------------------------------------------------
  console.log('🎙️ Seeding Equipment Items, Templates & Shortages...');
  const equipmentItemsData = [
    { name: 'میکروفون بی‌سیم یقه ای رود (Rode Wireless GO II)', category: 'صوت', description: 'میکروفون دوکاناله با برد ۲۰۰ متر و ضبط داخلی پشتیبان' },
    { name: 'وب‌کم اولترا اچ‌دی لاجیتک Brio 4K', category: 'تصویر', description: 'وب‌کم حرفه‌ای با قابلیت HDR و فوکوس خودکار هوشمند' },
    { name: 'کارت کپچر اکسترنال Elgato Cam Link 4K', category: 'استریم', description: 'اتصال مستقیم دوربین DSLR به سیستم پخش لایو و وبینار' },
    { name: 'رینگ لایت ۱۸ اینچ استودیویی Neewer با سه‌پایه', category: 'نور', description: 'نور حلقه‌ای با دمای رنگ قابل تنظیم ۳۲۰۰ تا ۵۶۰۰ کلوین' },
    { name: 'کیت نورهای دوقلوی سافت‌باکس استودیویی', category: 'نور', description: 'دو شاخه نور ۱۰۰ وات با دفیوزر دو لایه برای روشنایی یکدست صحنه' },
    { name: 'لپ‌تاپ پشتیبان پخش و مانیتورینگ ASUS ROG', category: 'سخت‌افزار', description: 'سیستم کمکی مستقل جهت ران کردن اسلایدها و مانیتور چت وبینار' },
    { name: 'مودم سیم‌کارتی 5G با پینگ زیر ۳۰ میلی‌ثانیه', category: 'شبکه', description: 'اینترنت اضطراری پرسرعت جهت جلوگیری از قطعی استریم' },
  ];

  const createdEquipment = [];
  for (const item of equipmentItemsData) {
    let eq = await prisma.equipmentItem.findFirst({
      where: { organizationId, name: item.name },
    });
    if (!eq) {
      eq = await prisma.equipmentItem.create({
        data: { organizationId, ...item },
      });
    }
    createdEquipment.push(eq);
  }
  console.log(`   ✅ Seeded ${createdEquipment.length} equipment items.`);

  // Equipment Template
  let template = await prisma.equipmentTemplate.findFirst({
    where: { organizationId, name: 'قالب جامع استودیو و وبینار آنلاین' },
  });
  if (!template) {
    template = await prisma.equipmentTemplate.create({
      data: {
        organizationId,
        name: 'قالب جامع استودیو و وبینار آنلاین',
        description: 'چک‌لیست آماده تجهیزات صوت، تصویر، نور و شبکه برای برگزاری وبینارهای باکیفیت',
        items: {
          create: createdEquipment.map((eq) => ({
            equipmentItemId: eq.id,
            quantity: 1,
          })),
        },
      },
    });
  }
  console.log('   ✅ Seeded equipment template and items.');

  // Event Equipment & Shortages
  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 2 * 86400000);
  const fiveDaysLater = new Date(now.getTime() + 5 * 86400000);
  const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);

  // Clear previous test event equipments for clean state
  await prisma.eventEquipment.deleteMany({ where: { organizationId } });

  await prisma.eventEquipment.createMany({
    data: [
      {
        organizationId,
        equipmentItemId: createdEquipment[0].id, // میکروفون
        campaignId: campaign?.id,
        webinarId: webinar?.id,
        status: EquipmentReadinessStatus.ready,
        responsibleId: campaignUser.id,
        dueDate: fiveDaysLater,
        notes: 'میکروفون تست شد و شارژ کامل دارد.',
      },
      {
        organizationId,
        equipmentItemId: createdEquipment[1].id, // وب‌کم
        campaignId: campaign?.id,
        webinarId: webinar?.id,
        status: EquipmentReadinessStatus.not_procured, // کمبود فوری!
        responsibleId: marketingUser.id,
        dueDate: twoDaysLater, // کمتر از ۳ روز -> هشدار کمبود قرمز
        notes: 'وب‌کم اصلی در تعمیرگاه است، نیاز به اجاره یا خرید فوری وب‌کم جایگزین تا پیش از وبینار.',
      },
      {
        organizationId,
        equipmentItemId: createdEquipment[2].id, // کارت کپچر
        campaignId: campaign?.id,
        webinarId: webinar?.id,
        status: EquipmentReadinessStatus.incomplete, // ناقص!
        responsibleId: salesUser.id,
        dueDate: twoDaysLater,
        notes: 'کابل HDMI اختصاصی کارت کپچر موجود نیست.',
      },
      {
        organizationId,
        equipmentItemId: createdEquipment[3].id, // رینگ لایت
        campaignId: campaign?.id,
        webinarId: webinar?.id,
        status: EquipmentReadinessStatus.ready,
        responsibleId: adminUser.id,
        dueDate: sevenDaysLater,
        notes: 'در استودیوی شماره ۲ نصب است.',
      },
    ],
  });
  console.log('   ✅ Seeded event equipment with URGENT shortages (< 3 days).');

  // --------------------------------------------------------------------------
  // 4. MEETINGS & ACTION ITEMS
  // --------------------------------------------------------------------------
  console.log('📝 Seeding Meeting Minutes & Action Items...');
  let meeting1 = await prisma.meeting.findFirst({
    where: { organizationId, title: 'جلسه استراتژی کمپین بلک فرایدی و هماهنگی بودجه تبلیغات' },
  });

  if (!meeting1) {
    meeting1 = await prisma.meeting.create({
      data: {
        organizationId,
        campaignId: campaign?.id,
        title: 'جلسه استراتژی کمپین بلک فرایدی و هماهنگی بودجه تبلیغات',
        meetingDate: new Date(now.getTime() - 2 * 86400000),
        location: 'اتاق جلسات اصلی + ارتباط ویدیویی Google Meet',
        attendeesSummary: 'مدیر ارشد، سارا راد (مدیر مارکتینگ)، امیر نوری (کمپین‌چی)، نیما باقری (فروش)',
        summary: 'تصویب بودجه اولیه ۶۰ میلیون تومانی، تصمیم‌گیری پیرامون صفحات فرود اختصاصی، و بررسی پیش‌بینی جذب ۱۰۰۰ لید جدید.',
        notes: 'مقرر شد تیم کمپین تا روز چهارشنبه نسخه اولیه صفحات فرود را به همراه تست وب‌هوک نهایی کنند.',
        versionNumber: 1,
        createdById: adminUser.id,
        actionItems: {
          create: [
            {
              description: 'آماده‌سازی لندینگ پیج جشنواره و اتصال فرم عضویت به وب‌هوک CRM',
              assigneeId: campaignUser.id,
              dueDate: twoDaysLater,
              isCompleted: false,
            },
            {
              description: 'تست A/B پیامک‌های دعوت به وبینار با ارسال به ۱۰۰۰ شماره از باشگاه مشتریان',
              assigneeId: salesUser.id,
              dueDate: fiveDaysLater,
              isCompleted: true,
            },
            {
              description: 'تایید نهایی قرارداد و بودجه بنرهای همسان با پلتفرم‌های صباویژن و یکتانت',
              assigneeId: marketingUser.id,
              dueDate: twoDaysLater,
              isCompleted: false,
            },
          ],
        },
      },
    });
  }

  let meeting2 = await prisma.meeting.findFirst({
    where: { organizationId, title: 'جلسه هفتگی بررسی شاخص‌های عملکرد (KPI) و کیفیت لیدها' },
  });

  if (!meeting2) {
    meeting2 = await prisma.meeting.create({
      data: {
        organizationId,
        campaignId: campaign?.id,
        title: 'جلسه هفتگی بررسی شاخص‌های عملکرد (KPI) و کیفیت لیدها',
        meetingDate: new Date(now.getTime() - 7 * 86400000),
        location: 'دفتر مرکزی - سالن کنفرانس',
        attendeesSummary: 'مدیر ارشد، سارا راد، نیما باقری',
        summary: 'بررسی شاخص‌های CAC و CPL. بهبود نرخ تبدیل لیدهای ورودی به مشتری از ۴٪ به ۵.۲٪.',
        notes: 'کارشناسان فروش موظف شدند زمان اولین تماس با لید را به کمتر از ۱۵ دقیقه برسانند.',
        versionNumber: 1,
        createdById: marketingUser.id,
        actionItems: {
          create: [
            {
              description: 'به‌روزرسانی اسکریپت تماس اولیه کارشناسان فروش بر اساس بازخوردهای جدید مشتریان',
              assigneeId: salesUser.id,
              dueDate: twoDaysLater,
              isCompleted: false,
            },
          ],
        },
      },
    });
  }
  console.log('   ✅ Seeded meetings and action items.');

  // --------------------------------------------------------------------------
  // 5. STANDARD OPERATING PROCEDURES (SOP)
  // --------------------------------------------------------------------------
  console.log('📑 Seeding SOP Knowledge Base & Versions...');
  const sop1Content = `# دستورالعمل جامع راه‌اندازی و اعتبارسنجی کمپین‌های تبلیغاتی (CPC)

## ۱. اهداف فرآیند
هدف از این فرآیند استانداردسازی نحوه ساخت، تست و نظارت بر کمپین‌های کلیکی (Google Ads, Yektanet, Sabavision) جهت جلوگیری از اتلاف بودجه است.

## ۲. پیش‌نیازها و چک‌لیست اولیه
- [ ] دریافت تاییدیه بودجه از مدیر مارکتینگ
- [ ] طراحی حداقل ۳ سایز بنر تبلیغاتی استاندارد
- [ ] تهیه متن آگهی (Copy) جذاب به همراه کال تو اکشن (CTA) مشخص

## ۳. مراحل اجرایی
1. ساخت لینک‌های اختصاصی با پارامترهای استاندارد UTM
2. بررسی لود سریع صفحه فرود (زیر ۲.۵ ثانیه در گوشی موبایل)
3. انجام یک تراکنش/ثبت لید تستی و بررسی در لاگ سرور
4. تنظیم سقف بودجه روزانه (Daily Cap) برای ۲۴ ساعت ابتدایی
5. فعال‌سازی کمپین و بررسی وضعیت نمایش بعد از ۲ ساعت`;

  let sop1 = await prisma.sop.findFirst({
    where: { organizationId, code: 'SOP-MKT-001' },
  });

  if (!sop1) {
    sop1 = await prisma.sop.create({
      data: {
        organizationId,
        title: 'دستورالعمل جامع راه‌اندازی و اعتبارسنجی کمپین‌های تبلیغاتی (CPC)',
        code: 'SOP-MKT-001',
        category: 'مارکتینگ',
        currentVersion: '1.1',
        status: SopStatus.active,
        authorId: marketingUser.id,
        approverId: adminUser.id,
        content: sop1Content,
        versions: {
          create: [
            {
              versionNumber: '1.0',
              changeSummary: 'نگارش اولیه سند فرآیند',
              content: sop1Content,
              createdById: marketingUser.id,
            },
            {
              versionNumber: '1.1',
              changeSummary: 'افزودن مرحله اعتبارسنجی پارامترهای UTM و سقف بودجه روزانه',
              content: sop1Content,
              createdById: adminUser.id,
            },
          ],
        },
      },
    });
  }

  const sop2Content = `# فرآیند پیگیری سریع لیدهای ورودی و تماس اولیه فروش (SLA ۱۵ دقیقه)

## ۱. اهمیت فرآیند
بر اساس استانداردهای مارکتینگ گپ‌جی، شانس تبدیل لید در صورت تماس در ۱۵ دقیقه اول تا ۴ برابر افزایش می‌یابد.

## ۲. مراحل اقدام
- [ ] بررسی اطلاعات ورودی در پنل سرنخ‌ها
- [ ] تماس تلفنی با مشتری و ثبت نتیجه تماس در لاگ
- [ ] ارسال کاتالوگ یا پیامک خوش‌آمدگویی پس از اتمام مکالمه
- [ ] انتقال کارت لید در بورد کانبان به وضعیت مربوطه`;

  let sop2 = await prisma.sop.findFirst({
    where: { organizationId, code: 'SOP-SLS-001' },
  });

  if (!sop2) {
    sop2 = await prisma.sop.create({
      data: {
        organizationId,
        title: 'فرآیند پیگیری سریع لیدهای ورودی و تماس اولیه فروش (SLA ۱۵ دقیقه)',
        code: 'SOP-SLS-001',
        category: 'فروش',
        currentVersion: '1.0',
        status: SopStatus.active,
        authorId: salesUser.id,
        approverId: adminUser.id,
        content: sop2Content,
        versions: {
          create: [
            {
              versionNumber: '1.0',
              changeSummary: 'تدوین اولیه فرآیند پاسخگویی به سرنخ‌های فروش',
              content: sop2Content,
              createdById: salesUser.id,
            },
          ],
        },
      },
    });
  }
  console.log('   ✅ Seeded SOP knowledge base with multi-version history.');

  // --------------------------------------------------------------------------
  // 6. IDEAS INCUBATOR & VOTING
  // --------------------------------------------------------------------------
  console.log('💡 Seeding Creative Ideas & Voting...');
  const ideasData = [
    {
      title: 'برگزاری چالش ویدیویی تعاملی در اینستاگرام با جایزه مشاوره رایگان کسب‌وکار',
      description: 'دعوت از مخاطبان برای ارسال ویدیو از بزرگ‌ترین چالش مارکتینگ خود و تحلیل زنده بهترین ویدیوها در لایو مشترک.',
      category: 'شبکه‌های اجتماعی',
      status: IdeaStatus.reviewing,
      authorId: marketingUser.id,
      votesCount: 8,
    },
    {
      title: 'وبینار تخصصی تحلیل عملی لندینگ‌پیج‌های میلیاردی با ثبت‌نام رایگان',
      description: 'یک رویداد ۲ ساعته برای بررسی فریم‌ورک‌های افزایش نرخ تبدیل لندینگ و رونمایی از پکیج‌های جدید خدمات آژانس.',
      category: 'رویداد و وبینار',
      status: IdeaStatus.approved,
      authorId: campaignUser.id,
      votesCount: 14,
    },
    {
      title: 'طراحی گردونه شانس تخفیف‌دار روی لندینگ جشنواره بلک فرایدی',
      description: 'افزودن ماژول گیمیفیکیشن برای دریافت شماره موبایل مخاطب در ازای دریافت کد تخفیف فوری بین ۱۰ تا ۵۰ درصد.',
      category: 'گیمیفیکیشن',
      status: IdeaStatus.submitted,
      authorId: salesUser.id,
      votesCount: 5,
    },
    {
      title: 'ایجاد باشگاه مشتریان و برنامه معرفی همکاران (Referral Program)',
      description: 'تخصیص ۱۰٪ پاداش نقدی یا اعتبار تبلیغاتی به هر کاربری که مشتری جدیدی به آژانس معرفی کند.',
      category: 'رشد ارگانیک',
      status: IdeaStatus.implemented,
      authorId: adminUser.id,
      outcomeNotes: 'با موفقیت در پنل پیاده‌سازی شد و ماه گذشته ۱۵ مشتری جدید جذب کرد.',
      votesCount: 19,
    },
  ];

  for (const ideaItem of ideasData) {
    let idea = await prisma.idea.findFirst({
      where: { organizationId, title: ideaItem.title },
    });
    if (!idea) {
      idea = await prisma.idea.create({
        data: {
          organizationId,
          campaignId: campaign?.id,
          ...ideaItem,
        },
      });

      // Add vote from admin user
      await prisma.ideaVote.create({
        data: {
          organizationId,
          ideaId: idea.id,
          userId: adminUser.id,
          voteType: VoteType.upvote,
        },
      });
    }
  }
  console.log('   ✅ Seeded creative proposals and interactive upvotes.');

  // --------------------------------------------------------------------------
  // 7. UNIFIED USER ACTIVITY LOGS
  // --------------------------------------------------------------------------
  console.log('📊 Seeding Unified Audit Activity Logs...');
  await prisma.userActivityLog.deleteMany({ where: { organizationId } });

  const activityLogsData = [
    {
      action: 'login',
      entityType: 'auth',
      details: 'ورود موفق به سامانه از طریق توکن JWT ایمن',
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - 10 * 60000), // 10 mins ago
      userId: adminUser.id,
    },
    {
      action: 'create_campaign',
      entityType: 'campaign',
      entityId: campaign?.id,
      details: 'ایجاد کمپین جدید: جشنواره پاییزه تبلیغات کلیکی گوگل',
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - 2 * 3600000), // 2 hrs ago
      userId: campaignUser.id,
    },
    {
      action: 'update_lead_status',
      entityType: 'lead',
      details: 'تغییر وضعیت سرنخ علی محمدی از «در حال مذاکره» به «مشتری نهایی»',
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - 5 * 3600000), // 5 hrs ago
      userId: salesUser.id,
    },
    {
      action: 'complete_learning_course',
      entityType: 'learning',
      details: 'تکمیل دوره آموزشی «آموزش جامع گوگل ادز ۲۰۲۶» و ثبت امتیاز ۵ ستاره',
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - 18 * 3600000), // 18 hrs ago
      userId: marketingUser.id,
    },
    {
      action: 'submit_idea',
      entityType: 'idea',
      details: 'ثبت پیشنهاد خلاقانه جدید در انکوباتور ایده‌ها',
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - 24 * 3600000), // 1 day ago
      userId: salesUser.id,
    },
    {
      action: 'create_meeting_action',
      entityType: 'meeting',
      details: 'ایجاد تسک پیگیری جدید از مصوبات جلسه استراتژی کمپین',
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - 36 * 3600000), // 1.5 days ago
      userId: adminUser.id,
    },
    {
      action: 'equipment_shortage_alert',
      entityType: 'equipment',
      details: 'ثبت هشدار کمبود وب‌کم 4K برای وبینار با موعد کمتر از ۲ روز',
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - 48 * 3600000), // 2 days ago
      userId: campaignUser.id,
    },
  ];

  await prisma.userActivityLog.createMany({
    data: activityLogsData.map((log) => ({
      organizationId,
      ...log,
    })),
  });
  console.log(`   ✅ Seeded ${activityLogsData.length} activity audit entries.`);

  // --------------------------------------------------------------------------
  // 8. NOTIFICATIONS & PREFERENCES
  // --------------------------------------------------------------------------
  console.log('🔔 Seeding System Notifications & Preferences...');
  await prisma.notification.deleteMany({ where: { userId: adminUser.id } });

  const notificationsData = [
    {
      title: 'کمبود فوری تجهیزات وبینار',
      message: 'وب‌کم اولترا اچ‌دی Brio 4K نیاز به تهیه فوری دارد (مهلت کمتر از ۴۸ ساعت).',
      type: NotificationType.alert,
      isRead: false,
      linkUrl: '/work/equipment',
      createdAt: new Date(now.getTime() - 15 * 60000),
    },
    {
      title: 'پیشنهاد خلاقانه جدید ثبت شد',
      message: 'سارا راد ایده «برگزاری چالش ویدیویی اینستاگرام» را برای کمپین ثبت کرد.',
      type: NotificationType.info,
      isRead: false,
      linkUrl: '/work/ideas',
      createdAt: new Date(now.getTime() - 90 * 60000),
    },
    {
      title: 'تخصیص اقدام جلسه کاری',
      message: 'اقدام «آماده‌سازی لندینگ پیج جشنواره بلک فرایدی» به شما محول گردید.',
      type: NotificationType.warning,
      isRead: false,
      linkUrl: '/work/meetings',
      createdAt: new Date(now.getTime() - 4 * 3600000),
    },
    {
      title: 'سرنخ جدید از سایت ثبت شد',
      message: 'سرنخ جدید «سجاد رضایی» از طریق فرم وب‌هوک وردپرس افزوده شد.',
      type: NotificationType.success,
      isRead: true,
      linkUrl: '/leads',
      createdAt: new Date(now.getTime() - 12 * 3600000),
    },
  ];

  await prisma.notification.createMany({
    data: notificationsData.map((n) => ({
      organizationId,
      userId: adminUser.id,
      ...n,
    })),
  });
  console.log(`   ✅ Seeded ${notificationsData.length} notifications for admin user.`);

  // --------------------------------------------------------------------------
  // 9. WORDPRESS INTEGRATION & WEBHOOK LOGS
  // --------------------------------------------------------------------------
  console.log('🌐 Seeding WordPress Inbound Integration & Webhook Logs...');
  let wp = await prisma.wordpressIntegration.findFirst({
    where: { organizationId, siteUrl: 'https://academy.gapji.ir' },
  });

  const mappingConfig = JSON.stringify({
    fullNameField: 'your-name',
    mobileField: 'your-phone',
    emailField: 'your-email',
    campaignCodeField: 'utm_campaign',
    notesField: 'your-message',
  });

  if (!wp) {
    wp = await prisma.wordpressIntegration.create({
      data: {
        organizationId,
        siteUrl: 'https://academy.gapji.ir',
        apiKeyHash: 'sha256_mock_hash_for_testing_purposes',
        webhookSecret: 'gapji_wp_sec_test_token_12345',
        leadMappingConfig: mappingConfig,
        isActive: true,
        lastSyncAt: new Date(now.getTime() - 20 * 60000),
      },
    });
  }

  await prisma.wordpressWebhookLog.deleteMany({ where: { organizationId } });

  await prisma.wordpressWebhookLog.createMany({
    data: [
      {
        organizationId,
        wordpressIntegrationId: wp.id,
        status: 'success',
        payloadSummary: '{"name":"سجاد رضایی","mobile":"09123456789","form":"Elementor Popup"}',
        ipAddress: '185.143.234.12',
        receivedAt: new Date(now.getTime() - 20 * 60000),
      },
      {
        organizationId,
        wordpressIntegrationId: wp.id,
        status: 'success',
        payloadSummary: '{"name":"فاطمه مرادی","mobile":"09351234567","form":"Contact Form 7"}',
        ipAddress: '185.143.234.12',
        receivedAt: new Date(now.getTime() - 60 * 60000),
      },
      {
        organizationId,
        wordpressIntegrationId: wp.id,
        status: 'rejected',
        reason: 'شماره موبایل واردشده قبلاً در سیستم ثبت شده و تکراری است.',
        payloadSummary: '{"name":"تست تکراری","mobile":"09123456789"}',
        ipAddress: '185.143.234.12',
        receivedAt: new Date(now.getTime() - 95 * 60000),
      },
    ],
  });
  console.log('   ✅ Seeded WordPress integration and webhook audit logs.');

  console.log('\n🎉 ALL TEST DATA SUCCESSFULLY GENERATED & CONNECTED!');
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
