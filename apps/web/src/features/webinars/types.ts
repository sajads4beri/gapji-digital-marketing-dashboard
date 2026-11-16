export type WebinarStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
export type EquipmentReadinessStatus = 'ready' | 'incomplete' | 'not_procured';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface WebinarListItem {
  id: string;
  title: string;
  description: string | null;
  presenterName: string;
  platform: string;
  webinarDate: string;
  durationMinutes: number;
  status: WebinarStatus;
  isPublished: boolean;
  capacity: number | null;
  registeredCount: number;
  attendedCount: number;
  campaignId: string | null;
  campaignName: string | null;
  registrationUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebinarFunnelMetrics {
  registeredCount: number; // ثبت‌نام
  attendedCount: number; // حضور
  convertedLeadsCount: number; // لید
  attendanceRate: number; // درصد حضور
  conversionRate: number; // درصد تبدیل به لید
}

export interface WebinarEquipmentItem {
  id: string;
  equipmentItemId: string;
  title: string;
  category: string;
  description: string | null;
  status: EquipmentReadinessStatus;
  responsibleId: string | null;
  responsibleName: string | null;
  dueDate: string | null;
  notes: string | null;
}

export interface WebinarEquipmentSummary {
  total: number;
  ready: number;
  incomplete: number;
  notProcured: number;
}

export interface WebinarTaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
}

export interface WebinarDetail {
  id: string;
  title: string;
  description: string | null;
  presenterName: string;
  platform: string;
  webinarDate: string;
  durationMinutes: number;
  registrationUrl: string | null;
  bannerUrl: string | null;
  status: WebinarStatus;
  isPublished: boolean;
  capacity: number | null;
  campaignId: string | null;
  campaignName: string | null;
  createdAt: string;
  updatedAt: string;

  // 4 Tabs aggregation
  funnel: WebinarFunnelMetrics;
  equipments: WebinarEquipmentItem[];
  equipmentSummary: WebinarEquipmentSummary;
  tasks: WebinarTaskItem[];
}

export interface WebinarAttendeeItem {
  id: string;
  fullName: string;
  mobileMasked: string;
  email: string | null;
  attended: boolean;
  joinedAt: string | null;
  isConvertedToLead: boolean;
  leadId: string | null;
  leadName: string | null;
  createdAt: string;
}

export interface CreateWebinarInput {
  title: string;
  description?: string;
  presenterName: string;
  platform: string;
  webinarDate: string;
  durationMinutes?: number;
  registrationUrl?: string;
  capacity?: number;
  campaignId?: string;
}

export interface ImportAttendeesInput {
  csvContent?: string;
  rows?: Array<{
    fullName: string;
    mobile: string;
    email?: string;
    attended?: boolean | string;
    joinedAt?: string;
  }>;
}

export interface ImportAttendeesResponse {
  totalRows: number;
  successfullyImported: number;
  failed: number;
  duplicates: number;
  attendanceUpdatedCount: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface ConvertAttendeesPreviewResponse {
  totalEligibleAttendees: number;
  eligibleCount: number;
  duplicateCount: number;
  attendees: Array<{
    id: string;
    fullName: string;
    mobileMasked: string;
    email: string | null;
    isDuplicate: boolean;
    existingLeadId: string | null;
    existingLeadName: string | null;
  }>;
}

export interface ConvertAttendeesConfirmResponse {
  createdCount: number;
  skippedDuplicates: number;
  leadIds: string[];
  message: string;
}

export interface AddEquipmentInput {
  equipmentItemId: string;
  responsibleId?: string;
  dueDate?: string;
  notes?: string;
}

export interface AddTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

export interface QueryWebinarsParams {
  campaignId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QueryAttendeesParams {
  attendanceStatus?: string;
  conversionStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
