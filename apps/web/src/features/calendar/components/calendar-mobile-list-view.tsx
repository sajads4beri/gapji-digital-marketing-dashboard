'use client';

import React from 'react';
import { CalendarDayCell, CalendarEvent } from '../types';
import { EVENT_TYPE_CONFIG } from '../constants';
import { PERSIAN_WEEKDAY_NAMES, formatPersianDate } from '@/lib/persian-date';
import { Plus, Clock, User, Package, Calendar } from 'lucide-react';

interface CalendarMobileListViewProps {
  dayCells: CalendarDayCell[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (dateIso: string) => void;
}

export function CalendarMobileListView({
  dayCells,
  onEventClick,
  onDayClick,
}: CalendarMobileListViewProps) {
  // فیلتر کردن روزهایی که رویداد دارند یا امروز هستند (جهت تجربه روان‌تر روی موبایل)
  // به‌علاوه امکان مشاهده همه روزها
  const activeCells = dayCells.filter((c) => c.isCurrentMonth);

  return (
    <div className="space-y-4" dir="rtl">
      {activeCells.map((cell) => {
        const isFriday = cell.dayOfWeek === 6;
        const weekdayName = PERSIAN_WEEKDAY_NAMES[cell.dayOfWeek] || '';

        return (
          <div
            key={cell.dateIso}
            className={`p-4 rounded-2xl border transition-all ${
              cell.isToday
                ? 'bg-[#0E1A2B] border-[#38BDF8]/60 ring-1 ring-[#38BDF8]/30 shadow-lg'
                : isFriday
                ? 'bg-[#120D14] border-rose-900/30'
                : 'bg-[#0C1422] border-[#19273D]'
            }`}
          >
            {/* سربرگ روز */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2F47] mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                    cell.isToday
                      ? 'bg-[#38BDF8] text-[#06090F]'
                      : isFriday
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-[#18263A] text-white border border-[#2B3E5C]'
                  }`}
                >
                  {cell.jalaliDay.toLocaleString('fa-IR')}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-extrabold ${
                        isFriday ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {weekdayName}
                    </span>
                    {cell.isToday && (
                      <span className="text-[10px] font-bold text-[#38BDF8] px-1.5 py-0.2 rounded bg-sky-950 border border-sky-800">
                        امروز
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {formatPersianDate(cell.dateIso)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cell.holiday && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full">
                    {cell.holiday.title}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onDayClick(cell.dateIso)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E2F47] rounded-lg transition-all"
                  title="ایجاد رویداد در این روز"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* لیست رویدادهای روز */}
            {cell.events.length > 0 ? (
              <div className="space-y-2">
                {cell.events.map((event) => {
                  const cfg = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.meeting;
                  const isMultiDay = event.startDate !== event.endDate;

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="p-3 rounded-xl border text-xs cursor-pointer transition-all hover:border-[#38BDF8] bg-[#090E17] border-[#1E2F47] space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: cfg.badgeBg,
                            color: cfg.badgeText,
                            borderColor: cfg.badgeBorder,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cfg.dotColor }}
                          />
                          {cfg.label}
                        </span>

                        {event.startTime && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Clock size={11} className="text-[#38BDF8]" />
                            <span>
                              {event.startTime} {event.endTime ? `تا ${event.endTime}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="font-bold text-white text-xs leading-relaxed">
                        {event.title}
                      </div>

                      {event.assignee && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-[#152336]">
                          <User size={12} className="text-[#10B981]" />
                          <span>مسئول: {event.assignee.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-2 text-center text-[11px] text-slate-600">
                هیچ رویدادی در این روز ثبت نشده است.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
