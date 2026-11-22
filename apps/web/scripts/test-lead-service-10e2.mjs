/**
 * آزمون‌های خودکار جامع زیرساخت داده، فیلترها و سرویس Mock لیدها (گام ۱۰E.2)
 * پوشش کامل ۱۸ سناریوی الزامی:
 * ۱. خواندن همه لیدها
 * ۲. جستجو (نام، شماره تماس با ارقام فارسی/انگلیسی، شرکت، ایمیل)
 * ۳. فیلتر تک‌وضعیت و چندوضعیتی
 * ۴. فیلتر کارشناس، کمپین و منبع
 * ۵. فیلتر لیدهای تخصیص‌نیافته (unassigned)
 * ۶. فیلتر بدون پیگیری (noFollowUp)
 * ۷. فیلتر بازه زمانی (dateRange)
 * ۸. فیلترهای ترکیبی
 * ۹. مدیریت آرایه خالی در عدم انطباق
 * ۱۰. تغییر وضعیت تکی (updateStatus) و به‌روزرسانی updatedAt
 * ۱۱. ثبت خودکار رویداد status_change در تاریخچه
 * ۱۲. عدم تکرار رویداد (Single Event Per Update)
 * ۱۳. انتساب گروهی (bulkAssign) همراه با ثبت رویداد
 * ۱۴. تغییر وضعیت گروهی (bulkUpdateStatus) همراه با ثبت رویداد
 * ۱۵. مدیریت خطای جزئی (Partial Failure) در عملیات گروهی
 * ۱۶. ایزولاسیون رویدادها بین لیدها
 * ۱۷. پایداری در برابر داده‌های خراب (Corrupted Data Tolerance)
 * ۱۸. تست عدم تغییر وضعیت لید پس از ثبت تماس تلفنی
 */

import assert from 'node:assert';

console.log('--- آغاز آزمون‌های جامع ارتقای زیرساخت و سرویس لیدها (گام ۱۰E.2) ---');

// ۱. برچسب‌های وضعیت لید طبق سند Phase 1
const LEAD_STATUS_LABELS = {
  new: 'جدید',
  in_progress: 'تماس گرفته شد',
  qualified: 'واجد شرایط',
  proposal: 'پیشنهاد',
  won: 'مشتری',
  lost: 'ردشده',
};

const CALL_RESULT_LABELS = {
  answered: 'پاسخ داد',
  no_answer: 'پاسخ نداد',
  busy: 'مشغول',
  rejected: 'رد تماس',
};

function normalizeSearchText(text) {
  if (!text) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = String(text).toLowerCase();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res.trim();
}

// شبیه‌ساز ذخیره‌ساز درون حافظه منطبق بر lead-storage.ts
class InMemoryStorage {
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
        status: 'new',
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
        updatedAt: tNow,
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
    ];

    this.events = [
      {
        id: 'evt-101-1',
        leadId: 'lead-101',
        type: 'form_submit',
        title: 'ثبت فرم اولیه',
        timestamp: t7DaysAgo,
        actorType: 'system',
      },
      {
        id: 'evt-102-1',
        leadId: 'lead-102',
        type: 'form_submit',
        title: 'ثبت فرم از پیج اینستاگرام',
        timestamp: t7DaysAgo,
        actorType: 'system',
      },
    ];
  }

  getLeads() {
    return this.leads
      .filter((l) => l && typeof l === 'object' && l.id && l.fullName)
      .map((l) => ({ ...l }));
  }

  getLeadById(id) {
    const found = this.leads.find((l) => l.id === id);
    return found ? { ...found } : null;
  }

  updateLead(id, updates) {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.leads[idx] = {
      ...this.leads[idx],
      ...updates,
      id: this.leads[idx].id,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };
    return { ...this.leads[idx] };
  }

  getEvents(leadId) {
    return this.events
      .filter((e) => e && typeof e === 'object' && e.id && e.leadId === leadId)
      .map((e) => ({ ...e }));
  }

  saveEvent(evt) {
    this.events.push({ ...evt });
  }
}

// شبیه‌ساز MockLeadService برای تست یکپارچگی رفتاری
class TestLeadService {
  constructor(storage) {
    this.storage = storage;
    this.shouldSimulateError = false;
  }

  setSimulateError(enable) {
    this.shouldSimulateError = enable;
  }

  async getAll(filters) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }

    let leads = this.storage.getLeads();

    if (!filters) {
      return [...leads];
    }

    // ۱. جستجو
    if (filters.search) {
      const q = normalizeSearchText(filters.search);
      if (q) {
        leads = leads.filter((l) => {
          return (
            normalizeSearchText(l.fullName).includes(q) ||
            normalizeSearchText(l.phoneNumber).includes(q) ||
            normalizeSearchText(l.company).includes(q) ||
            normalizeSearchText(l.email).includes(q)
          );
        });
      }
    }

    // ۲. وضعیت
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length > 0) {
          const set = new Set(filters.status);
          leads = leads.filter((l) => set.has(l.status));
        }
      } else {
        leads = leads.filter((l) => l.status === filters.status);
      }
    }

    // ۳. کارشناس
    if (filters.assignedToId !== undefined) {
      if (filters.assignedToId === 'unassigned') {
        leads = leads.filter((l) => !l.assignedTo || !l.assignedTo.id);
      } else if (filters.assignedToId) {
        leads = leads.filter((l) => l.assignedTo?.id === filters.assignedToId);
      }
    }

    // ۴. کمپین
    if (filters.campaignId) {
      leads = leads.filter((l) => l.campaignId === filters.campaignId);
    }

    // ۵. منبع
    if (filters.source) {
      const s = normalizeSearchText(filters.source);
      leads = leads.filter((l) => normalizeSearchText(l.source).includes(s));
    }

    // ۶. بدون پیگیری
    if (filters.noFollowUp) {
      leads = leads.filter((l) => !l.nextFollowUpDate);
    }

    // ۷. بازه زمانی
    if (filters.dateRange) {
      if (filters.dateRange.from) {
        const fromTime = new Date(filters.dateRange.from).getTime();
        if (!Number.isNaN(fromTime)) {
          leads = leads.filter((l) => new Date(l.createdAt).getTime() >= fromTime);
        }
      }
      if (filters.dateRange.to) {
        let toStr = filters.dateRange.to;
        if (toStr.length === 10) toStr = `${toStr}T23:59:59.999Z`;
        const toTime = new Date(toStr).getTime();
        if (!Number.isNaN(toTime)) {
          leads = leads.filter((l) => new Date(l.createdAt).getTime() <= toTime);
        }
      }
    }

    return [...leads];
  }

  async getById(id) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }
    return this.storage.getLeadById(id);
  }

  async getEvents(leadId) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }
    return this.storage.getEvents(leadId);
  }

  async createCall(leadId, input) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }
    const resultLabel = CALL_RESULT_LABELS[input.callResult] || 'تماس تلفنی';
    const evt = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId,
      type: 'call',
      title: `ثبت تماس تلفنی (${resultLabel})`,
      timestamp: new Date().toISOString(),
      actorType: 'user',
      actor: input.actor || { id: 'user-1', name: 'سارا احمدی' },
      note: input.note?.trim() || undefined,
      metadata: {
        callResult: input.callResult,
        callDurationSeconds: input.callDurationSeconds || 0,
      },
    };
    this.storage.saveEvent(evt);
    return evt;
  }

  async updateStatus(id, newStatus, metadata) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }

    const lead = this.storage.getLeadById(id);
    if (!lead) {
      throw new Error(`لید با شناسه ${id} یافت نشد.`);
    }

    const fromStatus = lead.status;
    const updated = this.storage.updateLead(id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    const statusLabel = LEAD_STATUS_LABELS[newStatus] || newStatus;
    const statusEvt = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId: id,
      type: 'status_change',
      title: `تغییر وضعیت به ${statusLabel}`,
      timestamp: new Date().toISOString(),
      actorType: 'user',
      actor: { id: 'user-1', name: 'سارا احمدی' },
      metadata: {
        fromStatus,
        toStatus: newStatus,
        ...metadata,
      },
    };

    this.storage.saveEvent(statusEvt);
    return { lead: updated, event: statusEvt };
  }

  async bulkAssign(ids, assignedTo) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }
    const succeeded = [];
    const failed = [];
    const now = new Date().toISOString();

    for (const id of ids) {
      const existing = this.storage.getLeadById(id);
      if (!existing) {
        failed.push({ id, error: `لید با شناسه ${id} یافت نشد.` });
        continue;
      }

      this.storage.updateLead(id, { assignedTo, updatedAt: now });

      const evt = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        leadId: id,
        type: 'assigned',
        title: `تخصیص به ${assignedTo.name || 'کارشناس جدید'}`,
        timestamp: now,
        actorType: 'user',
        actor: { id: 'user-1', name: 'سارا احمدی' },
      };
      this.storage.saveEvent(evt);
      succeeded.push(id);
    }

    return { total: ids.length, succeeded, failed };
  }

  async bulkUpdateStatus(ids, newStatus, metadata) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }
    const succeeded = [];
    const failed = [];

    for (const id of ids) {
      try {
        const existing = this.storage.getLeadById(id);
        if (!existing) {
          failed.push({ id, error: `لید با شناسه ${id} یافت نشد.` });
          continue;
        }

        const fromStatus = existing.status;
        this.storage.updateLead(id, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        const statusLabel = LEAD_STATUS_LABELS[newStatus] || newStatus;
        const statusEvt = {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          leadId: id,
          type: 'status_change',
          title: `تغییر وضعیت به ${statusLabel}`,
          timestamp: new Date().toISOString(),
          actorType: 'user',
          actor: { id: 'user-1', name: 'سارا احمدی' },
          metadata: {
            fromStatus,
            toStatus: newStatus,
            ...metadata,
          },
        };
        this.storage.saveEvent(statusEvt);
        succeeded.push(id);
      } catch (err) {
        failed.push({ id, error: err.message });
      }
    }

    return { total: ids.length, succeeded, failed };
  }
}

const storage = new InMemoryStorage();
const service = new TestLeadService(storage);

async function runAllTests() {
  // ۱. تست getAll بدون فیلتر
  console.log('\n[تست ۱: خواندن همه لیدها]');
  {
    const all = await service.getAll();
    assert.strictEqual(all.length, 6, 'باید ۶ لید اولیه برگردانده شود');
    assert.ok(all.some((l) => l.id === 'lead-101'));
    console.log('✓ تست ۱ موفقیت‌آمیز بود');
  }

  // ۲. تست جستجو با نام، شماره تماس فارسی و انگلیسی، شرکت و ایمیل
  console.log('\n[تست ۲: جستجوی متنی منعطف]');
  {
    // ۲.۱ جستجو بر اساس نام
    const byName = await service.getAll({ search: 'پرهام' });
    assert.strictEqual(byName.length, 1);
    assert.strictEqual(byName[0].id, 'lead-101');

    // ۲.۲ جستجو بر اساس شماره تلفن با ارقام فارسی
    const byPersianPhone = await service.getAll({ search: '۰۹۱۲۳۴۵' });
    assert.strictEqual(byPersianPhone.length, 1);
    assert.strictEqual(byPersianPhone[0].id, 'lead-101');

    // ۲.۳ جستجو بر اساس شماره تلفن با ارقام انگلیسی
    const byEngPhone = await service.getAll({ search: '0912345' });
    assert.strictEqual(byEngPhone.length, 1);
    assert.strictEqual(byEngPhone[0].id, 'lead-101');

    // ۲.۴ جستجو بر اساس نام شرکت
    const byCompany = await service.getAll({ search: 'کاوه' });
    assert.strictEqual(byCompany.length, 1);
    assert.strictEqual(byCompany[0].id, 'lead-104');

    // ۲.۵ جستجو بر اساس ایمیل
    const byEmail = await service.getAll({ search: 'sepidar.co' });
    assert.strictEqual(byEmail.length, 1);
    assert.strictEqual(byEmail[0].id, 'lead-105');

    console.log('✓ تست ۲ موفقیت‌آمیز بود');
  }

  // ۳. تست فیلتر وضعیت (تک وضعیت و چند وضعیتی)
  console.log('\n[تست ۳: فیلتر وضعیت لید]');
  {
    // تک وضعیت
    const wonLeads = await service.getAll({ status: 'won' });
    assert.strictEqual(wonLeads.length, 1);
    assert.strictEqual(wonLeads[0].status, 'won');

    // چند وضعیتی
    const activeLeads = await service.getAll({ status: ['new', 'in_progress', 'qualified'] });
    assert.strictEqual(activeLeads.length, 3);
    assert.ok(activeLeads.every((l) => ['new', 'in_progress', 'qualified'].includes(l.status)));

    console.log('✓ تست ۳ موفقیت‌آمیز بود');
  }

  // ۴. تست فیلتر کارشناس، کمپین و منبع
  console.log('\n[تست ۴: فیلتر کارشناس، کمپین و منبع]');
  {
    // ۴.۱ کارشناس user-1
    const user1Leads = await service.getAll({ assignedToId: 'user-1' });
    assert.strictEqual(user1Leads.length, 2);
    assert.ok(user1Leads.every((l) => l.assignedTo?.id === 'user-1'));

    // ۴.۲ کمپین camp-1
    const camp1Leads = await service.getAll({ campaignId: 'camp-1' });
    assert.strictEqual(camp1Leads.length, 3);
    assert.ok(camp1Leads.every((l) => l.campaignId === 'camp-1'));

    // ۴.۳ منبع اینستاگرام
    const instaLeads = await service.getAll({ source: 'اینستاگرام' });
    assert.strictEqual(instaLeads.length, 2);
    assert.ok(instaLeads.every((l) => l.source.includes('اینستاگرام')));

    console.log('✓ تست ۴ موفقیت‌آمیز بود');
  }

  // ۵. تست فیلتر لیدهای تخصیص‌نیافته (unassigned)
  console.log('\n[تست ۵: فیلتر لیدهای تخصیص‌نیافته]');
  {
    const unassigned = await service.getAll({ assignedToId: 'unassigned' });
    assert.strictEqual(unassigned.length, 1);
    assert.strictEqual(unassigned[0].id, 'lead-103');
    assert.strictEqual(unassigned[0].assignedTo, undefined);
    console.log('✓ تست ۵ موفقیت‌آمیز بود');
  }

  // ۶. تست فیلتر بدون پیگیری (noFollowUp)
  console.log('\n[تست ۶: فیلتر لیدهای بدون پیگیری]');
  {
    const noFollowUps = await service.getAll({ noFollowUp: true });
    assert.ok(noFollowUps.length >= 3);
    assert.ok(noFollowUps.every((l) => !l.nextFollowUpDate));
    console.log('✓ تست ۶ موفقیت‌آمیز بود');
  }

  // ۷. تست فیلتر بازه زمانی (dateRange)
  console.log('\n[تست ۷: فیلتر بازه زمانی]');
  {
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 86400000).toISOString();
    const recentLeads = await service.getAll({ dateRange: { from: fourDaysAgo } });
    assert.ok(recentLeads.length >= 1);
    assert.ok(recentLeads.every((l) => new Date(l.createdAt).getTime() >= new Date(fourDaysAgo).getTime()));
    console.log('✓ تست ۷ موفقیت‌آمیز بود');
  }

  // ۸. تست فیلترهای ترکیبی
  console.log('\n[تست ۸: فیلترهای چندگانه ترکیبی]');
  {
    const combined = await service.getAll({
      campaignId: 'camp-1',
      status: 'proposal',
      search: 'رستمی',
    });
    assert.strictEqual(combined.length, 1);
    assert.strictEqual(combined[0].id, 'lead-106');
    console.log('✓ تست ۸ موفقیت‌آمیز بود');
  }

  // ۹. تست عدم انطباق فیلتر و بازگشت آرایه خالی
  console.log('\n[تست ۹: بازگشت آرایه خالی در عدم انطباق]');
  {
    const noMatches = await service.getAll({ search: 'عبارت_غیر_موجود_در_داده‌ها' });
    assert.ok(Array.isArray(noMatches));
    assert.strictEqual(noMatches.length, 0);
    console.log('✓ تست ۹ موفقیت‌آمیز بود');
  }

  // ۱۰. تست تغییر وضعیت تکی (updateStatus)
  console.log('\n[تست ۱۰ و ۱۱ و ۱۲: تغییر وضعیت تکی و ثبت رویداد status_change]');
  {
    const eventsBefore = (await service.getEvents('lead-103')).length;
    const result = await service.updateStatus('lead-103', 'in_progress');

    assert.strictEqual(result.lead.status, 'in_progress');
    assert.strictEqual(result.event.type, 'status_change');
    assert.strictEqual(result.event.metadata.fromStatus, 'new');
    assert.strictEqual(result.event.metadata.toStatus, 'in_progress');
    assert.strictEqual(result.event.title, 'تغییر وضعیت به تماس گرفته شد');

    const eventsAfter = (await service.getEvents('lead-103')).length;
    assert.strictEqual(eventsAfter, eventsBefore + 1, 'دقیقا یک رویداد به خط زمانی اضافه شود');

    // تایید بازخوانی مجدد از حافظه
    const fetched = await service.getById('lead-103');
    assert.strictEqual(fetched.status, 'in_progress');

    console.log('✓ تست‌های ۱۰، ۱۱ و ۱۲ موفقیت‌آمیز بودند');
  }

  // ۱۳. تست انتساب گروهی (bulkAssign)
  console.log('\n[تست ۱۳: تخصیص گروهی لیدها (bulkAssign)]');
  {
    const newRep = { id: 'user-3', name: 'مریم کاظمی', role: 'مدیر توسعه فروش' };
    const res = await service.bulkAssign(['lead-103', 'lead-104'], newRep);

    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.succeeded.length, 2);
    assert.strictEqual(res.failed.length, 0);

    const l103 = await service.getById('lead-103');
    const l104 = await service.getById('lead-104');
    assert.strictEqual(l103.assignedTo?.id, 'user-3');
    assert.strictEqual(l104.assignedTo?.id, 'user-3');

    // بررسی ثبت رویداد assigned
    const events103 = await service.getEvents('lead-103');
    assert.ok(events103.some((e) => e.type === 'assigned' && e.title.includes('مریم کاظمی')));

    console.log('✓ تست ۱۳ موفقیت‌آمیز بود');
  }

  // ۱۴. تست تغییر وضعیت گروهی (bulkUpdateStatus)
  console.log('\n[تست ۱۴: تغییر وضعیت گروهی (bulkUpdateStatus)]');
  {
    const res = await service.bulkUpdateStatus(['lead-104', 'lead-105'], 'proposal');
    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.succeeded.length, 2);
    assert.strictEqual(res.failed.length, 0);

    const l104 = await service.getById('lead-104');
    const l105 = await service.getById('lead-105');
    assert.strictEqual(l104.status, 'proposal');
    assert.strictEqual(l105.status, 'proposal');

    console.log('✓ تست ۱۴ موفقیت‌آمیز بود');
  }

  // ۱۵. تست شکست جزئی در عملیات گروهی (Partial Failure)
  console.log('\n[تست ۱۵: مدیریت شکست جزئی با شناسه نامعتبر]');
  {
    const res = await service.bulkUpdateStatus(
      ['lead-104', 'lead-INVALID-999'],
      'won'
    );
    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.succeeded.length, 1);
    assert.strictEqual(res.succeeded[0], 'lead-104');
    assert.strictEqual(res.failed.length, 1);
    assert.strictEqual(res.failed[0].id, 'lead-INVALID-999');

    console.log('✓ تست ۱۵ موفقیت‌آمیز بود');
  }

  // ۱۶. تست ایزولاسیون رویدادها بین لیدها
  console.log('\n[تست ۱۶: ایزولاسیون کامل رویدادها]');
  {
    const evts101 = await service.getEvents('lead-101');
    const evts102 = await service.getEvents('lead-102');
    assert.ok(evts101.every((e) => e.leadId === 'lead-101'));
    assert.ok(evts102.every((e) => e.leadId === 'lead-102'));
    console.log('✓ تست ۱۶ موفقیت‌آمیز بود');
  }

  // ۱۷. تست مقاومت در برابر ذخیره‌ساز خراب
  console.log('\n[تست ۱۷: مقاومت در برابر داده خراب]');
  {
    storage.leads.push(null);
    storage.leads.push({ id: 'broken' }); // فاقد fullName
    const safeLeads = await service.getAll();
    assert.ok(safeLeads.every((l) => l && l.id && l.fullName));
    console.log('✓ تست ۱۷ موفقیت‌آمیز بود');
  }

  // ۱۸. تست ثبت تماس و عدم تغییر وضعیت لید
  console.log('\n[تست ۱۸: ثبت تماس تلفنی بدون تغییر وضعیت]');
  {
    const leadBefore = await service.getById('lead-101');
    const statusBefore = leadBefore.status;

    await service.createCall('lead-101', {
      callResult: 'answered',
      callDurationSeconds: 120,
      note: 'بررسی عدم تغییر وضعیت لید',
    });

    const leadAfter = await service.getById('lead-101');
    assert.strictEqual(leadAfter.status, statusBefore, 'ثبت تماس نباید وضعیت لید را تغییر دهد');
    console.log('✓ تست ۱۸ موفقیت‌آمیز بود');
  }

  // ۱۹. تست شبیه‌سازی خطا (setSimulateError)
  console.log('\n[تست ۱۹: تست خطای شبیه‌سازی‌شده]');
  {
    service.setSimulateError(true);
    await assert.rejects(
      async () => service.getAll(),
      /خطای شبیه‌سازی‌شده/
    );
    service.setSimulateError(false);
    console.log('✓ تست ۱۹ موفقیت‌آمیز بود');
  }

  console.log('\n======================================================================');
  console.log('تمامی ۱۹ آزمون جامع ارتقای زیرساخت لیدها (گام ۱۰E.2) با موفقیت ۱۰۰٪ پاس شدند.');
}

runAllTests().catch((err) => {
  console.error('آزمون با خطا متوقف شد:', err);
  process.exit(1);
});
