'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  CheckSquare,
  Users,
  User,
  RotateCcw,
  AlertCircle,
  Filter,
  Layers,
  Sparkles,
  LayoutList,
  Kanban,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { FilterBar, type FilterConfig } from '@/components/common/filter-bar';
import { EmptyState } from '@/components/common/empty-state';
import { useToast } from '@/components/common/toast-provider';
import {
  taskService,
  type Task,
  type TaskFilters,
  type StoredTaskStatus,
  type TaskPriority,
  type TaskRelatedType,
  TASK_STATUS_MAP,
  groupTasks,
  TaskGroupSection,
  TaskItemRow,
  TaskQuickAdd,
  TaskDrawer,
  TaskBoardColumn,
  DEFAULT_CURRENT_USER,
} from '@/features/tasks';

const STATUS_FILTER_OPTIONS = [
  { label: 'انجام نشده', value: 'todo' },
  { label: 'در جریان', value: 'in_progress' },
  { label: 'در انتظار', value: 'waiting' },
  { label: 'انجام شد', value: 'done' },
  { label: 'عقب‌افتاده (دارای تأخیر)', value: 'overdue' },
];

const INITIAL_ASSIGNEE_FILTER_OPTIONS = [
  { label: 'بدون مسئول (تخصیص‌نیافته)', value: 'unassigned' },
];

const RELATED_TYPE_OPTIONS = [
  { label: 'کمپین‌های دیجیتال مارکتینگ', value: 'campaign' },
  { label: 'سرنخ‌ها و لیدها (Leads)', value: 'lead' },
  { label: 'رویدادها و وبینارها', value: 'webinar' },
];



function TasksContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ۱. پارامترهای فعال فیلتر و اسکوپ از آدرس URL
  const scopeParam = (searchParams.get('scope') as 'my' | 'team') || 'team';
  const viewParam = searchParams.get('view') || 'list';
  const currentView: 'list' | 'board' = viewParam === 'board' ? 'board' : 'list';
  const searchQuery = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || '';
  const assigneeFilter = searchParams.get('assigneeId') || '';
  const relatedTypeFilter = (searchParams.get('relatedType') as TaskRelatedType) || '';

  const selectedStatuses = React.useMemo(() => {
    return statusParam ? statusParam.split(',').filter(Boolean) : [];
  }, [statusParam]);

  // وضعیت محلی ورودی جستجو
  const [searchInput, setSearchInput] = React.useState(searchQuery);
  React.useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // ۲. وضعیت داده‌های صفحه
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = React.useState<any[]>([]);
  const [assigneeOptions, setAssigneeOptions] = React.useState(INITIAL_ASSIGNEE_FILTER_OPTIONS);

  React.useEffect(() => {
    if (taskService.getAssignees) {
      taskService
        .getAssignees()
        .then((list) => {
          if (list && list.length > 0) {
            setAvailableUsers(list);
            setAssigneeOptions([
              { label: 'بدون مسئول (تخصیص‌نیافته)', value: 'unassigned' },
              ...list.map((u) => ({
                label: `${u.name} (${u.role || 'کاربر'})`,
                value: u.id,
              })),
            ]);
          }
        })
        .catch(() => {});
    }
  }, []);

  const filterConfigs = React.useMemo<FilterConfig[]>(
    () => [
      {
        id: 'status',
        label: 'وضعیت تسک',
        type: 'multi-select',
        placeholder: 'همه وضعیت‌ها...',
        options: STATUS_FILTER_OPTIONS,
      },
      {
        id: 'assigneeId',
        label: 'مسئول انجام',
        type: 'select',
        placeholder: 'همه مسئولان...',
        options: assigneeOptions,
      },
      {
        id: 'relatedType',
        label: 'مرتبط با',
        type: 'select',
        placeholder: 'همه بخش‌ها...',
        options: RELATED_TYPE_OPTIONS,
      },
    ],
    [assigneeOptions]
  );

  // وضعیت تعامل با تسک‌ها و Drawer
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [togglingTaskId, setTogglingTaskId] = React.useState<string | null>(null);

  // ۳. واکشی داده‌ها از سرور واقعی بک‌اند
  const fetchTasks = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: TaskFilters = {
        scope: scopeParam,
        currentUserId: DEFAULT_CURRENT_USER.id,
      };

      if (searchQuery) filters.search = searchQuery;

      if (selectedStatuses.length > 0) {
        if (selectedStatuses.includes('overdue')) {
          filters.status = 'overdue';
        } else {
          filters.status = selectedStatuses as StoredTaskStatus[];
        }
      }

      if (assigneeFilter) filters.assigneeId = assigneeFilter;
      if (relatedTypeFilter) filters.relatedType = relatedTypeFilter;

      const data = await taskService.getAll(filters);
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در بارگذاری لیست تسک‌ها'
      );
    } finally {
      setLoading(false);
    }
  }, [scopeParam, searchQuery, selectedStatuses, assigneeFilter, relatedTypeFilter]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ۴. به‌روزرسانی پارامترهای آدرس URL با حفظ سایر پارامترها
  const updateUrlParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });

      const qs = current.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // تغییر سوئیچ حوزه تسک‌ها (من / تیم)
  const handleScopeChange = (newScope: 'my' | 'team') => {
    if (newScope === scopeParam) return;
    updateUrlParams({ scope: newScope === 'team' ? null : 'my' });
  };

  // تغییر نمای نمایش (فهرست / برد کانبان)
  const handleViewChange = (newView: 'list' | 'board') => {
    if (newView === currentView) return;
    updateUrlParams({ view: newView === 'board' ? 'board' : 'list' });
  };

  // Drag & Drop و به‌روزرسانی خوش‌بینانه وضعیت
  const [draggingTaskId, setDraggingTaskId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<StoredTaskStatus | null>(null);
  const updatingIdsRef = React.useRef<Set<string>>(new Set());

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    try {
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      // ignore
    }
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOverColumn = (status: StoredTaskStatus) => {
    setDragOverColumn(status);
  };

  const handleDragLeaveColumn = () => {
    setDragOverColumn(null);
  };

  const handleStatusChange = async (taskId: string, targetStatus: StoredTaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return;
    if (updatingIdsRef.current.has(taskId)) return;

    updatingIdsRef.current.add(taskId);

    // ذخیره وضعیت پیش از تغییر برای Rollback در صورت بروز خطا
    const previousTasks = [...tasks];
    const previousSelectedTask = selectedTask;

    // به‌روزرسانی خوش‌بینانه محلی (Optimistic Update)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              completedAt: targetStatus === 'done' ? (t.completedAt || new Date().toISOString()) : undefined,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );

    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status: targetStatus,
              completedAt: targetStatus === 'done' ? (prev.completedAt || new Date().toISOString()) : undefined,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }

    try {
      const updated = await taskService.updateStatus(taskId, targetStatus);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
      }
      toast.success(`وضعیت به «${TASK_STATUS_MAP[targetStatus]?.label || targetStatus}» تغییر یافت.`);
    } catch (err: any) {
      // Rollback در صورت خطا
      setTasks(previousTasks);
      if (previousSelectedTask?.id === taskId) {
        setSelectedTask(previousSelectedTask);
      }
      toast.error(err?.message || 'خطا در تغییر وضعیت تسک. تغییرات بازگردانده شد.');
    } finally {
      updatingIdsRef.current.delete(taskId);
      setDraggingTaskId(null);
      setDragOverColumn(null);
    }
  };

  // اعمال فیلترهای نوار FilterBar
  const handleFilterChange = (filterId: string, value: any) => {
    if (filterId === 'status') {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      updateUrlParams({ status: arr.length > 0 ? arr.join(',') : null });
    } else if (filterId === 'assigneeId') {
      updateUrlParams({ assigneeId: value || null });
    } else if (filterId === 'relatedType') {
      updateUrlParams({ relatedType: value || null });
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
    updateUrlParams({ search: query ? query.trim() : null });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    updateUrlParams({
      search: null,
      status: null,
      assigneeId: null,
      relatedType: null,
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedStatuses.length > 0 || assigneeFilter || relatedTypeFilter
  );

  // ۵. ایجاد سریع تسک جدید
  const handleTaskCreated = (newTask: Task) => {
    toast.success(`تسک «${newTask.title}» با موفقیت اضافه شد.`);
    // افزودن تسک جدید به آرایه جاری و گروه‌بندی مجدد
    setTasks((prev) => [newTask, ...prev]);
  };

  // ۶. تغییر وضعیت تیک انجام تسک
  const handleToggleComplete = async (task: Task, completed: boolean) => {
    setTogglingTaskId(task.id);
    try {
      const updated = await taskService.toggleComplete(task.id, completed);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }

      toast.success(
        completed ? 'تسک تکمیل شد.' : 'تسک مجدداً فعال گردید.'
      );
    } catch (err: any) {
      toast.error(err?.message || 'خطا در تغییر وضعیت تکمیل تسک.');
    } finally {
      setTogglingTaskId(null);
    }
  };

  // ۷. باز کردن Drawer جزئیات
  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  // ۸. به‌روزرسانی تسک از داخل Drawer
  const handleTaskUpdatedInDrawer = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };

  // ۹. گروه‌بندی تسک‌ها در ۵ دسته زمانی تعریف‌شده در سند (برای نمای فهرست)
  const taskGroups = React.useMemo(() => {
    return groupTasks(tasks);
  }, [tasks]);

  // ۱۰. تفکیک تسک‌ها بر اساس ۴ ستون اصلی کانبان (برای نمای برد)
  const BOARD_STATUSES: StoredTaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];

  const boardColumns = React.useMemo(() => {
    const cols: Record<StoredTaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      waiting: [],
      done: [],
    };
    tasks.forEach((task) => {
      if (cols[task.status]) {
        cols[task.status].push(task);
      } else {
        cols.todo.push(task);
      }
    });
    return cols;
  }, [tasks]);

  const totalTasksCount = tasks.length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر صفحه و سوئیچ‌ها */}
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'فرآیندها و ابزارها' },
            { label: 'مدیریت تسک‌ها' },
          ]}
        />

        <div className="relative rounded-3xl bg-gradient-to-r from-[#0B1423] via-[#111D2E] to-[#0B1423] border border-[#1F2E45] p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <svg className="w-full h-full" viewBox="0 0 1200 300" fill="none" preserveAspectRatio="none">
              <path d="M0 150 C 300 50, 600 250, 1200 100" stroke="#719BDF" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#719BDF] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#719BDF] shadow-[0_0_8px_#719BDF]" />
                <span>اجرا، مدیریت فرآیندها و تسک‌ها</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 font-display tracking-tight">
                مدیریت تسک‌ها
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                پیگیری، سازماندهی و اولویت‌بندی اقدامات اجرایی تیم مارکتینگ و فروش با چرخه حیات استاندارد
              </p>
            </div>

            {/* سوئیچ‌ها: نمای فهرست/برد و حوزه من/تیم */}
            <div className="flex items-center gap-3 flex-wrap self-start lg:self-auto">
              {/* سوئیچ حالت نمایش (فهرست / برد) */}
              <div className="flex items-center bg-[#0B1423] p-1 rounded-xl border border-[#1F2E45] shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewChange('list')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === 'list'
                      ? 'bg-gradient-to-r from-[#719BDF] to-[#3B82F6] text-white shadow-[0_0_12px_rgba(113,155,223,0.3)] font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="نمای فهرست"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>فهرست</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleViewChange('board')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === 'board'
                      ? 'bg-gradient-to-r from-[#719BDF] to-[#3B82F6] text-white shadow-[0_0_12px_rgba(113,155,223,0.3)] font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="نمای برد (کانبان)"
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>برد</span>
                </button>
              </div>

              {/* سوئیچ تسک‌های من / تسک‌های تیم */}
              <div className="flex items-center bg-[#0B1423] p-1 rounded-xl border border-[#1F2E45] shrink-0">
                <button
                  type="button"
                  onClick={() => handleScopeChange('my')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    scopeParam === 'my'
                      ? 'bg-gradient-to-r from-[#719BDF] to-[#3B82F6] text-white shadow-[0_0_12px_rgba(113,155,223,0.3)] font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>تسک‌های من</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScopeChange('team')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    scopeParam === 'team'
                      ? 'bg-gradient-to-r from-[#719BDF] to-[#3B82F6] text-white shadow-[0_0_12px_rgba(113,155,223,0.3)] font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>تسک‌های تیم</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* نوار فیلتر و جستجو */}
      <FilterBar
        filtersConfig={filterConfigs}
        selectedFilters={{
          status: selectedStatuses,
          assigneeId: assigneeFilter,
          relatedType: relatedTypeFilter,
        }}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearFilters}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder="جستجو در عنوان یا توضیحات تسک..."
        hasActiveFilters={hasActiveFilters}
      />

      {/* بخش افزودن سریع تسک */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-[#1F2E45] shadow-xl">
        <TaskQuickAdd onTaskCreated={handleTaskCreated} />
      </div>

      {/* محتوای اصلی: وضعیت‌های بارگذاری، خطا، خالی بودن یا لیست/برد گروه‌ها */}
      {loading ? (
        <TasksSkeleton view={currentView} />
      ) : error ? (
        <div className="p-8 bg-[#D66B73]/10 border border-[#D66B73]/30 rounded-2xl text-center space-y-3 shadow-xl">
          <AlertCircle className="w-8 h-8 text-[#D66B73] mx-auto" />
          <h3 className="text-base font-bold text-slate-100 font-display">
            خطا در بارگذاری تسک‌ها
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchTasks}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#D66B73] hover:bg-[#E07C84] rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تلاش دوباره</span>
          </button>
        </div>
      ) : totalTasksCount === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="تسکی با این فیلترها یافت نشد"
            description="فیلترهای انتخابی یا عبارت جستجو با هیچ تسکی انطباق ندارد. می‌توانید فیلترها را پاک کنید."
            action={{
              label: 'پاک کردن فیلترها',
              onClick: handleClearFilters,
            }}
          />
        ) : (
          <EmptyState
            title="هیچ تسکی وجود ندارد"
            description="هنوز تسکی در این بخش ایجاد نشده است. می‌توانید از کادر بالا اولین تسک را به سرعت ثبت کنید."
            action={{
              label: 'تازه‌سازی لیست',
              onClick: fetchTasks,
            }}
          />
        )
      ) : currentView === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[460px]">
          {BOARD_STATUSES.map((status) => (
            <TaskBoardColumn
              key={status}
              status={status}
              tasks={boardColumns[status]}
              count={boardColumns[status].length}
              isDragOver={dragOverColumn === status}
              draggingTaskId={draggingTaskId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOverColumn}
              onDragLeave={handleDragLeaveColumn}
              onDrop={handleStatusChange}
              onOpenDetails={handleOpenDetails}
              onMobileStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {taskGroups.map((group) => (
            <TaskGroupSection
              key={group.key}
              groupKey={group.key}
              title={group.label}
              count={group.count}
              hideIfEmpty={true}
            >
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <TaskItemRow
                    key={task.id}
                    task={task}
                    onOpenDetails={handleOpenDetails}
                    onToggleComplete={handleToggleComplete}
                    isToggling={togglingTaskId === task.id}
                  />
                ))}
              </div>
            </TaskGroupSection>
          ))}
        </div>
      )}

      {/* کشوی مشخصات و ویرایش کامل تسک */}
      <TaskDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onTaskUpdated={handleTaskUpdatedInDrawer}
        users={availableUsers}
      />
    </div>
  );
}

function TasksSkeleton({ view = 'list' }: { view?: 'list' | 'board' }) {
  if (view === 'board') {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 animate-pulse" dir="rtl">
        {[1, 2, 3, 4].map((col) => (
          <div
            key={col}
            className="flex flex-col rounded-2xl border border-[#1F2E45] bg-[#0B1423]/70 p-3.5 min-w-[280px] sm:min-w-[300px] flex-1 space-y-3"
          >
            <div className="h-6 bg-[#18263A] rounded-md w-1/3" />
            <div className="h-28 bg-[#111D2E] border border-[#1F2E45] rounded-xl" />
            <div className="h-28 bg-[#111D2E] border border-[#1F2E45] rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      {[1, 2, 3].map((g) => (
        <div key={g} className="space-y-3">
          <div className="h-6 w-36 bg-[#18263A] rounded-md" />
          <div className="space-y-2">
            {[1, 2].map((r) => (
              <div
                key={r}
                className="h-16 bg-[#111D2E] border border-[#1F2E45] rounded-2xl"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  return (
    <React.Suspense fallback={<TasksSkeleton />}>
      <TasksContent />
    </React.Suspense>
  );
}
