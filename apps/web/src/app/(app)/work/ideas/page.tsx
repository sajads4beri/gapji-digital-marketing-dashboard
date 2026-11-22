'use client';

import * as React from 'react';
import { useToast } from '@/components/common/toast-provider';
import { useAuthStore } from '@/stores/auth-store';
import {
  ideasApi,
  IdeaItem,
  IdeaStatus,
} from '@/features/ideas';
import {
  Lightbulb,
  ThumbsUp,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Sparkles,
  CheckSquare,
  Tag,
  User,
  Calendar,
  X,
  ExternalLink,
  MessageSquare,
  Flame,
  Award,
  TrendingUp,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';

const CATEGORIES = [
  'همه',
  'کمپین و تبلیغات',
  'تولید محتوا',
  'بهینه‌سازی لید',
  'اتوماسیون و ابزار',
  'عملیات و فرآیند',
  'سایر',
];

const STATUS_MAP: Record<
  IdeaStatus,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  submitted: {
    label: 'ثبت‌شده',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    desc: 'در انتظار بازبینی اولیه تیم',
  },
  reviewing: {
    label: 'در حال بررسی',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    desc: 'توسط مدیران در دست ارزیابی است',
  },
  approved: {
    label: 'تاییدشده',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    desc: 'مورد موافقت قرار گرفته و آماده اجراست',
  },
  implemented: {
    label: 'اجراشده',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    desc: 'پیاده‌سازی شده و نتایج آن در حال سنجش است',
  },
  rejected: {
    label: 'ردشده',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    desc: 'در حال حاضر قابل اجرا تشخیص داده نشد',
  },
};

export default function IdeasPage() {
  const { toast } = useToast();
  const { user, activeRole } = useAuthStore();
  const role = activeRole || (user as any)?.role;
  const isManager = role === 'admin' || role === 'marketing_manager';

  const [ideas, setIdeas] = React.useState<IdeaItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // فیلترها و مرتب‌سازی
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('همه');
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<'votes' | 'newest'>('votes');

  // مودال ثبت ایده
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState('');
  const [formCategory, setFormCategory] = React.useState('کمپین و تبلیغات');
  const [formDescription, setFormDescription] = React.useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = React.useState(false);

  // مودال تبدیل به وظیفه
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [selectedIdeaForTask, setSelectedIdeaForTask] = React.useState<IdeaItem | null>(null);
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskDueDate, setTaskDueDate] = React.useState('');
  const [taskPriority, setTaskPriority] = React.useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isConvertingTask, setIsConvertingTask] = React.useState(false);

  // مودال تغییر وضعیت (ویژه مدیران)
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [selectedIdeaForStatus, setSelectedIdeaForStatus] = React.useState<IdeaItem | null>(null);
  const [targetStatus, setTargetStatus] = React.useState<IdeaStatus>('reviewing');
  const [outcomeNotes, setOutcomeNotes] = React.useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // واکشی لیست ایده‌ها
  const loadIdeas = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ideasApi.getIdeas({
        category: selectedCategory === 'همه' ? undefined : selectedCategory,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchQuery,
        sortBy,
      });
      setIdeas(data);
    } catch (err) {
      toast.error('خطا در بارگذاری بانک ایده‌ها');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery, sortBy, toast]);

  React.useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  // رأی‌دهی تک‌کلیکه بازگشت‌پذیر با بروزرسانی خوش‌بینانه
  const handleToggleVote = async (idea: IdeaItem) => {
    const prevHasVoted = idea.hasVoted;
    const prevVotesCount = idea.votesCount;

    const nextHasVoted = !prevHasVoted;
    const nextVotesCount = nextHasVoted ? prevVotesCount + 1 : Math.max(0, prevVotesCount - 1);

    // اعمال خوش‌بینانه در وضعیت
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === idea.id ? { ...i, hasVoted: nextHasVoted, votesCount: nextVotesCount } : i
      )
    );

    try {
      const res = await ideasApi.toggleVote(idea.id);
      // تطبیق با مقدار نهایی دریافتی از سرور
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id ? { ...i, hasVoted: res.hasVoted, votesCount: res.votesCount } : i
        )
      );

      if (res.hasVoted) {
        toast.success('رأی مثبت شما با موفقیت ثبت شد!');
      } else {
        toast.info('رأی شما لغو گردید.');
      }
    } catch (err) {
      // بازگردانی در صورت خطا
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id ? { ...i, hasVoted: prevHasVoted, votesCount: prevVotesCount } : i
        )
      );
      toast.error('خطا در ثبت رأی');
    }
  };

  // ثبت ایده جدید
  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      toast.warning('لطفاً عنوان و شرح ایده را وارد نمایید.');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      await ideasApi.createIdea({
        title: formTitle,
        category: formCategory,
        description: formDescription,
      });
      toast.success('ایده نوآورانه شما با موفقیت ثبت شد و در دسترس تیم قرار گرفت.');
      setIsCreateModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      loadIdeas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ثبت ایده');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // باز کردن مودال تبدیل به وظیفه
  const handleOpenTaskModal = (idea: IdeaItem) => {
    setSelectedIdeaForTask(idea);
    setTaskTitle(`[اجرای ایده] ${idea.title}`);
    setTaskDueDate('');
    setTaskPriority('medium');
    setIsTaskModalOpen(true);
  };

  // تبدیل به وظیفه عملیاتی
  const handleConvertToTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdeaForTask) return;

    setIsConvertingTask(true);
    try {
      const res = await ideasApi.convertToTask(selectedIdeaForTask.id, {
        title: taskTitle,
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
      });
      toast.success(res.message);
      setIsTaskModalOpen(false);
      loadIdeas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در تبدیل ایده به وظیفه');
    } finally {
      setIsConvertingTask(false);
    }
  };

  // باز کردن مودال تغییر وضعیت ایده
  const handleOpenStatusModal = (idea: IdeaItem) => {
    setSelectedIdeaForStatus(idea);
    setTargetStatus(idea.status);
    setOutcomeNotes(idea.outcomeNotes || '');
    setIsStatusModalOpen(true);
  };

  // ثبت تغییر وضعیت
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdeaForStatus) return;

    setIsUpdatingStatus(true);
    try {
      await ideasApi.updateStatus(selectedIdeaForStatus.id, {
        status: targetStatus,
        outcomeNotes: outcomeNotes || undefined,
      });
      toast.success('وضعیت ایده با موفقیت به‌روزرسانی شد.');
      setIsStatusModalOpen(false);
      loadIdeas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در تغییر وضعیت ایده');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // فرمت تاریخ شمسی
  const formatPersianDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // محاسبات KPI
  const totalApproved = ideas.filter((i) => i.status === 'approved' || i.status === 'implemented').length;
  const totalConverted = ideas.filter((i) => i.taskId !== null).length;
  const totalVotes = ideas.reduce((acc, i) => acc + i.votesCount, 0);

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-display flex items-center gap-2.5">
            <Lightbulb className="text-amber-400" size={26} />
            <span>بانک ایده‌ها و نوآوری (Ideas Incubator)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            محیط مشارکتی تیم برای پیشنهاد ایده‌های رشد، کمپین‌های خلاقانه و رأی‌گیری جمعی
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors shadow-lg shadow-[#719BDF]/20 cursor-pointer"
        >
          <Plus size={18} />
          <span>ثبت ایده نوآورانه</span>
        </button>
      </div>

      {/* کارت‌های آماری KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-400" />
            <span>کل ایده‌های ثبت‌شده</span>
          </div>
          <div className="text-xl font-black text-slate-100">{ideas.length} ایده</div>
          <div className="text-[10px] text-slate-500">پیشنهادات خلاقانه تیم</div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <ThumbsUp size={14} className="text-[#719BDF]" />
            <span>مجموع آرای مشارکتی</span>
          </div>
          <div className="text-xl font-black text-[#719BDF]">{totalVotes} رأی</div>
          <div className="text-[10px] text-slate-500">امتیازدهی جمعی اعضا</div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Award size={14} className="text-emerald-400" />
            <span>ایده‌های تایید یا اجراشده</span>
          </div>
          <div className="text-xl font-black text-emerald-400">{totalApproved} ایده</div>
          <div className="text-[10px] text-slate-500">
            {ideas.length > 0 ? Math.round((totalApproved / ideas.length) * 100) : 0}٪ نرخ پذیرش
          </div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <CheckSquare size={14} className="text-indigo-400" />
            <span>تبدیل به تسک عملیاتی</span>
          </div>
          <div className="text-xl font-black text-indigo-400">{totalConverted} تسک</div>
          <div className="text-[10px] text-slate-500">وارد جریان کار شده‌اند</div>
        </div>
      </div>

      {/* نوار جستجو، فیلترها و مرتب‌سازی */}
      <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، شرح یا دسته‌بندی ایده..."
              className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#719BDF]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* انتخاب وضعیت */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="submitted">ثبت‌شده</option>
              <option value="reviewing">در حال بررسی</option>
              <option value="approved">تاییدشده</option>
              <option value="implemented">اجراشده</option>
              <option value="rejected">ردشده</option>
            </select>

            {/* سوییچ مرتب‌سازی */}
            <div className="flex items-center bg-[#18263A] border border-[#1F2E45] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setSortBy('votes')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortBy === 'votes'
                    ? 'bg-[#719BDF] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame size={13} />
                <span>محبوب‌ترین</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-[#719BDF] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={13} />
                <span>جدیدترین</span>
              </button>
            </div>
          </div>
        </div>

        {/* پیل‌های دسته‌بندی */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#719BDF] text-slate-950 font-bold'
                    : 'bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#1F2E45]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* لیست کارت‌های ایده‌ها */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#111D2E] p-5 rounded-2xl border border-[#1F2E45] animate-pulse space-y-3">
              <div className="h-5 bg-[#18263A] rounded w-1/3" />
              <div className="h-4 bg-[#18263A] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-[#111D2E] p-12 rounded-2xl border border-[#1F2E45] text-center space-y-3">
          <Lightbulb className="mx-auto text-slate-600" size={40} />
          <p className="text-sm font-bold text-slate-300">ایده‌ای مطابق با فیلترهای انتخابی یافت نشد.</p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#719BDF] text-slate-950"
          >
            <Plus size={16} />
            <span>ثبت اولین ایده</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => {
            const statusMeta = STATUS_MAP[idea.status] || STATUS_MAP.submitted;

            return (
              <div
                key={idea.id}
                className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 hover:border-slate-700 transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* دکمه ۱-کلیکه رأی مثبت (Upvote Engine) */}
                  <button
                    type="button"
                    onClick={() => handleToggleVote(idea)}
                    className={`flex flex-col items-center justify-center w-14 h-16 rounded-2xl border shrink-0 transition-all ${
                      idea.hasVoted
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-md shadow-amber-500/10 scale-105'
                        : 'bg-[#18263A] text-slate-400 border-[#1F2E45] hover:text-amber-400 hover:border-amber-500/30'
                    }`}
                    title={idea.hasVoted ? 'کلیک جهت لغو رأی' : 'کلیک جهت ثبت رأی مثبت'}
                  >
                    <ThumbsUp size={18} fill={idea.hasVoted ? 'currentColor' : 'none'} />
                    <span className="font-mono text-xs font-black mt-1">{idea.votesCount}</span>
                  </button>

                  {/* شرح و اطلاعات ایده */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[#719BDF] bg-[#719BDF]/10 px-2 py-0.5 rounded border border-[#719BDF]/20">
                        {idea.category}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        title={statusMeta.desc}
                      >
                        {statusMeta.label}
                      </span>

                      {idea.campaign && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>کمپین:</span>
                          <strong className="text-slate-300">{idea.campaign.name}</strong>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-100">
                      {idea.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line max-w-2xl">
                      {idea.description}
                    </p>

                    {/* یادداشت نتیجه بررسی مدیر */}
                    {idea.outcomeNotes && (
                      <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 max-w-xl">
                        <strong>نظر سرپرست/مدیر:</strong> {idea.outcomeNotes}
                      </div>
                    )}

                    {/* پیوند به وظیفه متناظر */}
                    {idea.task && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                        <CheckSquare size={13} />
                        <span>لینک شده به تسک: <strong>{idea.task.title}</strong></span>
                      </div>
                    )}

                    {/* پانویس ایده */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        <span>پیشنهاددهنده: {idea.author?.fullName || 'کاربر سیستم'}</span>
                      </span>
                      <span>•</span>
                      <span>{formatPersianDate(idea.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* دکمه‌های عملیاتی ایده */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1F2E45]">
                  {/* دکمه تبدیل به وظیفه اگر هنوز تسک نشده */}
                  {!idea.taskId && (
                    <button
                      type="button"
                      onClick={() => handleOpenTaskModal(idea)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 hover:bg-[#719BDF]/25 transition-colors"
                      title="ایجاد وظیفه عملیاتی در تسک‌ها بر اساس این ایده"
                    >
                      <CheckSquare size={14} />
                      <span>تبدیل به وظیفه</span>
                    </button>
                  )}

                  {/* دکمه مدیریت وضعیت ویژه مدیران */}
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(idea)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#18263A] text-slate-300 hover:text-white border border-[#1F2E45] hover:bg-[#1F2E45] transition-colors"
                    >
                      <span>تغییر وضعیت</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال ثبت ایده جدید */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Lightbulb className="text-amber-400" size={18} />
                <span>ثبت ایده نوآورانه جدید</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">عنوان ایده *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: راه‌اندازی کمپین ری‌تارگتینگ پیامکی پس از وبینار"
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">دسته‌بندی</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                >
                  {CATEGORIES.filter((c) => c !== 'همه').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">شرح کامل ایده و ارزش پیشنهادی *</label>
                <textarea
                  rows={5}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ایده چیست؟ چه ارزشی برای جذب لید یا کاهش هزینه تبلیغات ایجاد می‌کند؟ نحوه اجرای پیشنهادی چیست؟"
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'در حال ثبت...' : 'ثبت و انتشار ایده'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تبدیل به وظیفه عملیاتی (Task Pipeline) */}
      {isTaskModalOpen && selectedIdeaForTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="text-[#719BDF]" size={18} />
                <span>تبدیل ایده به وظیفه عملیاتی</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConvertToTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">عنوان وظیفه *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">مهلت انجام</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">اولویت</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                  >
                    <option value="low">کم</option>
                    <option value="medium">متوسط</option>
                    <option value="high">بالا</option>
                    <option value="urgent">فوری</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#18263A]/50 p-3 rounded-xl border border-[#1F2E45] text-xs text-slate-400">
                این وظیفه به طور مستقیم به بخش «وظایف و کارتابل» افزوده شده و وضعیت ایده به تاییدشده تغییر می‌یابد.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isConvertingTask}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isConvertingTask ? 'در حال ایجاد وظیفه...' : 'تایید و ایجاد وظیفه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال بررسی و تغییر وضعیت ایده (ویژه مدیران) */}
      {isStatusModalOpen && selectedIdeaForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Tag className="text-[#719BDF]" size={18} />
                <span>بررسی وضعیت ایده توسط مدیر</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">وضعیت جدید ایده</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as IdeaStatus)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                >
                  <option value="submitted">ثبت‌شده (Submitted)</option>
                  <option value="reviewing">در حال بررسی (Reviewing)</option>
                  <option value="approved">تاییدشده (Approved)</option>
                  <option value="implemented">اجراشده (Implemented)</option>
                  <option value="rejected">ردشده (Rejected)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">یادداشت ارزیابی / دلایل تصمیم‌گیری</label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="توضیحات مدیر درباره دلیل تایید، رد یا نتایج حاصل از اجرای ایده..."
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'در حال ثبت...' : 'ذخیره وضعیت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
