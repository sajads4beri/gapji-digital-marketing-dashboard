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

// Definition of standard marketing funnel OKRs mapped directly to actual stage keys
const stageDefinitions = [
  {
    stageKey: 'new',
    objectiveTitle: 'افزایش نرخ جذب و اعتبارسنجی اولیه سرنخ‌های ورودی کمپین',
    description: 'تمرکز بر ورود لیدهای باکیفیت از کانال‌های تبلیغاتی و پایش صحت اطلاعات تماس و پاسخگویی سریع',
    keyResults: [
      {
        title: 'برقراری تماس اولیه با ۱۰۰٪ لیدهای جدید ظرف حداکثر ۱۵ دقیقه',
        targetValue: 100,
        currentValue: 85,
        unit: 'درصد',
        tasks: [
          {
            title: 'تنظیم وب‌هوک ارسال آنی نوتیفیکیشن لید جدید به تلگرام تیم فروش',
            priority: 'urgent',
            status: 'done',
            assigneeEmail: 'campaign@gapji.dev',
            subtasks: [
              { title: 'دریافت توکن بات تلگرام و چت‌آیدی گروه فروش', isCompleted: true },
              { title: 'تست ارسال پی‌لود تستی با فرمت پیام فارسی', isCompleted: true },
            ],
            comments: [
              { authorEmail: 'marketing@gapji.dev', content: 'وب‌هوک با موفقیت تست شد و میانگین تأخیر زیر ۲ ثانیه است.' },
            ],
          },
          {
            title: 'تماس تلفنی اولیه با ۵ لید ورودی جدید کمپین سرچ ادز',
            priority: 'high',
            status: 'done',
            assigneeEmail: 'sales@gapji.dev',
            subtasks: [
              { title: 'بررسی نام و شماره موبایل در سامانه شاهکار', isCompleted: true },
              { title: 'ثبت خلاصه مکالمه ۵ دقیقه‌ای در پرونده لید', isCompleted: true },
            ],
            comments: [
              { authorEmail: 'sales@gapji.dev', content: 'کارفرماها نسبت به پکیج رشد ابراز تمایل جدی کردند.' },
            ],
          },
        ],
      },
      {
        title: 'افزایش نرخ برقراری تماس موفق (Connect Rate) به بالای ۸۰٪',
        targetValue: 80,
        currentValue: 75,
        unit: 'درصد',
        tasks: [
          {
            title: 'بهینه‌سازی زمان‌بندی تماس مجدد در ساعات اوج پاسخگویی مخاطبان',
            priority: 'high',
            status: 'in_progress',
            assigneeEmail: 'pouya.ahmadi@gapji.dev',
            subtasks: [
              { title: 'تحلیل داده‌های آماری ساعات ۱۰ تا ۱۲ صبح و ۱۶ تا ۱۸ عصر', isCompleted: true },
              { title: 'تنظیم شیفت کارشناسان پیگیری لید', isCompleted: false },
            ],
            comments: [],
          },
          {
            title: 'تست خطوط تماس ابری با پیش‌شماره‌های معتبر استانی',
            priority: 'medium',
            status: 'todo',
            assigneeEmail: 'elnaz.sharifi@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        title: 'تحلیل کیفیت ترافیک لندینگ پیج و سورس ورودی لیدها',
        targetValue: 1,
        currentValue: 0,
        unit: 'تسک',
        tasks: [], // Zero tasks to showcase 'بدون تسک (۰٪)'
      },
    ],
  },
  {
    stageKey: 'in_progress',
    objectiveTitle: 'پاسخ‌گویی سریع، تعمیق ارتباط اولیه و کشف نیازهای اساسی لید',
    description: 'پیگیری چندکاناله (تلفنی، پیامک، پیام‌رسان) و معرفی راهکارهای متناسب با بیزینس کارفرما',
    keyResults: [
      {
        title: 'تکمیل فرم ارزیابی نیازهای تجاری برای حداقل ۶۰ لید فعال',
        targetValue: 60,
        currentValue: 45,
        unit: 'فرم',
        tasks: [
          {
            title: 'ارسال پرسشنامه کوتاه نیازسنجی کسب‌وکار در واتساپ و بله',
            priority: 'medium',
            status: 'done',
            assigneeEmail: 'elnaz.sharifi@gapji.dev',
            subtasks: [
              { title: 'آماده‌سازی لینک کوتاه فرم در سامانه', isCompleted: true },
              { title: 'ارسال خودکار پیامک یادآور فرم', isCompleted: true },
            ],
            comments: [],
          },
          {
            title: 'ثبت دقیق نیازمندی‌ها و بودجه اعلامی لید در بخش یادداشت‌های CRM',
            priority: 'high',
            status: 'done',
            assigneeEmail: 'sales@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        title: 'کاهش میانگین زمان انتظار بین تماس اول و دوم به زیر ۲۴ ساعت',
        targetValue: 24,
        currentValue: 20,
        unit: 'ساعت',
        tasks: [
          {
            title: 'تنظیم یادآور خودکار تقویم برای فالوآپ نوبت دوم لیدها',
            priority: 'medium',
            status: 'in_progress',
            assigneeEmail: 'pouya.ahmadi@gapji.dev',
            subtasks: [],
            comments: [],
          },
          {
            title: 'ارسال کاتالوگ خدمات و نمونه‌کارهای مرتبط با حوزه کاری کارفرما',
            priority: 'low',
            status: 'todo',
            assigneeEmail: 'marketing@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
    ],
  },
  {
    stageKey: 'qualified',
    objectiveTitle: 'تایید صلاحیت تجاری و تطابق بودجه لیدها جهت ارائه راه‌حل اختصاصی',
    description: 'صلاحیت‌سنجی بر اساس چارچوب BANT (بودجه، اختیار تصمیم‌گیری، نیاز بیزینس و زمان‌بندی اجرا)',
    keyResults: [
      {
        title: 'تبدیل حداقل ۴۵ لید واجد شرایط به متقاضی جلسه دمو و پرپوزال',
        targetValue: 45,
        currentValue: 30,
        unit: 'لید',
        tasks: [
          {
            title: 'ارزیابی انطباق بودجه کارفرما با حداقل تارگت پکیج‌های رشد',
            priority: 'urgent',
            status: 'done',
            assigneeEmail: 'sales@gapji.dev',
            subtasks: [
              { title: 'استعلام توان مالی و حجم فروش فعلی', isCompleted: true },
              { title: 'محاسبه هزینه هر جذب مورد انتظار (Target CPA)', isCompleted: true },
            ],
            comments: [
              { authorEmail: 'sales@gapji.dev', content: 'بودجه ماهانه ۴۰ تا ۶۰ میلیون تومان تایید شد.' },
            ],
          },
          {
            title: 'بررسی وب‌سایت و سوشال مدیای کارفرما قبل از جلسه تحلیل',
            priority: 'high',
            status: 'done',
            assigneeEmail: 'campaign@gapji.dev',
            subtasks: [],
            comments: [],
          },
          {
            title: 'هماهنگی جلسه آنلاین با تصمیم‌گیرندگان اصلی و مدیران ارشد',
            priority: 'high',
            status: 'in_progress',
            assigneeEmail: 'pouya.ahmadi@gapji.dev',
            subtasks: [
              { title: 'ارسال دعوت‌نامه تقویم گوگل و لینک اسکای‌روم', isCompleted: true },
              { title: 'اطمینان از حضور مدیرعامل یا مدیر مارکتینگ در جلسه', isCompleted: false },
            ],
            comments: [],
          },
        ],
      },
      {
        title: 'کسب امتیاز انطباق فنی بالای ۸۵٪ در چک‌لیست صلاحیت‌سنجی SQL',
        targetValue: 85,
        currentValue: 82,
        unit: 'درصد',
        tasks: [
          {
            title: 'طراحی تمپلیت استاندارد گزارش وضعیت مارکتینگ کارفرما (Audit Deck)',
            priority: 'medium',
            status: 'todo',
            assigneeEmail: 'marketing@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
    ],
  },
  {
    stageKey: 'proposal',
    objectiveTitle: 'ارائه پیشنهاد قیمت رقابتی، دفاع از پروپوزال و رفع ابهامات مالی',
    description: 'برگزاری جلسه پرزنتیشن راهکار، ارائه آنالیز رقبا و تنظیم پیش‌فاکتور رسمی شرکتی',
    keyResults: [
      {
        title: 'صدور و دفاع از ۳۰ فقره پیش‌فاکتور و پروپوزال رسمی برای لیدهای ارزیابی‌شده',
        targetValue: 30,
        currentValue: 20,
        unit: 'پیش‌فاکتور',
        tasks: [
          {
            title: 'تهیه پروپوزال مالی بر اساس پیش‌بینی نرخ بازگشت سرمایه (ROI Forecast)',
            priority: 'urgent',
            status: 'done',
            assigneeEmail: 'sales@gapji.dev',
            subtasks: [
              { title: 'استخراج داده‌های بنچ‌مارک صنعت در گوگل ادز', isCompleted: true },
              { title: 'طراحی جدول شفاف هزینه‌های دلاری و ریالی', isCompleted: true },
            ],
            comments: [],
          },
          {
            title: 'برگزاری جلسه آنلاین دفاع از استراتژی پیشنهادی با حضور مارکتینگ منیجر',
            priority: 'high',
            status: 'in_progress',
            assigneeEmail: 'marketing@gapji.dev',
            subtasks: [],
            comments: [],
          },
          {
            title: 'ارسال قرارداد تیپ و پیش‌نویس تعهدات SLA به بخش حقوقی کارفرما',
            priority: 'medium',
            status: 'todo',
            assigneeEmail: 'admin@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        title: 'کاهش چرخه بررسی و تایید پیش‌فاکتور توسط کارفرما به زیر ۵ روز کاری',
        targetValue: 5,
        currentValue: 4,
        unit: 'روز',
        tasks: [
          {
            title: 'تماس پیگیری و پاسخ به سوالات مالیاتی و ساختار پرداخت اقساطی',
            priority: 'medium',
            status: 'in_progress',
            assigneeEmail: 'sales@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
    ],
  },
  {
    stageKey: 'won',
    objectiveTitle: 'تسریع پرداخت، نهایی‌سازی قرارداد و فرآیند آنبوردینگ مشتری جدید',
    description: 'انتقال بدون اصطکاک مشتری از فروش به تیم اجرایی پرفورمنس مارکتینگ و لانچ اولیه',
    keyResults: [
      {
        title: 'آنبوردینگ موفق ۱۰ مشتری جدید در کمتر از ۴۸ ساعت از امضای قرارداد',
        targetValue: 10,
        currentValue: 8,
        unit: 'مشتری',
        tasks: [
          {
            title: 'ایجاد دسترسی‌های اد اکانت، تگ منیجر و گوگل آنالیتیکس مشتری',
            priority: 'urgent',
            status: 'done',
            assigneeEmail: 'campaign@gapji.dev',
            subtasks: [
              { title: 'بررسی اتصال صحیح ایونت‌های ای‌کامرس در GA4', isCompleted: true },
              { title: 'تعریف کانورژن‌های اکانت گوگل ادز', isCompleted: true },
            ],
            comments: [],
          },
          {
            title: 'برگزاری جلسه معارفه تیم اجرایی کمپین (Kick-off Meeting) با کارفرما',
            priority: 'high',
            status: 'done',
            assigneeEmail: 'admin@gapji.dev',
            subtasks: [],
            comments: [],
          },
          {
            title: 'تنظیم بریف اولیه اجرای کمپین و تایید لیست کلمات کلیدی هدف',
            priority: 'high',
            status: 'done',
            assigneeEmail: 'campaign@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        title: 'دریافت ۱۰۰٪ پیش‌پرداخت فاز اول طبق شرایط توافق‌نامه رسمی',
        targetValue: 100,
        currentValue: 100,
        unit: 'درصد',
        tasks: [
          {
            title: 'ثبت فاکتور رسمی و ارسال رسید پرداخت به واحد مالی و حسابداری',
            priority: 'medium',
            status: 'done',
            assigneeEmail: 'admin@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
    ],
  },
  {
    stageKey: 'lost',
    objectiveTitle: 'تحلیل ریشه‌ای علل عدم خرید و طراحی کمپین ریتارگتینگ اختصاصی',
    description: 'دسته‌بندی دلایل انصراف و بازگردانی سرنخ‌های مستعد در رویدادها و تخفیف‌های فصلی آینده',
    keyResults: [
      {
        title: 'ثبت دقیق دلیل رد شدن برای ۱۰۰٪ لیدهای از دست‌رفته',
        targetValue: 100,
        currentValue: 95,
        unit: 'درصد',
        tasks: [
          {
            title: 'دسته‌بندی لیدهای ردشده بر اساس قیمت، زمان‌بندی و انتخاب آژانس رقیب',
            priority: 'medium',
            status: 'done',
            assigneeEmail: 'sales@gapji.dev',
            subtasks: [],
            comments: [],
          },
          {
            title: 'ارسال نظرسنجی کوتاه یک‌سوالی در مورد کیفیت پاسخگویی تیم فروش',
            priority: 'low',
            status: 'done',
            assigneeEmail: 'marketing@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        title: 'آماده‌سازی سگمنت اختصاصی برای کمپین تخفیف فصلی و ریتارگتینگ',
        targetValue: 1,
        currentValue: 0,
        unit: 'کمپین',
        tasks: [
          {
            title: 'افزودن شماره‌های علاقه‌مند به لیست ارسال خبرنامه و رویدادهای آتی',
            priority: 'medium',
            status: 'in_progress',
            assigneeEmail: 'elnaz.sharifi@gapji.dev',
            subtasks: [],
            comments: [],
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log('🚀 Seeding comprehensive Funnel Objectives, Key Results, and Tasks...');

  const campaigns = await prisma.campaign.findMany({ take: 10 });
  const allUsers = await prisma.user.findMany();

  if (campaigns.length === 0 || allUsers.length === 0) {
    console.log('❌ No campaigns or users found.');
    return;
  }

  const userMap: Record<string, any> = {};
  for (const u of allUsers) {
    if (u.email) userMap[u.email] = u;
  }
  const defaultUser = allUsers.find((u) => u.email?.includes('admin')) || allUsers[0];

  for (const campaign of campaigns) {
    console.log(`Seeding Funnel OKRs for: "${campaign.name}" (${campaign.id})`);

    // Clean up old objectives and tasks for this campaign's OKRs to ensure pristine state
    const oldObjectives = await prisma.campaignFunnelObjective.findMany({
      where: { campaignId: campaign.id },
      include: { keyResults: { select: { id: true } } },
    });

    const oldKrIds = oldObjectives.flatMap((o) => o.keyResults.map((k) => k.id));
    if (oldKrIds.length > 0) {
      await prisma.taskSubtask.deleteMany({ where: { task: { okrKeyResultId: { in: oldKrIds } } } });
      await prisma.taskComment.deleteMany({ where: { task: { okrKeyResultId: { in: oldKrIds } } } });
      await prisma.task.deleteMany({ where: { okrKeyResultId: { in: oldKrIds } } });
      await prisma.campaignFunnelKeyResult.deleteMany({ where: { id: { in: oldKrIds } } });
      await prisma.campaignFunnelObjective.deleteMany({ where: { campaignId: campaign.id } });
    }

    for (const def of stageDefinitions) {
      // 1. Create Objective for Stage
      const objective = await prisma.campaignFunnelObjective.create({
        data: {
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          stageKey: def.stageKey,
          title: def.objectiveTitle,
          description: def.description,
        },
      });

      // 2. Create Key Results
      for (const krDef of def.keyResults) {
        const kr = await prisma.campaignFunnelKeyResult.create({
          data: {
            organizationId: campaign.organizationId,
            objectiveId: objective.id,
            title: krDef.title,
            currentValue: krDef.currentValue,
            targetValue: krDef.targetValue,
            unit: krDef.unit,
          },
        });

        // 3. Create Tasks under KR
        for (let tIdx = 0; tIdx < krDef.tasks.length; tIdx++) {
          const taskDef = krDef.tasks[tIdx];
          const assignee = (taskDef.assigneeEmail && userMap[taskDef.assigneeEmail]) || defaultUser;

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (tIdx * 2 + 3));

          const createdTask = await prisma.task.create({
            data: {
              organizationId: campaign.organizationId,
              createdById: defaultUser.id,
              assigneeId: assignee.id,
              title: taskDef.title,
              description: `تسک اجرایی مرتبط با هدف مرحله «${def.objectiveTitle}» و نتیجه کلیدی «${krDef.title}».`,
              status: taskDef.status as any,
              priority: taskDef.priority as any,
              dueDate,
              relatedType: 'campaign',
              relatedId: campaign.id,
              okrKeyResultId: kr.id,
            },
          });

          // 4. Create Subtasks
          if (taskDef.subtasks && taskDef.subtasks.length > 0) {
            for (let sIdx = 0; sIdx < taskDef.subtasks.length; sIdx++) {
              const sub = taskDef.subtasks[sIdx];
              await prisma.taskSubtask.create({
                data: {
                  organizationId: campaign.organizationId,
                  taskId: createdTask.id,
                  title: sub.title,
                  isCompleted: sub.isCompleted,
                  sortOrder: sIdx,
                },
              });
            }
          }

          // 5. Create Comments
          if (taskDef.comments && taskDef.comments.length > 0) {
            for (const com of taskDef.comments) {
              const commentAuthor = (com.authorEmail && userMap[com.authorEmail]) || defaultUser;
              await prisma.taskComment.create({
                data: {
                  organizationId: campaign.organizationId,
                  taskId: createdTask.id,
                  authorUserId: commentAuthor.id,
                  content: com.content,
                },
              });
            }
          }
        }
      }
    }
  }

  console.log('✅ Successfully seeded clean, comprehensive Funnel OKRs, Tasks, Subtasks, and Comments across all campaigns!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
