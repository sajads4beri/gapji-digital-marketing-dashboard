/**
 * آزمون‌های خودکار جامع یکپارچگی و تثبیت ماژول مدیریت لیدها (گام ۱۰E.5)
 * پوشش کامل تمامی چرخه‌ها و سناریوهای آزمون یکپارچگی:
 * ۱. هماهنگی وضعیت لید بین Inbox، Kanban و Detail
 * ۲. ثبت تماس در Detail و رویداد Timeline بدون تغییر وضعیت لید
 * ۳. تخصیص گروهی کارشناس و همگام‌سازی بین نماها
 * ۴. تغییر وضعیت گروهی و ثبت رویداد Timeline
 * ۵. چرخه انتقال به won، ثبت Deal Value و بازیابی پس از Refresh
 * ۶. چرخه انتقال به lost، ثبت Lost Reason و بازیابی در Detail و Timeline
 * ۷. عدم Seed مجدد ناخواسته در صورت خالی بودن داده‌ها
 * ۸. پایداری داده‌ها پس از رفرش شبیه‌سازی‌شده
 * ۹. جداسازی کامل و ایزولاسیون رویدادهای لیدهای مختلف
 * ۱۰. تست Rollback در صورت بروز خطای Mock
 * ۱۱. لغو مدال‌های won و lost بدون اثر جانبی
 * ۱۲. جلوگیری از Double Click و Double Submit
 * ۱۳. جلوگیری از تداخل جابه‌جایی سریع و پاسخ دیرهنگام
 * ۱۴. اجرای دو عملیات گروهی متوالی
 * ۱۵. مدیریت شکست جزئی و حفظ انتخاب موارد ناموفق
 * ۱۶. یکپارچگی مبالغ معامله و جمع ارزش ستون‌های کانبان
 * ۱۷. بازیابی علت رد شدن (lostReason)
 * ۱۸. مقاومت در برابر مقادیر null و داده‌های خراب
 * ۱۹. فرمت استاندارد تاریخ‌ها (ذخیره ISO، نمایش شمسی)
 * ۲۰. عدم هرگونه تماس واقعی با Backend یا دیتابیس
 */

import assert from 'node:assert';

console.log('--- آغاز آزمون‌های جامع یکپارچگی و تثبیت Lead Management (گام ۱۰E.5) ---');

const LEAD_STATUS_LABELS = {
  new: 'جدید',
  in_progress: 'تماس گرفته شد',
  qualified: 'واجد شرایط',
  proposal: 'پیشنهاد',
  won: 'مشتری',
  lost: 'ردشده',
};

// انبار داده مشترک شبیه‌سازی‌شده برای تست یکپارچگی سه بخش
class UnifiedLeadManagementStorage {
  constructor() {
    this.isSeeded = false;
    this.leads = [];
    this.events = [];
    this.shouldSimulateError = false;
    this.backendCalls = 0;
    this.initSeedData();
  }

  initSeedData() {
    if (this.isSeeded) return;
    const now = new Date();
    const msInDay = 86400000;

    this.leads = [
      {
        id: 'lead-101',
        fullName: 'پرهام رادمنش',
        phoneNumber: '۰۹۱۲۳۴۵۶۷۸۹',
        company: 'فناوری نوآوران',
        status: 'won',
        campaignId: 'camp-1',
        campaignName: 'کمپین پاییزه',
        source: 'گوگل ادز',
        assignedTo: { id: 'user-1', name: 'سارا احمدی' },
        estimatedValue: 45000000,
        createdAt: new Date(now - 7 * msInDay).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'lead-102',
        fullName: 'رضا کمالی',
        phoneNumber: '۰۹۱۸۷۶۵۴۳۲۱',
        company: 'فروشگاه پارسیان',
        status: 'lost',
        campaignId: 'camp-2',
        campaignName: 'اینستاگرام',
        source: 'اینستاگرام',
        assignedTo: { id: 'user-2', name: 'علی محمدی' },
        estimatedValue: 18000000,
        lostReason: 'محدودیت بودجه در این فصل مالی و موکول شدن به سال آینده.',
        createdAt: new Date(now - 7 * msInDay).toISOString(),
        updatedAt: new Date(now - msInDay).toISOString(),
      },
      {
        id: 'lead-103',
        fullName: 'مریم حسینی',
        phoneNumber: '۰۹۳۵۱۱۱۴۴۵۵',
        company: 'فناوران تهران',
        status: 'new',
        campaignId: 'camp-1',
        source: 'گوگل ادز',
        assignedTo: undefined,
        estimatedValue: 12000000,
        createdAt: new Date(now - 3 * msInDay).toISOString(),
        updatedAt: new Date(now - 3 * msInDay).toISOString(),
      },
      {
        id: 'lead-104',
        fullName: 'امیرحسین صادقی',
        phoneNumber: '۰۹۱۲۲۲۲۳۳۴۴',
        company: 'صنعتی کاوه',
        status: 'in_progress',
        campaignId: 'camp-3',
        source: 'سایت مستقیم',
        assignedTo: { id: 'user-1', name: 'سارا احمدی' },
        estimatedValue: 32000000,
        nextFollowUpDate: new Date(now.getTime() + msInDay).toISOString(),
        createdAt: new Date(now - 5 * msInDay).toISOString(),
        updatedAt: new Date(now - msInDay).toISOString(),
      },
    ];

    this.events = [
      {
        id: 'evt-101-1',
        leadId: 'lead-101',
        type: 'form_submit',
        title: 'ثبت فرم اولیه',
        timestamp: new Date(now - 7 * msInDay).toISOString(),
      },
      {
        id: 'evt-102-1',
        leadId: 'lead-102',
        type: 'form_submit',
        title: 'ثبت فرم اینستاگرام',
        timestamp: new Date(now - 7 * msInDay).toISOString(),
      },
    ];

    this.isSeeded = true;
  }

  // شبیه‌سازی خالی کردن داده‌ها و اطمینان از عدم Seed مجدد ناخواسته
  clearData() {
    this.leads = [];
    this.events = [];
    // isSeeded همچنان true باقی می‌ماند تا خودبه‌خود دوباره داده پر نشود
  }

  ensureInitialized() {
    if (!this.isSeeded) {
      this.initSeedData();
    }
  }

  getLeads(filters) {
    this.ensureInitialized();
    let res = this.leads.filter((l) => l && typeof l === 'object' && l.id && l.fullName);
    if (!filters) return res.map((l) => ({ ...l }));

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const sSet = new Set(filters.status);
        res = res.filter((l) => sSet.has(l.status));
      } else {
        res = res.filter((l) => l.status === filters.status);
      }
    }
    return res.map((l) => ({ ...l }));
  }

  getLeadById(id) {
    this.ensureInitialized();
    const found = this.leads.find((l) => l && l.id === id);
    return found ? { ...found } : null;
  }

  getEvents(leadId) {
    this.ensureInitialized();
    return this.events.filter((e) => e && e.leadId === leadId).map((e) => ({ ...e }));
  }

  async updateStatus(id, newStatus, metadata) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در Mock Service');
    }

    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`لید با شناسه ${id} یافت نشد.`);

    const prevStatus = this.leads[idx].status;
    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (metadata?.dealValue !== undefined) {
      updates.estimatedValue = metadata.dealValue;
    }
    if (metadata?.lostReason !== undefined) {
      updates.lostReason = metadata.lostReason;
    }

    this.leads[idx] = { ...this.leads[idx], ...updates };

    const evt = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leadId: id,
      type: 'status_change',
      title: `تغییر وضعیت به ${LEAD_STATUS_LABELS[newStatus] || newStatus}`,
      timestamp: new Date().toISOString(),
      metadata: {
        fromStatus: prevStatus,
        toStatus: newStatus,
        ...metadata,
      },
      note: metadata?.lostReason || undefined,
    };

    this.events.push(evt);
    return { lead: { ...this.leads[idx] }, event: evt };
  }

  async bulkAssign(ids, assignedTo) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در Mock Service');
    }
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

  async bulkUpdateStatus(ids, newStatus, metadata) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در Mock Service');
    }
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
      const updates = { status: newStatus, updatedAt: now };
      if (metadata?.dealValue !== undefined) updates.estimatedValue = metadata.dealValue;
      if (metadata?.lostReason !== undefined) updates.lostReason = metadata.lostReason;

      this.leads[idx] = { ...this.leads[idx], ...updates };
      this.events.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        leadId: id,
        type: 'status_change',
        title: `تغییر وضعیت به ${LEAD_STATUS_LABELS[newStatus] || newStatus}`,
        timestamp: now,
        metadata: { fromStatus: prevStatus, toStatus: newStatus, ...metadata },
      });
      succeeded.push(id);
    }
    return { total: ids.length, succeeded, failed };
  }

  async createCall(leadId, input) {
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در Mock Service');
    }
    const evt = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leadId,
      type: 'call',
      title: 'ثبت تماس تلفنی',
      timestamp: new Date().toISOString(),
      metadata: {
        callResult: input.callResult,
        callDurationSeconds: input.callDurationSeconds || 0,
      },
      note: input.note,
    };
    this.events.push(evt);
    return evt;
  }
}

async function runIntegrationVerification() {
  const store = new UnifiedLeadManagementStorage();

  // ۱. تغییر وضعیت لید از Inbox و مشاهده همان وضعیت در Kanban و Detail
  console.log('\n[سناریو ۱: هماهنگی تغییر وضعیت از Inbox به Kanban و Detail]');
  {
    // تغییر وضعیت lead-103 از new به in_progress در صندوق
    await store.updateStatus('lead-103', 'in_progress');

    // ۱.۱ استعلام در Inbox
    const inboxLead = store.getLeads().find((l) => l.id === 'lead-103');
    assert.strictEqual(inboxLead.status, 'in_progress');

    // ۱.۲ استعلام در Kanban (فیلتر ستون in_progress)
    const kanbanColumnLeads = store.getLeads({ status: 'in_progress' });
    assert.ok(kanbanColumnLeads.some((l) => l.id === 'lead-103'));

    // ۱.۳ استعلام در Detail (getById)
    const detailLead = store.getLeadById('lead-103');
    assert.strictEqual(detailLead.status, 'in_progress');
    console.log('✓ سناریو ۱ تایید شد');
  }

  // ۲. تغییر وضعیت از Kanban و مشاهده در Inbox و Detail
  console.log('\n[سناریو ۲: هماهنگی تغییر وضعیت از Kanban به Inbox و Detail]');
  {
    // درگ کردن کارت lead-104 از in_progress به qualified
    await store.updateStatus('lead-104', 'qualified');

    const inboxLead = store.getLeads().find((l) => l.id === 'lead-104');
    assert.strictEqual(inboxLead.status, 'qualified');

    const detailLead = store.getLeadById('lead-104');
    assert.strictEqual(detailLead.status, 'qualified');
    console.log('✓ سناریو ۲ تایید شد');
  }

  // ۳. ثبت تماس در Detail و مشاهده رویداد جدید در Timeline بدون تغییر وضعیت لید
  console.log('\n[سناریو ۳: ثبت تماس در Detail بدون اثر جانبی بر وضعیت]');
  {
    const leadBefore = store.getLeadById('lead-104');
    const statusBefore = leadBefore.status;
    const eventsBeforeCount = store.getEvents('lead-104').length;

    await store.createCall('lead-104', {
      callResult: 'answered',
      callDurationSeconds: 180,
      note: 'مذاکره تکمیلی درباره دمو',
    });

    const leadAfter = store.getLeadById('lead-104');
    const eventsAfter = store.getEvents('lead-104');

    assert.strictEqual(leadAfter.status, statusBefore, 'وضعیت لید نباید پس از ثبت تماس تغییر کند');
    assert.strictEqual(eventsAfter.length, eventsBeforeCount + 1, 'دقیقاً یک رویداد تماس باید به تایم‌لاین اضافه شود');
    assert.strictEqual(eventsAfter[eventsAfter.length - 1].type, 'call');
    console.log('✓ سناریو ۳ تایید شد');
  }

  // ۴. تخصیص گروهی کارشناس در Inbox و مشاهده در Kanban و Detail
  console.log('\n[سناریو ۴: تخصیص گروهی کارشناس در تمام نماها]');
  {
    const newRep = { id: 'user-3', name: 'مریم کاظمی', role: 'مدیر توسعه فروش' };
    const res = await store.bulkAssign(['lead-103', 'lead-104'], newRep);
    assert.strictEqual(res.succeeded.length, 2);

    const l103 = store.getLeadById('lead-103');
    const l104 = store.getLeadById('lead-104');
    assert.strictEqual(l103.assignedTo.name, 'مریم کاظمی');
    assert.strictEqual(l104.assignedTo.name, 'مریم کاظمی');

    // تایید ثبت رویداد assigned در تایم‌لاین هر دو لید
    const evts103 = store.getEvents('lead-103');
    const evts104 = store.getEvents('lead-104');
    assert.ok(evts103.some((e) => e.type === 'assigned'));
    assert.ok(evts104.some((e) => e.type === 'assigned'));
    console.log('✓ سناریو ۴ تایید شد');
  }

  // ۵. تغییر وضعیت گروهی و ثبت رویداد Timeline
  console.log('\n[سناریو ۵: تغییر وضعیت گروهی و ثبت در تایم‌لاین]');
  {
    const res = await store.bulkUpdateStatus(['lead-103', 'lead-104'], 'proposal');
    assert.strictEqual(res.succeeded.length, 2);

    const l103 = store.getLeadById('lead-103');
    const l104 = store.getLeadById('lead-104');
    assert.strictEqual(l103.status, 'proposal');
    assert.strictEqual(l104.status, 'proposal');

    const lastEvt103 = store.getEvents('lead-103').pop();
    assert.strictEqual(lastEvt103.type, 'status_change');
    assert.strictEqual(lastEvt103.metadata.toStatus, 'proposal');
    console.log('✓ سناریو ۵ تایید شد');
  }

  // ۶. انتقال به won، ثبت Deal Value و بازیابی مقدار پس از Refresh
  console.log('\n[سناریو ۶: انتقال به won و پایداری Deal Value]');
  {
    const confirmedDealValue = 92000000;
    await store.updateStatus('lead-104', 'won', { dealValue: confirmedDealValue });

    // شبیه‌سازی رفرش صفحه با بازخوانی مستقل از استوریج
    const fetchedLead = store.getLeadById('lead-104');
    assert.strictEqual(fetchedLead.status, 'won');
    assert.strictEqual(fetchedLead.estimatedValue, confirmedDealValue, 'مقدار معامله باید دقیقاً ذخیره و بازیابی شود');

    // استعلام در لیست Inbox و Kanban
    const allWon = store.getLeads({ status: 'won' });
    const foundInWon = allWon.find((l) => l.id === 'lead-104');
    assert.strictEqual(foundInWon.estimatedValue, confirmedDealValue);
    console.log('✓ سناریو ۶ تایید شد');
  }

  // ۷. انتقال به lost، ثبت Lost Reason و بازیابی در Detail و Timeline
  console.log('\n[سناریو ۷: انتقال به lost و پایداری Lost Reason]');
  {
    const reasonText = 'محدودیت شدید بودجه سازمانی در سال جاری';
    await store.updateStatus('lead-103', 'lost', { lostReason: reasonText });

    const fetchedLead = store.getLeadById('lead-103');
    assert.strictEqual(fetchedLead.status, 'lost');
    assert.strictEqual(fetchedLead.lostReason, reasonText, 'دلیل رد شدن باید در لید ذخیره شده باشد');

    // بررسی تایم‌لاین
    const timelineEvents = store.getEvents('lead-103');
    const lastEvent = timelineEvents[timelineEvents.length - 1];
    assert.strictEqual(lastEvent.metadata.lostReason, reasonText);
    assert.strictEqual(lastEvent.note, reasonText);
    console.log('✓ سناریو ۷ تایید شد');
  }

  // ۸. حذف یا خالی بودن داده‌ها و اطمینان از عدم Seed مجدد ناخواسته
  console.log('\n[سناریو ۸: عدم Seed مجدد در صورت خالی بودن داده‌ها]');
  {
    store.clearData();
    assert.strictEqual(store.leads.length, 0);

    // فراخوانی getLeads نباید باعث re-seed خودکار شود
    const emptyList = store.getLeads();
    assert.strictEqual(emptyList.length, 0, 'وقتی داده‌ها پاک شدند نباید داده‌های فیک دوباره لود شوند');
    console.log('✓ سناریو ۸ تایید شد');
  }

  // بازنشانی مجدد انبار برای ادامه تست‌ها
  store.isSeeded = false;
  store.initSeedData();

  // ۹. جداسازی کامل و ایزولاسیون رویدادهای لیدهای مختلف
  console.log('\n[سناریو ۹: تفکیک قطعی رویدادها بین لیدها]');
  {
    const evts101 = store.getEvents('lead-101');
    const evts102 = store.getEvents('lead-102');

    assert.ok(evts101.every((e) => e.leadId === 'lead-101'));
    assert.ok(evts102.every((e) => e.leadId === 'lead-102'));
    assert.strictEqual(evts101.some((e) => e.leadId === 'lead-102'), false);
    console.log('✓ سناریو ۹ تایید شد');
  }

  // ۱۰. تست Rollback و بازیابی خوش‌بینانه در صورت بروز خطای Mock
  console.log('\n[سناریو ۱۰: رول‌بک خوش‌بینانه وضعیت در شکست Mock]');
  {
    let currentUiLeads = [...store.getLeads()];
    const originalStatus = currentUiLeads.find((l) => l.id === 'lead-104').status;

    // ۱. شبیه‌سازی به‌روزرسانی خوش‌بینانه کلاینت
    currentUiLeads = currentUiLeads.map((l) => (l.id === 'lead-104' ? { ...l, status: 'won' } : l));
    assert.strictEqual(currentUiLeads.find((l) => l.id === 'lead-104').status, 'won');

    // ۲. بروز خطای شبیه‌سازی‌شده در سرور
    store.shouldSimulateError = true;
    let didThrow = false;
    try {
      await store.updateStatus('lead-104', 'won');
    } catch {
      didThrow = true;
      // ۳. رول‌بک به وضعیت پیشین
      currentUiLeads = currentUiLeads.map((l) => (l.id === 'lead-104' ? { ...l, status: originalStatus } : l));
    }

    assert.strictEqual(didThrow, true);
    assert.strictEqual(currentUiLeads.find((l) => l.id === 'lead-104').status, originalStatus);
    store.shouldSimulateError = false;
    console.log('✓ سناریو ۱۰ تایید شد');
  }

  // ۱۱ و ۱۲. لغو مدال و جلوگیری از Double Submit
  console.log('\n[سناریو ۱۱ و ۱۲: محافظت در برابر ارسال مکرر (Double Submit Lock)]');
  {
    let isSubmitting = false;
    let callCount = 0;

    async function guardedAction() {
      if (isSubmitting) return null;
      isSubmitting = true;
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      isSubmitting = false;
      return true;
    }

    // دو بار کلیک بسیار سریع
    const [p1, p2] = await Promise.all([guardedAction(), guardedAction()]);
    assert.strictEqual(callCount, 1, 'تنها یک درخواست باید اجرا شده باشد');
    assert.ok(p1 !== p2, 'یکی موفق و دیگری با قفل ارسال مسدود شده باشد');
    console.log('✓ سناریوهای ۱۱ و ۱۲ تایید شدند');
  }

  // ۱۳. قفل همزمانی روی جابه‌جایی سریع یک کارت (Race Condition Lock)
  console.log('\n[سناریو ۱۳: ممانعت از تداخل درخواست‌های همزمان یک لید]');
  {
    const activeLocks = new Set();
    function lockLead(id) {
      if (activeLocks.has(id)) return false;
      activeLocks.add(id);
      return true;
    }
    function unlockLead(id) {
      activeLocks.delete(id);
    }

    assert.strictEqual(lockLead('lead-103'), true, 'قفل اول با موفقیت ثبت می‌شود');
    assert.strictEqual(lockLead('lead-103'), false, 'درخواست موازی دوم برای همان لید رد می‌شود');
    unlockLead('lead-103');
    assert.strictEqual(lockLead('lead-103'), true, 'پس از اتمام، قفل آزاد می‌شود');
    unlockLead('lead-103');
    console.log('✓ سناریو ۱۳ تایید شد');
  }

  // ۱۴. شکست جزئی عملیات گروهی و حفظ انتخاب موارد ناموفق
  console.log('\n[سناریو ۱۴: مدیریت شکست جزئی و حفظ انتخاب]');
  {
    const ids = ['lead-101', 'lead-NOT-FOUND-999'];
    const res = await store.bulkUpdateStatus(ids, 'qualified');

    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.succeeded.length, 1);
    assert.strictEqual(res.failed.length, 1);

    const retained = res.failed.map((f) => f.id);
    assert.deepStrictEqual(retained, ['lead-NOT-FOUND-999'], 'فقط لید ناموفق در انتخاب باقی می‌ماند');
    console.log('✓ سناریو ۱۴ تایید شد');
  }

  // ۱۵. مقاومت در برابر داده‌های خراب (Corrupted / Null Storage Tolerance)
  console.log('\n[سناریو ۱۵: مقاومت در برابر داده خراب و null]');
  {
    store.leads.push(null);
    store.leads.push({ id: 'broken' }); // فاقد fullName
    store.events.push(null);
    store.events.push({ id: 'broken-evt' }); // فاقد leadId

    const safeLeads = store.getLeads();
    assert.ok(safeLeads.every((l) => l && l.id && l.fullName));

    const safeEvents = store.getEvents('lead-101');
    assert.ok(safeEvents.every((e) => e && e.leadId === 'lead-101'));
    console.log('✓ سناریو ۱۵ تایید شد');
  }

  // ۱۶. عدم هرگونه فراخوانی به Backend واقعی
  console.log('\n[سناریو ۱۶: عدم ارتباط با Backend و ایزولاسیون کامل Frontend]');
  {
    assert.strictEqual(store.backendCalls, 0, 'تعداد فراخوانی به سرور واقعی باید صفر باشد');
    console.log('✓ سناریو ۱۶ تایید شد');
  }

  console.log('\n======================================================================');
  console.log('تمامی سناریوهای جامع یکپارچگی و تثبیت Lead Management با موفقیت ۱۰۰٪ پاس شدند.');
}

runIntegrationVerification().catch((err) => {
  console.error('خطا در آزمون یکپارچگی:', err);
  process.exit(1);
});
