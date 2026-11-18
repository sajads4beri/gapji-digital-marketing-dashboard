/**
 * تعاریف داده‌ای و تایپ‌های ماژول تقویم بازاریابی (Calendar Module Types)
 * منطبق با مشخصات سند رسمی نیازمندی‌های محصول (PRD ص ۱۹ §۲۰)
 */

export type CalendarViewMode = 'month' | 'week' | 'list';

export type CalendarEventType = 'campaign' | 'webinar' | 'meeting' | 'task';

export type EquipmentReadinessStatus = 'ready' | 'incomplete' | 'not_procured';

export interface CalendarEventAssignee {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface CalendarEventEquipment {
  name: string;
  status: EquipmentReadinessStatus;
  statusLabel: string;
  quantity?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string; // ISO string or YYYY-MM-DD
  endDate: string;   // ISO string or YYYY-MM-DD
  isAllDay: boolean;
  startTime?: string; // e.g. "10:30"
  endTime?: string;   // e.g. "12:00"
  color?: string;     // Hex color code or Tailwind class
  assignee?: CalendarEventAssignee;
  relatedEntity?: {
    type: 'campaign' | 'webinar' | 'task' | 'meeting' | 'sop';
    id: string;
    title: string;
    url: string;
  };
  equipment?: CalendarEventEquipment[];
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  color?: string;
  assigneeId?: string;
  relatedType?: 'campaign' | 'webinar' | 'task' | 'meeting' | 'lead' | 'sop' | 'equipment';
  relatedId?: string;
  relatedEntityType?: 'campaign' | 'webinar' | 'task' | 'meeting';
  relatedEntityId?: string;
  equipmentStatus?: EquipmentReadinessStatus;
}

export interface UpdateCalendarEventInput extends Partial<CreateCalendarEventInput> {
  id: string;
}

export interface CalendarFilters {
  viewMode?: CalendarViewMode;
  eventTypes?: CalendarEventType[];
  search?: string;
  year?: number;
  month?: number; // 1-12 in Jalali
  startDate?: string;
  endDate?: string;
}

export interface PersianHoliday {
  day: number;
  month: number;
  title: string;
  isOfficialHoliday: boolean;
}

export interface CalendarDayCell {
  dateIso: string;
  jalaliYear: number;
  jalaliMonth: number;
  jalaliDay: number;
  dayOfWeek: number; // 0 = Saturday, ..., 6 = Friday
  isCurrentMonth: boolean;
  isToday: boolean;
  isFriday: boolean;
  holiday?: PersianHoliday;
  events: CalendarEvent[];
}
