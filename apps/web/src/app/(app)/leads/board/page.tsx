'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
 Kanban,
 Inbox,
 Plus,
 RefreshCw,
 AlertCircle,
 ShieldAlert,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { FilterBar, type FilterConfig } from '@/components/common/filter-bar';
import { EmptyState } from '@/components/common/empty-state';
import { useToast } from '@/components/common/toast-provider';
import { Button } from '@/components/ui/button';
import type { DateRangeValue } from '@/components/ui/persian-date-picker';
import { toPersianDigits } from '@/components/common/timeline';
import {
 leadService,
 leadApi,
 type LeadDetail,
 type LeadStatus,
 type LeadFilters,
 LEAD_STATUS_LABELS,
 KanbanColumn,
 KanbanWonDealModal,
 KanbanLostLeadModal,
} from '@/features/leads';
import { useAuth } from '@/features/auth';
import { organizationService, type OrgLeadStatusItem } from '@/features/organization';

const DEFAULT_PIPELINE_STATUSES: OrgLeadStatusItem[] = [
 { id: 'default-new', key: 'new', label: 'جدید', order: 1, color: 'blue', group: 'open' as any, isActive: true, isSystem: true, usageCount: 0, createdAt: '', updatedAt: '' },
 { id: 'default-in_progress', key: 'in_progress', label: 'تماس گرفته شد', order: 2, color: 'indigo', group: 'open' as any, isActive: true, isSystem: true, usageCount: 0, createdAt: '', updatedAt: '' },
 { id: 'default-qualified', key: 'qualified', label: 'واجد شرایط', order: 3, color: 'purple', group: 'open' as any, isActive: true, isSystem: true, usageCount: 0, createdAt: '', updatedAt: '' },
 { id: 'default-proposal', key: 'proposal', label: 'پیشنهاد', order: 4, color: 'amber', group: 'open' as any, isActive: true, isSystem: true, usageCount: 0, createdAt: '', updatedAt: '' },
 { id: 'default-won', key: 'won', label: 'مشتری', order: 5, color: 'emerald', group: 'won' as any, isActive: true, isSystem: true, usageCount: 0, createdAt: '', updatedAt: '' },
 { id: 'default-lost', key: 'lost', label: 'ردشده', order: 6, color: 'rose', group: 'lost' as any, isActive: true, isSystem: true, usageCount: 0, createdAt: '', updatedAt: '' },
];

function LeadsBoardContent() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const { toast } = useToast();
 const { user, activeRole, canAccessRoute } = useAuth();
 const isRouteDenied =
  activeRole === 'campaign_manager' ||
  activeRole === 'client' ||
  activeRole === 'content_creator' ||
  (activeRole !== null && !canAccessRoute('/leads/board'));

 // ۱. خواندن پارامترهای فیلتر از URL جهت پایداری پس از رفرش و تاریخچه مرورگر
 const searchQuery = searchParams.get('search') || '';
 const statusParam = searchParams.get('status') || '';
 const statusFilter: LeadStatus[] = React.useMemo(
 () => (statusParam ? (statusParam.split(',').filter(Boolean) as LeadStatus[]) : []),
 [statusParam]
 );
 const assignedToFilter = searchParams.get('assignedToId') || '';
 const campaignFilter = searchParams.get('campaignId') || '';
 const sourceFilter = searchParams.get('source') || '';
 const fromParam = searchParams.get('from') || '';
 const toParam = searchParams.get('to') || '';

 const dateRange: DateRangeValue | undefined = React.useMemo(() => {
 if (fromParam && toParam) {
 return { from: fromParam, to: toParam };
 }
 if (fromParam || toParam) {
 return { from: fromParam || toParam, to: toParam || fromParam };
 }
 return undefined;
 }, [fromParam, toParam]);

 // وضعیت جستجوی محلی با Debounce
 const [searchInput, setSearchInput] = React.useState(searchQuery);
 React.useEffect(() => {
 setSearchInput(searchQuery);
 }, [searchQuery]);

 // ۲. وضعیت لیدها و ارتباط با سرویس
 const [leads, setLeads] = React.useState<LeadDetail[]>([]);
 const [loading, setLoading] = React.useState(true);
 const [error, setError] = React.useState<string | null>(null);

 // وضعیت‌های پیکربندی‌شده پایپ‌لاین سازمان (B2.5.4)
 const [pipelineStatuses, setPipelineStatuses] = React.useState<OrgLeadStatusItem[]>(DEFAULT_PIPELINE_STATUSES);
 const [pendingTargetStatus, setPendingTargetStatus] = React.useState<string>('won');

 // ۳. وضعیت تعاملات Drag & Drop
 const [draggingLeadId, setDraggingLeadId] = React.useState<string | null>(null);
 const [dragOverColumn, setDragOverColumn] = React.useState<LeadStatus | null>(null);

 // ۴. وضعیت مدال‌های قوانین نهایی (Won / Lost)
 const [wonModalLead, setWonModalLead] = React.useState<LeadDetail | null>(null);
 const [lostModalLead, setLostModalLead] = React.useState<LeadDetail | null>(null);
 const [isModalSubmitting, setIsModalSubmitting] = React.useState(false);
 const updatingIdsRef = React.useRef<Set<string>>(new Set());

 // ۵. ستون فعال در موبایل جهت جابه‌جایی سریع
 const [mobileActiveColumn, setMobileActiveColumn] = React.useState<LeadStatus>('new');
 const columnRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

 // ۶. فراخوانی داده‌ها از سرویس Mock
 const fetchLeads = React.useCallback(async () => {
 if (isRouteDenied) {
  setLoading(false);
  return;
 }
 try {
 setLoading(true);
 setError(null);

 const filters: LeadFilters = {};
 if (searchQuery) filters.search = searchQuery;
 if (statusFilter.length > 0) filters.status = statusFilter;
 // طبق ص ۱۵ مستند محصول: کارشناس فروش (فقط لیدهای خود)
 if (activeRole === 'sales_agent') {
 filters.assignedToId = user?.id || '';
 } else if (assignedToFilter) {
 filters.assignedToId = assignedToFilter;
 }
 if (campaignFilter) filters.campaignId = campaignFilter;
 if (sourceFilter) filters.source = sourceFilter;
 if (fromParam || toParam) {
 filters.dateRange = {
 from: fromParam || undefined,
 to: toParam || undefined,
 };
 }

 let result: LeadDetail[] = [];
 try {
  result = await leadApi.getLeads(filters);
 } catch {
  result = await leadService.getAll(filters);
 }
 setLeads(result);
 } catch (err) {
 setError(
 err instanceof Error ? err.message : 'خطا در بارگذاری داده‌های برد پیگیری'
 );
 } finally {
 setLoading(false);
 }
 }, [
 searchQuery,
 statusFilter,
 assignedToFilter,
 campaignFilter,
 sourceFilter,
 fromParam,
 toParam,
 activeRole,
 user?.id,
 isRouteDenied,
 ]);

  const fetchStatuses = React.useCallback(async () => {
  try {
   const items = await organizationService.getListItems('lead_statuses');
   if (items && items.length > 0) {
    setPipelineStatuses(items as OrgLeadStatusItem[]);
   }
  } catch (err) {
   console.error('Failed to load lead status configurations:', err);
  }
 }, []);

 React.useEffect(() => {
  fetchLeads();
  fetchStatuses();
 }, [fetchLeads, fetchStatuses]);

 // مرتب‌سازی وضعیت‌های فعال بر اساس sortOrder
 const activeStatuses = React.useMemo(() => {
  return pipelineStatuses
   .filter((s) => s.isActive)
   .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
 }, [pipelineStatuses]);

 // گزینه‌های مجاز برای تغییر وضعیت
 const availableStatusesOptions = React.useMemo(() => {
  return activeStatuses.map((s) => ({ key: s.key, label: s.label }));
 }, [activeStatuses]);

 // دیکشنری وضعیت‌ها جهت دسترسی سریع به مشخصات
 const statusLookup = React.useMemo(() => {
  const map = new Map<string, OrgLeadStatusItem>();
  for (const s of pipelineStatuses) {
   map.set(s.key, s);
   map.set(s.id, s);
  }
  return map;
 }, [pipelineStatuses]);

 // تابع نگاشت انحصاری هر لید به تنها یک ستون کانبان (B2.5.4.1: جلوگیری از تکرار یا حذف لید)
 const resolveLeadColumnKey = React.useCallback(
  (lead: LeadDetail): string => {
   // ۱. اگر شناسه statusConfigId در تنظیمات سازمان وجود دارد، کلید آن ستون قطعی است
   if (lead.statusConfigId && statusLookup.has(lead.statusConfigId)) {
    return statusLookup.get(lead.statusConfigId)!.key;
   }
   // ۲. تطابق کلید متنی با وضعیت‌های پایپ‌لاین
   const key = lead.statusKey || lead.status;
   if (key && statusLookup.has(key)) {
    return statusLookup.get(key)!.key;
   }
   // ۳. در صورت وضعیت یتیم یا میراثی که در تنظیمات نیست، حفظ کلید اصلی به عنوان ستون میراثی
   return key || 'unknown';
  },
  [statusLookup]
 );

 // ستون‌های نمایشی بورد کانبان: وضعیت‌های فعال + وضعیت‌های غیرفعال دارای لید + وضعیت‌های یتیم/میراثی دارای لید
 const displayColumns = React.useMemo(() => {
  const activeKeys = new Set(activeStatuses.map((s) => s.key));
  const cols = [...activeStatuses];

  // ۱. ستون‌های غیرفعال موجود در تنظیمات سازمان که لید تاریخی در آن‌ها وجود دارد
  const inactiveWithLeads = pipelineStatuses.filter(
   (s) => !s.isActive && leads.some((l) => resolveLeadColumnKey(l) === s.key)
  );
  for (const inact of inactiveWithLeads) {
   if (!activeKeys.has(inact.key)) {
    cols.push(inact);
    activeKeys.add(inact.key);
   }
  }

  // ۲. شناسایی لیدهای دارای وضعیت‌های یتیم یا میراثی تعریف‌نشده در تنظیمات سازمان
  const orphanedKeys = new Set<string>();
  for (const lead of leads) {
   const colKey = resolveLeadColumnKey(lead);
   if (!activeKeys.has(colKey)) {
    orphanedKeys.add(colKey);
   }
  }

  Array.from(orphanedKeys).forEach((orphanKey) => {
   cols.push({
    id: `orphaned-${orphanKey}`,
    key: orphanKey,
    label: `نامشخص / میراثی (${orphanKey})`,
    color: 'slate',
    order: 999,
    isActive: false,
    isSystem: false,
    usageCount: 0,
    createdAt: '',
    updatedAt: '',
   } as OrgLeadStatusItem);
   activeKeys.add(orphanKey);
  });

  return cols;
 }, [activeStatuses, pipelineStatuses, leads, resolveLeadColumnKey]);

 // ۷. به‌روزرسانی پارامترهای فیلتر در URL
 const updateUrlParams = React.useCallback(
 (updates: Record<string, string | null>) => {
 const current = new URLSearchParams(searchParams.toString());
 for (const [key, val] of Object.entries(updates)) {
 if (val === null || val === '') {
 current.delete(key);
 } else {
 current.set(key, val);
 }
 }
 const qs = current.toString();
 router.push(qs ? `${pathname}?${qs}` : pathname);
 },
 [router, pathname, searchParams]
 );

 React.useEffect(() => {
 const handler = setTimeout(() => {
 if (searchInput !== searchQuery) {
 updateUrlParams({ search: searchInput.trim() || null });
 }
 }, 350);

 return () => clearTimeout(handler);
 }, [searchInput, searchQuery, updateUrlParams]);

 // تنظیمات گزینه‌های FilterBar
 const filtersConfig: FilterConfig[] = React.useMemo(
 () => [
 {
 id: 'status',
 label: 'مرحله برد',
 type: 'multi-select',
 options: pipelineStatuses.map((s) => ({ label: s.label, value: s.key })),
 },
 {
 id: 'assignedToId',
 label: 'کارشناس',
 type: 'select',
 placeholder: 'همه کارشناسان',
 options: [
 { label: 'سارا احمدی', value: 'user-1' },
 { label: 'علی محمدی', value: 'user-2' },
 { label: 'مریم کاظمی', value: 'user-3' },
 { label: 'تخصیص‌نیافته', value: 'unassigned' },
 ],
 },
 {
 id: 'campaignId',
 label: 'کمپین',
 type: 'select',
 placeholder: 'همه کمپین‌ها',
 options: [
 { label: 'کمپین تخفیف پاییزه - گوگل ادز', value: 'camp-1' },
 { label: 'کمپین لید اینستاگرام', value: 'camp-2' },
 { label: 'لندینگ وبینار بازاریابی دیجیتال', value: 'camp-3' },
 { label: 'کمپین پیامکی جشنواره مهر', value: 'camp-4' },
 ],
 },
 {
 id: 'source',
 label: 'منبع ورودی',
 type: 'select',
 placeholder: 'همه منابع',
 options: [
 { label: 'گوگل ادز (Google Ads)', value: 'گوگل ادز' },
 { label: 'اینستاگرام', value: 'اینستاگرام' },
 { label: 'سایت مستقیم', value: 'سایت مستقیم' },
 { label: 'پیامک کوتاه', value: 'پیامک' },
 ],
 },
 ],
 [pipelineStatuses]
 );

 const selectedFilters: Record<string, string | string[]> = React.useMemo(() => {
 const res: Record<string, string | string[]> = {};
 if (statusFilter.length > 0) res.status = statusFilter;
 if (assignedToFilter) res.assignedToId = assignedToFilter;
 if (campaignFilter) res.campaignId = campaignFilter;
 if (sourceFilter) res.source = sourceFilter;
 return res;
 }, [statusFilter, assignedToFilter, campaignFilter, sourceFilter]);

 const hasActiveFilters = Boolean(
 searchQuery ||
 statusFilter.length > 0 ||
 assignedToFilter ||
 campaignFilter ||
 sourceFilter ||
 fromParam ||
 toParam
 );

 const handleFilterChange = (filterId: string, value: string | string[]) => {
 if (filterId === 'status') {
 const arr = Array.isArray(value) ? value : value ? [value] : [];
 updateUrlParams({ status: arr.length > 0 ? arr.join(',') : null });
 } else {
 updateUrlParams({ [filterId]: (value as string) || null });
 }
 };

 const handleDateRangeChange = (range: DateRangeValue) => {
 updateUrlParams({
 from: range.from || null,
 to: range.to || null,
 });
 };

 const handleClearAll = () => {
 setSearchInput('');
 router.push(pathname);
 };

 // ۸. کپی شماره تماس
 const handleCopyPhone = async (e: React.MouseEvent, phone: string) => {
 e.stopPropagation();
 try {
 if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(phone);
 toast.success(`شماره تماس ${phone} در کلیپ‌بورد کپی شد.`);
 } else {
 toast.warning('مرورگر شما از کپی مستقیم در کلیپ‌بورد پشتیبانی نمی‌کند.');
 }
 } catch {
 toast.error('خطا در کپی شماره تماس.');
 }
 };

 // ۹. منطق تغییر وضعیت لید با پشتیبانی از Optimistic Update و Rollback
 const executeStatusChange = async (
 leadId: string,
 targetStatus: LeadStatus,
 metadata?: { dealValue?: number; lostReason?: string }
 ) => {
 if (updatingIdsRef.current.has(leadId)) return;

 const targetLead = leads.find((l) => l.id === leadId);
 if (!targetLead || targetLead.status === targetStatus) return;

 updatingIdsRef.current.add(leadId);
 const previousStatus = targetLead.status;
 const previousEstimatedValue = targetLead.estimatedValue;
 const previousLostReason = targetLead.lostReason;

 // ۱. به‌روزرسانی خوش‌بینانه در واسط کاربری (Optimistic UI Update)
 setLeads((prev) =>
 prev.map((l) => {
 if (l.id === leadId) {
 return {
 ...l,
 status: targetStatus,
 estimatedValue:
 metadata?.dealValue !== undefined
 ? metadata.dealValue
 : l.estimatedValue,
 lostReason:
 metadata?.lostReason !== undefined
 ? metadata.lostReason
 : l.lostReason,
 updatedAt: new Date().toISOString(),
 };
 }
 return l;
 })
 );

 try {
 // ۲. فراخوانی API واقعی جهت پایدارسازی وضعیت در سرور و دیتابیس
 let updatedData: { lead: LeadDetail; event?: any } | null = null;
 try {
  updatedData = await leadApi.updateStatus(leadId, targetStatus, metadata);
 } catch (apiErr) {
  updatedData = await leadService.updateStatus(leadId, targetStatus, metadata);
 }

 if (updatedData?.lead) {
  setLeads((prev) =>
  prev.map((l) => (l.id === leadId ? { ...l, ...updatedData!.lead } : l))
  );
 }

 const targetConfig = statusLookup.get(targetStatus);
 const statusLabel = targetConfig?.label || LEAD_STATUS_LABELS[targetStatus as keyof typeof LEAD_STATUS_LABELS] || targetStatus;
 toast.success(
 `وضعیت «${targetLead.fullName}» به «${statusLabel}» منتقل شد.`
 );
 } catch (err: any) {
 // ۳. بازگردانی وضعیت در صورت بروز خطا (Rollback on failure)
 setLeads((prev) =>
 prev.map((l) => {
 if (l.id === leadId) {
 return {
 ...l,
 status: previousStatus,
 estimatedValue: previousEstimatedValue,
 lostReason: previousLostReason,
 };
 }
 return l;
 })
 );
 const errorMsg =
 err?.response?.data?.message ||
 (err instanceof Error
 ? err.message
 : 'خطا در تغییر وضعیت لید. عملیات به وضعیت قبلی بازگردانده شد.');
 toast.error(typeof errorMsg === 'string' ? errorMsg : 'خطا در تغییر وضعیت لید');
 } finally {
 updatingIdsRef.current.delete(leadId);
 }
 };

 // ۱۰. مدیریت رویداد Drop کارت‌ها (دسکتاپ)
 const handleLeadDrop = (leadId: string, targetStatus: LeadStatus) => {
 setDraggingLeadId(null);
 setDragOverColumn(null);

 const lead = leads.find((l) => l.id === leadId);
 if (!lead || lead.status === targetStatus) return;

 const targetConfig = statusLookup.get(targetStatus);
 // قوانین ویژه وضعیت‌های نهایی won و lost طبق گروه یا کلید وضعیت
 if (targetConfig?.group === 'won' || targetStatus === 'won') {
 setWonModalLead(lead);
 setPendingTargetStatus(targetConfig?.key || targetStatus);
 return;
 }
 if (targetConfig?.group === 'lost' || targetStatus === 'lost') {
 setLostModalLead(lead);
 setPendingTargetStatus(targetConfig?.key || targetStatus);
 return;
 }

 // سایر وضعیت‌های عادی بدون مدال
 executeStatusChange(leadId, targetStatus);
 };

 // ۱۱. مدیریت تغییر وضعیت از طریق منوی موبایل
 const handleMobileStatusChange = (leadId: string, targetStatus: LeadStatus) => {
 const lead = leads.find((l) => l.id === leadId);
 if (!lead || lead.status === targetStatus) return;

 const targetConfig = statusLookup.get(targetStatus);
 if (targetConfig?.group === 'won' || targetStatus === 'won') {
 setWonModalLead(lead);
 setPendingTargetStatus(targetConfig?.key || targetStatus);
 return;
 }
 if (targetConfig?.group === 'lost' || targetStatus === 'lost') {
 setLostModalLead(lead);
 setPendingTargetStatus(targetConfig?.key || targetStatus);
 return;
 }

 executeStatusChange(leadId, targetStatus);
 };

 // ۱۲. تأیید مدال خرید موفق (won)
 const handleConfirmWonDeal = async (dealValue: number) => {
 if (!wonModalLead || isModalSubmitting) return;
 try {
 setIsModalSubmitting(true);
 await executeStatusChange(wonModalLead.id, (pendingTargetStatus as LeadStatus) || 'won', { dealValue });
 setWonModalLead(null);
 } finally {
 setIsModalSubmitting(false);
 }
 };

 // ۱۳. تأیید مدال انصراف و رد لید (lost)
 const handleConfirmLostLead = async (lostReason: string) => {
 if (!lostModalLead || isModalSubmitting) return;
 try {
 setIsModalSubmitting(true);
 await executeStatusChange(lostModalLead.id, (pendingTargetStatus as LeadStatus) || 'lost', { lostReason });
 setLostModalLead(null);
 } finally {
 setIsModalSubmitting(false);
 }
 };

 // پیمایش سریع به ستون در موبایل
 const scrollToMobileColumn = (status: LeadStatus) => {
 setMobileActiveColumn(status);
 const el = columnRefs.current[status];
 if (el) {
 el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
 }
 };

 if (isRouteDenied) {
  return (
   <div className="space-y-6" dir="rtl">
    <Breadcrumb
     items={[
      { label: 'فروش و لید', href: '/leads' },
      { label: 'برد پیگیری لید', href: '/leads/board' },
      { label: 'عدم دسترسی' },
     ]}
    />

    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-sm">
     <ShieldAlert className="mx-auto h-12 w-12 text-rose-600" aria-hidden="true" />
     <h2 className="mt-3 text-lg font-bold text-rose-950">
      عدم دسترسی به برد پیگیری لیدها
     </h2>
     <p className="mt-2 max-w-md mx-auto text-xs sm:text-sm text-rose-800 leading-relaxed">
      نقش کاربری شما مجوز دسترسی به برد پیگیری لیدها را ندارد.
     </p>
     <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Link
       href="/"
       className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition"
      >
       <span>داشبورد اصلی</span>
      </Link>
     </div>
    </div>
   </div>
  );
 }

 return (
 <div className="space-y-6" dir="rtl">
 {/* هدر صفحه و انتخاب نمای کاربری */}
 <div className="relative overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E]/80 backdrop-blur-md p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="absolute top-0 right-0 -ms-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
 <div className="relative z-10">
 <Breadcrumb
 items={[
 { label: 'فروش و لید', href: '/leads' },
 { label: 'برد پیگیری لید' },
 ]}
 />
 <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
 <span className="w-2.5 h-6 bg-gradient-to-b from-[#719BDF] to-blue-600 rounded-full inline-block" />
 برد پیگیری لیدها
 </h1>
 <p className="mt-1 text-xs sm:text-sm text-slate-400">
 گردش کار لیدها، مدیریت مراحل مذاکره فروش و نظارت بصری بر ارزش معاملات
 </p>
 </div>

 {/* سوییچر تغییر نما (صندوق / برد) و دکمه لید جدید */}
 <div className="relative z-10 flex items-center gap-2.5 shrink-0">
 <div className="flex items-center p-1 bg-[#18263A] rounded-xl border border-[#1F2E45]">
 <Link
 href="/leads"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all"
 >
 <Inbox size={14} />
 <span>صندوق لیدها</span>
 </Link>
 <span
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111D2E] text-[#719BDF] border border-[#1F2E45] shadow-sm"
 >
 <Kanban size={14} />
 <span>برد پیگیری</span>
 </span>
 </div>

 <Button
 type="button"
 variant="primary"
 disabled
 className="cursor-not-allowed opacity-50 flex items-center gap-2 text-xs bg-[#18263A] text-slate-400 border border-[#1F2E45]"
 title="فرم ثبت لید جدید در مراحل بعدی اضافه می‌شود."
 >
 <Plus size={15} />
 <span>لید جدید</span>
 <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-normal">
 به‌زودی
 </span>
 </Button>
 </div>
 </div>

 {/* نوار فیلترها (FilterBar) هماهنگ با URL */}
 <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl">
 <FilterBar
 showSearch
 searchPlaceholder="جستجو بر اساس نام، شماره تماس، شرکت یا ایمیل..."
 searchValue={searchInput}
 onSearchChange={setSearchInput}
 showDateRange
 dateRangePlaceholder="بازه تاریخ ورود..."
 dateRange={dateRange}
 onDateRangeChange={handleDateRangeChange}
 filtersConfig={filtersConfig}
 selectedFilters={selectedFilters}
 onFilterChange={handleFilterChange}
 hasActiveFilters={hasActiveFilters}
 onClearAll={handleClearAll}
 />
 </div>

 {/* نوار پیمایش سریع بین ستون‌ها در موبایل */}
 <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
 {displayColumns.map((col) => {
 const st = col.key;
 const colLeads = leads.filter(
  (l) => resolveLeadColumnKey(l) === st
 );
 const isActive = mobileActiveColumn === st;
 return (
 <button
 key={col.id || st}
 type="button"
 onClick={() => scrollToMobileColumn(st as LeadStatus)}
 className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
 isActive
 ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
 : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 '
 }`}
 >
 <span>{col.label}</span>
 <span
 className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
 isActive
 ? 'bg-white/20 text-white'
 : 'bg-gray-100 text-gray-600 '
 }`}
 >
 {toPersianDigits(colLeads.length)}
 </span>
 </button>
 );
 })}
 </div>

 {/* حالت بارگذاری اسکلتون */}
 {loading ? (
 <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
 {Array.from({ length: 6 }).map((_, i) => (
 <div
 key={i}
 className="flex-1 min-w-[280px] h-96 rounded-2xl bg-gray-50 border border-gray-200 animate-pulse p-3 space-y-3"
 >
 <div className="h-6 w-3/4 rounded bg-gray-200 " />
 <div className="h-28 rounded-xl bg-gray-100 " />
 <div className="h-28 rounded-xl bg-gray-100 " />
 </div>
 ))}
 </div>
 ) : error ? (
 // حالت خطای سرویس
 <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center ">
 <AlertCircle
 className="mx-auto h-12 w-12 text-rose-500 "
 aria-hidden="true"
 />
 <h2 className="mt-3 text-base font-bold text-rose-900 ">
 خطا در بارگذاری برد پیگیری لیدها
 </h2>
 <p className="mt-1 text-xs sm:text-sm text-rose-700 ">
 {error}
 </p>
 <div className="mt-5 flex items-center justify-center gap-3">
 <button
 type="button"
 onClick={() => fetchLeads()}
 className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-rose-700"
 >
 <RefreshCw className="h-4 w-4" aria-hidden="true" />
 <span>تلاش مجدد</span>
 </button>
 </div>
 </div>
 ) : leads.length === 0 && hasActiveFilters ? (
 // حالت نبود نتیجه برای فیلترها
 <div className="rounded-2xl border border-gray-200 bg-white p-6 ">
 <EmptyState
 title="نتیجه‌ای برای فیلترهای انتخابی یافت نشد"
 description="با بازنشانی فیلترها می‌توانید تمام ستون‌ها و لیدهای فعال برد را مشاهده فرمایید."
 action={{
 label: 'پاک کردن تمام فیلترها',
 onClick: handleClearAll,
 }}
 />
 </div>
 ) : (
 // کانتینر اصلی ستون‌های برد کانبان
 <div
 className="flex gap-4 overflow-x-auto pb-5 snap-x snap-mandatory select-none scrollbar-thin scrollbar-thumb-gray-200 "
 dir="rtl"
 >
 {displayColumns.map((col) => {
 const status = col.key;
 const columnLeads = leads.filter(
  (lead) => resolveLeadColumnKey(lead) === status
 );
 return (
 <div
 key={col.id || status}
 ref={(el) => {
 columnRefs.current[status] = el;
 }}
 className="snap-start flex-1 min-w-[280px]"
 >
 <KanbanColumn
 status={status as LeadStatus}
 statusConfig={col}
 availableStatuses={availableStatusesOptions}
 isDropDisabled={!col.isActive}
 leads={columnLeads}
 isDragOver={dragOverColumn === status}
 draggingLeadId={draggingLeadId}
 onDragStart={(_, id) => setDraggingLeadId(id)}
 onDragEnd={() => {
 setDraggingLeadId(null);
 setDragOverColumn(null);
 }}
 onDragOver={(st) => setDragOverColumn(st)}
 onDragLeave={() => setDragOverColumn(null)}
 onDrop={handleLeadDrop}
 onCopyPhone={handleCopyPhone}
 onMobileStatusChange={handleMobileStatusChange}
 />
 </div>
 );
 })}
 </div>
 )}

 {/* مدال ثبت خرید موفق (won) */}
 <KanbanWonDealModal
 isOpen={Boolean(wonModalLead)}
 lead={wonModalLead}
 isLoading={isModalSubmitting}
 onConfirm={handleConfirmWonDeal}
 onClose={() => setWonModalLead(null)}
 />

 {/* مدال ثبت انصراف و رد لید (lost) */}
 <KanbanLostLeadModal
 isOpen={Boolean(lostModalLead)}
 lead={lostModalLead}
 isLoading={isModalSubmitting}
 onConfirm={handleConfirmLostLead}
 onClose={() => setLostModalLead(null)}
 />
 </div>
 );
}

export default function LeadsBoardPage() {
 return (
 <React.Suspense
 fallback={
 <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
 {Array.from({ length: 6 }).map((_, i) => (
 <div
 key={i}
 className="flex-1 min-w-[280px] h-96 rounded-2xl bg-gray-50 border border-gray-200 animate-pulse"
 />
 ))}
 </div>
 }
 >
 <LeadsBoardContent />
 </React.Suspense>
 );
}
