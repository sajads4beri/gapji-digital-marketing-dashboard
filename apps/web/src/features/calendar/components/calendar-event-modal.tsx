'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventInput,
  EquipmentReadinessStatus,
} from '../types';
import { EVENT_TYPE_CONFIG } from '../constants';
import { Modal } from '@/components/common/modal';
import { getTodayIsoDate } from '@/lib/persian-date';
import {
  Layers,
  Video,
  Users,
  CheckSquare,
  Clock,
  Calendar as CalendarIcon,
  Package,
} from 'lucide-react';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCalendarEventInput) => Promise<void>;
  initialDate?: string;
  editEvent?: CalendarEvent | null;
}

export function CalendarEventModal({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  editEvent,
}: CalendarEventModalProps) {
  const defaultDate = initialDate || getTodayIsoDate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('meeting');
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [hasEquipment, setHasEquipment] = useState(false);
  const [equipmentStatus, setEquipmentStatus] =
    useState<EquipmentReadinessStatus>('ready');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // همگام‌سازی وضعیت در صورت تغییر داده‌های اولیه
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description || '');
      setEventType(editEvent.eventType);
      setStartDate(editEvent.startDate.slice(0, 10));
      setEndDate(editEvent.endDate.slice(0, 10));
      setIsAllDay(editEvent.isAllDay);
      setStartTime(editEvent.startTime || '10:00');
      setEndTime(editEvent.endTime || '11:00');
      setHasEquipment(!!(editEvent.equipment && editEvent.equipment.length > 0));
      if (editEvent.equipment && editEvent.equipment[0]) {
        setEquipmentStatus(editEvent.equipment[0].status);
      }
    } else {
      setTitle('');
      setDescription('');
      setEventType('meeting');
      setStartDate(initialDate || getTodayIsoDate());
      setEndDate(initialDate || getTodayIsoDate());
      setIsAllDay(false);
      setStartTime('10:00');
      setEndTime('11:00');
      setHasEquipment(false);
      setEquipmentStatus('ready');
    }
    setError(null);
  }, [editEvent, initialDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('لطفاً عنوان رویداد را وارد نمایید.');
      return;
    }
    if (!startDate) {
      setError('لطفاً تاریخ شروع را تعیین کنید.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        eventType,
        startDate,
        endDate: eventType === 'campaign' ? endDate : startDate,
        isAllDay,
        startTime: !isAllDay ? startTime : undefined,
        endTime: !isAllDay ? endTime : undefined,
        equipmentStatus: hasEquipment ? equipmentStatus : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت رویداد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventTypes: CalendarEventType[] = ['campaign', 'webinar', 'meeting', 'task'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="text-base font-bold text-white" dir="rtl">
          {editEvent ? 'ویرایش رویداد تقویم' : 'ایجاد رویداد یا تسک جدید'}
        </span>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs" dir="rtl">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300">
            {error}
          </div>
        )}

        {/* انتخاب نوع رویداد */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-300">نوع رویداد:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {eventTypes.map((type) => {
              const cfg = EVENT_TYPE_CONFIG[type];
              const isSelected = eventType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setEventType(type);
                    if (type === 'campaign') {
                      setIsAllDay(true);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-transparent shadow-md'
                      : 'bg-[#090E17] border-[#1E2F47] text-slate-400 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isSelected ? cfg.badgeBg : undefined,
                    color: isSelected ? cfg.badgeText : undefined,
                    borderColor: isSelected ? cfg.badgeBorder : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full mb-1"
                    style={{ backgroundColor: cfg.dotColor }}
                  />
                  <span className="font-bold text-xs">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* عنوان رویداد */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-300">
            عنوان <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: جلسه هماهنگی کمپین یا وبینار فروش..."
            className="w-full px-3 py-2 rounded-xl bg-[#090E17] border border-[#1E2F47] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#38BDF8]"
            required
          />
        </div>

        {/* تاریخ شروع و پایان */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">
              تاریخ {eventType === 'campaign' ? 'شروع' : 'برگزاری'}{' '}
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (eventType !== 'campaign') setEndDate(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#090E17] border border-[#1E2F47] text-white text-xs focus:outline-none focus:border-[#38BDF8]"
              required
            />
          </div>

          {eventType === 'campaign' && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">
                تاریخ پایان کمپین <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 rounded-xl bg-[#090E17] border border-[#1E2F47] text-white text-xs focus:outline-none focus:border-[#38BDF8]"
                required
              />
            </div>
          )}
        </div>

        {/* تنظیمات ساعت رویداد */}
        {eventType !== 'campaign' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDayCheckbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded bg-[#090E17] border-[#1E2F47] text-[#38BDF8] focus:ring-0"
              />
              <label htmlFor="allDayCheckbox" className="text-slate-300 cursor-pointer">
                رویداد تمام روز است
              </label>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">ساعت شروع:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#090E17] border border-[#1E2F47] text-white text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">ساعت پایان:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#090E17] border border-[#1E2F47] text-white text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* تجهیزات (برای وبینار یا رویداد) */}
        {(eventType === 'webinar' || eventType === 'campaign') && (
          <div className="space-y-2 pt-1 border-t border-[#1E2F47]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="equipmentCheckbox"
                checked={hasEquipment}
                onChange={(e) => setHasEquipment(e.target.checked)}
                className="rounded bg-[#090E17] border-[#1E2F47] text-[#38BDF8] focus:ring-0"
              />
              <label htmlFor="equipmentCheckbox" className="text-slate-300 cursor-pointer font-bold flex items-center gap-1.5">
                <Package size={14} className="text-[#38BDF8]" />
                <span>نیازمند بررسی تجهیزات و ابزارهاست</span>
              </label>
            </div>

            {hasEquipment && (
              <div className="p-3 rounded-xl bg-[#090E17] border border-[#1E2F47] space-y-1.5">
                <label className="text-slate-400 text-[11px]">وضعیت آمادگی تجهیزات:</label>
                <select
                  value={equipmentStatus}
                  onChange={(e) => setEquipmentStatus(e.target.value as EquipmentReadinessStatus)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#111A28] border border-[#1E2F47] text-white text-xs focus:outline-none"
                >
                  <option value="ready">آماده و تست‌شده</option>
                  <option value="incomplete">ناقص / نیازمند بررسی</option>
                  <option value="not_procured">تهیه‌نشده</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* توضیحات */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-300">توضیحات تکمیلی (اختیاری):</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="یادداشت‌ها، لینک جلسه یا جزئیات پیگیری..."
            className="w-full px-3 py-2 rounded-xl bg-[#090E17] border border-[#1E2F47] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#38BDF8] resize-none"
          />
        </div>

        {/* دکمه‌های فرم */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E2F47]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#152336] hover:bg-[#1E324F] text-slate-300 text-xs font-bold transition-all"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-[#06090F] text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'در حال ثبت...' : editEvent ? 'ذخیره تغییرات' : 'ثبت رویداد'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
