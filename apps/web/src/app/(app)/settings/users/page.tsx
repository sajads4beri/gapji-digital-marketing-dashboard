'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Clock,
  UserX,
  Sparkles,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterConfig } from '@/components/common/filter-bar';
import { useToast } from '@/components/common/toast-provider';
import {
  userService,
  UserItem,
  UserRole,
  UserStatus,
  USER_ROLES,
  USER_ROLE_LABELS,
  UsersTable,
  InviteUserDrawer,
  DeactivateUserModal,
  ChangeRoleModal,
  AccessMatrixTable,
} from '@/features/users';

const USERS_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: 'role',
    label: 'نقش سازمانی',
    placeholder: 'همه نقش‌ها',
    options: [
      { label: 'همه نقش‌ها', value: 'all' },
      ...USER_ROLES.map((role) => ({
        label: USER_ROLE_LABELS[role],
        value: role,
      })),
    ],
  },
  {
    id: 'status',
    label: 'وضعیت حساب',
    placeholder: 'همه وضعیت‌ها',
    options: [
      { label: 'همه وضعیت‌ها', value: 'all' },
      { label: 'فعال', value: 'active' },
      { label: 'دعوت‌شده', value: 'invited' },
      { label: 'غیرفعال', value: 'disabled' },
    ],
  },
];

type ActiveTab = 'users' | 'matrix';

function UsersManagementContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // خواندن تب فعال از URL با پیش‌فرض 'users'
  const tabParam = (searchParams.get('tab') as ActiveTab) || 'users';
  const activeTab: ActiveTab = tabParam === 'matrix' ? 'matrix' : 'users';

  // State داده‌ها
  const [allUsers, setAllUsers] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // فیلترها و جستجو
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = React.useState<UserStatus | 'all'>('all');

  // کنترل وضعیت مودال‌ها و دراورها
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = React.useState(false);
  const [userToChangeRole, setUserToChangeRole] = React.useState<UserItem | null>(null);
  const [userToDeactivate, setUserToDeactivate] = React.useState<UserItem | null>(null);

  // واکشی داده‌های کاربران از سرویس
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAllUsers();
      setAllUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      const msg = err?.message || 'خطا در بارگذاری فهرست کاربران.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // سوئیچ تب‌ها با به‌روزرسانی پارامتر آدرس
  const handleTabChange = (tab: ActiveTab) => {
    const current = new URLSearchParams(searchParams.toString());
    if (tab === 'users') {
      current.delete('tab');
    } else {
      current.set('tab', tab);
    }
    const qs = current.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // فیلتر کلاینت‌ساید
  const filteredUsers = React.useMemo(() => {
    return allUsers.filter((u) => {
      if (selectedRole !== 'all' && u.role !== selectedRole) {
        return false;
      }
      if (selectedStatus !== 'all' && u.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = u.fullName.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const phoneMatch = u.phoneNumber ? u.phoneNumber.includes(q) : false;
        if (!nameMatch && !emailMatch && !phoneMatch) {
          return false;
        }
      }
      return true;
    });
  }, [allUsers, selectedRole, selectedStatus, searchQuery]);

  // آمار خلاصه کاربران
  const totalCount = allUsers.length;
  const activeCount = allUsers.filter((u) => u.status === 'active').length;
  const invitedCount = allUsers.filter((u) => u.status === 'invited').length;
  const disabledCount = allUsers.filter((u) => u.status === 'disabled').length;

  const activeAdminsCount = React.useMemo(() => {
    return allUsers.filter((u) => u.role === 'admin' && u.status === 'active').length;
  }, [allUsers]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedRole !== 'all' || selectedStatus !== 'all';

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedRole('all');
    setSelectedStatus('all');
  };

  // فعال‌سازی مجدد کاربر
  const handleActivateUser = async (user: UserItem) => {
    try {
      await userService.activateUser(user.id);
      toast.success(`حساب کاربری «${user.fullName}» با موفقیت فعال شد.`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در فعال‌سازی کاربر.');
    }
  };

  // ارسال مجدد دعوت‌نامه
  const handleResendInvite = async (user: UserItem) => {
    try {
      const result = await userService.resendInvitation(user.id);
      toast.success(result.message);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ارسال مجدد دعوت‌نامه.');
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-100" dir="rtl">
      {/* ۱. مسیر راهنما (Breadcrumb) */}
      <Breadcrumb
        items={[
          { label: 'تنظیمات سامانه', href: '#' },
          { label: 'کاربران و نقش‌ها' },
        ]}
      />

      {/* ۲. سربرگ اصلی صفحه با استایل لوکس Midnight Executive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5 font-display">
            <span className="w-2.5 h-6 bg-[#719BDF] rounded-full inline-block shadow-[0_0_12px_rgba(113,155,223,0.4)]" />
            <span>مدیریت کاربران و نقش‌ها</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            مدیریت اعضای سازمان، تعیین سطوح دسترسی، دعوت همکاران جدید و بررسی ماتریس نقش‌ها
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="text-xs border-[#1F2E45] bg-[#111D2E] text-slate-200 hover:bg-[#18263A] hover:border-[#719BDF]/40 transition-all"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw size={14} className={`me-1.5 ${loading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteDrawerOpen(true)}
            className="text-xs bg-gradient-to-r from-[#719BDF] to-[#3B82F6] hover:from-[#5e8bd8] hover:to-[#2563eb] text-white shadow-[0_0_15px_rgba(113,155,223,0.25)] border-0 transition-all"
          >
            <UserPlus size={14} className="me-1.5" />
            دعوت کاربر جدید
          </Button>
        </div>
      </div>

      {/* ۳. سوئیچ دو تب اصلی: «کاربران» و «نقش‌ها و دسترسی‌ها» */}
      <div className="flex border-b border-[#1F2E45]">
        <button
          type="button"
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-[#719BDF] text-[#719BDF] bg-[#111D2E] rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-[#1F2E45]'
          }`}
        >
          <Users size={16} />
          <span>کاربران سازمان</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold tabular-nums ${
              activeTab === 'users'
                ? 'bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30'
                : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
            }`}
          >
            {totalCount.toLocaleString('fa-IR')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('matrix')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-[#719BDF] text-[#719BDF] bg-[#111D2E] rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-[#1F2E45]'
          }`}
        >
          <ShieldCheck size={16} />
          <span>نقش‌ها و دسترسی‌ها</span>
        </button>
      </div>

      {/* ۴. محتوای تب کاربران */}
      {activeTab === 'users' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* کارت‌های آمار خلاصه وضعیت کاربران */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] shadow-lg space-y-1">
              <span className="text-[11px] font-medium text-slate-400">کل اعضا</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-slate-100 tabular-nums">
                  {totalCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-500">نفر</span>
              </div>
            </div>

            <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] shadow-lg space-y-1">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <UserCheck size={13} />
                <span>کاربران فعال</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                  {activeCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-emerald-500/70">نفر</span>
              </div>
            </div>

            <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] shadow-lg space-y-1">
              <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
                <Clock size={13} />
                <span>دعوت‌شده</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
                  {invitedCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-amber-500/70">نفر</span>
              </div>
            </div>

            <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] shadow-lg space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <UserX size={13} />
                <span>غیرفعال</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-slate-400 tabular-nums">
                  {disabledCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-500">نفر</span>
              </div>
            </div>
          </div>

          {/* نوار فیلتر و جستجو */}
          <div className="bg-[#111D2E] p-4 rounded-2xl border border-[#1F2E45] shadow-lg">
            <FilterBar
              showSearch={true}
              searchPlaceholder="جستجوی نام، ایمیل یا شماره تماس..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filtersConfig={USERS_FILTER_CONFIGS}
              selectedFilters={{
                role: selectedRole,
                status: selectedStatus,
              }}
              onFilterChange={(filterId, val) => {
                const singleVal = Array.isArray(val) ? val[0] : val;
                if (filterId === 'role') {
                  setSelectedRole((singleVal as UserRole | 'all') || 'all');
                } else if (filterId === 'status') {
                  setSelectedStatus((singleVal as UserStatus | 'all') || 'all');
                }
              }}
              hasActiveFilters={hasActiveFilters}
              onClearAll={handleClearAllFilters}
            />
          </div>

          {/* پیام خطای دریافت اطلاعات */}
          {error && (
            <div className="bg-[#D66B73]/15 p-4 rounded-2xl border border-[#D66B73]/30 text-xs text-[#D66B73] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#D66B73] shrink-0" />
                <span>{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                className="border-[#D66B73]/30 text-[#D66B73] hover:bg-[#D66B73]/10"
              >
                تلاش دوباره
              </Button>
            </div>
          )}

          {/* جدول اصلی کاربران */}
          <UsersTable
            users={filteredUsers}
            isLoading={loading}
            onRefresh={fetchUsers}
            onInviteClick={() => setIsInviteDrawerOpen(true)}
            onChangeRole={(u) => setUserToChangeRole(u)}
            onDeactivate={(u) => setUserToDeactivate(u)}
            onActivate={handleActivateUser}
            onResendInvite={handleResendInvite}
          />
        </div>
      )}

      {/* ۵. محتوای تب نقش‌ها و دسترسی‌ها */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <AccessMatrixTable onRefresh={fetchUsers} />
        </div>
      )}

      {/* ۶. کشوی دعوت کاربر جدید */}
      <InviteUserDrawer
        isOpen={isInviteDrawerOpen}
        onClose={() => setIsInviteDrawerOpen(false)}
        onSuccess={async () => {
          await fetchUsers();
        }}
      />

      {/* ۷. مودال تغییر نقش */}
      <ChangeRoleModal
        isOpen={Boolean(userToChangeRole)}
        user={userToChangeRole}
        activeAdminsCount={activeAdminsCount}
        onClose={() => setUserToChangeRole(null)}
        onSuccess={async () => {
          await fetchUsers();
        }}
      />

      {/* ۸. مودال غیرفعال‌سازی کاربر */}
      <DeactivateUserModal
        isOpen={Boolean(userToDeactivate)}
        user={userToDeactivate}
        activeAdminsCount={activeAdminsCount}
        onClose={() => setUserToDeactivate(null)}
        onSuccess={async () => {
          await fetchUsers();
        }}
      />
    </div>
  );
}

export default function UsersManagementPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 p-6" dir="rtl">
          <div className="h-6 w-48 bg-[#18263A] rounded-md animate-pulse" />
          <div className="h-10 w-full bg-[#18263A] rounded-xl animate-pulse" />
          <div className="h-64 w-full bg-[#18263A] rounded-2xl animate-pulse" />
        </div>
      }
    >
      <UsersManagementContent />
    </React.Suspense>
  );
}
