import type {
  LeadDetail,
  LeadEvent,
  CreateLeadEventInput,
  CreateCallEventInput,
  LeadFilters,
  LeadStatus,
  LeadActor,
  LeadEventMetadata,
  BulkOperationResult,
} from '../types';

export interface CreateLeadInput {
  fullName: string;
  mobile: string;
  email?: string;
  city?: string;
  source?: string;
  campaignId?: string;
  assignedToId?: string;
  nextFollowUpAt?: string;
  nextFollowUpNote?: string;
  statusKey?: string;
}

export interface ILeadService {
  /**
   * ایجاد و ثبت لید جدید در سیستم
   */
  create(input: CreateLeadInput): Promise<LeadDetail>;

  /**
   * دریافت لیست لیدها با پشتیبانی از فیلترهای چندگانه و جستجو
   */
  getAll(filters?: LeadFilters): Promise<LeadDetail[]>;

  /**
   * دریافت اطلاعات کامل یک لید با شناسه
   * در صورت نیافتن، مقدار null برمی‌گرداند.
   */
  getById(id: string): Promise<LeadDetail | null>;

  /**
   * دریافت تمامی رویدادهای یک لید
   */
  getEvents(leadId: string): Promise<LeadEvent[]>;

  /**
   * ایجاد یک رویداد عمومی در خط زمانی لید
   */
  createEvent(leadId: string, input: CreateLeadEventInput): Promise<LeadEvent>;

  /**
   * ثبت اختصاصی یک تماس تلفنی همراه با نتیجه، مدت و یادداشت
   */
  createCall(leadId: string, input: CreateCallEventInput): Promise<LeadEvent>;

  /**
   * به‌روزرسانی وضعیت یک لید همراه با ثبت خودکار رویداد status_change در تاریخچه
   */
  updateStatus(
    id: string,
    newStatus: LeadStatus,
    metadata?: LeadEventMetadata
  ): Promise<{ lead: LeadDetail; event: LeadEvent }>;

  /**
   * تخصیص گروهی لیدها به یک کارشناس پیگیری
   */
  bulkAssign(ids: string[], assignedTo: LeadActor): Promise<BulkOperationResult>;

  /**
   * تغییر وضعیت گروهی لیدها همراه با ثبت رویداد برای هر لید
   */
  bulkUpdateStatus(
    ids: string[],
    newStatus: LeadStatus,
    metadata?: LeadEventMetadata
  ): Promise<BulkOperationResult>;
}
