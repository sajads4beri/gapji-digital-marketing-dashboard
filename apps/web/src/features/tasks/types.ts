/**
 * مدل‌های داده‌ای ماژول مدیریت تسک‌ها (Tasks)
 * کاملاً مستقل از React و بدون وابستگی به اجزای UI
 * منطبق بر سند Phase 1: Frontend Pages (صفحه ۱۸ و ۵ سند)
 */

/**
 * وضعیت‌های قابل ذخیره‌سازی در مخزن داده (Storage)
 * نکته بسیار مهم: وضعیت 'overdue' صرفاً یک وضعیت نمایشی و محاسباتی است
 * و نباید به عنوان وضعیت خام در دیتابیس یا Storage ذخیره شود.
 */
export type StoredTaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';

/**
 * وضعیت‌های تسک در لایه نمایش (شامل وضعیت محاسباتی عقب‌افتاده)
 */
export type TaskStatus = StoredTaskStatus | 'overdue';

/**
 * سطوح اولویت تسک
 */
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * انواع موجودیت‌های قابل ارتباط با تسک
 */
export type TaskRelatedType = 'campaign' | 'webinar' | 'lead';

/**
 * ساختار ارتباط تسک با سایر موجودیت‌ها
 */
export interface TaskRelatedTo {
  type: TaskRelatedType;
  id: string;
  title?: string; // عنوان کمکی جهت نمایش سریع در کارت یا جدول
}

/**
 * ارتباط با دستورالعمل استاندارد عملیاتی (SOP)
 */
export interface TaskSop {
  id: string;
  title?: string;
}

/**
 * مشخصات کاربر / مسئول تسک
 */
export interface TaskUser {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  email?: string;
}

/**
 * ساختار زیرتسک (Checklist / SubTask)
 */
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO-8601
  completedAt?: string; // ISO-8601
}

/**
 * ساختار دیدگاه / کامنت تسک
 */
export interface TaskComment {
  id: string;
  author: TaskUser;
  content: string;
  createdAt: string; // ISO-8601
}

/**
 * انواع رویدادهای تاریخچه تسک
 */
export type TaskEventType =
  | 'task_created'
  | 'task_updated'
  | 'status_changed'
  | 'assignee_changed'
  | 'due_date_changed'
  | 'priority_changed'
  | 'subtask_added'
  | 'subtask_toggled'
  | 'comment_added'
  | 'task_archived'
  | 'task_restored';

/**
 * رویداد ثبت‌شده در تاریخچه تسک
 */
export interface TaskHistoryEvent {
  id: string;
  taskId: string;
  type: TaskEventType;
  actor: TaskUser;
  title: string;
  description?: string;
  createdAt: string; // ISO-8601
  metadata?: Record<string, unknown>;
}

/**
 * مدل کامل و مرجع یک تسک (Task Entity)
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: TaskUser;
  dueDate: string; // تاریخ سررسید استاندارد ISO-8601 (اجباری)
  priority: TaskPriority;
  status: StoredTaskStatus; // فقط وضعیت‌های ذخیره‌پذیر
  relatedTo?: TaskRelatedTo;
  sop?: TaskSop;
  subtasks: SubTask[];
  comments: TaskComment[];
  history: TaskHistoryEvent[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  completedAt?: string; // زمان تکمیل تسک ISO-8601
  isArchived?: boolean; // نشانگر بایگانی
  archivedAt?: string; // ISO-8601
}

/**
 * ورودی‌های ایجاد تسک کامل
 */
export interface CreateTaskInput {
  title: string;
  dueDate: string; // ISO-8601
  description?: string;
  priority?: TaskPriority; // پیش‌فرض: 'medium'
  status?: StoredTaskStatus; // پیش‌فرض: 'todo'
  assignee?: TaskUser;
  relatedTo?: TaskRelatedTo;
  sop?: TaskSop;
  subtasks?: Array<{ title: string; completed?: boolean }>;
}

/**
 * ورودی ایجاد سریع تسک (از فیلد بالای لیست)
 */
export interface QuickCreateTaskInput {
  title: string;
  dueDate?: string; // در صورت عدم ارسال، به صورت پیش‌فرض پایان امروز در نظر گرفته می‌شود
  assignee?: TaskUser;
  priority?: TaskPriority;
}

/**
 * ورودی‌های ویرایش تسک
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: StoredTaskStatus;
  assignee?: TaskUser | null;
  relatedTo?: TaskRelatedTo | null;
  sop?: TaskSop | null;
}

/**
 * ورودی‌های ایجاد زیرتسک
 */
export interface CreateSubtaskInput {
  title: string;
}

/**
 * ورودی‌های به‌روزرسانی زیرتسک
 */
export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
}

/**
 * ورودی ثبت کامنت
 */
export interface CreateCommentInput {
  content: string;
  author?: TaskUser;
}

/**
 * فیلترهای جستجو و دریافت تسک‌ها
 */
export interface TaskFilters {
  scope?: 'my' | 'team'; // پیش‌فرض: 'team'
  currentUserId?: string; // برای تفکیک تسک‌های من (scope='my')
  status?: StoredTaskStatus | StoredTaskStatus[] | 'overdue';
  priority?: TaskPriority | TaskPriority[];
  assigneeId?: string; // 'unassigned' یا شناسه کاربر
  relatedType?: TaskRelatedType;
  relatedId?: string;
  includeArchived?: boolean; // پیش‌فرض: false
  search?: string; // جستجو در عنوان و توضیحات
}

/**
 * شناسه‌های ۵ گروه زمانی برای لیست تسک‌ها مطابق سند
 */
export type TaskGroupKey = 'overdue' | 'today' | 'this_week' | 'later' | 'completed';

/**
 * مدل گروه تسک‌ها
 */
export interface TaskGroup {
  key: TaskGroupKey;
  label: string;
  tasks: Task[];
  count: number;
  isEmpty: boolean;
}

/**
 * پیکربندی متمرکز وضعیت‌های تسک
 */
export interface TaskStatusConfig {
  value: TaskStatus;
  label: string;
  colorName: string;
  badgeClassName: string;
  dotClassName: string;
}

export const TASK_STATUS_MAP: Record<TaskStatus, TaskStatusConfig> = {
  todo: {
    value: 'todo',
    label: 'انجام نشده',
    colorName: 'slate',
    badgeClassName: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClassName: 'bg-slate-500',
  },
  in_progress: {
    value: 'in_progress',
    label: 'در جریان',
    colorName: 'blue',
    badgeClassName: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClassName: 'bg-blue-500',
  },
  waiting: {
    value: 'waiting',
    label: 'در انتظار',
    colorName: 'amber',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClassName: 'bg-amber-500',
  },
  done: {
    value: 'done',
    label: 'انجام شد',
    colorName: 'emerald',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClassName: 'bg-emerald-500',
  },
  overdue: {
    value: 'overdue',
    label: 'عقب‌افتاده',
    colorName: 'rose',
    badgeClassName: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClassName: 'bg-rose-500',
  },
};

/**
 * پیکربندی متمرکز اولویت‌های تسک
 */
export interface TaskPriorityConfig {
  value: TaskPriority;
  label: string;
  colorName: string;
  badgeClassName: string;
}

export const TASK_PRIORITY_MAP: Record<TaskPriority, TaskPriorityConfig> = {
  urgent: {
    value: 'urgent',
    label: 'فوری',
    colorName: 'rose',
    badgeClassName: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  high: {
    value: 'high',
    label: 'بالا',
    colorName: 'amber',
    badgeClassName: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  medium: {
    value: 'medium',
    label: 'متوسط',
    colorName: 'blue',
    badgeClassName: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  low: {
    value: 'low',
    label: 'پایین',
    colorName: 'slate',
    badgeClassName: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};
