'use client';

import * as React from 'react';
import {
  Check,
  Minus,
  Shield,
  Layers,
  Inbox,
  Settings,
  HelpCircle,
  Eye,
  UserCheck,
  Sliders,
  FileSpreadsheet,
  Info,
  Ban,
  Sparkles,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  PRODUCT_PAGE_PERMISSIONS,
  PagePermissionDefinition,
  PageAccessType,
  PermissionOrigin,
  ACCESS_TYPE_LABELS,
} from '@/lib/permissions';
import {
  UserRole,
  USER_ROLE_LABELS,
  USER_ROLES,
} from '../types';

export interface AccessMatrixTableProps {
  className?: string;
  matrixData?: any;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const WORKSPACE_ICONS: Record<string, React.ElementType> = {
  general: Info,
  performance: Layers,
  sales_leads: Inbox,
  execution_knowledge: Sliders,
  settings: Settings,
};

function AccessTypeBadge({
  type,
  origin,
}: {
  type: PageAccessType;
  origin?: PermissionOrigin;
}) {
  const isProductDecision = origin === 'product_decision';

  switch (type) {
    case 'full':
      return (
        <span
          title={`دسترسی کامل به صفحه (${isProductDecision ? 'تصمیم قطعی محصول' : 'صریح PDF'})`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
        >
          <Check size={11} className="stroke-[3]" />
          <span>کامل</span>
          {isProductDecision && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
              title="منشأ: تصمیم قطعی محصول"
            />
          )}
        </span>
      );

    case 'read':
      return (
        <span
          title="فقط‌خواندنی و مشاهده اطلاعات بدون امکان ویرایش یا ثبت"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs"
        >
          <Eye size={11} />
          <span>مشاهده</span>
        </span>
      );

    case 'own_records':
      return (
        <span
          title="محدود به اطلاعات و رکوردهای متعلق به خود کاربر"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs"
        >
          <UserCheck size={11} />
          <span>داده‌های خود</span>
        </span>
      );

    case 'scoped':
      return (
        <span
          title="دسترسی محدود به دامنه مشخص در سند"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs"
        >
          <Sliders size={11} />
          <span>محدود</span>
        </span>
      );

    case 'needs_product_decision':
      return (
        <span
          title="نیازمند تصمیم محصولی: نقش در سند صراحتاً برای این صفحه قید نشده یا تعیین تکلیف نشده است"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
        >
          <HelpCircle size={11} className="text-amber-600" />
          <span>تصمیم محصولی</span>
        </span>
      );

    case 'denied':
      return (
        <span
          title="عدم دسترسی صریح و ممنوعیت مستند"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
        >
          <Ban size={11} className="text-rose-600" />
          <span>ممنوع</span>
        </span>
      );

    case 'not_specified':
    default:
      return (
        <span
          title="در سربرگ این صفحه در مستند برای این نقش دسترسی ذکر نشده است (نامشخص)"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
        >
          <Minus size={11} className="text-slate-400" />
          <span>نامشخص</span>
        </span>
      );
  }
}

export function AccessMatrixTable({
  className = '',
  isLoading = false,
}: AccessMatrixTableProps) {
  // پشتیبانی از لودینگ اسکلتون
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse" dir="rtl">
        <div className="h-20 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  // گروه‌بندی صفحات ۲۹ گانه بر اساس فضای کاری
  // دسته‌بندی‌های عملیاتی ماژول: performance_campaigns | sales_leads | tasks_settings
  const workspaces = React.useMemo(() => {
    const map = new Map<string, { title: string; pages: PagePermissionDefinition[] }>();
    PRODUCT_PAGE_PERMISSIONS.forEach((page) => {
      if (!map.has(page.workspace)) {
        map.set(page.workspace, {
          title: page.workspaceTitle,
          pages: [],
        });
      }
      map.get(page.workspace)!.pages.push(page);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* هدر راهنما و عنوان ماتریس */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Shield size={17} className="text-blue-600" />
              <span>ماتریس دسترسی نقش‌ها و صفحات محصول (تطبیق کامل ۲۹ صفحه با تصمیم‌های محصولی)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              بر مبنای سربرگ‌های ۲۹ صفحه مستند مرجع «Marketing Platform – Phase 1: Frontend Pages» و تثبیت تصمیم‌های قطعی محصول
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              <Sparkles size={14} className="text-blue-600" />
              <span>دسترسی سراسری ادمین فعال</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <FileSpreadsheet size={14} className="text-slate-600" />
              <span>۲۹ صفحه محصول</span>
            </div>
          </div>
        </div>

        {/* راهنمای وضعیت‌های سلول‌ها و منشأ مجوزها */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">راهنمای وضعیت‌ها:</span>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="full" origin="pdf" />
            <span className="text-slate-600 text-[11px]">دسترسی کامل (PDF)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="full" origin="product_decision" />
            <span className="text-slate-600 text-[11px]">کامل (تصمیم محصولی •)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="read" />
            <span className="text-slate-600 text-[11px]">فقط مشاهده</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="own_records" />
            <span className="text-slate-600 text-[11px]">فقط داده‌های خود</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="scoped" />
            <span className="text-slate-600 text-[11px]">محدود به دامنه</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="not_specified" />
            <span className="text-slate-600 text-[11px]">ذکرنشده در سند</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="needs_product_decision" />
            <span className="text-slate-600 text-[11px]">نیازمند تصمیم</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AccessTypeBadge type="denied" />
            <span className="text-slate-600 text-[11px]">ممنوع صریح</span>
          </div>
        </div>
      </div>

      {/* جدول اصلی ماتریس دسترسی ۲۹ صفحه‌ای */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow className="bg-slate-50/90 border-b border-slate-200">
                <TableHead className="text-right font-black text-slate-800 py-3.5 px-4 text-xs w-[340px]">
                  صفحه محصول و مسیر (Route)
                </TableHead>
                {USER_ROLES.map((role) => (
                  <TableHead
                    key={role}
                    className="text-center font-black text-slate-800 py-3.5 px-2 text-xs"
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span>{USER_ROLE_LABELS[role]}</span>
                      <span className="text-[10px] font-mono text-slate-400">{role}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {workspaces.map(([wsKey, { title, pages }]) => {
                const WsIcon = WORKSPACE_ICONS[wsKey] || Layers;

                return (
                  <React.Fragment key={wsKey}>
                    {/* سطر هدر فضای کاری */}
                    <TableRow className="bg-slate-100/80 border-y border-slate-200/90 select-none">
                      <TableCell
                        colSpan={USER_ROLES.length + 1}
                        className="py-2.5 px-4 text-xs font-black text-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <WsIcon size={15} className="text-blue-600" />
                          <span>{title}</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            ({pages.length.toLocaleString('fa-IR')} صفحه)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* ردیف‌های صفحات زیرمجموعه این فضای کاری */}
                    {pages.map((p) => (
                      <TableRow
                        key={p.pageNumber}
                        className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0 transition-colors"
                      >
                        {/* ستون اول: شماره، عنوان، روت، وضعیت پیاده‌سازی و توضیحات */}
                        <TableCell className="py-3 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                                {p.pageNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {p.title}
                              </span>
                              {p.isImplemented ? (
                                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                                  پیاده‌شده
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                  فاقد صفحه مستقل
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-600 dir-ltr text-left">
                              <span className="text-slate-400 font-sans text-[10px]">PDF: </span>
                              <span className="text-blue-600 bg-blue-50/70 px-1 py-0.5 rounded text-[10px]">{p.pdfRoute}</span>
                            </div>
                            {p.actualRoute && p.actualRoute !== p.pdfRoute && (
                              <div className="text-[11px] font-mono text-slate-600 dir-ltr text-left">
                                <span className="text-slate-400 font-sans text-[10px]">واقعی: </span>
                                <span className="text-emerald-700 bg-emerald-50/70 px-1 py-0.5 rounded text-[10px]">{p.actualRoute}</span>
                              </div>
                            )}
                            <p className="text-[10px] text-slate-400">
                              <span className="text-slate-500 font-medium">قید در سربرگ:</span>{' '}
                              {p.pdfRolesRaw}
                            </p>
                            {p.decisionNote && (
                              <p className="text-[10px] text-blue-700 bg-blue-50/70 px-1.5 py-0.5 rounded border border-blue-200/60 leading-relaxed">
                                <span className="font-bold">تصمیم محصول:</span> {p.decisionNote}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* ستون‌های نقش‌ها */}
                        {USER_ROLES.map((role) => {
                          const accessType = p.access[role] || 'not_specified';
                          const origin = p.origins?.[role] || 'pdf';
                          return (
                            <TableCell key={role} className="py-3 px-2 text-center align-middle">
                              <AccessTypeBadge type={accessType} origin={origin} />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
