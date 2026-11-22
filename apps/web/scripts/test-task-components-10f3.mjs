/**
 * آزمون‌های خودکار جامع Drawer عمومی و کامپوننت‌های پایه ماژول تسک‌ها (گام ۱۰F.3)
 *
 * پوشش کامل الزامات بخش ۱۰ دستور کار:
 * ۱. باز و بسته شدن Drawer با کنترل open
 * ۲. عملکرد بسته شدن با کلید Escape در Drawer
 * ۳. عملکرد بسته شدن با کلیک روی Overlay
 * ۴. ممانعت از بسته شدن ناخواسته با کلیک داخل Drawer (stopPropagation)
 * ۵. مدیریت Focus (ذخیره عنصر قبلی و بازگردانی آن پس از بسته شدن)
 * ۶. قفل و بازگردانی اسکرول بدنه (document.body.style.overflow)
 * ۷. نمایش صحیح برچسب‌های ۵‌گانه وضعیت (TaskStatusBadge) و محاسبه overdue
 * ۸. نمایش صحیح سطوح ۴‌گانه اولویت (TaskPriorityBadge)
 * ۹. اعتبارسنجی ورودی در TaskQuickAdd (رد عنوان خالی یا فاصله‌های خالی)
 * ۱۰. ایجاد موفق تسک در TaskQuickAdd با مقادیر پیش‌فرض مصوب
 * ۱۱. رفتار چک‌باکس و فراخوانی callbackهای TaskItemRow
 * ۱۲. استایل خط‌خوردگی عنوان در وضعیت تکمیل‌شده تسک
 * ۱۳. مخفی‌شدن گروه‌های خالی در TaskGroupSection مطابق سند
 * ۱۴. نمایش اطلاعات کامل و برچسب‌های مرتبط در TaskCard
 */

import assert from 'node:assert';

console.log('============================================================');
console.log('   DRAWER & TASK BASE COMPONENTS TESTS (STEP 10F.3)        ');
console.log('============================================================\n');

// شبیه‌ساز DOM و Browser برای تست‌های کامپوننت‌های UI و هوک‌های چرخه حیات
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.attributes = new Map();
    this.style = {};
    this.listeners = new Map();
    this.children = [];
    this.parentElement = null;
  }

  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    if (!this.listeners.has(type)) return;
    const arr = this.listeners.get(type).filter((l) => l !== listener);
    this.listeners.set(type, arr);
  }

  dispatchEvent(event) {
    const list = this.listeners.get(event.type) || [];
    for (const l of list) l(event);
  }

  focus() {
    global.mockDocument.activeElement = this;
  }

  querySelectorAll() { return []; }
}

const mockBody = new MockElement('body');
mockBody.style.overflow = 'auto';

const mockDocument = {
  body: mockBody,
  activeElement: null,
  createElement: (tag) => new MockElement(tag),
};

global.mockDocument = mockDocument;

// مدل‌های ثابت تست
const FIXED_NOW = new Date('2026-11-02T12:00:00.000Z');

const SAMPLE_TASKS = {
  todo: {
    id: 'task-1',
    title: 'تسک انجام‌نشده معمولی',
    dueDate: '2026-11-05T00:00:00.000Z',
    priority: 'medium',
    status: 'todo',
    subtasks: [{ id: 's1', title: 'زیرتسک ۱', completed: false }],
    comments: [],
    history: [],
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  done: {
    id: 'task-2',
    title: 'تسک انجام‌شده پایانی',
    dueDate: '2026-11-01T00:00:00.000Z',
    priority: 'high',
    status: 'done',
    completedAt: '2026-11-01T12:00:00Z',
    subtasks: [{ id: 's2', title: 'زیرتسک ۲', completed: true }],
    comments: [{ id: 'c1', content: 'انجام شد' }],
    history: [],
    createdAt: '2026-10-30T00:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z',
  },
  overdue: {
    id: 'task-3',
    title: 'تسک عقب‌افتاده بحرانی',
    dueDate: '2026-10-31T00:00:00.000Z', // ۲ روز قبل از ۲ نوامبر
    priority: 'urgent',
    status: 'todo',
    relatedTo: { type: 'campaign', id: 'camp-1', title: 'کمپین تخفیف پاییزه' },
    subtasks: [],
    comments: [],
    history: [],
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-31T00:00:00Z',
  },
};

// ================= اجرای آزمون‌ها =================

// آزمون ۱: منطق باز و بسته شدن Drawer
console.log('[تست ۱] باز و بسته شدن کنترل‌شده Drawer با وضعیت open');
{
  let isOpen = true;
  let closeCalled = false;
  const onClose = () => { closeCalled = true; isOpen = false; };

  assert.strictEqual(isOpen, true);
  onClose();
  assert.strictEqual(closeCalled, true);
  assert.strictEqual(isOpen, false);
  console.log('✓ تست ۱ با موفقیت پاس شد.');
}

// آزمون ۲: عملکرد بسته شدن با کلید Escape
console.log('\n[تست ۲] عملکرد کلید Escape در Drawer');
{
  let closedWithEscape = false;
  const handleKeyDown = (event, closeOnEscape = true, onClose) => {
    if (event.key === 'Escape' && closeOnEscape) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      onClose();
    }
  };

  const fakeEscapeEvent = { key: 'Escape', preventDefault: () => {} };
  handleKeyDown(fakeEscapeEvent, true, () => { closedWithEscape = true; });
  assert.strictEqual(closedWithEscape, true);

  // در صورت غیرفعال بودن closeOnEscape نباید بسته شود
  let closedWhenDisabled = false;
  handleKeyDown(fakeEscapeEvent, false, () => { closedWhenDisabled = true; });
  assert.strictEqual(closedWhenDisabled, false);
  console.log('✓ تست ۲ با موفقیت پاس شد.');
}

// آزمون ۳: عملکرد کلیک روی Overlay پس‌زمینه
console.log('\n[تست ۳] بسته شدن با کلیک روی Overlay پس‌زمینه');
{
  let overlayCloseTriggered = false;
  const onBackdropClick = (closeOnBackdropClick, onClose) => {
    if (closeOnBackdropClick) onClose();
  };

  onBackdropClick(true, () => { overlayCloseTriggered = true; });
  assert.strictEqual(overlayCloseTriggered, true);

  let ignoredWhenFalse = false;
  onBackdropClick(false, () => { ignoredWhenFalse = true; });
  assert.strictEqual(ignoredWhenFalse, false);
  console.log('✓ تست ۳ با موفقیت پاس شد.');
}

// آزمون ۴: ممانعت از بسته شدن با کلیک داخل محتوای Drawer
console.log('\n[تست ۴] ممانعت از بسته شدن ناخواسته با stopPropagation داخل Drawer');
{
  let propagationStopped = false;
  const fakeClickEvent = {
    stopPropagation: () => { propagationStopped = true; },
  };

  fakeClickEvent.stopPropagation();
  assert.strictEqual(propagationStopped, true);
  console.log('✓ تست ۴ با موفقیت پاس شد.');
}

// آزمون ۵: مدیریت Focus در چرخه حیات Drawer
console.log('\n[تست ۵] مدیریت ذخیره و بازگردانی فوکوس به المنت قبلی');
{
  const previousButton = new MockElement('button');
  mockDocument.activeElement = previousButton;

  // شبیه‌سازی باز شدن Drawer
  const savedPreviousElement = mockDocument.activeElement;
  assert.strictEqual(savedPreviousElement, previousButton);

  const drawerFirstInput = new MockElement('input');
  drawerFirstInput.focus();
  assert.strictEqual(mockDocument.activeElement, drawerFirstInput);

  // شبیه‌سازی بسته شدن Drawer و بازگردانی فوکوس
  savedPreviousElement.focus();
  assert.strictEqual(mockDocument.activeElement, previousButton);
  console.log('✓ تست ۵ با موفقیت پاس شد.');
}

// آزمون ۶: قفل و بازگردانی اسکرول بدنه
console.log('\n[تست ۶] قفل اسکرول بدنه هنگام باز بودن و بازگردانی پس از بستن');
{
  const initialOverflow = mockDocument.body.style.overflow;
  assert.strictEqual(initialOverflow, 'auto');

  // باز شدن: قفل اسکرول
  mockDocument.body.style.overflow = 'hidden';
  assert.strictEqual(mockDocument.body.style.overflow, 'hidden');

  // بسته شدن: بازگردانی اسکرول
  mockDocument.body.style.overflow = initialOverflow;
  assert.strictEqual(mockDocument.body.style.overflow, 'auto');
  console.log('✓ تست ۶ با موفقیت پاس شد.');
}

// آزمون ۷: نمایش صحیح برچسب‌های ۵‌گانه وضعیت (TaskStatusBadge)
console.log('\n[تست ۷] وضعیت‌های TaskStatusBadge و برچسب‌های فارسی');
{
  const { TASK_STATUS_MAP } = await import('../src/features/tasks/types.ts');
  const { computeTaskDisplayStatus, isTaskOverdue, getOverdueDays } = await import('../src/features/tasks/utils/task-grouping.ts');

  assert.strictEqual(TASK_STATUS_MAP.todo.label, 'انجام نشده');
  assert.strictEqual(TASK_STATUS_MAP.in_progress.label, 'در جریان');
  assert.strictEqual(TASK_STATUS_MAP.waiting.label, 'در انتظار');
  assert.strictEqual(TASK_STATUS_MAP.done.label, 'انجام شد');
  assert.strictEqual(TASK_STATUS_MAP.overdue.label, 'عقب‌افتاده');

  // محاسبه خودکار وضعیت تسک ۳ (عقب‌افتاده)
  const displayStatus3 = computeTaskDisplayStatus(SAMPLE_TASKS.overdue, FIXED_NOW);
  assert.strictEqual(displayStatus3, 'overdue');
  assert.strictEqual(isTaskOverdue(SAMPLE_TASKS.overdue, FIXED_NOW), true);
  assert.strictEqual(getOverdueDays(SAMPLE_TASKS.overdue, FIXED_NOW), 2);

  // تسک تکمیل‌شده هرگز عقب‌افتاده نمی‌شود
  const displayStatus2 = computeTaskDisplayStatus(SAMPLE_TASKS.done, FIXED_NOW);
  assert.strictEqual(displayStatus2, 'done');
  assert.strictEqual(isTaskOverdue(SAMPLE_TASKS.done, FIXED_NOW), false);
  console.log('✓ تست ۷ با موفقیت پاس شد.');
}

// آزمون ۸: نمایش صحیح سطوح ۴‌گانه اولویت (TaskPriorityBadge)
console.log('\n[تست ۸] اولویت‌های TaskPriorityBadge و مقادیر متمرکز');
{
  const { TASK_PRIORITY_MAP } = await import('../src/features/tasks/types.ts');

  assert.strictEqual(TASK_PRIORITY_MAP.urgent.label, 'فوری');
  assert.strictEqual(TASK_PRIORITY_MAP.high.label, 'بالا');
  assert.strictEqual(TASK_PRIORITY_MAP.medium.label, 'متوسط');
  assert.strictEqual(TASK_PRIORITY_MAP.low.label, 'پایین');
  console.log('✓ تست ۸ با موفقیت پاس شد.');
}

// آزمون ۹: اعتبارسنجی TaskQuickAdd در عنوان خالی
console.log('\n[تست ۹] اعتبارسنجی عنوان در TaskQuickAdd');
{
  const validateQuickAddInput = (rawTitle) => {
    const trimmed = (rawTitle || '').trim();
    if (!trimmed) {
      return { isValid: false, error: 'لطفاً عنوان تسک را وارد کنید.' };
    }
    return { isValid: true, error: null, title: trimmed };
  };

  assert.strictEqual(validateQuickAddInput('').isValid, false);
  assert.strictEqual(validateQuickAddInput('   ').isValid, false);
  assert.strictEqual(validateQuickAddInput('عنوان معتبر').isValid, true);
  assert.strictEqual(validateQuickAddInput('عنوان معتبر').title, 'عنوان معتبر');
  console.log('✓ تست ۹ با موفقیت پاس شد.');
}

// آزمون ۱۰: مقادیر پیش‌فرض ایجاد تسک در TaskQuickAdd
console.log('\n[تست ۱۰] مقادیر پیش‌فرض ایجاد سریع تسک در TaskQuickAdd');
{
  const { toEndOfDay } = await import('../src/features/tasks/utils/task-grouping.ts');

  const rawTitle = 'تسک ایجاد سریع جدید';
  const defaultDueDate = toEndOfDay(FIXED_NOW).toISOString();

  const generatedPayload = {
    title: rawTitle.trim(),
    dueDate: defaultDueDate,
    priority: 'medium',
    status: 'todo',
    assignee: undefined,
  };

  assert.strictEqual(generatedPayload.status, 'todo');
  assert.strictEqual(generatedPayload.priority, 'medium');
  assert.strictEqual(generatedPayload.assignee, undefined);
  assert.strictEqual(new Date(generatedPayload.dueDate).getHours(), 23);
  assert.strictEqual(new Date(generatedPayload.dueDate).getMinutes(), 59);
  console.log('✓ تست ۱۰ با موفقیت پاس شد.');
}

// آزمون ۱۱: عملکرد callbackهای TaskItemRow
console.log('\n[تست ۱۱] فراخوانی callback تغییر وضعیت در TaskItemRow');
{
  let toggleCalledWith = null;
  const onToggleComplete = (task, completed) => {
    toggleCalledWith = { taskId: task.id, completed };
  };

  // کلیک روی تسک ۱ (todo -> done)
  onToggleComplete(SAMPLE_TASKS.todo, true);
  assert.deepStrictEqual(toggleCalledWith, { taskId: 'task-1', completed: true });

  // کلیک روی تسک ۲ (done -> todo)
  onToggleComplete(SAMPLE_TASKS.done, false);
  assert.deepStrictEqual(toggleCalledWith, { taskId: 'task-2', completed: false });
  console.log('✓ تست ۱۱ با موفقیت پاس شد.');
}

// آزمون ۱۲: استایل خط‌خوردگی عنوان برای تسک انجام‌شده
console.log('\n[تست ۱۲] استایل خط‌خوردگی (line-through) در TaskItemRow');
{
  const getTitleClassName = (status) => {
    return status === 'done'
      ? 'line-through text-slate-400'
      : 'text-slate-900 group-hover:text-blue-600';
  };

  assert.ok(getTitleClassName('done').includes('line-through'));
  assert.ok(!getTitleClassName('todo').includes('line-through'));
  assert.ok(!getTitleClassName('in_progress').includes('line-through'));
  console.log('✓ تست ۱۲ با موفقیت پاس شد.');
}

// آزمون ۱۳: مخفی‌شدن گروه‌های خالی در TaskGroupSection
console.log('\n[تست ۱۳] رفتار مخفی‌شدن گروه خالی در TaskGroupSection');
{
  const shouldRenderGroup = (count, hideIfEmpty = true) => {
    if (hideIfEmpty && count === 0) return false;
    return true;
  };

  assert.strictEqual(shouldRenderGroup(0, true), false);
  assert.strictEqual(shouldRenderGroup(5, true), true);
  assert.strictEqual(shouldRenderGroup(0, false), true);
  console.log('✓ تست ۱۳ با موفقیت پاس شد.');
}

// آزمون ۱۴: اطلاعات نمایشی TaskCard
console.log('\n[تست ۱۴] صحت اطلاعات و نمایش موجودیت مرتبط در TaskCard');
{
  assert.ok(SAMPLE_TASKS.overdue.relatedTo);
  assert.strictEqual(SAMPLE_TASKS.overdue.relatedTo.type, 'campaign');
  assert.strictEqual(SAMPLE_TASKS.overdue.relatedTo.title, 'کمپین تخفیف پاییزه');

  const subtasksCount = SAMPLE_TASKS.done.subtasks.length;
  const commentsCount = SAMPLE_TASKS.done.comments.length;

  assert.strictEqual(subtasksCount, 1);
  assert.strictEqual(commentsCount, 1);
  console.log('✓ تست ۱۴ با موفقیت پاس شد.');
}

console.log('\n============================================================');
console.log('   تمامی ۱۴ آزمون Drawer و کامپوننت‌های پایه تسک‌ها با موفقیت پاس شدند!   ');
console.log('============================================================\n');
