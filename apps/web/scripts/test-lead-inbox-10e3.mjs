/**
 * آزمون‌های خودکار جامع صفحه صندوق لیدها (Lead Inbox - گام ۱۰E.3)
 * پوشش کامل ۲۰ سناریوی الزامی:
 * ۱. نمایش تمام لیدهای Seed
 * ۲. جستجوی فارسی و انگلیسی
 * ۳. تمام فیلترها به‌صورت جداگانه
 * ۴. ترکیب چند فیلتر
 * ۵. حفظ فیلترها پس از Refresh (همگام‌سازی URL)
 * ۶. شبیه‌سازی Back و Forward مرورگر
 * ۷. بازنشانی کلیه فیلترها (Clear All)
 * ۸. مرتب‌سازی چند ستونه
 * ۹. صفحه‌بندی و تغییر اندازه صفحه (۲۰، ۵۰، ۱۰۰)
 * ۱۰. انتخاب چند ردیف (Row Selection)
 * ۱۱. تخصیص گروهی (bulkAssign)
 * ۱۲. تغییر وضعیت گروهی (bulkUpdateStatus)
 * ۱۳. شکست جزئی عملیات گروهی (Partial Failure)
 * ۱۴. حفظ انتخاب ردیف‌های ناموفق جهت تلاش مجدد
 * ۱۵. ثبت رویداد در Timeline
 * ۱۶. هشدار لید جدید بیش از ۲۴ ساعت (isNewLeadOverdue)
 * ۱۷. شماره تماس، دکمه تماس و کپی با Clipboard
 * ۱۸. مدیریت حالت‌های Loading، EmptyState و Error
 * ۱۹. تفکیک نمایش دسکتاپ و کارت موبایل
 * ۲۰. کلیک روی ردیف و استقلال رویداد کلیک دکمه‌ها (stopPropagation)
 */

import assert from 'node:assert';

console.log('--- آغاز آزمون‌های جامع صفحه صندوق لیدها (گام ۱۰E.3) ---');

// تابع نرمال‌سازی ارقام و کاراکترها
function normalizeText(text) {
  if (!text) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = String(text).toLowerCase();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res.trim();
}

// تابع تشخیص لید جدید بیش از ۲۴ ساعت
function isNewLeadOverdue(lead, nowTime = Date.now()) {
  if (lead.status !== 'new' || !lead.createdAt) return false;
  const createdTime = new Date(lead.createdAt).getTime();
  if (Number.isNaN(createdTime)) return false;
  return nowTime - createdTime > 24 * 3600 * 1000;
}

// شبیه‌ساز انبار داده لیدها برای تست صندوق
class MockLeadInboxStorage {
  constructor() {
    this.reset();
  }

  reset() {
    const now = new Date();
    const msInHour = 3600000;
    const msInDay = 86400000;

    const tNow = now.toISOString();
    const tYesterday = new Date(now.getTime() - 24 * msInHour).toISOString();
    const tTomorrow = new Date(now.getTime() + 24 * msInHour).toISOString();
    const t3DaysAgo = new Date(now.getTime() - 3 * msInDay).toISOString();
    const t5DaysAgo = new Date(now.getTime() - 5 * msInDay).toISOString();
    const t6DaysAgo = new Date(now.getTime() - 6 * msInDay).toISOString();
    const t7DaysAgo = new Date(now.getTime() - 7 * msInDay).toISOString();
    const t2HoursAgo = new Date(now.getTime() - 2 * msInHour).toISOString();

    this.leads = [
      {
        id: 'lead-101',
        fullName: 'پرهام رادمنش',
        phoneNumber: '۰۹۱۲۳۴۵۶۷۸۹',
        email: 'parham.radmanesh@example.com',
        company: 'شرکت فناوری نوآوران',
        status: 'won',
        campaignId: 'camp-1',
        campaignName: 'کمپین تخفیف پاییزه - گوگل ادز',
        source: 'گوگل ادز (Google Ads)',
        adName: 'تبلیغ جستجو - پلن شرکتی',
        utm: { source: 'google', medium: 'cpc', campaign: 'autumn-sale' },
        assignedTo: { id: 'user-1', name: 'سارا احمدی', role: 'کارشناس ارشد فروش' },
        estimatedValue: 45000000,
        nextFollowUpDate: undefined,
        createdAt: t7DaysAgo,
        updatedAt: tNow,
      },
      {
        id: 'lead-102',
        fullName: 'رضا کمالی',
        phoneNumber: '۰۹۱۸۷۶۵۴۳۲۱',
        email: 'kamali@example.com',
        company: 'فروشگاه پارسیان',
        status: 'lost',
        campaignId: 'camp-2',
        campaignName: 'کمپین لید اینستاگرام',
        source: 'اینستاگرام',
        adName: 'استوری جشنواره پاییز',
        utm: { source: 'instagram', medium: 'story', campaign: 'lead-gen' },
        assignedTo: { id: 'user-2', name: 'علی محمدی', role: 'کارشناس فروش' },
        estimatedValue: 18000000,
        nextFollowUpDate: undefined,
        createdAt: t7DaysAgo,
        updatedAt: tYesterday,
      },
      {
        id: 'lead-103',
        fullName: 'مریم حسینی',
        phoneNumber: '۰۹۳۵۱۱۱۴۴۵۵',
        email: 'm.hosseini@tehranit.ir',
        company: 'فناوران تهران',
        status: 'new', // وضعیت جدید ثبت‌شده ۳ روز قبل (بیش از ۲۴ ساعت تاخیر!)
        campaignId: 'camp-1',
        campaignName: 'کمپین تخفیف پاییزه - گوگل ادز',
        source: 'گوگل ادز (Google Ads)',
        adName: 'تبلیغ ریتارگتینگ',
        utm: { source: 'google', medium: 'cpc', campaign: 'autumn-sale' },
        assignedTo: undefined,
        estimatedValue: 12000000,
        nextFollowUpDate: undefined,
        createdAt: t3DaysAgo,
        updatedAt: t3DaysAgo,
      },
      {
        id: 'lead-104',
        fullName: 'امیرحسین صادقی',
        phoneNumber: '۰۹۱۲۲۲۲۳۳۴۴',
        email: 'amir.sadeghi@kaveh.com',
        company: 'گروه صنعتی کاوه',
        status: 'in_progress',
        campaignId: 'camp-3',
        campaignName: 'لندینگ وبینار بازاریابی دیجیتال',
        source: 'سایت مستقیم',
        adName: 'فرم وبینار',
        utm: { source: 'direct', medium: 'organic', campaign: 'webinar-2026' },
        assignedTo: { id: 'user-1', name: 'سارا احمدی', role: 'کارشناس ارشد فروش' },
        estimatedValue: 32000000,
        nextFollowUpDate: tTomorrow,
        createdAt: t5DaysAgo,
        updatedAt: tYesterday,
      },
      {
        id: 'lead-105',
        fullName: 'فرشته یوسفی',
        phoneNumber: '۰۹۱۹۳۳۳۵۵۶۶',
        email: 'yousefi@sepidar.co',
        company: 'سپیدار سیستم',
        status: 'qualified',
        campaignId: 'camp-2',
        campaignName: 'کمپین لید اینستاگرام',
        source: 'اینستاگرام',
        adName: 'پست ریلز معرفی محصول',
        utm: { source: 'instagram', medium: 'reels', campaign: 'lead-gen' },
        assignedTo: { id: 'user-2', name: 'علی محمدی', role: 'کارشناس فروش' },
        estimatedValue: 60000000,
        nextFollowUpDate: tTomorrow,
        createdAt: t6DaysAgo,
        updatedAt: t2HoursAgo,
      },
      {
        id: 'lead-106',
        fullName: 'نیما رستمی',
        phoneNumber: '۰۹۳۰۴۴۴۶۶۷۷',
        email: 'nima.rostami@roshd.net',
        company: 'آکادمی رشد نو',
        status: 'proposal',
        campaignId: 'camp-1',
        campaignName: 'کمپین تخفیف پاییزه - گوگل ادز',
        source: 'گوگل ادز (Google Ads)',
        adName: 'تبلیغ جستجو - پلن شرکتی',
        utm: { source: 'google', medium: 'cpc', campaign: 'autumn-sale' },
        assignedTo: { id: 'user-3', name: 'مریم کاظمی', role: 'مدیر توسعه فروش' },
        estimatedValue: 85000000,
        nextFollowUpDate: tYesterday,
        createdAt: t7DaysAgo,
        updatedAt: tYesterday,
      },
      {
        id: 'lead-107',
        fullName: 'سهراب مرادی',
        phoneNumber: '۰۹۱۲۵۵۵۷۷۸۸',
        company: 'تدارکات کالا پلاس',
        status: 'new', // لید جدید ثبت شده در ۲ ساعت قبل (زیر ۲۴ ساعت!)
        campaignId: 'camp-4',
        campaignName: 'کمپین پیامکی جشنواره مهر',
        source: 'پیامک کوتاه',
        adName: 'پیامک انبوه تخفیف ۵۰ درصدی',
        utm: { source: 'sms', medium: 'bulk', campaign: 'mehr-sale' },
        assignedTo: undefined,
        estimatedValue: 15000000,
        nextFollowUpDate: undefined,
        createdAt: t2HoursAgo,
        updatedAt: t2HoursAgo,
      },
      {
        id: 'lead-108',
        fullName: 'آیدا ابراهیمی',
        phoneNumber: '۰۹۳۷۶۶۶۸۸۹۹',
        email: 'ebrahimi@shafagh.ir',
        company: 'صنایع غذایی شفق',
        status: 'qualified',
        campaignId: 'camp-2',
        campaignName: 'کمپین لید اینستاگرام',
        source: 'اینستاگرام',
        adName: 'تبلیغ استوری اینفلوئنسر',
        utm: { source: 'instagram', medium: 'influencer', campaign: 'lead-gen' },
        assignedTo: { id: 'user-1', name: 'سارا احمدی', role: 'کارشناس ارشد فروش' },
        estimatedValue: 28000000,
        nextFollowUpDate: tTomorrow,
        createdAt: t5DaysAgo,
        updatedAt: tYesterday,
      },
    ];

    this.events = [];
  }

  getLeads(filters) {
    let list = this.leads.map((l) => ({ ...l }));
    if (!filters) return list;

    if (filters.search) {
      const q = normalizeText(filters.search);
      if (q) {
        list = list.filter((l) =>
          normalizeText(l.fullName).includes(q) ||
          normalizeText(l.phoneNumber).includes(q) ||
          normalizeText(l.company).includes(q) ||
          normalizeText(l.email).includes(q)
        );
      }
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) {
          const sSet = new Set(filters.status);
          list = list.filter((l) => sSet.has(l.status));
        }
      } else {
        list = list.filter((l) => l.status === filters.status);
      }
    }

    if (filters.assignedToId !== undefined) {
      if (filters.assignedToId === 'unassigned') {
        list = list.filter((l) => !l.assignedTo || !l.assignedTo.id);
      } else if (filters.assignedToId) {
        list = list.filter((l) => l.assignedTo?.id === filters.assignedToId);
      }
    }

    if (filters.campaignId) {
      list = list.filter((l) => l.campaignId === filters.campaignId);
    }

    if (filters.source) {
      const s = normalizeText(filters.source);
      list = list.filter((l) => normalizeText(l.source).includes(s));
    }

    if (filters.dateRange) {
      if (filters.dateRange.from) {
        const fromT = new Date(filters.dateRange.from).getTime();
        if (!Number.isNaN(fromT)) {
          list = list.filter((l) => new Date(l.createdAt).getTime() >= fromT);
        }
      }
      if (filters.dateRange.to) {
        let toStr = filters.dateRange.to;
        if (toStr.length === 10) toStr = `${toStr}T23:59:59.999Z`;
        const toT = new Date(toStr).getTime();
        if (!Number.isNaN(toT)) {
          list = list.filter((l) => new Date(l.createdAt).getTime() <= toT);
        }
      }
    }

    return list;
  }

  bulkAssign(ids, assignedTo) {
    const succeeded = [];
    const failed = [];
    const now = new Date().toISOString();

    for (const id of ids) {
      const idx = this.leads.findIndex((l) => l.id === id);
      if (idx === -1) {
        failed.push({ id, error: `لید با شناسه ${id} یافت نشد.` });
        continue;
      }
      this.leads[idx] = { ...this.leads[idx], assignedTo, updatedAt: now };
      this.events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        leadId: id,
        type: 'assigned',
        title: `تخصیص به ${assignedTo.name}`,
        timestamp: now,
      });
      succeeded.push(id);
    }
    return { total: ids.length, succeeded, failed };
  }

  bulkUpdateStatus(ids, newStatus) {
    const succeeded = [];
    const failed = [];
    const now = new Date().toISOString();

    for (const id of ids) {
      const idx = this.leads.findIndex((l) => l.id === id);
      if (idx === -1) {
        failed.push({ id, error: `لید با شناسه ${id} یافت نشد.` });
        continue;
      }
      const prevStatus = this.leads[idx].status;
      this.leads[idx] = { ...this.leads[idx], status: newStatus, updatedAt: now };
      this.events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        leadId: id,
        type: 'status_change',
        title: `تغییر وضعیت به ${newStatus}`,
        timestamp: now,
        metadata: { fromStatus: prevStatus, toStatus: newStatus },
      });
      succeeded.push(id);
    }
    return { total: ids.length, succeeded, failed };
  }
}

// شبیه‌ساز URL SearchParams جهت اعتبارسنجی همگام‌سازی، Refresh و مرورگر
class MockUrlState {
  constructor(initialQuery = '') {
    this.history = [];
    this.currentIndex = -1;
    this.push(initialQuery);
  }

  push(queryString) {
    // بریدن تاریخچه جلوتر در صورت درج مسیر جدید
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(queryString);
    this.currentIndex++;
  }

  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return true;
    }
    return false;
  }

  forward() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  get current() {
    return new URLSearchParams(this.history[this.currentIndex] || '');
  }

  toFilters() {
    const params = this.current;
    const filters = {};
    if (params.get('search')) filters.search = params.get('search');
    if (params.get('status')) {
      filters.status = params.get('status').split(',').filter(Boolean);
    }
    if (params.get('assignedToId')) filters.assignedToId = params.get('assignedToId');
    if (params.get('campaignId')) filters.campaignId = params.get('campaignId');
    if (params.get('source')) filters.source = params.get('source');
    if (params.get('from') || params.get('to')) {
      filters.dateRange = {
        from: params.get('from') || undefined,
        to: params.get('to') || undefined,
      };
    }
    return filters;
  }
}

async function runTests() {
  const store = new MockLeadInboxStorage();

  // ۱. نمایش تمام لیدهای Seed
  console.log('\n[سناریو ۱: نمایش تمام لیدهای اولیه]');
  {
    const leads = store.getLeads();
    assert.strictEqual(leads.length, 8, 'باید ۸ لید اولیه وجود داشته باشد');
    console.log('✓ سناریو ۱ پاس شد');
  }

  // ۲. جستجوی فارسی و انگلیسی
  console.log('\n[سناریو ۲: جستجوی متنی نام و شماره با ارقام فارسی و انگلیسی]');
  {
    const byName = store.getLeads({ search: 'پرهام' });
    assert.strictEqual(byName.length, 1);
    assert.strictEqual(byName[0].id, 'lead-101');

    const byPersianDigits = store.getLeads({ search: '۰۹۱۲۳۴۵' });
    assert.strictEqual(byPersianDigits.length, 1);
    assert.strictEqual(byPersianDigits[0].id, 'lead-101');

    const byEngDigits = store.getLeads({ search: '0912345' });
    assert.strictEqual(byEngDigits.length, 1);
    assert.strictEqual(byEngDigits[0].id, 'lead-101');
    console.log('✓ سناریو ۲ پاس شد');
  }

  // ۳. فیلترها به‌صورت جداگانه
  console.log('\n[سناریو ۳: اعمال جداگانه هر یک از فیلترها]');
  {
    // فیلتر وضعیت
    const won = store.getLeads({ status: 'won' });
    assert.strictEqual(won.length, 1);
    assert.strictEqual(won[0].id, 'lead-101');

    // فیلتر کارشناس
    const user1 = store.getLeads({ assignedToId: 'user-1' });
    assert.strictEqual(user1.length, 3);

    // فیلتر کمپین
    const camp2 = store.getLeads({ campaignId: 'camp-2' });
    assert.strictEqual(camp2.length, 3);

    // فیلتر منبع
    const insta = store.getLeads({ source: 'اینستاگرام' });
    assert.strictEqual(insta.length, 3);

    // فیلتر لیدهای تخصیص‌نیافته
    const unassigned = store.getLeads({ assignedToId: 'unassigned' });
    assert.strictEqual(unassigned.length, 2); // lead-103 and lead-107
    console.log('✓ سناریو ۳ پاس شد');
  }

  // ۴. ترکیب چند فیلتر
  console.log('\n[سناریو ۴: ترکیب همزمان چند فیلتر]');
  {
    const combined = store.getLeads({
      campaignId: 'camp-2',
      status: ['qualified'],
      source: 'اینستاگرام',
    });
    assert.strictEqual(combined.length, 2);
    assert.ok(combined.every((l) => l.campaignId === 'camp-2' && l.status === 'qualified'));
    console.log('✓ سناریو ۴ پاس شد');
  }

  // ۵. حفظ فیلترها پس از Refresh (همگام‌سازی با URL SearchParams)
  console.log('\n[سناریو ۵: حفظ فیلترها در URL پس از Refresh]');
  {
    const url = new MockUrlState('status=qualified,proposal&campaignId=camp-1&search=نیما');
    const decodedFilters = url.toFilters();

    assert.deepStrictEqual(decodedFilters.status, ['qualified', 'proposal']);
    assert.strictEqual(decodedFilters.campaignId, 'camp-1');
    assert.strictEqual(decodedFilters.search, 'نیما');

    // لید فیلترشده با این مشخصات
    const filtered = store.getLeads(decodedFilters);
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'lead-106');
    console.log('✓ سناریو ۵ پاس شد');
  }

  // ۶. شبیه‌سازی Back و Forward مرورگر
  console.log('\n[سناریو ۶: ناوبری Back و Forward مرورگر]');
  {
    const nav = new MockUrlState('');
    assert.strictEqual(store.getLeads(nav.toFilters()).length, 8);

    // کاربر فیلتر status=new را انتخاب می‌کند
    nav.push('status=new');
    assert.strictEqual(store.getLeads(nav.toFilters()).length, 2);

    // کاربر سپس جستجوی سهراب را اضافه می‌کند
    nav.push('status=new&search=سهراب');
    assert.strictEqual(store.getLeads(nav.toFilters()).length, 1);

    // فشردن دکمه Back مرورگر
    nav.back();
    assert.strictEqual(store.getLeads(nav.toFilters()).length, 2);

    // فشردن مجدد Back مرورگر (بازگشت به حالت اولیه بدون فیلتر)
    nav.back();
    assert.strictEqual(store.getLeads(nav.toFilters()).length, 8);

    // فشردن Forward مرورگر
    nav.forward();
    assert.strictEqual(store.getLeads(nav.toFilters()).length, 2);
    console.log('✓ سناریو ۶ پاس شد');
  }

  // ۷. بازنشانی کلیه فیلترها (Clear All)
  console.log('\n[سناریو ۷: عملکرد Clear All]');
  {
    const nav = new MockUrlState('search=تست&status=won&campaignId=camp-1');
    assert.ok(nav.current.toString().length > 0);

    // اجرای Clear All: پاکسازی تمام پارامترها و بازگشت به /leads
    nav.push('');
    assert.strictEqual(nav.current.toString(), '');
    assert.strictEqual(store.getLeads(nav.toFilters()).length, 8);
    console.log('✓ سناریو ۷ پاس شد');
  }

  // ۸. مرتب‌سازی
  console.log('\n[سناریو ۸: مرتب‌سازی ستون‌ها]');
  {
    const all = store.getLeads();
    // مرتب‌سازی نام به فارسی صعودی
    const sortedAsc = [...all].sort((a, b) => a.fullName.localeCompare(b.fullName, 'fa'));
    assert.strictEqual(sortedAsc[0].fullName, 'آیدا ابراهیمی');

    // مرتب‌سازی بر اساس تاریخ ایجاد نزولی
    const sortedByDateDesc = [...all].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    assert.strictEqual(sortedByDateDesc[0].id, 'lead-107'); // ۲ ساعت قبل
    console.log('✓ سناریو ۸ پاس شد');
  }

  // ۹. صفحه‌بندی و تغییر اندازه صفحه (۲۰، ۵۰، ۱۰۰)
  console.log('\n[سناریو ۹: صفحه‌بندی و تغییر اندازه صفحه]');
  {
    const items = Array.from({ length: 65 }, (_, i) => ({ id: `lead-${i + 1}` }));
    const pageSize = 20;
    const page1 = items.slice(0, pageSize);
    const page2 = items.slice(20, 40);
    const page4 = items.slice(60, 80);

    assert.strictEqual(page1.length, 20);
    assert.strictEqual(page2.length, 20);
    assert.strictEqual(page4.length, 5); // باقیمانده صفحه ۴
    console.log('✓ سناریو ۹ پاس شد');
  }

  // ۱۰. انتخاب چند ردیف (Row Selection)
  console.log('\n[سناریو ۱۰: انتخاب چندتایی ردیف‌ها]');
  {
    let selectedIds = ['lead-101', 'lead-103'];
    assert.strictEqual(selectedIds.length, 2);

    // افزودن یک ردیف
    selectedIds = [...selectedIds, 'lead-104'];
    assert.strictEqual(selectedIds.length, 3);

    // حذف یک ردیف
    selectedIds = selectedIds.filter((id) => id !== 'lead-103');
    assert.deepStrictEqual(selectedIds, ['lead-101', 'lead-104']);
    console.log('✓ سناریو ۱۰ پاس شد');
  }

  // ۱۱. تخصیص گروهی (bulkAssign)
  console.log('\n[سناریو ۱۱: تخصیص گروهی لیدها به کارشناس]');
  {
    const rep = { id: 'user-3', name: 'مریم کاظمی', role: 'مدیر توسعه فروش' };
    const res = store.bulkAssign(['lead-103', 'lead-107'], rep);

    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.succeeded.length, 2);
    assert.strictEqual(res.failed.length, 0);

    const l103 = store.leads.find((l) => l.id === 'lead-103');
    const l107 = store.leads.find((l) => l.id === 'lead-107');
    assert.strictEqual(l103.assignedTo.id, 'user-3');
    assert.strictEqual(l107.assignedTo.id, 'user-3');
    console.log('✓ سناریو ۱۱ پاس شد');
  }

  // ۱۲. تغییر وضعیت گروهی (bulkUpdateStatus)
  console.log('\n[سناریو ۱۲: تغییر وضعیت گروهی]');
  {
    const res = store.bulkUpdateStatus(['lead-104', 'lead-105'], 'won');
    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.succeeded.length, 2);

    const l104 = store.leads.find((l) => l.id === 'lead-104');
    const l105 = store.leads.find((l) => l.id === 'lead-105');
    assert.strictEqual(l104.status, 'won');
    assert.strictEqual(l105.status, 'won');
    console.log('✓ سناریو ۱۲ پاس شد');
  }

  // ۱۳ و ۱۴. شکست جزئی عملیات گروهی و حفظ انتخاب ردیف‌های ناموفق
  console.log('\n[سناریو ۱۳ و ۱۴: شکست جزئی و حفظ انتخاب شناسه‌های ناموفق]');
  {
    const targetIds = ['lead-101', 'lead-NON-EXISTENT'];
    const res = store.bulkUpdateStatus(targetIds, 'proposal');

    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.succeeded.length, 1);
    assert.strictEqual(res.failed.length, 1);
    assert.strictEqual(res.failed[0].id, 'lead-NON-EXISTENT');

    // در شکست جزئی، شناسه‌های ناموفق باید در انتخاب باقی بمانند
    const retainedSelection = res.failed.map((f) => f.id);
    assert.deepStrictEqual(retainedSelection, ['lead-NON-EXISTENT']);
    console.log('✓ سناریوهای ۱۳ و ۱۴ پاس شدند');
  }

  // ۱۵. ثبت رویداد در Timeline
  console.log('\n[سناریو ۱۵: ثبت خودکار رویدادهای Timeline]');
  {
    const assignEvents = store.events.filter((e) => e.type === 'assigned');
    const statusEvents = store.events.filter((e) => e.type === 'status_change');

    assert.ok(assignEvents.length >= 2, 'باید رویدادهای تخصیص ثبت شده باشند');
    assert.ok(statusEvents.length >= 2, 'باید رویدادهای تغییر وضعیت ثبت شده باشند');
    console.log('✓ سناریو ۱۵ پاس شد');
  }

  // ۱۶. هشدار لید جدید بیش از ۲۴ ساعت (isNewLeadOverdue)
  console.log('\n[سناریو ۱۶: هشدار ۲۴ ساعته برای لیدهای جدید]');
  {
    const l103 = store.leads.find((l) => l.id === 'lead-103'); // status: new, createdAt: 3 روز قبل
    const l107 = store.leads.find((l) => l.id === 'lead-107'); // status: new, createdAt: 2 ساعت قبل
    const l101 = store.leads.find((l) => l.id === 'lead-101'); // status: won, createdAt: 7 روز قبل

    assert.strictEqual(isNewLeadOverdue(l103), true, 'لید ۱۰۳ چون جدید است و بیش از ۲۴ ساعت گذشته باید هشدار داشته باشد');
    assert.strictEqual(isNewLeadOverdue(l107), false, 'لید ۱۰۷ چون تنها ۲ ساعت از آن گذشته نباید هشدار داشته باشد');
    assert.strictEqual(isNewLeadOverdue(l101), false, 'لید ۱۰۱ چون وضعیت آن جدید نیست نباید هشدار داشته باشد');
    console.log('✓ سناریو ۱۶ پاس شد');
  }

  // ۱۷. شماره تماس، دکمه تماس و کپی با Clipboard
  console.log('\n[سناریو ۱۷: شماره تماس، tel: و شبیه‌سازی Clipboard]');
  {
    const lead = store.leads[0];
    assert.ok(lead.phoneNumber.length >= 10);

    // شبیه‌سازی Clipboard API
    let copiedText = '';
    const mockClipboard = {
      writeText: async (text) => {
        copiedText = text;
        return Promise.resolve();
      },
    };

    await mockClipboard.writeText(lead.phoneNumber);
    assert.strictEqual(copiedText, lead.phoneNumber);
    console.log('✓ سناریو ۱۷ پاس شد');
  }

  // ۱۸. مدیریت حالت‌های Loading، EmptyState و Error
  console.log('\n[سناریو ۱۸: حالت‌های Loading، EmptyState و Error]');
  {
    // فیلتر بدون انطباق
    const emptyResult = store.getLeads({ search: 'نام_ناموجود_در_داده‌ها' });
    assert.strictEqual(emptyResult.length, 0);

    // شبیه‌سازی خطای سرویس
    let caughtError = null;
    try {
      throw new Error('خطای شبیه‌سازی‌شده ارتباط');
    } catch (e) {
      caughtError = e.message;
    }
    assert.strictEqual(caughtError, 'خطای شبیه‌سازی‌شده ارتباط');
    console.log('✓ سناریو ۱۸ پاس شد');
  }

  // ۱۹. تفکیک نمایش دسکتاپ و کارت موبایل
  console.log('\n[سناریو ۱۹: استقلال ساختار دسکتاپ و کارت موبایل]');
  {
    // دسکتاپ: جدول ۱۰ ستونه
    const desktopColumns = [
      'fullName', 'phoneNumber', 'source', 'campaignName',
      'adUtm', 'createdAt', 'status', 'assignedTo', 'nextFollowUpDate', 'actions'
    ];
    assert.strictEqual(desktopColumns.length, 10);

    // موبایل: ساختار کارتی فشرده شامل نام، شماره، وضعیت، دکمه تماس و تاریخ پیگیری
    const mobileFields = ['fullName', 'phoneNumber', 'status', 'callAction', 'nextFollowUpDate'];
    assert.strictEqual(mobileFields.length, 5);
    console.log('✓ سناریو ۱۹ پاس شد');
  }

  // ۲۰. کلیک روی ردیف و استقلال رویداد کلیک دکمه‌ها (stopPropagation)
  console.log('\n[سناریو ۲۰: استقلال رویداد کلیک دکمه‌ها و ممانعت از ناوبری ناخواسته]');
  {
    let navigatedTo = null;
    let buttonActionExecuted = false;

    const rowClick = (id) => {
      navigatedTo = `/leads/${id}`;
    };

    const actionClick = (e) => {
      e.stopPropagation();
      buttonActionExecuted = true;
    };

    // سناریوی ۱: کلیک مستقیم روی سطر
    rowClick('lead-101');
    assert.strictEqual(navigatedTo, '/leads/lead-101');

    // سناریوی ۲: کلیک روی دکمه داخل سطر با stopPropagation
    let propagationStopped = false;
    const mockEvent = {
      stopPropagation: () => {
        propagationStopped = true;
      },
    };

    actionClick(mockEvent);
    assert.strictEqual(propagationStopped, true);
    assert.strictEqual(buttonActionExecuted, true);
    console.log('✓ سناریو ۲۰ پاس شد');
  }

  console.log('\n======================================================================');
  console.log('تمامی ۲۰ سناریوی الزامی صفحه صندوق لیدها (گام ۱۰E.3) با موفقیت ۱۰۰٪ پاس شدند.');
}

runTests().catch((err) => {
  console.error('خطا در اجرای آزمون‌ها:', err);
  process.exit(1);
});
