'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
 Plus,
 UploadCloud,
 UserCheck,
 RefreshCw,
 AlertCircle,
 Inbox,
 RotateCcw,
 CheckSquare,
 Square,
 HelpCircle,
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
 type LeadActor,
 type LeadFilters,
 LeadsTable,
 LeadInboxMobileCard,
 LeadBulkAssignModal,
 LeadBulkStatusModal,
 LeadCreateModal,
} from '@/features/leads';
import { useAuth } from '@/features/auth';

function LeadsInboxContent() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const { toast } = useToast();
 const { user, activeRole, can, canAccessRoute } = useAuth();
 const canAssign = can('leads.assign');
 const isRouteDenied =
 activeRole === 'campaign_manager' ||
 activeRole === 'client' ||
 activeRole === 'content_creator' ||
 (activeRole !== null && !canAccessRoute('/leads'));

 // ۱. خواندن پارامترهای فیلتر از URL جهت حفظ پس از Refresh و ناوبری مرورگر
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

 // وضعیت محلی جستجو با Debounce جهت تجربه کاربری روان
 const [searchInput, setSearchInput] = React.useState(searchQuery);
 React.useEffect(() => {
 setSearchInput(searchQuery);
 }, [searchQuery]);

 // ۲. وضعیت داده‌ها، بارگذاری و خطای صفحه
 const [leads, setLeads] = React.useState<LeadDetail[]>([]);
 const [loading, setLoading] = React.useState(true);
 const [error, setError] = React.useState<string | null>(null);

 // ۳. وضعیت انتخاب سطرها و مدال‌های عملیات گروهی
 const [selectedRowIds, setSelectedRowIds] = React.useState<string[]>([]);
 const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
 const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
 const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
 const [isBulkLoading, setIsBulkLoading] = React.useState(false);

 // ۴. دریافت داده‌ها از سرویس واقعی لیدها
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
 // طبق ص ۱۴ مستند محصول: کارشناس فروش (فقط لیدهای خود)
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
 err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرویس لیدها'
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

 React.useEffect(() => {
 fetchLeads();
 }, [fetchLeads]);

 // ۵. به‌روزرسانی پارامترهای URL با هماهنگی فیلترها
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

 // تغییر فیلتر جستجو با تاخیر زمانی (Debounce)
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
 label: 'وضعیت',
 type: 'multi-select',
 options: [
 { label: 'جدید', value: 'new' },
 { label: 'تماس گرفته شد', value: 'in_progress' },
 { label: 'واجد شرایط', value: 'qualified' },
 { label: 'پیشنهاد', value: 'proposal' },
 { label: 'مشتری', value: 'won' },
 { label: 'ردشده', value: 'lost' },
 ],
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
 []
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

 // ۶. کپی شماره تماس با Clipboard API و اعلان Toast
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

 // ۷. عملیات گروهی: تخصیص کارشناس
 const handleConfirmBulkAssign = async (rep: LeadActor) => {
 if (isBulkLoading) return;
 if (!canAssign) {
 toast.error('خطای دسترسی: شما مجوز تخصیص لیدها را ندارید.');
 return;
 }
 try {
 setIsBulkLoading(true);
 const res = await leadService.bulkAssign(selectedRowIds, rep);

 if (res.failed.length === 0) {
 toast.success(
 `${toPersianDigits(res.succeeded.length)} لید با موفقیت به ${rep.name} تخصیص یافت.`
 );
 setSelectedRowIds([]);
 } else {
 toast.warning(
 `${toPersianDigits(res.succeeded.length)} لید تخصیص یافت، ولی ${toPersianDigits(
 res.failed.length
 )} لید با خطا مواجه شد.`
 );
 // حفظ ردیف‌های ناموفق جهت تلاش مجدد (Partial Failure Retention)
 setSelectedRowIds(res.failed.map((f) => f.id));
 }

 setIsAssignModalOpen(false);
 await fetchLeads();
 } catch (err) {
 toast.error(
 err instanceof Error ? err.message : 'خطای پیش‌بینی‌نشده در تخصیص گروهی لیدها'
 );
 } finally {
 setIsBulkLoading(false);
 }
 };

 // ۸. عملیات گروهی: تغییر وضعیت
 const handleConfirmBulkStatus = async (newStatus: LeadStatus) => {
 if (isBulkLoading) return;
 try {
 setIsBulkLoading(true);
 const res = await leadService.bulkUpdateStatus(selectedRowIds, newStatus);

 if (res.failed.length === 0) {
 toast.success(
 `وضعیت ${toPersianDigits(res.succeeded.length)} لید با موفقیت به‌روزرسانی شد.`
 );
 setSelectedRowIds([]);
 } else {
 toast.warning(
 `وضعیت ${toPersianDigits(
 res.succeeded.length
 )} لید تغییر کرد، ولی ${toPersianDigits(res.failed.length)} لید ناموفق بود.`
 );
 // حفظ ردیف‌های ناموفق جهت تلاش مجدد
 setSelectedRowIds(res.failed.map((f) => f.id));
 }

 setIsStatusModalOpen(false);
 await fetchLeads();
 } catch (err) {
 toast.error(
 err instanceof Error ? err.message : 'خطای پیش‌بینی‌نشده در تغییر وضعیت گروهی لیدها'
 );
 } finally {
 setIsBulkLoading(false);
 }
 };

 // مدیریت انتخاب سراسری در کارت‌های موبایل
 const handleToggleMobileSelectAll = () => {
 if (selectedRowIds.length === leads.length) {
 setSelectedRowIds([]);
 } else {
 setSelectedRowIds(leads.map((l) => l.id));
 }
 };

 const handleToggleMobileSelect = (id: string) => {
 setSelectedRowIds((prev) =>
 prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
 );
 };

 if (isRouteDenied) {
 return (
 <div className="space-y-6" dir="rtl">
 <Breadcrumb
 items={[
 { label: 'فروش و لید', href: '/leads' },
 { label: 'صندوق لیدها' },
 { label: 'عدم دسترسی' },
 ]}
 />

 <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-sm">
 <ShieldAlert className="mx-auto h-12 w-12 text-rose-600" aria-hidden="true" />
 <h2 className="mt-3 text-lg font-bold text-rose-950">
 عدم دسترسی به صندوق لیدها
 </h2>
 <p className="mt-2 max-w-md mx-auto text-xs sm:text-sm text-rose-800 leading-relaxed">
 نقش کاربری شما مجوز دسترسی به صندوق لیدها را ندارد.
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
 {/* هدر صفحه و نوار عنوان */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <Breadcrumb
 items={[
 { label: 'فروش و لید', href: '/leads' },
 { label: 'صندوق لیدها' },
 ]}
 />
 <h1 className="mt-2 text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
 صندوق لیدها
 </h1>
 <p className="mt-1 text-xs sm:text-sm text-gray-500 ">
 مدیریت، پیگیری و غربالگری لیدهای جذب‌شده از کلیه کمپین‌ها و کانال‌های بازاریابی
 </p>
 </div>

 {/* دکمه‌های اکشن هدر: طبق سند Phase 1 (غیرفعال با نشان به‌زودی جهت پرهیز از رفتارهای ساختگی) */}
 <div className="flex items-center gap-2.5 shrink-0">
 <Button
 type="button"
 variant="outline"
 disabled
 className="cursor-not-allowed opacity-70 flex items-center gap-2 text-xs"
 title="قابلیت واردسازی دسته‌جمعی داده‌ها در مراحل بعدی توسعه اضافه خواهد شد."
 >
 <UploadCloud size={15} />
 <span>Import</span>
 <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-normal">
 به‌زودی
 </span>
 </Button>

 <Button
 type="button"
 variant="primary"
 onClick={() => setIsCreateModalOpen(true)}
 className="flex items-center gap-2 text-xs font-bold"
 title="ثبت دستی لید جدید در سامانه"
 >
 <Plus size={15} />
 <span>لید جدید</span>
 </Button>
 </div>
 </div>

 {/* نوار فیلترها (FilterBar مشترک) */}
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

 {/* نوار اقدامات گروهی شناور در صورت انتخاب سطرها (برای موبایل و دسکتاپ) */}
 {selectedRowIds.length > 0 && (
 <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-blue-50/90 border border-blue-200 animate-in fade-in">
 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-950 ">
 <span>{toPersianDigits(selectedRowIds.length)} لید انتخاب شده است</span>
 </div>

 <div className="flex items-center gap-2">
 {canAssign && (
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => setIsAssignModalOpen(true)}
 className="flex items-center gap-1.5 text-xs bg-white "
 >
 <UserCheck size={14} className="text-blue-600" />
 <span>تخصیص به کارشناس</span>
 </Button>
 )}

 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => setIsStatusModalOpen(true)}
 className="flex items-center gap-1.5 text-xs bg-white "
 >
 <RefreshCw size={14} className="text-indigo-600" />
 <span>تغییر وضعیت</span>
 </Button>

 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => setSelectedRowIds([])}
 className="text-xs text-gray-600 hover:text-gray-900"
 >
 لغو انتخاب
 </Button>
 </div>
 </div>
 )}

 {/* حالت بارگذاری اسکلتون */}
 {loading ? (
 <div className="space-y-4" dir="rtl">
 <div className="h-10 w-full rounded-2xl bg-gray-100 animate-pulse" />
 <div className="h-80 w-full rounded-2xl bg-gray-50 border border-gray-200 animate-pulse" />
 </div>
 ) : error ? (
 // حالت خطای سرویس همراه با دکمه تلاش مجدد
 <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center ">
 <AlertCircle
 className="mx-auto h-12 w-12 text-rose-500 "
 aria-hidden="true"
 />
 <h2 className="mt-3 text-base font-bold text-rose-900 ">
 خطا در بارگذاری صندوق لیدها
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
 ) : leads.length === 0 ? (
 // حالت خالی (Empty State)
 <div className="rounded-2xl border border-gray-200 bg-white p-6 ">
 {hasActiveFilters ? (
 <EmptyState
 title="نتیجه‌ای برای فیلترهای انتخابی یافت نشد"
 description="با تغییر یا بازنشانی فیلترها می‌توانید لیدهای بیشتری را مشاهده کنید."
 action={{
 label: 'پاک کردن تمام فیلترها',
 onClick: handleClearAll,
 }}
 />
 ) : (
 <EmptyState
 title="صندوق لیدها خالی است"
 description="هنوز هیچ لیدی در سامانه ثبت نشده یا لیدهای موجود پاک‌سازی شده‌اند."
 icon={<Inbox size={26} className="text-gray-400" />}
 />
 )}
 </div>
 ) : (
 <>
 {/* حالت دسکتاپ: جدول لیدها بر پایه DataTable مشترک */}
 <div className="hidden lg:block">
 <LeadsTable
 data={leads}
 loading={loading}
 error={error}
 selectedRowIds={selectedRowIds}
 onRowSelectionChange={setSelectedRowIds}
 onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
 onCopyPhone={handleCopyPhone}
 />
 </div>

 {/* حالت موبایل و تبلت: فهرست کارتی ریسپانسیو */}
 <div className="lg:hidden space-y-3.5">
 {/* نوار کنترل انتخاب موبایل */}
 <div className="flex items-center justify-between px-1">
 <button
 type="button"
 onClick={handleToggleMobileSelectAll}
 className="flex items-center gap-2 text-xs font-semibold text-gray-700 "
 >
 {selectedRowIds.length === leads.length ? (
 <CheckSquare size={16} className="text-blue-600" />
 ) : (
 <Square size={16} className="text-gray-400" />
 )}
 <span>
 {selectedRowIds.length === leads.length
 ? 'لغو انتخاب همه'
 : 'انتخاب همه لیدها'}
 </span>
 </button>

 <span className="text-xs text-gray-400">
 {toPersianDigits(leads.length)} مورد
 </span>
 </div>

 {/* کارت‌های ریسپانسیو لیدها */}
 <div className="space-y-3">
 {leads.map((lead) => (
 <LeadInboxMobileCard
 key={lead.id}
 lead={lead}
 isSelected={selectedRowIds.includes(lead.id)}
 onToggleSelect={handleToggleMobileSelect}
 onCopyPhone={handleCopyPhone}
 />
 ))}
 </div>
 </div>
 </>
 )}

 {/* مدال تخصیص گروهی لیدها */}
 {canAssign && (
 <LeadBulkAssignModal
 isOpen={isAssignModalOpen}
 onClose={() => setIsAssignModalOpen(false)}
 selectedCount={selectedRowIds.length}
 isLoading={isBulkLoading}
 onConfirm={handleConfirmBulkAssign}
 />
 )}

 {/* مدال تغییر وضعیت گروهی لیدها */}
 <LeadBulkStatusModal
 isOpen={isStatusModalOpen}
 onClose={() => setIsStatusModalOpen(false)}
 selectedCount={selectedRowIds.length}
 isLoading={isBulkLoading}
 onConfirm={handleConfirmBulkStatus}
 />

 {/* مدال ثبت دستی لید جدید */}
 <LeadCreateModal
 isOpen={isCreateModalOpen}
 onClose={() => setIsCreateModalOpen(false)}
 onSuccess={() => fetchLeads()}
 />
 </div>
 );
}

export default function LeadsInboxPage() {
 return (
 <React.Suspense
 fallback={
 <div className="space-y-4" dir="rtl">
 <div className="h-10 w-full rounded-2xl bg-gray-100 animate-pulse" />
 <div className="h-80 w-full rounded-2xl bg-gray-50 border border-gray-200 animate-pulse" />
 </div>
 }
 >
 <LeadsInboxContent />
 </React.Suspense>
 );
}
