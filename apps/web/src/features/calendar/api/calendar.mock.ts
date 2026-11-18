import {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarFilters,
} from '../types';
import { ICalendarService } from './calendar.contract';
import { EVENT_TYPE_CONFIG } from '../constants';
import {
  delay,
  generateId,
  getStoredItem,
  setStoredItem,
  isBrowser,
} from '@/lib/mock-utils';

const STORAGE_KEY = 'gapji_calendar_events_v1';
const INIT_FLAG_KEY = 'gapji_calendar_initialized_v1';

/**
 * ایجاد رویدادهای پیش‌فرض و شبیه‌سازی‌شده متصل به زمان حال پویا
 */
function createInitialMockEvents(): CalendarEvent[] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const toIsoDate = (offsetDays: number) => {
    const d = new Date(now.getTime() + offsetDays * dayMs);
    return d.toISOString().split('T')[0];
  };

  return [
    // ۱. اجرای کمپین‌های چندروزه (Campaign Multi-day Bars)
    {
      id: 'cal_cmp_1',
      title: 'کمپین تبلیغاتی لید جنریشن پاییزه (اینستاگرام و گوگل)',
      description: 'تبلیغات در اینستاگرام و سرچ ادز گوگل با بودجه مصوب ۴۵ میلیون تومان',
      eventType: 'campaign',
      startDate: toIsoDate(-5),
      endDate: toIsoDate(12),
      isAllDay: true,
      color: EVENT_TYPE_CONFIG.campaign.defaultColor,
      assignee: {
        id: 'usr_1',
        name: 'سارا رضایی',
        role: 'مدیر کمپین',
      },
      relatedEntity: {
        type: 'campaign',
        id: '30000000-0000-0000-0000-000000000001',
        title: 'کمپین سرچ ادز جذب لید B2B - پاییز ۱۴۰۵',
        url: '/campaigns/30000000-0000-0000-0000-000000000001',
      },
    },
    {
      id: 'cal_cmp_2',
      title: 'کمپین همسان و ریتارگتینگ یکتانت پکیج جامع',
      description: 'تبلیغات کلیکی هوشمند روی پلتفرم‌های پربازدید با تارگت ۳۵۰ لید',
      eventType: 'campaign',
      startDate: toIsoDate(8),
      endDate: toIsoDate(22),
      isAllDay: true,
      color: EVENT_TYPE_CONFIG.campaign.defaultColor,
      assignee: {
        id: 'usr_2',
        name: 'علی کریمی',
        role: 'کارشناس دیجیتال مارکتینگ',
      },
      relatedEntity: {
        type: 'campaign',
        id: '30000000-0000-0000-0000-000000000002',
        title: 'کمپین همسان و ریتارگتینگ یکتانت پکیج جامع مارکتینگ',
        url: '/campaigns/30000000-0000-0000-0000-000000000002',
      },
    },

    // ۲. وبینارها با تجهیزات اختصاصی (Webinars with Equipment)
    {
      id: 'cal_web_1',
      title: 'وبینار تخصصی استراتژی قیف فروش و جذب سرنخ B2B',
      description: 'رویداد آنلاین در پلتفرم اسکای‌روم با ظرفیت ۳۰۰ نفر برای مدیران فروش',
      eventType: 'webinar',
      startDate: toIsoDate(3),
      endDate: toIsoDate(3),
      isAllDay: false,
      startTime: '17:00',
      endTime: '19:00',
      color: EVENT_TYPE_CONFIG.webinar.defaultColor,
      assignee: {
        id: 'usr_3',
        name: 'محمد نادری',
        role: 'مسئول برگزاری وبینار',
      },
      relatedEntity: {
        type: 'webinar',
        id: 'web_mock_1',
        title: 'وبینار استراتژی قیف فروش',
        url: '/leads/webinars',
      },
      equipment: [
        { name: 'دوربین 4K استودیو', status: 'ready', statusLabel: 'آماده و تست‌شده', quantity: 1 },
        { name: 'میکروفون یقه‌ای بی‌سیم Rode', status: 'ready', statusLabel: 'آماده و تست‌شده', quantity: 2 },
        { name: 'اینترنت فیبر نوری پشتیبان', status: 'incomplete', statusLabel: 'ناقص / نیازمند تست', quantity: 1 },
      ],
    },
    {
      id: 'cal_web_2',
      title: 'کارگاه آنلاین هوش مصنوعی در خلق کمپین‌های تبلیغاتی',
      description: 'معرفی ابزارهای مولد محتوا و اتوماسیون تبلیغات آنلاین',
      eventType: 'webinar',
      startDate: toIsoDate(16),
      endDate: toIsoDate(16),
      isAllDay: false,
      startTime: '18:30',
      endTime: '20:30',
      color: EVENT_TYPE_CONFIG.webinar.defaultColor,
      assignee: {
        id: 'usr_3',
        name: 'محمد نادری',
        role: 'مسئول برگزاری وبینار',
      },
      relatedEntity: {
        type: 'webinar',
        id: 'web_mock_2',
        title: 'کارگاه هوش مصنوعی تبلیغات',
        url: '/leads/webinars',
      },
      equipment: [
        { name: 'لپ‌تاپ استریمینگ Core i9', status: 'ready', statusLabel: 'آماده و تست‌شده', quantity: 1 },
        { name: 'کارت کپچر Elgato Cam Link', status: 'not_procured', statusLabel: 'تهیه‌نشده', quantity: 1 },
      ],
    },

    // ۳. جلسات تیمی و مدیریتی (Meetings)
    {
      id: 'cal_meet_1',
      title: 'جلسه هفتگی بازبینی عملکرد و تخصیص بودجه با کارفرما',
      description: 'بررسی گزارش هزینه‌کرد و نرخ بازگشت سرمایه تبلیغات در ماه جاری',
      eventType: 'meeting',
      startDate: toIsoDate(1),
      endDate: toIsoDate(1),
      isAllDay: false,
      startTime: '10:00',
      endTime: '11:30',
      color: EVENT_TYPE_CONFIG.meeting.defaultColor,
      assignee: {
        id: 'usr_4',
        name: 'احمد پورسینا',
        role: 'مدیر ارشد بازاریابی',
      },
      relatedEntity: {
        type: 'meeting',
        id: 'meet_1',
        title: 'صورتجلسه هماهنگی بودجه',
        url: '/performance/dashboard',
      },
    },
    {
      id: 'cal_meet_2',
      title: 'جلسه بررسی نرخ تبدیل لندینگ‌های جدید و تست A/B',
      description: 'تحلیل رفتاری بازدیدکنندگان در Hotjar و بهینه‌سازی فرم‌های جذب لید',
      eventType: 'meeting',
      startDate: toIsoDate(5),
      endDate: toIsoDate(5),
      isAllDay: false,
      startTime: '14:00',
      endTime: '15:15',
      color: EVENT_TYPE_CONFIG.meeting.defaultColor,
      assignee: {
        id: 'usr_1',
        name: 'سارا رضایی',
        role: 'مدیر کمپین',
      },
      relatedEntity: {
        type: 'meeting',
        id: 'meet_2',
        title: 'صورتجلسه بهینه‌سازی لندینگ',
        url: '/performance/landing',
      },
    },
    {
      id: 'cal_meet_3',
      title: 'جلسه ماهانه بررسی لیدهای واجد شرایط با تیم فروش',
      description: 'بررسی دلایل باخت لیدها و هماهنگی مجدد فرآیند تماس سریع',
      eventType: 'meeting',
      startDate: toIsoDate(-2),
      endDate: toIsoDate(-2),
      isAllDay: false,
      startTime: '11:00',
      endTime: '12:30',
      color: EVENT_TYPE_CONFIG.meeting.defaultColor,
      assignee: {
        id: 'usr_5',
        name: 'رضا علوی',
        role: 'سرپرست فروش',
      },
      relatedEntity: {
        type: 'meeting',
        id: 'meet_3',
        title: 'جلسه هماهنگی پایپ‌لاین فروش',
        url: '/leads/board',
      },
    },

    // ۴. موعد تحویل و مهلت تسک‌ها (Task Deadlines)
    {
      id: 'cal_task_1',
      title: 'موعد تحویل بنرهای تبلیغاتی سایز استاندارد صباویژن',
      description: 'آماده‌سازی ۴ سایز بنر متحرک با تم تخفیف یلدا و لوگوی سازمان',
      eventType: 'task',
      startDate: toIsoDate(2),
      endDate: toIsoDate(2),
      isAllDay: false,
      startTime: '16:00',
      color: EVENT_TYPE_CONFIG.task.defaultColor,
      assignee: {
        id: 'usr_6',
        name: 'مریم کمالی',
        role: 'طراح گرافیک و محتوا',
      },
      relatedEntity: {
        type: 'task',
        id: 'task_mock_1',
        title: 'طراحی بنرهای صباویژن',
        url: '/work/tasks',
      },
    },
    {
      id: 'cal_task_2',
      title: 'مهلت نهایی تست تجهیزات و تست صدای وبینار قیف فروش',
      description: 'چک‌لیست تجهیزات صوتی و تصویری باید تا ۲۴ ساعت قبل از وبینار تأیید شود',
      eventType: 'task',
      startDate: toIsoDate(3),
      endDate: toIsoDate(3),
      isAllDay: false,
      startTime: '12:00',
      color: EVENT_TYPE_CONFIG.task.defaultColor,
      assignee: {
        id: 'usr_3',
        name: 'محمد نادری',
        role: 'مسئول وبینار',
      },
      relatedEntity: {
        type: 'task',
        id: 'task_mock_2',
        title: 'چک‌لیست تجهیزات وبینار',
        url: '/work/tasks',
      },
    },
    {
      id: 'cal_task_3',
      title: 'مهلت بارگذاری فایل اکسل هزینه‌های گوگل ادز در Import Center',
      description: 'دریافت فاکتورهای ارزی و ثبت دقیق هزینه‌های کلیکی ماه گذشته',
      eventType: 'task',
      startDate: toIsoDate(7),
      endDate: toIsoDate(7),
      isAllDay: false,
      startTime: '18:00',
      color: EVENT_TYPE_CONFIG.task.defaultColor,
      assignee: {
        id: 'usr_2',
        name: 'علی کریمی',
        role: 'کارشناس دیجیتال مارکتینگ',
      },
      relatedEntity: {
        type: 'task',
        id: 'task_mock_3',
        title: 'ورود اطلاعات فاکتور گوگل ادز',
        url: '/performance/imports',
      },
    },
    {
      id: 'cal_task_4',
      title: 'ارسال پیامک یادآوری به شرکت‌کنندگان وبینار ۱ ساعت قبل',
      description: 'ارسال اتوماتیک لینک ورود به وبینار برای ۱۸۰ ثبت‌نام‌کننده تأییدشده',
      eventType: 'task',
      startDate: toIsoDate(3),
      endDate: toIsoDate(3),
      isAllDay: false,
      startTime: '16:00',
      color: EVENT_TYPE_CONFIG.task.defaultColor,
      assignee: {
        id: 'usr_5',
        name: 'رضا علوی',
        role: 'سرپرست فروش',
      },
      relatedEntity: {
        type: 'task',
        id: 'task_mock_4',
        title: 'پیامک یادآوری وبینار',
        url: '/leads/sms',
      },
    },
  ];
}

class MockCalendarServiceImpl implements ICalendarService {
  private getStoredEvents(): CalendarEvent[] {
    if (!isBrowser()) return createInitialMockEvents();
    const isInitialized = getStoredItem<boolean>(INIT_FLAG_KEY, false);
    if (!isInitialized) {
      const initial = createInitialMockEvents();
      setStoredItem(STORAGE_KEY, initial);
      setStoredItem(INIT_FLAG_KEY, true);
      return initial;
    }
    const data = getStoredItem<CalendarEvent[]>(STORAGE_KEY, null as any);
    if (data === null || !Array.isArray(data)) {
      const initial = createInitialMockEvents();
      setStoredItem(STORAGE_KEY, initial);
      return initial;
    }
    return data;
  }

  private saveEvents(events: CalendarEvent[]) {
    if (isBrowser()) {
      setStoredItem(STORAGE_KEY, events);
    }
  }

  async getAll(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    await delay(120);
    let events = this.getStoredEvents();

    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      events = events.filter((e) => filters.eventTypes!.includes(e.eventType));
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.assignee && e.assignee.name.toLowerCase().includes(q))
      );
    }

    return events;
  }

  async getById(id: string): Promise<CalendarEvent | null> {
    await delay(80);
    const events = this.getStoredEvents();
    return events.find((e) => e.id === id) || null;
  }

  async create(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    await delay(150);
    const events = this.getStoredEvents();

    const newEvent: CalendarEvent = {
      id: generateId('cal_ev_'),
      title: input.title,
      description: input.description,
      eventType: input.eventType,
      startDate: input.startDate,
      endDate: input.endDate || input.startDate,
      isAllDay: input.isAllDay ?? false,
      startTime: input.startTime,
      endTime: input.endTime,
      color: input.color || EVENT_TYPE_CONFIG[input.eventType]?.defaultColor,
      assignee: input.assigneeId
        ? { id: input.assigneeId, name: 'کاربر سیستم' }
        : undefined,
      equipment: input.equipmentStatus
        ? [
            {
              name: 'تجهیزات رویداد',
              status: input.equipmentStatus,
              statusLabel:
                input.equipmentStatus === 'ready'
                  ? 'آماده و تست‌شده'
                  : input.equipmentStatus === 'incomplete'
                  ? 'ناقص'
                  : 'تهیه‌نشده',
            },
          ]
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  }

  async update(id: string, input: UpdateCalendarEventInput): Promise<CalendarEvent> {
    await delay(120);
    const events = this.getStoredEvents();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new Error(`رویداد با شناسه ${id} یافت نشد.`);
    }

    const updated: CalendarEvent = {
      ...events[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    events[idx] = updated;
    this.saveEvents(events);
    return updated;
  }

  async reschedule(
    id: string,
    newStartDate: string,
    newEndDate?: string
  ): Promise<CalendarEvent> {
    await delay(100);
    const events = this.getStoredEvents();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new Error(`رویداد با شناسه ${id} یافت نشد.`);
    }

    const current = events[idx];
    let calculatedEndDate = newEndDate || newStartDate;

    // اگر رویداد چندروزه بود و تاریخ شروع جابجا شد، طول مدت رویداد حفظ می‌شود
    if (!newEndDate && current.startDate && current.endDate && current.startDate !== current.endDate) {
      const origStart = new Date(`${current.startDate}T00:00:00Z`).getTime();
      const origEnd = new Date(`${current.endDate}T00:00:00Z`).getTime();
      const durationMs = Math.max(0, origEnd - origStart);
      const newStartMs = new Date(`${newStartDate}T00:00:00Z`).getTime();
      calculatedEndDate = new Date(newStartMs + durationMs).toISOString().split('T')[0];
    }

    const updated: CalendarEvent = {
      ...current,
      startDate: newStartDate,
      endDate: calculatedEndDate,
      updatedAt: new Date().toISOString(),
    };

    events[idx] = updated;
    this.saveEvents(events);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await delay(100);
    let events = this.getStoredEvents();
    events = events.filter((e) => e.id !== id);
    this.saveEvents(events);
  }

  async resetToDefault(): Promise<CalendarEvent[]> {
    const initial = createInitialMockEvents();
    this.saveEvents(initial);
    return initial;
  }
}

export const mockCalendarService = new MockCalendarServiceImpl();
