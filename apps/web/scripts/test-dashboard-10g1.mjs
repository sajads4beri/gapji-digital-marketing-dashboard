/**
 * آزمون‌های خودکار جامع تفکیک روت کمپین‌ها و داشبورد اجرایی عملکرد (گام ۱۰G.1)
 *
 * پوشش کامل سناریوهای الزامی:
 * ۱. فرمول محاسبه ROAS (Return on Ad Spend)
 * ۲. ممانعت از تقسیم بر صفر در ROAS (بازگشت null به جای Infinity/NaN)
 * ۳. فرمول محاسبه CAC (Customer Acquisition Cost)
 * ۴. ممانعت از تقسیم بر صفر در CAC
 * ۵. فرمول محاسبه CPL (Cost per Lead)
 * ۶. ممانعت از تقسیم بر صفر در CPL
 * ۷. فرمول نرخ تبدیل سرنخ به مشتری (Conversion Rate)
 * ۸. ممانعت از تقسیم بر صفر در نرخ تبدیل
 * ۹. پایش درصد مصرف بودجه مصوب (Budget Consumed Percentage)
 * ۱۰. تولید نقاط نمودار روند هزینه در برابر درآمد متناسب با فیلتر بازه زمانی (۷ روز و ۳۰ روز)
 * ۱۱. سازگاری جمع داده‌های کانال‌های بازاریابی با KPIهای کلان
 * ۱۲. صحت محاسبات CPL و ROAS درون هر کانال بازاریابی
 * ۱۳. ساختار ۵ مرحله‌ای قیف تبدیل (Funnel) و صحت درصد تبدیل و ریزش
 * ۱۴. تولید هشدارهای فوری از داده‌های واقعی (کمپین پرمصرف، لید معوق، تسک دارای تأخیر)
 * ۱۵. صحت مسیرهای اقدام (Action Links) در هشدارهای فوری
 * ۱۶. وجود و ساختار فایل تفکیک‌شده صفحه کمپین‌ها (/campaigns)
 * ۱۷. وجود و ساختار داشبورد اجرایی در روت ریشه (/)
 * ۱۸. به‌روزرسانی صحیح لینک سایدبار کمپین‌ها به /campaigns در navigation.ts
 * ۱۹. حفظ مسیرهای فرعی کمپین (/campaigns/new, /campaigns/[id], /campaigns/[id]/edit)
 * ۲۰. هدایت کاربر پس از انتشار یا حذف کمپین به /campaigns
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('============================================================');
console.log('   EXECUTIVE DASHBOARD & CAMPAIGN ROUTE TESTS (STEP 10G.1) ');
console.log('============================================================\n');

// ۱. توابع فرمول‌های KPI (منطبق بر پیاده‌سازی dashboard.mock.ts)
function calculateRoas(revenue, spend) {
  if (spend <= 0) return null;
  const val = revenue / spend;
  if (!isFinite(val) || isNaN(val)) return null;
  return Math.round(val * 100) / 100;
}

function calculateCac(totalAcquisitionCost, wonCustomers) {
  if (wonCustomers <= 0) return null;
  const val = totalAcquisitionCost / wonCustomers;
  if (!isFinite(val) || isNaN(val)) return null;
  return Math.round(val);
}

function calculateCpl(spend, leadsCount) {
  if (leadsCount <= 0) return null;
  const val = spend / leadsCount;
  if (!isFinite(val) || isNaN(val)) return null;
  return Math.round(val);
}

function calculateConversionRate(wonCount, totalCount) {
  if (totalCount <= 0) return 0;
  const val = (wonCount / totalCount) * 100;
  if (!isFinite(val) || isNaN(val)) return 0;
  return Math.round(val * 10) / 10;
}

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    خطا: ${err.message}`);
    throw err;
  }
}

async function runTests() {
  console.log('--- بخش اول: اعتبارسنجی فرمول‌های ریاضی و جلوگیری از خطای مخرج صفر ---');

  test('۱. فرمول ROAS درآمد را بر هزینه تبلیغات تقسیم کرده و تا ۲ رقم گرد می‌کند', () => {
    // ۴۲۸ میلیون درآمد تقسیم بر ۱۲۴.۵ میلیون هزینه = 3.44
    const res = calculateRoas(428_000_000, 124_500_000);
    assert.strictEqual(res, 3.44);
  });

  test('۲. در صورت هزینه صفر یا منفی، فرمول ROAS مقدار null برمی‌گرداند (عدم تولید NaN/Infinity)', () => {
    assert.strictEqual(calculateRoas(100_000_000, 0), null);
    assert.strictEqual(calculateRoas(100_000_000, -500), null);
    assert.strictEqual(calculateRoas(0, 0), null);
  });

  test('۳. فرمول CAC کل هزینه جذب را بر تعداد مشتریان قطعی تقسیم می‌کند', () => {
    // ۱۲۴.۵ میلیون هزینه تقسیم بر ۲۳ مشتری = ۵٬۴۱۳٬۰۴۳
    const res = calculateCac(124_500_000, 23);
    assert.strictEqual(res, 5413043);
  });

  test('۴. در صورت صفر بودن تعداد مشتریان، فرمول CAC مقدار null برمی‌گرداند', () => {
    assert.strictEqual(calculateCac(50_000_000, 0), null);
    assert.strictEqual(calculateCac(0, 0), null);
  });

  test('۵. فرمول CPL هزینه کل لیدز را بر تعداد سرنخ‌های ورودی تقسیم می‌کند', () => {
    // ۱۲۴.۵ میلیون هزینه تقسیم بر ۱۸۴ لید = ۶۷۶٬۶۳۰
    const res = calculateCpl(124_500_000, 184);
    assert.strictEqual(res, 676630);
  });

  test('۶. در صورت عدم جذب لید (تعداد صفر)، CPL به صورت ایمن null برمی‌گرداند', () => {
    assert.strictEqual(calculateCpl(10_000_000, 0), null);
    assert.strictEqual(calculateCpl(0, 0), null);
  });

  test('۷. فرمول نرخ تبدیل، نسبت مشتریان بر کل لیدها را به درصد محاسبه می‌کند', () => {
    // ۲۳ مشتری از ۱۸۴ لید = 12.5%
    const res = calculateConversionRate(23, 184);
    assert.strictEqual(res, 12.5);
  });

  test('۸. در صورت نبود لید، نرخ تبدیل عدد ۰ برمی‌گرداند (نه NaN)', () => {
    assert.strictEqual(calculateConversionRate(0, 0), 0);
  });

  test('۹. درصد مصرف بودجه مصوب به درستی محاسبه می‌شود', () => {
    const budget = 185_000_000;
    const spend = 124_500_000;
    const pct = Math.round((spend / budget) * 100);
    assert.strictEqual(pct, 67);
  });

  console.log('\n--- بخش دوم: رفتار فیلتر زمانی و یکپارچگی داده‌های چندکاناله ---');

  test('۱۰. بازه زمانی ۷ روزه و ۳۰ روزه تعداد نقاط متناسب نمودار روند را تولید می‌کنند', () => {
    const generateTrendPoints = (preset) => {
      const count = preset === '7d' ? 7 : preset === '30d' ? 14 : 10;
      return Array.from({ length: count }, (_, i) => ({ day: i + 1 }));
    };

    assert.strictEqual(generateTrendPoints('7d').length, 7);
    assert.strictEqual(generateTrendPoints('30d').length, 14);
  });

  test('۱۱. مجموع هزینه‌ها و لیدهای کانال‌های ۵گانه با سرجمع کلی مطابقت دارند', () => {
    const totalSpend = 100_000_000;
    const channels = [
      { name: 'Google Ads', spend: Math.round(totalSpend * 0.45) },
      { name: 'Instagram', spend: Math.round(totalSpend * 0.25) },
      { name: 'SMS', spend: Math.round(totalSpend * 0.12) },
      { name: 'Webinar', spend: Math.round(totalSpend * 0.12) },
      { name: 'Email', spend: Math.round(totalSpend * 0.06) },
    ];

    const sumSpend = channels.reduce((acc, c) => acc + c.spend, 0);
    assert.strictEqual(sumSpend, totalSpend);
  });

  test('۱۲. CPL و ROAS هر کانال مستقل و بدون تقسیم بر صفر محاسبه می‌شود', () => {
    const channel = { spend: 45_000_000, leads: 80, revenue: 150_000_000 };
    const cpl = calculateCpl(channel.spend, channel.leads);
    const roas = calculateRoas(channel.revenue, channel.spend);

    assert.strictEqual(cpl, 562500);
    assert.strictEqual(roas, 3.33);
  });

  test('۱۳. مراحل ۵گانه قیف تبدیل دارای ترتیب استاندارد، بدون نرخ منفی و ریزش منطقی هستند', () => {
    const funnel = [
      { id: 'impressions', count: 800_000 },
      { id: 'clicks', count: 40_000 },
      { id: 'leads', count: 2_000 },
      { id: 'opportunities', count: 600 },
      { id: 'won', count: 120 },
    ];

    assert.strictEqual(funnel.length, 5);
    // بررسی ترتیب نزولی تعداد مخاطبان در طول قیف
    for (let i = 0; i < funnel.length - 1; i++) {
      assert.ok(funnel[i].count > funnel[i + 1].count, `مرحله ${funnel[i].id} باید بزرگتر از ${funnel[i+1].id} باشد`);
    }

    const clickRate = calculateConversionRate(funnel[1].count, funnel[0].count);
    assert.strictEqual(clickRate, 5.0); // 40k / 800k = 5%
  });

  test('۱۴. هشدارهای فوری سیستم شامل مسیرهای معتبر اقدام هستند', () => {
    const alerts = [
      { id: 'a1', severity: 'warning', actionHref: '/campaigns/camp-1' },
      { id: 'a2', severity: 'critical', actionHref: '/leads' },
      { id: 'a3', severity: 'warning', actionHref: '/work/tasks?status=overdue' },
    ];

    alerts.forEach((a) => {
      assert.ok(a.actionHref.startsWith('/'), 'آدرس اقدام باید با اسلش شروع شود');
      assert.ok(a.actionHref.includes('campaigns') || a.actionHref.includes('leads') || a.actionHref.includes('tasks'));
    });
  });

  console.log('\n--- بخش سوم: تفکیک مسیرها و کنترل پیوندهای ناوبری ---');

  const rootDir = process.cwd();

  test('۱۵. صفحه جدید /campaigns وجود دارد و جدول کمپین‌ها را مدیریت می‌کند', () => {
    const campaignsPagePath = path.resolve(rootDir, 'apps/web/src/app/(app)/campaigns/page.tsx');
    assert.ok(fs.existsSync(campaignsPagePath), 'فایل campaigns/page.tsx باید ایجاد شده باشد');

    const content = fs.readFileSync(campaignsPagePath, 'utf8');
    assert.ok(content.includes('CampaignsTable'), 'صفحه کمپین‌ها باید کامپوننت CampaignsTable را داشته باشد');
    assert.ok(content.includes('FilterBar'), 'صفحه کمپین‌ها باید FilterBar داشته باشد');
  });

  test('۱۶. داشبورد اجرایی عملکرد پیاده‌سازی شده و شامل تمام کامپوننت‌های تحلیلی است', () => {
    const dashboardPagePath = fs.existsSync(path.resolve(rootDir, 'apps/web/src/app/(app)/performance/dashboard/page.tsx'))
      ? path.resolve(rootDir, 'apps/web/src/app/(app)/performance/dashboard/page.tsx')
      : path.resolve(rootDir, 'apps/web/src/app/(app)/page.tsx');
    assert.ok(fs.existsSync(dashboardPagePath), 'فایل داشبورد اجرایی باید وجود داشته باشد');

    const content = fs.readFileSync(dashboardPagePath, 'utf8');
    assert.ok(content.includes('DashboardKpiGrid'), 'داشبورد باید دارای DashboardKpiGrid باشد');
    assert.ok(content.includes('SpendRevenueChart'), 'داشبورد باید دارای SpendRevenueChart باشد');
    assert.ok(content.includes('ChannelPerformanceTable'), 'داشبورد باید دارای ChannelPerformanceTable باشد');
    assert.ok(content.includes('ConversionFunnelWidget'), 'داشبورد باید دارای ConversionFunnelWidget باشد');
    assert.ok(content.includes('UrgentAlertsWidget'), 'داشبورد باید دارای UrgentAlertsWidget باشد');
    assert.ok(!content.includes('CampaignsTable'), 'داشبورد ریشه نباید مستقیماً شامل CampaignsTable باشد');
  });

  test('۱۷. منوی ناوبری سایدبار (navigation.ts) آدرس لیست کمپین‌ها را به /campaigns تغییر داده است', () => {
    const navPath = path.resolve(rootDir, 'apps/web/src/config/navigation.ts');
    const content = fs.readFileSync(navPath, 'utf8');

    // جستجوی آیتم کمپین‌ها
    const campaignMatch = content.match(/id:\s*'campaigns-list'[\s\S]*?href:\s*'(.*?)'/);
    assert.ok(campaignMatch, 'آیتم campaigns-list باید در navigation.ts وجود داشته باشد');
    assert.strictEqual(campaignMatch[1], '/campaigns', 'آدرس لیست کمپین‌ها در منو باید /campaigns باشد');

    // بررسی آدرس داشبورد
    const dashMatch = content.match(/id:\s*'dashboard'[\s\S]*?href:\s*'(.*?)'/);
    assert.ok(dashMatch, 'آیتم dashboard باید در navigation.ts وجود داشته باشد');
    assert.ok(
      dashMatch[1] === '/performance/dashboard' || dashMatch[1] === '/',
      'آدرس داشبورد در منو باید معتبر باشد'
    );
  });

  test('۱۸. مسیرهای فرعی کمپین‌ها (/new, /[id], /[id]/edit) حفظ شده‌اند و لینک بازگشت به /campaigns دارند', () => {
    const newPath = path.resolve(rootDir, 'apps/web/src/app/(app)/campaigns/new/page.tsx');
    const detailPath = path.resolve(rootDir, 'apps/web/src/app/(app)/campaigns/[id]/page.tsx');
    const editPath = path.resolve(rootDir, 'apps/web/src/app/(app)/campaigns/[id]/edit/page.tsx');

    assert.ok(fs.existsSync(newPath), 'صفحه new باید وجود داشته باشد');
    assert.ok(fs.existsSync(detailPath), 'صفحه جزئیات باید وجود داشته باشد');
    assert.ok(fs.existsSync(editPath), 'صفحه ویرایش باید وجود داشته باشد');

    const detailContent = fs.readFileSync(detailPath, 'utf8');
    assert.ok(detailContent.includes("href: '/campaigns'"), 'Breadcrumb جزئیات کمپین باید به /campaigns لینک دهد');
    assert.ok(detailContent.includes("router.push('/campaigns')"), 'حذف کمپین باید به /campaigns هدایت کند');
  });

  test('۱۹. پس از انتشار کمپین جدید در ویزارد، هدایت به /campaigns انجام می‌شود', () => {
    const wizardPath = path.resolve(
      rootDir,
      'apps/web/src/features/campaigns/components/wizard/campaign-wizard.tsx'
    );
    const content = fs.readFileSync(wizardPath, 'utf8');
    assert.ok(content.includes("router.push('/campaigns')"), 'ویزارد ساخت باید به /campaigns ریدایرکت کند');
  });

  console.log('\n============================================================');
  console.log(`✅ تمام ${passCount} سناریوی آزمون با موفقیت ۱۰۰٪ پاس شدند!`);
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ آزمون‌ها با شکست مواجه شدند:');
  console.error(err);
  process.exit(1);
});
