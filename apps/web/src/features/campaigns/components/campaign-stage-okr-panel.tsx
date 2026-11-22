'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  Check,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  ListTodo,
  CheckSquare,
  Sparkles,
  ArrowUpRight,
  Clock,
  Layers,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  User,
} from 'lucide-react';
import { campaignService } from '../api';
import { taskService } from '@/features/tasks/api';
import { TaskDrawer } from '@/features/tasks/components/task-drawer';
import type { Task } from '@/features/tasks/types';
import type {
  CampaignFunnelStage,
  CampaignAllOkrResponse,
  CampaignStageOkrResponse,
  FunnelKeyResult,
  FunnelStageTask,
} from '../types';
import { useToast } from '@/components/common/toast-provider';
import { isoToJalali, PERSIAN_MONTH_NAMES } from '@/lib/persian-date';

export interface CampaignStageOkrPanelProps {
  campaignId: string;
  campaignName: string;
  selectedStage: CampaignFunnelStage | null;
  allStages: CampaignFunnelStage[];
  onSelectStage: (stage: CampaignFunnelStage | null) => void;
}

/**
 * تبدیل تاریخ میلادی ISO به تاریخ شمسی با اعداد فارسی
 */
function formatShamsiDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const res = isoToJalali(clean);
  if (res.isValid) {
    return `${res.day.toLocaleString('fa-IR')} ${PERSIAN_MONTH_NAMES[res.month - 1]} ${res.year.toLocaleString('fa-IR')}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const iso = d.toISOString().split('T')[0];
    const r2 = isoToJalali(iso);
    if (r2.isValid) {
      return `${r2.day.toLocaleString('fa-IR')} ${PERSIAN_MONTH_NAMES[r2.month - 1]} ${r2.year.toLocaleString('fa-IR')}`;
    }
  }
  return dateStr;
}

/**
 * محاسبه خودکار پیشرفت KR بر اساس وضعیت تسک‌های اجرایی
 */
function computeKrTaskProgress(kr: FunnelKeyResult) {
  const tasks = kr.tasks || [];
  const totalTasks = tasks.length;

  if (totalTasks > 0) {
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const percent = Math.min(100, Math.round((completedTasks / totalTasks) * 100));
    return {
      completedCount: completedTasks,
      totalCount: totalTasks,
      percent,
      hasTasks: true,
      displayLabel: `${completedTasks.toLocaleString('fa-IR')} از ${totalTasks.toLocaleString('fa-IR')} تسک انجام شده (${percent.toLocaleString('fa-IR')}٪)`,
    };
  }

  // هنگامی که هنوز هیچ تسکی برای این KR ثبت نشده است
  return {
    completedCount: 0,
    totalCount: 0,
    percent: 0,
    hasTasks: false,
    displayLabel: 'بدون تسک (۰٪)',
  };
}

export function CampaignStageOkrPanel({
  campaignId,
  campaignName,
  selectedStage,
  allStages,
  onSelectStage,
}: CampaignStageOkrPanelProps) {
  const { toast } = useToast();

  const [allOkr, setAllOkr] = useState<CampaignAllOkrResponse | null>(null);
  const [stageOkr, setStageOkr] = useState<CampaignStageOkrResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // وضعیت آکاردئونی باز/بسته بودن هر KR
  const [expandedKrs, setExpandedKrs] = useState<Record<string, boolean>>({});

  // مودال حذف نتیجه کلیدی (جایگزین window.confirm)
  const [krToDelete, setKrToDelete] = useState<FunnelKeyResult | null>(null);

  // ویرایش هدف (Objective)
  const [isEditingObjective, setIsEditingObjective] = useState<boolean>(false);
  const [objectiveTitle, setObjectiveTitle] = useState<string>('');
  const [objectiveDesc, setObjectiveDesc] = useState<string>('');

  // مودال افزودن نتیجه کلیدی (KR)
  const [isAddKrModalOpen, setIsAddKrModalOpen] = useState<boolean>(false);
  const [newKrTitle, setNewKrTitle] = useState<string>('');
  const [newKrTarget, setNewKrTarget] = useState<number | ''>(1);
  const [newKrUnit, setNewKrUnit] = useState<string>('تسک');

  // ورودی سریع تسک به ازای هر KR
  const [inlineTaskTitles, setInlineTaskTitles] = useState<Record<string, string>>({});
  const [isAddingTask, setIsAddingTask] = useState<Record<string, boolean>>({});

  // وضعیت پنجره کشویی کامل تسک (TaskDrawer)
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState<boolean>(false);

  // وضعیت تولتیپ مشخصات کامل تسک با هاور ۱ ثانیه
  const [hoveredTask, setHoveredTask] = useState<{
    task: FunnelStageTask;
    krTitle: string;
    stageLabel: string;
    position: { top: number; left: number };
  } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // پاکسازی تایمر تولتیپ هنگام آن‌مانت
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // باز یا بسته کردن آکاردئون یک KR
  const toggleKrAccordion = (krId: string) => {
    setExpandedKrs((prev) => ({
      ...prev,
      [krId]: !prev[krId],
    }));
  };

  // بارگذاری داده‌های OKR
  const loadOkrData = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      if (selectedStage) {
        const data = await campaignService.getStageOkr(campaignId, selectedStage.key);
        setStageOkr(data);
        if (data.objective) {
          setObjectiveTitle(data.objective.title);
          setObjectiveDesc(data.objective.description || '');
        } else {
          setObjectiveTitle(`هدف مرحله ${selectedStage.label}`);
          setObjectiveDesc('');
        }
      } else {
        const data = await campaignService.getFunnelAllOkr(campaignId);
        setAllOkr(data);
      }
    } catch (err: any) {
      console.error('Error loading OKR data:', err);
      toast.error('خطا در بارگذاری داده‌های OKR قیف فروش.');
    } finally {
      setLoading(false);
    }
  }, [campaignId, selectedStage, toast]);

  useEffect(() => {
    setIsEditingObjective(false);
    loadOkrData();
  }, [loadOkrData]);

  // ذخیره هدف مرحله
  const handleSaveObjective = async () => {
    if (!selectedStage || !objectiveTitle.trim()) {
      toast.warning('عنوان هدف نمی‌تواند خالی باشد.');
      return;
    }
    setActionLoading(true);
    try {
      await campaignService.upsertStageObjective(campaignId, selectedStage.key, {
        title: objectiveTitle.trim(),
        description: objectiveDesc.trim() || undefined,
      });
      toast.success('هدف مرحله با موفقیت ذخیره شد.');
      setIsEditingObjective(false);
      await loadOkrData();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ذخیره هدف.');
    } finally {
      setActionLoading(false);
    }
  };

  // افزودن نتیجه کلیدی جدید (KR)
  const handleCreateKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage || !newKrTitle.trim()) {
      toast.warning('لطفاً عنوان نتیجه کلیدی را وارد نمایید.');
      return;
    }
    setActionLoading(true);
    try {
      const created = await campaignService.createKeyResult(campaignId, selectedStage.key, {
        title: newKrTitle.trim(),
        targetValue: 1,
        currentValue: 0,
        unit: 'تسک',
      });
      toast.success('نتیجه کلیدی جدید ایجاد شد.');
      setIsAddKrModalOpen(false);
      setNewKrTitle('');
      setNewKrTarget(1);
      setNewKrUnit('تسک');
      // حالت پیش‌فرض آکاردئون KR جدید نیز بسته می‌ماند
      setExpandedKrs((prev) => ({ ...prev, [created.id]: false }));
      await loadOkrData();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ایجاد نتیجه کلیدی.');
    } finally {
      setActionLoading(false);
    }
  };

  // تایید حذف قطعی نتیجه کلیدی در مودال
  const confirmDeleteKr = async () => {
    if (!krToDelete) return;
    setActionLoading(true);
    try {
      await campaignService.deleteKeyResult(campaignId, krToDelete.id);
      toast.success('نتیجه کلیدی با موفقیت حذف شد.');
      setKrToDelete(null);
      await loadOkrData();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در حذف نتیجه کلیدی.');
    } finally {
      setActionLoading(false);
    }
  };

  // تغییر مستقیم اولویت تسک از روی بج
  const handleUpdateTaskPriority = async (
    taskId: string,
    newPriority: 'urgent' | 'high' | 'medium' | 'low',
    krId: string,
  ) => {
    try {
      await taskService.update(taskId, { priority: newPriority });
      setStageOkr((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          keyResults: prev.keyResults.map((kr) => {
            if (kr.id !== krId) return kr;
            return {
              ...kr,
              tasks: kr.tasks.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t)),
            };
          }),
        };
      });
      const priorityLabels: Record<string, string> = {
        urgent: 'فوری',
        high: 'بالا',
        medium: 'متوسط',
        low: 'پایین',
      };
      toast.success(`اولویت تسک به «${priorityLabels[newPriority] || newPriority}» تغییر یافت.`);
    } catch (err: any) {
      toast.error(err?.message || 'خطا در تغییر اولویت تسک.');
    }
  };

  // تغییر وضعیت انجام تسک + محاسبه و به‌روزرسانی خودکار پیشرفت KR
  const handleToggleTaskStatus = async (task: FunnelStageTask, krId: string) => {
    const isDone = task.status === 'done';
    const nextStatus = isDone ? 'todo' : 'done';
    try {
      await taskService.update(task.id, { status: nextStatus });

      setStageOkr((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          keyResults: prev.keyResults.map((kr) => {
            if (kr.id !== krId) return kr;
            const updatedTasks = kr.tasks.map((t) =>
              t.id === task.id ? { ...t, status: nextStatus as any } : t,
            );
            const completedCount = updatedTasks.filter((t) => t.status === 'done').length;
            const totalCount = updatedTasks.length;
            const newPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            // همگام‌سازی مقدار عددی در بک‌اند
            campaignService
              .updateKeyResult(campaignId, kr.id, {
                currentValue: completedCount,
                targetValue: totalCount,
              })
              .catch(() => {});

            return {
              ...kr,
              tasks: updatedTasks,
              currentValue: completedCount,
              targetValue: totalCount,
              progressPercent: newPercent,
            };
          }),
        };
      });

      toast.success(
        nextStatus === 'done'
          ? 'تسک تکمیل شد و درصد پیشرفت به‌صورت خودکار افزایش یافت.'
          : 'تسک مجدداً فعال شد و درصد پیشرفت محاسبه گردید.',
      );
    } catch (err: any) {
      toast.error(err?.message || 'خطا در به‌روزرسانی وضعیت تسک.');
    }
  };

  // افزودن سریع تسک درون‌خطی زیر KR + به‌روزرسانی آنی پیشرفت
  const handleQuickAddTask = async (krId: string) => {
    const title = inlineTaskTitles[krId]?.trim();
    if (!title) return;

    setIsAddingTask((prev) => ({ ...prev, [krId]: true }));
    try {
      const created = await campaignService.createTaskUnderKeyResult(campaignId, krId, {
        title,
        priority: 'medium',
      });
      setInlineTaskTitles((prev) => ({ ...prev, [krId]: '' }));

      setStageOkr((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          keyResults: prev.keyResults.map((kr) => {
            if (kr.id !== krId) return kr;
            const newTask: FunnelStageTask = {
              id: created.id,
              title: created.title,
              status: 'todo' as const,
              priority: (created.priority as any) || 'medium',
              dueDate: created.dueDate,
              assignee: created.assignee,
            };
            // اضافه شدن تسک جدید دقیقاً زیر کادر افزودن تسک (در بالای لیست)
            const updatedTasks = [newTask, ...(kr.tasks || [])];
            const completedCount = updatedTasks.filter((t) => t.status === 'done').length;
            const totalCount = updatedTasks.length;
            const newPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            campaignService
              .updateKeyResult(campaignId, kr.id, {
                currentValue: completedCount,
                targetValue: totalCount,
              })
              .catch(() => {});

            return {
              ...kr,
              tasks: updatedTasks,
              tasksCount: totalCount,
              currentValue: completedCount,
              targetValue: totalCount,
              progressPercent: newPercent,
            };
          }),
        };
      });

      toast.success(`تسک "${title}" اضافه شد و نوار پیشرفت خودکار محاسبه گردید.`);
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ایجاد تسک.');
    } finally {
      setIsAddingTask((prev) => ({ ...prev, [krId]: false }));
    }
  };

  // باز کردن پنجره جزئیات کامل تسک (TaskDrawer) با کلیک روی ردیف تسک
  const handleOpenTaskDrawer = async (task: FunnelStageTask) => {
    // ابتدا یک تسک ایمن با تمام آرایه‌ها و فیلدهای لازم می‌سازیم تا خطای رندر یا صفحه سیاه رخ ندهد
    const safeInitialTask: Task = {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || new Date().toISOString(),
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.fullName || task.assignee.email.split('@')[0],
            email: task.assignee.email,
          }
        : undefined,
      subtasks: [],
      comments: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDrawerTask(safeInitialTask);
    setIsTaskDrawerOpen(true);

    try {
      const fullTask = await taskService.getById(task.id);
      if (fullTask) {
        setDrawerTask({
          ...safeInitialTask,
          ...fullTask,
          subtasks: Array.isArray(fullTask.subtasks) ? fullTask.subtasks : [],
          comments: Array.isArray(fullTask.comments) ? fullTask.comments : [],
          history: Array.isArray(fullTask.history) ? fullTask.history : [],
        });
      }
    } catch (e) {
      // در صورت خطا، تسک اولیه ایمن باقی می‌ماند
    }
  };

  // اعمال تغییرات انجام‌شده در TaskDrawer بر روی لیست تسک‌ها و درصد پیشرفت KR
  const handleTaskUpdatedInDrawer = (updatedTask: Task) => {
    setDrawerTask(updatedTask);
    setStageOkr((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        keyResults: prev.keyResults.map((kr) => {
          const hasTask = kr.tasks.some((t) => t.id === updatedTask.id);
          if (!hasTask) return kr;
          return {
            ...kr,
            tasks: kr.tasks.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } as FunnelStageTask : t,
            ),
          };
        }),
      };
    });
  };

  // نمایش تولتیپ مشخصات کامل تسک با هاور ۱ ثانیه (۱۰۰۰ میلی‌ثانیه)
  const handleTaskMouseEnter = (
    e: React.MouseEvent,
    task: FunnelStageTask,
    krTitle: string,
  ) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      const tooltipW = 320;
      const tooltipH = 260;
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

      // تعیین موقعیت هوشمند در محدوده صفحه
      let leftPos = rect.left - (tooltipW + 12);
      if (leftPos < 15) {
        leftPos = rect.right + 12;
      }
      if (leftPos + tooltipW > screenW - 15) {
        leftPos = Math.max(15, screenW - tooltipW - 20);
      }
      if (leftPos < 15) {
        leftPos = 15;
      }

      let topPos = rect.top - 15;
      if (topPos + tooltipH > screenH - 15) {
        topPos = Math.max(15, screenH - tooltipH - 20);
      }

      setHoveredTask({
        task,
        krTitle,
        stageLabel: selectedStage?.label || 'مرحله قیف',
        position: {
          top: topPos,
          left: leftPos,
        },
      });
    }, 1000);
  };

  const handleTaskMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredTask(null);
  };

  return (
    <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl p-5 shadow-xl flex flex-col h-[740px] max-h-[740px] overflow-hidden">
      {/* هدر ثابت بخش OKR */}
      <div className="shrink-0 pb-3.5 border-b border-[#1F2E45] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                {selectedStage ? `مدیریت اهداف و نتایج کلیدی (OKR)` : `نمای جامع اهداف و نتایج کلیدی (OKR)`}
              </h3>
              {selectedStage ? (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: `${selectedStage.color}15`,
                    color: selectedStage.color,
                    borderColor: `${selectedStage.color}40`,
                  }}
                >
                  {selectedStage.label}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  خلاصه همه مراحل
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedStage
                ? `هدف‌گذاری مرحله "${selectedStage.label}"؛ پیشرفت هر KR بر مبنای تسک‌ها خودکار محاسبه می‌شود.`
                : 'خلاصه اهداف کلیه مراحل قیف؛ برای مشاهده یا ویرایش هر مرحله، روی آن کلیک کنید.'}
            </p>
          </div>
        </div>
      </div>

      {/* بدنه محتوا: اسکرول داخلی شهودی هنگامی که تعداد KRها و تسک‌ها زیاد می‌شود */}
      <div className="flex-1 overflow-y-auto mt-4 pl-1 pr-1 space-y-4 custom-scrollbar [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0B1423] [&::-webkit-scrollbar-thumb]:bg-[#1F2E45] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#719BDF]/40">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="text-xs">در حال بارگذاری داده‌های OKR...</span>
          </div>
        ) : !selectedStage ? (
          /* ================= نمای کلی تمام مراحل قیف ================= */
          <div className="space-y-4">
            {/* کارت‌های آماری سرجمع */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0B1423] border border-[#1F2E45] p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <span>اهداف مراحل</span>
                </div>
                <div className="text-lg font-bold text-slate-100 mt-1">
                  {(allOkr?.totalObjectives ?? allStages.length).toLocaleString('fa-IR')}
                </div>
              </div>

              <div className="bg-[#0B1423] border border-[#1F2E45] p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>نتایج کلیدی (KR)</span>
                </div>
                <div className="text-lg font-bold text-slate-100 mt-1">
                  {(allOkr?.totalKeyResults ?? 0).toLocaleString('fa-IR')}
                </div>
              </div>

              <div className="bg-[#0B1423] border border-[#1F2E45] p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>میانگین پیشرفت</span>
                </div>
                <div className="text-lg font-bold text-amber-400 mt-1">
                  %{(allOkr?.averageProgress ?? 0).toLocaleString('fa-IR')}
                </div>
              </div>

              <div className="bg-[#0B1423] border border-[#1F2E45] p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-purple-400" />
                  <span>تسک‌های انجام‌شده</span>
                </div>
                <div className="text-lg font-bold text-slate-100 mt-1">
                  {(allOkr?.completedTasks ?? 0).toLocaleString('fa-IR')} از {(allOkr?.totalTasks ?? 0).toLocaleString('fa-IR')}
                </div>
              </div>
            </div>

            {/* کارت‌های تک‌تک مراحل جهت انتخاب و مدیریت */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>فهرست مراحل قیف و وضعیت اهداف:</span>
                <span className="text-[11px] text-slate-500">برای ورود روی هر کارت کلیک کنید</span>
              </div>

              <div className="space-y-2.5">
                {allStages.map((stage) => {
                  const stageObj = allOkr?.objectives?.find((o) => o.stageKey === stage.key);
                  const keyResults = stageObj?.keyResults || [];
                  const krCount = keyResults.length;
                  const avgProgress =
                    krCount > 0
                      ? Math.round(keyResults.reduce((s, k) => s + k.progressPercent, 0) / krCount)
                      : 0;

                  return (
                    <div
                      key={stage.id}
                      onClick={() => onSelectStage(stage)}
                      className="p-3.5 rounded-xl border border-[#1F2E45] bg-[#0B1423] hover:bg-[#152338] hover:border-blue-500/50 transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: stage.color }}
                          />
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                            {stage.label}
                          </h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#111D2E] text-slate-400 border border-[#1F2E45]">
                            {stage.count.toLocaleString('fa-IR')} سرنخ
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStage(stage);
                          }}
                          className="text-xs font-medium text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 px-3 py-1 rounded-lg border border-blue-500/30 transition-all flex items-center gap-1"
                        >
                          <span>مدیریت این مرحله</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs text-slate-300 line-clamp-1">
                        <span className="text-slate-500 font-semibold">هدف: </span>
                        <span>{stageObj?.title || `هدف مرحله ${stage.label}`}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {krCount > 0
                              ? `${krCount.toLocaleString('fa-IR')} نتیجه کلیدی تعریف شده`
                              : 'بدون نتیجه کلیدی'}
                          </span>
                          <span className="font-bold text-slate-300">
                            %{avgProgress.toLocaleString('fa-IR')} پیشرفت
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#18263A] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${avgProgress}%`,
                              backgroundColor: stage.color || '#3B82F6',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ================= نمای تفصیلی مرحله انتخاب‌شده ================= */
          <div className="space-y-4">
            {/* کارت فیلد هدف (O - Objective) */}
            <div className="bg-[#0B1423] border border-[#1F2E45] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Target className="w-4 h-4 text-blue-400 animate-bounce" />
                  <span>هدف این مرحله (Objective)</span>
                </div>
                {!isEditingObjective && (
                  <button
                    type="button"
                    onClick={() => setIsEditingObjective(true)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:bg-[#18263A] px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>ویرایش هدف</span>
                  </button>
                )}
              </div>

              {isEditingObjective ? (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">عنوان هدف (O):</label>
                    <input
                      type="text"
                      value={objectiveTitle}
                      onChange={(e) => setObjectiveTitle(e.target.value)}
                      placeholder="مثال: افزایش نرخ تبدیل لیدهای مرحله به دمو"
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      توضیحات و راهبرد اجرایی (اختیاری):
                    </label>
                    <textarea
                      value={objectiveDesc}
                      onChange={(e) => setObjectiveDesc(e.target.value)}
                      rows={2}
                      placeholder="توضیحات مربوط به شاخص موفقیت هدف..."
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingObjective(false)}
                      className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-[#1F2E45] cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveObjective}
                      disabled={actionLoading}
                      className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>ذخیره هدف</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                    {stageOkr?.objective?.title || `هدف مرحله ${selectedStage.label}`}
                  </h4>
                  {stageOkr?.objective?.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {stageOkr.objective.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* بخش نتایج کلیدی (Key Results) با رفتار آکاردئونی */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                    نتایج کلیدی (Key Results)
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B1423] text-slate-400 border border-[#1F2E45]">
                    {(stageOkr?.keyResults.length || 0).toLocaleString('fa-IR')} مورد
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddKrModalOpen(true)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن نتیجه کلیدی (KR جدید)</span>
                </button>
              </div>

              {/* لیست نتایج کلیدی */}
              {!stageOkr?.keyResults || stageOkr.keyResults.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-[#1F2E45] bg-[#0B1423]/50 text-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    هنوز هیچ نتیجه کلیدی (KR) برای این مرحله تعریف نشده است.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddKrModalOpen(true)}
                    className="text-xs text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    اولین نتیجه کلیدی این مرحله را تعریف کنید
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stageOkr.keyResults.map((kr) => {
                    const progress = computeKrTaskProgress(kr);
                    const isFullyDone = progress.percent === 100;
                    const isExpanded = Boolean(expandedKrs[kr.id]);

                    const progressColor = isFullyDone
                      ? '#10B981' // زمردی
                      : progress.percent >= 50
                      ? '#3B82F6' // آبی
                      : '#F59E0B'; // کهربایی

                    return (
                      <div
                        key={kr.id}
                        className="bg-[#0B1423] border border-[#1F2E45] rounded-xl overflow-hidden transition-all hover:border-slate-700"
                      >
                        {/* هدر آکاردئونی KR: با کلیک باز یا بسته می‌شود */}
                        <div
                          onClick={() => toggleKrAccordion(kr.id)}
                          className="p-3.5 cursor-pointer hover:bg-[#111D2E]/60 transition-colors space-y-2.5 select-none"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                className="w-6 h-6 rounded-md bg-[#111D2E] border border-[#1F2E45] text-slate-400 flex items-center justify-center shrink-0"
                                title={isExpanded ? 'بستن لیست تسک‌ها' : 'باز کردن لیست تسک‌ها'}
                              >
                                <ChevronLeft
                                  className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                                    isExpanded
                                      ? '-rotate-90 text-blue-400'
                                      : 'rotate-0 text-slate-400'
                                  }`}
                                />
                              </button>

                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                                KR
                              </span>

                              <h5 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                                {kr.title}
                              </h5>

                              {isFullyDone && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 rounded-full shrink-0">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>تکمیل ۱۰۰٪</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-medium text-slate-400">
                                {progress.displayLabel}
                              </span>

                              {/* دکمه حذف KR با باز کردن مودال اختصاصی */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKrToDelete(kr);
                                }}
                                title="حذف این نتیجه کلیدی"
                                className="w-7 h-7 rounded-lg bg-[#111D2E] border border-[#1F2E45] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* نوار پیشرفت خودکار */}
                          <div className="w-full h-2 bg-[#18263A] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress.percent}%`,
                                backgroundColor: progressColor,
                              }}
                            />
                          </div>
                        </div>

                        {/* بدنه آکاردئون با انیمیشن و ترنزیشن نرم (CSS Grid Transition) */}
                        <div
                          className="grid transition-all duration-300 ease-in-out"
                          style={{
                            gridTemplateRows: isExpanded ? '1fr' : '0fr',
                            opacity: isExpanded ? 1 : 0,
                          }}
                        >
                          <div className="overflow-hidden min-h-0">
                            <div className="p-3.5 pt-3 border-t border-[#1F2E45]/60 space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                  <ListTodo className="w-3.5 h-3.5 text-blue-400" />
                                  <span>تسک‌های اجرایی:</span>
                                  <span className="text-slate-500">
                                    ({(kr.tasks?.length || 0).toLocaleString('fa-IR')})
                                  </span>
                                </span>
                              </div>

                              {/* ورودی ایجاد سریع تسک (در بالای لیست تسک‌ها) */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={inlineTaskTitles[kr.id] || ''}
                                  onChange={(e) =>
                                    setInlineTaskTitles((prev) => ({
                                      ...prev,
                                      [kr.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleQuickAddTask(kr.id);
                                    }
                                  }}
                                  placeholder="عنوان تسک جدید برای این KR و فشردن اینتر..."
                                  className="flex-1 bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuickAddTask(kr.id)}
                                  disabled={isAddingTask[kr.id] || !inlineTaskTitles[kr.id]?.trim()}
                                  className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  {isAddingTask[kr.id] ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                  )}
                                  <span>افزودن</span>
                                </button>
                              </div>

                              {/* پیام راهنما در صورتی که هنوز تسکی اضافه نشده باشد */}
                              {(!kr.tasks || kr.tasks.length === 0) && (
                                <div className="py-2.5 px-3 text-[11px] text-slate-400 bg-[#111D2E]/50 rounded-lg border border-dashed border-[#1F2E45]/60 text-center">
                                  هنوز تسکی برای این نتیجه کلیدی ثبت نشده است. عنوان اولین تسک را در کادر بالا وارد کنید.
                                </div>
                              )}

                              {/* لیست تسک‌ها زیر کادر ورودی */}
                              {kr.tasks && kr.tasks.length > 0 && (
                                <div className="space-y-1.5">
                                  {kr.tasks.map((task) => {
                                    const isDone = task.status === 'done';
                                    return (
                                      <div
                                        key={task.id}
                                        onClick={() => handleOpenTaskDrawer(task)}
                                        onMouseEnter={(e) => handleTaskMouseEnter(e, task, kr.title)}
                                        onMouseLeave={handleTaskMouseLeave}
                                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer group/task ${
                                          isDone
                                            ? 'bg-[#111D2E]/40 border-[#1F2E45]/50 opacity-70 hover:opacity-100 hover:border-blue-500/40'
                                            : 'bg-[#111D2E] border-[#1F2E45] hover:border-blue-500/60 hover:bg-[#18263A]'
                                        }`}
                                        title="کلیک برای باز کردن و ویرایش جزئیات کامل تسک"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleTaskStatus(task, kr.id);
                                            }}
                                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                              isDone
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-[#1F2E45] hover:border-blue-400 bg-[#0B1423]'
                                            }`}
                                            title={
                                              isDone
                                                ? 'علامت به عنوان انجام‌نشده'
                                                : 'علامت به عنوان انجام‌شده'
                                            }
                                          >
                                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                                          </button>
                                          <span
                                            className={`truncate font-medium ${
                                              isDone ? 'line-through text-slate-500' : 'text-slate-200'
                                            }`}
                                          >
                                            {task.title}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                          {/* بج تعاملی اولویت: قابل تغییر با کلیک و انتخاب از دراپ‌داون */}
                                          <div
                                            className="relative inline-flex items-center"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <select
                                              value={task.priority || 'medium'}
                                              onChange={(e) =>
                                                handleUpdateTaskPriority(
                                                  task.id,
                                                  e.target.value as any,
                                                  kr.id,
                                                )
                                              }
                                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border appearance-none cursor-pointer focus:outline-none transition-colors ${
                                                task.priority === 'urgent'
                                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                                                  : task.priority === 'high'
                                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                                                  : task.priority === 'low'
                                                  ? 'bg-slate-700/50 text-slate-300 border-slate-600/40 hover:bg-slate-700/70'
                                                  : 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25'
                                              }`}
                                              title="کلیک برای تغییر سریع اولویت"
                                            >
                                              <option value="urgent" className="bg-[#111D2E] text-rose-400">
                                                فوری
                                              </option>
                                              <option value="high" className="bg-[#111D2E] text-amber-400">
                                                بالا
                                              </option>
                                              <option value="medium" className="bg-[#111D2E] text-blue-400">
                                                متوسط
                                              </option>
                                              <option value="low" className="bg-[#111D2E] text-slate-300">
                                                پایین
                                              </option>
                                            </select>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= مودال تایید حذف نتیجه کلیدی (جایگزین window.confirm) ================= */}
      {krToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            dir="rtl"
            className="bg-[#111D2E] border border-rose-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-[#1F2E45]">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">حذف نتیجه کلیدی (Key Result)</h4>
                <p className="text-xs text-slate-400">این عملیات غیرقابل بازگشت است</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              آیا از حذف نتیجه کلیدی <span className="font-bold text-white">«{krToDelete.title}»</span> اطمینان دارید؟
              تسک‌های ثبت‌شده در سیستم تسک‌ها حفظ خواهند شد، اما انتساب آنها به این KR حذف می‌شود.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setKrToDelete(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg border border-[#1F2E45] transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteKr}
                disabled={actionLoading}
                className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>حذف قطعی نتیجه کلیدی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال افزودن KR جدید ================= */}
      {isAddKrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            dir="rtl"
            className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  افزودن نتیجه کلیدی جدید (Key Result)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddKrModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKeyResult} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  عنوان نتیجه کلیدی:
                </label>
                <input
                  type="text"
                  required
                  value={newKrTitle}
                  onChange={(e) => setNewKrTitle(e.target.value)}
                  placeholder="مثال: برگزاری جلسات دمو با لیدها"
                  className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsAddKrModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg border border-[#1F2E45] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ایجاد نتیجه کلیدی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= تولتیپ کارت مشخصات کامل تسک با هاور ۱ ثانیه ================= */}
      {hoveredTask && (
        <div
          style={{
            position: 'fixed',
            top: `${hoveredTask.position.top}px`,
            left: `${hoveredTask.position.left}px`,
          }}
          className="z-50 w-80 bg-[#0F172A]/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-right space-y-3 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          dir="rtl"
        >
          {/* هدر تولتیپ: عنوان تسک + نشانگر وضعیت و اولویت */}
          <div className="space-y-1.5 pb-2.5 border-b border-[#1F2E45]">
            <div className="flex items-start justify-between gap-2">
              <h5 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5 leading-snug">
                <ListTodo size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{hoveredTask.task.title}</span>
              </h5>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                  hoveredTask.task.priority === 'urgent'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : hoveredTask.task.priority === 'high'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : hoveredTask.task.priority === 'low'
                    ? 'bg-slate-700/50 text-slate-300 border-slate-600/30'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}
              >
                {hoveredTask.task.priority === 'urgent'
                  ? 'فوری'
                  : hoveredTask.task.priority === 'high'
                  ? 'بالا'
                  : hoveredTask.task.priority === 'low'
                  ? 'پایین'
                  : 'متوسط'}
              </span>

              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                  hoveredTask.task.status === 'done'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : hoveredTask.task.status === 'in_progress'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-slate-700/40 text-slate-300 border-slate-600/30'
                }`}
              >
                {hoveredTask.task.status === 'done'
                  ? 'انجام‌شده'
                  : hoveredTask.task.status === 'in_progress'
                  ? 'در حال انجام'
                  : 'برای انجام'}
              </span>
            </div>
          </div>

          {/* بدنه تولتیپ: جزئیات تسک */}
          <div className="space-y-2 text-[11px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <User size={12} className="text-slate-500" />
                <span>مسئول تسک:</span>
              </span>
              <span className="font-medium text-slate-200">
                {(hoveredTask.task as any).assignee?.name || 'تخصیص‌نیافته'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Layers size={12} className="text-slate-500" />
                <span>مرحله قیف:</span>
              </span>
              <span className="font-semibold text-blue-400">
                {hoveredTask.stageLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Target size={12} className="text-slate-500" />
                <span>نتیجه کلیدی (KR):</span>
              </span>
              <span
                className="font-medium text-slate-200 truncate max-w-[170px]"
                title={hoveredTask.krTitle}
              >
                {hoveredTask.krTitle}
              </span>
            </div>

            {hoveredTask.task.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar size={12} className="text-slate-500" />
                  <span>سررسید:</span>
                </span>
                <span className="font-mono text-slate-200">
                  {formatShamsiDate(hoveredTask.task.dueDate)}
                </span>
              </div>
            )}

            {(hoveredTask.task as any).description && (
              <div className="pt-1 border-t border-[#1F2E45]/60 text-[10px] text-slate-400 line-clamp-2">
                {(hoveredTask.task as any).description}
              </div>
            )}
          </div>

          {/* فوتر تولتیپ: راهنمای اقدام */}
          <div className="pt-2 border-t border-[#1F2E45] flex items-center justify-between text-[10px] text-blue-400 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles size={11} />
              <span>کلیک برای باز کردن و ویرایش جزئیات کامل</span>
            </span>
            <ArrowUpRight size={12} />
          </div>
        </div>
      )}

      {/* ================= پنجره کشویی کامل جزئیات تسک (TaskDrawer) ================= */}
      <TaskDrawer
        task={drawerTask}
        isOpen={isTaskDrawerOpen}
        onClose={() => {
          setIsTaskDrawerOpen(false);
          setDrawerTask(null);
        }}
        onTaskUpdated={handleTaskUpdatedInDrawer}
      />
    </div>
  );
}
