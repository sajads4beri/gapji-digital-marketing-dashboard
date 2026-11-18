/**
 * سرویس ارتباط با API واقعی بک‌اند ماژول تقویم بازاریابی (Calendar)
 * متصل به پایگاه داده PostgreSQL و بک‌اند NestJS
 * پیاده‌سازی کامل قرارداد ICalendarService
 */

import { api } from '@/lib/api';
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarFilters,
} from '../types';
import type { ICalendarService } from './calendar.contract';

function extractErrorMessage(error: any, fallback: string): string {
  if (error?.response?.data?.message) {
    const msg = error.response.data.message;
    if (Array.isArray(msg)) {
      return msg.join('، ');
    }
    return String(msg);
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
}

export class RealCalendarService implements ICalendarService {
  /**
   * دریافت فهرست کامل رویدادهای تقویم از پایگاه داده با فیلترهای ارسالی
   */
  async getAll(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const params: Record<string, string | undefined> = {};

      if (filters?.eventTypes && filters.eventTypes.length > 0) {
        params.eventType = filters.eventTypes.join(',');
      }
      if (filters?.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters?.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters?.endDate) {
        params.endDate = filters.endDate;
      }

      const { data } = await api.get<CalendarEvent[]>('/calendar/events', { params });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در بارگذاری رویدادهای تقویم از سرور'));
    }
  }

  /**
   * دریافت جزئیات یک رویداد خاص با شناسه
   */
  async getById(id: string): Promise<CalendarEvent | null> {
    try {
      const { data } = await api.get<CalendarEvent>(`/calendar/events/${id}`);
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw new Error(extractErrorMessage(err, 'خطا در دریافت مشخصات رویداد از سرور'));
    }
  }

  /**
   * ایجاد رویداد جدید در پایگاه داده
   */
  async create(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    try {
      const payload: any = {
        title: input.title,
        description: input.description,
        eventType: input.eventType,
        startDate: input.startDate,
        endDate: input.endDate,
        isAllDay: input.isAllDay,
        startTime: input.startTime,
        endTime: input.endTime,
        color: input.color,
        assigneeId: input.assigneeId,
        equipmentStatus: input.equipmentStatus,
        relatedType: input.relatedType || input.relatedEntityType,
        relatedId: input.relatedId || input.relatedEntityId,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const { data } = await api.post<CalendarEvent>('/calendar/events', payload);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ایجاد رویداد در سرور'));
    }
  }

  /**
   * ویرایش مشخصات یا فیلدهای رویداد
   */
  async update(id: string, input: UpdateCalendarEventInput): Promise<CalendarEvent> {
    try {
      const payload: any = {
        ...input,
        relatedType: input.relatedType || input.relatedEntityType,
        relatedId: input.relatedId || input.relatedEntityId,
      };
      delete payload.relatedEntityType;
      delete payload.relatedEntityId;
      delete payload.id;
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const { data } = await api.patch<CalendarEvent>(`/calendar/events/${id}`, payload);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ویرایش رویداد در سرور'));
    }
  }

  /**
   * جابجایی تاریخ رویداد با درگ‌اند‌دراپ در تقویم
   */
  async reschedule(
    id: string,
    newStartDate: string,
    newEndDate?: string
  ): Promise<CalendarEvent> {
    try {
      const { data } = await api.patch<CalendarEvent>(`/calendar/events/${id}`, {
        startDate: newStartDate,
        endDate: newEndDate || newStartDate,
      });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تغییر تاریخ رویداد در سرور'));
    }
  }

  /**
   * حذف دائم رویداد از پایگاه داده
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/calendar/events/${id}`);
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در حذف رویداد از سرور'));
    }
  }

  /**
   * بازخوانی داده‌های تقویم از پایگاه داده
   */
  async resetToDefault(): Promise<CalendarEvent[]> {
    return this.getAll();
  }
}

export const realCalendarService = new RealCalendarService();
export const calendarService: ICalendarService = realCalendarService;
