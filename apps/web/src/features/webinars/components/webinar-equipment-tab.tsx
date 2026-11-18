'use client';

import React, { useState, useEffect } from 'react';
import { WebinarDetail, WebinarEquipmentItem, EquipmentReadinessStatus } from '../types';
import { webinarsApi } from '../webinars.api';
import { api } from '@/lib/api';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  X,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WebinarEquipmentTabProps {
  webinar: WebinarDetail;
  onRefresh: () => void;
}

export function WebinarEquipmentTab({ webinar, onRefresh }: WebinarEquipmentTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const renderStatusBadge = (status: EquipmentReadinessStatus) => {
    switch (status) {
      case 'ready':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 me-1" />
            آماده
          </Badge>
        );
      case 'incomplete':
        return (
          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
            <AlertTriangle className="w-3 h-3 me-1" />
            نقص جزئی
          </Badge>
        );
      case 'not_procured':
      default:
        return (
          <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/20">
            <XCircle className="w-3 h-3 me-1" />
            تهیه‌نشده
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">کل تجهیزات متصل</span>
            <Wrench className="w-4 h-4 text-[#719BDF]" />
          </div>
          <div className="text-xl font-bold tabular-nums text-white">
            {webinar.equipmentSummary.total.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">قلم تجهیزاتی</div>
        </div>

        <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">آماده (Ready)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold tabular-nums text-emerald-400">
            {webinar.equipmentSummary.ready.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">تاییدشده برای اجرا</div>
        </div>

        <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">دارای کسری / نقص</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold tabular-nums text-amber-300">
            {webinar.equipmentSummary.incomplete.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">نیازمند بازبینی</div>
        </div>

        <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">تهیه‌نشده</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold tabular-nums text-rose-400">
            {webinar.equipmentSummary.notProcured.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">اقدام فوری قبل از وبینار</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div>
          <h3 className="text-sm font-bold text-white">چک‌لیست تجهیزات فنی رویداد</h3>
          <p className="text-xs text-slate-400 mt-0.5">اتصال مستقیم به ماژول مدیریت تجهیزات (ص ۱۸)</p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
        >
          <Plus className="w-4 h-4 me-1.5" />
          افزودن تجهیز به رویداد
        </Button>
      </div>

      {/* Equipment Table */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 overflow-hidden">
        {webinar.equipments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            هیچ تجهیزی به این وبینار متصل نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0B1423]/60 border-b border-[#1F2E45] text-slate-400 font-medium">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">نام و دسته‌بندی تجهیز</th>
                  <th className="py-3.5 px-4 text-center font-semibold">وضعیت آمادگی</th>
                  <th className="py-3.5 px-4 font-semibold">مسئول پیگیری</th>
                  <th className="py-3.5 px-4 font-semibold">مهلت آماده‌سازی</th>
                  <th className="py-3.5 px-4 font-semibold">یادداشت و کسری‌ها</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
                {webinar.equipments.map((eq) => {
                  const dueDateStr = eq.dueDate
                    ? new Date(eq.dueDate).toLocaleDateString('fa-IR')
                    : '-';

                  return (
                    <tr key={eq.id} className="hover:bg-[#18263A]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">{eq.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">دسته: {eq.category}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">{renderStatusBadge(eq.status)}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {eq.responsibleName ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {eq.responsibleName}
                          </span>
                        ) : (
                          <span className="text-slate-500">نامشخص</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {dueDateStr}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                        {eq.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Equipment Modal */}
      {isAddModalOpen && (
        <AddWebinarEquipmentModal
          webinarId={webinar.id}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

// Subcomponent: Add Equipment Modal
function AddWebinarEquipmentModal({
  webinarId,
  isOpen,
  onClose,
  onSuccess,
}: {
  webinarId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [equipmentItems, setEquipmentItems] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api
        .get('/equipment/items')
        .then((res) => {
          if (Array.isArray(res.data)) setEquipmentItems(res.data);
          else if (res.data?.items) setEquipmentItems(res.data.items);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setError('لطفاً تجهیز مورد نظر را انتخاب فرمایید.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await webinarsApi.addEquipment(webinarId, {
        equipmentItemId: selectedItemId,
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در افزودن تجهیز به رویداد');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-md shadow-2xl border border-[#1F2E45] flex flex-col overflow-hidden text-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div>
            <h2 className="text-base font-bold text-white">افزودن تجهیز به رویداد</h2>
            <p className="text-xs text-slate-400">انتخاب تجهیز از ماژول لجستیک جهت هماهنگی وبینار</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 me-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              تجهیز مورد نظر <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-10 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white focus:outline-none focus:border-[#719BDF]"
              required
            >
              <option value="">انتخاب تجهیز...</option>
              {equipmentItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">مهلت آماده‌سازی</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[#0B1423] border-[#1F2E45] text-white focus:border-[#719BDF] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">یادداشت یا کسری‌ها</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: نیازمند باتری زاپاس یا کابل تبدیل Type-C..."
              className="w-full p-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#1F2E45]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
            >
              {isSubmitting ? 'در حال افزودن...' : 'افزودن تجهیز'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
