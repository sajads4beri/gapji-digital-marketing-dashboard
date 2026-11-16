/**
 * مدل‌های داده‌ای ماژول مدیریت لیدها (Leads)
 * کاملاً مستقل از React و بدون هرگونه وابستگی به اجزای UI
 */

export type LeadStatus =
  | 'new'
  | 'in_progress'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost'
  | (string & {});

export type LeadEventType =
  | 'ad_click'
  | 'landing_visit'
  | 'form_submit'
  | 'assigned'
  | 'call'
  | 'note'
  | 'status_change'
  | 'proposal_sent'
  | 'deal_won'
  | 'deal_lost';

export type CallResult = 'answered' | 'no_answer' | 'busy' | 'rejected';

export interface LeadActor {
  id?: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
}

export interface LeadUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface LeadEventMetadata {
  callResult?: CallResult;
  callDurationSeconds?: number;
  fromStatus?: LeadStatus;
  toStatus?: LeadStatus;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  proposalTitle?: string;
  proposalAmount?: number;
  dealValue?: number;
  lostReason?: string;
  [key: string]: unknown;
}

export interface LeadDetail {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  status: LeadStatus;
  statusKey?: string;
  statusConfigId?: string;
  statusConfig?: {
    id: string;
    key: string;
    label: string;
    color?: string;
    group?: 'open' | 'won' | 'lost';
    isActive?: boolean;
    sortOrder?: number;
  };
  campaignId?: string;
  campaignName?: string;
  source: string;
  adName?: string;
  utm?: LeadUtm;
  assignedTo?: LeadActor;
  assignedToId?: string; // شناسه یکتای کارشناس تخصیص‌یافته جهت کنترل پایدار مالکیت لید
  estimatedValue?: number;
  lostReason?: string; // علت انصراف یا لغو معامله در وضعیت lost
  nextFollowUpDate?: string; // تاریخ پیگیری بعدی ISO string
  createdAt: string;
  updatedAt: string;
}

/**
 * نوع لید برای ردیف‌های جدول و نمایش لیستی
 */
export type LeadListItem = LeadDetail;

export interface LeadEvent {
  id: string;
  leadId: string;
  type: LeadEventType;
  title: string;
  timestamp: string; // ISO string e.g. "2026-11-02T10:30:00Z"
  actorType: 'user' | 'system';
  actor?: LeadActor;
  note?: string;
  metadata?: LeadEventMetadata;
}

export interface CreateLeadEventInput {
  type: LeadEventType;
  title: string;
  actorType: 'user' | 'system';
  actor?: LeadActor;
  note?: string;
  metadata?: LeadEventMetadata;
  timestamp?: string;
}

export interface CreateCallEventInput {
  callResult: CallResult;
  callDurationSeconds: number;
  note?: string;
  actor?: LeadActor;
}

/**
 * فیلترهای جستجو و غربالگری لیدها در صندوق و برد
 */
export interface LeadFilters {
  search?: string;
  status?: LeadStatus | LeadStatus[];
  assignedToId?: string;
  campaignId?: string;
  source?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  noFollowUp?: boolean;
}

/**
 * نتیجه عملیات دسته‌جمعی (Bulk Operations)
 */
export interface BulkOperationResult {
  total: number;
  succeeded: string[];
  failed: { id: string; error: string }[];
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'جدید',
  in_progress: 'تماس گرفته شد',
  qualified: 'واجد شرایط',
  proposal: 'پیشنهاد',
  won: 'مشتری',
  lost: 'ردشده',
};

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
  answered: 'پاسخ داد',
  no_answer: 'پاسخ نداد',
  busy: 'مشغول',
  rejected: 'رد تماس',
};
