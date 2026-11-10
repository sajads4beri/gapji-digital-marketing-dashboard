import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Share2,
  DollarSign,
  UploadCloud,
  Target,
  Users,
  Link2,
  Inbox,
  Kanban,
  GitBranch,
  MessageSquare,
  Video,
  CheckSquare,
  Calendar,
  Box,
  FileText,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Activity,
  ShieldCheck,
  Building2,
  Globe,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  comingSoon?: boolean;
  permissionRoute?: string;
  matchPattern?: (pathname: string) => boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export const navigationConfig: NavGroup[] = [
  {
    id: 'performance',
    title: 'فضای کاری ۱: عملکرد',
    defaultOpen: true,
    items: [
      {
        id: 'dashboard',
        title: 'داشبورد اجرایی',
        href: '/performance/dashboard', // مسیر اختصاصی داشبورد اجرایی (ورودی صفحه خانه: href: '/')
        icon: LayoutDashboard,
        permissionRoute: '/performance/dashboard',
        matchPattern: (pathname) => pathname === '/performance/dashboard',
      },
      {
        id: 'campaigns-list',
        title: 'لیست کمپین‌ها',
        href: '/campaigns',
        icon: Layers,
        permissionRoute: '/campaigns',
        matchPattern: (pathname) =>
          pathname === '/campaigns' ||
          (pathname.startsWith('/campaigns/') &&
            !pathname.endsWith('/new') &&
            !pathname.endsWith('/edit')),
      },
      {
        id: 'campaign-create',
        title: 'ساخت کمپین (ویزارد)',
        href: '/campaigns/new',
        icon: PlusCircle,
        permissionRoute: '/campaigns/new',
        matchPattern: (pathname) =>
          pathname === '/campaigns/new' || pathname.endsWith('/edit'),
      },
      {
        id: 'platforms',
        title: 'پلتفرم‌ها',
        href: '#',
        icon: Share2,
        comingSoon: true,
        permissionRoute: '/performance/platforms',
      },
      {
        id: 'costs',
        title: 'هزینه‌ها',
        href: '/performance/costs',
        icon: DollarSign,
        permissionRoute: '/performance/costs',
        matchPattern: (pathname) => pathname.startsWith('/performance/costs'),
      },
      {
        id: 'data-import',
        title: 'Import داده',
        href: '#',
        icon: UploadCloud,
        comingSoon: true,
        permissionRoute: '/performance/imports',
      },
      {
        id: 'kpis',
        title: 'KPI و شاخص‌ها',
        href: '#',
        icon: Target,
        comingSoon: true,
        permissionRoute: '/performance/kpis',
      },
      {
        id: 'audiences',
        title: 'مخاطبان',
        href: '#',
        icon: Users,
        comingSoon: true,
        permissionRoute: '/performance/audiences',
      },
      {
        id: 'landing-utm',
        title: 'لندینگ و UTM',
        href: '#',
        icon: Link2,
        comingSoon: true,
        permissionRoute: '/performance/landing',
      },
    ],
  },
  {
    id: 'sales-leads',
    title: 'فضای کاری ۲: فروش و لید',
    defaultOpen: false,
    items: [
      {
        id: 'leads-inbox',
        title: 'صندوق لیدها',
        href: '/leads',
        icon: Inbox,
        permissionRoute: '/leads',
        matchPattern: (pathname) => pathname === '/leads',
      },
      {
        id: 'leads-board',
        title: 'برد پیگیری لید',
        href: '/leads/board',
        icon: Kanban,
        permissionRoute: '/leads/board',
        matchPattern: (pathname) => pathname === '/leads/board',
      },
      {
        id: 'leads-path',
        title: 'جزئیات لید و مسیر لید',
        href: '/leads/lead-101',
        icon: GitBranch,
        permissionRoute: '/leads/:id',
      },
      {
        id: 'sms',
        title: 'پیامک',
        href: '#',
        icon: MessageSquare,
        comingSoon: true,
        permissionRoute: '/leads/sms',
      },
      {
        id: 'webinars',
        title: 'وبینار',
        href: '#',
        icon: Video,
        comingSoon: true,
        permissionRoute: '/leads/webinars',
      },
    ],
  },
  {
    id: 'execution-knowledge',
    title: 'فضای کاری ۳: اجرا و دانش',
    defaultOpen: false,
    items: [
      {
        id: 'tasks',
        title: 'تسک‌ها',
        href: '/work/tasks',
        icon: CheckSquare,
        permissionRoute: '/work/tasks',
        matchPattern: (pathname) => pathname.startsWith('/work/tasks'),
      },
      {
        id: 'calendar',
        title: 'تقویم',
        href: '#',
        icon: Calendar,
        comingSoon: true,
        permissionRoute: '/work/calendar',
      },
      {
        id: 'equipment',
        title: 'تجهیزات',
        href: '#',
        icon: Box,
        comingSoon: true,
        permissionRoute: '/work/equipment',
      },
      {
        id: 'meetings',
        title: 'صورتجلسات',
        href: '#',
        icon: FileText,
        comingSoon: true,
        permissionRoute: '/work/meetings',
      },
      {
        id: 'sops',
        title: 'SOP (دستورالعمل‌ها)',
        href: '#',
        icon: BookOpen,
        comingSoon: true,
        permissionRoute: '/work/sops',
      },
      {
        id: 'learning',
        title: 'آموزش',
        href: '#',
        icon: GraduationCap,
        comingSoon: true,
        permissionRoute: '/work/learning',
      },
      {
        id: 'ideas',
        title: 'ایده‌ها',
        href: '#',
        icon: Lightbulb,
        comingSoon: true,
        permissionRoute: '/work/ideas',
      },
      {
        id: 'activity-report',
        title: 'گزارش فعالیت',
        href: '#',
        icon: Activity,
        comingSoon: true,
        permissionRoute: '/work/activity',
      },
    ],
  },
  {
    id: 'settings',
    title: 'تنظیمات',
    defaultOpen: false,
    items: [
      {
        id: 'users-roles',
        title: 'کاربران و نقش‌ها',
        href: '/settings/users',
        icon: ShieldCheck,
        permissionRoute: '/settings/users',
        matchPattern: (pathname) => pathname.startsWith('/settings/users'),
      },
      {
        id: 'organization-settings',
        title: 'تنظیمات سازمان',
        href: '/settings/organization',
        icon: Building2,
        permissionRoute: '/settings/organization',
        matchPattern: (pathname) => pathname.startsWith('/settings/organization'),
      },
      {
        id: 'wordpress-integration',
        title: 'اتصال وردپرس',
        href: '#',
        icon: Globe,
        comingSoon: true,
        permissionRoute: '/settings/wordpress',
      },
    ],
  },
];
