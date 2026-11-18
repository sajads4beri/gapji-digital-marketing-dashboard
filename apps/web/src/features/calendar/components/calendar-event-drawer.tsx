'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarEvent,
  CalendarEventType,
} from '../types';
import { EVENT_TYPE_CONFIG, EQUIPMENT_STATUS_CONFIG } from '../constants';
import { Drawer } from '@/components/common/drawer';
import { ConfirmModal } from '@/components/common/confirm-modal';
import { formatPersianDate } from '@/lib/persian-date';
import {
  Clock,
  Calendar as CalendarIcon,
  User,
  ExternalLink,
  Package,
  Trash2,
  Edit3,
  Layers,
  Video,
  Users,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';

interface CalendarEventDrawerProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => Promise<void>;
}

export function CalendarEventDrawer({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: CalendarEventDrawerProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const cfg = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.meeting;

  const getEventIcon = (type: CalendarEventType) => {
    switch (type) {
      case 'campaign':
        return <Layers size={18} className="text-[#10B981]" />;
      case 'webinar':
        return <Video size={18} className="text-[#38BDF8]" />;
      case 'meeting':
        return <Users size={18} className="text-[#F59E0B]" />;
      case 'task':
        return <CheckSquare size={18} className="text-[#F43F5E]" />;
      default:
        return <CalendarIcon size={18} className="text-slate-400" />;
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(event.id);
      setIsDeleteModalOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const isMultiDay = event.startDate !== event.endDate;

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2.5" dir="rtl">
            {getEventIcon(event.eventType)}
            <span className="text-base font-bold text-white truncate max-w-[280px]">
              جزئیات {cfg.label}
            </span>
          </div>
        }
        size="lg"
        placement="right"
      >
        <div className="space-y-6 text-sm text-slate-200" dir="rtl">
          {/* عنوان و برچسب نوع رویداد */}
          <div className="space-y-2 pb-4 border-b border-[#1E2F47]">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
                style={{
                  backgroundColor: cfg.badgeBg,
                  color: cfg.badgeText,
                  borderColor: cfg.badgeBorder,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cfg.dotColor }}
                />
                {cfg.label}
              </span>

              {event.isAllDay && (
                <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 border border-slate-700">
                  تمام روز
                </span>
              )}
            </div>

            <h3 className="text-lg font-extrabold text-white leading-relaxed">
              {event.title}
            </h3>

            {event.description && (
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                {event.description}
              </p>
            )}
          </div>

          {/* اطلاعات زمان‌بندی رویداد */}
          <div className="bg-[#090E17] p-4 rounded-xl border border-[#1E2F47] space-y-3">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Clock size={14} className="text-[#38BDF8]" />
              <span>زمان‌بندی و موعد</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">تاریخ شروع:</span>
                <span className="font-bold text-white">
                  {formatPersianDate(event.startDate)}
                </span>
              </div>

              {isMultiDay && (
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500">تاریخ پایان:</span>
                  <span className="font-bold text-white">
                    {formatPersianDate(event.endDate)}
                  </span>
                </div>
              )}

              {event.startTime && (
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500">ساعت برگزاری:</span>
                  <span className="font-bold text-white font-mono">
                    {event.startTime} {event.endTime ? `الی ${event.endTime}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* مسئول یا مجری رویداد */}
          {event.assignee && (
            <div className="bg-[#090E17] p-4 rounded-xl border border-[#1E2F47] space-y-2">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-[#10B981]" />
                <span>مسئول رویداد</span>
              </h4>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-9 h-9 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center text-xs font-bold text-slate-200">
                  {event.assignee.name.slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-white text-xs">
                    {event.assignee.name}
                  </div>
                  {event.assignee.role && (
                    <div className="text-[11px] text-slate-500">
                      {event.assignee.role}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* لینک به موجودیت مرتبط (کمپین، تسک، وبینار) */}
          {event.relatedEntity && (
            <div className="bg-[#090E17] p-4 rounded-xl border border-[#1E2F47] space-y-2">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <ExternalLink size={14} className="text-[#F59E0B]" />
                <span>موجودیت مرتبط در سامانه</span>
              </h4>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-white font-medium truncate">
                  {event.relatedEntity.title}
                </span>

                <Link
                  href={event.relatedEntity.url}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#152336] hover:bg-[#1E324F] border border-[#294066] text-[#38BDF8] text-xs font-bold transition-all shrink-0"
                >
                  <span>مشاهده پرونده</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* وضعیت تجهیزات (اگر دارد) طبق ص ۱۹ §۲۰ سند نیازمندی‌ها */}
          {event.equipment && event.equipment.length > 0 && (
            <div className="bg-[#090E17] p-4 rounded-xl border border-[#1E2F47] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Package size={14} className="text-[#38BDF8]" />
                  <span>وضعیت تجهیزات و ابزارها</span>
                </h4>

                <span className="text-[11px] text-slate-500">
                  {event.equipment.length.toLocaleString('fa-IR')} قلم
                </span>
              </div>

              <div className="space-y-2">
                {event.equipment.map((eq, idx) => {
                  const eqCfg = EQUIPMENT_STATUS_CONFIG[eq.status];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#111A28] border border-[#1E2F47] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-medium">
                          {eq.name}
                        </span>
                        {eq.quantity && eq.quantity > 1 && (
                          <span className="text-[10px] text-slate-500">
                            ({eq.quantity} عدد)
                          </span>
                        )}
                      </div>

                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold border"
                        style={{
                          backgroundColor: eqCfg.badgeBg,
                          color: eqCfg.badgeText,
                          borderColor: eqCfg.badgeBorder,
                        }}
                      >
                        {eq.statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* دکمه‌های اقدام: ویرایش و حذف */}
          <div className="pt-4 border-t border-[#1E2F47] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-all text-xs font-bold"
            >
              <Trash2 size={15} />
              <span>حذف رویداد</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-white transition-all text-xs font-bold"
              >
                <Edit3 size={15} />
                <span>ویرایش اطلاعات</span>
              </button>
            )}
          </div>
        </div>
      </Drawer>

      {/* مودال تأیید حذف */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="حذف رویداد از تقویم"
        message={`آیا از حذف رویداد «${event.title}» از تقویم بازاریابی اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
        confirmText="تأیید و حذف رویداد"
        cancelText="انصراف"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
