import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface RotationResult {
  accessToken: string;
  rawRefreshToken: string;
  tokenType: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Primary authentication endpoint supporting Email or Mobile phone identifier.
   * Source: Product Document p. 6 §1; DEC-AUTH-01
   */
  async login(
    dto: LoginDto,
    metadata: RequestMetadata = {},
  ): Promise<{ response: AuthResponseDto; rawRefreshToken: string }> {
    const identifier = dto.identifier.trim();

    // 1. Find user by email or mobile
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { mobile: identifier }],
      },
      include: {
        memberships: {
          where: { status: 'active' },
        },
      },
    });

    // 2. Generic rejection for non-existent users (anti-enumeration)
    if (!user) {
      throw new UnauthorizedException('اطلاعات ورود نامعتبر است');
    }

    // 3. Inactive user check
    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است');
    }

    // 4. Verify password with Argon2id
    const isPasswordValid = await this.passwordHasher.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('اطلاعات ورود نامعتبر است');
    }

    // 5. Resolve active tenant organization and role
    // Safety requirement (B2.3.6 §2): Ambiguous login with multiple active memberships must be rejected
    if (user.memberships.length > 1) {
      this.logger.warn(
        `Ambiguous login attempt for user ${user.id}: multiple active memberships found (${user.memberships.length})`,
      );
      throw new UnauthorizedException(
        'ورود ناموفق: حساب کاربری دارای چندین عضویت فعال سازمانی است و سازمان مشخص نشده است',
      );
    }

    const activeMembership = user.memberships[0];
    const organizationId = activeMembership?.organizationId || null;
    const role = activeMembership?.role || 'client';

    // 6. Token lifetimes (DEC-AUTH-01: Access 15m, Refresh 7d)
    const refreshLifetimeMs = 7 * 24 * 60 * 60 * 1000;
    const sessionExpiresAt = new Date(Date.now() + refreshLifetimeMs);

    // 7. Generate opaque refresh token
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshTokenId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

    // 8. Create session and initial active refresh token atomically
    await this.prisma.$transaction(async (tx) => {
      await tx.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          organizationId,
          userAgent: metadata.userAgent ? metadata.userAgent.substring(0, 500) : null,
          ipAddress: metadata.ipAddress ? metadata.ipAddress.substring(0, 45) : null,
          expiresAt: sessionExpiresAt,
        },
      });

      await tx.refreshToken.create({
        data: {
          id: refreshTokenId,
          sessionId,
          userId: user.id,
          tokenHash,
          status: 'ACTIVE',
          expiresAt: sessionExpiresAt,
        },
      });

      // Update lastLoginAt
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Audit log
      await tx.userActivityLog.create({
        data: {
          userId: user.id,
          organizationId,
          action: 'AUTH_LOGIN_SUCCESS',
          entityType: 'Session',
          entityId: sessionId,
          details: JSON.stringify({
            loginMethod: dto.identifier.includes('@') ? 'email' : 'mobile',
          }),
          ipAddress: metadata.ipAddress ? metadata.ipAddress.substring(0, 45) : null,
          userAgent: metadata.userAgent ? metadata.userAgent.substring(0, 500) : null,
        },
      });
    });

    // 9. Generate JWT access token (15m)
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        orgId: organizationId,
        role,
      },
      {
        expiresIn: '15m',
      },
    );

    const response: AuthResponseDto = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        fullName: user.fullName,
        role,
        organizationId,
      },
      redirectUrl: '/', // DEC-AUTH-10
    };

    return { response, rawRefreshToken };
  }

  /**
   * Atomic refresh token rotation and replay detection with Zero Grace Period.
   * Order: User -> Session -> RefreshToken
   * Source: DEC-AUTH-01; B2.3.2.1 §4.1; B2.3.2.3 & B2.3.2.4
   */
  async rotate(
    rawRefreshToken: string,
    metadata: RequestMetadata = {},
  ): Promise<RotationResult> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('توکن رفرش ارائه نشده است');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    // 1. Initial lookup to locate token record
    const initialToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        status: true,
        expiresAt: true,
      },
    });

    // Anti-DoS: Unknown token hash returns 401 without user-wide revocation
    if (!initialToken) {
      this.logger.warn(`Refresh attempt with unknown token hash: ${tokenHash.substring(0, 8)}...`);
      throw new UnauthorizedException('توکن رفرش نامعتبر است');
    }

    // 2. Execute rotation within interactive transaction with retry
    const result = await this.executeWithRetry<any>(async () => {
      return this.prisma.$transaction(async (tx) => {
        // Hierarchical pessimistic locking: User -> Session -> RefreshToken
        const [lockedUser] = await tx.$queryRaw<Array<{ id: string; isActive: boolean }>>`
          SELECT id, "isActive" FROM users WHERE id = ${initialToken.userId}::uuid FOR UPDATE
        `;

        if (!lockedUser || !lockedUser.isActive) {
          throw new UnauthorizedException('حساب کاربری فعال نیست');
        }

        const [lockedSession] = await tx.$queryRaw<Array<{ id: string; isRevoked: boolean; expiresAt: Date; organizationId: string | null }>>`
          SELECT id, "isRevoked", "expiresAt", "organizationId" FROM sessions WHERE id = ${initialToken.sessionId}::uuid FOR UPDATE
        `;

        if (!lockedSession) {
          throw new UnauthorizedException('سشن یافت نشد');
        }

        const [lockedToken] = await tx.$queryRaw<Array<{
          id: string;
          status: 'ACTIVE' | 'CONSUMED' | 'REVOKED' | 'EXPIRED';
          expiresAt: Date;
          replacedByTokenId: string | null;
        }>>`
          SELECT id, status, "expiresAt", "replacedByTokenId" FROM refresh_tokens WHERE id = ${initialToken.id}::uuid FOR UPDATE
        `;

        if (!lockedToken) {
          throw new UnauthorizedException('توکن یافت نشد');
        }

        // Re-validate security states under lock
        const now = new Date();

        // Check if session was already revoked
        if (lockedSession.isRevoked) {
          this.logger.warn(`Refresh attempt on already revoked session: ${lockedSession.id}`);
          // Global invalidation for safety
          await this.invalidateAllUserSessions(
            tx,
            initialToken.userId,
            'REVOKED_SESSION_ACCESSED',
            metadata,
          );
          return { error: 'REVOKED_SESSION_ACCESSED', message: 'سشن نامعتبر یا ابطال شده است' };
        }

        // REPLAY DETECTION: Token is CONSUMED
        if (lockedToken.status === 'CONSUMED') {
          this.logger.error(
            `🚨 CRITICAL: Replay attack detected for user ${initialToken.userId}! Consumed token ${lockedToken.id} replayed.`,
          );
          await this.invalidateAllUserSessions(
            tx,
            initialToken.userId,
            'REPLAY_ATTACK_DETECTED',
            metadata,
            lockedToken.id,
          );
          return {
            error: 'REPLAY_ATTACK_DETECTED',
            message: 'امنیت نشست به خطر افتاده است؛ تمامی سشن‌های فعال لغو شدند',
          };
        }

        // REPLAY DETECTION: Token is REVOKED
        if (lockedToken.status === 'REVOKED') {
          this.logger.error(
            `🚨 CRITICAL: Compromised credential replay! Revoked token ${lockedToken.id} presented for user ${initialToken.userId}.`,
          );
          await this.invalidateAllUserSessions(
            tx,
            initialToken.userId,
            'REVOKED_TOKEN_REPLAY_DETECTED',
            metadata,
            lockedToken.id,
          );
          return {
            error: 'REVOKED_TOKEN_REPLAY_DETECTED',
            message: 'توکن قبلاً باطل شده است؛ تمامی سشن‌های فعال لغو شدند',
          };
        }

        // Check expiration or expired status
        if (lockedToken.status === 'EXPIRED' || lockedToken.expiresAt <= now) {
          if (lockedToken.status !== 'EXPIRED') {
            await tx.refreshToken.update({
              where: { id: lockedToken.id },
              data: { status: 'EXPIRED' },
            });
          }
          await tx.session.update({
            where: { id: lockedSession.id },
            data: {
              isRevoked: true,
              revokedAt: now,
              revokedReason: 'SESSION_EXPIRED',
            },
          });
          return {
            error: 'SESSION_EXPIRED',
            message: 'توکن رفرش منقضی شده است؛ لطفاً دوباره وارد شوید',
          };
        }

        // Valid ACTIVE token: execute atomic rotation
        const successorId = crypto.randomUUID();
        const newRawRefreshToken = crypto.randomBytes(64).toString('hex');
        const newHash = this.hashToken(newRawRefreshToken);
        const refreshLifetimeMs = 7 * 24 * 60 * 60 * 1000;
        const newExpiresAt = new Date(now.getTime() + refreshLifetimeMs);

        // 1. Mark predecessor as CONSUMED and link to successor
        await tx.refreshToken.update({
          where: { id: lockedToken.id },
          data: {
            status: 'CONSUMED',
            consumedAt: now,
            replacedByTokenId: successorId,
          },
        });

        // 2. Insert successor token (single active token per session preserved)
        await tx.refreshToken.create({
          data: {
            id: successorId,
            sessionId: lockedSession.id,
            userId: initialToken.userId,
            tokenHash: newHash,
            status: 'ACTIVE',
            expiresAt: newExpiresAt,
          },
        });

        // 3. Update session rolling expiration
        await tx.session.update({
          where: { id: lockedSession.id },
          data: {
            expiresAt: newExpiresAt,
            updatedAt: now,
          },
        });

        // 4. Audit success
        await tx.userActivityLog.create({
          data: {
            userId: initialToken.userId,
            action: 'AUTH_REFRESH_SUCCESS',
            entityType: 'Session',
            entityId: lockedSession.id,
            details: JSON.stringify({
              previousTokenId: lockedToken.id,
              newTokenId: successorId,
            }),
            ipAddress: metadata.ipAddress ? metadata.ipAddress.substring(0, 45) : null,
            userAgent: metadata.userAgent ? metadata.userAgent.substring(0, 500) : null,
          },
        });

        // Fetch user data for new access token
        const user = await tx.user.findUnique({
          where: { id: initialToken.userId },
          include: {
            memberships: {
              where: { status: 'active' },
            },
          },
        });

        // Resolve active membership matching the session's pinned organizationId
        let activeMembership = null;
        if (lockedSession.organizationId) {
          activeMembership = user?.memberships.find(
            (m) => m.organizationId === lockedSession.organizationId,
          ) || null;
        } else if (user?.memberships.length === 1) {
          activeMembership = user.memberships[0];
        }

        const organizationId = lockedSession.organizationId || activeMembership?.organizationId || null;
        const role = activeMembership?.role || 'client';
        const accessToken = await this.jwtService.signAsync(
          {
            sub: initialToken.userId,
            email: user?.email,
            orgId: organizationId,
            role,
          },
          {
            expiresIn: '15m',
          },
        );

        return {
          accessToken,
          rawRefreshToken: newRawRefreshToken,
          tokenType: 'Bearer',
          expiresIn: 900,
        };
      });
    });

    if (result && 'error' in result && result.error) {
      throw new UnauthorizedException(result.message);
    }

    return result as RotationResult;
  }

  /**
   * Voluntary logout: Soft-revokes session and active refresh token without destroying history.
   * Source: B2.3.2.3 §8.3 & B2.3.2.4 §9
   */
  async logout(
    rawRefreshToken?: string,
    metadata: RequestMetadata = {},
  ): Promise<{ success: boolean }> {
    if (!rawRefreshToken) {
      return { success: true };
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, sessionId: true, userId: true },
    });

    if (!token) {
      return { success: true };
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // Soft revoke session
      await tx.session.update({
        where: { id: token.sessionId },
        data: {
          isRevoked: true,
          revokedAt: now,
          revokedReason: 'USER_LOGOUT',
        },
      });

      // Mark active token as REVOKED
      await tx.refreshToken.updateMany({
        where: { sessionId: token.sessionId, status: 'ACTIVE' },
        data: {
          status: 'REVOKED',
          revokedAt: now,
        },
      });

      // Audit log
      await tx.userActivityLog.create({
        data: {
          userId: token.userId,
          action: 'AUTH_LOGOUT',
          entityType: 'Session',
          entityId: token.sessionId,
          details: JSON.stringify({ reason: 'USER_LOGOUT' }),
          ipAddress: metadata.ipAddress ? metadata.ipAddress.substring(0, 45) : null,
          userAgent: metadata.userAgent ? metadata.userAgent.substring(0, 500) : null,
        },
      });
    });

    return { success: true };
  }

  /**
   * Invalidates all active sessions and active tokens for a user upon replay detection.
   */
  private async invalidateAllUserSessions(
    tx: any,
    userId: string,
    reason: string,
    metadata: RequestMetadata,
    triggerTokenId?: string,
  ): Promise<void> {
    const now = new Date();

    // 1. Soft-revoke all active sessions
    await tx.session.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: now,
        revokedReason: reason,
      },
    });

    // 2. Revoke all active refresh tokens
    await tx.refreshToken.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        revokedAt: now,
      },
    });

    // 3. Record high-risk security audit log in same transaction
    await tx.userActivityLog.create({
      data: {
        userId,
        action: reason === 'REPLAY_ATTACK_DETECTED'
          ? 'AUTH_REPLAY_ATTACK_DETECTED'
          : 'AUTH_REVOKED_TOKEN_REPLAY_DETECTED',
        entityType: 'SessionFamily',
        details: JSON.stringify({
          severity: 'CRITICAL',
          reason,
          triggerTokenId,
          timestamp: now.toISOString(),
        }),
        ipAddress: metadata.ipAddress ? metadata.ipAddress.substring(0, 45) : null,
        userAgent: metadata.userAgent ? metadata.userAgent.substring(0, 500) : null,
      },
    });
  }

  /**
   * Hashes a raw token with SHA-256 returning a 64-character hex string.
   */
  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Bounded retry helper for database concurrency / deadlock errors (PostgreSQL 40P01).
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        if (
          (error.code === '40P01' || error.message?.includes('deadlock detected')) &&
          attempt < maxRetries
        ) {
          const jitter = Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, attempt * 50 + jitter));
          continue;
        }
        throw error;
      }
    }
    throw new InternalServerErrorException('Transaction failed after maximum retries');
  }
}
