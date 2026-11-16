'use client';

import React, { useState } from 'react';
import { WebinarDetail, TaskPriority, TaskStatus } from '../types';
import { webinarsApi } from '../webinars.api';
import {
  CheckSquare,
  Clock,
  User,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WebinarTasksTabProps {
  webinar: WebinarDetail;
  onRefresh: () => void;
}

export function WebinarTasksTab({ webinar, onRefresh }: WebinarTasksTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 me-1" />
            انجام‌شده
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-[#719BDF]/15 text-[#719BDF] border-[#719BDF]/30">
            <Clock className="w-3 h-3 me-1" />
            در حال انجام
          </Badge>
        );
      case 'todo':
      default:
        return (
          <Badge variant="outline" className="bg-[#18263A] text-slate-400 border-[#1F2E45]">
            در انتظار
          </Badge>
        );
    }
  };

  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30">فوری</Badge>;
      case 'high':
        return <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">بالا</Badge>;
      case 'medium':
        return <Badge className="bg-[#719BDF]/15 text-[#719BDF] border-[#719BDF]/30">متوسط</Badge>;
      case 'low':
      default:
        return <Badge variant="outline" className="text-slate-500 border-[#1F2E45]">پایین</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div>
          <h3 className="text-sm font-bold text-white">تسک‌های اجرایی و هماهنگی وبینار</h3>
          <p className="text-xs text-slate-400 mt-0.5">اتصال خودکار به ماژول مدیریت تسک‌ها (ص ۱۸)</p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
        >
          <Plus className="w-4 h-4 me-1.5" />
          افزودن تسک جدید
        </Button>
      </div>

      {/* Tasks Table */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 overflow-hidden">
        {webinar.tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-500 mb-2" />
            <p className="font-semibold text-white">هیچ تسکی برای این وبینار تعریف نشده است</p>
            <p className="text-xs text-slate-500 mt-1">
              تسک‌های قبل از وبینار مانند طراحی اسلاید، تست میکروفون و ارسال یادآوری را اینجا ثبت کنید.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0B1423]/60 border-b border-[#1F2E45] text-slate-400 font-medium">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">عنوان تسک</th>
                  <th className="py-3.5 px-4 text-center font-semibold">اولویت</th>
                  <th className="py-3.5 px-4 text-center font-semibold">وضعیت</th>
                  <th className="py-3.5 px-4 font-semibold">مسئول انجام</th>
                  <th className="py-3.5 px-4 font-semibold">مهلت انجام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
                {webinar.tasks.map((task) => {
                  const dueDateStr = task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('fa-IR')
                    : '-';

                  return (
                    <tr key={task.id} className="hover:bg-[#18263A]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-xs">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">{renderPriorityBadge(task.priority)}</td>
                      <td className="py-3.5 px-4 text-center">{renderStatusBadge(task.status)}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {task.assigneeName ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {task.assigneeName}
                          </span>
                        ) : (
                          <span className="text-slate-500">واگذارنشده</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {dueDateStr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <AddWebinarTaskModal
          webinarId={webinar.id}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

// Subcomponent: Add Task Modal
function AddWebinarTaskModal({
  webinarId,
  isOpen,
  onClose,
  onSuccess,
}: {
  webinarId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('عنوان تسک الزامی است.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await webinarsApi.addTask(webinarId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در تعریف تسک');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-md shadow-2xl border border-[#1F2E45] flex flex-col max-h-[90vh] overflow-hidden text-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <h2 className="text-base font-bold text-white">تعریف تسک مرتبط با وبینار</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#18263A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 me-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              عنوان تسک <span className="text-rose-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تست اتصال اینترنت و صدا قبل از لایو"
              className="bg-[#0B1423] border-[#1F2E45] text-white placeholder-slate-500 focus:border-[#719BDF] text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">اولویت</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-10 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white focus:outline-none focus:border-[#719BDF]"
              >
                <option value="low">پایین</option>
                <option value="medium">متوسط</option>
                <option value="high">بالا</option>
                <option value="urgent">فوری</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">مهلت انجام</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">شرح اقدام</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات تکمیلی..."
              className="w-full p-2.5 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#1F2E45]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت تسک'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
