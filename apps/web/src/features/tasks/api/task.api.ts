/**
 * سرویس ارتباط با API واقعی بک‌اند ماژول مدیریت تسک‌ها (Tasks)
 * متصل به پایگاه داده PostgreSQL و بک‌اند NestJS
 * پیاده‌سازی کامل قرارداد ITaskService
 */

import { api } from '@/lib/api';
import type {
  Task,
  TaskFilters,
  CreateTaskInput,
  QuickCreateTaskInput,
  UpdateTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
  CreateCommentInput,
  SubTask,
  TaskComment,
  TaskHistoryEvent,
  StoredTaskStatus,
} from '../types';
import type { ITaskService } from './task.contract';

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

export class RealTaskService implements ITaskService {
  /**
   * دریافت لیست واقعی تسک‌ها از سرور با فیلترهای چندگانه
   */
  async getAll(filters?: TaskFilters): Promise<Task[]> {
    try {
      const params: Record<string, string | undefined> = {};

      if (filters?.scope) {
        params.scope = filters.scope;
      }
      if (filters?.status) {
        params.status = Array.isArray(filters.status)
          ? filters.status.join(',')
          : filters.status;
      }
      if (filters?.priority) {
        params.priority = Array.isArray(filters.priority)
          ? filters.priority.join(',')
          : filters.priority;
      }
      if (filters?.assigneeId) {
        params.assigneeId = filters.assigneeId;
      }
      if (filters?.relatedType) {
        params.relatedType = filters.relatedType;
      }
      if (filters?.relatedId) {
        params.relatedId = filters.relatedId;
      }
      if (filters?.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters?.funnelStageKey) {
        params.funnelStageKey = filters.funnelStageKey;
      }
      if (filters?.campaignId) {
        params.campaignId = filters.campaignId;
      }

      const { data } = await api.get<Task[]>('/tasks', { params });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در بارگذاری فهرست تسک‌ها از سرور'));
    }
  }

  /**
   * دریافت مشخصات کامل یک تسک با شناسه
   */
  async getById(id: string): Promise<Task | null> {
    try {
      const { data } = await api.get<Task>(`/tasks/${id}`);
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return null;
      }
      throw new Error(extractErrorMessage(err, 'خطا در واکشی مشخصات تسک'));
    }
  }

  /**
   * ایجاد تسک جدید کامل
   */
  async create(input: CreateTaskInput): Promise<Task> {
    try {
      const payload: any = {
        title: input.title.trim(),
        description: input.description?.trim(),
        priority: input.priority || 'medium',
        status: input.status || 'todo',
        dueDate: input.dueDate,
        assigneeId: input.assignee?.id,
        relatedType: input.relatedTo?.type,
        relatedId: input.relatedTo?.id,
        sopId: input.sop?.id,
        subtasks: input.subtasks?.map((s) => ({
          title: s.title.trim(),
          completed: !!s.completed,
        })),
      };

      const { data } = await api.post<Task>('/tasks', payload);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ایجاد تسک جدید'));
    }
  }

  /**
   * ایجاد سریع تسک (از فیلد بالای لیست)
   */
  async quickCreate(input: QuickCreateTaskInput): Promise<Task> {
    const defaultDueDate = input.dueDate || new Date().toISOString().slice(0, 10);
    return this.create({
      title: input.title,
      dueDate: defaultDueDate,
      priority: input.priority || 'medium',
      assignee: input.assignee,
    });
  }

  /**
   * به‌روزرسانی مشخصات تسک
   */
  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    try {
      const payload: any = {};

      if (input.title !== undefined) payload.title = input.title.trim();
      if (input.description !== undefined) payload.description = input.description?.trim();
      if (input.priority !== undefined) payload.priority = input.priority;
      if (input.status !== undefined) payload.status = input.status;
      if (input.dueDate !== undefined) payload.dueDate = input.dueDate;
      if (input.assignee !== undefined) {
        payload.assigneeId = input.assignee ? input.assignee.id : null;
      }
      if (input.relatedTo !== undefined) {
        payload.relatedType = input.relatedTo ? input.relatedTo.type : null;
        payload.relatedId = input.relatedTo ? input.relatedTo.id : null;
      }
      if (input.sop !== undefined) {
        payload.sopId = input.sop ? input.sop.id : null;
      }

      const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ویرایش تسک'));
    }
  }

  /**
   * بایگانی / حذف تسک
   */
  async archive(id: string): Promise<Task> {
    try {
      const existing = await this.getById(id);
      await api.delete(`/tasks/${id}`);
      return (
        existing || {
          id,
          title: 'تسک حذف شده',
          dueDate: '',
          priority: 'medium',
          status: 'done',
          subtasks: [],
          comments: [],
          history: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: true,
        }
      );
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در بایگانی یا حذف تسک'));
    }
  }

  /**
   * بازگردانی تسک
   */
  async restore(id: string): Promise<Task> {
    return this.updateStatus(id, 'todo');
  }

  /**
   * تغییر وضعیت تسک
   */
  async updateStatus(id: string, status: StoredTaskStatus): Promise<Task> {
    try {
      const { data } = await api.patch<Task>(`/tasks/${id}/status`, { status });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تغییر وضعیت تسک'));
    }
  }

  /**
   * تغییر تیک وضعیت تکمیل تسک
   */
  async toggleComplete(id: string, completed?: boolean): Promise<Task> {
    try {
      const { data } = await api.patch<Task>(`/tasks/${id}/toggle-complete`, { completed });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تغییر وضعیت تکمیل تسک'));
    }
  }

  /**
   * تغییر مسئول تسک
   */
  async updateAssignee(id: string, assigneeId: string | null): Promise<Task> {
    try {
      const { data } = await api.patch<Task>(`/tasks/${id}/assignee`, { assigneeId });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تخصیص مسئول تسک'));
    }
  }

  /**
   * تغییر تاریخ سررسید تسک
   */
  async updateDueDate(id: string, dueDate: string): Promise<Task> {
    try {
      const { data } = await api.patch<Task>(`/tasks/${id}/due-date`, { dueDate });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تغییر تاریخ سررسید'));
    }
  }

  /**
   * افزودن کامنت جدید به تسک
   */
  async addComment(taskId: string, input: CreateCommentInput): Promise<TaskComment> {
    try {
      const { data } = await api.post<TaskComment>(`/tasks/${taskId}/comments`, {
        content: input.content.trim(),
      });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ثبت دیدگاه جدید'));
    }
  }

  /**
   * ایجاد زیرتسک جدید در چک‌لیست
   */
  async addSubtask(taskId: string, input: CreateSubtaskInput): Promise<SubTask> {
    try {
      const { data } = await api.post<SubTask>(`/tasks/${taskId}/subtasks`, {
        title: input.title.trim(),
      });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ایجاد زیرتسک'));
    }
  }

  /**
   * ویرایش زیرتسک
   */
  async updateSubtask(
    taskId: string,
    subtaskId: string,
    input: UpdateSubtaskInput,
  ): Promise<SubTask> {
    try {
      const { data } = await api.patch<SubTask>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        title: input.title?.trim(),
        isCompleted: input.completed,
      });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در ویرایش زیرتسک'));
    }
  }

  /**
   * تغییر وضعیت تیک تکمیل یک زیرتسک
   */
  async toggleSubtask(
    taskId: string,
    subtaskId: string,
    completed?: boolean,
  ): Promise<SubTask> {
    try {
      const { data } = await api.patch<SubTask>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
        completed,
      });
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در تغییر وضعیت تیک زیرتسک'));
    }
  }

  /**
   * دریافت تاریخچه رویدادهای تسک از سرور
   */
  async getHistory(taskId: string): Promise<TaskHistoryEvent[]> {
    try {
      const { data } = await api.get<TaskHistoryEvent[]>(`/tasks/${taskId}/history`);
      return data;
    } catch (err: any) {
      throw new Error(extractErrorMessage(err, 'خطا در واکشی تاریخچه رویدادهای تسک'));
    }
  }

  /**
   * دریافت کاربران فعال سازمان جهت گزینه‌های تخصیص تسک
   */
  async getAssignees(): Promise<Array<{ id: string; name: string; email?: string; role?: string }>> {
    try {
      const { data } = await api.get<Array<{ id: string; name: string; email?: string; role?: string }>>(
        '/tasks/assignees',
      );
      return data;
    } catch {
      return [];
    }
  }
}

export const realTaskService = new RealTaskService();
