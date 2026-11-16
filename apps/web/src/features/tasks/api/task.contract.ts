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
} from '../types';

export interface ITaskService {
  /**
   * دریافت لیست تسک‌ها با پشتیبانی از فیلترهای وضعیت، مسئول، ارتباط و جستجو
   * به صورت پیش‌فرض تسک‌های آرشیوشده نمایش داده نمی‌شوند مگر includeArchived=true باشد.
   */
  getAll(filters?: TaskFilters): Promise<Task[]>;

  /**
   * دریافت مشخصات کامل یک تسک با شناسه
   * در صورت نیافتن، مقدار null برمی‌گرداند.
   */
  getById(id: string): Promise<Task | null>;

  /**
   * ایجاد یک تسک جدید کامل
   * عنوان و تاریخ سررسید اجباری هستند.
   */
  create(input: CreateTaskInput): Promise<Task>;

  /**
   * ایجاد سریع تسک (از فیلد بالای لیست تسک‌ها)
   */
  quickCreate(input: QuickCreateTaskInput): Promise<Task>;

  /**
   * به‌روزرسانی مشخصات یک تسک موجود همراه با ثبت خودکار رویدادها در تاریخچه
   */
  update(id: string, input: UpdateTaskInput): Promise<Task>;

  /**
   * انتقال تسک به بایگانی
   */
  archive(id: string): Promise<Task>;

  /**
   * بازگردانی تسک از بایگانی به لیست فعال
   */
  restore(id: string): Promise<Task>;

  /**
   * تغییر وضعیت تسک (فقط وضعیت‌های ذخیره‌پذیر مجاز هستند)
   */
  updateStatus(id: string, status: StoredTaskStatus): Promise<Task>;

  /**
   * تغییر سریع وضعیت تکمیل تسک (تیک انجام در ردیف لیست)
   * در صورت ارسال مقدار completed، وضعیت مستقیماً تنظیم می‌شود.
   * در غیر این صورت، بین وضعیت جاری و done تغییر حالت می‌دهد.
   */
  toggleComplete(id: string, completed?: boolean): Promise<Task>;

  /**
   * تخصیص یا لغو تخصیص مسئول تسک
   * ارسال null موجب حذف مسئول می‌شود.
   */
  updateAssignee(id: string, assigneeId: string | null): Promise<Task>;

  /**
   * تغییر تاریخ سررسید تسک همراه با ثبت رویداد در تاریخچه
   */
  updateDueDate(id: string, dueDate: string): Promise<Task>;

  /**
   * افزودن کامنت جدید به تسک
   */
  addComment(taskId: string, input: CreateCommentInput): Promise<TaskComment>;

  /**
   * ایجاد یک زیرتسک جدید در چک‌لیست تسک
   */
  addSubtask(taskId: string, input: CreateSubtaskInput): Promise<SubTask>;

  /**
   * ویرایش عنوان یا وضعیت تکمیل زیرتسک
   */
  updateSubtask(taskId: string, subtaskId: string, input: UpdateSubtaskInput): Promise<SubTask>;

  /**
   * تغییر وضعیت تیک تکمیل یک زیرتسک
   */
  toggleSubtask(taskId: string, subtaskId: string, completed?: boolean): Promise<SubTask>;

  /**
   * دریافت تاریخچه رویدادهای یک تسک مرتب‌شده از جدید به قدیم
   */
  getHistory(taskId: string): Promise<TaskHistoryEvent[]>;

  /**
   * دریافت لیست کاربران فعال سازمان جهت گزینه‌های تخصیص تسک
   */
  getAssignees?(): Promise<Array<{ id: string; name: string; email?: string; role?: string }>>;
}
