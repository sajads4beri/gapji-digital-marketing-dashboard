'use client';

import * as React from 'react';
import {
  GripVertical,
  Edit3,
  Power,
  Plus,
  AlertCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Tag,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import type {
  OrgListType,
  OrgListItem,
  OrgLeadStatusItem,
  LeadStatusGroup,
} from '../types';
import { ORG_LIST_TITLES, LEAD_STATUS_GROUP_LABELS } from '../types';

export interface OrgListTableProps {
  listType: OrgListType;
  items: OrgListItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddNew?: () => void;
  onEdit?: (item: OrgListItem) => void;
  onToggleStatus?: (item: OrgListItem) => void;
  onReorder?: (orderedIds: string[]) => Promise<void> | void;
}

export function OrgListTable({
  listType,
  items,
  isLoading = false,
  error = null,
  onRetry,
  onAddNew,
  onEdit,
  onToggleStatus,
  onReorder,
}: OrgListTableProps) {
  // State برای Drag & Drop
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  // سورت شده بر اساس order
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => a.order - b.order);
  }, [items]);

  // کنترل Drag & Drop بومی HTML5
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentIds = sortedItems.map((i) => i.id);
    const fromIndex = currentIds.indexOf(draggedId);
    const toIndex = currentIds.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const reordered = [...currentIds];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      await onReorder?.(reordered);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // مرتب‌سازی دسترسی‌پذیر با دکمه‌های بالا / پایین (مخصوص موبایل و کیبورد)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedItems.length) return;

    const currentIds = sortedItems.map((i) => i.id);
    const [moved] = currentIds.splice(index, 1);
    currentIds.splice(targetIndex, 0, moved);
    await onReorder?.(currentIds);
  };

  // وضعیت بارگذاری (Loading Skeleton)
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3" dir="rtl">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="h-14 bg-slate-50/70 border border-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  // وضعیت خطا (Error State)
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3" dir="rtl">
        <AlertCircle size={32} className="mx-auto text-rose-600" />
        <h4 className="text-sm font-bold text-rose-900">خطا در بارگذاری فهرست</h4>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 text-xs">
            <RefreshCw size={14} className="ml-1.5" />
            تلاش مجدد
          </Button>
        )}
      </div>
    );
  }

  // وضعیت بدون داده (Empty State)
  if (sortedItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8" dir="rtl">
        <EmptyState
          title={`هیچ گزینه‌ای در ${ORG_LIST_TITLES[listType]} ثبت نشده است`}
          description="با کلیک روی دکمه زیر می‌توانید اولین گزینه را به این فهرست اضافه فرمایید."
          action={
            onAddNew ? (
              <Button variant="primary" size="sm" onClick={onAddNew} className="text-xs">
                <Plus size={14} className="ml-1.5" />
                افزودن گزینه جدید
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const isLeadStatusList = listType === 'lead_statuses';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden" dir="rtl">
      {/* سربرگ نوار اقدامات جدول */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-900">
            {ORG_LIST_TITLES[listType]}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {sortedItems.length.toLocaleString('fa-IR')} گزینه
          </span>
        </div>

        {onAddNew && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAddNew}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus size={14} className="ml-1.5" />
            افزودن گزینه جدید
          </Button>
        )}
      </div>

      {/* راهنمای Drag & Drop */}
      <div className="bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 flex items-center gap-1.5">
        <GripVertical size={13} className="text-slate-400 shrink-0" />
        <span>برای تغییر ترتیب نمایش گزینه‌ها در فرم‌ها و جداول، ردیف‌ها را با ماوس بکشید یا از دکمه‌های جهت استفاده فرمایید.</span>
      </div>

      {/* ردیف‌های جدول */}
      <div className="divide-y divide-slate-100">
        {sortedItems.map((item, index) => {
          const isDragging = draggedId === item.id;
          const isOver = dragOverId === item.id;
          const leadStatusItem = isLeadStatusList ? (item as OrgLeadStatusItem) : null;
          const usage = item.usageCount ?? 0;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 transition-colors ${
                isDragging
                  ? 'opacity-40 bg-purple-50/40'
                  : isOver
                  ? 'bg-purple-50/80 border-t-2 border-purple-500'
                  : 'hover:bg-slate-50/60'
              } ${!item.isActive ? 'bg-slate-50/40' : ''}`}
            >
              {/* بخش راست: دستگیره درگ، شماره و نام گزینه */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                {/* دستگیره درگ و کنترل جابه‌جایی */}
                <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
                  <span
                    className="cursor-grab active:cursor-grabbing p-1 hover:text-slate-700 rounded transition-colors"
                    title="برای جابه‌جایی بکشید"
                  >
                    <GripVertical size={16} />
                  </span>

                  {/* دکمه‌های جهت برای موبایل و کیبورد */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="انتقال به بالا"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sortedItems.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="انتقال به پایین"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                </div>

                {/* شماره ترتیب */}
                <span className="text-[11px] font-mono text-slate-400 w-5 shrink-0 text-center">
                  #{item.order}
                </span>

                {/* نام و کلید سیستمی */}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-bold truncate ${
                        item.isActive ? 'text-slate-900' : 'text-slate-400 line-through'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* بج گروه برای وضعیت‌های لید */}
                    {leadStatusItem?.group && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          leadStatusItem.group === 'open'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : leadStatusItem.group === 'won'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        گروه: {LEAD_STATUS_GROUP_LABELS[leadStatusItem.group]}
                      </span>
                    )}

                    {item.isSystem && (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        سیستمی
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Tag size={11} />
                    <span className="truncate">{item.key}</span>
                  </div>
                </div>
              </div>

              {/* بخش چپ: وضعیت، تعداد استفاده و دکمه‌های عملیات */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* وضعیت فعال / غیرفعال */}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {item.isActive ? (
                    <>
                      <CheckCircle2 size={11} />
                      <span>فعال</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={11} />
                      <span>غیرفعال</span>
                    </>
                  )}
                </span>

                {/* تعداد استفاده */}
                <div
                  className="text-left min-w-[70px] hidden sm:block"
                  title="تعداد دفعات استفاده‌شده در داده‌های سامانه"
                >
                  <span className="text-xs font-extrabold text-slate-700">
                    {usage.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[10px] text-slate-400 mr-1">استفاده</span>
                </div>

                {/* دکمه‌های ویرایش و تغییر وضعیت */}
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                      title="ویرایش مشخصات"
                    >
                      <Edit3 size={14} />
                    </Button>
                  )}

                  {onToggleStatus && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(item)}
                      className={`h-8 w-8 p-0 ${
                        item.isActive
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={item.isActive ? 'غیرفعال‌سازی گزینه' : 'فعال‌سازی مجدد گزینه'}
                    >
                      <Power size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
