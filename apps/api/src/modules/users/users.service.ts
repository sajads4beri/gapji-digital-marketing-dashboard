import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PasswordHasherService } from '../auth/services/password-hasher.service';
import { Role, MembershipStatus } from '@prisma/client';
import { InviteUserDto } from './dto/invite-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { TransferAdminDto } from './dto/transfer-admin.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
  UserResponseDto,
  InviteUserResponseDto,
  ResendInvitationResponseDto,
} from './dto/user-response.dto';

export const DEFAULT_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export interface CurrentUserPayload {
  id: string;
  email: string;
  mobile?: string;
  fullName?: string;
  organizationId: string | null;
  role: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  /**
   * محاسبه هش SHA-256 امن از توکن یک‌بارمصرف خام
   */
  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * اعمال گارد امنیتی ادمین سازمان و احراز مرز سازمانی (Tenant Isolation)
   */
  private assertAdminAccess(user?: CurrentUserPayload): void {
    if (!user) {
      throw new ForbiddenException('احراز هویت الزامی است');
    }
    if (!user.organizationId) {
      throw new BadRequestException('سازمان فعال برای کاربر مشخص نشده است');
    }
    if (user.role !== 'admin') {
      this.logger.warn(`User ${user.id} with role ${user.role} denied admin access to user management`);
      throw new ForbiddenException('دسترسی به این بخش صرفاً برای ادمین سازمان مجاز است');
    }
  }

  /**
   * تبدیل رکورد Membership و User پریزما به DTO استاندارد کلاینت
   */
  public serializeMember(membership: any): UserResponseDto {
    const user = membership.user || {};
    const statusMap: Record<MembershipStatus, 'active' | 'invited' | 'disabled'> = {
      active: 'active',
      invited: 'invited',
      inactive: 'disabled',
    };

    return {
      id: user.id || membership.userId,
      membershipId: membership.id,
      fullName: user.fullName || 'کاربر سیستم',
      email: user.email || '',
      phoneNumber: user.mobile || null,
      role: membership.role as Role,
      status: statusMap[membership.status as MembershipStatus] || 'active',
      avatarUrl: user.avatarUrl || null,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      invitedAt: membership.invitedAt ? new Date(membership.invitedAt).toISOString() : null,
      createdAt: new Date(membership.createdAt).toISOString(),
      updatedAt: new Date(membership.updatedAt).toISOString(),
    };
  }

  /**
   * واکشی فهرست اعضای سازمان جاری با پشتیبانی از فیلتر نقش، وضعیت و جستجوی متنی
   */
  async findAll(
    query?: UserQueryDto,
    currentUser?: CurrentUserPayload,
  ): Promise<UserResponseDto[]> {
    const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;

    const whereClause: any = {
      organizationId: orgId,
    };

    // فیلتر نقش
    if (query?.role && query.role !== 'all') {
      whereClause.role = query.role as Role;
    }

    // فیلتر وضعیت (تطبیق disabled فرانت‌اند با inactive دیتابیس)
    if (query?.status && query.status !== 'all') {
      if (query.status === 'disabled') {
        whereClause.status = MembershipStatus.inactive;
      } else if (['active', 'invited'].includes(query.status)) {
        whereClause.status = query.status as MembershipStatus;
      }
    }

    // فیلتر جستجو
    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      whereClause.user = {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const memberships = await this.prisma.organizationMembership.findMany({
      where: whereClause,
      include: {
        user: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });

    return memberships.map((m) => this.serializeMember(m));
  }

  /**
   * دریافت مشخصات یک عضو مشخص سازمان با شناسه کاربر
   */
  async findOne(userId: string, currentUser?: CurrentUserPayload): Promise<UserResponseDto> {
    const orgId = currentUser?.organizationId || DEFAULT_ORGANIZATION_ID;

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId: orgId,
        userId,
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(`عضو سازمان با شناسه ${userId} یافت نشد`);
    }

    return this.serializeMember(membership);
  }

  /**
   * دعوت کاربر جدید با نشانی ایمیل و نقش سازمانی
   * منطبق بر تصمیمات DEC-AUTH-02، DEC-AUTH-04 و DEC-AUTH-05
   */
  async invite(
    dto: InviteUserDto,
    currentUser: CurrentUserPayload,
  ): Promise<InviteUserResponseDto> {
    this.assertAdminAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;
    const normalizedEmail = dto.email.trim().toLowerCase();

    // ۱. بررسی وجود کاربر با این ایمیل در دیتابیس سراسری
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let isExistingUser = Boolean(user);

    // ۲. تولید توکن یک‌بارمصرف رمزنگاری‌شده (۳۲ بایت امن)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // انقضا: ۷۲ ساعت (DEC-AUTH-04)

    const membership = await this.prisma.$transaction(async (tx) => {
      // اگر کاربر وجود ندارد، رکورد اولیه کاربر را با رمز قفل‌شده موقت بساز
      if (!user) {
        const lockedPasswordHash = `INVITED_LOCKED_${crypto.randomUUID()}`;
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            fullName: dto.fullName?.trim() || 'کاربر دعوت‌شده',
            mobile: dto.phoneNumber?.trim() || null,
            passwordHash: lockedPasswordHash,
            isActive: true,
          },
        });
      } else {
        // بازاستفاده از حساب موجود (DEC-AUTH-05)
        // بررسی عضویت قبلی در همین سازمان
        const existingMembership = await tx.organizationMembership.findUnique({
          where: {
            organizationId_userId: {
              organizationId: orgId,
              userId: user.id,
            },
          },
        });

        if (existingMembership) {
          if (existingMembership.status === MembershipStatus.active) {
            throw new BadRequestException('این کاربر در حال حاضر عضو فعال این سازمان است');
          }
          if (existingMembership.status === MembershipStatus.invited) {
            throw new BadRequestException(
              'دعوت‌نامه برای این کاربر قبلاً ارسال شده و در انتظار پذیرش است. از گزینه ارسال مجدد استفاده فرمایید.',
            );
          }
          // در صورت غیرفعال بودن عضویت قبلی، مجدداً به وضعیت دعوت‌شده با توکن جدید بازمی‌گردد
          const updated = await tx.organizationMembership.update({
            where: { id: existingMembership.id },
            data: {
              role: dto.role,
              status: MembershipStatus.invited,
              invitedAt: new Date(),
              invitationTokenHash: tokenHash,
              invitationExpiresAt: expiresAt,
            },
            include: { user: true },
          });

          await tx.userActivityLog.create({
            data: {
              userId: currentUser.id,
              organizationId: orgId,
              action: 'MEMBER_REINVITED',
              entityType: 'OrganizationMembership',
              entityId: updated.id,
              details: JSON.stringify({ email: normalizedEmail, role: dto.role }),
            },
          });

          return updated;
        }
      }

      // ایجاد عضویت جدید
      const newMembership = await tx.organizationMembership.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          role: dto.role,
          status: MembershipStatus.invited,
          invitedAt: new Date(),
          invitationTokenHash: tokenHash,
          invitationExpiresAt: expiresAt,
        },
        include: { user: true },
      });

      // ثبت در لاگ فعالیت‌های سیستم
      await tx.userActivityLog.create({
        data: {
          userId: currentUser.id,
          organizationId: orgId,
          action: 'MEMBER_INVITED',
          entityType: 'OrganizationMembership',
          entityId: newMembership.id,
          details: JSON.stringify({
            email: normalizedEmail,
            role: dto.role,
            isExistingUser,
          }),
        },
      });

      return newMembership;
    });

    this.logger.log(
      `Invitation dispatched for ${normalizedEmail} with role ${dto.role} in org ${orgId}`,
    );

    return {
      user: this.serializeMember(membership),
      message: isExistingUser
        ? 'کاربر موجود با موفقیت به سازمان دعوت شد.'
        : 'دعوت‌نامه کاربر جدید با موفقیت صادر گردید.',
      invitationToken: rawToken,
    };
  }

  /**
   * ارسال مجدد دعوت‌نامه برای کاربر در انتظار پذیرش
   */
  async resendInvite(
    userId: string,
    currentUser: CurrentUserPayload,
  ): Promise<ResendInvitationResponseDto> {
    this.assertAdminAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId: orgId,
        userId,
      },
      include: { user: true },
    });

    if (!membership) {
      throw new NotFoundException(`کاربر با شناسه ${userId} در این سازمان یافت نشد`);
    }

    if (membership.status !== MembershipStatus.invited) {
      throw new BadRequestException(
        'ارسال مجدد دعوت‌نامه صرفاً برای کاربران با وضعیت «دعوت‌شده» امکان‌پذیر است',
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.organizationMembership.update({
        where: { id: membership.id },
        data: {
          invitationTokenHash: tokenHash,
          invitationExpiresAt: expiresAt,
          invitedAt: now,
        },
      });

      await tx.userActivityLog.create({
        data: {
          userId: currentUser.id,
          organizationId: orgId,
          action: 'INVITATION_RESENT',
          entityType: 'OrganizationMembership',
          entityId: membership.id,
          details: JSON.stringify({ email: membership.user?.email }),
        },
      });
    });

    return {
      success: true,
      sentAt: now.toISOString(),
      message: `دعوت‌نامه مجدد با موفقیت برای نشانی ${membership.user?.email} صادر گردید.`,
      invitationToken: rawToken,
    };
  }

  /**
   * تغییر نقش کاربری با رعایت الزامات ایمنی و گارد آخرین ادمین (DEC-AUTH-07)
   */
  async changeRole(
    userId: string,
    dto: ChangeRoleDto,
    currentUser: CurrentUserPayload,
  ): Promise<UserResponseDto> {
    this.assertAdminAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;
    const targetRole = dto.newRole || dto.role;

    if (!targetRole) {
      throw new BadRequestException('نقش جدید سازمانی مشخص نشده است');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // واکشی عضویت هدف با تضمین انزوای تننت
      const membership = await tx.organizationMembership.findFirst({
        where: {
          organizationId: orgId,
          userId,
        },
        include: { user: true },
      });

      if (!membership) {
        throw new NotFoundException(`عضویت کاربر در این سازمان یافت نشد`);
      }

      // گارد حیاتی خلع نقش آخرین ادمین (DEC-AUTH-07)
      if (membership.role === Role.admin && targetRole !== Role.admin) {
        const activeAdminsCount = await tx.organizationMembership.count({
          where: {
            organizationId: orgId,
            role: Role.admin,
            status: MembershipStatus.active,
          },
        });

        if (activeAdminsCount <= 1) {
          throw new BadRequestException(
            'امکان خلع نقش آخرین ادمین فعال سازمان وجود ندارد. ابتدا ادمین جدید را منصوب کنید.',
          );
        }
      }

      const res = await tx.organizationMembership.update({
        where: { id: membership.id },
        data: { role: targetRole },
        include: { user: true },
      });

      await tx.userActivityLog.create({
        data: {
          userId: currentUser.id,
          organizationId: orgId,
          action: 'MEMBER_ROLE_CHANGED',
          entityType: 'OrganizationMembership',
          entityId: membership.id,
          details: JSON.stringify({
            userId,
            previousRole: membership.role,
            newRole: targetRole,
          }),
        },
      });

      return res;
    });

    return this.serializeMember(updated);
  }

  /**
   * غیرفعال‌سازی کاربر با رعایت گارد آخرین ادمین و ابطال سشن‌های فعال
   */
  async deactivate(userId: string, currentUser: CurrentUserPayload): Promise<UserResponseDto> {
    this.assertAdminAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const updated = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.organizationMembership.findFirst({
        where: {
          organizationId: orgId,
          userId,
        },
        include: { user: true },
      });

      if (!membership) {
        throw new NotFoundException(`عضویت کاربر در این سازمان یافت نشد`);
      }

      // گارد حیاتی غیرفعال‌سازی آخرین ادمین (DEC-AUTH-07)
      if (membership.role === Role.admin && membership.status === MembershipStatus.active) {
        const activeAdminsCount = await tx.organizationMembership.count({
          where: {
            organizationId: orgId,
            role: Role.admin,
            status: MembershipStatus.active,
          },
        });

        if (activeAdminsCount <= 1) {
          throw new BadRequestException(
            'امکان غیرفعال‌سازی آخرین ادمین فعال سازمان وجود ندارد.',
          );
        }
      }

      const res = await tx.organizationMembership.update({
        where: { id: membership.id },
        data: { status: MembershipStatus.inactive },
        include: { user: true },
      });

      // ابطال سشن‌های فعال این کاربر در این سازمان
      await tx.session.updateMany({
        where: {
          userId,
          organizationId: orgId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'MEMBERSHIP_DEACTIVATED',
        },
      });

      await tx.userActivityLog.create({
        data: {
          userId: currentUser.id,
          organizationId: orgId,
          action: 'MEMBER_DEACTIVATED',
          entityType: 'OrganizationMembership',
          entityId: membership.id,
          details: JSON.stringify({ userId }),
        },
      });

      return res;
    });

    return this.serializeMember(updated);
  }

  /**
   * فعال‌سازی مجدد حساب کاربری غیرفعال‌شده
   */
  async activate(userId: string, currentUser: CurrentUserPayload): Promise<UserResponseDto> {
    this.assertAdminAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    const updated = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.organizationMembership.findFirst({
        where: {
          organizationId: orgId,
          userId,
        },
        include: { user: true },
      });

      if (!membership) {
        throw new NotFoundException(`عضویت کاربر در این سازمان یافت نشد`);
      }

      const res = await tx.organizationMembership.update({
        where: { id: membership.id },
        data: {
          status: MembershipStatus.active,
          joinedAt: membership.joinedAt || new Date(),
        },
        include: { user: true },
      });

      await tx.userActivityLog.create({
        data: {
          userId: currentUser.id,
          organizationId: orgId,
          action: 'MEMBER_ACTIVATED',
          entityType: 'OrganizationMembership',
          entityId: membership.id,
          details: JSON.stringify({ userId }),
        },
      });

      return res;
    });

    return this.serializeMember(updated);
  }

  /**
   * انتقال اتمیک اختیارات ادمین سازمان (DEC-AUTH-07)
   */
  async transferAdmin(
    dto: TransferAdminDto,
    currentUser: CurrentUserPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.assertAdminAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    if (dto.replacementUserId === currentUser.id) {
      throw new BadRequestException('کاربر جایگزین نمی‌تواند خود ادمین فعلی باشد');
    }

    await this.prisma.$transaction(async (tx) => {
      // بررسی عضویت کاربر جایگزین
      const replacement = await tx.organizationMembership.findFirst({
        where: {
          organizationId: orgId,
          userId: dto.replacementUserId,
          status: MembershipStatus.active,
        },
      });

      if (!replacement) {
        throw new NotFoundException('کاربر جایگزین عضو فعال این سازمان نیست');
      }

      // تنزل ادمین قبلی به مدیر مارکتینگ
      await tx.organizationMembership.updateMany({
        where: {
          organizationId: orgId,
          userId: currentUser.id,
        },
        data: { role: Role.marketing_manager },
      });

      // ارتقای عضو جایگزین به ادمین
      await tx.organizationMembership.update({
        where: { id: replacement.id },
        data: { role: Role.admin },
      });

      // ثبت در لاگ فعالیت
      await tx.userActivityLog.create({
        data: {
          userId: currentUser.id,
          organizationId: orgId,
          action: 'ADMIN_AUTHORITY_TRANSFERRED',
          entityType: 'OrganizationMembership',
          entityId: replacement.id,
          details: JSON.stringify({
            previousAdmin: currentUser.id,
            newAdmin: dto.replacementUserId,
          }),
        },
      });
    });

    return {
      success: true,
      message: 'مسئولیت مدیریت ارشد سازمان با موفقیت انتقال یافت.',
    };
  }

  /**
   * پذیرش دعوت‌نامه و فعال‌سازی حساب کاربری با توکن یک‌بارمصرف
   * پروتکل پذیرش DEC-AUTH-04 و DEC-AUTH-05
   */
  async acceptInvite(dto: AcceptInvitationDto): Promise<{ success: boolean; message: string; user: UserResponseDto }> {
    const tokenHash = this.hashToken(dto.token.trim());

    const result = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.organizationMembership.findFirst({
        where: {
          invitationTokenHash: tokenHash,
        },
        include: { user: true },
      });

      if (!membership) {
        throw new BadRequestException('توکن دعوت‌نامه نامعتبر است یا یافت نشد');
      }

      if (membership.status !== MembershipStatus.invited) {
        throw new BadRequestException('این دعوت‌نامه قبلاً پذیرفته شده یا غیرفعال است');
      }

      if (membership.invitationExpiresAt && membership.invitationExpiresAt < new Date()) {
        throw new BadRequestException('مهلت اعتبار این دعوت‌نامه منقضی شده است');
      }

      const user = membership.user;

      // اگر کاربر جدید است یا رمز قفل‌شده دارد، رمز عبور ارسالی تنظیم می‌شود
      const isTemporaryPassword = user.passwordHash.startsWith('INVITED_LOCKED_');
      if (isTemporaryPassword) {
        if (!dto.password || dto.password.length < 8) {
          throw new BadRequestException('تعیین کلمه عبور با حداقل ۸ نویسه الزامی است');
        }

        const newHash = await this.passwordHasher.hash(dto.password);
        await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash: newHash,
            fullName: dto.fullName?.trim() || user.fullName,
            mobile: dto.mobile?.trim() || user.mobile,
            isActive: true,
          },
        });
      }

      // فعال‌سازی عضویت و باطل‌سازی توکن
      const updatedMembership = await tx.organizationMembership.update({
        where: { id: membership.id },
        data: {
          status: MembershipStatus.active,
          joinedAt: new Date(),
          invitationTokenHash: null,
          invitationExpiresAt: null,
        },
        include: { user: true },
      });

      await tx.userActivityLog.create({
        data: {
          userId: user.id,
          organizationId: membership.organizationId,
          action: 'INVITATION_ACCEPTED',
          entityType: 'OrganizationMembership',
          entityId: membership.id,
          details: JSON.stringify({ email: user.email }),
        },
      });

      return updatedMembership;
    });

    return {
      success: true,
      message: 'دعوت‌نامه با موفقیت پذیرفته شد و عضویت شما در سازمان فعال گردید.',
      user: this.serializeMember(result),
    };
  }

  /**
   * ماتریس رسمی سطوح دسترسی نقش‌های شش‌گانه (منطبق بر صفحه ۲۳ سند محصول)
   */
  async getAccessMatrix(currentUser?: CurrentUserPayload) {
    const base = {
      roles: [
        Role.admin,
        Role.marketing_manager,
        Role.campaign_manager,
        Role.sales_agent,
        Role.content_creator,
        Role.client,
      ],
      operations: [
        {
          id: 'dashboard_view',
          title: 'مشاهده داشبورد اجرایی و آمار کلان',
          category: 'performance_campaigns',
          description: 'دسترسی به شاخص‌های مالی، نمودارها و هشدارهای کلان',
        },
        {
          id: 'campaigns_manage',
          title: 'مدیریت و ساخت کمپین‌ها',
          category: 'performance_campaigns',
          description: 'ایجاد، ویرایش و مدیریت کمپین‌ها در ویزارد',
        },
        {
          id: 'costs_manage',
          title: 'ثبت و مدیریت هزینه‌های بازاریابی',
          category: 'performance_campaigns',
          description: 'ثبت اسناد هزینه، ویرایش و تأیید مبالغ',
        },
        {
          id: 'leads_view',
          title: 'مشاهده صندوق و برد لیدها',
          category: 'sales_leads',
          description: 'دسترسی به کانبان سرنخ‌ها و پرونده مشتریان',
        },
        {
          id: 'leads_manage',
          title: 'ثبت و پیگیری لیدها',
          category: 'sales_leads',
          description: 'تغییر وضعیت، تخصیص کارشناس و ثبت تماس',
        },
        {
          id: 'tasks_manage',
          title: 'مدیریت تسک‌ها و فعالیت‌های اجرایی',
          category: 'tasks_settings',
          description: 'ایجاد تسک، چک‌لیست و پیگیری وظایف',
        },
        {
          id: 'users_manage',
          title: 'مدیریت کاربران و نقش‌ها',
          category: 'tasks_settings',
          description: 'دعوت اعضا، تغییر نقش و تعیین دسترسی',
        },
        {
          id: 'settings_manage',
          title: 'تنظیمات ساختاری سازمان',
          category: 'tasks_settings',
          description: 'مدیریت لیست‌ها، پلتفرم‌ها و یکپارچه‌سازی‌ها',
        },
      ],
      matrix: {
        admin: {
          dashboard_view: true,
          campaigns_manage: true,
          costs_manage: true,
          leads_view: true,
          leads_manage: true,
          tasks_manage: true,
          users_manage: true,
          settings_manage: true,
        },
        marketing_manager: {
          dashboard_view: true,
          campaigns_manage: true,
          costs_manage: true,
          leads_view: true,
          leads_manage: true,
          tasks_manage: true,
          users_manage: false,
          settings_manage: false,
        },
        campaign_manager: {
          dashboard_view: false,
          campaigns_manage: true,
          costs_manage: true,
          leads_view: false,
          leads_manage: false,
          tasks_manage: true,
          users_manage: false,
          settings_manage: false,
        },
        sales_agent: {
          dashboard_view: false,
          campaigns_manage: false,
          costs_manage: false,
          leads_view: true,
          leads_manage: true,
          tasks_manage: true,
          users_manage: false,
          settings_manage: false,
        },
        content_creator: {
          dashboard_view: false,
          campaigns_manage: false,
          costs_manage: false,
          leads_view: false,
          leads_manage: false,
          tasks_manage: true,
          users_manage: false,
          settings_manage: false,
        },
        client: {
          dashboard_view: true,
          campaigns_manage: false,
          costs_manage: false,
          leads_view: false,
          leads_manage: false,
          tasks_manage: false,
          users_manage: false,
          settings_manage: false,
        },
      },
    };

    if (currentUser?.organizationId) {
      try {
        const customTaxonomy = await this.prisma.organizationTaxonomy.findFirst({
          where: {
            organizationId: currentUser.organizationId,
            taxonomyType: 'permissions_matrix',
            key: 'custom_matrix',
          },
        });
        if (customTaxonomy && customTaxonomy.label) {
          const parsed = JSON.parse(customTaxonomy.label);
          base.matrix = {
            ...base.matrix,
            ...parsed,
          };
        }
      } catch (e) {
        // بازگشت به ماتریس پیش‌فرض در صورت خطای پارس
      }
    }

    return base;
  }

  /**
   * بروزرسانی و ذخیره ماتریس دسترسی سازمان (ویژه ادمین)
   */
  async updateAccessMatrix(
    dto: { matrix: Record<string, Record<string, boolean>> },
    currentUser: CurrentUserPayload,
  ) {
    this.assertAdminAccess(currentUser);
    const orgId = currentUser.organizationId || DEFAULT_ORGANIZATION_ID;

    // ادمین نمی‌تواند دسترسی مدیریت کاربران یا تنظیمات خود را لغو کند
    if (dto.matrix?.admin) {
      dto.matrix.admin.users_manage = true;
      dto.matrix.admin.settings_manage = true;
    }

    const jsonString = JSON.stringify(dto.matrix);

    await this.prisma.organizationTaxonomy.upsert({
      where: {
        organizationId_taxonomyType_key: {
          organizationId: orgId,
          taxonomyType: 'permissions_matrix',
          key: 'custom_matrix',
        },
      },
      update: {
        label: jsonString,
        isActive: true,
      },
      create: {
        organizationId: orgId,
        taxonomyType: 'permissions_matrix',
        key: 'custom_matrix',
        label: jsonString,
        isSystem: true,
      },
    });

    return this.getAccessMatrix(currentUser);
  }
}
