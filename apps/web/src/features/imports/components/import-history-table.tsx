'use client';

import * as React from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  DollarSign,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { ImportJobHistoryItem, ImportDataType } from '../types';
import { importsApi } from '../imports.api';

interface ImportHistoryTableProps {
  dataType?: ImportDataType;
  refreshTrigger?: number;
}

export function ImportHistoryTable({
  dataType,
  refreshTrigger = 0,
}: ImportHistoryTableProps) {
  const [jobs, setJobs] = React.useState<ImportJobHistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchJobs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await importsApi.getRecentJobs(dataType);
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [dataType]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  const getStatusBadge = (status: ImportJobHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 me-1 text-emerald-400" />
            تکمیل شده
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 me-1 text-rose-400" />
            ناموفق
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#719BDF]/10 text-[#719BDF] border border-[#719BDF]/20">
            <Clock className="w-3.5 h-3.5 me-1 animate-spin text-[#719BDF]" />
            در حال پردازش
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0B1423] text-slate-400 border border-[#1F2E45]">
            در انتظار
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <History className="w-5 h-5 text-[#719BDF]" />
          <h3 className="text-base font-bold text-white">تاریخچه عملیات‌های ایمپورت سازمان</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchJobs}
          disabled={isLoading}
          className="text-xs border-[#1F2E45] bg-[#111D2E]/80 text-slate-300 hover:text-white hover:bg-[#18263A] rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 me-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          به‌روزرسانی
        </Button>
      </div>

      <div className="rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md overflow-hidden shadow-xl">
        {isLoading && jobs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            در حال بارگذاری تاریخچه ایمپورت‌ها...
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="هیچ عملیات ایمپورتی یافت نشد"
            description="هنوز هیچ عملیات ایمپورت فایلی در این سازمان به ثبت نرسیده است."
            icon={<FolderOpen className="w-6 h-6 text-slate-500" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0B1423]/60 text-slate-400 border-b border-[#1F2E45] font-semibold">
                <tr>
                  <th className="p-3.5">نوع داده</th>
                  <th className="p-3.5">نام فایل</th>
                  <th className="p-3.5">کل سطرها</th>
                  <th className="p-3.5">موفق</th>
                  <th className="p-3.5">ناموفق / رد شده</th>
                  <th className="p-3.5">وضعیت</th>
                  <th className="p-3.5">کاربر ثبت‌کننده</th>
                  <th className="p-3.5">زمان ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/60 text-slate-300">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#18263A]/40 transition-colors">
                    <td className="p-3.5 font-medium">
                      {job.dataType === 'leads' ? (
                        <span className="inline-flex items-center text-[#719BDF]">
                          <Users className="w-3.5 h-3.5 me-1.5" />
                          لیدها
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-emerald-400">
                          <DollarSign className="w-3.5 h-3.5 me-1.5" />
                          هزینه‌ها
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-white font-medium">{job.fileName}</td>
                    <td className="p-3.5 font-mono text-slate-300">{job.totalRows.toLocaleString('fa-IR')}</td>
                    <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                      {job.successfulRows.toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3.5 font-mono text-rose-400">
                      {job.failedRows.toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3.5">{getStatusBadge(job.status)}</td>
                    <td className="p-3.5 text-slate-400">{job.createdByName || 'سیستم'}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{formatDate(job.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}