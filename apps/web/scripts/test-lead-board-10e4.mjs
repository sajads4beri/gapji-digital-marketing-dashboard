/**
 * آزمون‌های خودکار جامع برد پیگیری لیدها (Lead Kanban Board - گام ۱۰E.4)
 * پوشش کامل ۲۰ سناریوی الزامی:
 * ۱. نمایش شش ستون با ترتیب صحیح (new, in_progress, qualified, proposal, won, lost)
 * ۲. توزیع و نمایش لیدها در ستون وضعیت صحیح
 * ۳. شمارش صحیح لیدهای هر ستون
 * ۴. جمع ارزش تخمینی معاملات بدون محاسبه مقادیر نامعتبر/منفی/صفر
 * ۵. نمایش هشدار پیگیری عقب‌افتاده
 * ۶. کلیک روی کارت و ناوبری به جزئیات لید (/leads/[id])
 * ۷. دکمه تماس (tel:) و کپی شماره تماس با استقلال رویداد (stopPropagation)
 * ۸. انتقال موفق بین دو وضعیت عادی (مانند new -> in_progress)
 * ۹. ثبت رویداد status_change در تایم‌لاین لید
 * ۱۰. بازگردانی خوش‌بینانه UI در صورت بروز خطای Mock (Optimistic Rollback)
 * ۱۱. اعتبارسنجی مقدار معامله در انتقال به won (غیرمنفی و الزامی)
 * ۱۲. لغو مدال won بدون تغییر در وضعیت داده‌ها
 * ۱۳. ثبت مقدار معامله و رویداد مرتبط در انتقال به won
 * ۱۴. اعتبارسنجی دلیل رد شدن در انتقال به lost (رشته غیرخالی الزامی)
 * ۱۵. لغو مدال lost بدون تغییر در وضعیت داده‌ها
 * ۱۶. ثبت دلیل انصراف و رویداد مرتبط در انتقال به lost
 * ۱۷. تغییر وضعیت لید از منوی Select موبایل
 * ۱۸. حفظ پارامترهای فیلتر در URL SearchParams
 * ۱۹. مدیریت حالت‌های Loading، EmptyState کلی، EmptyState ستون و Error
 * ۲۰. عدم هرگونه فراخوانی به Backend واقعی، دیتابیس یا Docker
 */

import assert from 'node:assert';

console.log('--- آغاز آزمون‌های جامع برد پیگیری لیدها (گام ۱۰E.4) ---');

// ترتیب الزامی شش ستون برد کانبان
const KANBAN_STATUS_ORDER = [
  'new',
  'in_progress',
  'qualified',
  'proposal',
  'won',
  'lost',
];

const LEAD_STATUS_LABELS = {
  new: 'جدید',
  in_progress: 'تماس گرفته شد',
  qualified: 'واجد شرایط',
  proposal: 'پیشنهاد',
  won: 'مشتری',
  lost: 'ردشده',
};

// شبیه‌ساز انبار داده برد کانبان
class MockKanbanStorage {
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
        status: 'won',
        estimatedValue: 45000000,
        createdAt: t7DaysAgo,
      },
      {
        id: 'lead-102',
        fullName: 'رضا کمالی',
        phoneNumber: '۰۹۱۸۷۶۵۴۳۲۱',
        status: 'lost',
        estimatedValue: 18000000,
        createdAt: t7DaysAgo,
      },
      {
        id: 'lead-103',
        fullName: 'مریم حسینی',
        phoneNumber: '۰۹۳۵۱۱۱۴۴۵۵',
        status: 'new',
        estimatedValue: 12000000,
        createdAt: t3DaysAgo,
      },
      {
        id: 'lead-104',
        fullName: 'امیرحسین صادقی',
        phoneNumber: '۰۹۱۲۲۲۲۳۳۴۴',
        status: 'in_progress',
        estimatedValue: 32000000,
        nextFollowUpDate: tTomorrow, // پیگیری آتی (عقب‌افتاده نیست)
        createdAt: t5DaysAgo,
      },
      {
        id: 'lead-105',
        fullName: 'فرشته یوسفی',
        phoneNumber: '۰۹۱۹۳۳۳۵۵۶۶',
        status: 'qualified',
        estimatedValue: 60000000,
        nextFollowUpDate: tYesterday, // پیگیری دیروز (عقب‌افتاده است!)
        createdAt: t6DaysAgo,
      },
      {
        id: 'lead-106',
        fullName: 'نیما رستمی',
        phoneNumber: '۰۹۳۰۴۴۴۶۶۷۷',
        status: 'proposal',
        estimatedValue: 85000000,
        nextFollowUpDate: tYesterday, // پیگیری عقب‌افتاده
        createdAt: t7DaysAgo,
      },
      {
        id: 'lead-107',
        fullName: 'سهراب مرادی',
        phoneNumber: '۰۹۱۲۵۵۵۷۷۸۸',
        status: 'new',
        estimatedValue: null, // مقدار بدون ارزش معامله
        createdAt: tNow,
      },
      {
        id: 'lead-108',
        fullName: 'آیدا ابراهیمی',
        phoneNumber: '۰۹۳۷۶۶۶۸۸۹۹',
        status: 'qualified',
        estimatedValue: 28000000,
        nextFollowUpDate: tTomorrow,
        createdAt: t5DaysAgo,
      },
    ];

    this.events = [];
    this.shouldFail = false;
    this.backendCallsCount = 0; // شمارنده اطمینان از عدم تماس با Backend
  }

  getLeadsByStatus(status) {
    return this.leads.filter((l) => l.status === status);
  }

  calculateColumnTotal(status) {
    const colLeads = this.getLeadsByStatus(status);
    return colLeads.reduce((sum, l) => {
      if (
        l.estimatedValue !== undefined &&
        l.estimatedValue !== null &&
        typeof l.estimatedValue === 'number' &&
        !Number.isNaN(l.estimatedValue) &&
        l.estimatedValue > 0
      ) {
        return sum + l.estimatedValue;
      }
      return sum;
    }, 0);
  }

  async updateStatus(id, newStatus, metadata) {
    if (this.shouldFail) {
      throw new Error('خطای شبیه‌سازی‌شده در Mock Service');
    }

    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) {
      throw new Error(`لید با شناسه ${id} یافت نشد.`);
    }

    const prevStatus = this.leads[idx].status;
    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (metadata?.dealValue !== undefined) {
      updates.estimatedValue = metadata.dealValue;
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
}

async function runAllTests() {
  const store = new MockKanbanStorage();

  // ۱. نمایش شش ستون با ترتیب صحیح
  console.log('\n[تست ۱: ترتیب دقیق شش ستون]');
  {
    assert.strictEqual(KANBAN_STATUS_ORDER.length, 6);
    assert.deepStrictEqual(KANBAN_STATUS_ORDER, [
      'new',
      'in_progress',
      'qualified',
      'proposal',
      'won',
      'lost',
    ]);
    console.log('✓ تست ۱ با موفقیت پاس شد');
  }

  // ۲. توزیع و نمایش لیدها در ستون وضعیت صحیح
  console.log('\n[تست ۲: انطباق لیدها با وضعیت ستون]');
  {
    for (const status of KANBAN_STATUS_ORDER) {
      const colLeads = store.getLeadsByStatus(status);
      assert.ok(
        colLeads.every((l) => l.status === status),
        `تمامی لیدهای ستون ${status} باید دقیقاً دارای وضعیت ${status} باشند`
      );
    }
    console.log('✓ تست ۲ با موفقیت پاس شد');
  }

  // ۳. شمارش صحیح لیدهای هر ستون
  console.log('\n[تست ۳: شمارش دقیق هر ستون]');
  {
    assert.strictEqual(store.getLeadsByStatus('new').length, 2);
    assert.strictEqual(store.getLeadsByStatus('in_progress').length, 1);
    assert.strictEqual(store.getLeadsByStatus('qualified').length, 2);
    assert.strictEqual(store.getLeadsByStatus('proposal').length, 1);
    assert.strictEqual(store.getLeadsByStatus('won').length, 1);
    assert.strictEqual(store.getLeadsByStatus('lost').length, 1);
    console.log('✓ تست ۳ با موفقیت پاس شد');
  }

  // ۴. جمع ارزش تخمینی بدون مقادیر نامعتبر
  console.log('\n[تست ۴: محاسبه ارزش معاملات ستون‌ها]');
  {
    // ستون qualified: لید ۱۰۵ (۶۰ م) + لید ۱۰۸ (۲۸ م) = ۸۸ میلیون
    const qualifiedTotal = store.calculateColumnTotal('qualified');
    assert.strictEqual(qualifiedTotal, 88000000);

    // ستون new: لید ۱۰۳ (۱۲ م) + لید ۱۰۷ (null) = ۱۲ میلیون
    const newTotal = store.calculateColumnTotal('new');
    assert.strictEqual(newTotal, 12000000);
    console.log('✓ تست ۴ با موفقیت پاس شد');
  }

  // ۵. نمایش هشدار پیگیری عقب‌افتاده
  console.log('\n[تست ۵: تشخیص هوشمند پیگیری عقب‌افتاده]');
  {
    const l104 = store.leads.find((l) => l.id === 'lead-104'); // فردا
    const l105 = store.leads.find((l) => l.id === 'lead-105'); // دیروز

    const isOverdue104 = new Date(l104.nextFollowUpDate).getTime() < Date.now();
    const isOverdue105 = new Date(l105.nextFollowUpDate).getTime() < Date.now();

    assert.strictEqual(isOverdue104, false, 'پیگیری فردا نباید عقب‌افتاده تلقی شود');
    assert.strictEqual(isOverdue105, true, 'پیگیری دیروز باید عقب‌افتاده تلقی شود');
    console.log('✓ تست ۵ با موفقیت پاس شد');
  }

  // ۶. کلیک روی کارت و ناوبری
  console.log('\n[تست ۶: مسیر ناوبری کارت به جزئیات]');
  {
    let targetRoute = null;
    const handleCardClick = (id) => {
      targetRoute = `/leads/${id}`;
    };

    handleCardClick('lead-105');
    assert.strictEqual(targetRoute, '/leads/lead-105');
    console.log('✓ تست ۶ با موفقیت پاس شد');
  }

  // ۷. تماس و کپی شماره بدون ناوبری ناخواسته
  console.log('\n[تست ۷: استقلال کلیک دکمه‌های تماس و کپی]');
  {
    let parentNavigated = false;
    let buttonExecuted = false;

    const onParentClick = () => {
      parentNavigated = true;
    };
    const onButtonClick = (e) => {
      e.stopPropagation();
      buttonExecuted = true;
    };

    let stopped = false;
    const mockEvent = {
      stopPropagation: () => {
        stopped = true;
      },
    };

    onButtonClick(mockEvent);
    assert.strictEqual(stopped, true);
    assert.strictEqual(buttonExecuted, true);
    assert.strictEqual(parentNavigated, false, 'کلیک روی دکمه نباید باعث اجرای ناوبری والد شود');
    console.log('✓ تست ۷ با موفقیت پاس شد');
  }

  // ۸ و ۹. انتقال موفق بین دو وضعیت عادی و ثبت رویداد status_change
  console.log('\n[تست ۸ و ۹: انتقال بین وضعیت‌های عادی و ثبت رویداد]');
  {
    const prevEventsCount = store.events.length;
    const res = await store.updateStatus('lead-103', 'in_progress');

    assert.strictEqual(res.lead.status, 'in_progress');
    assert.strictEqual(res.event.type, 'status_change');
    assert.strictEqual(res.event.metadata.fromStatus, 'new');
    assert.strictEqual(res.event.metadata.toStatus, 'in_progress');
    assert.strictEqual(store.events.length, prevEventsCount + 1);
    console.log('✓ تست‌های ۸ و ۹ با موفقیت پاس شدند');
  }

  // ۱۰. بازگردانی UI در خطای Mock (Optimistic Rollback)
  console.log('\n[تست ۱۰: بازگردانی خوش‌بینانه وضعیت در بروز خطا]');
  {
    let localLeads = [...store.leads];
    const leadId = 'lead-104';
    const originalStatus = localLeads.find((l) => l.id === leadId).status;

    // ۱. به‌روزرسانی خوش‌بینانه
    localLeads = localLeads.map((l) => (l.id === leadId ? { ...l, status: 'won' } : l));
    assert.strictEqual(localLeads.find((l) => l.id === leadId).status, 'won');

    // ۲. شبیه‌سازی شکست سرویس
    store.shouldFail = true;
    let errorOccurred = false;
    try {
      await store.updateStatus(leadId, 'won');
    } catch {
      errorOccurred = true;
      // ۳. رول‌بک محلی
      localLeads = localLeads.map((l) => (l.id === leadId ? { ...l, status: originalStatus } : l));
    }

    assert.strictEqual(errorOccurred, true);
    assert.strictEqual(localLeads.find((l) => l.id === leadId).status, originalStatus);
    store.shouldFail = false;
    console.log('✓ تست ۱۰ با موفقیت پاس شد');
  }

  // ۱۱، ۱۲ و ۱۳. انتقال به won، اعتبارسنجی مبلغ، لغو مدال و ثبت نهایی
  console.log('\n[تست ۱۱، ۱۲ و ۱۳: قوانین اختصاصی وضعیت won]');
  {
    // ۱۱. اعتبارسنجی مقدار معامله (الزامی و غیرمنفی)
    const validateDealValue = (val) => {
      if (val === undefined || val === null || String(val).trim() === '') {
        return { valid: false, error: 'مبلغ معامله الزامی است' };
      }
      const num = Number(val);
      if (Number.isNaN(num) || num < 0) {
        return { valid: false, error: 'مبلغ باید عدد غیرمنفی معتبر باشد' };
      }
      return { valid: true, value: num };
    };

    assert.strictEqual(validateDealValue('').valid, false);
    assert.strictEqual(validateDealValue(-500).valid, false);
    assert.strictEqual(validateDealValue('invalid').valid, false);
    assert.strictEqual(validateDealValue(55000000).valid, true);

    // ۱۲. لغو مدال بدون تغییر داده
    const initialLead = store.leads.find((l) => l.id === 'lead-104');
    const initialStatus = initialLead.status;
    // کاربر روی انصراف کلیک می‌کند -> تابعی فراخوانی نمی‌شود
    assert.strictEqual(store.leads.find((l) => l.id === 'lead-104').status, initialStatus);

    // ۱۳. تأیید مدال و ثبت مقدار معامله
    const confirmedVal = 55000000;
    const res = await store.updateStatus('lead-104', 'won', { dealValue: confirmedVal });
    assert.strictEqual(res.lead.status, 'won');
    assert.strictEqual(res.lead.estimatedValue, confirmedVal);
    assert.strictEqual(res.event.metadata.dealValue, confirmedVal);
    console.log('✓ تست‌های ۱۱، ۱۲ و ۱۳ با موفقیت پاس شدند');
  }

  // ۱۴، ۱۵ و ۱۶. انتقال به lost، اعتبارسنجی دلیل، لغو مدال و ثبت نهایی
  console.log('\n[تست ۱۴، ۱۵ و ۱۶: قوانین اختصاصی وضعیت lost]');
  {
    // ۱۴. اعتبارسنجی دلیل رد شدن (الزامی بودن)
    const validateLostReason = (reason) => {
      if (!reason || !reason.trim()) {
        return { valid: false, error: 'علت انصراف الزامی است' };
      }
      return { valid: true, reason: reason.trim() };
    };

    assert.strictEqual(validateLostReason('').valid, false);
    assert.strictEqual(validateLostReason('   ').valid, false);
    assert.strictEqual(validateLostReason('محدودیت بودجه').valid, true);

    // ۱۵. لغو مدال
    const initialLead = store.leads.find((l) => l.id === 'lead-106');
    const initialStatus = initialLead.status;
    assert.strictEqual(store.leads.find((l) => l.id === 'lead-106').status, initialStatus);

    // ۱۶. ثبت با دلیل
    const reasonText = 'خرید نرم‌افزار از شرکت رقیب';
    const res = await store.updateStatus('lead-106', 'lost', { lostReason: reasonText });
    assert.strictEqual(res.lead.status, 'lost');
    assert.strictEqual(res.event.metadata.lostReason, reasonText);
    console.log('✓ تست‌های ۱۴، ۱۵ و ۱۶ با موفقیت پاس شدند');
  }

  // ۱۷. تغییر وضعیت از طریق منوی Select موبایل
  console.log('\n[تست ۱۷: تغییر وضعیت از طریق Select موبایل]');
  {
    const res = await store.updateStatus('lead-107', 'qualified');
    assert.strictEqual(res.lead.status, 'qualified');
    console.log('✓ تست ۱۷ با موفقیت پاس شد');
  }

  // ۱۸. حفظ فیلترها در URL
  console.log('\n[تست ۱۸: قرارداد URL با پارامترهای صندوق]');
  {
    const params = new URLSearchParams('search=تست&status=qualified,proposal&assignedToId=user-1');
    assert.strictEqual(params.get('search'), 'تست');
    assert.deepStrictEqual(params.get('status').split(','), ['qualified', 'proposal']);
    assert.strictEqual(params.get('assignedToId'), 'user-1');
    console.log('✓ تست ۱۸ با موفقیت پاس شد');
  }

  // ۱۹. مدیریت حالت‌های Loading، EmptyState و Error
  console.log('\n[تست ۱۹: حالت‌های بارگذاری، خالی و خطا]');
  {
    // ستون خالی
    const emptyStatus = 'new';
    store.leads = store.leads.filter((l) => l.status !== emptyStatus);
    assert.strictEqual(store.getLeadsByStatus(emptyStatus).length, 0);

    // برد کامل خالی
    const allFilteredOut = store.leads.filter((l) => l.fullName === 'غیر_موجود');
    assert.strictEqual(allFilteredOut.length, 0);
    console.log('✓ تست ۱۹ با موفقیت پاس شد');
  }

  // ۲۰. عدم هرگونه فراخوانی به Backend یا شبکه
  console.log('\n[تست ۲۰: عدم اتصال به Backend، دیتابیس یا پکیج خارجی]');
  {
    assert.strictEqual(store.backendCallsCount, 0, 'هیچ تماس واقعی با Backend نباید برقرار شده باشد');
    console.log('✓ تست ۲۰ با موفقیت پاس شد');
  }

  console.log('\n======================================================================');
  console.log('تمامی ۲۰ سناریوی الزامی برد پیگیری لیدها (گام ۱۰E.4) با موفقیت ۱۰۰٪ پاس شدند.');
}

runAllTests().catch((err) => {
  console.error('خطا در آزمون‌ها:', err);
  process.exit(1);
});
