'use client';

import React, { useState } from 'react';
import { CalendarDayCell, CalendarEvent, CalendarEventType } from '../types';
import { EVENT_TYPE_CONFIG } from '../constants';
import { PERSIAN_WEEKDAY_NAMES } from '@/lib/persian-date';
import { Plus, Clock, AlertCircle } from 'lucide-react';

interface CalendarMonthViewProps {
  dayCells: CalendarDayCell[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (dateIso: string) => void;
  onEventReschedule: (eventId: string, newDateIso: string) => void;
}

export function CalendarMonthView({
  dayCells,
  onEventClick,
  onDayClick,
  onEventReschedule,
}: CalendarMonthViewProps) {
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.stopPropagation();
    setDraggedEventId(eventId);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateIso: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateIso) {
      setDragOverDate(dateIso);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dateIso: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (eventId) {
      onEventReschedule(eventId, dateIso);
    }
    setDraggedEventId(null);
  };

  return (
    <div
      className="bg-[#0C1422] border border-[#19273D] rounded-2xl overflow-hidden shadow-2xl"
      dir="rtl"
    >
      {/* سرستون‌های ایام هفته (شروع از شنبه تا جمعه) */}
      <div className="grid grid-cols-7 border-b border-[#19273D] bg-[#090E17]">
        {PERSIAN_WEEKDAY_NAMES.map((name, idx) => {
          const isFriday = idx === 6;
          return (
            <div
              key={name}
              className={`py-3 px-2 text-center text-xs font-bold select-none ${
                isFriday
                  ? 'text-rose-400 bg-rose-950/10 border-r border-rose-900/20'
                  : 'text-slate-300'
              }`}
            >
              <span>{name}</span>
              {isFriday && (
                <span className="block text-[10px] font-normal text-rose-400/70 mt-0.5">
                  تعطیل
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* شبکه روزهای ماه (Grid Cells) */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#152336] rtl:divide-x-reverse bg-[#0C1422]">
        {dayCells.map((cell) => {
          const isFriday = cell.dayOfWeek === 6;
          const isDragTarget = dragOverDate === cell.dateIso;
          const maxVisibleEvents = 3;
          const visibleEvents = cell.events.slice(0, maxVisibleEvents);
          const hiddenCount = Math.max(0, cell.events.length - maxVisibleEvents);

          return (
            <div
              key={cell.dateIso}
              onClick={() => onDayClick(cell.dateIso)}
              onDragOver={(e) => handleDragOver(e, cell.dateIso)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, cell.dateIso)}
              className={`min-h-[115px] sm:min-h-[135px] p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                !cell.isCurrentMonth
                  ? 'bg-[#080D16]/70 opacity-40'
                  : isFriday
                  ? 'bg-rose-950/5 hover:bg-rose-950/15'
                  : 'hover:bg-[#111D30]/60'
              } ${cell.isToday ? 'ring-1 ring-[#38BDF8] ring-inset bg-sky-950/10' : ''} ${
                isDragTarget ? 'bg-[#152945] ring-2 ring-[#38BDF8] ring-inset' : ''
              }`}
            >
              {/* هدر خانه: شماره روز، مناسبت، و دکمه افزودن */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      cell.isToday
                        ? 'bg-[#38BDF8] text-[#06090F] shadow-md'
                        : isFriday
                        ? 'text-rose-400 font-extrabold'
                        : 'text-slate-300'
                    }`}
                  >
                    {cell.jalaliDay.toLocaleString('fa-IR')}
                  </span>

                  {cell.isToday && (
                    <span className="hidden sm:inline-block text-[10px] font-bold text-[#38BDF8] px-1 rounded bg-[#38BDF8]/10">
                      امروز
                    </span>
                  )}
                </div>

                {/* نشان مناسبت یا تعطیلی رسمی */}
                {cell.holiday && (
                  <span
                    className="truncate max-w-[85px] sm:max-w-[120px] text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.2 rounded"
                    title={cell.holiday.title}
                  >
                    {cell.holiday.title}
                  </span>
                )}

                {/* دکمه پنهان افزودن که با هاور ظاهر می‌شود */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDayClick(cell.dateIso);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white hover:bg-[#1C2C42] rounded transition-all"
                  title="ایجاد رویداد در این روز"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* لیست رویدادهای روز (Events Stack) */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {visibleEvents.map((event) => {
                  const cfg = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.meeting;
                  const isMultiDay = event.startDate !== event.endDate;
                  const isStartDay = event.startDate.slice(0, 10) === cell.dateIso;
                  const isEndDay = event.endDate.slice(0, 10) === cell.dateIso;

                  return (
                    <div
                      key={event.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, event.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`text-[11px] p-1 px-1.5 rounded-md font-bold transition-all truncate cursor-grab active:cursor-grabbing border ${
                        isMultiDay
                          ? 'shadow-sm text-slate-100 hover:brightness-110'
                          : 'hover:bg-[#1C2C42]'
                      }`}
                      style={{
                        background: isMultiDay ? cfg.barBg : cfg.badgeBg,
                        color: isMultiDay ? '#FFFFFF' : cfg.badgeText,
                        borderColor: cfg.badgeBorder,
                      }}
                      title={`${cfg.label}: ${event.title} (${
                        event.startTime ? event.startTime : isMultiDay ? 'چندروزه' : 'تمام روز'
                      })`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cfg.dotColor }}
                        />

                        {event.startTime && !isMultiDay && (
                          <span className="text-[10px] opacity-80 font-mono shrink-0">
                            {event.startTime}
                          </span>
                        )}

                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  );
                })}

                {/* شمارنده رویدادهای اضافه */}
                {hiddenCount > 0 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(cell.dateIso);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-[#38BDF8] pt-0.5 text-center transition-colors"
                  >
                    +{hiddenCount.toLocaleString('fa-IR')} مورد دیگر
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
