/**
 * منبع حقیقت متمرکز ماتریس دسترسی صفحات و مجوزهای سیستم
 * استخراج‌شده مستقیماً از مستند مرجع: Marketing Platform – Phase 1: Frontend Pages
 * و اعمال تصمیم‌های قطعی محصولی (دسترسی کامل Admin و نگاشت عنوان «مدیر» به marketing_manager)
 */

import type { UserRole } from '@/features/users/types';

/**
 * انواع ۷‌گانه دسترسی به صفحات محصول در مدل نهایی
 */
export type PageAccessType =
  | 'full'                   // دسترسی کامل صریح در سند یا مطابق تصمیم قطعی محصول
  | 'read'                   // دسترسی فقط‌خواندنی
  | 'own_records'            // دسترسی محدود به رکوردهای متعلق به کاربر
  | 'scoped'                 // دسترسی محدود به دامنه مشخص‌شده
  | 'not_specified'          // سند درباره دسترسی این نقش اظهارنظر نکرده است
  | 'needs_product_decision' // موضوع همچنان نیازمند تصمیم محصولی است
  | 'denied';                // ممنوعیت صریح و مستند وجود دارد

/**
 * منشأ استخراج مجوز: استخراج از PDF یا بر اساس تصمیم قطعی محصول
 */
export type PermissionOrigin = 'pdf' | 'product_decision';

export interface PagePermissionDefinition {
  pageNumber: number;
  title: string;
  workspace: 'general' | 'performance' | 'sales_leads' | 'execution_knowledge' | 'settings';
  workspaceTitle: string;
  pdfRoute: string;
  actualRoute: string | null;
  routes: string[]; // مسیرهای مورد استفاده جهت تطابق روت در Next.js
  isImplemented: boolean;
  pageFilePath?: string | null;
  pdfRolesRaw: string;
  access: Record<UserRole, PageAccessType>;
  origins: Record<UserRole, PermissionOrigin>;
  restrictionsNote?: string;
  decisionNote?: string;
}

/**
 * برچسب‌های فارسی انواع دسترسی جهت نمایش در رابط کاربری
 */
export const ACCESS_TYPE_LABELS: Record<PageAccessType, string> = {
  full: 'دسترسی کامل',
  read: 'فقط مشاهده',
  own_records: 'فقط داده‌های خود',
  scoped: 'محدود به دامنه',
  not_specified: 'ذکرنشده در سند',
  needs_product_decision: 'نیازمند تصمیم محصولی',
  denied: 'ممنوع صریح',
};

/**
 * ماتریس ۲۹ صفحه‌ای دسترسی استخراج‌شده از مستند محصول و تثبیت‌شده با تصمیم‌های قطعی
 */
export const PRODUCT_PAGE_PERMISSIONS: PagePermissionDefinition[] = [
  // --- عمومی ---
  {
    pageNumber: 1,
    title: 'ورود و انتخاب سازمان',
    workspace: 'general',
    workspaceTitle: 'عمومی',
    pdfRoute: '/login , /forgot-password , /select-org',
    actualRoute: '/login , /forgot-password , /select-org',
    routes: ['/login', '/forgot-password', '/select-org'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(auth)/login/page.tsx',
    pdfRolesRaw: 'همه (پیش از ورود)',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'full',
      content_creator: 'full',
      client: 'full',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'دسترسی عمومی پیش از ورود برای همه؛ انتخاب سازمان پس از ورود',
  },
  {
    pageNumber: 2,
    title: 'صفحه خانه (به‌ازای نقش)',
    workspace: 'general',
    workspaceTitle: 'عمومی',
    pdfRoute: '/',
    actualRoute: '/',
    routes: ['/'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/page.tsx',
    pdfRolesRaw: 'همه؛ محتوا بر اساس نقش',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'scoped',
      sales_agent: 'scoped',
      content_creator: 'scoped',
      client: 'scoped',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'محتوای صفحه خانه در قالب شبکه ویجت‌های ۱۲ ستونی بر اساس نقش کاربر به صورت اختصاصی نمایش داده می‌شود',
    decisionNote: 'تفکیک کامل صفحه خانه از داشبورد اجرایی؛ پیاده‌سازی ویجت‌های اختصاصی هر نقش بر مبنای ص ۶ و ۷ مستند PDF بدون ریدایرکت کورکورانه',
  },
  {
    pageNumber: 3,
    title: 'نوتیفیکیشن‌ها',
    workspace: 'general',
    workspaceTitle: 'عمومی',
    pdfRoute: '/notifications',
    actualRoute: null,
    routes: ['/notifications'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'همه',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'full',
      content_creator: 'full',
      client: 'full',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'شامل کشوی هدر و صفحه کامل اعلان‌ها',
  },

  // --- فضای کاری ۱: عملکرد ---
  {
    pageNumber: 4,
    title: 'داشبورد اجرایی',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/dashboard',
    actualRoute: '/performance/dashboard',
    routes: ['/performance/dashboard'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/performance/dashboard/page.tsx',
    pdfRolesRaw: 'کارفرما، مدیر مارکتینگ',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'not_specified',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'read',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کارفرما صرفاً ناظر و مشاهده‌کننده شاخص‌ها و نمودارها است',
    decisionNote: 'مسیر اصلی داشبورد به /performance/dashboard منتقل شد. دسترسی ادمین طبق تصمیم قطعی محصول کامل است.',
  },
  {
    pageNumber: 5,
    title: 'لیست کمپین‌ها',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/campaigns',
    actualRoute: '/campaigns',
    routes: ['/campaigns', '/performance/campaigns'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/campaigns/page.tsx',
    pdfRolesRaw: 'مدیر مارکتینگ، کمپین‌چی (فقط کمپین‌های خود)، کارفرما (فقط‌خواندنی)',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'own_records',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'read',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کمپین‌چی فقط کمپین‌های خود را می‌بیند؛ کارفرما دسترسی فقط‌خواندنی دارد',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 6,
    title: 'ساخت و ویرایش کمپین (ویزارد)',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/campaigns/new , /performance/campaigns/:id/edit',
    actualRoute: '/campaigns/new , /campaigns/[id]/edit',
    routes: ['/campaigns/new', '/campaigns/:id/edit', '/performance/campaigns/new', '/performance/campaigns/:id/edit'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/campaigns/new/page.tsx',
    pdfRolesRaw: 'مدیر مارکتینگ، کمپین‌چی',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'denied',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کارفرما صراحتاً حق ساخت یا تغییر کمپین ندارد (فقط‌خواندنی بودن کارفرما در سند)',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 7,
    title: 'جزئیات کمپین',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/campaigns/:id/...',
    actualRoute: '/campaigns/[id]',
    routes: ['/campaigns/:id', '/performance/campaigns/:id'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/campaigns/[id]/page.tsx',
    pdfRolesRaw: 'مدیر مارکتینگ، کمپین‌چی، کارفرما',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'scoped',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'read',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کارفرما دسترسی فقط‌خواندنی دارد و عملیات توقف، ویرایش یا ثبت هزینه برای او مجاز نیست',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 8,
    title: 'پلتفرم‌ها',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/platforms',
    actualRoute: '/performance/platforms',
    routes: ['/performance/platforms'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/performance/platforms/page.tsx',
    pdfRolesRaw: 'ادمین، مدیر مارکتینگ',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'not_specified',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'تعریف کانال‌های تبلیغاتی و تنظیمات دریافت داده',
  },
  {
    pageNumber: 9,
    title: 'هزینه‌ها',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/costs',
    actualRoute: '/performance/costs',
    routes: ['/performance/costs'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/performance/costs/page.tsx',
    pdfRolesRaw: 'کمپین‌چی، مدیر مارکتینگ، کارفرما (فقط‌خواندنی)',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'read',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کارفرما فقط جدول هزینه‌ها را مشاهده می‌کند و دکمه ثبت هزینه یا ایمپورت برای او مسدود است',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 10,
    title: 'Import داده',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/imports , /performance/imports/new',
    actualRoute: '/performance/imports',
    routes: ['/performance/imports', '/performance/imports/new'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/performance/imports/page.tsx',
    pdfRolesRaw: 'کمپین‌چی، مدیر مارکتینگ، فروش (فقط لید)',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'scoped',
      content_creator: 'not_specified',
      client: 'denied',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کارشناس فروش منحصراً مجاز به ایمپورت فایل‌های حاوی داده‌های نوع «لید» است؛ کارفرما ممنوع است',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 11,
    title: 'KPI و شاخص‌ها',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/kpis',
    actualRoute: '/performance/kpis',
    routes: ['/performance/kpis'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/performance/kpis/page.tsx',
    pdfRolesRaw: 'مدیر مارکتینگ، ادمین',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'read',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'فرمول‌ساز و تنظیم قواعد هشدار',
  },
  {
    pageNumber: 12,
    title: 'مخاطبان',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/audiences , /performance/audiences/:id',
    actualRoute: '/performance/audiences',
    routes: ['/performance/audiences', '/performance/audiences/:id'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/performance/audiences/page.tsx',
    pdfRolesRaw: 'مدیر مارکتینگ',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'read',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'تعریف و مدیریت پرسونای مخاطبان و گروه‌های هدف',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 13,
    title: 'لندینگ و UTM',
    workspace: 'performance',
    workspaceTitle: 'عملکرد و کمپین‌ها',
    pdfRoute: '/performance/landing',
    actualRoute: '/performance/landing',
    routes: ['/performance/landing'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/performance/landing/page.tsx',
    pdfRolesRaw: 'مدیر مارکتینگ، کمپین‌چی',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'سازنده UTM و رصد صفحات فرود متصل',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },

  // --- فضای کاری ۲: فروش و لید ---
  {
    pageNumber: 14,
    title: 'صندوق لیدها',
    workspace: 'sales_leads',
    workspaceTitle: 'فروش و سرنخ‌ها',
    pdfRoute: '/leads',
    actualRoute: '/leads',
    routes: ['/leads'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/leads/page.tsx',
    pdfRolesRaw: 'کارشناس فروش (فقط لیدهای خود)، مدیر',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'not_specified',
      sales_agent: 'own_records',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کارشناس فروش در صندوق صرفاً لیدهای تخصیص‌یافته به خود را می‌بیند',
    decisionNote: 'عنوان «مدیر» مطابق تصمیم قطعی محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },
  {
    pageNumber: 15,
    title: 'برد پیگیری لید',
    workspace: 'sales_leads',
    workspaceTitle: 'فروش و سرنخ‌ها',
    pdfRoute: '/leads/board',
    actualRoute: '/leads/board',
    routes: ['/leads/board'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/leads/board/page.tsx',
    pdfRolesRaw: 'کارشناس فروش، مدیر',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'not_specified',
      sales_agent: 'own_records',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'جابه‌جایی کارت‌ها بین ستون‌های وضعیت پیگیری؛ فروش فقط لیدهای خود را می‌بیند',
    decisionNote: 'عنوان «مدیر» مطابق تصمیم قطعی محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },
  {
    pageNumber: 16,
    title: 'جزئیات لید و مسیر لید',
    workspace: 'sales_leads',
    workspaceTitle: 'فروش و سرنخ‌ها',
    pdfRoute: '/leads/:id',
    actualRoute: '/leads/[id]',
    routes: ['/leads/:id'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/leads/[id]/page.tsx',
    pdfRolesRaw: 'کارشناس فروش، مدیر',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'not_specified',
      sales_agent: 'own_records',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'ثبت تماس، یادداشت و پیشبرد لید؛ فروش صرفاً به لیدهای تخصیص‌یافته به خود دسترسی دارد',
    decisionNote: 'عنوان «مدیر» مطابق تصمیم قطعی محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },
  {
    pageNumber: 17,
    title: 'پیامک',
    workspace: 'sales_leads',
    workspaceTitle: 'فروش و سرنخ‌ها',
    pdfRoute: '/leads/sms , /leads/sms/:id',
    actualRoute: '/leads/sms',
    routes: ['/leads/sms', '/leads/sms/:id'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/leads/sms/page.tsx',
    pdfRolesRaw: 'مدیر مارکتینگ، کمپین‌چی',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'not_specified',
      content_creator: 'not_specified',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'گزارش ارسال‌ها و ساخت لید از پاسخ‌دهندگان',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 18,
    title: 'وبینار',
    workspace: 'sales_leads',
    workspaceTitle: 'فروش و سرنخ‌ها',
    pdfRoute: '/leads/webinars , /leads/webinars/:id',
    actualRoute: '/leads/webinars',
    routes: ['/leads/webinars', '/leads/webinars/:id'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/leads/webinars/page.tsx',
    pdfRolesRaw: 'مسئول وبینار، مدیر مارکتینگ',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'not_specified',
      sales_agent: 'not_specified',
      content_creator: 'full',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'ثبت‌نام، حضور و تبدیل حاضران به لید (مسئول وبینار نگاشت‌شده به content_creator)',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },

  // --- فضای کاری ۳: اجرا و دانش ---
  {
    pageNumber: 19,
    title: 'تسک‌ها',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/tasks',
    actualRoute: '/work/tasks',
    routes: ['/work/tasks'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/work/tasks/page.tsx',
    pdfRolesRaw: 'همه',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'full',
      content_creator: 'full',
      client: 'full',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'سوییچ تسک‌های من و تیم، ثبت و پیگیری وظایف',
  },
  {
    pageNumber: 20,
    title: 'تقویم',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/calendar',
    actualRoute: '/work/calendar',
    routes: ['/work/calendar'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/work/calendar/page.tsx',
    pdfRolesRaw: 'همه',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'full',
      sales_agent: 'full',
      content_creator: 'full',
      client: 'full',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'تقویم مشترک کمپین‌ها، رویدادها و جلسات',
  },
  {
    pageNumber: 21,
    title: 'تجهیزات',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/equipment',
    actualRoute: null,
    routes: ['/work/equipment'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'مسئول وبینار، مدیر مارکتینگ',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'not_specified',
      sales_agent: 'not_specified',
      content_creator: 'full',
      client: 'not_specified',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کمبودها و چک‌لیست تجهیزات وبینار و کمپین',
    decisionNote: 'دسترسی ادمین طبق تصمیم قطعی محصول اعمال شد.',
  },
  {
    pageNumber: 22,
    title: 'صورتجلسات',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/meetings , /work/meetings/:id',
    actualRoute: null,
    routes: ['/work/meetings', '/work/meetings/:id'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'مدیر، همه (مشاهده)',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'read',
      sales_agent: 'read',
      content_creator: 'read',
      client: 'read',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'همه کاربران صرفاً مشاهده‌کننده هستند؛ مدیر امکان ایجاد، ویرایش و ارسال دارد',
    decisionNote: 'عنوان «مدیر» مطابق تصمیم قطعی محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },
  {
    pageNumber: 23,
    title: 'SOP (دستورالعمل‌ها)',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/sops , /work/sops/:id',
    actualRoute: null,
    routes: ['/work/sops', '/work/sops/:id'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'همه (مشاهده)، مدیر (ویرایش)',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'read',
      sales_agent: 'read',
      content_creator: 'read',
      client: 'read',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'همه کاربران فقط‌خواندنی؛ مدیر حق مدیریت، ایجاد و ویرایش دارد',
    decisionNote: 'عنوان «مدیر» مطابق تصمیم قطعی محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },
  {
    pageNumber: 24,
    title: 'آموزش',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/learning , /work/learning/me',
    actualRoute: null,
    routes: ['/work/learning', '/work/learning/me'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'همه',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'scoped',
      sales_agent: 'scoped',
      content_creator: 'scoped',
      client: 'scoped',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'همه آموزش‌های خود را می‌بینند؛ تب پیشرفت تیم و تخصیص مختص مدیر است',
    decisionNote: 'اختیارات مدیریتی تیم در آموزش مطابق تصمیم محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },
  {
    pageNumber: 25,
    title: 'ایده‌ها',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/ideas',
    actualRoute: null,
    routes: ['/work/ideas'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'همه (ثبت و رأی)، مدیر (تغییر وضعیت)',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'scoped',
      sales_agent: 'scoped',
      content_creator: 'scoped',
      client: 'scoped',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'همه کاربران امکان ثبت ایده و رأی دارند؛ تغییر وضعیت ایده منحصراً برای marketing_manager و admin مجاز است',
    decisionNote: 'عنوان «مدیر» مطابق تصمیم قطعی محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },
  {
    pageNumber: 26,
    title: 'گزارش فعالیت',
    workspace: 'execution_knowledge',
    workspaceTitle: 'فرآیندها و ابزارها',
    pdfRoute: '/work/activity',
    actualRoute: null,
    routes: ['/work/activity'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'مدیر، کارفرما؛ هر کاربر فقط فعالیت خودش',
    access: {
      admin: 'full',
      marketing_manager: 'full',
      campaign_manager: 'own_records',
      sales_agent: 'own_records',
      content_creator: 'own_records',
      client: 'read',
    },
    origins: {
      admin: 'product_decision',
      marketing_manager: 'product_decision',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'کاربران عادی صرفاً لاگ فعالیت خود را مشاهده می‌کنند؛ مدیر و کارفرما گزارش تجمیعی را می‌بینند',
    decisionNote: 'عنوان «مدیر» مطابق تصمیم قطعی محصول به marketing_manager نگاشت شد. ادمین دسترسی کامل دارد.',
  },

  // --- تنظیمات ---
  {
    pageNumber: 27,
    title: 'کاربران و نقش‌ها',
    workspace: 'settings',
    workspaceTitle: 'تنظیمات',
    pdfRoute: '/settings/users',
    actualRoute: '/settings/users',
    routes: ['/settings/users'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/settings/users/page.tsx',
    pdfRolesRaw: 'ادمین',
    access: {
      admin: 'full',
      marketing_manager: 'denied',
      campaign_manager: 'denied',
      sales_agent: 'denied',
      content_creator: 'denied',
      client: 'denied',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'دعوت اعضا، تغییر نقش‌ها و مشاهده ماتریس دسترسی منحصراً برای ادمین مجاز است',
  },
  {
    pageNumber: 28,
    title: 'تنظیمات سازمان',
    workspace: 'settings',
    workspaceTitle: 'تنظیمات',
    pdfRoute: '/settings/organization',
    actualRoute: '/settings/organization',
    routes: ['/settings/organization'],
    isImplemented: true,
    pageFilePath: 'apps/web/src/app/(app)/settings/organization/page.tsx',
    pdfRolesRaw: 'ادمین',
    access: {
      admin: 'full',
      marketing_manager: 'denied',
      campaign_manager: 'denied',
      sales_agent: 'denied',
      content_creator: 'denied',
      client: 'denied',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'ویرایش مشخصات کسب‌وکار و مقادیر پایه لیست‌ها منحصراً برای ادمین مجاز است',
  },
  {
    pageNumber: 29,
    title: 'اتصال وردپرس',
    workspace: 'settings',
    workspaceTitle: 'تنظیمات',
    pdfRoute: '/settings/wordpress',
    actualRoute: null,
    routes: ['/settings/wordpress'],
    isImplemented: false,
    pageFilePath: null,
    pdfRolesRaw: 'ادمین',
    access: {
      admin: 'full',
      marketing_manager: 'denied',
      campaign_manager: 'denied',
      sales_agent: 'denied',
      content_creator: 'denied',
      client: 'denied',
    },
    origins: {
      admin: 'pdf',
      marketing_manager: 'pdf',
      campaign_manager: 'pdf',
      sales_agent: 'pdf',
      content_creator: 'pdf',
      client: 'pdf',
    },
    restrictionsNote: 'راه‌اندازی وب‌هوک و نگاشت فیلدهای لید فرم‌ها منحصراً برای ادمین مجاز است',
  },
];

/**
 * بررسی تطابق مسیر مشخص با یک پترن روت
 */
function matchRoute(routePattern: string, targetPath: string): boolean {
  if (routePattern === targetPath) return true;
  if (routePattern.includes(':id')) {
    const regexPattern = '^' + routePattern.replace(':id', '[^/]+') + '$';
    return new RegExp(regexPattern).test(targetPath);
  }
  return false;
}

export interface RouteAccessResult {
  allowed: boolean;
  accessType: PageAccessType;
  origin: PermissionOrigin;
  reason: string;
  pageDefinition?: PagePermissionDefinition | null;
}

/**
 * تعیین نوع دسترسی یک نقش به مسیر ورودی بر مبنای جدول مرکزی و تصمیم‌های محصولی
 */
export function getRouteAccess(
  path: string,
  role: UserRole | null,
): RouteAccessResult {
  // ۱. روت‌های عمومی احراز هویت همواره برای همه باز هستند
  if (path === '/login' || path === '/forgot-password' || path === '/select-org') {
    return {
      allowed: true,
      accessType: 'full',
      origin: 'pdf',
      reason: 'مسیر عمومی پیش از احراز هویت (صفحه ۱ مستند)',
      pageDefinition: PRODUCT_PAGE_PERMISSIONS[0],
    };
  }

  // ۲. در صورتی که کاربر وارد نشده باشد، دسترسی به تمام صفحات رد می‌شود
  if (!role) {
    return {
      allowed: false,
      accessType: 'denied',
      origin: 'pdf',
      reason: 'کاربر وارد نشده یا نقشی برای او تعیین نشده است.',
      pageDefinition: null,
    };
  }

  // ۳. جستجوی صفحه متناظر در ماتریس ۲۹ صفحه‌ای
  const found = PRODUCT_PAGE_PERMISSIONS.find((p) =>
    p.routes.some((r) => matchRoute(r, path)),
  );

  // ۴. قاعده صریح محصولی: ادمین دارای دسترسی کامل سراسری به تمام صفحات محصول است
  // این دسترسی وابسته به احراز هویت و انتخاب سازمان فعال است (که پیش‌تر در مرحله ۲ کنترل شد)
  if (role === 'admin') {
    const origin: PermissionOrigin = found?.origins?.admin || 'product_decision';
    return {
      allowed: true,
      accessType: 'full',
      origin,
      reason: 'نقش ادمین مطابق تصمیم قطعی محصول به تمام صفحات پلتفرم دسترسی کامل دارد.',
      pageDefinition: found || null,
    };
  }

  if (!found) {
    // مسیرهای تعریف‌نشده در ماتریس: مسدود می‌شوند و نوع دسترسی not_specified می‌گیرند
    return {
      allowed: false,
      accessType: 'not_specified',
      origin: 'product_decision',
      reason: 'مسیر در ماتریس صفحات ۲۹‌گانه مستند ثبت نشده است.',
      pageDefinition: null,
    };
  }

  const accessType = found.access[role] || 'not_specified';
  const origin = found.origins?.[role] || 'pdf';

  // دسترسی مجاز: فقط در صورتی که نوع دسترسی صریحاً full, read, own_records یا scoped باشد
  const allowed =
    accessType === 'full' ||
    accessType === 'read' ||
    accessType === 'own_records' ||
    accessType === 'scoped';

  let reason = '';
  if (allowed) {
    reason = `دسترسی مجاز: ${ACCESS_TYPE_LABELS[accessType]} (منشأ: ${origin === 'pdf' ? 'مستند PDF' : 'تصمیم محصولی'})`;
  } else if (accessType === 'needs_product_decision') {
    reason = 'دسترسی به این صفحه همچنان نیازمند تصمیم قطعی محصول است.';
  } else if (accessType === 'not_specified') {
    reason = 'در سند مرجع درباره دسترسی این نقش به صفحه اظهارنظری نشده است.';
  } else {
    reason = 'دسترسی این نقش به این صفحه صراحتاً غیرمجاز یا ممنوع است.';
  }

  return {
    allowed,
    accessType,
    origin,
    reason,
    pageDefinition: found,
  };
}

/**
 * تابع بولین سریع بررسی مجوز دسترسی به یک صفحه
 */
export function canAccessRoute(path: string, role: UserRole | null): boolean {
  return getRouteAccess(path, role).allowed;
}

/**
 * ماتریس عملیات درون‌صفحه‌ای (تفکیک دسترسی صفحه از دسترسی عملیات)
 */
export type ActionPermission =
  // تنظیمات و کاربران
  | 'settings.manage'
  | 'users.manage'
  | 'organization.manage'
  | 'wordpress.connect'
  // کمپین‌ها
  | 'campaigns.create'
  | 'campaigns.edit'
  | 'campaigns.delete'
  | 'campaigns.view'
  // هزینه‌ها
  | 'costs.create'
  | 'costs.edit'
  | 'costs.delete'
  | 'costs.view'
  | 'costs.import'
  // لیدها
  | 'leads.view'
  | 'leads.manage'
  | 'leads.call'
  | 'leads.assign'
  | 'leads.import'
  // وظایف و سایر
  | 'tasks.create'
  | 'tasks.edit'
  | 'tasks.view'
  | 'meetings.edit'
  | 'sops.edit'
  | 'ideas.submit'
  | 'ideas.vote'
  | 'ideas.change_status'
  | 'learning.manage_team';

/**
 * تابع ارزیابی دسترسی عملیاتی داخل صفحه (Action-level Permissions)
 * ارزیابی مستقل دسترسی به Route از دسترسی به عملیات
 */
export function canPerformAction(
  action: ActionPermission | string,
  role: UserRole | null,
  context?: { isOwner?: boolean; dataType?: string },
): boolean {
  if (!role) return false;

  // تصمیم صریح محصولی: ادمین به تمامی عملیات پلتفرم دسترسی کامل دارد
  if (role === 'admin') {
    return true;
  }

  switch (action) {
    // ۱. عملیات‌های تنظیمات: صریحاً فقط ادمین
    case 'settings.manage':
    case 'users.manage':
    case 'organization.manage':
    case 'wordpress.connect':
      return false;

    // ۲. عملیات‌های کمپین (صفحات ۶ و ۷ PDF)
    case 'campaigns.create':
      return role === 'marketing_manager' || role === 'campaign_manager';

    case 'campaigns.edit':
      if (role === 'marketing_manager') return true;
      if (role === 'campaign_manager') {
        // کمپین‌چی فقط کمپین‌های خود را می‌تواند ویرایش کند
        return context?.isOwner !== undefined ? context.isOwner : true;
      }
      return false; // کارفرما و سایرین ممنوع

    case 'campaigns.view':
      return role === 'marketing_manager' || role === 'campaign_manager' || role === 'client';

    case 'campaigns.delete':
      // حذف کمپین منحصراً برای مدیر مارکتینگ (و ادمین)
      return role === 'marketing_manager';

    // ۳. عملیات‌های هزینه (صفحه ۹ PDF)
    case 'costs.create':
    case 'costs.edit':
    case 'costs.delete':
    case 'costs.import':
      // کارفرما منحصراً فقط‌خواندنی است؛ کمپین‌چی و مدیر مارکتینگ مجاز هستند
      return role === 'marketing_manager' || role === 'campaign_manager';

    case 'costs.view':
      // کارفرما دسترسی فقط‌خواندنی دارد
      return role === 'marketing_manager' || role === 'campaign_manager' || role === 'client';

    // ۴. عملیات‌های لید (صفحات ۱۴، ۱۵ و ۱۶ PDF)
    case 'leads.view':
    case 'leads.manage':
    case 'leads.call':
      return role === 'marketing_manager' || role === 'sales_agent';

    case 'leads.assign':
      // تخصیص و انتساب مجدد لیدها منحصراً برای مدیر مارکتینگ (و ادمین طبق تصمیم محصولی)
      return role === 'marketing_manager';

    case 'leads.import':
      if (role === 'marketing_manager') return true;
      if (role === 'sales_agent') {
        // کارشناس فروش منحصراً مجاز به ایمپورت داده‌های نوع «لید» است (تخصیص‌یافته به خود)
        return context?.dataType ? context.dataType === 'lead' : true;
      }
      return false;

    // ۵. عملیات‌های تسک (صفحه ۱۹ PDF: همه مجاز)
    case 'tasks.create':
    case 'tasks.edit':
    case 'tasks.view':
      return true;

    // ۶. صورتجلسات و SOP (صفحات ۲۲ و ۲۳ PDF: همه مشاهده، مدیر ویرایش)
    case 'meetings.edit':
    case 'sops.edit':
      // نگاشت مدیر به marketing_manager؛ کاربران عادی فقط مشاهده‌کننده هستند
      return role === 'marketing_manager';

    // ۷. آموزش (صفحه ۲۴ PDF: همه مشاهده آموزش خود، مدیر مدیریت تیم)
    case 'learning.manage_team':
      return role === 'marketing_manager';

    // ۸. ایده‌ها (صفحه ۲۵ PDF: همه ثبت و رای، مدیر تغییر وضعیت)
    case 'ideas.submit':
    case 'ideas.vote':
      return true; // همه نقش‌ها مجاز به ثبت و رای

    case 'ideas.change_status':
      // تغییر وضعیت ایده منحصراً برای marketing_manager (و admin)
      return role === 'marketing_manager';

    default:
      return false;
  }
}
