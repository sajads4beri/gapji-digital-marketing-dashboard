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
    badgeClassName: 'bg-[#18263A] text-slate-300 border-[#1F2E45]',
    dotClassName: 'bg-slate-400',
  },
  in_progress: {
    value: 'in_progress',
    label: 'در جریان',
    colorName: 'blue',
    badgeClassName: 'bg-[#719BDF]/15 text-[#719BDF] border-[#719BDF]/30',
    dotClassName: 'bg-[#719BDF]',
  },
  waiting: {
    value: 'waiting',
    label: 'در انتظار',
    colorName: 'amber',
    badgeClassName: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClassName: 'bg-amber-400',
  },
  done: {
    value: 'done',
    label: 'انجام شد',
    colorName: 'emerald',
    badgeClassName: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClassName: 'bg-emerald-400',
  },
  overdue: {
    value: 'overdue',
    label: 'عقب‌افتاده',
    colorName: 'rose',
    badgeClassName: 'bg-[#D66B73]/15 text-[#D66B73] border-[#D66B73]/30',
    dotClassName: 'bg-[#D66B73]',
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
    badgeClassName: 'bg-[#D66B73]/20 text-[#D66B73] border-[#D66B73]/40',
  },
  high: {
    value: 'high',
    label: 'بالا',
    colorName: 'amber',
    badgeClassName: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  medium: {
    value: 'medium',
    label: 'متوسط',
    colorName: 'blue',
    badgeClassName: 'bg-[#719BDF]/20 text-[#719BDF] border-[#719BDF]/40',
  },
  low: {
    value: 'low',
    label: 'پایین',
    colorName: 'slate',
    badgeClassName: 'bg-slate-800 text-slate-400 border-slate-700',
  },
};
