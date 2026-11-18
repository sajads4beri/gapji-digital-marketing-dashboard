'use client';

import * as React from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Building2,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KpiItem } from '../types';

interface KpisTableProps {
  kpis: KpiItem[];
  isLoading: boolean;
  onEdit: (kpi: KpiItem) => void;
  onDelete: (kpi: KpiItem) => void;
  onAdd: () => void;
  canWrite?: boolean;
}

export function KpisTable({
  kpis,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  canWrite = true,
}: KpisTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [scopeFilter, setScopeFilter] = React.useState<'all' | 'organization' | 'campaign'>('all');

  const filteredKpis = React.useMemo(() => {
    return kpis.filter((k) => {
      const matchesSearch =
        k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.scopeTitle && k.scopeTitle.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'organization' && k.scope === 'organization') ||
        (scopeFilter === 'campaign' && k.scope === 'campaign');

      return matchesSearch && matchesScope;
    });
  }, [kpis, searchTerm, scopeFilter]);

  if (isLoading && kpis.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
          <div className="h-4 w-32 bg-[#1F2E45] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[#1F2E45] rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-[#0B1423]/70 border border-[#1F2E45] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111D2E]/80 backdrop-blur-md p-3.5 rounded-2xl border border-[#1F2E45] shadow-lg">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در نام شاخص یا کمپین..."
            className="ps-10 text-xs h-9 bg-[#0B1423] border-[#1F2E45] text-white placeholder:text-slate-500 focus:border-[#719BDF] focus:ring-[#719BDF]/20 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#0B1423] p-1 rounded-xl border border-[#1F2E45] text-xs">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeFilter === 'all'
                  ? 'bg-[#18263A] text-white shadow-sm border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              همه ({kpis.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('organization')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeFilter === 'organization'
                  ? 'bg-[#18263A] text-white shadow-sm border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سازمان
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('campaign')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeFilter === 'campaign'
                  ? 'bg-[#18263A] text-white shadow-sm border border-[#1F2E45]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              کمپین‌ها
            </button>
          </div>

          {canWrite && (
            <Button
              onClick={onAdd}
              size="sm"
              className="bg-[#719BDF] hover:bg-[#5A85C9] text-white text-xs gap-1.5 h-9 shrink-0 shadow-lg shadow-[#719BDF]/20 rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              افزودن KPI
            </Button>
          )}
        </div>
      </div>

      {/* KPIs Table or Empty State */}
      {filteredKpis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1F2E45] bg-[#111D2E]/50 backdrop-blur-md p-12 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#719BDF]/10 border border-[#719BDF]/20 text-[#719BDF] flex items-center justify-center mx-auto mb-3.5 shadow-inner">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {searchTerm || scopeFilter !== 'all'
              ? 'هیچ شاخصی مطابق فیلتر یافت نشد'
              : 'هنوز هیچ شاخص KPI تعریف نشده است'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 mb-5 leading-relaxed">
            شاخص‌های کلیدی عملکرد (KPI) به شما کمک می‌کنند تا تحقق اهداف فروش، CPL و نرخ بازگشت سرمایه را رصد کنید.
          </p>
          {canWrite && (
            <Button
              onClick={onAdd}
              size="sm"
              className="bg-[#719BDF] hover:bg-[#5A85C9] text-white text-xs gap-1.5 shadow-lg shadow-[#719BDF]/20 rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              تعریف اولین KPI
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#1F2E45] bg-[#0B1423]/60 text-slate-400 font-medium">
                  <th className="py-3.5 px-4 font-semibold">شاخص و جهت</th>
                  <th className="py-3.5 px-4 font-semibold">دامنه (Scope)</th>
                  <th className="py-3.5 px-4 font-semibold">مقدار هدف</th>
                  <th className="py-3.5 px-4 font-semibold">مقدار فعلی (زنده)</th>
                  <th className="py-3.5 px-4 font-semibold min-w-44">میزان پیشرفت</th>
                  <th className="py-3.5 px-4 font-semibold">بازه زمانی</th>
                  <th className="py-3.5 px-4 font-semibold text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/60 text-slate-300">
                {filteredKpis.map((kpi) => {
                  const isAchieved = kpi.progressPercentage >= 100;
                  const isLagging = kpi.progressPercentage < 50;

                  return (
                    <tr key={kpi.id} className="hover:bg-[#18263A]/40 transition-colors">
                      {/* Metric Name & Direction */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                              kpi.direction === 'higher_is_better'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-[#719BDF]/10 text-[#719BDF] border-[#719BDF]/20'
                            }`}
                          >
                            {kpi.direction === 'higher_is_better' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{kpi.name}</div>
                            <div className="font-mono text-[11px] text-slate-400 uppercase">
                              {kpi.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {kpi.scope === 'campaign' ? (
                            <>
                              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="font-medium truncate max-w-44" title={kpi.scopeTitle}>
                                {kpi.scopeTitle}
                              </span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-[#719BDF] shrink-0" />
                              <span className="font-medium text-slate-400">کل سازمان</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Target Value */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white font-mono text-sm">
                          {Number(kpi.targetValue).toLocaleString('fa-IR')}
                        </div>
                        <div className="text-[11px] text-slate-400">{kpi.unit}</div>
                      </td>

                      {/* Actual Value */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white font-mono text-sm">
                          {Number(kpi.actualValue).toLocaleString('fa-IR')}
                        </div>
                        <div className="text-[11px] text-slate-400">{kpi.unit}</div>
                      </td>

                      {/* Progress Bar & Percentage */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`font-mono font-bold ${
                                isAchieved
                                  ? 'text-emerald-400'
                                  : isLagging
                                    ? 'text-amber-400'
                                    : 'text-[#719BDF]'
                              }`}
                            >
                              {kpi.progressPercentage.toLocaleString('fa-IR')}%
                            </span>
                            {isAchieved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                محقق شده
                              </span>
                            ) : isLagging ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                نیاز به توجه
                              </span>
                            ) : null}
                          </div>

                          <div className="w-full bg-[#0B1423] rounded-full h-2 overflow-hidden border border-[#1F2E45]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isAchieved
                                  ? 'bg-emerald-500'
                                  : isLagging
                                    ? 'bg-amber-500'
                                    : 'bg-[#719BDF]'
                              }`}
                              style={{ width: `${Math.min(kpi.progressPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-[#0B1423] text-slate-300 border border-[#1F2E45] px-2.5 py-0.5 rounded-lg text-[11px] font-medium">
                          {kpi.period}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-left">
                        {canWrite && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEdit(kpi)}
                              title="ویرایش KPI"
                              className="p-1.5 text-slate-400 hover:text-[#719BDF] hover:bg-[#719BDF]/10 rounded-lg transition-colors border border-transparent hover:border-[#719BDF]/20"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(kpi)}
                              title="حذف KPI"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
