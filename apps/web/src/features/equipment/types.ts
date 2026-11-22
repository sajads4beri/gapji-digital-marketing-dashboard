export type EquipmentReadinessStatus = 'ready' | 'incomplete' | 'not_procured';

export interface EquipmentItem {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventEquipmentItem {
  id: string;
  organizationId: string;
  equipmentItemId: string;
  campaignId?: string | null;
  webinarId?: string | null;
  status: EquipmentReadinessStatus;
  responsibleId?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  equipmentItem: EquipmentItem;
  targetDate?: string | null;
  daysRemaining?: number | null;
  isUrgent?: boolean;
  isOverdue?: boolean;
  eventName?: string;
  eventType?: 'webinar' | 'campaign' | 'general';
  campaign?: {
    id: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  webinar?: {
    id: string;
    title: string;
    webinarDate?: string | null;
  } | null;
  responsible?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface ShortagesGroup {
  date: string;
  hasUrgent: boolean;
  items: EventEquipmentItem[];
}

export interface ShortagesResponse {
  totalShortages: number;
  urgentCount: number;
  overdueCount: number;
  groups: ShortagesGroup[];
  items: EventEquipmentItem[];
}

export interface EquipmentTemplateItem {
  id: string;
  templateId: string;
  equipmentItemId: string;
  quantity: number;
  equipmentItem: EquipmentItem;
}

export interface EquipmentTemplate {
  id: string;
  name: string;
  description?: string | null;
  items: EquipmentTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentItemInput {
  name: string;
  category: string;
  description?: string;
}

export interface UpdateEquipmentItemInput {
  name?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface ApplyTemplateInput {
  templateId: string;
  campaignId?: string;
  webinarId?: string;
  dueDate?: string;
  responsibleId?: string;
}
