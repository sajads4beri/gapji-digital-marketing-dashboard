'use client';

import React from 'react';
import { CalendarDayCell, CalendarEvent } from '../types';
import { EVENT_TYPE_CONFIG } from '../constants';
import { PERSIAN_WEEKDAY_NAMES } from '@/lib/persian-date';
import { Plus, Clock, User, Package, Calendar } from 'lucide-react';

interface CalendarWeekViewProps {
  dayCells: CalendarDayCell[]; // Exactly 7 cells (Saturday to Friday)
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (dateIso: string) => void;
  onEventReschedule: (eventId: string, newDateIso: string) => void;
}

export function CalendarWeekView({
  dayCells,
  onEventClick,
  onDayClick,
  onEventReschedule,
}: CalendarWeekViewProps) {
  const [dragOverDate, setDragOverDate] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateIso: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateIso) setDragOverDate(dateIso);
  };

  const handleDrop = (e: React.DragEvent, dateIso: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const eventId = e.dataTransfer.getData('text/plain');
    if (eventId) {
      onEventReschedule(eventId, dateIso);
    }
  };

  return (
    <div
      className="bg-[#0C1422] border border-[#19273D] rounded-2xl overflow-hidden shadow-2xl"
      dir="rtl"
    >
      {/* سرستون ۷ روز هفته */}
      <div className="grid grid-cols-7 border-b border-[#19273D] bg-[#090E17]">
        {dayCells.map((cell, idx) => {
          const isFriday = idx === 6;
          const weekdayName = PERSIAN_WEEKDAY_NAMES[idx] || '';

          return (
            <div
              key={cell.dateIso}
              className={`p-3 text-center border-r border-[#19273D] first:border-r-0 select-none ${
                isFriday
                  ? 'bg-rose-950/15 text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              <div className="text-xs font-bold">{weekdayName}</div>
              <div
                className={`mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                  cell.isToday
                    ? 'bg-[#38BDF8] text-[#06090F] shadow-md'
                    : isFriday
                    ? 'text-rose-400 font-extrabold'
                    : 'text-white'
                }`}
              >
                {cell.jalaliDay.toLocaleString('fa-IR')}
              </div>
              {cell.holiday && (
                <div className="text-[10px] font-bold text-rose-400 truncate mt-0.5" title={cell.holiday.title}>
                  {cell.holiday.title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* محتوای ۷ ستون روزهای هفته */}
      <div className="grid grid-cols-7 min-h-[480px] divide-x divide-[#152336] rtl:divide-x-reverse bg-[#0C1422]">
        {dayCells.map((cell) => {
          const isFriday = cell.dayOfWeek === 6;
          const isDragTarget = dragOverDate === cell.dateIso;

          return (
            <div
              key={cell.dateIso}
              onClick={() => onDayClick(cell.dateIso)}
              onDragOver={(e) => handleDragOver(e, cell.dateIso)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => handleDrop(e, cell.dateIso)}
              className={`p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                isFriday ? 'bg-rose-950/5' : 'hover:bg-[#111D30]/40'
              } ${cell.isToday ? 'bg-sky-950/10' : ''} ${
                isDragTarget ? 'bg-[#152945] ring-2 ring-[#38BDF8] ring-inset' : ''
              }`}
            >
              <div className="space-y-2 flex-1">
                {cell.events.map((event) => {
                  const cfg = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.meeting;
                  const isMultiDay = event.startDate !== event.endDate;

                  return (
                    <div
                      key={event.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, event.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="p-2 rounded-xl border text-xs cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-md space-y-1.5"
                      style={{
                        background: isMultiDay ? cfg.barBg : cfg.badgeBg,
                        borderColor: cfg.badgeBorder,
                        color: '#F8FAFC',
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            color: cfg.badgeText,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cfg.dotColor }}
                          />
                          {cfg.label}
                        </span>

                        {event.startTime && (
                          <span className="text-[10px] font-mono text-slate-300">
                            {event.startTime}
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-white text-[11px] leading-snug line-clamp-2">
                        {event.title}
                      </div>

                      {event.assignee && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                          <User size={10} />
                          <span className="truncate">{event.assignee.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {cell.events.length === 0 && (
                  <div className="h-full min-h-[140px] flex items-center justify-center text-slate-600 text-[11px] select-none opacity-40">
                    بدون رویداد
                  </div>
                )}
              </div>

              {/* دکمه افزودن رویداد در پایین ستون روز */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDayClick(cell.dateIso);
                }}
                className="mt-2 w-full py-1.5 text-center text-[11px] font-bold text-slate-400 hover:text-white hover:bg-[#152336] rounded-lg transition-all border border-dashed border-[#1E2F47] flex items-center justify-center gap-1"
              >
                <Plus size={12} />
                <span>ثبت در این روز</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
