import type { TimelineEvent } from './types';
import { getTodayIsoDate } from '@/lib/persian-date';
import { getYesterdayIsoDate } from './timeline-date';

const todayIso = getTodayIsoDate();
const yesterdayIso = getYesterdayIsoDate();

/**
 * مجموعه‌ای از داده‌های Mock نمونه برای تست جامع کلیه سناریوهای Timeline
 */
export const MOCK_TIMELINE_EVENTS: TimelineEvent[] = [
  // سناریو ۱: رویداد کاربر با آواتار و توضیحات
  {
    id: 'evt-1',
    title: 'تماس اولیه با لید',
    timestamp: `${todayIso}T15:30:00Z`,
    actorType: 'user',
    actor: {
      name: 'سارا احمدی',
      role: 'کارشناس فروش',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    },
    description: 'لید به پلن سازمانی علاقه‌مند بود و درخواست دمو در هفته آینده ثبت شد.',
    variant: 'info',
  },

  // سناریو ۲: رویداد کاربر امروز بدون توضیحات
  {
    id: 'evt-2',
    title: 'ارسال پیش‌فاکتور رسمی',
    timestamp: `${todayIso}T11:00:00Z`,
    actorType: 'user',
    actor: {
      name: 'علی محمدی',
      role: 'مدیر حساب کاربری',
    },
    variant: 'success',
  },

  // سناریو ۵: رویداد دیروز با سیستم بدون کاربر
  {
    id: 'evt-3',
    title: 'ثبت خودکار فرم لندینگ جشنواره پاییزه',
    timestamp: `${yesterdayIso}T18:45:00Z`,
    actorType: 'system',
    description: 'فرم کمپین گوگل ادز با موفقیت تکمیل شد و به صف تخصیص فروش پیوست.',
    variant: 'neutral',
  },

  // سناریو ۴: رویداد گذشته با توضیحات
  {
    id: 'evt-4',
    title: 'کلیک روی تبلیغ بنری یکتانت',
    timestamp: '2026-10-25T08:20:00Z',
    actorType: 'system',
    description: 'ورود از طریق UTM source: yektanet، medium: cpc.',
    variant: 'neutral',
  },

  // سناریو ۶ و ۷: دو رویداد با timestamp کاملاً یکسان برای آزمون Deterministic Sort
  {
    id: 'evt-5a',
    title: 'تخصیص هوشمند به واحد پشتیبانی',
    timestamp: '2026-10-20T10:00:00Z',
    actorType: 'system',
    description: 'الویت اول بر اساس قوانین توزیع لید.',
    variant: 'info',
  },
  {
    id: 'evt-5b',
    title: 'ارسال پیامک خوش‌آمدگویی',
    timestamp: '2026-10-20T10:00:00Z',
    actorType: 'system',
    description: 'الگوی پیامک تایید ثبت نام به شماره همراه لید ارسال شد.',
    variant: 'neutral',
  },

  // سناریو با وضعیت هشدار
  {
    id: 'evt-6',
    title: 'عدم پاسخگویی در تماس دوم',
    timestamp: '2026-10-18T14:10:00Z',
    actorType: 'user',
    actor: {
      name: 'رضا حسینی',
      role: 'کارشناس فروش',
    },
    description: 'تلفن همراه در دسترس نبود. پیگیری مجدد برای روز بعد تنظیم شد.',
    variant: 'warning',
  },

  // سناریو با وضعیت خطر / شکست
  {
    id: 'evt-7',
    title: 'لغو پیش‌فاکتور به دلیل انصراف مشتری',
    timestamp: '2026-10-15T09:30:00Z',
    actorType: 'user',
    actor: {
      name: 'مهدی کریمی',
      role: 'سرپرست فروش',
    },
    description: 'مشتری اعلام کرد به دلیل محدودیت بودجه در این فصل قادر به ادامه نیست.',
    variant: 'danger',
  },
];
