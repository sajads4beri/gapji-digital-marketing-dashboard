'use client';

import * as React from 'react';
import {
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Layers,
  Inbox,
  Video,
  FileText,
  User,
  Plus,
  Loader2,
  AlertCircle,
  MessageSquare,
  History,
  RotateCcw,
} from 'lucide-react';
import { Drawer } from '@/components/common/drawer';
import { ConfirmModal } from '@/components/common/confirm-modal';
import { Timeline } from '@/components/common/timeline';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { useToast } from '@/components/common/toast-provider';
import type {
  Task,
  StoredTaskStatus,
  TaskPriority,
  TaskUser,
  SubTask,
  TaskComment,
} from '../types';
import { TASK_STATUS_MAP, TASK_PRIORITY_MAP } from '../types';
import { taskService } from '../api';
import { MOCK_TASK_USERS } from '../utils/task-storage';
import { isTaskOverdue, getOverdueDays, formatOverdueBadgeText } from '../utils/task-grouping';
import { mapTaskHistoryToTimelineEvents } from '../utils/task-timeline-mapper';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';

export interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
}

export function TaskDrawer({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDrawerProps) {
  const { toast } = useToast();

  // فیلدهای فرم داخلی
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<StoredTaskStatus>('todo');
  const [priority, setPriority] = React.useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = React.useState<string>('');
  const [dueDateIso, setDueDateIso] = React.useState<string>('');

  // زیرتسک جدید و کامنت جدید
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [newCommentText, setNewCommentText] = React.useState('');
  const [isAddingComment, setIsAddingComment] = React.useState(false);

  // تب فعال در بخش تکمیلی: زیرتسک‌ها، کامنت‌ها، تاریخچه
  const [activeTab, setActiveTab] = React.useState<'subtasks' | 'comments' | 'history'>('subtasks');

  // وضعیت ذخیره‌سازی و مدال تغییرات ذخیره‌نشده
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // مقداردهی اولیه فرم هنگام تغییر تسک انتخابی
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee?.id || '');
      setDueDateIso(task.dueDate ? task.dueDate.split('T')[0] : '');
      setValidationError(null);
      setNewSubtaskTitle('');
      setNewCommentText('');
    }
  }, [task]);

  // بررسی وجود تغییرات ذخیره‌نشده در فرم اصلی
  const isDirty = React.useMemo(() => {
    if (!task) return false;
    const initialDesc = task.description || '';
    const initialAssigneeId = task.assignee?.id || '';
    const initialDueDate = task.dueDate ? task.dueDate.split('T')[0] : '';

    return (
      title !== task.title ||
      description !== initialDesc ||
      status !== task.status ||
      priority !== task.priority ||
      assigneeId !== initialAssigneeId ||
      dueDateIso !== initialDueDate
    );
  }, [task, title, description, status, priority, assigneeId, dueDateIso]);

  // تلاش برای بستن Drawer با گارد تغییرات ذخیره‌نشده
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // تأیید خروج و نادیده گرفتن تغییرات
  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  // ذخیره فرم مشخصات تسک
  const handleSave = async () => {
    if (!task) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('عنوان تسک الزامی است و نمی‌تواند خالی باشد.');
      return;
    }

    if (!dueDateIso) {
      setValidationError('تاریخ سررسید تسک الزامی است.');
      return;
    }

    setIsSaving(true);
    setValidationError(null);

    try {
      const selectedAssignee = assigneeId
        ? MOCK_TASK_USERS.find((u) => u.id === assigneeId) || null
        : null;

      // سررسید را به انتهای روز انتخابی تبدیل می‌کنیم
      const dueTimestamp = `${dueDateIso}T23:59:59.000Z`;

      const updated = await taskService.update(task.id, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        status,
        priority,
        assignee: selectedAssignee,
        dueDate: dueTimestamp,
      });

      onTaskUpdated(updated);
      toast.success('مشخصات تسک با موفقیت به‌روزرسانی شد.');
      onClose();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setValidationError(err?.message || 'خطا در ذخیره‌سازی تغییرات تسک.');
      toast.error(err?.message || 'خطا در به‌روزرسانی تسک.');
    } finally {
      setIsSaving(false);
    }
  };

  // تغییر سریع وضعیت تکمیل (Done / Todo)
  const handleToggleComplete = async () => {
    if (!task || isTogglingStatus) return;

    setIsTogglingStatus(true);
    try {
      const isCurrentlyDone = task.status === 'done';
      const updated = await taskService.toggleComplete(task.id, !isCurrentlyDone);
      setStatus(updated.status);
      onTaskUpdated(updated);
      toast.success(
        updated.status === 'done' ? 'تسک تکمیل شد.' : 'تسک مجدداً فعال گردید.'
      );
    } catch (err: any) {
      console.error('Error toggling complete:', err);
      toast.error(err?.message || 'خطا در تغییر وضعیت تسک.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // افزودن زیرتسک جدید
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim() || isAddingSubtask) return;

    setIsAddingSubtask(true);
    try {
      await taskService.addSubtask(task.id, { title: newSubtaskTitle.trim() });
      const refreshed = await taskService.getById(task.id);
      if (refreshed) {
        onTaskUpdated(refreshed);
      }
      setNewSubtaskTitle('');
      toast.success('زیرتسک اضافه شد.');
    } catch (err: any) {
      toast.error(err?.message || 'خطا در افزودن زیرتسک.');
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // تغییر وضعیت زیرتسک
  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    if (!task) return;
    try {
      await taskService.toggleSubtask(task.id, subtaskId, !currentCompleted);
      const refreshed = await taskService.getById(task.id);
      if (refreshed) {
        onTaskUpdated(refreshed);
      }
    } catch (err: any) {
      toast.error(err?.message || 'خطا در تغییر وضعیت زیرتسک.');
    }
  };

  // افزودن دیدگاه / کامنت جدید
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newCommentText.trim() || isAddingComment) return;

    setIsAddingComment(true);
    try {
      await taskService.addComment(task.id, { content: newCommentText.trim() });
      const refreshed = await taskService.getById(task.id);
      if (refreshed) {
        onTaskUpdated(refreshed);
      }
      setNewCommentText('');
      toast.success('دیدگاه با موفقیت ثبت شد.');
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ثبت دیدگاه.');
    } finally {
      setIsAddingComment(false);
    }
  };

  if (!task) {
    return null;
  }

  const isDone = task.status === 'done';
  const isOverdue = isTaskOverdue(task);
  const overdueDays = isOverdue ? getOverdueDays(task) : 0;
  const timelineEvents = mapTaskHistoryToTimelineEvents(task.history);

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={handleAttemptClose}
        size="lg"
        title="مشخصات و ویرایش تسک"
        description="مشاهده و تغییر مشخصات، زیرتسک‌ها، دیدگاه‌ها و تاریخچه رویدادهای تسک"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleToggleComplete}
              disabled={isTogglingStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                isDone
                  ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              {isTogglingStatus ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isDone ? (
                <RotateCcw className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isDone ? 'بازگشت به انجام‌نشده' : 'تکمیل تسک'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAttemptClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6" dir="rtl">
          {/* نشانگرهای هدر: وضعیت، اولویت، برچسب تأخیر */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <TaskStatusBadge task={task} showOverdueDays={true} />
              <TaskPriorityBadge priority={task.priority} showIcon={true} />

              {task.relatedTo && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {task.relatedTo.type === 'campaign' ? (
                    <Layers className="w-3 h-3 text-blue-500" />
                  ) : task.relatedTo.type === 'lead' ? (
                    <Inbox className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Video className="w-3 h-3 text-purple-500" />
                  )}
                  <span>{task.relatedTo.title || task.relatedTo.id}</span>
                </span>
              )}

              {task.sop && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <FileText className="w-3 h-3 text-amber-600" />
                  <span>{task.sop.title || 'SOP'}</span>
                </span>
              )}
            </div>

            {isOverdue && (
              <span className="text-xs font-bold text-rose-600">
                {formatOverdueBadgeText(overdueDays)}
              </span>
            )}
          </div>

          {/* خطای اعتبارسنجی فرم */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* فرم اصلی مشخصات تسک */}
          <div className="space-y-4">
            {/* عنوان تسک */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                عنوان تسک <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان تسک را وارد کنید..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* توضیحات تسک */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                توضیحات و شرح کار
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="توضیحات تکمیلی پیرامون اقدام لازم..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
            </div>

            {/* سطر دو ستونه: وضعیت و اولویت */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* وضعیت تسک */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  وضعیت تسک
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StoredTaskStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">انجام نشده (Todo)</option>
                  <option value="in_progress">در جریان (In Progress)</option>
                  <option value="waiting">در انتظار (Waiting)</option>
                  <option value="done">انجام شد (Done)</option>
                </select>
              </div>

              {/* اولویت تسک */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  سطح اولویت
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="urgent">فوری (Urgent)</option>
                  <option value="high">بالا (High)</option>
                  <option value="medium">متوسط (Medium)</option>
                  <option value="low">پایین (Low)</option>
                </select>
              </div>
            </div>

            {/* سطر دو ستونه: مسئول و موعد سررسید */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* مسئول تسک */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  مسئول انجام
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">بدون مسئول (تخصیص‌نیافته)</option>
                  {MOCK_TASK_USERS.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role || 'کاربر'})
                    </option>
                  ))}
                </select>
              </div>

              {/* تاریخ سررسید */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  موعد سررسید <span className="text-rose-500">*</span>
                </label>
                <PersianDatePicker
                  mode="single"
                  value={dueDateIso}
                  onChange={(val) => setDueDateIso(val)}
                  placeholder="انتخاب تاریخ سررسید..."
                />
              </div>
            </div>
          </div>

          {/* تب‌های بخش‌های تکمیلی: زیرتسک‌ها، دیدگاه‌ها، تاریخچه */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex items-center gap-1 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('subtasks')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'subtasks'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>زیرتسک‌ها ({task.subtasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>دیدگاه‌ها ({task.comments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>تاریخچه تغییرات ({task.history.length})</span>
              </button>
            </div>

            {/* ۱. تب زیرتسک‌ها */}
            {activeTab === 'subtasks' && (
              <div className="space-y-3">
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="عنوان زیرتسک جدید را وارد کنید..."
                    disabled={isAddingSubtask}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isAddingSubtask ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    <span>افزودن</span>
                  </button>
                </form>

                {task.subtasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    هیچ زیرتسکی ثبت نشده است.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => handleToggleSubtask(sub.id, sub.completed)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            sub.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {sub.completed && <Check className="w-3 h-3" />}
                        </span>
                        <span
                          className={`text-xs ${
                            sub.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ۲. تب دیدگاه‌ها */}
            {activeTab === 'comments' && (
              <div className="space-y-3">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={2}
                    placeholder="نوشتن دیدگاه یا یادداشت جدید..."
                    disabled={isAddingComment}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingComment || !newCommentText.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isAddingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      <span>ارسال دیدگاه</span>
                    </button>
                  </div>
                </form>

                {task.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    هنوز دیدگاهی برای این تسک ثبت نشده است.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {task.comments.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            {comm.author.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {comm.createdAt.split('T')[0]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {comm.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ۳. تب تاریخچه رویدادها */}
            {activeTab === 'history' && (
              <div className="py-2">
                <Timeline
                  items={timelineEvents}
                  variant="compact"
                  emptyTitle="هنوز رویدادی برای این تسک ثبت نشده است."
                />
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* مدال تایید خروج بدون ذخیره تغییرات */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="خروج بدون ذخیره تغییرات"
        message="شما تغییراتی در مشخصات این تسک اعمال کرده‌اید که ذخیره نشده است. آیا مایلید بدون ذخیره‌سازی خارج شوید؟"
        confirmText="خروج بدون ذخیره"
        cancelText="ادامه ویرایش"
        variant="warning"
        onConfirm={handleConfirmDiscard}
        onClose={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
