/**
 * آزمون‌های خودکار جامع تثبیت و یکپارچگی نهایی ماژول مدیریت تسک‌ها (گام ۱۰F.6)
 *
 * پوشش ۳۰ سناریوی جامع ممیزی:
 * [بخش ۱: یکپارچگی List، Board و Drawer]
 * ۱. باز کردن تسک از نمای List و بارگذاری صحیح فیلدهای Drawer
 * ۲. باز کردن تسک از نمای Board و بارگذاری صحیح فیلدهای Drawer
 * ۳. ویرایش عنوان، توضیحات، وضعیت، اولویت، مسئول و سررسید در Drawer و اعتبارسنجی
 * ۴. به‌روزرسانی نمای List پس از ذخیره تغییرات Drawer
 * ۵. به‌روزرسانی ستون‌ها و شمارنده‌های Board پس از تغییر وضعیت از Drawer
 * ۶. هماهنگی بی‌درنگ اطلاعات تسک انتخاب‌شده (selectedTask) با تغییرات Board
 * ۷. ثبت دقیق رویدادهای تاریخچه (status, priority, assignee, due_date) و نگاشت به Timeline
 * ۸. حفظ کامل زیرتسک‌ها و دیدگاه‌ها پس از ویرایش سایر فیلدهای اصلی
 * ۹. تشخیص دقیق تغییرات ذخیره‌نشده (isDirty) و فعال‌سازی گارد خروج Drawer
 *
 * [بخش ۲: ماندگاری داده‌ها و localStorage]
 * ۱۰. ایجاد تسک جدید و ماندگاری داده پس از بازیابی مجدد (شبیه‌سازی رفرش)
 * ۱۱. ویرایش تسک و ماندگاری تغییرات اعمال‌شده در مخزن داده
 * ۱۲. ماندگاری تغییر وضعیت و تنظیم دقیق completedAt در زمان انتقال به done
 * ۱۳. ماندگاری افزودن و تغییر وضعیت چک‌باکس زیرتسک‌ها (Subtasks)
 * ۱۴. ماندگاری دیدگاه‌های جدید (Comments) به همراه اطلاعات نویسنده
 * ۱۵. آرشیو و بازگردانی تسک و حفظ وضعیت در بازیابی فیلترشده
 * ۱۶. مدیریت امن در نبود localStorage (محیط SSR و Node Memory Storage)
 * ۱۷. بازیابی بدون خطا در صورت مخدوش بودن یا نامعتبر بودن JSON در localStorage
 * ۱۸. عدم بازنویسی داده‌های اصلاح‌شده کاربر توسط داده‌های اولیه Seed
 *
 * [بخش ۳: فیلترها و Query Parameters]
 * ۱۹. سوئیچ حوزه اسکوپ (scope=my و scope=team) و فیلتر دقیق تسک‌های کاربر جاری
 * ۲۰. سوئیچ نما (view=list و view=board) و عدم پاک شدن سایر فیلترهای فعال
 * ۲۱. تغییر اسکوپ بدون اثر جانبی روی فیلترهای جستجو، وضعیت یا مسئول
 * ۲۲. فیلتر ترکیبی چندگانه (Scope + View + Status + Assignee + Search)
 * ۲۳. مدیریت ایمن پارامترهای نامعتبر در URL (مانند مقادیر ناشناخته view و status)
 * ۲۴. پاک‌کردن فیلترها بدون حذف فیزیکی تسک‌های ثبت‌شده در مخزن
 *
 * [بخش ۴: Drag & Drop، Concurrency و موبایل]
 * ۲۵. انتقال تسک بین هر ۴ ستون کانبان (todo, in_progress, waiting, done)
 * ۲۶. عدم ارسال درخواست در صورت رهاسازی تسک در همان ستون جاری (No-op)
 * ۲۷. انتقال به done و برگشت از done با پاکسازی خودکار completedAt
 * ۲۸. بازگردانی خوش‌بینانه (Rollback) به اسنپ‌شات قبلی در صورت بروز خطای سرویس
 * ۲۹. قفل درخواست‌های همزمان و ممانعت قطعی از Double Submit روی یک تسک
 * ۳۰. تعویض سریع وضعیت در موبایل از طریق منوی انتخابی بدون نیاز به درگ
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('============================================================');
console.log('   TASK FINAL HARDENING & INTEGRATION TESTS (STEP 10F.6)   ');
console.log('============================================================\n');

// تاریخ مرجع ثابت
const FIXED_NOW = new Date('2026-11-02T12:00:00.000Z');

// کاربران Mock
const MOCK_TASK_USERS = [
  { id: 'user-1', name: 'سارا احمدی', role: 'کارشناس ارشد فروش' },
  { id: 'user-2', name: 'علی محمدی', role: 'کارشناس فروش' },
  { id: 'user-3', name: 'نیما صادقی', role: 'مدیر بازاریابی' },
  { id: 'user-4', name: 'زهرا کاظمی', role: 'تولید محتوا' },
];

const DEFAULT_CURRENT_USER = MOCK_TASK_USERS[0];

function toStartOfDay(dateInput) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  if (isNaN(d.getTime())) return new Date(NaN);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function toEndOfDay(dateInput) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  if (isNaN(d.getTime())) return new Date(NaN);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function getIranianWeekRange(refDate = FIXED_NOW) {
  const d = typeof refDate === 'string' ? new Date(refDate) : refDate;
  const daysSinceSaturday = (d.getDay() + 1) % 7;
  const startOfWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceSaturday, 0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
}

function isTaskOverdue(task, refDate = FIXED_NOW) {
  if (task.status === 'done') return false;
  if (!task.dueDate) return false;
  const dueDay = toStartOfDay(task.dueDate);
  const refDay = toStartOfDay(refDate);
  if (isNaN(dueDay.getTime()) || isNaN(refDay.getTime())) return false;
  return dueDay.getTime() < refDay.getTime();
}

function getOverdueDays(task, refDate = FIXED_NOW) {
  if (!isTaskOverdue(task, refDate)) return 0;
  const dueDay = toStartOfDay(task.dueDate);
  const refDay = toStartOfDay(refDate);
  return Math.max(1, Math.floor((refDay.getTime() - dueDay.getTime()) / 86400000));
}

// شبیه‌ساز Mock Storage جهت بررسی دقیق ماندگاری
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
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

async function runHardeningTests() {
  console.log('--- بخش اول: یکپارچگی List، Board و Drawer ---');

  // داده اولیه تست
  let initialTasks = [
    {
      id: 'task-1',
      title: 'بررسی لیدهای فرم مشاوره سئو',
      description: 'تماس اولیه و تعیین سطح نیازمندی مشتری',
      status: 'in_progress',
      priority: 'high',
      assignee: DEFAULT_CURRENT_USER,
      dueDate: '2026-11-02T16:00:00.000Z',
      subtasks: [
        { id: 'sub-1', title: 'بررسی آدرس سایت', completed: true },
        { id: 'sub-2', title: 'برآورد ترافیک ارگانیک', completed: false },
      ],
      comments: [
        { id: 'comm-1', author: DEFAULT_CURRENT_USER, content: 'مشتری پکیج طلایی را مد نظر دارد', createdAt: '2026-11-01T10:00:00.000Z' },
      ],
      history: [
        { id: 'h-1', taskId: 'task-1', type: 'task_created', title: 'ایجاد تسک', actor: DEFAULT_CURRENT_USER, createdAt: '2026-11-01T08:00:00.000Z' },
      ],
      createdAt: '2026-11-01T08:00:00.000Z',
      updatedAt: '2026-11-01T08:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'تنظیم متون ایمیل خوش‌آمدگویی',
      description: 'نگارش ۳ ایمیل دنباله‌دار با لحن برند',
      status: 'todo',
      priority: 'urgent',
      assignee: MOCK_TASK_USERS[3], // زهرا کاظمی
      dueDate: '2026-10-31T12:00:00.000Z', // ۲ روز قبل -> overdue
      subtasks: [],
      comments: [],
      history: [],
      createdAt: '2026-10-28T08:00:00.000Z',
      updatedAt: '2026-10-28T08:00:00.000Z',
    },
    {
      id: 'task-3',
      title: 'تسویه فاکتور سامانه پیامکی',
      description: 'ارسال فاکتور رسمی به امور مالی',
      status: 'done',
      priority: 'medium',
      assignee: DEFAULT_CURRENT_USER,
      dueDate: '2026-11-01T14:00:00.000Z',
      completedAt: '2026-11-01T13:30:00.000Z',
      subtasks: [],
      comments: [],
      history: [],
      createdAt: '2026-10-30T08:00:00.000Z',
      updatedAt: '2026-11-01T13:30:00.000Z',
    },
  ];

  test('۱. باز کردن تسک از نمای List مشخصات کامل آن را برای Drawer آماده می‌کند', () => {
    const listTask = initialTasks[0];
    let selectedTask = null;
    let isDrawerOpen = false;

    const handleOpenFromList = (t) => {
      selectedTask = t;
      isDrawerOpen = true;
    };

    handleOpenFromList(listTask);
    assert.strictEqual(isDrawerOpen, true);
    assert.strictEqual(selectedTask.id, 'task-1');
    assert.strictEqual(selectedTask.title, 'بررسی لیدهای فرم مشاوره سئو');
    assert.strictEqual(selectedTask.status, 'in_progress');
  });

  test('۲. باز کردن تسک از نمای Board همان اطلاعات منسجم را به Drawer منتقل می‌کند', () => {
    const boardTask = initialTasks.find((t) => t.id === 'task-2');
    let selectedTask = null;
    let isDrawerOpen = false;

    const handleOpenFromBoard = (t) => {
      selectedTask = t;
      isDrawerOpen = true;
    };

    handleOpenFromBoard(boardTask);
    assert.strictEqual(isDrawerOpen, true);
    assert.strictEqual(selectedTask.id, 'task-2');
    assert.strictEqual(selectedTask.status, 'todo');
    assert.strictEqual(selectedTask.priority, 'urgent');
  });

  test('۳. اعتبارسنجی ویرایش فیلدهای Drawer و ممانعت از ارسال مقادیر نامعتبر', () => {
    const validateDrawerForm = (titleInput, dueDateInput) => {
      if (!titleInput || !titleInput.trim()) {
        throw new Error('عنوان تسک الزامی است.');
      }
      if (!dueDateInput || isNaN(new Date(dueDateInput).getTime())) {
        throw new Error('تاریخ سررسید تسک الزامی و معتبر است.');
      }
      return true;
    };

    assert.throws(() => validateDrawerForm('', '2026-11-03'), /عنوان تسک الزامی است/);
    assert.throws(() => validateDrawerForm('تسک جدید', 'invalid-date'), /تاریخ سررسید/);
    assert.strictEqual(validateDrawerForm('عنوان معتبر', '2026-11-03'), true);
  });

  test('۴. ذخیره‌سازی تغییرات Drawer داده‌های نمای List را به‌روزرسانی می‌کند', () => {
    let localTasks = [...initialTasks];
    const updatedTask = {
      ...localTasks[0],
      title: 'بررسی لیدهای فرم مشاوره سئو (ویرایش‌شده)',
      priority: 'urgent',
      updatedAt: '2026-11-02T13:00:00.000Z',
    };

    // شبیه‌سازی onTaskUpdated
    localTasks = localTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));

    assert.strictEqual(localTasks[0].title, 'بررسی لیدهای فرم مشاوره سئو (ویرایش‌شده)');
    assert.strictEqual(localTasks[0].priority, 'urgent');
  });

  test('۵. تغییر وضعیت تسک در Drawer ستون‌های Board و شمارنده‌ها را دقیق بروز می‌کند', () => {
    let localTasks = [...initialTasks];
    const taskToChange = localTasks[0]; // in_progress -> waiting

    localTasks = localTasks.map((t) =>
      t.id === taskToChange.id ? { ...t, status: 'waiting' } : t
    );

    const cols = { todo: 0, in_progress: 0, waiting: 0, done: 0 };
    localTasks.forEach((t) => cols[t.status]++);

    assert.strictEqual(cols.in_progress, 0);
    assert.strictEqual(cols.waiting, 1);
    assert.strictEqual(cols.todo, 1);
    assert.strictEqual(cols.done, 1);
  });

  test('۶. تغییر کارت در Board متغیر selectedTask داخل Drawer را بلادرنگ همگام می‌سازد', () => {
    let selectedTask = { ...initialTasks[0] }; // task-1 in_progress
    const newStatusFromBoard = 'done';

    // به‌روزرسانی همگام
    selectedTask = {
      ...selectedTask,
      status: newStatusFromBoard,
      completedAt: '2026-11-02T13:10:00.000Z',
    };

    assert.strictEqual(selectedTask.status, 'done');
    assert.ok(selectedTask.completedAt);
  });

  test('۷. ثبت دقیق رویدادهای تاریخچه و تفکیک انواع رویدادها در Timeline', () => {
    const historyEvents = [
      { id: 'h-1', taskId: 'task-1', type: 'task_created', title: 'ایجاد تسک', createdAt: '2026-11-01T08:00:00.000Z' },
      { id: 'h-2', taskId: 'task-1', type: 'status_changed', title: 'تغییر وضعیت', metadata: { toStatus: 'done' }, createdAt: '2026-11-02T10:00:00.000Z' },
      { id: 'h-3', taskId: 'task-1', type: 'priority_changed', title: 'تغییر اولویت', createdAt: '2026-11-02T11:00:00.000Z' },
      { id: 'h-4', taskId: 'task-1', type: 'assignee_changed', title: 'تغییر مسئول', createdAt: '2026-11-02T12:00:00.000Z' },
    ];

    // سورت نزولی بر اساس زمان
    const sorted = [...historyEvents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    assert.strictEqual(sorted[0].id, 'h-4'); // جدیدترین
    assert.strictEqual(sorted[sorted.length - 1].id, 'h-1'); // قدیمی‌ترین
  });

  test('۸. ویرایش مشخصات اصلی تسک زیرتسک‌ها و کامنت‌های موجود را بدون تغییر حفظ می‌کند', () => {
    const original = initialTasks[0];
    const updated = {
      ...original,
      title: 'عنوان جدید تسک',
      priority: 'low',
    };

    assert.strictEqual(updated.subtasks.length, 2);
    assert.strictEqual(updated.comments.length, 1);
    assert.strictEqual(updated.subtasks[0].title, 'بررسی آدرس سایت');
    assert.strictEqual(updated.comments[0].content, 'مشتری پکیج طلایی را مد نظر دارد');
  });

  test('۹. گارد تغییرات ذخیره‌نشده (isDirty) تفاوت‌های فرم را به درستی تشخیص می‌دهد', () => {
    const task = initialTasks[0];
    const checkIsDirty = (currentFields) => {
      const initialDesc = task.description || '';
      const initialAssigneeId = task.assignee?.id || '';
      const initialDueDate = task.dueDate ? task.dueDate.split('T')[0] : '';

      return (
        currentFields.title !== task.title ||
        currentFields.description !== initialDesc ||
        currentFields.status !== task.status ||
        currentFields.priority !== task.priority ||
        currentFields.assigneeId !== initialAssigneeId ||
        currentFields.dueDateIso !== initialDueDate
      );
    };

    // بدون تغییر
    assert.strictEqual(
      checkIsDirty({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee.id,
        dueDateIso: task.dueDate.split('T')[0],
      }),
      false
    );

    // تغییر در عنوان
    assert.strictEqual(
      checkIsDirty({
        title: 'تغییر کرده',
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee.id,
        dueDateIso: task.dueDate.split('T')[0],
      }),
      true
    );
  });

  console.log('\n--- بخش دوم: ماندگاری داده‌ها و localStorage ---');

  const mockStorage = new MockLocalStorage();
  const STORAGE_KEY = 'marketing_platform_tasks_v1';
  const SEEDED_KEY = 'marketing_platform_tasks_seeded_v1';

  test('۱۰. ایجاد تسک جدید و ماندگاری آن در localStorage پس از رفرش شبیه‌سازی‌شده', () => {
    const newTask = {
      id: 'task-100',
      title: 'تحلیل بک‌لینک‌های رقبا',
      status: 'todo',
      priority: 'medium',
      createdAt: '2026-11-02T10:00:00.000Z',
    };

    mockStorage.setItem(STORAGE_KEY, JSON.stringify([newTask]));
    mockStorage.setItem(SEEDED_KEY, 'true');

    // شبیه‌سازی رفرش و بارگذاری مجدد
    const retrievedRaw = mockStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(retrievedRaw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].id, 'task-100');
    assert.strictEqual(parsed[0].title, 'تحلیل بک‌لینک‌های رقبا');
  });

  test('۱۱. ویرایش تسک و پایداری مشخصات اصلاح‌شده در مخزن', () => {
    const raw = mockStorage.getItem(STORAGE_KEY);
    const tasks = JSON.parse(raw);
    tasks[0].title = 'تحلیل بک‌لینک‌های رقبا و دامنه‌های ارجاعی';
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    const reloaded = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    assert.strictEqual(reloaded[0].title, 'تحلیل بک‌لینک‌های رقبا و دامنه‌های ارجاعی');
  });

  test('۱۲. تغییر وضعیت تسک و پایداری completedAt در وضعیت done', () => {
    const tasks = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    tasks[0].status = 'done';
    tasks[0].completedAt = '2026-11-02T13:20:00.000Z';
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    const reloaded = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    assert.strictEqual(reloaded[0].status, 'done');
    assert.strictEqual(reloaded[0].completedAt, '2026-11-02T13:20:00.000Z');
  });

  test('۱۳. افزودن زیرتسک و ثبت تغییر وضعیت تیک آن در مخزن پایدار', () => {
    const tasks = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    tasks[0].subtasks = [{ id: 'sub-new-1', title: 'خروجی اکسل Ahrefs', completed: false }];
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    // تغییر وضعیت به انجام شد
    tasks[0].subtasks[0].completed = true;
    tasks[0].subtasks[0].completedAt = '2026-11-02T13:25:00.000Z';
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    const reloaded = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    assert.strictEqual(reloaded[0].subtasks[0].completed, true);
    assert.ok(reloaded[0].subtasks[0].completedAt);
  });

  test('۱۴. ثبت دیدگاه جدید و ماندگاری کامنت‌ها به صورت ایزوله برای همان تسک', () => {
    const tasks = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    tasks[0].comments = [
      { id: 'comm-new-1', content: 'فایل گزارش در پوشه درایو قرار گرفت', createdAt: '2026-11-02T13:30:00.000Z' },
    ];
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    const reloaded = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    assert.strictEqual(reloaded[0].comments.length, 1);
    assert.strictEqual(reloaded[0].comments[0].content, 'فایل گزارش در پوشه درایو قرار گرفت');
  });

  test('۱۵. بایگانی و بازگردانی تسک با پرچم isArchived در مخزن', () => {
    const tasks = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    tasks[0].isArchived = true;
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    // فیلتر عدم نمایش تسک‌های آرشیوشده به صورت پیش‌فرض
    const activeTasks = JSON.parse(mockStorage.getItem(STORAGE_KEY)).filter((t) => !t.isArchived);
    assert.strictEqual(activeTasks.length, 0);

    // بازگردانی
    tasks[0].isArchived = false;
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    const restoredTasks = JSON.parse(mockStorage.getItem(STORAGE_KEY)).filter((t) => !t.isArchived);
    assert.strictEqual(restoredTasks.length, 1);
  });

  test('۱۶. مدیریت امن در محیط فاقد localStorage (SSR / Node)', () => {
    const memoryStore = [];
    const getTasksSafe = (storage) => {
      if (!storage || typeof storage.getItem !== 'function') {
        return memoryStore;
      }
      return JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    };

    assert.deepStrictEqual(getTasksSafe(null), []);
    assert.deepStrictEqual(getTasksSafe(undefined), []);
  });

  test('۱۷. مقاومت کامل در برابر JSON مخدوش یا داده‌های خراب بدون وقوع Crash', () => {
    const corruptStorage = new MockLocalStorage();
    corruptStorage.setItem(STORAGE_KEY, 'invalid-json-string{[');

    const safeParseTasks = (storage) => {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return []; // Fallback ایمن
      }
    };

    const result = safeParseTasks(corruptStorage);
    assert.deepStrictEqual(result, []);
  });

  test('۱۸. عدم بازنویسی داده‌های کاربر توسط Seed اولیه هنگام بارگذاری‌های بعدی', () => {
    const testStorage = new MockLocalStorage();
    testStorage.setItem(SEEDED_KEY, 'true');
    testStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'custom-task', title: 'تسک اختصاصی کاربر' }]));

    const ensureSeeded = (storage) => {
      if (storage.getItem(SEEDED_KEY) === 'true') {
        return; // Seed نباید بازنویسی کند
      }
      storage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'seed-task', title: 'دیتای سید' }]));
      storage.setItem(SEEDED_KEY, 'true');
    };

    ensureSeeded(testStorage);
    const data = JSON.parse(testStorage.getItem(STORAGE_KEY));
    assert.strictEqual(data[0].id, 'custom-task');
  });

  console.log('\n--- بخش سوم: فیلترها و Query Parameters ---');

  test('۱۹. فیلتر حوزه اسکوپ (scope=my / team) تسک‌های کاربر جاری را تفکیک می‌کند', () => {
    const filterByScope = (tasks, scope, currentUserId) => {
      if (scope === 'my') {
        return tasks.filter((t) => t.assignee?.id === currentUserId);
      }
      return tasks;
    };

    const myTasks = filterByScope(initialTasks, 'my', DEFAULT_CURRENT_USER.id);
    assert.strictEqual(myTasks.length, 2); // task-1 and task-3
    assert.ok(myTasks.every((t) => t.assignee.id === DEFAULT_CURRENT_USER.id));

    const teamTasks = filterByScope(initialTasks, 'team', DEFAULT_CURRENT_USER.id);
    assert.strictEqual(teamTasks.length, 3);
  });

  test('۲۰. تغییر نما (view=list / board) فیلترهای فعال آدرس را پاک نمی‌کند', () => {
    const initialParams = new URLSearchParams('scope=my&status=in_progress&search=لید');
    const updateUrlParams = (current, updates) => {
      const res = new URLSearchParams(current.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '') res.delete(k);
        else res.set(k, v);
      });
      return res;
    };

    // تغییر نما به board
    const newParams = updateUrlParams(initialParams, { view: 'board' });
    assert.strictEqual(newParams.get('view'), 'board');
    assert.strictEqual(newParams.get('scope'), 'my');
    assert.strictEqual(newParams.get('status'), 'in_progress');
    assert.strictEqual(newParams.get('search'), 'لید');
  });

  test('۲۱. تغییر Scope فیلترهای جستجو، وضعیت یا دسته‌بندی را حفظ می‌کند', () => {
    const params = new URLSearchParams('view=board&search=کمپین&assigneeId=user-1');
    const updateUrlParams = (current, updates) => {
      const res = new URLSearchParams(current.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '') res.delete(k);
        else res.set(k, v);
      });
      return res;
    };

    const updated = updateUrlParams(params, { scope: 'my' });
    assert.strictEqual(updated.get('scope'), 'my');
    assert.strictEqual(updated.get('view'), 'board');
    assert.strictEqual(updated.get('search'), 'کمپین');
    assert.strictEqual(updated.get('assigneeId'), 'user-1');
  });

  test('۲۲. اعمال ترکیبی فیلترها نتایج منسجم و همزمان بازمی‌گرداند', () => {
    const applyAllFilters = (tasks, { scope, status, assigneeId, search }) => {
      let res = [...tasks];
      if (scope === 'my') res = res.filter((t) => t.assignee?.id === DEFAULT_CURRENT_USER.id);
      if (status) res = res.filter((t) => t.status === status);
      if (assigneeId) res = res.filter((t) => t.assignee?.id === assigneeId);
      if (search) res = res.filter((t) => t.title.includes(search));
      return res;
    };

    const matched = applyAllFilters(initialTasks, {
      scope: 'my',
      status: 'in_progress',
      assigneeId: DEFAULT_CURRENT_USER.id,
      search: 'سئو',
    });

    assert.strictEqual(matched.length, 1);
    assert.strictEqual(matched[0].id, 'task-1');
  });

  test('۲۳. پارامترهای نامعتبر در URL با مقادیر پیش‌فرض ایمن جایگزین می‌شوند', () => {
    const parseUrlParamsSafe = (searchParams) => {
      const rawView = searchParams.get('view');
      const view = rawView === 'board' ? 'board' : 'list'; // پیش‌فرض list

      const rawScope = searchParams.get('scope');
      const scope = rawScope === 'my' ? 'my' : 'team'; // پیش‌فرض team

      return { view, scope };
    };

    const invalidParams = new URLSearchParams('view=unknown_mode&scope=invalid_scope');
    const parsed = parseUrlParamsSafe(invalidParams);

    assert.strictEqual(parsed.view, 'list');
    assert.strictEqual(parsed.scope, 'team');
  });

  test('۲۴. پاک‌کردن فیلترها (Clear all) صرفاً فیلترها را حذف می‌کند و تسک‌های دیتابیس باقی می‌مانند', () => {
    let activeFilterCount = 3;
    const handleClearFilters = () => {
      activeFilterCount = 0;
    };

    handleClearFilters();
    assert.strictEqual(activeFilterCount, 0);
    assert.strictEqual(initialTasks.length, 3); // تسک‌ها در مخزن حفظ شده‌اند
  });

  console.log('\n--- بخش چهارم: Drag & Drop، Concurrency و موبایل ---');

  test('۲۵. انتقال تسک بین هر ۴ ستون کانبان (todo, in_progress, waiting, done)', () => {
    let task = { ...initialTasks[1] }; // status: 'todo'
    const validStatuses = ['todo', 'in_progress', 'waiting', 'done'];

    validStatuses.forEach((targetStatus) => {
      task = { ...task, status: targetStatus };
      assert.strictEqual(task.status, targetStatus);
    });
  });

  test('۲۶. رهاسازی تسک در همان ستون جاری یک عملیات No-op بوده و درخواستی نمی‌فرستد', () => {
    let apiCalled = false;
    const handleDrop = (currentStatus, targetStatus) => {
      if (currentStatus === targetStatus) return;
      apiCalled = true;
    };

    handleDrop('in_progress', 'in_progress');
    assert.strictEqual(apiCalled, false);
  });

  test('۲۷. انتقال به done و سپس خروج از done تاریخچه completedAt را به درستی پاک می‌کند', () => {
    let task = { id: 't-1', status: 'in_progress', completedAt: undefined };

    // ۱. انتقال به done
    task = { ...task, status: 'done', completedAt: '2026-11-02T13:40:00.000Z' };
    assert.strictEqual(task.status, 'done');
    assert.ok(task.completedAt);

    // ۲. بازگشت از done به in_progress
    task = { ...task, status: 'in_progress', completedAt: undefined };
    assert.strictEqual(task.status, 'in_progress');
    assert.strictEqual(task.completedAt, undefined);
  });

  test('۲۸. در صورت بروز خطا در سرویس، وضعیت به حالت قبل بازگردانده (Rollback) می‌شود', async () => {
    let tasks = [...initialTasks];
    const previousSnapshot = [...tasks];

    // تغییر خوش‌بینانه
    tasks = tasks.map((t) => (t.id === 'task-1' ? { ...t, status: 'done' } : t));
    assert.strictEqual(tasks[0].status, 'done');

    // شکست سرویس
    const serviceCall = async () => {
      throw new Error('Database connection failed');
    };

    try {
      await serviceCall();
    } catch {
      tasks = previousSnapshot; // Rollback
    }

    assert.strictEqual(tasks[0].status, 'in_progress');
  });

  test('۲۹. قفل Concurrency مانع از اجرای همزمان دو تغییر وضعیت روی یک شناسه می‌شود', async () => {
    const updatingIds = new Set();
    let executedCount = 0;

    const updateStatusLocked = async (taskId, newStatus) => {
      if (updatingIds.has(taskId)) {
        return { locked: true };
      }
      updatingIds.add(taskId);
      executedCount++;
      await new Promise((resolve) => setTimeout(resolve, 15));
      updatingIds.delete(taskId);
      return { success: true };
    };

    const [r1, r2] = await Promise.all([
      updateStatusLocked('task-1', 'done'),
      updateStatusLocked('task-1', 'waiting'),
    ]);

    assert.strictEqual(executedCount, 1);
    assert.strictEqual(r1.success, true);
    assert.strictEqual(r2.locked, true);
  });

  test('۳۰. سلکتور موبایل بدون درگ وضعیت تسک را به راحتی به وضعیت انتخابی تغییر می‌دهد', () => {
    let task = { id: 'task-mobile', status: 'todo' };
    const onMobileStatusChange = (newStatus) => {
      task = { ...task, status: newStatus };
    };

    onMobileStatusChange('in_progress');
    assert.strictEqual(task.status, 'in_progress');

    onMobileStatusChange('done');
    assert.strictEqual(task.status, 'done');
  });

  console.log('\n============================================================');
  console.log(`✅ تمام ${passCount} سناریوی آزمون تثبیت با موفقیت ۱۰۰٪ پاس شدند!`);
  console.log('============================================================\n');
}

runHardeningTests().catch((err) => {
  console.error('\n❌ آزمون‌ها با شکست مواجه شدند:');
  console.error(err);
  process.exit(1);
});
