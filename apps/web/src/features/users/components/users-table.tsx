'use client';

import * as React from 'react';
import {
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Send,
  MoreVertical,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/status-badge';
import { isoToJalali } from '@/lib/persian-date';
import {
  UserItem,
  UserRole,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from '../types';

export interface UsersTableProps {
  users: UserItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onInviteClick?: () => void;
  onChangeRole?: (user: UserItem) => void;
  onDeactivate?: (user: UserItem) => void;
  onActivate?: (user: UserItem) => void;
  onResendInvite?: (user: UserItem) => void;
}

/**
 * تولید استایل اختصاصی برای هر نقش کاربری
 */
function getRoleBadgeStyle(role: UserRole): { bg: string; text: string; border: string } {
  switch (role) {
    case 'admin':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'marketing_manager':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'campaign_manager':
      return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' };
    case 'sales_agent':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'content_creator':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'client':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

/**
 * فرمت‌بندی تاریخ آخرین ورود به شمسی
 */
function formatLastLogin(isoString?: string | null): string {
  if (!isoString) {
    return 'هنوز وارد نشده';
  }
  const j = isoToJalali(isoString);
  return j.isValid ? j.formatted : 'نامعتبر';
}

/**
 * تولید آواتار حروف اول نام در صورت نبود تصویر
 */
function renderUserAvatar(user: UserItem) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className="w-9 h-9 rounded-full object-cover border border-slate-200"
      />
    );
  }

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-200 select-none">
      {initials || 'کاربر'}
    </div>
  );
}

export function UsersTable({
  users,
  isLoading = false,
  onRefresh,
  onInviteClick,
  onChangeRole,
  onDeactivate,
  onActivate,
  onResendInvite,
}: UsersTableProps) {
  // شمارش تعداد ادمین‌های فعال جهت اعمال گارد UI
  const activeAdminsCount = React.useMemo(() => {
    return users.filter((u) => u.role === 'admin' && u.status === 'active').length;
  }, [users]);

  // ۱. حالت بارگذاری (Loading Skeleton)
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4" dir="rtl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-5 w-32 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ۲. حالت بدون داده (Empty State)
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-4" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center border border-slate-100">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">کاربری یافت نشد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            هیچ کاربری با فیلترهای انتخابی مطابقت ندارد یا هنوز کاربری به سامانه دعوت نشده است.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RotateCcw size={14} className="ml-1.5" />
              بارگذاری مجدد
            </Button>
          )}
          {onInviteClick && (
            <Button variant="primary" size="sm" onClick={onInviteClick}>
              دعوت کاربر جدید
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* نمای دسکتاپ: جدول کامل */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 border-b border-slate-200/80">
              <TableHead className="text-right font-bold text-slate-700 py-3.5 px-4 text-xs">
                کاربر
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700 py-3.5 px-4 text-xs">
                نقش سازمانی
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700 py-3.5 px-4 text-xs">
                وضعیت حساب
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700 py-3.5 px-4 text-xs">
                شماره تماس
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700 py-3.5 px-4 text-xs">
                آخرین ورود
              </TableHead>
              <TableHead className="text-left font-bold text-slate-700 py-3.5 px-4 text-xs">
                عملیات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const roleStyle = getRoleBadgeStyle(user.role);
              const isLastActiveAdmin =
                user.role === 'admin' && user.status === 'active' && activeAdminsCount === 1;

              return (
                <TableRow
                  key={user.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0 transition-colors"
                >
                  {/* ۱. ستون کاربر */}
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {renderUserAvatar(user)}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            {user.fullName}
                          </span>
                          {user.role === 'admin' && (
                            <span title="ادمین ارشد">
                              <Shield size={13} className="text-purple-600 inline shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono" dir="ltr">
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* ۲. ستون نقش */}
                  <TableCell className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                    >
                      {USER_ROLE_LABELS[user.role] || user.role}
                    </span>
                  </TableCell>

                  {/* ۳. ستون وضعیت */}
                  <TableCell className="py-3 px-4">
                    <StatusBadge
                      status={user.status}
                      label={USER_STATUS_LABELS[user.status] || user.status}
                    />
                  </TableCell>

                  {/* ۴. ستون شماره تماس */}
                  <TableCell className="py-3 px-4 text-xs text-slate-600">
                    {user.phoneNumber ? (
                      <span className="font-mono">{user.phoneNumber}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>

                  {/* ۵. ستون آخرین ورود */}
                  <TableCell className="py-3 px-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>{formatLastLogin(user.lastLoginAt)}</span>
                    </div>
                  </TableCell>

                  {/* ۶. ستون عملیات */}
                  <TableCell className="py-3 px-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* دکمه تغییر نقش */}
                      {onChangeRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onChangeRole(user)}
                          title="تغییر نقش کاربری"
                          className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          تغییر نقش
                        </Button>
                      )}

                      {/* عملیات بر اساس وضعیت */}
                      {user.status === 'active' && onDeactivate && (
                        <div className="relative inline-block">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isLastActiveAdmin}
                            onClick={() => onDeactivate(user)}
                            title={
                              isLastActiveAdmin
                                ? 'تنها ادمین فعال سامانه قابل غیرفعال‌سازی نیست'
                                : 'غیرفعال‌سازی حساب کاربری'
                            }
                            className={`h-8 px-2 text-xs ${
                              isLastActiveAdmin
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            غیرفعال‌سازی
                          </Button>
                          {isLastActiveAdmin && (
                            <span className="sr-only">تنها ادمین فعال</span>
                          )}
                        </div>
                      )}

                      {user.status === 'disabled' && onActivate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onActivate(user)}
                          title="فعال‌سازی مجدد حساب کاربری"
                          className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          فعال‌سازی
                        </Button>
                      )}

                      {user.status === 'invited' && onResendInvite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResendInvite(user)}
                          title="ارسال مجدد دعوت‌نامه"
                          className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Send size={12} className="ml-1" />
                          ارسال مجدد
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* نمای موبایل: لیست کارت‌های واکنش‌گرا */}
      <div className="md:hidden space-y-3">
        {users.map((user) => {
          const roleStyle = getRoleBadgeStyle(user.role);
          const isLastActiveAdmin =
            user.role === 'admin' && user.status === 'active' && activeAdminsCount === 1;

          return (
            <div
              key={user.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
            >
              {/* هدر کارت کاربر */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {renderUserAvatar(user)}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      {user.fullName}
                      {user.role === 'admin' && (
                        <Shield size={12} className="text-purple-600" />
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono" dir="ltr">
                      {user.email}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={user.status}
                  label={USER_STATUS_LABELS[user.status] || user.status}
                />
              </div>

              {/* مشخصات فرعی */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">نقش سازمانی:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                  >
                    {USER_ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">آخرین ورود:</span>
                  <span className="text-slate-700 font-medium">
                    {formatLastLogin(user.lastLoginAt)}
                  </span>
                </div>
              </div>

              {/* دکمه‌های عملیات موبایل */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {onChangeRole && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangeRole(user)}
                    className="h-8 text-xs flex-1"
                  >
                    تغییر نقش
                  </Button>
                )}

                {user.status === 'active' && onDeactivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLastActiveAdmin}
                    onClick={() => onDeactivate(user)}
                    className={`h-8 text-xs flex-1 ${
                      isLastActiveAdmin
                        ? 'opacity-40 cursor-not-allowed'
                        : 'text-rose-600 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    غیرفعال‌سازی
                  </Button>
                )}

                {user.status === 'disabled' && onActivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActivate(user)}
                    className="h-8 text-xs flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    فعال‌سازی
                  </Button>
                )}

                {user.status === 'invited' && onResendInvite && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResendInvite(user)}
                    className="h-8 text-xs flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    ارسال مجدد
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
