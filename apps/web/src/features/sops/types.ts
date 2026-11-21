export type SopStatus = 'draft' | 'active' | 'archived';

export interface SopAuthor {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface SopVersionItem {
  id: string;
  organizationId: string;
  sopId: string;
  versionNumber: string;
  changeSummary?: string | null;
  content: string;
  createdById: string;
  createdAt: string;
  createdBy?: SopAuthor;
}

export interface SopItem {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  category: string;
  currentVersion: string;
  status: SopStatus;
  authorId: string;
  approverId?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: SopAuthor;
  approver?: SopAuthor | null;
  versions?: SopVersionItem[];
  _count?: {
    versions: number;
    tasksUsingSop: number;
  };
}

export interface CreateSopInput {
  title: string;
  code: string;
  category: string;
  content: string;
  status?: SopStatus;
  approverId?: string;
}

export interface UpdateSopInput {
  title?: string;
  code?: string;
  category?: string;
  content?: string;
  status?: SopStatus;
  approverId?: string;
  changeSummary?: string;
  bumpMajor?: boolean;
}

export interface CreateTaskFromSopInput {
  title?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  parseChecklistAsSubtasks?: boolean;
}
