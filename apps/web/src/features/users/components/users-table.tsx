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
 * تولید استایل اختصاصی برای هر نقش کاربری در تم Midnight Executive
 */
function getRoleBadgeStyle(role: UserRole): { bg: string; text: string; border: string } {
  switch (role) {
    case 'admin':
      return { bg: 'bg-[#719BDF]/15', text: 'text-[#719BDF]', border: 'border-[#719BDF]/30' };
    case 'marketing_manager':
      return { bg: 'bg-[#3B82F6]/15', text: 'text-[#93C5FD]', border: 'border-[#3B82F6]/30' };
    case 'campaign_manager':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    case 'sales_agent':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'content_creator':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'client':
      return { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' };
    default:
      return { bg: 'bg-[#18263A]', text: 'text-slate-300', border: 'border-[#1F2E45]' };
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
 * تولید آواتار حروف اول نام با استایل لوکس
 */
function renderUserAvatar(user: UserItem) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className="w-9 h-9 rounded-full object-cover border border-[#1F2E45] shrink-0"
      />
    );
  }

  const parts = user.fullName.trim().split(/\s+/);
  const initials =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0]}‌${parts[parts.length - 1][0]}`;

  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#719BDF]/30 to-[#1D4ED8]/40 border border-[#719BDF]/30 text-[#719BDF] flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-[0_0_8px_rgba(113,155,223,0.15)]">
      {initials}
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
  const activeAdminsCount = React.useMemo(() => {
    return users.filter((u) => u.role === 'admin' && u.status === 'active').length;
  }, [users]);

  // ۱. حالت بارگذاری (Loading Skeleton)
  if (isLoading) {
    return (
      <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] overflow-hidden shadow-lg p-6 space-y-4" dir="rtl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1F2E45]">
          <div className="h-5 w-32 bg-[#18263A] rounded-md animate-pulse" />
          <div className="h-8 w-24 bg-[#18263A] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#1F2E45]/40 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#18263A] animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-[#18263A] rounded animate-pulse" />
                  <div className="h-3 w-40 bg-[#18263A] rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-[#18263A] rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-[#18263A] rounded-full animate-pulse" />
              <div className="h-4 w-24 bg-[#18263A] rounded animate-pulse" />
              <div className="h-8 w-24 bg-[#18263A] rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ۲. حالت بدون داده (Empty State)
  if (users.length === 0) {
    return (
      <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-12 text-center shadow-lg space-y-4" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-[#18263A] text-slate-400 mx-auto flex items-center justify-center border border-[#1F2E45]">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-100">کاربری یافت نشد</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            هیچ کاربری با فیلترهای انتخابی مطابقت ندارد یا هنوز کاربری به سامانه دعوت نشده است.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="border-[#1F2E45] bg-[#18263A] text-slate-200 hover:bg-[#1F2E45]"
            >
              <RotateCcw size={14} className="me-1.5" />
              بارگذاری مجدد
            </Button>
          )}
          {onInviteClick && (
            <Button
              variant="primary"
              size="sm"
              onClick={onInviteClick}
              className="bg-gradient-to-r from-[#719BDF] to-[#3B82F6] text-white border-0"
            >
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
      <div className="hidden md:block bg-[#111D2E] rounded-2xl border border-[#1F2E45] shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0E1726]/90 border-b border-[#1F2E45]">
              <TableHead className="text-right font-bold text-slate-400 py-3.5 px-4 text-xs">
                کاربر
              </TableHead>
              <TableHead className="text-right font-bold text-slate-400 py-3.5 px-4 text-xs">
                نقش سازمانی
              </TableHead>
              <TableHead className="text-right font-bold text-slate-400 py-3.5 px-4 text-xs">
                وضعیت حساب
              </TableHead>
              <TableHead className="text-right font-bold text-slate-400 py-3.5 px-4 text-xs">
                شماره تماس
              </TableHead>
              <TableHead className="text-right font-bold text-slate-400 py-3.5 px-4 text-xs">
                آخرین ورود
              </TableHead>
              <TableHead className="text-left font-bold text-slate-400 py-3.5 px-4 text-xs">
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
                  className="hover:bg-[#18263A]/50 border-b border-[#1F2E45]/60 last:border-0 transition-colors"
                >
                  {/* ۱. ستون کاربر */}
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {renderUserAvatar(user)}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100">
                            {user.fullName}
                          </span>
                          {user.role === 'admin' && (
                            <span title="ادمین ارشد">
                              <Shield size={13} className="text-[#719BDF] inline shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono" dir="ltr">
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
                  <TableCell className="py-3 px-4 text-xs text-slate-300">
                    {user.phoneNumber ? (
                      <span className="font-mono tabular-nums">{user.phoneNumber}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </TableCell>

                  {/* ۵. ستون آخرین ورود */}
                  <TableCell className="py-3 px-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-500" />
                      <span className="tabular-nums">{formatLastLogin(user.lastLoginAt)}</span>
                    </div>
                  </TableCell>

                  {/* ۶. ستون عملیات */}
                  <TableCell className="py-3 px-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {onChangeRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onChangeRole(user)}
                          title="تغییر نقش کاربری"
                          className="h-8 px-2.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-[#18263A] rounded-xl"
                        >
                          تغییر نقش
                        </Button>
                      )}

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
                            className={`h-8 px-2.5 text-xs rounded-xl ${
                              isLastActiveAdmin
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-[#D66B73] hover:text-rose-300 hover:bg-[#D66B73]/15'
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
                          className="h-8 px-2.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 rounded-xl"
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
                          className="h-8 px-2.5 text-xs text-[#719BDF] hover:text-[#93C5FD] hover:bg-[#719BDF]/15 rounded-xl"
                        >
                          <Send size={12} className="me-1" />
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
              className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] shadow-lg space-y-3 text-slate-100"
            >
              {/* هدر کارت کاربر */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {renderUserAvatar(user)}
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                      {user.fullName}
                      {user.role === 'admin' && (
                        <Shield size={12} className="text-[#719BDF]" />
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono" dir="ltr">
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
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#1F2E45]/60">
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
                  <span className="text-slate-300 font-medium tabular-nums">
                    {formatLastLogin(user.lastLoginAt)}
                  </span>
                </div>
              </div>

              {/* دکمه‌های عملیات موبایل */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]/60">
                {onChangeRole && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangeRole(user)}
                    className="h-8 text-xs flex-1 border-[#1F2E45] bg-[#18263A] text-slate-200"
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
                        ? 'opacity-40 cursor-not-allowed border-[#1F2E45]'
                        : 'text-[#D66B73] border-[#D66B73]/30 hover:bg-[#D66B73]/10'
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
                    className="h-8 text-xs flex-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    فعال‌سازی
                  </Button>
                )}

                {user.status === 'invited' && onResendInvite && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResendInvite(user)}
                    className="h-8 text-xs flex-1 text-[#719BDF] border-[#719BDF]/30 hover:bg-[#719BDF]/10"
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
