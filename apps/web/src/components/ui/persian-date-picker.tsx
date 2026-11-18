'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  isoToJalali,
  jalaliToIso,
  formatPersianDate,
  getPersianMonthDays,
  getPersianMonthStartWeekday,
  compareIsoDates,
  getTodayIsoDate,
  isValidIsoDate,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_SHORT,
  PERSIAN_WEEKDAY_NAMES,
} from '@/lib/persian-date';

export type DatePickerMode = 'single' | 'range';

export interface DateRangeValue {
  from: string; // ISO format: YYYY-MM-DD
  to: string; // ISO format: YYYY-MM-DD
}

export interface BasePersianDatePickerProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string; // ISO format: YYYY-MM-DD
  maxDate?: string; // ISO format: YYYY-MM-DD
  clearable?: boolean;
  className?: string;
}

export interface SinglePersianDatePickerProps extends BasePersianDatePickerProps {
  mode?: 'single';
  value?: string;
  onChange?: (value: string) => void;
}

export interface RangePersianDatePickerProps extends BasePersianDatePickerProps {
  mode: 'range';
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
}

export type PersianDatePickerProps =
  | SinglePersianDatePickerProps
  | RangePersianDatePickerProps;

export function PersianDatePicker(props: PersianDatePickerProps) {
  const {
    mode = 'single',
    value,
    label,
    placeholder,
    error,
    helperText,
    required = false,
    disabled = false,
    minDate,
    maxDate,
    clearable = false,
    className = '',
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; right: number } | null>(null);

  // استخراج مقدار اولیه معتبر برای تعیین ماه/سال پیش‌فرض در تقویم
  const todayIso = React.useMemo(() => getTodayIsoDate(), []);
  const initialIso = React.useMemo(() => {
    if (typeof value === 'string' && isValidIsoDate(value)) {
      return value;
    }
    if (value && typeof value === 'object' && isValidIsoDate(value.from)) {
      return value.from;
    }
    return todayIso;
  }, [value, todayIso]);

  const initialJalali = React.useMemo(
    () => isoToJalali(initialIso),
    [initialIso],
  );

  const [viewYear, setViewYear] = React.useState<number>(initialJalali.year);
  const [viewMonth, setViewMonth] = React.useState<number>(initialJalali.month);

  // استیت موقت برای حالت بازه (Range selection)
  const [rangeSelectingFrom, setRangeSelectingFrom] = React.useState<string | null>(null);
  const [hoverDate, setHoverDate] = React.useState<string | null>(null);

  // محاسبه موقعیت شناور تقویم در سطح document.body
  const calcCoords = React.useCallback((triggerEl: HTMLElement) => {
    const rect = triggerEl.getBoundingClientRect();
    const popoverHeight = popupRef.current?.offsetHeight || 440;
    const popoverWidth = popupRef.current?.offsetWidth || 330;
    const spaceBelow = window.innerHeight - rect.bottom;
    const fitsBelow = spaceBelow >= popoverHeight + 8;
    const fitsAbove = rect.top >= popoverHeight + 8;

    let top: number;
    if (fitsBelow) {
      top = rect.bottom + 6;
    } else if (fitsAbove) {
      top = Math.max(8, rect.top - popoverHeight - 6);
    } else {
      if (spaceBelow >= rect.top) {
        top = Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - popoverHeight - 8));
      } else {
        top = Math.max(8, rect.top - popoverHeight - 6);
      }
    }

    let right = window.innerWidth - rect.right;
    const maxRight = Math.max(12, window.innerWidth - popoverWidth - 12);
    right = Math.max(12, Math.min(right, maxRight));

    return { top, right };
  }, []);

  const updatePosition = React.useCallback(() => {
    if (!containerRef.current) return;
    setCoords(calcCoords(containerRef.current));
  }, [calcCoords]);

  // محاسبه مختصات بلافاصله پیش از اولین ترسیم صفحه (LayoutEffect)
  React.useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    setCoords(calcCoords(containerRef.current));
  }, [isOpen, calcCoords]);

  React.useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // همگام‌سازی نمای تقویم هنگام تغییر خارجی مقدار ورودی
  React.useEffect(() => {
    if (typeof value === 'string' && isValidIsoDate(value)) {
      const j = isoToJalali(value);
      if (j.isValid) {
        setViewYear(j.year);
        setViewMonth(j.month);
      }
    } else if (value && typeof value === 'object' && isValidIsoDate(value.from)) {
      const j = isoToJalali(value.from);
      if (j.isValid) {
        setViewYear(j.year);
        setViewMonth(j.month);
      }
    }
  }, [value]);

  // بستن منو با کلیک بیرون از کامپوننت یا فشردن کلید Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false);
        setRangeSelectingFrom(null);
        setHoverDate(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setRangeSelectingFrom(null);
        setHoverDate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // ناوبری به ماه قبل / بعد
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((prev) => prev - 1);
      setViewMonth(12);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((prev) => prev + 1);
      setViewMonth(1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // محاسبه روزهای ماه جاری و روز هفته شروع
  const totalDays = getPersianMonthDays(viewYear, viewMonth);
  const startWeekday = getPersianMonthStartWeekday(viewYear, viewMonth);

  // بررسی محدودیت‌های minDate و maxDate
  const isDateDisabled = React.useCallback(
    (isoDate: string) => {
      if (minDate && compareIsoDates(isoDate, minDate) < 0) return true;
      if (maxDate && compareIsoDates(isoDate, maxDate) > 0) return true;
      return false;
    },
    [minDate, maxDate],
  );

  // کلیک روی یک روز تقویم
  const handleSelectDay = (day: number) => {
    const selectedIso = jalaliToIso(viewYear, viewMonth, day);
    if (isDateDisabled(selectedIso)) return;

    if (props.mode === 'range') {
      if (!rangeSelectingFrom) {
        // گام اول: انتخاب تاریخ شروع
        setRangeSelectingFrom(selectedIso);
      } else {
        // گام دوم: انتخاب تاریخ پایان
        let from = rangeSelectingFrom;
        let to = selectedIso;

        // در صورت انتخاب معکوس (پایان قبل از شروع)، ترتیب را مرتب می‌کنیم
        if (compareIsoDates(from, to) > 0) {
          const temp = from;
          from = to;
          to = temp;
        }

        props.onChange?.({ from, to });
        setRangeSelectingFrom(null);
        setHoverDate(null);
        setIsOpen(false);
      }
    } else {
      props.onChange?.(selectedIso);
      setIsOpen(false);
    }
  };

  // میانبرهای انتخاب سریع بازه در حالت Range با رعایت سقف و کف minDate / maxDate
  const handleApplyPreset = (presetType: 'today' | '7days' | '30days' | 'thisMonth') => {
    if (props.mode !== 'range') return;

    const today = new Date();
    const todayIsoStr = getTodayIsoDate();
    let from = todayIsoStr;
    let to = todayIsoStr;

    if (presetType === 'today') {
      from = todayIsoStr;
      to = todayIsoStr;
    } else if (presetType === '7days') {
      const d7 = new Date(today.getTime() - 6 * 86400000);
      const y = d7.getFullYear();
      const m = String(d7.getMonth() + 1).padStart(2, '0');
      const d = String(d7.getDate()).padStart(2, '0');
      from = `${y}-${m}-${d}`;
      to = todayIsoStr;
    } else if (presetType === '30days') {
      const d30 = new Date(today.getTime() - 29 * 86400000);
      const y = d30.getFullYear();
      const m = String(d30.getMonth() + 1).padStart(2, '0');
      const d = String(d30.getDate()).padStart(2, '0');
      from = `${y}-${m}-${d}`;
      to = todayIsoStr;
    } else if (presetType === 'thisMonth') {
      const currJ = isoToJalali(todayIsoStr);
      from = jalaliToIso(currJ.year, currJ.month, 1);
      to = todayIsoStr;
    }

    // اعمال محدودیت‌های minDate و maxDate روی میانبرها
    if (minDate && compareIsoDates(from, minDate) < 0) {
      from = minDate;
    }
    if (maxDate && compareIsoDates(to, maxDate) > 0) {
      to = maxDate;
    }

    if (compareIsoDates(from, to) <= 0) {
      props.onChange?.({ from, to });
      setRangeSelectingFrom(null);
      setHoverDate(null);
      setIsOpen(false);
    }
  };

  // پاکسازی مقدار
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.mode === 'range') {
      props.onChange?.({ from: '', to: '' });
    } else {
      props.onChange?.('');
    }
    setRangeSelectingFrom(null);
    setHoverDate(null);
  };

  // متن نمایشی فیلد فعال
  const displayLabel = React.useMemo(() => {
    if (props.mode === 'range') {
      const range = value as DateRangeValue | undefined;
      const hasFrom = range?.from && isValidIsoDate(range.from);
      const hasTo = range?.to && isValidIsoDate(range.to);

      if (hasFrom && hasTo) {
        return `از ${formatPersianDate(range?.from)} تا ${formatPersianDate(range?.to)}`;
      }
      if (hasFrom) {
        return `از ${formatPersianDate(range?.from)} (انتخاب تاریخ پایان...)`;
      }
      return placeholder || 'انتخاب بازه تاریخ...';
    } else {
      if (typeof value === 'string' && isValidIsoDate(value)) {
        return formatPersianDate(value);
      }
      return placeholder || 'انتخاب تاریخ شمسی...';
    }
  }, [props.mode, value, placeholder]);

  const hasValue = React.useMemo(() => {
    if (props.mode === 'range') {
      const r = value as DateRangeValue | undefined;
      return Boolean(r?.from || r?.to);
    }
    return typeof value === 'string' && Boolean(value.trim());
  }, [props.mode, value]);

  // دامنه انتخاب سال‌ها در هدر تقویم
  const yearsRange = React.useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => viewYear - 7 + i);
  }, [viewYear]);

  return (
    <div ref={containerRef} className={`space-y-1.5 relative text-right ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-[#D66B73]">*</span>}
        </label>
      )}

      {/* فیلد ماشه بازکننده پاپ‌آپ */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!isOpen && containerRef.current) {
            setCoords(calcCoords(containerRef.current));
          }
          setIsOpen(!isOpen);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between bg-[#111D2E] border rounded-xl px-4 py-2.5 text-right text-xs transition-all focus:outline-none ${
          disabled
            ? 'opacity-60 bg-[#0B1423] cursor-not-allowed border-[#1F2E45] text-slate-600'
            : error
            ? 'border-[#D66B73] ring-1 ring-[#D66B73]/20 text-slate-100'
            : 'border-[#1F2E45] hover:border-[#719BDF]/50 focus:border-[#719BDF] focus:ring-1 focus:ring-[#719BDF]/20 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar size={16} className="text-[#719BDF] shrink-0" />
          <span className={`truncate ${!hasValue ? 'text-slate-500 font-normal' : 'font-semibold text-slate-100'}`}>
            {displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {clearable && hasValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              title="پاک کردن تاریخ"
              aria-label="پاک کردن تاریخ"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#18263A] transition-colors"
            >
              <X size={14} />
            </span>
          )}
          <ChevronLeft
            size={16}
            className={`text-slate-400 transition-transform ${
              isOpen ? '-rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {/* متن پیام خطا یا راهنما */}
      {error ? (
        <p className="text-xs text-[#D66B73] font-medium mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400 mt-1">{helperText}</p>
      ) : null}

      {/* پنجره پاپ‌آپ تقویم شبکه‌ای - Rendered via React Portal directly into body with fixed positioning */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          role="dialog"
          aria-label="تقویم شمسی"
          dir="rtl"
          style={{
            position: 'fixed',
            top: coords ? `${coords.top}px` : '-9999px',
            right: coords ? `${coords.right}px` : '-9999px',
            zIndex: 999999,
          }}
          className="w-[310px] sm:w-[330px] max-h-[calc(100vh-24px)] overflow-y-auto bg-[#111D2E] border border-[#1F2E45] rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 text-slate-100 backdrop-blur-xl select-none pointer-events-auto"
        >
          {/* هدر تقویم: تغییر ماه، تغییر سال و فلش‌ها */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
            {/* فلش ماه قبل (در RTL سمت راست) */}
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="ماه قبل"
              className="p-1.5 rounded-xl hover:bg-[#18263A] text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight size={17} />
            </button>

            {/* دراپ‌داون‌های انتخاب سریع ماه و سال */}
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                aria-label="انتخاب ماه"
                className="bg-[#0B1423] hover:bg-[#18263A] border border-[#1F2E45] text-xs font-bold text-slate-200 rounded-lg py-1 px-2 focus:ring-1 focus:ring-[#719BDF] focus:outline-none transition-colors"
              >
                {PERSIAN_MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1} className="bg-[#0B1423] text-slate-200">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                aria-label="انتخاب سال"
                className="bg-[#0B1423] hover:bg-[#18263A] border border-[#1F2E45] text-xs font-bold text-slate-200 rounded-lg py-1 px-2 focus:ring-1 focus:ring-[#719BDF] focus:outline-none transition-colors"
              >
                {yearsRange.map((y) => (
                  <option key={y} value={y} className="bg-[#0B1423] text-slate-200">
                    {y.toLocaleString('fa-IR')}
                  </option>
                ))}
              </select>
            </div>

            {/* فلش ماه بعد (در RTL سمت چپ) */}
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="ماه بعد"
              className="p-1.5 rounded-xl hover:bg-[#18263A] text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft size={17} />
            </button>
          </div>

          {/* سرستون‌های روزهای هفته (شنبه تا جمعه) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {PERSIAN_WEEKDAY_SHORT.map((dayName, idx) => {
              const isFriday = idx === 6;
              return (
                <div
                  key={dayName}
                  title={PERSIAN_WEEKDAY_NAMES[idx]}
                  className={`text-[11px] font-bold py-1 ${
                    isFriday ? 'text-[#D66B73]' : 'text-slate-400'
                  }`}
                >
                  {dayName}
                </div>
              );
            })}
          </div>

          {/* شبکه سلول‌های روزهای ماه */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* سلول‌های خالی روزهای هفته قبل از شروع ماه */}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* روزهای ماه */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const cellIso = jalaliToIso(viewYear, viewMonth, dayNum);
              const isDisabled = isDateDisabled(cellIso);
              const isToday = cellIso === todayIso;

              // منطق انتخاب Single
              const isSelectedSingle =
                props.mode !== 'range' && typeof value === 'string' && value === cellIso;

              // منطق انتخاب Range
              const rangeVal = props.mode === 'range' ? (value as DateRangeValue | undefined) : undefined;
              const rangeFrom = rangeSelectingFrom || rangeVal?.from;
              const rangeTo = rangeVal?.to;

              const isRangeStart = props.mode === 'range' && rangeFrom === cellIso;
              const isRangeEnd = props.mode === 'range' && rangeTo === cellIso;

              const inSelectedRange =
                props.mode === 'range' &&
                rangeVal?.from &&
                rangeVal?.to &&
                compareIsoDates(cellIso, rangeVal.from) > 0 &&
                compareIsoDates(cellIso, rangeVal.to) < 0;

              const inHoverRange =
                props.mode === 'range' &&
                rangeSelectingFrom &&
                hoverDate &&
                compareIsoDates(cellIso, rangeSelectingFrom) > 0 &&
                compareIsoDates(cellIso, hoverDate) <= 0;

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(dayNum)}
                  onMouseEnter={() => props.mode === 'range' && setHoverDate(cellIso)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isDisabled
                      ? 'text-slate-600 bg-slate-800/20 cursor-not-allowed'
                      : isSelectedSingle || isRangeStart || isRangeEnd
                      ? 'bg-gradient-to-r from-blue-600 to-[#719BDF] text-white font-bold shadow-md shadow-blue-500/20'
                      : inSelectedRange || inHoverRange
                      ? 'bg-blue-500/20 text-[#719BDF] font-bold hover:bg-blue-500/30'
                      : isToday
                      ? 'border border-[#719BDF] text-[#719BDF] font-bold hover:bg-[#18263A]'
                      : 'text-slate-200 hover:bg-[#18263A] font-medium'
                  }`}
                >
                  {dayNum.toLocaleString('fa-IR')}
                </button>
              );
            })}
          </div>

          {/* میانبرهای سریع در حالت بازه (Range) */}
          {props.mode === 'range' && (
            <div className="pt-3 border-t border-[#1F2E45]">
              <div className="text-[10px] text-slate-400 font-bold mb-1.5 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>میانبرهای سریع بازه</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('today')}
                  className="px-2 py-1 bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 text-[11px] font-semibold rounded-lg border border-[#1F2E45] transition-colors text-center"
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('7days')}
                  className="px-2 py-1 bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 text-[11px] font-semibold rounded-lg border border-[#1F2E45] transition-colors text-center"
                >
                  ۷ روز اخیر
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('30days')}
                  className="px-2 py-1 bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 text-[11px] font-semibold rounded-lg border border-[#1F2E45] transition-colors text-center"
                >
                  ۳۰ روز اخیر
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('thisMonth')}
                  className="px-2 py-1 bg-[#18263A] hover:bg-[#1F2E45] text-slate-200 text-[11px] font-semibold rounded-lg border border-[#1F2E45] transition-colors text-center"
                >
                  این ماه (تا امروز)
                </button>
              </div>
            </div>
          )}

          {/* فوتر وضعیت یا راهنما */}
          <div className="pt-2 border-t border-[#1F2E45] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock size={12} />
              <span>امروز: {formatPersianDate(todayIso)}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setRangeSelectingFrom(null);
                setHoverDate(null);
              }}
              className="text-xs text-[#719BDF] hover:text-white font-bold"
            >
              بستن
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
