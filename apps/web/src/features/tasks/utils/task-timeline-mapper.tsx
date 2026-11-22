import type { TimelineEvent, TimelineItemVariant } from '@/components/common/timeline/types';
import type { TaskHistoryEvent, TaskEventType } from '../types';

/**
 * تعیین سبک بصری و رنگ‌بندی نشانگر تایم‌لاین بر اساس نوع رویداد تسک
 */
function getEventVariant(type: TaskEventType, metadata?: Record<string, unknown>): TimelineItemVariant {
  switch (type) {
    case 'task_created':
      return 'info';
    case 'status_changed':
      if (metadata?.toStatus === 'done') return 'success';
      if (metadata?.toStatus === 'waiting') return 'warning';
      return 'info';
    case 'subtask_toggled':
      return metadata?.completed ? 'success' : 'default';
    case 'due_date_changed':
      return 'warning';
    case 'comment_added':
      return 'neutral';
    case 'task_archived':
      return 'danger';
    case 'task_restored':
      return 'info';
    case 'assignee_changed':
    case 'task_updated':
    case 'priority_changed':
    default:
      return 'default';
  }
}

/**
 * تبدیل رویدادهای تاریخچه تسک به ساختار سازگار با کامپوننت عمومی Timeline
 * مرتب‌شده از جدید به قدیم (Newest First)
 */
export function mapTaskHistoryToTimelineEvents(events: TaskHistoryEvent[]): TimelineEvent[] {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  // سورت از جدیدترین به قدیمی‌ترین
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return sorted.map((event) => {
    return {
      id: event.id,
      title: event.title,
      timestamp: event.createdAt,
      actorType: 'user',
      actor: event.actor
        ? {
            name: event.actor.name,
            role: event.actor.role,
            avatarUrl: event.actor.avatarUrl,
          }
        : undefined,
      description: event.description,
      variant: getEventVariant(event.type, event.metadata),
      metadata: event.metadata as Record<string, any>,
    };
  });
}
