import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaStatusDto } from './dto/update-idea-status.dto';
import { ConvertIdeaToTaskDto } from './dto/convert-idea-to-task.dto';
import { IdeaStatus, TaskPriority, VoteType } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  organizationId?: string;
  role?: string;
  email?: string;
}

@Injectable()
export class IdeasService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrgId(currentUser: CurrentUserPayload): string {
    const orgId = currentUser.organizationId;
    if (!orgId) {
      throw new BadRequestException('شناسه سازمان در نشست کاربر یافت نشد.');
    }
    return orgId;
  }

  /**
   * واکشی فهرست ایده‌ها به همراه شمارش آرا و وضعیت رأی کاربر جاری
   */
  async findAll(
    currentUser: CurrentUserPayload,
    query?: {
      category?: string;
      status?: string;
      campaignId?: string;
      search?: string;
      sortBy?: 'votes' | 'newest';
    }
  ) {
    const orgId = this.getOrgId(currentUser);
    const where: any = {
      organizationId: orgId,
    };

    if (query?.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (query?.status && query.status !== 'all') {
      where.status = query.status as IdeaStatus;
    }

    if (query?.campaignId) {
      where.campaignId = query.campaignId;
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: any =
      query?.sortBy === 'newest'
        ? [{ createdAt: 'desc' }]
        : [{ votesCount: 'desc' }, { createdAt: 'desc' }];

    const ideas = await this.prisma.idea.findMany({
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        votes: {
          where: {
            userId: currentUser.id,
          },
        },
      },
    });

    return ideas.map((idea) => ({
      ...idea,
      hasVoted: idea.votes.length > 0,
      votes: undefined,
    }));
  }

  /**
   * دریافت مشخصات یک ایده
   */
  async findById(currentUser: CurrentUserPayload, id: string) {
    const orgId = this.getOrgId(currentUser);
    const idea = await this.prisma.idea.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        votes: {
          where: {
            userId: currentUser.id,
          },
        },
      },
    });

    if (!idea) {
      throw new NotFoundException('ایده مورد نظر یافت نشد.');
    }

    return {
      ...idea,
      hasVoted: idea.votes.length > 0,
      votes: undefined,
    };
  }

  /**
   * ثبت ایده نوآورانه جدید
   */
  async create(currentUser: CurrentUserPayload, dto: CreateIdeaDto) {
    const orgId = this.getOrgId(currentUser);

    return this.prisma.idea.create({
      data: {
        organizationId: orgId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category.trim(),
        campaignId: dto.campaignId || null,
        status: IdeaStatus.submitted,
        authorId: currentUser.id,
        votesCount: 0,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * رأی مثبت تک‌کلیکه یا لغو رأی (1-Click Reversible Upvote)
   */
  async toggleVote(currentUser: CurrentUserPayload, id: string) {
    const orgId = this.getOrgId(currentUser);
    const idea = await this.findById(currentUser, id);

    return this.prisma.$transaction(async (tx: any) => {
      const existingVote = await tx.ideaVote.findUnique({
        where: {
          ideaId_userId: {
            ideaId: idea.id,
            userId: currentUser.id,
          },
        },
      });

      if (existingVote) {
        // لغو رأی قبلی
        await tx.ideaVote.delete({
          where: { id: existingVote.id },
        });

        const updatedIdea = await tx.idea.update({
          where: { id: idea.id },
          data: {
            votesCount: {
              decrement: 1,
            },
          },
        });

        return {
          hasVoted: false,
          votesCount: Math.max(0, updatedIdea.votesCount),
        };
      } else {
        // ثبت رأی مثبت جدید
        await tx.ideaVote.create({
          data: {
            organizationId: orgId,
            ideaId: idea.id,
            userId: currentUser.id,
            voteType: VoteType.upvote,
          },
        });

        const updatedIdea = await tx.idea.update({
          where: { id: idea.id },
          data: {
            votesCount: {
              increment: 1,
            },
          },
        });

        return {
          hasVoted: true,
          votesCount: updatedIdea.votesCount,
        };
      }
    });
  }

  /**
   * تغییر وضعیت ایده توسط مدیر (Submitted -> Reviewing -> Approved -> Rejected -> Implemented)
   */
  async updateStatus(currentUser: CurrentUserPayload, id: string, dto: UpdateIdeaStatusDto) {
    const orgId = this.getOrgId(currentUser);
    await this.findById(currentUser, id);

    return this.prisma.idea.update({
      where: { id },
      data: {
        status: dto.status,
        outcomeNotes: dto.outcomeNotes !== undefined ? dto.outcomeNotes : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        task: true,
      },
    });
  }

  /**
   * تبدیل مستقیم ایده مصوب به وظیفه عملیاتی (Pipeline)
   */
  async convertToTask(currentUser: CurrentUserPayload, id: string, dto: ConvertIdeaToTaskDto) {
    const orgId = this.getOrgId(currentUser);
    const idea = await this.findById(currentUser, id);

    if (idea.taskId) {
      throw new BadRequestException('برای این ایده قبلاً وظیفه عملیاتی ایجاد شده است.');
    }

    const taskTitle = dto.title?.trim() || `[اجرای ایده] ${idea.title}`;
    const description = `وظیفه عملیاتی ایجاد شده از ایده پیشنهادی:\n` +
      `عنوان ایده: ${idea.title}\n` +
      `دسته‌بندی: ${idea.category}\n` +
      `پیشنهاددهنده: ${idea.author?.fullName || 'کاربر سیستم'}\n` +
      `تعداد آرا: ${idea.votesCount}\n\n` +
      `شرح ایده:\n${idea.description}`;

    return this.prisma.$transaction(async (tx: any) => {
      const task = await tx.task.create({
        data: {
          organizationId: orgId,
          title: taskTitle,
          description,
          status: 'todo',
          priority: dto.priority || TaskPriority.medium,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          assigneeId: dto.assigneeId || currentUser.id,
          createdById: currentUser.id,
          relatedType: idea.campaignId ? 'campaign' : undefined,
          relatedId: idea.campaignId || undefined,
        },
      });

      const updatedIdea = await tx.idea.update({
        where: { id: idea.id },
        data: {
          taskId: task.id,
          status: IdeaStatus.approved,
        },
        include: {
          task: true,
        },
      });

      return {
        success: true,
        message: 'وظیفه عملیاتی با موفقیت بر اساس ایده ایجاد گردید.',
        task,
        idea: updatedIdea,
      };
    });
  }

  /**
   * حذف ایده
   */
  async delete(currentUser: CurrentUserPayload, id: string) {
    const orgId = this.getOrgId(currentUser);
    await this.findById(currentUser, id);

    await this.prisma.idea.delete({
      where: { id },
    });

    return { success: true, message: 'ایده با موفقیت حذف گردید.' };
  }
}
