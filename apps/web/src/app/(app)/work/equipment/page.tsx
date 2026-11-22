'use client';

import * as React from 'react';
import { useToast } from '@/components/common/toast-provider';
import {
  equipmentApi,
  EquipmentItem,
  EventEquipmentItem,
  EquipmentTemplate,
  ShortagesResponse,
  EquipmentReadinessStatus,
} from '@/features/equipment';
import {
  Box,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  Sliders,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = ['همه', 'صوت', 'تصویر', 'نورپردازی', 'استریم و رایانه', 'سایر'];

export default function EquipmentPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'shortages' | 'items' | 'templates'>('shortages');
  const [shortagesData, setShortagesData] = React.useState<ShortagesResponse | null>(null);
  const [allItems, setAllItems] = React.useState<EquipmentItem[]>([]);
  const [templates, setTemplates] = React.useState<EquipmentTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // فیلترهای تب کمبودها
  const [urgentOnly, setUrgentOnly] = React.useState(false);
  const [shortageStatusFilter, setShortageStatusFilter] = React.useState<string>('all');

  // فیلترهای تب همه تجهیزات
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('همه');

  // مودال‌ها
  const [isItemModalOpen, setIsItemModalOpen] = React.useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  const [selectedTemplateForApply, setSelectedTemplateForApply] = React.useState<string>('');

  // فرم ایجاد تجهیز
  const [newItemName, setNewItemName] = React.useState('');
  const [newItemCategory, setNewItemCategory] = React.useState('صوت');
  const [newItemDesc, setNewItemDesc] = React.useState('');
  const [isSubmittingItem, setIsSubmittingItem] = React.useState(false);

  // فرم اعمال قالب
  const [applyDueDate, setApplyDueDate] = React.useState('');
  const [isSubmittingApply, setIsSubmittingApply] = React.useState(false);

  // بارگذاری کمبودها
  const loadShortages = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await equipmentApi.getShortages({
        urgentOnly,
        status: shortageStatusFilter,
      });
      setShortagesData(data);
    } catch (err) {
      toast.error('خطا در بارگذاری کسری‌های تجهیزات');
    } finally {
      setIsLoading(false);
    }
  }, [urgentOnly, shortageStatusFilter, toast]);

  // بارگذاری اقلام انبار
  const loadItems = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await equipmentApi.getItems({
        search: searchQuery,
        category: selectedCategory === 'همه' ? undefined : selectedCategory,
      });
      setAllItems(data);
    } catch (err) {
      toast.error('خطا در بارگذاری تجهیزات انبار');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, toast]);

  // بارگذاری قالب‌ها
  const loadTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await equipmentApi.getTemplates();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplateForApply) {
        setSelectedTemplateForApply(data[0].id);
      }
    } catch (err) {
      toast.error('خطا در بارگذاری قالب‌های تجهیزات');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplateForApply, toast]);

  React.useEffect(() => {
    if (activeTab === 'shortages') {
      loadShortages();
    } else if (activeTab === 'items') {
      loadItems();
    } else if (activeTab === 'templates') {
      loadTemplates();
    }
  }, [activeTab, loadShortages, loadItems, loadTemplates]);

  // تغییر وضعیت آمادگی تجهیز در رویداد
  const handleStatusChange = async (id: string, newStatus: EquipmentReadinessStatus) => {
    try {
      await equipmentApi.updateReadiness(id, { status: newStatus });
      toast.success('وضعیت آمادگی تجهیز بروزرسانی شد.');
      loadShortages();
    } catch (err) {
      toast.error('خطا در تغییر وضعیت تجهیز');
    }
  };

  // ثبت تجهیز جدید
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error('نام تجهیز الزامی است');
      return;
    }
    setIsSubmittingItem(true);
    try {
      await equipmentApi.createItem({
        name: newItemName.trim(),
        category: newItemCategory,
        description: newItemDesc.trim() || undefined,
      });
      toast.success('تجهیز جدید با موفقیت به انبار افزوده شد.');
      setIsItemModalOpen(false);
      setNewItemName('');
      setNewItemDesc('');
      loadItems();
    } catch (err) {
      toast.error('خطا در ثبت تجهیز جدید');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // اعمال قالب به رویداد
  const handleApplyTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForApply) {
      toast.error('لطفاً یک قالب انتخاب کنید');
      return;
    }
    setIsSubmittingApply(true);
    try {
      const result = await equipmentApi.applyTemplate({
        templateId: selectedTemplateForApply,
        dueDate: applyDueDate || undefined,
      });
      toast.success(`قالب با موفقیت اعمال شد (${result.appliedCount} قلم به کسری‌ها افزوده شد).`);
      setIsApplyModalOpen(false);
      setActiveTab('shortages');
      loadShortages();
    } catch (err) {
      toast.error('خطا در اعمال قالب');
    } finally {
      setIsSubmittingApply(false);
    }
  };

  // حذف تجهیز
  const handleDeleteItem = async (id: string) => {
    if (!confirm('آیا از حذف این تجهیز اطمینان دارید؟')) return;
    try {
      const res = await equipmentApi.deleteItem(id);
      toast.success(res.message);
      loadItems();
    } catch (err) {
      toast.error('خطا در حذف تجهیز');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* سربرگ صفحه */}
      <div className="bg-[#111D2E] p-5 rounded-2xl border border-[#1F2E45] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
              <Box size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-100 font-display">
                مدیریت و انبار تجهیزات
              </h1>
              <p className="text-xs text-slate-400">
                پایش کمبود تجهیزات رویدادها، هشدار کمتر از ۳ روز و قالب‌های آماده وبینار
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 border border-[#1F2E45] transition-colors"
          >
            <Sparkles size={15} className="text-[#719BDF]" />
            <span>اعمال پکیج به رویداد</span>
          </button>
          <button
            type="button"
            onClick={() => setIsItemModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#719BDF] text-white hover:bg-[#5A85C9] transition-all shadow-md shadow-[#719BDF]/20"
          >
            <Plus size={16} />
            <span>ثبت تجهیز جدید</span>
          </button>
        </div>
      </div>

      {/* کارت‌های خلاصه آماری */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111D2E] p-4.5 rounded-2xl border border-[#1F2E45] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>کل کسری‌های تجهیزات</span>
            <Package size={17} className="text-[#719BDF]" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-display">
            {shortagesData?.totalShortages ?? '—'}
          </div>
          <div className="text-[11px] text-slate-400">نیاز به پیگیری و تهیه</div>
        </div>

        <div className="bg-[#111D2E] p-4.5 rounded-2xl border border-rose-500/40 bg-rose-500/5 space-y-2">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>کسری‌های فوری (&lt; ۳ روز)</span>
            <AlertTriangle size={17} className="text-rose-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-display">
            {shortagesData?.urgentCount ?? '—'}
          </div>
          <div className="text-[11px] text-rose-400 font-semibold">رویداد نزدیک است!</div>
        </div>

        <div className="bg-[#111D2E] p-4.5 rounded-2xl border border-[#1F2E45] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>سررسیدهای گذشته</span>
            <Clock size={17} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-display">
            {shortagesData?.overdueCount ?? '—'}
          </div>
          <div className="text-[11px] text-amber-400">نیازمند اقدام فوری</div>
        </div>

        <div className="bg-[#111D2E] p-4.5 rounded-2xl border border-[#1F2E45] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>تجهیزات تعریف‌شده انبار</span>
            <Layers size={17} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-display">
            {allItems.length || 6}
          </div>
          <div className="text-[11px] text-emerald-400">اقلام ثبت‌شده سازمانی</div>
        </div>
      </div>

      {/* تب‌های صفحه */}
      <div className="flex items-center gap-2 border-b border-[#1F2E45] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('shortages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'shortages'
              ? 'bg-[#18263A] text-[#719BDF] border border-[#1F2E45]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111D2E]'
          }`}
        >
          <AlertTriangle size={16} />
          <span>کمبودها بر اساس تاریخ (پیش‌فرض)</span>
          {(shortagesData?.urgentCount || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D66B73] text-white">
              {shortagesData?.urgentCount} فوری
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'items'
              ? 'bg-[#18263A] text-[#719BDF] border border-[#1F2E45]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111D2E]'
          }`}
        >
          <Box size={16} />
          <span>همه تجهیزات انبار</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'templates'
              ? 'bg-[#18263A] text-[#719BDF] border border-[#1F2E45]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111D2E]'
          }`}
        >
          <Sparkles size={16} />
          <span>قالب‌های آماده پکیج‌ها</span>
        </button>
      </div>

      {/* محتوای تب ۱: کمبودها */}
      {activeTab === 'shortages' && (
        <div className="space-y-4">
          {/* نوار فیلتر */}
          <div className="bg-[#111D2E] p-3 rounded-xl border border-[#1F2E45] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUrgentOnly(false)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  !urgentOnly
                    ? 'bg-[#719BDF]/20 text-[#719BDF] border border-[#719BDF]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                همه کمبودها ({shortagesData?.totalShortages ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setUrgentOnly(true)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  urgentOnly
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <AlertTriangle size={13} />
                <span>فقط موارد فوری کمتر از ۳ روز ({shortagesData?.urgentCount ?? 0})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">وضعیت:</span>
              <select
                value={shortageStatusFilter}
                onChange={(e) => setShortageStatusFilter(e.target.value)}
                className="bg-[#18263A] border border-[#1F2E45] rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="not_procured">تهیه نشده (قرمز)</option>
                <option value="incomplete">ناقص (زرد)</option>
                <option value="ready">آماده (سبز)</option>
              </select>
              <button
                type="button"
                onClick={loadShortages}
                className="p-1.5 rounded-lg bg-[#18263A] text-slate-300 hover:bg-[#1F2E45]"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* لیست گروه‌بندی‌شده کمبودها */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-[#111D2E] rounded-xl border border-[#1F2E45] animate-pulse" />
              ))}
            </div>
          ) : shortagesData && shortagesData.groups.length > 0 ? (
            <div className="space-y-4">
              {shortagesData.groups.map((group) => (
                <div
                  key={group.date}
                  className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] overflow-hidden shadow-lg"
                >
                  <div className="bg-[#18263A] px-4 py-2.5 border-b border-[#1F2E45] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-[#719BDF]" />
                      <span className="text-xs font-bold text-slate-200">
                        موعد اجرا: {group.date}
                      </span>
                      {group.hasUrgent && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          کمتر از ۳ روز مانده
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {group.items.length} قلم تجهیز
                    </span>
                  </div>

                  <div className="divide-y divide-[#1F2E45]/60">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          item.isUrgent
                            ? 'bg-rose-500/5 hover:bg-rose-500/10'
                            : 'hover:bg-[#18263A]/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-100">
                              {item.equipmentItem?.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#18263A] text-slate-300 border border-[#1F2E45]">
                              {item.equipmentItem?.category}
                            </span>
                            <span className="text-[11px] text-[#719BDF] font-medium">
                              (رویداد: {item.eventName})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              <span>مسئول: {item.responsible?.fullName || 'تعیین‌نشده'}</span>
                            </span>
                            {item.notes && <span>• {item.notes}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {item.isUrgent && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              <span>{item.daysRemaining} روز مانده</span>
                            </span>
                          )}
                          {item.isOverdue && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-300">
                              سررسید گذشته
                            </span>
                          )}

                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(item.id, e.target.value as EquipmentReadinessStatus)
                            }
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors focus:outline-none ${
                              item.status === 'ready'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : item.status === 'incomplete'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <option value="not_procured">تهیه نشده (قرمز)</option>
                            <option value="incomplete">ناقص (زرد)</option>
                            <option value="ready">آماده (سبز)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-[#111D2E] rounded-2xl border border-[#1F2E45] space-y-3">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">
                هیچ کسری تجهیزاتی برای رویدادها ثبت نشده است
              </h3>
              <p className="text-xs text-slate-400">
                تمامی تجهیزات آماده هستند یا هنوز پکیج تجهیزاتی به رویدادها الصاق نشده است.
              </p>
            </div>
          )}
        </div>
      )}

      {/* محتوای تب ۲: همه تجهیزات انبار */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* نوار جستجو و فیلتر دسته‌بندی */}
          <div className="bg-[#111D2E] p-3 rounded-xl border border-[#1F2E45] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="جستجوی نام تجهیز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#18263A] border border-[#1F2E45] rounded-lg px-2.5 py-1 text-slate-200 w-full focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#719BDF] text-white'
                      : 'bg-[#18263A] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* جدول اقلام */}
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] overflow-hidden shadow-lg">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#18263A] border-b border-[#1F2E45] text-slate-400 font-bold">
                <tr>
                  <th className="p-4">نام قلم تجهیز</th>
                  <th className="p-4">دسته‌بندی</th>
                  <th className="p-4">توضیحات و مشخصات</th>
                  <th className="p-4 text-center">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/60 text-slate-200">
                {allItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#18263A]/40 transition-colors">
                    <td className="p-4 font-bold text-slate-100">{item.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#18263A] text-slate-300 border border-[#1F2E45]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isActive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {item.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف قلم"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* محتوای تب ۳: قالب‌ها و پکیج‌ها */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-[#111D2E] p-4 rounded-xl border border-[#1F2E45] text-xs text-slate-300 leading-relaxed">
            قالب‌های تجهیزات امکان تخصیص خودکار لیست چک‌لیست اقلام مورد نیاز به وبینارها و کمپین‌ها را در یک کلیک فراهم می‌سازند.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-[#111D2E] p-5 rounded-2xl border border-[#1F2E45] shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#719BDF]" />
                    <span>{tpl.name}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateForApply(tpl.id);
                      setIsApplyModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#719BDF] text-white hover:bg-[#5A85C9] transition-colors"
                  >
                    اعمال این پکیج
                  </button>
                </div>
                <p className="text-xs text-slate-400">{tpl.description || 'بدون توضیحات'}</p>

                <div className="space-y-1.5 pt-2 border-t border-[#1F2E45]">
                  <div className="text-[11px] font-bold text-slate-400">اقلام موجود در پکیج:</div>
                  <div className="space-y-1">
                    {tpl.items.map((it) => (
                      <div
                        key={it.id}
                        className="text-xs text-slate-300 flex items-center justify-between bg-[#18263A] p-2 rounded-lg"
                      >
                        <span>{it.equipmentItem?.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {it.quantity} عدد
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* مودال ثبت قلم جدید */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Box size={16} className="text-[#719BDF]" />
                <span>ثبت قلم تجهیز جدید در انبار</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نام قلم تجهیز *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: میکروفون بی‌سیم یقه‌ای Rode"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">دسته‌بندی</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="صوت">صوت</option>
                  <option value="تصویر">تصویر</option>
                  <option value="نورپردازی">نورپردازی</option>
                  <option value="استریم و رایانه">استریم و رایانه</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">توضیحات و مشخصات</label>
                <textarea
                  rows={3}
                  placeholder="توضیحات تکمیلی یا شماره سریال..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#18263A]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className="px-4 py-2 rounded-xl bg-[#719BDF] text-white font-bold hover:bg-[#5A85C9] transition-colors"
                >
                  {isSubmittingItem ? 'در حال ثبت...' : 'ثبت تجهیز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال اعمال پکیج */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles size={16} className="text-[#719BDF]" />
                <span>اعمال پکیج تجهیزات به رویداد</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyTemplate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">انتخاب پکیج آماده</label>
                <select
                  value={selectedTemplateForApply}
                  onChange={(e) => setSelectedTemplateForApply(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.items.length} قلم)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">مهلت تهیه (تاریخ)</label>
                <input
                  type="date"
                  value={applyDueDate}
                  onChange={(e) => setApplyDueDate(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#18263A]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApply}
                  className="px-4 py-2 rounded-xl bg-[#719BDF] text-white font-bold hover:bg-[#5A85C9] transition-colors"
                >
                  {isSubmittingApply ? 'در حال اعمال...' : 'اعمال پکیج به کسری‌ها'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
