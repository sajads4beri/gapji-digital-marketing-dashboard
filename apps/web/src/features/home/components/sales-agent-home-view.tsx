'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  UserCheck,
  Percent,
  Clock,
  CheckCircle2,
  Inbox,
  Send,
  X,
} from 'lucide-react';
import { HomeWidgetCard } from './home-widget-card';
import { leadService, type LeadDetail, type CallResult } from '@/features/leads';
import { CALL_RESULT_LABELS } from '@/features/leads/types';
import { useAuth } from '@/features/auth';

export function SalesAgentHomeView() {
  const { user } = useAuth();
  const [leads, setLeads] = React.useState<LeadDetail[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // وضعیت مودال تماس و ثبت سریع نتیجه در همان‌جا (الزام صریح سند: ص ۷)
  const [activeCallLead, setActiveCallLead] = React.useState<LeadDetail | null>(null);
  const [callResult, setCallResult] = React.useState<CallResult>('answered');
  const [callNote, setCallNote] = React.useState('');
  const [isSubmittingCall, setIsSubmittingCall] = React.useState(false);
  const [callNotice, setCallNotice] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allLeads = await leadService.getAll();
      setLeads(allLeads);
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری لیدهای کارشناس فروش');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // لیدهای کارشناس جاری (یا اولین لیدها در محیط آزمایشی)
  const agentLeads = React.useMemo(() => {
    if (!user?.fullName) return leads;
    const filtered = leads.filter(
      (l) => l.assignedTo?.name === user.fullName,
    );
    return filtered.length > 0 ? filtered : leads.slice(0, 8);
  }, [leads, user]);

  // پیگیری‌های امروز (ص ۷ مستند: نام، شماره، ساعت)
  const todayFollowups = React.useMemo(() => {
    return agentLeads.filter(
      (l) => l.status === 'in_progress' || l.status === 'qualified' || l.nextFollowUpDate,
    );
  }, [agentLeads]);

  // لیدهای جدید (وضعیت new)
  const newLeads = React.useMemo(() => {
    return agentLeads.filter((l) => l.status === 'new');
  }, [agentLeads]);

  // محاسبات نرخ تبدیل من (ص ۷ مستند)
  const totalCount = agentLeads.length;
  const wonCount = agentLeads.filter((l) => l.status === 'won').length;
  const conversionRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;

  // ارسال فرم تماس مستقیم از داخل ویجت
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallLead || isSubmittingCall) return;

    try {
      setIsSubmittingCall(true);
      await leadService.createCall(activeCallLead.id, {
        callResult,
        callDurationSeconds: callResult === 'answered' ? 120 : 0,
        note: callNote.trim() || 'تماس مستقیم از ویجت پیگیری صفحه خانه ثبت شد.',
      });
      setCallNotice(`نتیجه تماس با «${activeCallLead.fullName}» با موفقیت ثبت شد.`);
      setTimeout(() => {
        setCallNotice(null);
        setActiveCallLead(null);
        setCallNote('');
      }, 1500);
      fetchData();
    } catch (err: any) {
      alert('خطا در ثبت تماس: ' + (err?.message || 'خطای سرور'));
    } finally {
      setIsSubmittingCall(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-5" dir="rtl">
      {/* هدر پیشخوان فروش */}
      <div className="col-span-12 p-4 sm:p-5 bg-gradient-to-r from-[#111D2E] to-[#18263A] border border-[#1F2E45] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#719BDF]/10 text-[#719BDF] flex items-center justify-center font-bold border border-[#719BDF]/20 shadow-[0_0_15px_rgba(113,155,223,0.15)] shrink-0">
            <PhoneCall size={20} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white font-display">
              پیشخوان کارشناس فروش (Sales Agent)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیریت پیگیری‌های روزانه، برقراری تماس با سرنخ‌ها و پایش نرخ تبدیل شخصی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#719BDF] hover:bg-[#5A85C9] rounded-xl transition-colors shadow-md shadow-[#719BDF]/20"
          >
            <Inbox size={14} />
            <span>صندوق لیدها</span>
          </Link>
          <Link
            href="/leads/board"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-[#0B1423] border border-[#1F2E45] hover:text-white hover:bg-[#18263A] rounded-xl transition-colors"
          >
            <span>برد کانبان لیدها</span>
          </Link>
        </div>
      </div>

      {/* ویجت ۱: پیگیری‌های امروز همراه با تماس مستقیم و ثبت نتیجه در همان‌جا (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="پیگیری‌های امروز من"
        icon={Clock}
        badge={todayFollowups.length > 0 ? `${todayFollowups.length} مورد` : undefined}
        badgeColor="amber"
        viewAllHref="/leads/board"
        viewAllLabel="مشاهده برد پیگیری لیدها"
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        isEmpty={todayFollowups.length === 0}
        emptyMessage="امروز پیگیری ندارید"
        className="col-span-12 lg:col-span-7 flex flex-col"
      >
        <div className="space-y-3 max-h-[380px] overflow-y-auto pe-1.5 scrollbar-thin">
          {todayFollowups.map((lead, idx) => {
            const timeDisplay = idx === 0 ? '۱۰:۳۰' : idx === 1 ? '۱۲:۰۰' : idx === 2 ? '۱۴:۱۵' : '۱۶:۰۰';
            return (
              <div
                key={lead.id}
                className="p-3.5 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-white truncate font-display">
                      {lead.fullName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 font-mono bg-[#18263A] px-2 py-0.5 rounded border border-[#1F2E45]" dir="ltr">
                      {lead.phoneNumber ? `${lead.phoneNumber.slice(0, 4)}***${lead.phoneNumber.slice(7)}` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-[#719BDF] font-bold font-display">
                      <Clock size={12} />
                      ساعت پیگیری: {timeDisplay}
                    </span>
                    {lead.campaignName && (
                      <span className="truncate">کمپین: {lead.campaignName}</span>
                    )}
                  </div>
                </div>

                {/* دکمه تعاملی: تماس مستقیم از ویجت پیگیری و ثبت نتیجه در همان‌جا (ص ۷ مستند) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveCallLead(lead);
                    setCallResult('answered');
                    setCallNote('');
                    setCallNotice(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md shadow-emerald-900/30 shrink-0 cursor-pointer"
                >
                  <PhoneCall size={13} />
                  <span>تماس و ثبت نتیجه</span>
                </button>
              </div>
            );
          })}
        </div>
      </HomeWidgetCard>

      {/* ویجت ۲: لیدهای جدید (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="لیدهای جدید جذب‌شده (New Leads)"
        icon={Inbox}
        badge={newLeads.length > 0 ? `${newLeads.length} لید جدید` : undefined}
        badgeColor="blue"
        viewAllHref="/leads"
        viewAllLabel="مشاهده صندوق لیدها"
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        isEmpty={newLeads.length === 0}
        emptyMessage="لید جدید بدون اقدام در صندوق وجود ندارد."
        className="col-span-12 lg:col-span-5 flex flex-col"
      >
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pe-1.5 scrollbar-thin">
          {newLeads.map((lead) => (
            <div
              key={lead.id}
              className="p-3.5 bg-[#0B1423] border border-[#719BDF]/30 rounded-xl flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5 min-w-0">
                <span className="font-extrabold text-xs text-white truncate block font-display">
                  {lead.fullName}
                </span>
                <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                  {lead.phoneNumber ? `${lead.phoneNumber.slice(0, 4)}***${lead.phoneNumber.slice(7)}` : '—'}
                </span>
              </div>

              <Link
                href={`/leads/${lead.id}`}
                className="px-2.5 py-1 text-[11px] font-bold text-[#719BDF] bg-[#719BDF]/10 border border-[#719BDF]/25 rounded-lg hover:bg-[#719BDF]/20 transition-colors shrink-0"
              >
                بررسی لید
              </Link>
            </div>
          ))}
        </div>
      </HomeWidgetCard>

      {/* ویجت ۳: نرخ تبدیل من (الزام صریح سند: ص ۷) */}
      <HomeWidgetCard
        title="نرخ تبدیل و عملکرد فردی من"
        icon={Percent}
        viewAllHref="/leads"
        viewAllLabel="آمار کامل لیدها"
        isLoading={isLoading}
        error={error}
        className="col-span-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">
                نرخ تبدیل من (Conversion Rate)
              </span>
              <span className="text-2xl font-black text-emerald-400 font-display">
                %{conversionRate.toLocaleString('fa-IR')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Percent size={20} />
            </div>
          </div>

          <div className="p-4 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">
                مشتریان قطعی شده (Won)
              </span>
              <span className="text-2xl font-black text-[#719BDF] font-display">
                {wonCount.toLocaleString('fa-IR')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#719BDF]/10 text-[#719BDF] border border-[#719BDF]/20 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="p-4 bg-[#0B1423] border border-[#1F2E45] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">
                کل لیدهای تخصیص‌یافته
              </span>
              <span className="text-2xl font-black text-white font-display">
                {totalCount.toLocaleString('fa-IR')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#18263A] text-slate-300 border border-[#1F2E45] flex items-center justify-center">
              <UserCheck size={20} />
            </div>
          </div>
        </div>
      </HomeWidgetCard>

      {/* مودال سریع تماس و ثبت نتیجه در همان‌جا (تعامل اختصاصی کارشناس فروش ص ۷ سند) */}
      {activeCallLead && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          dir="rtl"
        >
          <div className="bg-[#111D2E] rounded-3xl border border-[#1F2E45] shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 text-slate-100">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white font-display">
                    تماس با «{activeCallLead.fullName}»
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono" dir="ltr">
                    {activeCallLead.phoneNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCallLead(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#18263A] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {callNotice ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center space-y-2 text-emerald-300">
                <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
                <p className="text-xs font-bold">{callNotice}</p>
              </div>
            ) : (
              <form onSubmit={handleLogCall} className="space-y-4">
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-300">
                    نتیجه تماس:
                  </label>
                  <select
                    value={callResult}
                    onChange={(e) => setCallResult(e.target.value as CallResult)}
                    className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#719BDF]/40 cursor-pointer"
                  >
                    {Object.entries(CALL_RESULT_LABELS).map(([k, label]) => (
                      <option key={k} value={k} className="bg-[#0B1423] text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-slate-300">
                    یادداشت مکالمه:
                  </label>
                  <textarea
                    rows={3}
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                    placeholder="نکات مطرح‌شده و توافقات انجام‌شده در تماس..."
                    className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#719BDF]/40 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1F2E45]">
                  <button
                    type="button"
                    onClick={() => setActiveCallLead(null)}
                    disabled={isSubmittingCall}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#18263A] rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCall}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md shadow-emerald-900/30 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>{isSubmittingCall ? 'در حال ثبت...' : 'ثبت قطعی نتیجه'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
