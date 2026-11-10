import type { ILeadService, CreateLeadInput } from './lead.contract';
import {
  CALL_RESULT_LABELS,
  LEAD_STATUS_LABELS,
  type LeadDetail,
  type LeadEvent,
  type CreateLeadEventInput,
  type CreateCallEventInput,
  type LeadFilters,
  type LeadStatus,
  type LeadActor,
  type LeadEventMetadata,
  type BulkOperationResult,
} from '../types';
import {
  getStoredLeads,
  getStoredLeadById,
  updateStoredLead,
  getStoredEvents,
  saveStoredEvent,
} from '../utils/lead-storage';
import { authService } from '../../auth/auth.mock';
import { leadApi } from './lead.api';

/**
 * نرمال‌سازی ارقام و کاراکترها جهت مقایسه و جستجوی منعطف
 */
function normalizeSearchText(text?: string): string {
  if (!text) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = text.toLowerCase();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res.trim();
}

export class MockLeadService implements ILeadService {
  private shouldSimulateError = false;
  private delayMs = 150;

  constructor(delayMs = 150) {
    this.delayMs = delayMs;
  }

  /**
   * تنظیم حالت شبیه‌سازی خطا جهت تست رفتارهای Error
   */
  public setSimulateError(enable: boolean): void {
    this.shouldSimulateError = enable;
  }

  private async simulateDelay(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    if (this.shouldSimulateError) {
      throw new Error('خطای شبیه‌سازی‌شده در ارتباط با سرویس لید');
    }
  }

  /**
   * ایجاد دستی لید (حالت موک)
   */
  async create(input: CreateLeadInput): Promise<LeadDetail> {
    await this.simulateDelay();
    const newLead: LeadDetail = {
      id: `lead-${Date.now()}`,
      fullName: input.fullName,
      phoneNumber: input.mobile,
      email: input.email,
      source: input.source || 'manual',
      status: (input.statusKey as LeadStatus) || 'new',
      campaignId: input.campaignId,
      assignedToId: input.assignedToId,
      nextFollowUpDate: input.nextFollowUpAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newLead;
  }

  /**
   * دریافت تمامی لیدها با اعمال فیلترهای چندگانه و جستجو
   */
  async getAll(filters?: LeadFilters): Promise<LeadDetail[]> {
    return await leadApi.getLeads(filters);
  }

  async getById(id: string): Promise<LeadDetail | null> {
    try {
      return await leadApi.getLeadById(id);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        throw new Error('خطای دسترسی: شما فقط به لیدهای تخصیص‌یافته به خود دسترسی دارید.');
      }
      throw err;
    }
  }

  async getEvents(leadId: string): Promise<LeadEvent[]> {
    return await leadApi.getEvents(leadId);
  }

  async createEvent(
    leadId: string,
    input: CreateLeadEventInput
  ): Promise<LeadEvent> {
    await this.simulateDelay();
    const lead = await this.getById(leadId);
    if (!lead) throw new Error(`لید با شناسه ${leadId} یافت نشد.`);

    const session = authService.getActiveSession();
    const activeRole = session?.activeRole;
    if (
      activeRole === 'client' ||
      activeRole === 'content_creator' ||
      activeRole === 'campaign_manager'
    ) {
      throw new Error('خطای دسترسی: نقش فعلی شما مجوز ثبت رویداد برای لید را ندارد.');
    }

    const newEvent: LeadEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId,
      type: input.type,
      title: input.title,
      timestamp: input.timestamp || new Date().toISOString(),
      actorType: input.actorType,
      actor: input.actor || (session?.user ? { id: session.user.id, name: session.user.fullName, role: session.user.role } : { id: 'user-current', name: 'سارا احمدی', role: 'کارشناس فروش' }),
      note: input.note,
      metadata: input.metadata,
    };

    saveStoredEvent(newEvent);
    return newEvent;
  }

  async createCall(
    leadId: string,
    input: CreateCallEventInput
  ): Promise<LeadEvent> {
    await this.simulateDelay();
    const lead = await this.getById(leadId);
    if (!lead) throw new Error(`لید با شناسه ${leadId} یافت نشد.`);

    const session = authService.getActiveSession();
    const activeRole = session?.activeRole;
    if (
      activeRole === 'client' ||
      activeRole === 'content_creator' ||
      activeRole === 'campaign_manager'
    ) {
      throw new Error('خطای دسترسی: نقش فعلی شما مجوز ثبت تماس برای لید را ندارد.');
    }

    const resultLabel = CALL_RESULT_LABELS[input.callResult] || 'تماس تلفنی';
    const newCallEvent: LeadEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId,
      type: 'call',
      title: `ثبت تماس تلفنی (${resultLabel})`,
      timestamp: new Date().toISOString(),
      actorType: 'user',
      actor: input.actor || (session?.user ? { id: session.user.id, name: session.user.fullName, role: session.user.role } : { id: 'user-current', name: 'سارا احمدی', role: 'کارشناس فروش' }),
      note: input.note?.trim() || undefined,
      metadata: {
        callResult: input.callResult,
        callDurationSeconds: Math.max(0, input.callDurationSeconds || 0),
      },
    };

    saveStoredEvent(newCallEvent);
    return newCallEvent;
  }

  /**
   * تغییر وضعیت لید همراه با ثبت خودکار رویداد status_change در تاریخچه
   */
  async updateStatus(
    id: string,
    newStatus: LeadStatus,
    metadata?: LeadEventMetadata
  ): Promise<{ lead: LeadDetail; event: LeadEvent }> {
    try {
      return await leadApi.updateStatus(id, newStatus, metadata);
    } catch (err: any) {
      if (err?.response?.data?.message) {
        const msg = err.response.data.message;
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
      }
      if (err?.response?.status === 403) {
        throw new Error('خطای دسترسی: شما فقط مجاز به تغییر وضعیت لیدهای تخصیص‌یافته به خود هستید');
      }
      throw err;
    }
  }

  /**
   * تخصیص گروهی لیدها به یک کارشناس پیگیری
   */
  async bulkAssign(
    ids: string[],
    assignedTo: LeadActor
  ): Promise<BulkOperationResult> {
    await this.simulateDelay();
    const session = authService.getActiveSession();
    const activeRole = session?.activeRole;

    // کنترل دسترسی سرویس: منحصراً مدیر مارکتینگ و ادمین مجاز به تخصیص لید هستند
    if (activeRole && activeRole !== 'admin' && activeRole !== 'marketing_manager') {
      throw new Error('خطای دسترسی: نقش فعلی شما مجوز تخصیص یا انتساب مجدد لیدها را ندارد. هیچ تغییری اعمال نشد.');
    }

    const succeeded: string[] = [];
    const failed: { id: string; error: string }[] = [];
    const now = new Date().toISOString();

    for (const id of ids) {
      const existing = getStoredLeadById(id);
      if (!existing) {
        failed.push({ id, error: `لید با شناسه ${id} یافت نشد.` });
        continue;
      }

      const updated = updateStoredLead(id, {
        assignedTo,
        assignedToId: assignedTo.id,
        updatedAt: now,
      });

      if (!updated) {
        failed.push({ id, error: `خطا در ذخیره‌سازی تخصیص برای لید ${id}` });
        continue;
      }

      // ثبت رویداد تخصیص در تایم‌لاین لید
      const assignEvent: LeadEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        leadId: id,
        type: 'assigned',
        title: `تخصیص به ${assignedTo.name || 'کارشناس جدید'}`,
        timestamp: now,
        actorType: 'user',
        actor: session?.user ? {
          id: session.user.id,
          name: session.user.fullName,
          role: session.user.role,
        } : {
          id: 'user-current',
          name: 'سارا احمدی',
          role: 'کارشناس فروش',
        },
      };
      saveStoredEvent(assignEvent);

      succeeded.push(id);
    }

    return {
      total: ids.length,
      succeeded,
      failed,
    };
  }

  /**
   * تغییر وضعیت گروهی لیدها همراه با ثبت رویداد برای هر لید
   */
  async bulkUpdateStatus(
    ids: string[],
    newStatus: LeadStatus,
    metadata?: LeadEventMetadata
  ): Promise<BulkOperationResult> {
    await this.simulateDelay();
    const session = authService.getActiveSession();
    const activeRole = session?.activeRole;
    const currentUserId = session?.user?.id;

    if (activeRole && (activeRole === 'client' || activeRole === 'content_creator' || activeRole === 'campaign_manager')) {
      throw new Error('خطای دسترسی: نقش فعلی شما مجوز تغییر وضعیت گروهی لیدها را ندارد.');
    }

    // سیاست اتمیک برای Sales Agent (الزام بخش ۵ دستور):
    // در صورتی که کاربر Sales Agent باشد، تمام لیدها باید متعلق به خودش باشند.
    // در صورت وجود حتی یک لید غیرمجاز، کل عملیات بدون کوچکترین تغییر رد می‌شود (Zero Partial Mutation).
    if (activeRole === 'sales_agent') {
      for (const id of ids) {
        const existing = getStoredLeadById(id);
        if (!existing) {
          throw new Error(`لید با شناسه ${id} یافت نشد. عملیات لغو شد و هیچ تغییری اعمال نشد.`);
        }
        if (!existing.assignedToId || !currentUserId || existing.assignedToId !== currentUserId) {
          throw new Error(`خطای دسترسی: لید «${existing.fullName || id}» به شما تخصیص نیافته است. عملیات تغییر وضعیت گروهی لغو شد و هیچ تغییری اعمال نشد.`);
        }
      }
    }

    const succeeded: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of ids) {
      try {
        try {
          await leadApi.updateStatus(id, newStatus, metadata);
        } catch {
          // در صورت عدم دسترسی به API به ذخیره‌سازی محلی رجوع می‌شود
        }

        const existing = getStoredLeadById(id);
        if (!existing) {
          failed.push({ id, error: `لید با شناسه ${id} یافت نشد.` });
          continue;
        }

        const fromStatus = existing.status;
        const updated = updateStoredLead(id, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        if (!updated) {
          failed.push({ id, error: `خطا در تغییر وضعیت لید ${id}` });
          continue;
        }

        const statusLabel = LEAD_STATUS_LABELS[newStatus] || newStatus;
        const statusEvent: LeadEvent = {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          leadId: id,
          type: 'status_change',
          title: `تغییر وضعیت به ${statusLabel}`,
          timestamp: new Date().toISOString(),
          actorType: 'user',
          actor: session?.user ? {
            id: session.user.id,
            name: session.user.fullName,
            role: session.user.role,
          } : {
            id: 'user-current',
            name: 'سارا احمدی',
            role: 'کارشناس فروش',
          },
          metadata: {
            fromStatus,
            toStatus: newStatus,
            ...metadata,
          },
        };
        saveStoredEvent(statusEvent);

        succeeded.push(id);
      } catch (err) {
        failed.push({
          id,
          error: err instanceof Error ? err.message : 'خطای ناشناخته',
        });
      }
    }

    return {
      total: ids.length,
      succeeded,
      failed,
    };
  }
}

export const leadService = new MockLeadService();
