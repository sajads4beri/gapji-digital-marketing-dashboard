export interface MeetingActionItem {
  id: string;
  organizationId: string;
  meetingId: string;
  taskId?: string | null;
  description: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  task?: {
    id: string;
    title: string;
    status: string;
    priority?: string;
  } | null;
}

export interface MeetingItem {
  id: string;
  organizationId: string;
  campaignId?: string | null;
  title: string;
  meetingDate: string;
  location?: string | null;
  attendeesSummary?: string | null;
  summary?: string | null;
  notes?: string | null;
  versionNumber: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  campaign?: {
    id: string;
    name: string;
  } | null;
  actionItems: MeetingActionItem[];
}

export interface CreateMeetingInput {
  title: string;
  meetingDate: string;
  location?: string;
  attendeesSummary?: string;
  summary?: string;
  notes?: string;
  campaignId?: string;
  actionItems?: Array<{
    description: string;
    assigneeId?: string;
    dueDate?: string;
  }>;
}

export interface UpdateMeetingInput {
  title?: string;
  meetingDate?: string;
  location?: string;
  attendeesSummary?: string;
  summary?: string;
  notes?: string;
  campaignId?: string;
}

export interface CreateActionItemInput {
  description: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface EmailPreviewResponse {
  meetingId: string;
  subject: string;
  htmlContent: string;
  attendees?: string | null;
  actionItemsCount: number;
}
