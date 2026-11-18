'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { EmptyState } from '@/components/common/empty-state';
import { useToast } from '@/components/common/toast-provider';
import {
  calendarService,
  CalendarEvent,
  CalendarEventType,
  CalendarViewMode,
  CalendarDayCell,
  CreateCalendarEventInput,
  buildJalaliMonthGrid,
  buildJalaliWeekGrid,
  filterEventsByType,
  CalendarHeader,
  CalendarFilterBar,
  CalendarMonthView,
  CalendarWeekView,
  CalendarMobileListView,
  CalendarEventDrawer,
  CalendarEventModal,
} from '@/features/calendar';
import {
  isoToJalali,
  jalaliToIso,
  getTodayIsoDate,
  formatPersianDate,
  isValidIsoDate,
} from '@/lib/persian-date';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  RotateCcw,
  Plus,
  Loader2,
} from 'lucide-react';

export default function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // تاریخ امروز به وقت محلی
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const todayJalali = useMemo(() => isoToJalali(todayIso), [todayIso]);

  // پارامترهای سال، ماه و روز از URL
  const urlYear = searchParams.get('year')
    ? parseInt(searchParams.get('year')!, 10)
    : todayJalali.year;
  const urlMonth = searchParams.get('month')
    ? parseInt(searchParams.get('month')!, 10)
    : todayJalali.month;
  const urlView = (searchParams.get('view') as CalendarViewMode) || 'month';
  const urlTypes = searchParams.get('type')
    ? (searchParams.get('type')!.split(',') as CalendarEventType[])
    : [];

  const [currentYear, setCurrentYear] = useState<number>(urlYear);
  const [currentMonth, setCurrentMonth] = useState<number>(urlMonth);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(urlView);
  const [selectedTypes, setSelectedTypes] = useState<CalendarEventType[]>(urlTypes);

  // تاریخ مبنا برای نمای هفته (به صورت پیش‌فرض تاریخ امروز یا تاریخ معتبر پارامتر URL)
  const initialWeekAnchor = useMemo(() => {
    const urlDate = searchParams.get('date');
    if (urlDate && isValidIsoDate(urlDate)) return urlDate;
    return todayIso;
  }, [searchParams, todayIso]);

  const [weekAnchorIso, setWeekAnchorIso] = useState<string>(initialWeekAnchor);

  // داده‌های رویدادها
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // کشو و مودال
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // همگام‌سازی پارامترهای URL
  const updateUrlParams = useCallback(
    (updates: {
      year?: number;
      month?: number;
      date?: string;
      view?: CalendarViewMode;
      types?: CalendarEventType[];
    }) => {
      const current = new URLSearchParams(searchParams.toString());

      if (updates.year !== undefined) current.set('year', String(updates.year));
      if (updates.month !== undefined) current.set('month', String(updates.month));
      if (updates.date !== undefined) current.set('date', updates.date);
      if (updates.view !== undefined) current.set('view', updates.view);

      if (updates.types !== undefined) {
        if (updates.types.length > 0) {
          current.set('type', updates.types.join(','));
        } else {
          current.delete('type');
        }
      }

      const queryString = current.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // واکشی رویدادها از سرویس
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarService.getAll();
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError(err?.message || 'خطا در بارگذاری رویدادهای تقویم.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // رویدادهای فیلترشده بر اساس نوع
  const filteredEvents = useMemo(() => {
    return filterEventsByType(events, selectedTypes);
  }, [events, selectedTypes]);

  // محاسبه روزهای شبکه تقویم ماه
  const monthDayCells = useMemo(() => {
    return buildJalaliMonthGrid(currentYear, currentMonth, filteredEvents);
  }, [currentYear, currentMonth, filteredEvents]);

  // محاسبه روزهای شبکه تقویم هفته بر پایه weekAnchorIso
  const weekDayCells = useMemo(() => {
    return buildJalaliWeekGrid(weekAnchorIso, filteredEvents);
  }, [weekAnchorIso, filteredEvents]);

  // ناوبری به ماه بعد یا هفته بعد (۷ روز جلوتر)
  const handleNext = () => {
    if (viewMode === 'month' || viewMode === 'list') {
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
      }
      setCurrentMonth(nextMonth);
      setCurrentYear(nextYear);
      const newAnchor = jalaliToIso(nextYear, nextMonth, 1);
      setWeekAnchorIso(newAnchor);
      updateUrlParams({ year: nextYear, month: nextMonth, date: newAnchor });
    } else {
      // نمای هفته: دقیقاً ۷ روز به جلو حرکت می‌کند
      const currTs = new Date(`${weekAnchorIso}T12:00:00Z`).getTime();
      const nextDate = new Date(currTs + 7 * 86400000);
      const nextIso = nextDate.toISOString().split('T')[0];
      const nextJ = isoToJalali(nextIso);
      setWeekAnchorIso(nextIso);
      setCurrentYear(nextJ.year);
      setCurrentMonth(nextJ.month);
      updateUrlParams({ year: nextJ.year, month: nextJ.month, date: nextIso });
    }
  };

  // ناوبری به ماه قبل یا هفته قبل (۷ روز عقب‌تر)
  const handlePrevious = () => {
    if (viewMode === 'month' || viewMode === 'list') {
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
      }
      setCurrentMonth(prevMonth);
      setCurrentYear(prevYear);
      const newAnchor = jalaliToIso(prevYear, prevMonth, 1);
      setWeekAnchorIso(newAnchor);
      updateUrlParams({ year: prevYear, month: prevMonth, date: newAnchor });
    } else {
      // نمای هفته: دقیقاً ۷ روز به عقب حرکت می‌کند
      const currTs = new Date(`${weekAnchorIso}T12:00:00Z`).getTime();
      const prevDate = new Date(currTs - 7 * 86400000);
      const prevIso = prevDate.toISOString().split('T')[0];
      const prevJ = isoToJalali(prevIso);
      setWeekAnchorIso(prevIso);
      setCurrentYear(prevJ.year);
      setCurrentMonth(prevJ.month);
      updateUrlParams({ year: prevJ.year, month: prevJ.month, date: prevIso });
    }
  };

  // پرش به امروز
  const handleToday = () => {
    setCurrentYear(todayJalali.year);
    setCurrentMonth(todayJalali.month);
    setWeekAnchorIso(todayIso);
    updateUrlParams({
      year: todayJalali.year,
      month: todayJalali.month,
      date: todayIso,
    });
  };

  const isTodayDisabled = useMemo(() => {
    if (viewMode === 'week') {
      return weekDayCells.some((c) => c.isToday);
    }
    return currentYear === todayJalali.year && currentMonth === todayJalali.month;
  }, [viewMode, weekDayCells, currentYear, currentMonth, todayJalali]);

  // زیرعنوان بازه زمانی هفته جاری
  const weekSubtitle = useMemo(() => {
    if (viewMode === 'week' && weekDayCells.length === 7) {
      const start = weekDayCells[0];
      const end = weekDayCells[6];
      return `هفته از ${formatPersianDate(start.dateIso)} تا ${formatPersianDate(end.dateIso)}`;
    }
    return undefined;
  }, [viewMode, weekDayCells]);

  // تغییر نمای نمایش (ماه / هفته / فهرست)
  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === 'week') {
      // اگر از ماه دیگر به هفته بیاییم، انکر را روی اول همان ماه یا امروز قرار می‌دهیم
      if (currentYear === todayJalali.year && currentMonth === todayJalali.month) {
        setWeekAnchorIso(todayIso);
      } else {
        setWeekAnchorIso(jalaliToIso(currentYear, currentMonth, 1));
      }
    }
    updateUrlParams({ view: mode });
  };

  // فیلتر کردن نوع رویداد
  const handleToggleType = (type: CalendarEventType) => {
    let next: CalendarEventType[];
    if (selectedTypes.includes(type)) {
      next = selectedTypes.filter((t) => t !== type);
    } else {
      next = [...selectedTypes, type];
    }
    setSelectedTypes(next);
    updateUrlParams({ types: next });
  };

  const handleSelectAllTypes = () => {
    setSelectedTypes([]);
    updateUrlParams({ types: [] });
  };

  // کلیک روی رویداد جهت باز شدن کشو
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  // کلیک روی خانه خالی روز جهت باز شدن مودال ایجاد
  const handleDayClick = (dateIso: string) => {
    setModalInitialDate(dateIso);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  // جابجایی رویداد با درگ اند دراپ
  const handleEventReschedule = async (eventId: string, newDateIso: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    // آپدیت خوش‌بینانه در استیت
    const prevEvents = [...events];
    setEvents((current) =>
      current.map((e) => (e.id === eventId ? { ...e, startDate: newDateIso, endDate: newDateIso } : e))
    );

    try {
      const updated = await calendarService.reschedule(eventId, newDateIso);
      setEvents((current) => current.map((e) => (e.id === eventId ? updated : e)));
      toast.success(
        `رویداد «${target.title}» با موفقیت به تاریخ ${formatPersianDate(newDateIso)} منتقل شد.`
      );
    } catch (err: any) {
      setEvents(prevEvents);
      toast.error(err?.message || 'خطا در تغییر تاریخ رویداد. عملیات بازگردانده شد.');
    }
  };

  // ثبت یا ویرایش رویداد در مودال
  const handleModalSubmit = async (input: CreateCalendarEventInput) => {
    try {
      if (editingEvent) {
        const updated = await calendarService.update(editingEvent.id, {
          id: editingEvent.id,
          ...input,
        });
        setEvents((current) => current.map((e) => (e.id === editingEvent.id ? updated : e)));
        toast.success('رویداد با موفقیت ویرایش شد.');
        if (selectedEvent?.id === editingEvent.id) {
          setSelectedEvent(updated);
        }
      } else {
        const created = await calendarService.create(input);
        setEvents((current) => [...current, created]);
        toast.success('رویداد جدید با موفقیت به تقویم اضافه شد.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ذخیره رویداد در سرور');
      throw err;
    }
  };

  // حذف رویداد
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await calendarService.delete(eventId);
      setEvents((current) => current.filter((e) => e.id !== eventId));
      toast.success('رویداد با موفقیت حذف شد.');
    } catch (err: any) {
      toast.error(err?.message || 'خطا در حذف رویداد از سرور');
    }
  };

  // بازنشانی داده‌های نمونه
  const handleResetData = async () => {
    setLoading(true);
    try {
      const fresh = await calendarService.resetToDefault();
      setEvents(fresh);
      toast.success('داده‌های نمونه تقویم با موفقیت بازنشانی شدند.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      {/* هدر صفحه و نوار مسیر (Breadcrumb) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Breadcrumb
            items={[
              { label: 'اجرا و دانش' },
              { label: 'تقویم' },
            ]}
          />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <CalendarIcon size={24} className="text-[#38BDF8]" />
              <span>تقویم بازاریابی و رویدادها</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-bold">
              ص ۱۹ §۲۰
            </span>
          </div>
          <p className="text-xs text-slate-400">
            برنامه‌ریزی، زمان‌بندی اجرای کمپین‌ها، وبینارها، جلسات تیمی و مهلت تسک‌ها در تقویم شمسی جلالی
          </p>
        </div>
      </div>

      {/* نوار بالای تقویم: تغییر ماه، امروز، سوئیچ نما، دکمه افزودن رویداد */}
      <CalendarHeader
        currentYear={currentYear}
        currentMonth={currentMonth}
        subtitle={weekSubtitle}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onAddEvent={() => {
          setModalInitialDate(todayIso);
          setEditingEvent(null);
          setIsModalOpen(true);
        }}
        onResetData={handleResetData}
        isTodayDisabled={isTodayDisabled}
      />

      {/* راهنمای رنگ و فیلتر انواع چهارگانه رویدادها */}
      <CalendarFilterBar
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
        onSelectAll={handleSelectAllTypes}
        events={events}
      />

      {/* محتوای تقویم: حالت‌های بارگذاری، خطا، خالی، و نماهای ماه / هفته / لیست */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-[#0C1422] border border-[#19273D] flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 size={36} className="animate-spin text-[#38BDF8]" />
          <div className="text-sm font-bold text-slate-300">
            در حال بارگذاری تقویم بازاریابی...
          </div>
          <div className="text-xs text-slate-500">
            محاسبه روزها و همگام‌سازی رویدادهای شمسی
          </div>
        </div>
      ) : error ? (
        <EmptyState
          icon={<AlertTriangle size={32} className="text-rose-400" />}
          title="خطا در واکشی تقویم"
          description={error}
          action={{
            label: 'تلاش دوباره',
            onClick: fetchEvents,
          }}
          className="bg-[#0C1422] border border-[#19273D] rounded-2xl p-10"
        />
      ) : filteredEvents.length === 0 && selectedTypes.length > 0 ? (
        <EmptyState
          icon={<CalendarIcon size={32} className="text-slate-500" />}
          title="هیچ رویدادی با فیلتر انتخاب‌شده یافت نشد"
          description="می‌توانید فیلترهای نوع رویداد را تغییر دهید یا رویداد جدیدی ایجاد کنید."
          action={{
            label: 'نمایش همه رویدادها',
            onClick: handleSelectAllTypes,
          }}
          className="bg-[#0C1422] border border-[#19273D] rounded-2xl p-10"
        />
      ) : (
        <>
          {/* نمای ماه (Month Grid View) */}
          {viewMode === 'month' && (
            <div className="space-y-4">
              <CalendarMonthView
                dayCells={monthDayCells}
                onEventClick={handleEventClick}
                onDayClick={handleDayClick}
                onEventReschedule={handleEventReschedule}
              />
              <div className="text-[11px] text-slate-500 text-center select-none">
                💡 نکته: برای تغییر تاریخ، می‌توانید رویدادها را کشیده و روی روز مورد نظر رها کنید (Drag & Drop)، یا روی روز خالی کلیک نمایید.
              </div>
            </div>
          )}

          {/* نمای هفته (Week Grid View) */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              <CalendarWeekView
                dayCells={weekDayCells}
                onEventClick={handleEventClick}
                onDayClick={handleDayClick}
                onEventReschedule={handleEventReschedule}
              />
              <div className="text-[11px] text-slate-500 text-center select-none">
                💡 نمای هفته ۷ روزه (شنبه الی جمعه) با تفکیک روز تعطیل و زمان‌بندی اختصاصی.
              </div>
            </div>
          )}

          {/* نمای فهرست روزانه (Daily List View مخصوص موبایل یا حالت فهرستی) */}
          {viewMode === 'list' && (
            <CalendarMobileListView
              dayCells={monthDayCells}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
        </>
      )}

      {/* کشوی جزئیات رویداد */}
      <CalendarEventDrawer
        event={selectedEvent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(ev) => {
          setIsDrawerOpen(false);
          setEditingEvent(ev);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteEvent}
      />

      {/* مودال ایجاد / ویرایش رویداد */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialDate={modalInitialDate}
        editEvent={editingEvent}
      />
    </div>
  );
}
