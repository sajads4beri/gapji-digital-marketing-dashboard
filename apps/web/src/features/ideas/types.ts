export type IdeaStatus =
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'implemented';

export interface IdeaAuthor {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface IdeaItem {
  id: string;
  organizationId: string;
  campaignId?: string | null;
  taskId?: string | null;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  outcomeNotes?: string | null;
  authorId: string;
  votesCount: number;
  createdAt: string;
  updatedAt: string;
  author?: IdeaAuthor;
  campaign?: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
    status: string;
  } | null;
  hasVoted?: boolean;
}

export interface CreateIdeaInput {
  title: string;
  description: string;
  category: string;
  campaignId?: string;
}

export interface UpdateIdeaStatusInput {
  status: IdeaStatus;
  outcomeNotes?: string;
}

export interface ConvertIdeaToTaskInput {
  title?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}
