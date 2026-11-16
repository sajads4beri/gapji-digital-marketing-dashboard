'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Upload,
  UserPlus,
  FileSpreadsheet,
  RefreshCw,
  ShieldAlert,
  MessageSquare,
  Calendar,
  Building,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import {
  smsApi,
  SmsCampaignDetail,
  SmsRecipientItem,
  SmsSummaryCards,
  SmsRecipientsTable,
  SmsImportModal,
  SmsConvertLeadsModal,
} from '@/features/sms';

export default function SmsDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || 'marketing_manager';
  const canAccess = ['admin', 'marketing_manager', 'campaign_manager'].includes(userRole);

  const [isLoadingDetail, setIsLoadingDetail] = React.useState(true);
  const [detail, setDetail] = React.useState<SmsCampaignDetail | null>(null);

  // Recipients Table State
  const [recipients, setRecipients] = React.useState<SmsRecipientItem[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Fetch campaign details
  const fetchDetail = React.useCallback(async () => {
    if (!id || !canAccess) return;
    try {
      setIsLoadingDetail(true);
      const data = await smsApi.getCampaignDetail(id);
      setDetail(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'رکورد پیامک یافت نشد');
    } finally {
      setIsLoadingDetail(false);
    }
  }, [id, canAccess, toast]);

  // Fetch recipients
  const fetchRecipients = React.useCallback(async () => {
    if (!id || !canAccess) return;
    try {
      setIsLoadingRecipients(true);
      const res = await smsApi.getRecipients(id, {
        status: activeFilter,
        search: searchTerm || undefined,
        page,
        limit: 15,
      });
      setRecipients(res.items);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'مشکل در برقراری ارتباط با سرور');
    } finally {
      setIsLoadingRecipients(false);
    }
  }, [id, canAccess, activeFilter, searchTerm, page, toast]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  React.useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // Export CSV Action
  const handleExportCsv = async () => {
    if (!id) return;
    try {
      setIsExporting(true);
      const blob = await smsApi.exportCsv(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sms_recipients_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('فایل CSV اکسل حاوی شماره‌های ماسک‌شده با موفقیت دانلود شد.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'مشکل در تولید فایل خروجی');
    } finally {
      setIsExporting(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-[#18263A] rounded-2xl border border-rose-500/30 shadow-xl">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">عدم دسترسی به جزئیات پیامک</h2>
        <p className="text-sm text-rose-300/80 mb-4">
          دسترسی به این بخش نیازمند نقش مدیر بازاریابی یا مدیر کمپین است.
        </p>
      </div>
    );
  }

  if (isLoadingDetail && !detail) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#719BDF]"></div>
        <p className="mt-3 text-sm text-slate-400">در حال بارگذاری جزئیات ارسال پیامک...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-16 text-center bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl mt-6">
        <h3 className="text-base font-bold text-white">رکورد ارسال پیامک یافت نشد</h3>
        <Link
          href="/leads/sms"
          className="mt-4 inline-flex items-center text-sm font-medium text-[#719BDF] hover:underline"
        >
          <ArrowRight className="w-4 h-4 me-1" />
          بازگشت به تاریخچه پیامک
        </Link>
      </div>
    );
  }

  const sentDateStr = detail.sentAt || detail.createdAt;
  const formattedSentDate = new Date(sentDateStr).toLocaleString('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6 pb-12 p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'فضای کاری ۱: عملکرد', href: '/performance/dashboard' },
          { label: 'پیامک', href: '/leads/sms' },
          { label: detail.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111D2E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href="/leads/sms"
              className="p-1.5 rounded-xl border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#1F2E45] transition-colors"
              title="بازگشت به لیست"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-black text-white tracking-tight">{detail.name}</h1>
            <Badge className="bg-[#18263A] text-slate-300 border-[#1F2E45] text-xs">
              سرشماره: {detail.senderNumber}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 ms-8">
            <div className="flex items-center gap-1 tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>زمان ثبت: {formattedSentDate}</span>
            </div>
            {detail.campaignName && (
              <div className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>کمپین: {detail.campaignName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: 3 Required Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Action A: Import Results */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <Upload className="w-4 h-4 me-1.5 text-emerald-400" />
            Import نتیجه ارسال
          </Button>

          {/* Action B: Convert Replies to Leads */}
          <Button
            size="sm"
            onClick={() => setIsConvertModalOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
          >
            <UserPlus className="w-4 h-4 me-1.5" />
            ساخت لید از پاسخ‌دهندگان
          </Button>

          {/* Action C: Export CSV */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <FileSpreadsheet className="w-4 h-4 me-1.5 text-[#719BDF]" />
            {isExporting ? 'در حال خروجی...' : 'خروجی Excel'}
          </Button>
        </div>
      </div>

      {/* Message Text Card */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-[#719BDF] flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed flex-1">
          <span className="font-bold text-slate-300 block mb-1">متن پیامک ارسالی:</span>
          <p className="text-slate-200 bg-[#0B1423] p-3 rounded-xl border border-[#1F2E45] font-sans">
            {detail.messageText}
          </p>
        </div>
      </div>

      {/* Summary Cards: 6 Required Metrics */}
      <SmsSummaryCards summary={detail.summary} />

      {/* Recipients Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">لیست شماره‌ها و گزارش وضعیت</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecipients}
            disabled={isLoadingRecipients}
            className="text-slate-400 hover:text-white text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 me-1 ${isLoadingRecipients ? 'animate-spin' : ''}`}
            />
            بروزرسانی شماره‌ها
          </Button>
        </div>

        <SmsRecipientsTable
          items={recipients}
          isLoading={isLoadingRecipients}
          activeFilter={activeFilter}
          onFilterChange={(f) => {
            setActiveFilter(f);
            setPage(1);
          }}
          searchTerm={searchTerm}
          onSearchChange={(s) => {
            setSearchTerm(s);
            setPage(1);
          }}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Action A: Import Modal */}
      <SmsImportModal
        smsId={detail.id}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchDetail();
          fetchRecipients();
        }}
      />

      {/* Action B: Convert Replies Modal */}
      <SmsConvertLeadsModal
        smsId={detail.id}
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSuccess={() => {
          fetchDetail();
          fetchRecipients();
        }}
      />
    </div>
  );
}
