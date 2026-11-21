'use client';

import * as React from 'react';
import { useToast } from '@/components/common/toast-provider';
import {
  sopsApi,
  SopItem,
  SopVersionItem,
  SopStatus,
} from '@/features/sops';
import {
  BookOpen,
  Plus,
  Search,
  Printer,
  History,
  CheckSquare,
  Edit3,
  Trash2,
  Calendar,
  User,
  Tag,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Filter,
  Check,
  X,
  Copy,
} from 'lucide-react';

const CATEGORIES = [
  'همه',
  'کمپین و تبلیغات',
  'فروش و لید',
  'مدیریت محتوا',
  'فنی و وبینار',
  'عملیات و اداری',
];

const STATUS_MAP: Record<SopStatus, { label: string; bg: string; text: string; border: string }> = {
  active: {
    label: 'معتبر و فعال',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  draft: {
    label: 'پیش‌نویس',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  archived: {
    label: 'بایگانی‌شده',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

export default function SopsPage() {
  const { toast } = useToast();

  const [sops, setSops] = React.useState<SopItem[]>([]);
  const [selectedSopId, setSelectedSopId] = React.useState<string | null>(null);
  const [selectedSop, setSelectedSop] = React.useState<SopItem | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('همه');
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDetailLoading, setIsDetailLoading] = React.useState(false);

  // مودال‌ها
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [versionsList, setVersionsList] = React.useState<SopVersionItem[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = React.useState(false);

  // فرم ایجاد و ویرایش
  const [isEditing, setIsEditing] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState('');
  const [formCode, setFormCode] = React.useState('');
  const [formCategory, setFormCategory] = React.useState('کمپین و تبلیغات');
  const [formContent, setFormContent] = React.useState('');
  const [formStatus, setFormStatus] = React.useState<SopStatus>('active');
  const [formChangeSummary, setFormChangeSummary] = React.useState('');
  const [formBumpMajor, setFormBumpMajor] = React.useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  // فرم تبدیل به وظیفه
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskDueDate, setTaskDueDate] = React.useState('');
  const [taskPriority, setTaskPriority] = React.useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [parseChecklists, setParseChecklists] = React.useState(true);
  const [isCreatingTask, setIsCreatingTask] = React.useState(false);

  // واکشی لیست دستورالعمل‌ها
  const loadSops = React.useCallback(async (selectId?: string) => {
    setIsLoading(true);
    try {
      const data = await sopsApi.getSops({
        category: selectedCategory === 'همه' ? undefined : selectedCategory,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchQuery,
      });
      setSops(data);
      if (data.length > 0) {
        const idToSelect = selectId || selectedSopId || data[0].id;
        setSelectedSopId(idToSelect);
      } else {
        setSelectedSopId(null);
        setSelectedSop(null);
      }
    } catch (err) {
      toast.error('خطا در بارگذاری فهرست دستورالعمل‌ها');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery, selectedSopId, toast]);

  React.useEffect(() => {
    loadSops();
  }, [loadSops]);

  // واکشی جزئیات دستورالعمل انتخابی
  React.useEffect(() => {
    if (!selectedSopId) {
      setSelectedSop(null);
      return;
    }

    let isMounted = true;
    setIsDetailLoading(true);

    sopsApi.getSop(selectedSopId)
      .then((data) => {
        if (isMounted) setSelectedSop(data);
      })
      .catch(() => {
        if (isMounted) toast.error('خطا در بارگذاری جزئیات دستورالعمل');
      })
      .finally(() => {
        if (isMounted) setIsDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSopId, toast]);

  // باز کردن مودال ثبت جدید
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormTitle('');
    setFormCode(`SOP-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('کمپین و تبلیغات');
    setFormContent(
      `# هدف و دامنه کاربرد\nشرح هدف اجرای این دستورالعمل...\n\n` +
      `## پیش‌نیازها و ملزومات\n- [ ] دسترسی به پنل مدیریت\n- [ ] تاییدیه مدیر کمپین\n\n` +
      `## مراحل و گام‌های اجرایی\n1. ورود به سیستم و انتخاب کمپین\n2. تنظیم پارامترهای هدف‌گذاری و UTM\n3. بارگذاری بنرها و متن تبلیغ\n4. بررسی و ارسال جهت تایید نهایی\n\n` +
      `## نکات کنترلی و کیفیت سنجی\nدر صورت بروز مغایرت، فوراً با سرپرست تیم ارتباط بگیرید.`
    );
    setFormStatus('active');
    setFormChangeSummary('');
    setFormBumpMajor(false);
    setIsFormModalOpen(true);
  };

  // باز کردن مودال ویرایش
  const handleOpenEdit = () => {
    if (!selectedSop) return;
    setIsEditing(true);
    setFormTitle(selectedSop.title);
    setFormCode(selectedSop.code);
    setFormCategory(selectedSop.category);
    setFormContent(selectedSop.content);
    setFormStatus(selectedSop.status);
    setFormChangeSummary('');
    setFormBumpMajor(false);
    setIsFormModalOpen(true);
  };

  // ثبت یا ویرایش SOP
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCode.trim() || !formContent.trim()) {
      toast.warning('لطفاً تمامی فیلدهای الزامی را تکمیل کنید.');
      return;
    }

    setIsSubmittingForm(true);
    try {
      if (isEditing && selectedSop) {
        const updated = await sopsApi.updateSop(selectedSop.id, {
          title: formTitle,
          code: formCode,
          category: formCategory,
          content: formContent,
          status: formStatus,
          changeSummary: formChangeSummary || undefined,
          bumpMajor: formBumpMajor,
        });
        toast.success(`دستورالعمل به نسخه ${updated.currentVersion} به‌روزرسانی شد.`);
        setIsFormModalOpen(false);
        loadSops(updated.id);
        setSelectedSop(updated);
      } else {
        const created = await sopsApi.createSop({
          title: formTitle,
          code: formCode,
          category: formCategory,
          content: formContent,
          status: formStatus,
        });
        toast.success('دستورالعمل جدید با موفقیت ایجاد شد.');
        setIsFormModalOpen(false);
        loadSops(created.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ثبت دستورالعمل');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // حذف SOP
  const handleDeleteSop = async () => {
    if (!selectedSop) return;
    if (!window.confirm(`آیا از حذف دستورالعمل «${selectedSop.title}» اطمینان دارید؟`)) return;

    try {
      await sopsApi.deleteSop(selectedSop.id);
      toast.success('دستورالعمل با موفقیت حذف شد.');
      loadSops();
    } catch (err) {
      toast.error('خطا در حذف دستورالعمل');
    }
  };

  // باز کردن تاریخچه نسخه‌ها
  const handleOpenHistory = async () => {
    if (!selectedSop) return;
    setIsHistoryModalOpen(true);
    setIsLoadingVersions(true);
    try {
      const versions = await sopsApi.getVersions(selectedSop.id);
      setVersionsList(versions);
    } catch (err) {
      toast.error('خطا در بارگذاری تاریخچه نسخه‌ها');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // بازگشت (Rollback) به نسخه تاریخی
  const handleRollback = async (versionNumber: string) => {
    if (!selectedSop) return;
    if (!window.confirm(`آیا مطمئن هستید می‌خواهید محتوا را به نگارش ${versionNumber} بازگردانید؟ نسخه جدیدی با محتوای این نسخه ایجاد خواهد شد.`)) return;

    try {
      const rolledBack = await sopsApi.rollbackVersion(selectedSop.id, versionNumber);
      toast.success(`محتوا به نسخه ${versionNumber} بازگشت داده شد (نگارش جاری: ${rolledBack.currentVersion}).`);
      setIsHistoryModalOpen(false);
      setSelectedSop(rolledBack);
      loadSops(rolledBack.id);
    } catch (err) {
      toast.error('خطا در بازگردانی نسخه');
    }
  };

  // باز کردن مودال ایجاد وظیفه از روی SOP
  const handleOpenTaskModal = () => {
    if (!selectedSop) return;
    setTaskTitle(`[اجرا] ${selectedSop.title} (${selectedSop.code})`);
    setTaskDueDate('');
    setTaskPriority('medium');
    setParseChecklists(true);
    setIsTaskModalOpen(true);
  };

  // ثبت و ایجاد وظیفه
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSop) return;

    setIsCreatingTask(true);
    try {
      const res = await sopsApi.createTaskFromSop(selectedSop.id, {
        title: taskTitle,
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
        parseChecklistAsSubtasks: parseChecklists,
      });
      toast.success(res.message);
      setIsTaskModalOpen(false);
      // به‌روزرسانی شمارنده وظایف
      sopsApi.getSop(selectedSop.id).then(setSelectedSop);
    } catch (err) {
      toast.error('خطا در ایجاد وظیفه از دستورالعمل');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // چاپ بهینه صفحه
  const handlePrint = () => {
    window.print();
  };

  // فرمت تاریخ شمسی
  const formatPersianDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // رندر فرمت‌بندی شده محتوای مارک‌داون
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-3.5 text-sm leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl font-black text-slate-50 border-b border-[#1F2E45] pb-2 mt-4 pt-2">
                {trimmed.replace('# ', '')}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-base font-bold text-[#719BDF] mt-3 pt-1">
                {trimmed.replace('## ', '')}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-sm font-bold text-slate-200 mt-2">
                {trimmed.replace('### ', '')}
              </h3>
            );
          }
          if (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]')) {
            return (
              <div key={idx} className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-[#18263A]/40 text-slate-300">
                <div className="w-4 h-4 rounded border border-slate-500 flex items-center justify-center shrink-0" />
                <span>{trimmed.replace(/^[-*]\s*\[\s*\]\s*/, '')}</span>
              </div>
            );
          }
          if (trimmed.startsWith('- [x]') || trimmed.startsWith('* [x]') || trimmed.startsWith('- [X]')) {
            return (
              <div key={idx} className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-300">
                <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                <span className="line-through opacity-80">{trimmed.replace(/^[-*]\s*\[\s*[xX]\s*\]\s*/, '')}</span>
              </div>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pr-2 text-slate-300">
                <span className="text-[#719BDF] font-black text-base leading-none">•</span>
                <span>{trimmed.replace(/^[-*]\s*/, '')}</span>
              </div>
            );
          }
          const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pr-1 py-1 text-slate-200">
                <span className="w-5 h-5 rounded-full bg-[#719BDF]/20 text-[#719BDF] text-xs font-bold flex items-center justify-center shrink-0">
                  {numMatch[1]}
                </span>
                <span>{numMatch[2]}</span>
              </div>
            );
          }
          if (trimmed.length === 0) {
            return <div key={idx} className="h-1.5" />;
          }
          return (
            <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* استایل ویژه چاپ منطبق بر ضوابط طراحی سند */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #sop-printable-container,
          #sop-printable-container * {
            visibility: visible;
          }
          #sop-printable-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          #sop-printable-container h1,
          #sop-printable-container h2,
          #sop-printable-container h3 {
            color: #111827 !important;
          }
          #sop-printable-container p,
          #sop-printable-container span,
          #sop-printable-container div {
            color: #374151 !important;
          }
        }
      `}</style>

      {/* سربرگ صفحه و ابزارهای اصلی */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-display flex items-center gap-2.5">
            <BookOpen className="text-[#719BDF]" size={26} />
            <span>دستورالعمل‌های استاندارد (SOP)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مخزن متمرکز فرایندها، گام‌های عملیاتی استاندارد و مستندات کنترل کیفیت سازمان
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors shadow-lg shadow-[#719BDF]/20 cursor-pointer"
        >
          <Plus size={18} />
          <span>دستورالعمل جدید</span>
        </button>
      </div>

      {/* نوار جستجو و فیلترهای دسته‌بندی و وضعیت */}
      <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-3 no-print">
        <div className="flex flex-col md:flex-row gap-3">
          {/* جعبه جستجو */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، شناسه کد (SOP-...) یا محتوا..."
              className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#719BDF]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* فیلتر وضعیت */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">معتبر و فعال</option>
              <option value="draft">پیش‌نویس</option>
              <option value="archived">بایگانی‌شده</option>
            </select>
          </div>
        </div>

        {/* دسته‌بندی‌ها به صورت پیل‌های افقی */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
            <Tag size={13} />
            <span>دسته‌ها:</span>
          </span>
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

      {/* چیدمان ستونی: لیست مستندات + نمای مطالعه بهینه (۸۰۰ پیکسل) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ستون راست: کارت‌های لیست مستندات */}
        <div className="lg:col-span-4 space-y-3 no-print">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>مستندات یافت شده ({sops.length})</span>
            {isLoading && <span className="text-[#719BDF] animate-pulse">در حال به‌روزرسانی...</span>}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#111D2E] p-4 rounded-xl border border-[#1F2E45] animate-pulse space-y-2">
                  <div className="h-4 bg-[#18263A] rounded w-2/3" />
                  <div className="h-3 bg-[#18263A] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : sops.length === 0 ? (
            <div className="bg-[#111D2E] p-8 rounded-2xl border border-[#1F2E45] text-center space-y-3">
              <FileText className="mx-auto text-slate-500" size={32} />
              <p className="text-xs text-slate-400">دستورالعملی مطابق با شرایط جستجو یافت نشد.</p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#719BDF]/15 text-[#719BDF] hover:bg-[#719BDF]/25 transition-colors"
              >
                <Plus size={14} />
                <span>افزودن اولین دستورالعمل</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {sops.map((sop) => {
                const isSelected = sop.id === selectedSopId;
                const statusMeta = STATUS_MAP[sop.status] || STATUS_MAP.draft;

                return (
                  <div
                    key={sop.id}
                    onClick={() => setSelectedSopId(sop.id)}
                    className={`p-4 rounded-xl border text-right cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#18263A] border-[#719BDF] shadow-lg shadow-[#719BDF]/5'
                        : 'bg-[#111D2E] border-[#1F2E45] hover:bg-[#152336] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#719BDF] px-1.5 py-0.5 rounded bg-[#719BDF]/10 border border-[#719BDF]/20">
                        {sop.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-1 mb-2">
                      {sop.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Tag size={12} className="text-slate-500" />
                        <span>{sop.category}</span>
                      </span>
                      <span className="font-mono font-medium text-slate-300">
                        v{sop.currentVersion}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#1F2E45]/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>ثبت: {sop.author?.fullName || 'نامشخص'}</span>
                      <span>{formatPersianDate(sop.updatedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ستون چپ: نمای مطالعه بهینه (۸۰۰ پیکسل خوانایی منطبق بر REQ-011 و REQ-086) */}
        <div className="lg:col-span-8 flex justify-center">
          <div
            id="sop-printable-container"
            className="w-full max-w-[800px] bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-6 sm:p-8 shadow-xl space-y-6"
          >
            {isDetailLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-[#18263A] rounded-xl w-3/4" />
                <div className="h-4 bg-[#18263A] rounded w-1/2" />
                <div className="h-40 bg-[#18263A] rounded-xl" />
              </div>
            ) : selectedSop ? (
              <div className="space-y-6">
                {/* سربرگ سند SOP */}
                <div className="border-b border-[#1F2E45] pb-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#719BDF] px-2 py-0.5 rounded bg-[#719BDF]/15 border border-[#719BDF]/30">
                          {selectedSop.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#18263A] text-slate-300 border border-[#1F2E45]">
                          نگارش {selectedSop.currentVersion}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            STATUS_MAP[selectedSop.status]?.bg
                          } ${STATUS_MAP[selectedSop.status]?.text} ${
                            STATUS_MAP[selectedSop.status]?.border
                          }`}
                        >
                          {STATUS_MAP[selectedSop.status]?.label}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-black text-slate-100 font-display">
                        {selectedSop.title}
                      </h2>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Tag size={13} className="text-[#719BDF]" />
                          <span>دسته‌بندی: {selectedSop.category}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={13} />
                          <span>نگارنده: {selectedSop.author?.fullName || 'کاربر سیستم'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          <span>آخرین بازبینی: {formatPersianDate(selectedSop.updatedAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* دکمه‌های عملیاتی سربرگ */}
                    <div className="flex items-center gap-2 no-print shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#18263A] text-slate-200 border border-[#1F2E45] hover:bg-[#1F2E45] transition-colors"
                        title="چاپ دستورالعمل استاندارد"
                      >
                        <Printer size={14} />
                        <span>چاپ / PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenTaskModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 hover:bg-[#719BDF]/25 transition-colors"
                        title="تبدیل به وظیفه عملیاتی"
                      >
                        <CheckSquare size={14} />
                        <span>ایجاد وظیفه</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenHistory}
                        className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#18263A] hover:bg-[#1F2E45] border border-[#1F2E45] transition-colors"
                        title="تاریخچه نسخه‌ها و بازگشت (Rollback)"
                      >
                        <History size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#18263A] hover:bg-[#1F2E45] border border-[#1F2E45] transition-colors"
                        title="ویرایش دستورالعمل"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteSop}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-[#18263A] hover:bg-rose-500/10 border border-[#1F2E45] transition-colors"
                        title="حذف دستورالعمل"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* نشانگر وظایف مشتق‌شده از این دستورالعمل */}
                {selectedSop._count && selectedSop._count.tasksUsingSop > 0 && (
                  <div className="bg-[#18263A]/40 px-3.5 py-2 rounded-xl text-xs text-slate-300 flex items-center justify-between border border-[#1F2E45] no-print">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-[#719BDF]" />
                      <span>
                        این دستورالعمل تاکنون در <strong>{selectedSop._count.tasksUsingSop}</strong> وظیفه عملیاتی به کار گرفته شده است.
                      </span>
                    </span>
                  </div>
                )}

                {/* بدنه و متن مستند استاندارد */}
                <div className="bg-[#18263A]/20 p-5 rounded-2xl border border-[#1F2E45]/80">
                  {renderFormattedContent(selectedSop.content)}
                </div>

                {/* پاورقی سند */}
                <div className="border-t border-[#1F2E45] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>سامانه مدیریت بازاریابی دیجیتال گپ‌جی — کد رهگیری سند: {selectedSop.id.slice(0, 8)}</span>
                  <span>نسخه جاری: {selectedSop.currentVersion} ({STATUS_MAP[selectedSop.status]?.label})</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <BookOpen size={40} className="mx-auto text-slate-600" />
                <h3 className="text-sm font-bold text-slate-300">یک دستورالعمل را از ستون کناری انتخاب کنید</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  برای مطالعه دقیق، چاپ با فرمت بهینه، یا تبدیل مراحل به وظیفه عملیاتی، سند مورد نظر را انتخاب نمایید.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مودال ایجاد / ویرایش دستورالعمل */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="text-[#719BDF]" size={18} />
                <span>{isEditing ? 'ویرایش دستورالعمل استاندارد' : 'ثبت دستورالعمل استاندارد جدید'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">عنوان دستورالعمل *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثال: فرایند اجرای کمپین تبلیغاتی لیدجنینگ"
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#719BDF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">شناسه اختصاصی (کد) *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="SOP-MKT-01"
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="text-xs font-bold text-slate-300">وضعیت سند</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as SopStatus)}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                  >
                    <option value="active">معتبر و فعال (Active)</option>
                    <option value="draft">پیش‌نویس (Draft)</option>
                    <option value="archived">بایگانی‌شده (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">محتوای کامل و گام‌های اجرایی (Markdown) *</label>
                  <span className="text-[10px] text-slate-500">پشتیبانی از سرفصل، چک‌باکس و شماره‌گذاری</span>
                </div>
                <textarea
                  rows={10}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="محتوا، پیش‌نیازها و چک‌لیست گام‌ها..."
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl p-3.5 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              {isEditing && (
                <div className="bg-[#18263A]/60 p-3.5 rounded-xl border border-[#1F2E45] space-y-3">
                  <div className="text-xs font-bold text-[#719BDF]">مدیریت نسخه‌بندی خودکار:</div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-300">خلاصه تغییرات اعمال شده (Change Summary)</label>
                    <input
                      type="text"
                      value={formChangeSummary}
                      onChange={(e) => setFormChangeSummary(e.target.value)}
                      placeholder="توضیح کوتاه درباره ویرایش‌ها جهت ثبت در گزارش تاریخچه..."
                      className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#719BDF]"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={formBumpMajor}
                      onChange={(e) => setFormBumpMajor(e.target.checked)}
                      className="rounded border-slate-600 text-[#719BDF] focus:ring-0"
                    />
                    <span>ارتقای نگارش اصلی (Major Bump مانند 1.x به 2.0)</span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isSubmittingForm ? 'در حال ذخیره‌سازی...' : isEditing ? 'ذخیره و ثبت نگارش جدید' : 'ایجاد دستورالعمل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تاریخچه نسخه‌ها و بازگشت (Rollback) */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="text-[#719BDF]" size={18} />
                <span>تاریخچه نسخه‌های دستورالعمل ({selectedSop?.code})</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {isLoadingVersions ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                در حال دریافت تاریخچه نسخه‌ها...
              </div>
            ) : versionsList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">نسخه تاریخی ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {versionsList.map((ver) => {
                  const isCurrent = ver.versionNumber === selectedSop?.currentVersion;
                  return (
                    <div
                      key={ver.id}
                      className={`p-3.5 rounded-xl border text-right space-y-2 ${
                        isCurrent
                          ? 'bg-[#18263A] border-[#719BDF]/60'
                          : 'bg-[#142235] border-[#1F2E45]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#719BDF] px-2 py-0.5 rounded bg-[#719BDF]/15">
                            نسخه {ver.versionNumber}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              نسخه جاری
                            </span>
                          )}
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRollback(ver.versionNumber)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#719BDF]/15 text-[#719BDF] hover:bg-[#719BDF]/25 transition-colors"
                          >
                            <RotateCcw size={12} />
                            <span>بازگشت به این نسخه</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-300">
                        {ver.changeSummary || 'ویرایش محتوا'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1F2E45]/60">
                        <span>ثبت توسط: {ver.createdBy?.fullName || 'کاربر سیستم'}</span>
                        <span>{formatPersianDate(ver.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-[#1F2E45] flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#18263A] text-slate-300 hover:text-white"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تبدیل به وظیفه عملیاتی (Task Pipeline) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="text-[#719BDF]" size={18} />
                <span>ایجاد وظیفه عملیاتی از روی دستورالعمل</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
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

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-[#18263A]/60 p-3 rounded-xl border border-[#1F2E45]">
                <input
                  type="checkbox"
                  checked={parseChecklists}
                  onChange={(e) => setParseChecklists(e.target.checked)}
                  className="rounded border-slate-600 text-[#719BDF] focus:ring-0"
                />
                <span>استخراج خودکار گام‌ها و چک‌لیست‌های سند به عنوان زیروظیفه (Subtasks)</span>
              </label>

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
                  disabled={isCreatingTask}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isCreatingTask ? 'در حال ثبت وظیفه...' : 'تایید و ثبت وظیفه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
