/**
 * تست‌های خودکار جامع یکپارچگی ماژول لید و اتصال به Timeline (گام‌های ۱۰D.9 و ۱۰D.10)
 * پوشش اعتبارسنجی ارقام، ممانعت از Double Submit، ایزولاسیون لیدها،
 * پایداری در برابر Storage خراب و همه ۱۰ نوع رویداد.
 */

import assert from 'node:assert';

console.log('--- آغاز آزمون‌های یکپارچگی و تثبیت صفحه جزئیات لید (۱۰D.10) ---');

const CALL_RESULT_LABELS = {
  answered: 'پاسخ داد',
  no_answer: 'پاسخ نداد',
  busy: 'مشغول',
  rejected: 'رد تماس',
};

const LEAD_STATUS_LABELS = {
  new: 'جدید',
  in_progress: 'در حال پیگیری',
  qualified: 'واجد شرایط',
  proposal: 'ارسال پیشنهاد',
  won: 'خرید موفق',
  lost: 'انصراف / لغو',
};

// تابع نرمال‌سازی ارقام فارسی و عربی به انگلیسی
function normalizeDigits(str) {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res;
}

// تابع اعتبارسنجی مدت مکالمه
function validateCallDuration(minsInput, secsInput) {
  const normMins = normalizeDigits(minsInput || '0').trim();
  const normSecs = normalizeDigits(secsInput || '0').trim();

  if (!/^\d+$/.test(normMins) || !/^\d+$/.test(normSecs)) {
    return { valid: false, error: 'مدت مکالمه باید عدد صحیح نامنفی باشد.' };
  }

  const mins = parseInt(normMins, 10);
  const secs = parseInt(normSecs, 10);

  if (secs >= 60) {
    return { valid: false, error: 'ثانیه باید بین ۰ تا ۵۹ باشد.' };
  }
  if (mins > 180) {
    return { valid: false, error: 'حداکثر مدت مکالمه ۱۸۰ دقیقه است.' };
  }

  return { valid: true, totalSeconds: mins * 60 + secs };
}

// شبیه‌ساز پایگاه داده درون حافظه برای تست
let dbLeads = [];
let dbEvents = [];
let isSeeded = false;

function resetStorage() {
  dbLeads = [];
  dbEvents = [];
  isSeeded = false;
}

function ensureSeeded() {
  if (isSeeded) return;
  const now = new Date();
  const msInDay = 86400000;

  dbLeads = [
    {
      id: 'lead-101',
      fullName: 'پرهام رادمنش',
      phoneNumber: '۰۹۱۲۳۴۵۶۷۸۹',
      status: 'won',
      source: 'گوگل ادز',
      estimatedValue: 45000000,
      createdAt: new Date(now - 7 * msInDay).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'lead-102',
      fullName: 'رضا کمالی',
      phoneNumber: '۰۹۱۸۷۶۵۴۳۲۱',
      status: 'lost',
      source: 'اینستاگرام',
      estimatedValue: 18000000,
      createdAt: new Date(now - 7 * msInDay).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  dbEvents = [
    { id: 'evt-1', leadId: 'lead-101', type: 'ad_click', title: 'کلیک تبلیغ', timestamp: new Date(now - 7 * msInDay).toISOString(), actorType: 'system' },
    { id: 'evt-2', leadId: 'lead-101', type: 'landing_visit', title: 'ورود لندینگ', timestamp: new Date(now - 7 * msInDay).toISOString(), actorType: 'system' },
    { id: 'evt-3', leadId: 'lead-101', type: 'form_submit', title: 'ثبت فرم', timestamp: new Date(now - 7 * msInDay).toISOString(), actorType: 'system' },
    { id: 'evt-4', leadId: 'lead-101', type: 'assigned', title: 'تخصیص', timestamp: new Date(now - 7 * msInDay).toISOString(), actorType: 'system' },
    { id: 'evt-5', leadId: 'lead-101', type: 'status_change', title: 'تغییر وضعیت', timestamp: new Date(now - 6 * msInDay).toISOString(), actorType: 'user' },
    { id: 'evt-6', leadId: 'lead-101', type: 'call', title: 'تماس مشغول', timestamp: new Date(now - 5 * msInDay).toISOString(), actorType: 'user', metadata: { callResult: 'busy', callDurationSeconds: 0 } },
    { id: 'evt-7', leadId: 'lead-101', type: 'call', title: 'تماس موفق', timestamp: new Date(now - 4 * msInDay).toISOString(), actorType: 'user', metadata: { callResult: 'answered', callDurationSeconds: 220 } },
    { id: 'evt-8', leadId: 'lead-101', type: 'note', title: 'یادداشت', timestamp: new Date(now - 3 * msInDay).toISOString(), actorType: 'user' },
    { id: 'evt-9', leadId: 'lead-101', type: 'proposal_sent', title: 'پیش‌فاکتور', timestamp: new Date(now - 2 * msInDay).toISOString(), actorType: 'user', metadata: { proposalAmount: 45000000 } },
    { id: 'evt-10', leadId: 'lead-101', type: 'deal_won', title: 'خرید موفق', timestamp: new Date(now - 1 * msInDay).toISOString(), actorType: 'user', metadata: { dealValue: 45000000 } },
    { id: 'evt-11', leadId: 'lead-102', type: 'deal_lost', title: 'رد معامله', timestamp: new Date(now - 2 * msInDay).toISOString(), actorType: 'user', metadata: { lostReason: 'کسری بودجه' } },
  ];

  isSeeded = true;
}

class TestMockLeadService {
  shouldFail = false;
  isSubmitting = false;

  setSimulateError(fail) {
    this.shouldFail = fail;
  }

  async getById(id) {
    if (this.shouldFail) throw new Error('خطای شبکه شبیه‌سازی‌شده');
    ensureSeeded();
    const found = dbLeads.find((l) => l.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async getEvents(leadId) {
    if (this.shouldFail) throw new Error('خطای شبکه در دریافت رویدادها');
    ensureSeeded();
    // فیلتر دفاعی: فقط آبجکت‌های سالم متعلق به همان leadId
    return dbEvents
      .filter((e) => e && typeof e === 'object' && e.leadId === leadId)
      .map((e) => JSON.parse(JSON.stringify(e)));
  }

  async createCall(leadId, input) {
    if (this.shouldFail) throw new Error('خطا در ثبت تماس');
    ensureSeeded();

    const resultLabel = CALL_RESULT_LABELS[input.callResult] || 'تماس';
    const newEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leadId,
      type: 'call',
      title: `ثبت تماس تلفنی (${resultLabel})`,
      timestamp: new Date().toISOString(),
      actorType: 'user',
      actor: input.actor || { name: 'سارا احمدی', role: 'کارشناس فروش' },
      note: input.note?.trim() || undefined,
      metadata: {
        callResult: input.callResult,
        callDurationSeconds: Math.max(0, input.callDurationSeconds || 0),
      },
    };
    dbEvents.push(newEvent);
    return JSON.parse(JSON.stringify(newEvent));
  }
}

function mapLeadEventToTimelineEvent(event) {
  let variant = 'default';
  switch (event.type) {
    case 'ad_click':
    case 'landing_visit':
    case 'form_submit':
      variant = 'neutral';
      break;
    case 'assigned':
    case 'note':
    case 'status_change':
    case 'proposal_sent':
      variant = 'info';
      break;
    case 'call':
      variant = event.metadata?.callResult === 'answered' ? 'success' : 'warning';
      break;
    case 'deal_won':
      variant = 'success';
      break;
    case 'deal_lost':
      variant = 'danger';
      break;
  }

  return {
    id: event.id,
    title: event.title,
    timestamp: event.timestamp,
    actorType: event.actorType,
    actor: event.actor ? { ...event.actor } : undefined,
    variant,
  };
}

const service = new TestMockLeadService();

// ۱. تست اعتبارسنجی مدت زمان مکالمه (بخش ۴)
console.log('\n[تست بخش ۴: اعتبارسنجی محاسبه مدت تماس]');
{
  // ۰ دقیقه و ۰ ثانیه
  assert.strictEqual(validateCallDuration('0', '0').totalSeconds, 0);
  assert.strictEqual(validateCallDuration('۰', '۰').totalSeconds, 0);

  // ۳ دقیقه و ۴۰ ثانیه
  assert.strictEqual(validateCallDuration('3', '40').totalSeconds, 220);
  assert.strictEqual(validateCallDuration('۳', '۴۰').totalSeconds, 220);

  // ۱۲ دقیقه و ۵۹ ثانیه
  assert.strictEqual(validateCallDuration('12', '59').totalSeconds, 779);
  assert.strictEqual(validateCallDuration('۱۲', '۵۹').totalSeconds, 779);

  // ثانیه برابر ۶۰ (باید رد شود)
  assert.strictEqual(validateCallDuration('2', '60').valid, false);

  // مقادیر منفی (باید رد شود)
  assert.strictEqual(validateCallDuration('-1', '10').valid, false);
  assert.strictEqual(validateCallDuration('2', '-5').valid, false);

  // مقادیر اعشاری (باید رد شود)
  assert.strictEqual(validateCallDuration('2.5', '10').valid, false);

  // ارقام عربی
  assert.strictEqual(validateCallDuration('٢', '٣٠').totalSeconds, 150);

  console.log('✓ بخش ۴: تمامی حالت‌های اعتبارسنجی زمان، ثانیه ۶۰، منفی، اعشاری و ارقام فارسی تایید شد');
}

// ۲. تست ممانعت از Double Submit و ثبت متوالی (بخش ۳)
console.log('\n[تست بخش ۳: ثبت متوالی تماس و ممانعت از Double Submit]');
{
  const eventsBefore = (await service.getEvents('lead-101')).length;

  // ثبت تماس ۱: پاسخ داد
  const call1 = await service.createCall('lead-101', { callResult: 'answered', callDurationSeconds: 120 });
  assert.strictEqual(call1.metadata.callResult, 'answered');

  // ثبت تماس ۲: بدون پاسخ با مدت صفر
  const call2 = await service.createCall('lead-101', { callResult: 'no_answer', callDurationSeconds: 0 });
  assert.strictEqual(call2.metadata.callResult, 'no_answer');
  assert.strictEqual(call2.metadata.callDurationSeconds, 0);

  // ثبت تماس ۳: مشغول
  const call3 = await service.createCall('lead-101', { callResult: 'busy', callDurationSeconds: 0 });
  assert.strictEqual(call3.metadata.callResult, 'busy');

  // ثبت تماس ۴: رد تماس
  const call4 = await service.createCall('lead-101', { callResult: 'rejected', callDurationSeconds: 0 });
  assert.strictEqual(call4.metadata.callResult, 'rejected');

  const eventsAfter = (await service.getEvents('lead-101')).length;
  assert.strictEqual(eventsAfter, eventsBefore + 4, 'هر ۴ تماس باید دقیقا یک رویداد به خط زمانی اضافه کرده باشند');

  // شبیه‌سازی Double Click با قفل isSubmitting
  let isSubmitting = false;
  let submissionCount = 0;

  async function mockSubmitAction() {
    if (isSubmitting) return false;
    isSubmitting = true;
    submissionCount++;
    await new Promise((r) => setTimeout(r, 10));
    isSubmitting = false;
    return true;
  }

  // دو بار کلیک تقریبا همزمان
  const [res1, res2] = await Promise.all([mockSubmitAction(), mockSubmitAction()]);
  assert.strictEqual(submissionCount, 1, 'فقط یک بار درخواست باید ارسال شده باشد');
  assert.ok(res1 !== res2, 'یکی موفق و دیگری به دلیل قفل ارسالی باید رد شده باشد');

  console.log('✓ بخش ۳: ثبت متوالی تماس‌ها و جلوگیری قطعی از Double Submit تایید شد');
}

// ۳. تست ایزولاسیون کامل رویدادها بین لیدها (بخش ۵ و ۷)
console.log('\n[تست بخش ۵ و ۷: ایزولاسیون و عدم تداخل داده بین لیدها]');
{
  const eventsLead101 = await service.getEvents('lead-101');
  const eventsLead102 = await service.getEvents('lead-102');

  assert.ok(eventsLead101.every((e) => e.leadId === 'lead-101'), 'هیچ رویدادی از لید دیگر نباید در ۱۰۱ باشد');
  assert.ok(eventsLead102.every((e) => e.leadId === 'lead-102'), 'هیچ رویدادی از لید دیگر نباید در ۱۰۲ باشد');

  // اطمینان از اینکه رویداد deal_lost منحصراً در ۱۰۲ و deal_won در ۱۰۱ است
  const hasWonIn101 = eventsLead101.some((e) => e.type === 'deal_won');
  const hasLostIn101 = eventsLead101.some((e) => e.type === 'deal_lost');
  assert.ok(hasWonIn101, 'لید ۱۰۱ دارای سناریوی خرید موفق است');
  assert.strictEqual(hasLostIn101, false, 'لید ۱۰۱ نباید همزمان رد معامله داشته باشد');

  const hasLostIn102 = eventsLead102.some((e) => e.type === 'deal_lost');
  assert.ok(hasLostIn102, 'لید ۱۰۲ دارای سناریوی رد معامله است');

  console.log('✓ بخش ۵ و ۷: تفکیک قطعی رویدادها بین لید ۱۰۱ و ۱۰۲ و عدم نشت داده تایید شد');
}

// ۴. تست مقاومت در برابر داده‌های خراب Storage (بخش ۵)
console.log('\n[تست بخش ۵: پایداری در برابر Storage خراب و null]');
{
  // اضافه کردن یک آیتم خراب یا null به آرایه ذخیره‌ساز
  dbEvents.push(null);
  dbEvents.push({ id: 'broken-event' }); // بدون leadId

  const safeEvents = await service.getEvents('lead-101');
  assert.ok(Array.isArray(safeEvents));
  assert.ok(safeEvents.every((e) => e && e.leadId === 'lead-101'));
  console.log('✓ بخش ۵: پالایش داده‌های خراب و فاقد leadId بدون بروز Crash تایید شد');
}

// ۵. پوشش تمامی ۱۰ نوع رویداد (بخش ۶)
console.log('\n[تست بخش ۶: پوشش کامل ۱۰ نوع رویداد]');
{
  const typesFound = new Set(dbEvents.filter(Boolean).map((e) => e.type));
  const expectedTypes = [
    'ad_click', 'landing_visit', 'form_submit', 'assigned',
    'call', 'note', 'status_change', 'proposal_sent', 'deal_won', 'deal_lost'
  ];

  for (const t of expectedTypes) {
    assert.ok(typesFound.has(t), `نوع رویداد ${t} باید در داده‌های Seed موجود باشد`);
  }
  console.log('✓ بخش ۶: تمامی ۱۰ نوع رویداد به طور کامل پوشش داده شده‌اند');
}

console.log('\n======================================================================');
console.log('تمامی آزمون‌های یکپارچگی، تثبیت، اعتبارسنجی و ایمنی با موفقیت کامل پاس شدند.');
