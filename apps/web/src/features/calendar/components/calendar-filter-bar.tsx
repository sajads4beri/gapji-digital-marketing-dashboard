'use client';

import React from 'react';
import { CalendarEventType, CalendarEvent } from '../types';
import { EVENT_TYPE_CONFIG } from '../constants';

interface CalendarFilterBarProps {
  selectedTypes: CalendarEventType[];
  onToggleType: (type: CalendarEventType) => void;
  onSelectAll: () => void;
  events: CalendarEvent[];
}

export function CalendarFilterBar({
  selectedTypes,
  onToggleType,
  onSelectAll,
  events,
}: CalendarFilterBarProps) {
  const isAllSelected = selectedTypes.length === 0;

  // شمارش تعداد رویدادها به تفکیک نوع
  const counts: Record<CalendarEventType, number> = {
    campaign: 0,
    webinar: 0,
    meeting: 0,
    task: 0,
  };

  events.forEach((e) => {
    if (counts[e.eventType] !== undefined) {
      counts[e.eventType]++;
    }
  });

  const eventTypes: CalendarEventType[] = ['campaign', 'webinar', 'meeting', 'task'];

  return (
    <div
      className="flex items-center justify-between flex-wrap gap-3 p-3 px-4 rounded-xl bg-[#090E17]/80 border border-[#19273D]"
      dir="rtl"
    >
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <span>راهنمای رنگ و فیلتر:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* دکمه انتخاب همه */}
        <button
          type="button"
          onClick={onSelectAll}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
            isAllSelected
              ? 'bg-[#1E293B] border-[#38BDF8] text-white shadow-sm'
              : 'bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>همه رویدادها</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {events.length.toLocaleString('fa-IR')}
          </span>
        </button>

        {/* فیلترهای چهارگانه نوع رویداد */}
        {eventTypes.map((type) => {
          const cfg = EVENT_TYPE_CONFIG[type];
          const isSelected = selectedTypes.includes(type);
          const count = counts[type] || 0;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggleType(type)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                isSelected
                  ? 'border-transparent shadow-sm'
                  : 'bg-[#0F172A] border-[#1E293B] text-slate-400 hover:text-slate-200 opacity-70'
              }`}
              style={{
                backgroundColor: isSelected ? cfg.badgeBg : undefined,
                color: isSelected ? cfg.badgeText : undefined,
                borderColor: isSelected ? cfg.badgeBorder : undefined,
              }}
              title={cfg.description}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cfg.dotColor }}
              />
              <span>{cfg.label}</span>
              <span
                className="text-[11px] px-1.5 py-0.2 rounded-full"
                style={{
                  backgroundColor: isSelected ? 'rgba(0,0,0,0.3)' : '#1E293B',
                  color: isSelected ? cfg.badgeText : '#94A3B8',
                }}
              >
                {count.toLocaleString('fa-IR')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
