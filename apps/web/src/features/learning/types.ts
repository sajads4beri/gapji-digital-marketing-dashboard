export type LearningType = 'video' | 'article' | 'book' | 'link';

export interface UserLearningProgressItem {
  id: string;
  organizationId: string;
  userId: string;
  resourceId: string;
  isCompleted: boolean;
  completedAt?: string | null;
  rating?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResourceItem {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  software?: string | null;
  type: LearningType;
  url?: string | null;
  durationMinutes?: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  myProgress?: UserLearningProgressItem | null;
  _count?: {
    userProgress: number;
  };
}

export interface CreateLearningResourceInput {
  title: string;
  category: string;
  software?: string;
  type: LearningType;
  url?: string;
  durationMinutes?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateLearningResourceInput {
  title?: string;
  category?: string;
  software?: string;
  type?: LearningType;
  url?: string;
  durationMinutes?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProgressInput {
  isCompleted?: boolean;
  rating?: number;
  notes?: string;
}

export interface TeamMatrixUser {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  email?: string | null;
  role: string;
  completedCount: number;
  totalResourceCount: number;
  progressPercentage: number;
  progressByResource: Record<
    string,
    {
      isCompleted: boolean;
      rating?: number | null;
      completedAt?: string | null;
    }
  >;
}

export interface TeamProgressMatrixResponse {
  resources: Array<{
    id: string;
    title: string;
    category: string;
    software?: string | null;
    type: string;
    durationMinutes?: number | null;
  }>;
  teamUsers: TeamMatrixUser[];
  totalResourceCount: number;
}
