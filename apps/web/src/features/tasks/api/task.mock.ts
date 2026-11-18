import type { ITaskService } from './task.contract';
import type {
  Task,
  TaskFilters,
  CreateTaskInput,
  QuickCreateTaskInput,
  UpdateTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
  CreateCommentInput,
  SubTask,
  TaskComment,
  TaskHistoryEvent,
  StoredTaskStatus,
  TaskUser,
} from '../types';
import {
  getStoredTasks,
  getStoredTaskById,
  createStoredTask,
  updateStoredTask,
  saveStoredTasks,
  MOCK_TASK_USERS,
} from '../utils/task-storage';
import { isTaskOverdue, toEndOfDay } from '../utils/task-grouping';

/**
 * کاربر پیش‌فرض جاری سیستم برای سناریوهای ایجاد و ثبت لاگ
 */
export const DEFAULT_CURRENT_USER: TaskUser = MOCK_TASK_USERS[0]; // سارا احمدی

/**
 * ایجاد شناسه یکتا و پایدار
 */
function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

/**
 * نرمال‌سازی متن جهت جستجوی بهینه و پشتیبانی از ارقام فارسی
 */
function normalizeSearch(text: string): string {
  if (!text) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = text.toLowerCase();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res.trim();
}

/**
 * شبیه‌سازی تاخیر شبکه (در محیط آزمون صفر در نظر گرفته می‌شود)
 */
async function simulateDelay(ms = 60): Promise<void> {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TaskMockService implements ITaskService {
  /**
   * دریافت لیست تسک‌ها با پشتیبانی از فیلترهای استاندارد
   */
  async getAll(filters?: TaskFilters): Promise<Task[]> {
    await simulateDelay();
    let tasks = getStoredTasks();

    // ۱. مدیریت تسک‌های آرشیوشده (به‌صورت پیش‌فرض حذف می‌شوند)
    if (!filters?.includeArchived) {
      tasks = tasks.filter((t) => !t.isArchived);
    }

    // ۲. فیلتر حوزه دسترسی (تسک‌های من / تیم)
    if (filters?.scope === 'my') {
      const targetUserId = filters.currentUserId || DEFAULT_CURRENT_USER.id;
      tasks = tasks.filter((t) => t.assignee?.id === targetUserId);
    }

    // ۳. فیلتر وضعیت
    if (filters?.status) {
      if (filters.status === 'overdue') {
        tasks = tasks.filter((t) => isTaskOverdue(t));
      } else if (Array.isArray(filters.status)) {
        const statuses = filters.status;
        tasks = tasks.filter((t) => statuses.includes(t.status));
      } else {
        tasks = tasks.filter((t) => t.status === filters.status);
      }
    }

    // ۴. فیلتر اولویت
    if (filters?.priority) {
      if (Array.isArray(filters.priority)) {
        const priorities = filters.priority;
        tasks = tasks.filter((t) => priorities.includes(t.priority));
      } else {
        tasks = tasks.filter((t) => t.priority === filters.priority);
      }
    }

    // ۵. فیلتر مسئول
    if (filters?.assigneeId) {
      if (filters.assigneeId === 'unassigned') {
        tasks = tasks.filter((t) => !t.assignee);
      } else {
        tasks = tasks.filter((t) => t.assignee?.id === filters.assigneeId);
      }
    }

    // ۶. فیلتر نوع موجودیت مرتبط
    if (filters?.relatedType) {
      tasks = tasks.filter((t) => t.relatedTo?.type === filters.relatedType);
    }

    // ۷. فیلتر شناسه موجودیت مرتبط
    if (filters?.relatedId) {
      tasks = tasks.filter((t) => t.relatedTo?.id === filters.relatedId);
    }

    // ۸. جستجو در عنوان و توضیحات
    if (filters?.search && filters.search.trim()) {
      const q = normalizeSearch(filters.search);
      tasks = tasks.filter((t) => {
        const titleMatch = normalizeSearch(t.title).includes(q);
        const descMatch = t.description ? normalizeSearch(t.description).includes(q) : false;
        return titleMatch || descMatch;
      });
    }

    return tasks;
  }

  /**
   * دریافت مشخصات یک تسک با شناسه
   */
  async getById(id: string): Promise<Task | null> {
    await simulateDelay();
    return getStoredTaskById(id);
  }

  /**
   * ایجاد یک تسک جدید کامل
   */
  async create(input: CreateTaskInput): Promise<Task> {
    await simulateDelay();

    // اعتبارسنجی عنوان
    if (!input.title || !input.title.trim()) {
      throw new Error('عنوان تسک الزامی است.');
    }

    // اعتبارسنجی سررسید
    if (!input.dueDate || isNaN(new Date(input.dueDate).getTime())) {
      throw new Error('تاریخ سررسید تسک الزامی و معتبر است.');
    }

    // جلوگیری قطعی از ذخیره وضعیت محاسباتی 'overdue'
    if ((input.status as unknown as string) === 'overdue') {
      throw new Error('وضعیت «عقب‌افتاده» یک وضعیت محاسباتی است و قابل ذخیره‌سازی دستی نیست.');
    }

    const now = new Date().toISOString();
    const taskId = generateId('task');
    const initialStatus: StoredTaskStatus = input.status || 'todo';
    const isInitiallyDone = initialStatus === 'done';

    // تبدیل زیرتسک‌های ورودی اولیه
    const subtasks: SubTask[] = (input.subtasks || []).map((sub, idx) => ({
      id: generateId(`sub-${idx + 1}`),
      title: sub.title.trim(),
      completed: !!sub.completed,
      createdAt: now,
      completedAt: sub.completed ? now : undefined,
    }));

    const creationEvent: TaskHistoryEvent = {
      id: generateId('hist'),
      taskId,
      type: 'task_created',
      actor: DEFAULT_CURRENT_USER,
      title: 'ایجاد تسک',
      description: `تسک با عنوان «${input.title.trim()}» ایجاد شد`,
      createdAt: now,
    };

    const newTask: Task = {
      id: taskId,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      dueDate: input.dueDate,
      priority: input.priority || 'medium',
      status: initialStatus,
      assignee: input.assignee,
      relatedTo: input.relatedTo,
      sop: input.sop,
      subtasks,
      comments: [],
      history: [creationEvent],
      createdAt: now,
      updatedAt: now,
      completedAt: isInitiallyDone ? now : undefined,
      isArchived: false,
    };

    return createStoredTask(newTask);
  }

  /**
   * ایجاد سریع تسک (از فیلد بالای لیست)
   */
  async quickCreate(input: QuickCreateTaskInput): Promise<Task> {
    await simulateDelay();

    if (!input.title || !input.title.trim()) {
      throw new Error('عنوان تسک الزامی است.');
    }

    // در صورت عدم ارسال تاریخ سررسید، به صورت پیش‌فرض پایان امروز در نظر گرفته می‌شود
    const dueDate = input.dueDate || toEndOfDay(new Date()).toISOString();

    return this.create({
      title: input.title.trim(),
      dueDate,
      assignee: input.assignee || DEFAULT_CURRENT_USER,
      priority: input.priority || 'medium',
      status: 'todo',
    });
  }

  /**
   * به‌روزرسانی مشخصات تسک موجود
   */
  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    await simulateDelay();

    const existing = getStoredTaskById(id);
    if (!existing) {
      throw new Error(`تسک با شناسه ${id} یافت نشد.`);
    }

    // اعتبارسنجی عنوان در صورت ارسال
    if (input.title !== undefined) {
      if (!input.title || !input.title.trim()) {
        throw new Error('عنوان تسک نمی‌تواند خالی باشد.');
      }
    }

    // اعتبارسنجی سررسید در صورت ارسال
    if (input.dueDate !== undefined) {
      if (!input.dueDate || isNaN(new Date(input.dueDate).getTime())) {
        throw new Error('تاریخ سررسید نامعتبر است.');
      }
    }

    // جلوگیری از ذخیره وضعیت overdue
    if ((input.status as unknown as string) === 'overdue') {
      throw new Error('وضعیت «عقب‌افتاده» یک وضعیت محاسباتی است و قابل ذخیره‌سازی دستی نیست.');
    }

    const now = new Date().toISOString();
    const newHistory: TaskHistoryEvent[] = [...existing.history];
    let newCompletedAt = existing.completedAt;

    // ۱. ثبت رویداد تغییر وضعیت
    if (input.status && input.status !== existing.status) {
      newHistory.unshift({
        id: generateId('hist'),
        taskId: id,
        type: 'status_changed',
        actor: DEFAULT_CURRENT_USER,
        title: 'تغییر وضعیت تسک',
        description: `وضعیت تسک از «${existing.status}» به «${input.status}» تغییر یافت`,
        createdAt: now,
        metadata: {
          fromStatus: existing.status,
          toStatus: input.status,
        },
      });

      if (input.status === 'done') {
        newCompletedAt = now;
      } else if (existing.status === 'done') {
        newCompletedAt = undefined;
      }
    }

    // ۲. ثبت رویداد تغییر اولویت
    if (input.priority && input.priority !== existing.priority) {
      newHistory.unshift({
        id: generateId('hist'),
        taskId: id,
        type: 'priority_changed',
        actor: DEFAULT_CURRENT_USER,
        title: 'تغییر اولویت تسک',
        description: `اولویت تسک از «${existing.priority}» به «${input.priority}» تغییر یافت`,
        createdAt: now,
        metadata: {
          fromPriority: existing.priority,
          toPriority: input.priority,
        },
      });
    }

    // ۳. ثبت رویداد تغییر مسئول
    if (input.assignee !== undefined) {
      const oldAssigneeId = existing.assignee?.id;
      const newAssigneeId = input.assignee ? input.assignee.id : null;
      if (oldAssigneeId !== newAssigneeId) {
        newHistory.unshift({
          id: generateId('hist'),
          taskId: id,
          type: 'assignee_changed',
          actor: DEFAULT_CURRENT_USER,
          title: 'تغییر مسئول تسک',
          description: input.assignee
            ? `مسئول تسک به «${input.assignee.name}» تغییر یافت`
            : 'مسئول تسک برداشته شد',
          createdAt: now,
          metadata: {
            fromAssignee: existing.assignee,
            toAssignee: input.assignee,
          },
        });
      }
    }

    // ۴. ثبت رویداد تغییر تاریخ سررسید
    if (input.dueDate && input.dueDate !== existing.dueDate) {
      newHistory.unshift({
        id: generateId('hist'),
        taskId: id,
        type: 'due_date_changed',
        actor: DEFAULT_CURRENT_USER,
        title: 'تغییر موعد تسک',
        description: 'تاریخ سررسید تسک به‌روزرسانی شد',
        createdAt: now,
        metadata: {
          fromDueDate: existing.dueDate,
          toDueDate: input.dueDate,
        },
      });
    }

    const updates: Partial<Task> = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || undefined } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.assignee !== undefined ? { assignee: input.assignee || undefined } : {}),
      ...(input.relatedTo !== undefined ? { relatedTo: input.relatedTo || undefined } : {}),
      ...(input.sop !== undefined ? { sop: input.sop || undefined } : {}),
      completedAt: newCompletedAt,
      history: newHistory,
      updatedAt: now,
    };

    return updateStoredTask(id, updates);
  }

  /**
   * انتقال تسک به بایگانی
   */
  async archive(id: string): Promise<Task> {
    await simulateDelay();

    const existing = getStoredTaskById(id);
    if (!existing) {
      throw new Error(`تسک با شناسه ${id} یافت نشد.`);
    }

    const now = new Date().toISOString();
    const newHistory: TaskHistoryEvent[] = [
      {
        id: generateId('hist'),
        taskId: id,
        type: 'task_archived',
        actor: DEFAULT_CURRENT_USER,
        title: 'بایگانی تسک',
        description: 'تسک به بخش بایگانی منتقل شد',
        createdAt: now,
      },
      ...existing.history,
    ];

    return updateStoredTask(id, {
      isArchived: true,
      archivedAt: now,
      history: newHistory,
      updatedAt: now,
    });
  }

  /**
   * بازگردانی تسک از بایگانی
   */
  async restore(id: string): Promise<Task> {
    await simulateDelay();

    const existing = getStoredTaskById(id);
    if (!existing) {
      throw new Error(`تسک با شناسه ${id} یافت نشد.`);
    }

    const now = new Date().toISOString();
    const newHistory: TaskHistoryEvent[] = [
      {
        id: generateId('hist'),
        taskId: id,
        type: 'task_restored',
        actor: DEFAULT_CURRENT_USER,
        title: 'بازگردانی تسک',
        description: 'تسک از بایگانی خارج شد و فعال گردید',
        createdAt: now,
      },
      ...existing.history,
    ];

    return updateStoredTask(id, {
      isArchived: false,
      archivedAt: undefined,
      history: newHistory,
      updatedAt: now,
    });
  }

  /**
   * به‌روزرسانی وضعیت تسک
   */
  async updateStatus(id: string, status: StoredTaskStatus): Promise<Task> {
    return this.update(id, { status });
  }

  /**
   * تغییر وضعیت تیک تکمیل تسک (Toggle complete)
   */
  async toggleComplete(id: string, completed?: boolean): Promise<Task> {
    const existing = getStoredTaskById(id);
    if (!existing) {
      throw new Error(`تسک با شناسه ${id} یافت نشد.`);
    }

    const isTargetDone = completed !== undefined ? completed : existing.status !== 'done';
    const targetStatus: StoredTaskStatus = isTargetDone ? 'done' : 'todo';

    return this.updateStatus(id, targetStatus);
  }

  /**
   * تخصیص یا لغو تخصیص مسئول تسک
   */
  async updateAssignee(id: string, assigneeId: string | null): Promise<Task> {
    let targetUser: TaskUser | null = null;
    if (assigneeId) {
      const found = MOCK_TASK_USERS.find((u) => u.id === assigneeId);
      if (!found) {
        throw new Error(`کاربر با شناسه ${assigneeId} یافت نشد.`);
      }
      targetUser = found;
    }

    return this.update(id, { assignee: targetUser });
  }

  /**
   * تغییر تاریخ سررسید
   */
  async updateDueDate(id: string, dueDate: string): Promise<Task> {
    return this.update(id, { dueDate });
  }

  /**
   * افزودن کامنت به تسک
   */
  async addComment(taskId: string, input: CreateCommentInput): Promise<TaskComment> {
    await simulateDelay();

    const existing = getStoredTaskById(taskId);
    if (!existing) {
      throw new Error(`تسک با شناسه ${taskId} یافت نشد.`);
    }

    if (!input.content || !input.content.trim()) {
      throw new Error('متن کامنت نمی‌تواند خالی باشد.');
    }

    const now = new Date().toISOString();
    const commentId = generateId('comm');
    const author = input.author || DEFAULT_CURRENT_USER;

    const newComment: TaskComment = {
      id: commentId,
      author,
      content: input.content.trim(),
      createdAt: now,
    };

    const preview = input.content.trim().length > 40
      ? `${input.content.trim().substring(0, 40)}...`
      : input.content.trim();

    const historyEvent: TaskHistoryEvent = {
      id: generateId('hist'),
      taskId,
      type: 'comment_added',
      actor: author,
      title: 'ثبت دیدگاه',
      description: `دیدگاه جدید ثبت شد: «${preview}»`,
      createdAt: now,
      metadata: {
        commentId,
      },
    };

    const updatedComments = [newComment, ...existing.comments];
    const updatedHistory = [historyEvent, ...existing.history];

    updateStoredTask(taskId, {
      comments: updatedComments,
      history: updatedHistory,
      updatedAt: now,
    });

    return newComment;
  }

  /**
   * افزودن زیرتسک
   */
  async addSubtask(taskId: string, input: CreateSubtaskInput): Promise<SubTask> {
    await simulateDelay();

    const existing = getStoredTaskById(taskId);
    if (!existing) {
      throw new Error(`تسک با شناسه ${taskId} یافت نشد.`);
    }

    if (!input.title || !input.title.trim()) {
      throw new Error('عنوان زیرتسک نمی‌تواند خالی باشد.');
    }

    const now = new Date().toISOString();
    const subtaskId = generateId('sub');

    const newSubtask: SubTask = {
      id: subtaskId,
      title: input.title.trim(),
      completed: false,
      createdAt: now,
    };

    const historyEvent: TaskHistoryEvent = {
      id: generateId('hist'),
      taskId,
      type: 'subtask_added',
      actor: DEFAULT_CURRENT_USER,
      title: 'افزودن زیرتسک',
      description: `زیرتسک «${input.title.trim()}» افزوده شد`,
      createdAt: now,
      metadata: {
        subtaskId,
      },
    };

    const updatedSubtasks = [...existing.subtasks, newSubtask];
    const updatedHistory = [historyEvent, ...existing.history];

    updateStoredTask(taskId, {
      subtasks: updatedSubtasks,
      history: updatedHistory,
      updatedAt: now,
    });

    return newSubtask;
  }

  /**
   * ویرایش زیرتسک
   */
  async updateSubtask(taskId: string, subtaskId: string, input: UpdateSubtaskInput): Promise<SubTask> {
    await simulateDelay();

    const existing = getStoredTaskById(taskId);
    if (!existing) {
      throw new Error(`تسک با شناسه ${taskId} یافت نشد.`);
    }

    const subIndex = existing.subtasks.findIndex((s) => s.id === subtaskId);
    if (subIndex === -1) {
      throw new Error(`زیرتسک با شناسه ${subtaskId} در تسک یافت نشد.`);
    }

    const now = new Date().toISOString();
    const currentSub = existing.subtasks[subIndex];
    let isCompletedChanged = false;
    let newCompleted = currentSub.completed;

    if (input.completed !== undefined && input.completed !== currentSub.completed) {
      isCompletedChanged = true;
      newCompleted = input.completed;
    }

    const updatedSub: SubTask = {
      ...currentSub,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      completed: newCompleted,
      completedAt: isCompletedChanged ? (newCompleted ? now : undefined) : currentSub.completedAt,
    };

    const newSubtasks = [...existing.subtasks];
    newSubtasks[subIndex] = updatedSub;

    const newHistory = [...existing.history];
    if (isCompletedChanged) {
      newHistory.unshift({
        id: generateId('hist'),
        taskId,
        type: 'subtask_toggled',
        actor: DEFAULT_CURRENT_USER,
        title: newCompleted ? 'تکمیل زیرتسک' : 'بازگشت زیرتسک به حالت باز',
        description: `زیرتسک «${updatedSub.title}» ${newCompleted ? 'تکمیل شد' : 'دوباره فعال شد'}`,
        createdAt: now,
        metadata: {
          subtaskId,
          completed: newCompleted,
        },
      });
    }

    updateStoredTask(taskId, {
      subtasks: newSubtasks,
      history: newHistory,
      updatedAt: now,
    });

    return updatedSub;
  }

  /**
   * تغییر وضعیت تکمیل زیرتسک
   */
  async toggleSubtask(taskId: string, subtaskId: string, completed?: boolean): Promise<SubTask> {
    const existing = getStoredTaskById(taskId);
    if (!existing) {
      throw new Error(`تسک با شناسه ${taskId} یافت نشد.`);
    }

    const sub = existing.subtasks.find((s) => s.id === subtaskId);
    if (!sub) {
      throw new Error(`زیرتسک با شناسه ${subtaskId} یافت نشد.`);
    }

    const targetCompleted = completed !== undefined ? completed : !sub.completed;
    return this.updateSubtask(taskId, subtaskId, { completed: targetCompleted });
  }

  /**
   * دریافت رویدادهای تاریخچه تسک
   */
  async getHistory(taskId: string): Promise<TaskHistoryEvent[]> {
    await simulateDelay();

    const existing = getStoredTaskById(taskId);
    if (!existing) {
      throw new Error(`تسک با شناسه ${taskId} یافت نشد.`);
    }

    return [...existing.history].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

/**
 * نمونه Mock سرویس تسک جهت تست‌های مجزا
 */
export const mockTaskService = new TaskMockService();
