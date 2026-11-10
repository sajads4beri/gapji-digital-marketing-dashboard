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
  Filter,
  Layers,
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
  UserFilter,
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

  // سوئیچ تب‌ها با به‌روزرسانی پارامتر آدرس بدون رفرش صفحه
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

  // فیلتر کلاینت‌ساید بر مبنای آخرین داده‌های معتبر برای جلوگیری از عدم همگامی
  const filteredUsers = React.useMemo(() => {
    return allUsers.filter((u) => {
      // ۱. فیلتر نقش
      if (selectedRole !== 'all' && u.role !== selectedRole) {
        return false;
      }
      // ۲. فیلتر وضعیت
      if (selectedStatus !== 'all' && u.status !== selectedStatus) {
        return false;
      }
      // ۳. جستجوی متنی
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

  // شمارش ادمین‌های فعال جهت اعمال گارد آخرین ادمین
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

  // فعال‌سازی مجدد کاربر غیرفعال‌شده
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
    <div className="space-y-6 pb-12" dir="rtl">
      {/* ۱. مسیر راهنما (Breadcrumb) */}
      <Breadcrumb
        items={[
          { label: 'تنظیمات سامانه', href: '#' },
          { label: 'کاربران و نقش‌ها' },
        ]}
      />

      {/* ۲. سربرگ اصلی صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-purple-600 rounded-full inline-block" />
            مدیریت کاربران و نقش‌ها
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مدیریت اعضای سازمان، تعیین سطوح دسترسی، دعوت همکاران جدید و بررسی ماتریس نقش‌ها
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="text-xs"
            title="به‌روزرسانی داده‌ها"
          >
            <RefreshCw size={14} className={`ml-1.5 ${loading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteDrawerOpen(true)}
            className="text-xs bg-purple-600 hover:bg-purple-700 shadow-2xs hover:shadow-xs"
          >
            <UserPlus size={14} className="ml-1.5" />
            دعوت کاربر جدید
          </Button>
        </div>
      </div>

      {/* ۳. سوئیچ دو تب اصلی: «کاربران» و «نقش‌ها و دسترسی‌ها» */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700 bg-purple-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users size={16} />
          <span>کاربران سازمان</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'users'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-slate-100 text-slate-600'
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
              ? 'border-purple-600 text-purple-700 bg-purple-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
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
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-slate-500">کل اعضا</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {totalCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-400">نفر</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <UserCheck size={13} />
                <span>کاربران فعال</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                  {activeCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-emerald-600/70">نفر</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                <Clock size={13} />
                <span>دعوت‌شده</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-700">
                  {invitedCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-amber-600/70">نفر</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <UserX size={13} />
                <span>غیرفعال</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-700">
                  {disabledCount.toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-400">نفر</span>
              </div>
            </div>
          </div>

          {/* نوار فیلتر و جستجو */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
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
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchUsers}>
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
          <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-64 w-full bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <UsersManagementContent />
    </React.Suspense>
  );
}
