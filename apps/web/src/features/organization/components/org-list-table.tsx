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
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => a.order - b.order);
  }, [items]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    const sourceId = draggedId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const currentIds = sortedItems.map((i) => i.id);
    const sourceIndex = currentIds.indexOf(sourceId);
    const targetIndex = currentIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newIds = [...currentIds];
    const [movedId] = newIds.splice(sourceIndex, 1);
    newIds.splice(targetIndex, 0, movedId);

    await onReorder?.(newIds);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedItems.length) return;

    const currentIds = sortedItems.map((i) => i.id);
    const [moved] = currentIds.splice(index, 1);
    currentIds.splice(targetIndex, 0, moved);
    await onReorder?.(currentIds);
  };

  if (isLoading) {
    return (
      <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-4 space-y-3 shadow-lg" dir="rtl">
        <div className="h-10 bg-[#18263A] rounded-xl animate-pulse" />
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="h-14 bg-[#18263A]/60 border border-[#1F2E45]/40 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#D66B73]/15 border border-[#D66B73]/30 rounded-2xl p-6 text-center space-y-3" dir="rtl">
        <AlertCircle size={32} className="mx-auto text-[#D66B73]" />
        <h4 className="text-sm font-bold text-slate-100 font-display">خطا در بارگذاری فهرست</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2 text-xs border-[#D66B73]/30 text-[#D66B73] hover:bg-[#D66B73]/10"
          >
            <RefreshCw size={14} className="me-1.5" />
            تلاش مجدد
          </Button>
        )}
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-8 shadow-lg" dir="rtl">
        <EmptyState
          title={`هیچ گزینه‌ای در ${ORG_LIST_TITLES[listType]} ثبت نشده است`}
          description="با کلیک روی دکمه زیر می‌توانید اولین گزینه را به این فهرست اضافه فرمایید."
          action={
            onAddNew ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onAddNew}
                className="text-xs bg-gradient-to-r from-[#719BDF] to-[#3B82F6] text-white border-0"
              >
                <Plus size={14} className="me-1.5" />
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
    <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] shadow-xl overflow-hidden text-slate-100" dir="rtl">
      {/* سربرگ نوار اقدامات جدول */}
      <div className="p-4 border-b border-[#1F2E45] bg-[#0E1726]/90 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-100 font-display">
            {ORG_LIST_TITLES[listType]}
          </span>
          <span className="text-[11px] font-mono font-bold text-[#719BDF] bg-[#719BDF]/15 border border-[#719BDF]/30 px-2 py-0.5 rounded-full tabular-nums">
            {sortedItems.length.toLocaleString('fa-IR')} گزینه
          </span>
        </div>

        {onAddNew && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAddNew}
            className="text-xs bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5e8bd8] hover:to-[#2563eb] text-white border-0 shadow-[0_0_15px_rgba(113,155,223,0.25)]"
          >
            <Plus size={14} className="me-1.5" />
            افزودن گزینه جدید
          </Button>
        )}
      </div>

      {/* راهنمای Drag & Drop */}
      <div className="bg-[#18263A]/70 px-4 py-2 text-[11px] text-slate-400 border-b border-[#1F2E45] flex items-center gap-1.5">
        <GripVertical size={13} className="text-[#719BDF] shrink-0" />
        <span>برای تغییر ترتیب نمایش گزینه‌ها در فرم‌ها و جداول، ردیف‌ها را با ماوس بکشید یا از دکمه‌های جهت استفاده فرمایید.</span>
      </div>

      {/* ردیف‌های جدول */}
      <div className="divide-y divide-[#1F2E45]/60">
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
                  ? 'opacity-40 bg-[#18263A]'
                  : isOver
                  ? 'bg-[#18263A]/80 border-t-2 border-[#719BDF]'
                  : 'hover:bg-[#18263A]/50'
              } ${!item.isActive ? 'bg-[#0B1423]/40' : ''}`}
            >
              {/* بخش راست: دستگیره درگ، شماره و نام گزینه */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                {/* دستگیره درگ و کنترل جابه‌جایی */}
                <div className="flex items-center gap-0.5 text-slate-500 shrink-0">
                  <span
                    className="cursor-grab active:cursor-grabbing p-1 hover:text-slate-200 rounded transition-colors"
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
                      className="p-0.5 text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="انتقال به بالا"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sortedItems.length - 1}
                      className="p-0.5 text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="انتقال به پایین"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                </div>

                {/* شماره ترتیب */}
                <span className="text-[11px] font-mono text-slate-500 w-5 shrink-0 text-center tabular-nums">
                  #{item.order}
                </span>

                {/* نام و کلید سیستمی */}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-bold truncate ${
                        item.isActive ? 'text-slate-100' : 'text-slate-500 line-through'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* بج گروه برای وضعیت‌های لید */}
                    {leadStatusItem?.group && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          leadStatusItem.group === 'open'
                            ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                            : leadStatusItem.group === 'won'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#D66B73]/15 text-[#D66B73] border-[#D66B73]/30'
                        }`}
                      >
                        گروه: {LEAD_STATUS_GROUP_LABELS[leadStatusItem.group]}
                      </span>
                    )}

                    {item.isSystem && (
                      <span className="text-[10px] font-medium text-slate-400 bg-[#18263A] border border-[#1F2E45] px-1.5 py-0.2 rounded">
                        سیستمی
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Tag size={11} className="text-slate-500" />
                    <span className="truncate">{item.key}</span>
                  </div>
                </div>
              </div>

              {/* بخش چپ: وضعیت، تعداد استفاده و دکمه‌های عملیات */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* وضعیت فعال / غیرفعال */}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    item.isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#18263A] text-slate-400 border-[#1F2E45]'
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
                  <span className="text-xs font-black text-slate-200 tabular-nums">
                    {usage.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[10px] text-slate-400 ms-1">استفاده</span>
                </div>

                {/* دکمه‌های ویرایش و تغییر وضعیت */}
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-[#719BDF] hover:bg-[#18263A] rounded-xl"
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
                      className={`h-8 w-8 p-0 rounded-xl ${
                        item.isActive
                          ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/15'
                          : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15'
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
