'use client';

import * as React from 'react';
import { useToast } from '@/components/common/toast-provider';
import { useAuthStore } from '@/stores/auth-store';
import {
  learningApi,
  LearningResourceItem,
  TeamProgressMatrixResponse,
  LearningType,
} from '@/features/learning';
import {
  GraduationCap,
  PlayCircle,
  FileText,
  BookOpen,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
  Star,
  Users,
  Search,
  Filter,
  Clock,
  Plus,
  Edit2,
  Trash2,
  MonitorPlay,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Gauge,
  UserCheck,
  Award,
  Video,
} from 'lucide-react';

const CATEGORIES = [
  'همه',
  'تبلیغات دیجیتال',
  'سئو و بهینه‌سازی',
  'تولید و استراتژی محتوا',
  'مهارت‌های فنی و ابزار',
  'مهارت‌های نرم و مدیریت',
];

const SOFTWARES = [
  'همه',
  'Google Ads',
  'Google Analytics',
  'Meta Ads',
  'Photoshop',
  'Notion',
  'Figma',
  'Excel',
];

const TYPE_MAP: Record<LearningType, { label: string; icon: any; color: string; bg: string }> = {
  video: {
    label: 'ویدیو آموزشی',
    icon: Video,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
  },
  article: {
    label: 'مقاله و راهنما',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
  book: {
    label: 'کتاب و جزوه',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  link: {
    label: 'منبع خارجی',
    icon: LinkIcon,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
};

export default function LearningPage() {
  const { toast } = useToast();
  const { user, activeRole } = useAuthStore();
  const role = activeRole || (user as any)?.role;
  const isManager = role === 'admin' || role === 'marketing_manager';

  const [activeTab, setActiveTab] = React.useState<'library' | 'my-learning' | 'matrix'>('library');
  const [resources, setResources] = React.useState<LearningResourceItem[]>([]);
  const [matrixData, setMatrixData] = React.useState<TeamProgressMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMatrix, setIsLoadingMatrix] = React.useState(false);

  // فیلترها
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('همه');
  const [selectedSoftware, setSelectedSoftware] = React.useState('همه');
  const [selectedType, setSelectedType] = React.useState('all');

  // پخش‌کننده و مودال مشاهده دوره
  const [activeCourse, setActiveCourse] = React.useState<LearningResourceItem | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<number>(1);
  const [userRating, setUserRating] = React.useState<number>(0);
  const [userNotes, setUserNotes] = React.useState<string>('');
  const [isUpdatingProgress, setIsUpdatingProgress] = React.useState(false);

  // مودال ایجاد / ویرایش
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formId, setFormId] = React.useState('');
  const [formTitle, setFormTitle] = React.useState('');
  const [formCategory, setFormCategory] = React.useState('تبلیغات دیجیتال');
  const [formSoftware, setFormSoftware] = React.useState('Google Ads');
  const [formType, setFormType] = React.useState<LearningType>('video');
  const [formUrl, setFormUrl] = React.useState('');
  const [formDuration, setFormDuration] = React.useState(30);
  const [formDescription, setFormDescription] = React.useState('');
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  // مودال تخصیص
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [assignResourceId, setAssignResourceId] = React.useState('');
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [isSubmittingAssign, setIsSubmittingAssign] = React.useState(false);

  // واکشی منابع آموزشی
  const loadResources = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await learningApi.getResources({
        category: selectedCategory === 'همه' ? undefined : selectedCategory,
        software: selectedSoftware === 'همه' ? undefined : selectedSoftware,
        type: selectedType === 'all' ? undefined : selectedType,
        search: searchQuery,
      });
      setResources(data);
    } catch (err) {
      toast.error('خطا در بارگذاری دوره‌های آموزشی');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedSoftware, selectedType, searchQuery, toast]);

  // واکشی ماتریس تیم
  const loadMatrix = React.useCallback(async () => {
    if (!isManager) return;
    setIsLoadingMatrix(true);
    try {
      const data = await learningApi.getTeamMatrix();
      setMatrixData(data);
    } catch (err) {
      toast.error('خطا در بارگذاری ماتریس آموزش تیم');
    } finally {
      setIsLoadingMatrix(false);
    }
  }, [isManager, toast]);

  React.useEffect(() => {
    loadResources();
  }, [loadResources]);

  React.useEffect(() => {
    if (activeTab === 'matrix') {
      loadMatrix();
    }
  }, [activeTab, loadMatrix]);

  // باز کردن پخش‌کننده دوره
  const handleOpenCourse = (item: LearningResourceItem) => {
    setActiveCourse(item);
    setUserRating(item.myProgress?.rating || 0);
    setUserNotes(item.myProgress?.notes || '');
    setPlaybackSpeed(1);
  };

  // ثبت پیشرفت (تکمیل دوره)
  const handleToggleCompleted = async () => {
    if (!activeCourse) return;
    const nextCompleted = !activeCourse.myProgress?.isCompleted;

    setIsUpdatingProgress(true);
    try {
      const updatedProgress = await learningApi.updateProgress(activeCourse.id, {
        isCompleted: nextCompleted,
        rating: userRating || undefined,
        notes: userNotes || undefined,
      });

      // به‌روزرسانی در وضعیت محلی
      setActiveCourse({
        ...activeCourse,
        myProgress: updatedProgress,
      });

      setResources((prev) =>
        prev.map((r) =>
          r.id === activeCourse.id ? { ...r, myProgress: updatedProgress } : r
        )
      );

      toast.success(
        nextCompleted
          ? 'آفرین! دوره آموزشی به عنوان تکمیل‌شده علامت‌گذاری شد.'
          : 'وضعیت دوره به در حال انجام تغییر یافت.'
      );
    } catch (err) {
      toast.error('خطا در به‌روزرسانی وضعیت دوره');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // ذخیره امتیاز و یادداشت
  const handleSaveNotesAndRating = async (newRating?: number) => {
    if (!activeCourse) return;
    const ratingToSave = newRating !== undefined ? newRating : userRating;

    try {
      const updatedProgress = await learningApi.updateProgress(activeCourse.id, {
        rating: ratingToSave || undefined,
        notes: userNotes || undefined,
      });

      setActiveCourse({
        ...activeCourse,
        myProgress: updatedProgress,
      });

      setResources((prev) =>
        prev.map((r) =>
          r.id === activeCourse.id ? { ...r, myProgress: updatedProgress } : r
        )
      );

      if (newRating !== undefined) {
        setUserRating(newRating);
        toast.success(`امتیاز ${newRating} ستاره ثبت شد.`);
      } else {
        toast.success('یادداشت‌های شخصی ذخیره شد.');
      }
    } catch (err) {
      toast.error('خطا در ذخیره بازخورد');
    }
  };

  // باز کردن مودال ثبت جدید
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormId('');
    setFormTitle('');
    setFormCategory('تبلیغات دیجیتال');
    setFormSoftware('Google Ads');
    setFormType('video');
    setFormUrl('https://example.com/videos/tutorial.mp4');
    setFormDuration(30);
    setFormDescription('شرح جامع دوره آموزشی و سرفصل‌ها...');
    setIsFormModalOpen(true);
  };

  // باز کردن مودال ویرایش
  const handleOpenEdit = (item: LearningResourceItem) => {
    setIsEditing(true);
    setFormId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormSoftware(item.software || 'Google Ads');
    setFormType(item.type);
    setFormUrl(item.url || '');
    setFormDuration(item.durationMinutes || 30);
    setFormDescription(item.description || '');
    setIsFormModalOpen(true);
  };

  // ثبت / ویرایش دوره
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.warning('عنوان دوره الزامی است.');
      return;
    }

    setIsSubmittingForm(true);
    try {
      if (isEditing) {
        await learningApi.updateResource(formId, {
          title: formTitle,
          category: formCategory,
          software: formSoftware,
          type: formType,
          url: formUrl || undefined,
          durationMinutes: Number(formDuration),
          description: formDescription,
        });
        toast.success('دوره آموزشی با موفقیت به‌روزرسانی شد.');
      } else {
        await learningApi.createResource({
          title: formTitle,
          category: formCategory,
          software: formSoftware,
          type: formType,
          url: formUrl || undefined,
          durationMinutes: Number(formDuration),
          description: formDescription,
        });
        toast.success('دوره آموزشی جدید اضافه شد.');
      }
      setIsFormModalOpen(false);
      loadResources();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در ثبت دوره');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // حذف دوره
  const handleDeleteResource = async (item: LearningResourceItem) => {
    if (!window.confirm(`آیا از حذف دوره «${item.title}» اطمینان دارید؟`)) return;

    try {
      await learningApi.deleteResource(item.id);
      toast.success('دوره آموزشی با موفقیت حذف شد.');
      if (activeCourse?.id === item.id) setActiveCourse(null);
      loadResources();
    } catch (err) {
      toast.error('خطا در حذف دوره');
    }
  };

  // تخصیص دوره به کاربران
  const handleOpenAssign = (resourceId?: string) => {
    if (!matrixData) return;
    setAssignResourceId(resourceId || matrixData.resources[0]?.id || '');
    setSelectedUserIds([]);
    setIsAssignModalOpen(true);
  };

  const handleSubmitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignResourceId || selectedUserIds.length === 0) {
      toast.warning('لطفاً دوره و حداقل یک کاربر را انتخاب نمایید.');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      const res = await learningApi.assignResource(assignResourceId, selectedUserIds);
      toast.success(res.message);
      setIsAssignModalOpen(false);
      loadMatrix();
    } catch (err) {
      toast.error('خطا در تخصیص دوره به اعضای تیم');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // محاسبات خلاصه
  const totalCompleted = resources.filter((r) => r.myProgress?.isCompleted).length;
  const totalMinutes = resources.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const completedMinutes = resources
    .filter((r) => r.myProgress?.isCompleted)
    .reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

  const myLearningList = resources.filter((r) => r.myProgress !== null);

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-display flex items-center gap-2.5">
            <GraduationCap className="text-[#719BDF]" size={26} />
            <span>مرکز آموزش و مهارت‌آموزی تیم (LMS)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            پایگاه متمرکز دوره‌ها، آموزش‌های ویدیویی، کتاب‌ها و پایش پیشرفت مهارت‌های تیم
          </p>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors shadow-lg shadow-[#719BDF]/20 cursor-pointer"
          >
            <Plus size={18} />
            <span>افزودن دوره جدید</span>
          </button>
        )}
      </div>

      {/* کارت‌های KPI خلاصه پیشرفت فردی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#719BDF]" />
            <span>کل دوره‌های موجود</span>
          </div>
          <div className="text-xl font-black text-slate-100">{resources.length} دوره</div>
          <div className="text-[10px] text-slate-500">محتوای رسمی سازمان</div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>تکمیل‌شده توسط من</span>
          </div>
          <div className="text-xl font-black text-emerald-400">{totalCompleted} دوره</div>
          <div className="text-[10px] text-slate-500">
            {resources.length > 0 ? Math.round((totalCompleted / resources.length) * 100) : 0}٪ پیشرفت کل
          </div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-400" />
            <span>مدت زمان یادگیری</span>
          </div>
          <div className="text-xl font-black text-slate-100">
            {Math.round(completedMinutes / 60)} از {Math.round(totalMinutes / 60)} ساعت
          </div>
          <div className="text-[10px] text-slate-500">محتوای چندرسانه‌ای</div>
        </div>

        <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-1">
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Award size={14} className="text-amber-400" />
            <span>امتیاز میانگین من</span>
          </div>
          <div className="text-xl font-black text-amber-400 flex items-center gap-1">
            <Star size={18} fill="currentColor" />
            <span>
              {totalCompleted > 0
                ? (
                    resources
                      .filter((r) => r.myProgress?.rating)
                      .reduce((acc, r) => acc + (r.myProgress?.rating || 0), 0) /
                    Math.max(1, resources.filter((r) => r.myProgress?.rating).length)
                  ).toFixed(1)
                : '—'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">بازخورد دوره‌های گذرانده</div>
        </div>
      </div>

      {/* تب‌های اصلی ناوبری */}
      <div className="flex items-center gap-2 border-b border-[#1F2E45] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'library'
              ? 'bg-[#719BDF] text-slate-950 shadow-md shadow-[#719BDF]/20'
              : 'text-slate-300 hover:bg-[#18263A]'
          }`}
        >
          <BookOpen size={16} />
          <span>مخزن دوره‌ها ({resources.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-learning')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
            activeTab === 'my-learning'
              ? 'bg-[#719BDF] text-slate-950 shadow-md shadow-[#719BDF]/20'
              : 'text-slate-300 hover:bg-[#18263A]'
          }`}
        >
          <UserCheck size={16} />
          <span>دوره‌های من ({myLearningList.length})</span>
        </button>

        {isManager && (
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'matrix'
                ? 'bg-[#719BDF] text-slate-950 shadow-md shadow-[#719BDF]/20'
                : 'text-slate-300 hover:bg-[#18263A]'
            }`}
          >
            <Users size={16} />
            <span>ماتریس پیشرفت تیم (ص ۲۴)</span>
          </button>
        )}
      </div>

      {/* تب اول: مخزن دوره‌ها */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* جعبه فیلترها و جستجو */}
          <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان دوره، نرم‌افزار یا توضیحات..."
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                >
                  <option value="all">همه قالب‌ها</option>
                  <option value="video">ویدیو آموزشی</option>
                  <option value="article">مقاله و راهنما</option>
                  <option value="book">کتاب و جزوه</option>
                  <option value="link">پیوند خارجی</option>
                </select>

                <select
                  value={selectedSoftware}
                  onChange={(e) => setSelectedSoftware(e.target.value)}
                  className="bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                >
                  {SOFTWARES.map((s) => (
                    <option key={s} value={s}>{s === 'همه' ? 'همه نرم‌افزارها' : s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* دسته‌بندی‌های افقی */}
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

          {/* شبکه کارت‌های آموزشی */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-[#111D2E] p-5 rounded-2xl border border-[#1F2E45] animate-pulse space-y-3">
                  <div className="h-28 bg-[#18263A] rounded-xl" />
                  <div className="h-4 bg-[#18263A] rounded w-3/4" />
                  <div className="h-3 bg-[#18263A] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="bg-[#111D2E] p-12 rounded-2xl border border-[#1F2E45] text-center space-y-3">
              <GraduationCap className="mx-auto text-slate-600" size={40} />
              <p className="text-sm font-bold text-slate-300">دوره‌ای مطابق با فیلترهای انتخابی یافت نشد.</p>
              <p className="text-xs text-slate-500">می‌توانید فیلترها را ریست کنید یا دوره جدیدی اضافه نمایید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((item) => {
                const typeMeta = TYPE_MAP[item.type] || TYPE_MAP.video;
                const isCompleted = item.myProgress?.isCompleted;

                return (
                  <div
                    key={item.id}
                    className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-[#719BDF]/5"
                  >
                    <div className="p-5 space-y-3">
                      {/* هدر کارت */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeMeta.bg} ${typeMeta.color}`}
                        >
                          <typeMeta.icon size={12} />
                          <span>{typeMeta.label}</span>
                        </span>

                        {item.software && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#18263A] text-slate-300 border border-[#1F2E45]">
                            {item.software}
                          </span>
                        )}
                      </div>

                      {/* عنوان دوره */}
                      <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* توضیحات */}
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* مشخصات زمان و دسته‌بندی */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1F2E45]/80">
                        <span className="text-[11px] text-[#719BDF]">{item.category}</span>
                        {item.durationMinutes && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock size={12} />
                            <span>{item.durationMinutes} دقیقه</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* فوتر کارت و وضعیت پیشرفت کاربر */}
                    <div className="p-4 bg-[#142235]/60 border-t border-[#1F2E45] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 size={16} />
                            <span>تکمیل‌شده</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <Circle size={14} />
                            <span>شروع نشده</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isManager && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#18263A] border border-[#1F2E45]"
                              title="ویرایش دوره"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteResource(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-[#18263A] border border-[#1F2E45]"
                              title="حذف دوره"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenCourse(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors"
                        >
                          <PlayCircle size={14} />
                          <span>مشاهده دوره</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* تب دوم: آموزش‌های من */}
      {activeTab === 'my-learning' && (
        <div className="space-y-4">
          {myLearningList.length === 0 ? (
            <div className="bg-[#111D2E] p-12 rounded-2xl border border-[#1F2E45] text-center space-y-3">
              <UserCheck className="mx-auto text-slate-600" size={40} />
              <p className="text-sm font-bold text-slate-300">شما هنوز هیچ دوره‌ای را آغاز نکرده‌اید.</p>
              <p className="text-xs text-slate-500">از تب «مخزن دوره‌ها» یکی از آموزش‌ها را انتخاب کرده و یادگیری را شروع کنید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLearningList.map((item) => {
                const isCompleted = item.myProgress?.isCompleted;
                return (
                  <div
                    key={item.id}
                    className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#719BDF] font-bold">{item.category}</span>
                        {isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            تکمیل‌شده
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            در حال یادگیری
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>

                      {item.myProgress?.rating && (
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          {Array.from({ length: item.myProgress.rating }).map((_, idx) => (
                            <Star key={idx} size={13} fill="currentColor" />
                          ))}
                          <span className="text-slate-400 text-[10px] mr-1">
                            ({item.myProgress.rating} از ۵)
                          </span>
                        </div>
                      )}

                      {item.myProgress?.notes && (
                        <p className="text-xs text-slate-300 bg-[#18263A]/70 p-2.5 rounded-xl border border-[#1F2E45] line-clamp-2">
                          <strong>یادداشت من:</strong> {item.myProgress.notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCourse(item)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 border border-[#1F2E45] transition-colors"
                    >
                      <PlayCircle size={14} className="text-[#719BDF]" />
                      <span>مشاهده و ادامه مطالعه</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* تب سوم: ماتریس پیشرفت تیم (ص ۲۴ PDF - جدول کاربر × آموزش با وضعیت) */}
      {activeTab === 'matrix' && isManager && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45]">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="text-[#719BDF]" size={18} />
                <span>ماتریس کاربر × آموزش سازمانی</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                نظارت بر اتمام دوره‌های تخصصی، امتیازدهی و وضعیت آموزشی تمامی اعضای تیم
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAssign()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 hover:bg-[#719BDF]/25 transition-colors"
            >
              <UserCheck size={14} />
              <span>تخصیص دوره به کاربران</span>
            </button>
          </div>

          {isLoadingMatrix || !matrixData ? (
            <div className="bg-[#111D2E] p-12 rounded-2xl border border-[#1F2E45] text-center text-xs text-slate-400 animate-pulse">
              در حال محاسبه و آماده‌سازی ماتریس پیشرفت تیم...
            </div>
          ) : (
            <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] overflow-x-auto shadow-xl">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#1F2E45] bg-[#142235]/80 text-[11px] font-bold text-slate-400">
                    <th className="p-3.5 sticky right-0 bg-[#142235] z-10 w-48">نام عضو تیم</th>
                    <th className="p-3.5 text-center w-28">درصد پیشرفت</th>
                    {matrixData.resources.map((res) => (
                      <th key={res.id} className="p-3.5 text-center min-w-[130px]" title={res.title}>
                        <div className="line-clamp-1">{res.title}</div>
                        <div className="font-mono text-[9px] text-[#719BDF] font-normal">{res.software || res.category}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2E45] text-xs text-slate-200">
                  {matrixData.teamUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-[#18263A]/50 transition-colors">
                      <td className="p-3.5 font-bold sticky right-0 bg-[#111D2E] z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#18263A] border border-[#1F2E45] flex items-center justify-center text-[10px] text-[#719BDF] font-mono">
                            {u.fullName.slice(0, 1)}
                          </div>
                          <div>
                            <div>{u.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{u.role}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-slate-100">{u.progressPercentage}٪</div>
                          <div className="w-full h-1.5 bg-[#18263A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#719BDF] rounded-full transition-all"
                              style={{ width: `${u.progressPercentage}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {u.completedCount} از {u.totalResourceCount} دوره
                          </div>
                        </div>
                      </td>

                      {matrixData.resources.map((res) => {
                        const cell = u.progressByResource[res.id];
                        const isDone = cell?.isCompleted;

                        return (
                          <td key={res.id} className="p-3.5 text-center">
                            {isDone ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <Check size={14} />
                                </span>
                                {cell.rating && (
                                  <span className="text-[9px] text-amber-400 mt-0.5 flex items-center">
                                    ★{cell.rating}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#18263A] text-slate-600">
                                <Circle size={14} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* مودال پخش دوره و یادداشت‌ها (Custom Video Player & Interaction Modal) */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#719BDF]/15 text-[#719BDF]">
                  <MonitorPlay size={18} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-100">{activeCourse.title}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{activeCourse.category}</span>
                    {activeCourse.software && <span>• {activeCourse.software}</span>}
                    {activeCourse.durationMinutes && <span>• {activeCourse.durationMinutes} دقیقه</span>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCourse(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* پخش‌کننده ویدیو سفارشی با کنترل سرعت پخش (1x, 1.25x, 1.5x, 2x) */}
            <div className="bg-black/90 rounded-2xl border border-[#1F2E45] overflow-hidden space-y-2">
              <div className="relative aspect-video flex items-center justify-center bg-gradient-to-tr from-slate-950 to-slate-900 text-slate-400">
                {activeCourse.url ? (
                  <div className="text-center space-y-3 p-6">
                    <MonitorPlay size={48} className="mx-auto text-[#719BDF] animate-pulse" />
                    <p className="text-sm font-bold text-slate-200">پلیر ویدیوی آموزشی سیستم</p>
                    <a
                      href={activeCourse.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#719BDF] text-slate-950 hover:bg-[#5b87cf] transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>باز کردن لینک مستقیم دوره</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Video size={44} className="mx-auto text-slate-600" />
                    <p className="text-xs text-slate-500">منبع متنی یا فاقد ویدیو مستقیم</p>
                  </div>
                )}
              </div>

              {/* کنترل سرعت پخش سفارشی (Speed Control) */}
              <div className="p-3 bg-[#142235] flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Gauge size={14} className="text-[#719BDF]" />
                  <span>سرعت پخش:</span>
                  {[1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-[#719BDF] text-slate-950'
                          : 'bg-[#18263A] text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400">
                  وضعیت فعلی: {activeCourse.myProgress?.isCompleted ? 'تکمیل‌شده' : 'در حال مطالعه'}
                </div>
              </div>
            </div>

            {/* بخش ثبت پیشرفت، امتیاز ستاره‌ای و یادداشت‌های شخصی */}
            <div className="bg-[#18263A]/50 p-4 rounded-2xl border border-[#1F2E45] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isUpdatingProgress}
                  onClick={handleToggleCompleted}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeCourse.myProgress?.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 shadow-lg shadow-[#719BDF]/20'
                  }`}
                >
                  <Check size={16} />
                  <span>
                    {activeCourse.myProgress?.isCompleted
                      ? 'دوره تکمیل شده است (کلیک جهت بازگشت به حالت عادی)'
                      : 'علامت‌گذاری به عنوان تکمیل‌شده'}
                  </span>
                </button>

                {/* امتیازدهی ۵ ستاره */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">امتیاز شما:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSaveNotesAndRating(s)}
                        className="text-amber-400 hover:scale-125 transition-transform"
                      >
                        <Star
                          size={18}
                          fill={s <= userRating ? 'currentColor' : 'none'}
                          stroke="currentColor"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* یادداشت شخصی */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">یادداشت‌ها و نکات کلیدی من درباره این آموزش</label>
                  <button
                    type="button"
                    onClick={() => handleSaveNotesAndRating()}
                    className="text-[11px] font-bold text-[#719BDF] hover:underline"
                  >
                    ذخیره یادداشت
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="نکات برجسته، خلاصه آموخته‌ها یا ایده‌های اجرایی برای کمپین‌ها..."
                  className="w-full bg-[#111D2E] border border-[#1F2E45] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                />
              </div>
            </div>

            {/* توضیحات دوره */}
            {activeCourse.description && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-300">سرفصل‌ها و توضیحات تکمیلی دوره:</h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line bg-[#142235]/40 p-4 rounded-xl border border-[#1F2E45]">
                  {activeCourse.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* مودال ایجاد / ویرایش دوره (ویژه مدیران) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <GraduationCap className="text-[#719BDF]" size={18} />
                <span>{isEditing ? 'ویرایش مشخصات دوره آموزشی' : 'افزودن دوره آموزشی جدید'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">عنوان دوره *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: دوره فشرده راه‌اندازی کمپین‌های ادوردز"
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">نرم‌افزار / ابزار</label>
                  <select
                    value={formSoftware}
                    onChange={(e) => setFormSoftware(e.target.value)}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                  >
                    {SOFTWARES.filter((s) => s !== 'همه').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">قالب محتوا</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as LearningType)}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                  >
                    <option value="video">ویدیو آموزشی</option>
                    <option value="article">مقاله و راهنما</option>
                    <option value="book">کتاب و جزوه</option>
                    <option value="link">پیوند خارجی</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">مدت زمان (دقیقه)</label>
                  <input
                    type="number"
                    min={1}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">آدرس اینترنتی محتوا (URL)</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">شرح و سرفصل‌ها</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="سرفصل‌ها، نکات و ملزومات..."
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
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
                  {isSubmittingForm ? 'در حال ثبت...' : isEditing ? 'ذخیره تغییرات' : 'افزودن دوره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تخصیص دوره به کاربران (ویژه مدیران) */}
      {isAssignModalOpen && matrixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111D2E] border border-[#1F2E45] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="text-[#719BDF]" size={18} />
                <span>تخصیص دوره به اعضای تیم</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">دوره آموزشی</label>
                <select
                  value={assignResourceId}
                  onChange={(e) => setAssignResourceId(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#719BDF]"
                >
                  {matrixData.resources.map((r) => (
                    <option key={r.id} value={r.id}>{r.title} ({r.software || r.category})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">انتخاب کاربران جهت تخصیص</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUserIds.length === matrixData.teamUsers.length) {
                        setSelectedUserIds([]);
                      } else {
                        setSelectedUserIds(matrixData.teamUsers.map((u) => u.userId));
                      }
                    }}
                    className="text-[11px] font-bold text-[#719BDF] hover:underline"
                  >
                    {selectedUserIds.length === matrixData.teamUsers.length ? 'لغو انتخاب همه' : 'انتخاب همه اعضا'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#142235]/60 p-2.5 rounded-xl border border-[#1F2E45]">
                  {matrixData.teamUsers.map((u) => {
                    const isChecked = selectedUserIds.includes(u.userId);
                    return (
                      <label
                        key={u.userId}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#18263A] cursor-pointer text-xs text-slate-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, u.userId]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== u.userId));
                            }
                          }}
                          className="rounded border-slate-600 text-[#719BDF] focus:ring-0"
                        />
                        <span>{u.fullName}</span>
                        <span className="text-[10px] text-slate-500 mr-auto">({u.role})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#719BDF] hover:bg-[#5b87cf] text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isSubmittingAssign ? 'در حال تخصیص...' : 'تایید تخصیص'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
