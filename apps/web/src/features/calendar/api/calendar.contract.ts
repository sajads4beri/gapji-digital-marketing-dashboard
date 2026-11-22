import {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarFilters,
} from '../types';

export interface ICalendarService {
  getAll(filters?: CalendarFilters): Promise<CalendarEvent[]>;
  getById(id: string): Promise<CalendarEvent | null>;
  create(input: CreateCalendarEventInput): Promise<CalendarEvent>;
  update(id: string, input: UpdateCalendarEventInput): Promise<CalendarEvent>;
  reschedule(id: string, newStartDate: string, newEndDate?: string): Promise<CalendarEvent>;
  delete(id: string): Promise<void>;
  resetToDefault(): Promise<CalendarEvent[]>;
}
