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
import { Select } from '@/components/ui/select';
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
import { isTaskOverdue, getOverdueDays, formatOverdueBadgeText } from '../utils/task-grouping';
import { mapTaskHistoryToTimelineEvents } from '../utils/task-timeline-mapper';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';

export interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
  users?: TaskUser[];
}

export function TaskDrawer({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  users: propUsers,
}: TaskDrawerProps) {
  const { toast } = useToast();

  const [availableUsers, setAvailableUsers] = React.useState<TaskUser[]>(propUsers || []);

  React.useEffect(() => {
    if (propUsers && propUsers.length > 0) {
      setAvailableUsers(propUsers);
    } else if (taskService.getAssignees) {
      taskService.getAssignees().then((list) => {
        if (list && list.length > 0) {
          setAvailableUsers(list);
        }
      }).catch(() => {});
    }
  }, [propUsers]);

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
        ? availableUsers.find((u) => u.id === assigneeId) ||
          (task.assignee?.id === assigneeId ? task.assignee : { id: assigneeId, name: 'کاربر' })
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                isDone
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
                  : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25'
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
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-[#18263A] border border-[#1F2E45] rounded-xl hover:bg-[#20314A] hover:text-white transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_0_15px_rgba(113,155,223,0.25)]"
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
          <div className="flex items-center justify-between p-3.5 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <TaskStatusBadge task={task} showOverdueDays={true} />
              <TaskPriorityBadge priority={task.priority} showIcon={true} />

              {task.relatedTo && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-[#18263A] border border-[#1F2E45] px-2.5 py-0.5 rounded-full">
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
            <div className="p-3 bg-[#D66B73]/15 border border-[#D66B73]/30 rounded-xl flex items-center gap-2 text-xs text-[#D66B73] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D66B73]" />
              <span>{validationError}</span>
            </div>
          )}

          {/* فرم اصلی مشخصات تسک */}
          <div className="space-y-4">
            {/* عنوان تسک */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                عنوان تسک <span className="text-[#D66B73]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان تسک را وارد کنید..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#0B1423] border border-[#1F2E45] text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#719BDF]/30 focus:border-[#719BDF] transition-all"
              />
            </div>

            {/* توضیحات تسک */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                توضیحات و شرح کار
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="توضیحات تکمیلی پیرامون اقدام لازم..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#0B1423] border border-[#1F2E45] text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#719BDF]/30 focus:border-[#719BDF] resize-y transition-all"
              />
            </div>

            {/* سطر دو ستونه: وضعیت و اولویت */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* وضعیت تسک */}
              <div className="space-y-1.5">
                <Select
                  label="وضعیت تسک"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StoredTaskStatus)}
                  options={[
                    { value: 'todo', label: 'انجام نشده (Todo)' },
                    { value: 'in_progress', label: 'در جریان (In Progress)' },
                    { value: 'waiting', label: 'در انتظار (Waiting)' },
                    { value: 'done', label: 'انجام شد (Done)' },
                  ]}
                />
              </div>

              {/* اولویت تسک */}
              <div className="space-y-1.5">
                <Select
                  label="سطح اولویت"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  options={[
                    { value: 'urgent', label: 'فوری (Urgent)' },
                    { value: 'high', label: 'بالا (High)' },
                    { value: 'medium', label: 'متوسط (Medium)' },
                    { value: 'low', label: 'پایین (Low)' },
                  ]}
                />
              </div>
            </div>

            {/* سطر دو ستونه: مسئول و موعد سررسید */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* مسئول تسک */}
              <div className="space-y-1.5">
                <Select
                  label="مسئول انجام"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  options={[
                    { value: '', label: 'بدون مسئول (تخصیص‌نیافته)' },
                    ...availableUsers.map((u) => ({
                      value: u.id,
                      label: `${u.name} (${u.role || 'کاربر'})`,
                    })),
                  ]}
                />
              </div>

              {/* تاریخ سررسید */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  موعد سررسید <span className="text-[#D66B73]">*</span>
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
          <div className="border-t border-[#1F2E45] pt-5 space-y-4">
            <div className="flex items-center gap-1 border-b border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setActiveTab('subtasks')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'subtasks'
                    ? 'border-[#719BDF] text-[#719BDF] font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>زیرتسک‌ها ({task.subtasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'comments'
                    ? 'border-[#719BDF] text-[#719BDF] font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>دیدگاه‌ها ({task.comments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'history'
                    ? 'border-[#719BDF] text-[#719BDF] font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
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
                    className="flex-1 px-3 py-2 text-xs bg-[#0B1423] border border-[#1F2E45] text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#719BDF]/30 focus:border-[#719BDF] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                    className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 disabled:opacity-40 rounded-xl transition-all shrink-0"
                  >
                    {isAddingSubtask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>افزودن</span>
                  </button>
                </form>

                {task.subtasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    هیچ زیرتسکی ثبت نشده است.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => handleToggleSubtask(sub.id, sub.completed)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#18263A] hover:bg-[#20314A] border border-[#1F2E45] cursor-pointer transition-colors"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            sub.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-[#1F2E45] bg-[#0B1423]'
                          }`}
                        >
                          {sub.completed && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </span>
                        <span
                          className={`text-xs ${
                            sub.completed ? 'line-through text-slate-500' : 'text-slate-200'
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
                    className="w-full px-3 py-2 text-xs bg-[#0B1423] border border-[#1F2E45] text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#719BDF]/30 focus:border-[#719BDF] resize-none transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingComment || !newCommentText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:brightness-110 disabled:opacity-40 rounded-xl transition-all"
                    >
                      {isAddingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>ارسال دیدگاه</span>
                    </button>
                  </div>
                </form>

                {task.comments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    هنوز دیدگاهی برای این تسک ثبت نشده است.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {task.comments.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 bg-[#18263A] border border-[#1F2E45] rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">
                            {comm.author.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {comm.createdAt.split('T')[0]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
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
