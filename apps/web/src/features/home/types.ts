import type { UserRole } from '@/features/users/types';

export interface HomeWidgetBaseProps {
  className?: string;
}

export interface TodayFollowupItem {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  maskedPhone: string;
  time: string;
  campaignTitle?: string;
  status: string;
}

export interface UpcomingEventItem {
  id: string;
  title: string;
  date: string;
  type: 'campaign_launch' | 'webinar' | 'meeting' | 'task_deadline';
  relatedName?: string;
}

export interface EquipmentCheckItem {
  id: string;
  name: string;
  category: string;
  status: 'ready' | 'missing' | 'in_progress';
  relatedEvent: string;
  responsibleName: string;
}
