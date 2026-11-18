import type { Task, TaskUser, TaskHistoryEvent, SubTask, TaskComment } from '../types';

export const STORAGE_KEY_TASKS = 'marketing_platform_tasks_v1';
export const STORAGE_KEY_SEEDED = 'marketing_platform_tasks_seeded_v1';

// حافظه موقت درون برنامه برای سناریوهای SSR، محیط تست Node یا عدم دسترسی به localStorage
let memoryTasks: Task[] = [];
let memorySeeded = false;

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * کاربران استاندارد ماژول تسک (منطبق بر کاربران سایر ماژول‌های پروژه)
 */
export const MOCK_TASK_USERS: TaskUser[] = [
  {
    id: 'user-1',
    name: 'سارا احمدی',
    role: 'کارشناس ارشد فروش',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    email: 'sara.ahmadi@example.com',
  },
  {
    id: 'user-2',
    name: 'علی محمدی',
    role: 'کارشناس فروش و پیگیری',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    email: 'ali.mohammadi@example.com',
  },
  {
    id: 'user-3',
    name: 'نیما صادقی',
    role: 'مدیر بازاریابی دیجیتال',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
    email: 'nima.sadeghi@example.com',
  },
  {
    id: 'user-4',
    name: 'زهرا کاظمی',
    role: 'کارشناس تولید محتوا و وبینار',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    email: 'zahra.kazemi@example.com',
  },
];

/**
 * تولید داده‌های Seed اولیه بر اساس تاریخ مرجع
 * با انتساب زمان‌های نسبی پویا تا داده‌ها با گذشت زمان منقضی نشوند.
 */
export function createInitialTaskSeedData(referenceDateInput?: Date | string): Task[] {
  const ref = referenceDateInput
    ? typeof referenceDateInput === 'string'
      ? new Date(referenceDateInput)
      : referenceDateInput
    : new Date();

  const baseTime = isNaN(ref.getTime()) ? new Date().getTime() : ref.getTime();
  const msInHour = 3600000;
  const msInDay = 86400000;

  const tNow = new Date(baseTime).toISOString();
  const t2DaysAgo = new Date(baseTime - 2 * msInDay).toISOString();
  const t1DayAgo = new Date(baseTime - 1 * msInDay).toISOString();
  const tTodayDue = new Date(baseTime + 4 * msInHour).toISOString(); // چند ساعت دیگر امروز
  const tTomorrow = new Date(baseTime + 1 * msInDay).toISOString();
  const t3DaysLater = new Date(baseTime + 3 * msInDay).toISOString();
  const t10DaysLater = new Date(baseTime + 10 * msInDay).toISOString();
  const t14DaysLater = new Date(baseTime + 14 * msInDay).toISOString();

  const user1 = MOCK_TASK_USERS[0];
  const user2 = MOCK_TASK_USERS[1];
  const user3 = MOCK_TASK_USERS[2];
  const user4 = MOCK_TASK_USERS[3];

  const tasks: Task[] = [
    {
      id: 'task-101',
      title: 'آماده‌سازی بنرهای تبلیغاتی جشنواره پاییزه',
      description: 'طراحی ۳ سایز بنر گیف و بنر استاتیک برای تبلیغات کلیکی یکتانت و صباویژن',
      assignee: user4,
      dueDate: t2DaysAgo, // سررسید ۲ روز قبل -> در دسته عقب‌افتاده
      priority: 'urgent',
      status: 'todo',
      relatedTo: {
        type: 'campaign',
        id: 'camp-1',
        title: 'کمپین تخفیف پاییزه - گوگل ادز',
      },
      sop: {
        id: 'sop-1',
        title: 'دستورالعمل استانداردهای طراحی بنرهای کلیکی',
      },
      subtasks: [
        {
          id: 'sub-101-1',
          title: 'طراحی سایز ۳۰۰ در ۲۵۰ مستطیل متوسط',
          completed: true,
          createdAt: t2DaysAgo,
          completedAt: t1DayAgo,
        },
        {
          id: 'sub-101-2',
          title: 'طراحی سایز ۱۲۰ در ۶۰۰ اسلایدر کناری',
          completed: false,
          createdAt: t2DaysAgo,
        },
        {
          id: 'sub-101-3',
          title: 'بهینه‌سازی حجم فایل‌ها برای زیر ۱۵۰ کیلوبایت',
          completed: false,
          createdAt: t2DaysAgo,
        },
      ],
      comments: [
        {
          id: 'comm-101-1',
          author: user3,
          content: 'زهرا جان لطفاً پالت رنگی اصلی سازمانی مطابق هویت برند فراموش نشود.',
          createdAt: t1DayAgo,
        },
      ],
      history: [
        {
          id: 'hist-101-1',
          taskId: 'task-101',
          type: 'task_created',
          actor: user3,
          title: 'ایجاد تسک',
          description: 'تسک توسط نیما صادقی ایجاد شد',
          createdAt: t2DaysAgo,
        },
        {
          id: 'hist-101-2',
          taskId: 'task-101',
          type: 'subtask_toggled',
          actor: user4,
          title: 'تکمیل زیرتسک',
          description: 'زیرتسک «طراحی سایز ۳۰۰ در ۲۵۰ مستطیل متوسط» به پایان رسید',
          createdAt: t1DayAgo,
        },
      ],
      createdAt: t2DaysAgo,
      updatedAt: t1DayAgo,
    },
    {
      id: 'task-102',
      title: 'بررسی و پالایش لیدهای ورودی روز گذشته',
      description: 'غربالگری سرنخ‌های ورودی فرم لندینگ و تفکیک لیدهای معتبر جهت ارجاع به کارشناس فروش',
      assignee: user1,
      dueDate: tTodayDue, // سررسید امروز -> در دسته امروز
      priority: 'high',
      status: 'in_progress',
      relatedTo: {
        type: 'lead',
        id: 'lead-101',
        title: 'پرهام رادمنش (فناوری نوآوران)',
      },
      subtasks: [
        {
          id: 'sub-102-1',
          title: 'بررسی صحت شماره‌های تلفن همراه و ایمیل',
          completed: true,
          createdAt: t1DayAgo,
          completedAt: tNow,
        },
        {
          id: 'sub-102-2',
          title: 'بررسی بودجه اعلامی شرکت‌ها',
          completed: false,
          createdAt: t1DayAgo,
        },
      ],
      comments: [],
      history: [
        {
          id: 'hist-102-1',
          taskId: 'task-102',
          type: 'task_created',
          actor: user1,
          title: 'ایجاد تسک',
          description: 'تسک برای پیگیری سرنخ‌های روز گذشته ایجاد شد',
          createdAt: t1DayAgo,
        },
      ],
      createdAt: t1DayAgo,
      updatedAt: tNow,
    },
    {
      id: 'task-103',
      title: 'هماهنگی تست صدا و تصویر وبینار بازاریابی دیجیتال',
      description: 'تست زیرساخت پلتفرم اسکای‌روم و میکروفون مدرس برای رویداد آنلاین پنج‌شنبه',
      assignee: user2,
      dueDate: tTomorrow, // سررسید فردا -> این هفته
      priority: 'medium',
      status: 'waiting',
      relatedTo: {
        type: 'webinar',
        id: 'webinar-1',
        title: 'وبینار استراتژی جذب سرنخ‌های B2B',
      },
      sop: {
        id: 'sop-2',
        title: 'چک‌لیست بررسی فنی و زیرساخت قبل از وبینار',
      },
      subtasks: [
        {
          id: 'sub-103-1',
          title: 'تست سرعت آپلود خط اختصاصی',
          completed: false,
          createdAt: t1DayAgo,
        },
        {
          id: 'sub-103-2',
          title: 'ارسال لینک اختصاصی دسترسی مدرس',
          completed: false,
          createdAt: t1DayAgo,
        },
      ],
      comments: [
        {
          id: 'comm-103-1',
          author: user2,
          content: 'منتظر تأیید ساعت حضور مدرس برای تست نهایی هستم.',
          createdAt: tNow,
        },
      ],
      history: [
        {
          id: 'hist-103-1',
          taskId: 'task-103',
          type: 'task_created',
          actor: user3,
          title: 'ایجاد تسک',
          description: 'تسک توسط نیما صادقی ایجاد و به علی محمدی محول شد',
          createdAt: t1DayAgo,
        },
      ],
      createdAt: t1DayAgo,
      updatedAt: tNow,
    },
    {
      id: 'task-104',
      title: 'تنظیم کمپین ریتارگتینگ در گوگل ادز',
      description: 'ایجاد لیست مخاطبان بازدیدکننده صفحه قیمت‌ها در ۳۰ روز گذشته و اختصاص بودجه مجزا',
      assignee: user3,
      dueDate: t3DaysLater, // سررسید ۳ روز بعد -> این هفته
      priority: 'high',
      status: 'todo',
      relatedTo: {
        type: 'campaign',
        id: 'camp-2',
        title: 'کمپین لید اینستاگرام و ادز',
      },
      subtasks: [],
      comments: [],
      history: [
        {
          id: 'hist-104-1',
          taskId: 'task-104',
          type: 'task_created',
          actor: user3,
          title: 'ایجاد تسک',
          description: 'ایجاد تسک تنظیم ریتارگتینگ',
          createdAt: t1DayAgo,
        },
      ],
      createdAt: t1DayAgo,
      updatedAt: t1DayAgo,
    },
    {
      id: 'task-105',
      title: 'تدوین گزارش ماهانه نرخ تبدیل لیدها و تحلیل شاخص ROI',
      description: 'استخراج داده‌های تبدیل از پنل لیدها و تحلیل انطباق هزینه به ازای هر لید با شاخص‌های هدف',
      assignee: user1,
      dueDate: t10DaysLater, // سررسید ۱۰ روز بعد -> بعداً
      priority: 'low',
      status: 'waiting',
      relatedTo: {
        type: 'campaign',
        id: 'camp-1',
        title: 'کمپین تخفیف پاییزه - گوگل ادز',
      },
      subtasks: [],
      comments: [],
      history: [
        {
          id: 'hist-105-1',
          taskId: 'task-105',
          type: 'task_created',
          actor: user1,
          title: 'ایجاد تسک',
          description: 'ایجاد تسک آماده‌سازی گزارش ماهانه',
          createdAt: tNow,
        },
      ],
      createdAt: tNow,
      updatedAt: tNow,
    },
    {
      id: 'task-106',
      title: 'ارسال پیش‌فاکتور رسمی برای شرکت فناوری نوآوران',
      description: 'ارسال فایل پیش‌فاکتور پلن سالانه همراه با قرارداد خدمات پشتیبانی',
      assignee: user2,
      dueDate: t1DayAgo,
      priority: 'medium',
      status: 'done', // وضعیت تکمیل‌شده -> دسته انجام‌شده
      completedAt: t1DayAgo,
      relatedTo: {
        type: 'lead',
        id: 'lead-101',
        title: 'پرهام رادمنش (فناوری نوآوران)',
      },
      subtasks: [
        {
          id: 'sub-106-1',
          title: 'تأییدیه مدیر مالی برای ۵ درصد تخفیف نقدی',
          completed: true,
          createdAt: t2DaysAgo,
          completedAt: t2DaysAgo,
        },
        {
          id: 'sub-106-2',
          title: 'ارسال نسخه پی‌دی‌اف پیش‌فاکتور به ایمیل رابط شرکت',
          completed: true,
          createdAt: t2DaysAgo,
          completedAt: t1DayAgo,
        },
      ],
      comments: [],
      history: [
        {
          id: 'hist-106-1',
          taskId: 'task-106',
          type: 'task_created',
          actor: user2,
          title: 'ایجاد تسک',
          createdAt: t2DaysAgo,
        },
        {
          id: 'hist-106-2',
          taskId: 'task-106',
          type: 'status_changed',
          actor: user2,
          title: 'تغییر وضعیت تسک',
          description: 'تسک به عنوان انجام شد علامت خورد',
          createdAt: t1DayAgo,
        },
      ],
      createdAt: t2DaysAgo,
      updatedAt: t1DayAgo,
    },
    {
      id: 'task-107',
      title: 'تأیید متن پیامک‌های یادآوری روز وبینار',
      description: 'هماهنگی پترن‌های پیامکی با پنل ارسال اس‌ام‌اس خدماتی جهت جلوگیری از ارسال تبلیغاتی مسدود',
      assignee: user4,
      dueDate: t2DaysAgo,
      priority: 'urgent',
      status: 'done', // وضعیت تکمیل‌شده
      completedAt: t2DaysAgo,
      relatedTo: {
        type: 'webinar',
        id: 'webinar-1',
        title: 'وبینار استراتژی جذب سرنخ‌های B2B',
      },
      subtasks: [],
      comments: [],
      history: [
        {
          id: 'hist-107-1',
          taskId: 'task-107',
          type: 'task_created',
          actor: user4,
          title: 'ایجاد تسک',
          createdAt: t2DaysAgo,
        },
      ],
      createdAt: t2DaysAgo,
      updatedAt: t2DaysAgo,
    },
    {
      id: 'task-108',
      title: 'بررسی ایده پیاده‌سازی فرم تعاملی چندمرحله‌ای',
      description: 'بررسی و مقایسه فرم‌های لید چندمرحله‌ای نسبت به فرم‌های تک‌مرحله‌ای در نرخ تبدیل',
      assignee: undefined, // بدون مسئول
      dueDate: t14DaysLater, // سررسید ۱۴ روز بعد -> بعداً
      priority: 'low',
      status: 'todo',
      subtasks: [],
      comments: [],
      history: [
        {
          id: 'hist-108-1',
          taskId: 'task-108',
          type: 'task_created',
          actor: user3,
          title: 'ایجاد تسک',
          createdAt: tNow,
        },
      ],
      createdAt: tNow,
      updatedAt: tNow,
    },
  ];

  return tasks;
}

/**
 * اطمینان از وجود داده‌های Seed اولیه در صورت خالی بودن و عدم مقداردهی قبلی
 */
export function ensureTaskStorageInitialized(referenceDateInput?: Date | string): void {
  if (isClient()) {
    try {
      const isSeeded = window.localStorage.getItem(STORAGE_KEY_SEEDED);
      if (isSeeded === 'true') {
        return;
      }

      const existingRaw = window.localStorage.getItem(STORAGE_KEY_TASKS);
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
            return;
          }
        } catch {
          // اگر داده خراب بود، با Seed بازسازی می‌شود
        }
      }

      const seedData = createInitialTaskSeedData(referenceDateInput);
      window.localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(seedData));
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    } catch (e) {
      console.warn('Task Storage: LocalStorage initialization failed, fallback to memory', e);
      if (!memorySeeded) {
        memoryTasks = createInitialTaskSeedData(referenceDateInput);
        memorySeeded = true;
      }
    }
  } else {
    // محیط سرور یا Node
    if (!memorySeeded) {
      memoryTasks = createInitialTaskSeedData(referenceDateInput);
      memorySeeded = true;
    }
  }
}

/**
 * دریافت لیست کامل تسک‌ها از مخزن داده
 */
export function getStoredTasks(referenceDateInput?: Date | string): Task[] {
  ensureTaskStorageInitialized(referenceDateInput);

  if (isClient()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_TASKS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.error('Task Storage: Failed to read from localStorage', e);
      return memoryTasks;
    }
  }

  return memoryTasks;
}

/**
 * ذخیره لیست تسک‌ها در مخزن داده
 */
export function saveStoredTasks(tasks: Task[]): void {
  memoryTasks = [...tasks];

  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      window.localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    } catch (e) {
      console.error('Task Storage: Failed to save to localStorage', e);
    }
  }
}

/**
 * دریافت یک تسک با شناسه
 */
export function getStoredTaskById(id: string): Task | null {
  const all = getStoredTasks();
  return all.find((t) => t.id === id) || null;
}

/**
 * ایجاد یک تسک جدید در مخزن
 */
export function createStoredTask(task: Task): Task {
  const all = getStoredTasks();
  const updated = [task, ...all];
  saveStoredTasks(updated);
  return task;
}

/**
 * به‌روزرسانی مشخصات یک تسک
 */
export function updateStoredTask(id: string, updates: Partial<Task>): Task {
  const all = getStoredTasks();
  const index = all.findIndex((t) => t.id === id);

  if (index === -1) {
    throw new Error(`تسک با شناسه ${id} یافت نشد.`);
  }

  const existing = all[index];
  const updatedTask: Task = {
    ...existing,
    ...updates,
    id: existing.id, // شناسه هرگز نباید تغییر کند
    updatedAt: updates.updatedAt || new Date().toISOString(),
  };

  all[index] = updatedTask;
  saveStoredTasks(all);
  return updatedTask;
}

/**
 * حذف فیزیکی تسک از مخزن
 */
export function deleteStoredTask(id: string): boolean {
  const all = getStoredTasks();
  const filtered = all.filter((t) => t.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  saveStoredTasks(filtered);
  return true;
}

/**
 * پاک‌سازی کامل اطلاعات جهت تست یا بازنشانی
 * نکته: seeded فلگ ریست می‌شود تا بتوان دوباره دیتای تازه ریخت
 */
export function clearTaskStorage(): void {
  memoryTasks = [];
  memorySeeded = false;

  if (isClient()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_TASKS);
      window.localStorage.removeItem(STORAGE_KEY_SEEDED);
    } catch {
      // نادیده گرفتن خطا
    }
  }
}

/**
 * بازنشانی اطلاعات به دیتای اولیه Seed
 */
export function resetTaskStorageToSeed(referenceDateInput?: Date | string): Task[] {
  clearTaskStorage();
  const seeds = createInitialTaskSeedData(referenceDateInput);
  saveStoredTasks(seeds);
  return seeds;
}
