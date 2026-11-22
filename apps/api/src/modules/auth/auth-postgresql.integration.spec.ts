import * as fs from 'fs';
import * as path from 'path';

// Automatically load .env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

import * as assert from 'assert';
import * as crypto from 'crypto';
import { PrismaClient, TokenStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SEED_DATA } from '../../../prisma/seed';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://shop:shop1234@127.0.0.1:5432/gapji_dev?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: { url: DATABASE_URL },
  },
});

const configService = new ConfigService({
  'jwt.secret': 'gapji-super-secure-dev-jwt-secret-key-at-least-32-chars!',
  'jwt.expiresIn': '15m',
  'jwt.refreshExpiresIn': '7d',
});

const jwtService = new JwtService({
  secret: 'gapji-super-secure-dev-jwt-secret-key-at-least-32-chars!',
  signOptions: { expiresIn: '15m' },
});

const passwordHasher = new PasswordHasherService();
const authService = new AuthService(
  prisma as any,
  passwordHasher,
  jwtService,
  configService,
);
const jwtStrategy = new JwtStrategy(configService, prisma as any);

async function runPostgresIntegrationTests() {
  console.log('🐘 ========================================================');
  console.log('🐘 Real PostgreSQL Integration & Concurrency Test Suite');
  console.log('🐘 Target Database: gapji_dev (PostgreSQL Instance)');
  console.log('🐘 ========================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ ${name}`);
      console.error(`     Error: ${err?.message || err}`);
      if (err?.stack) {
        console.error(`     Stack: ${err.stack.split('\n').slice(0, 3).join('\n')}`);
      }
      failed++;
    }
  }

  // Helper to clean up test sessions created during tests
  async function cleanupSessionsForUser(userId: string) {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  const commonPassword = SEED_DATA.commonPassword;
  const adminEmail = 'admin@gapji.dev';
  const marketingMobile = '09120000002';
  const inactiveEmail = 'inactive@gapji.dev';
  const ambiguousEmail = 'ambiguous@gapji.dev';
  const multisessionEmail = 'multisession@gapji.dev';

  // =========================================================================
  // 1. Database & Migration Schema Integrity Tests
  // =========================================================================
  console.log('--- 1. Database & Migration Schema Integrity Verification ---');

  await test('1.1: Migration history consistency in _prisma_migrations', async () => {
    const migrations = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date; applied_steps_count: number }>
    >`SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at ASC;`;

    assert.strictEqual(migrations.length >= 2, true, 'At least 2 migrations must be present');
    assert.strictEqual(
      migrations.some((m) => m.migration_name.includes('foundation_database_schema')),
      true,
      'Foundation migration must be applied',
    );
    assert.strictEqual(
      migrations.some((m) => m.migration_name.includes('auth_refresh_token_family')),
      true,
      'Auth Refresh Token Family migration must be applied',
    );
    for (const m of migrations) {
      assert.strictEqual(m.applied_steps_count, 1, `Migration ${m.migration_name} steps count must be 1`);
      assert.notStrictEqual(m.finished_at, null, `Migration ${m.migration_name} must have finished_at`);
    }
  });

  await test('1.2: Enforce Foreign-Key constraint (refresh_tokens -> sessions)', async () => {
    const dummyId = crypto.randomUUID();
    const dummySessionId = crypto.randomUUID();
    const dummyUserId = crypto.randomUUID();
    const tokenHash = crypto.randomBytes(32).toString('hex');

    await assert.rejects(
      async () => {
        await prisma.refreshToken.create({
          data: {
            id: dummyId,
            sessionId: dummySessionId,
            userId: dummyUserId,
            tokenHash,
            status: TokenStatus.ACTIVE,
            expiresAt: new Date(Date.now() + 100000),
          },
        });
      },
      (err: any) => {
        assert.match(err.message, /Foreign key constraint|foreign key|fkey/i);
        return true;
      },
    );
  });

  await test('1.3: Enforce Partial Unique Index (at most one ACTIVE token per session)', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
    const sessionId = crypto.randomUUID();
    const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create a real session
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt: sessionExpires,
      },
    });

    try {
      // First active token succeeds
      const token1Id = crypto.randomUUID();
      const token1Hash = crypto.randomBytes(32).toString('hex');
      await prisma.refreshToken.create({
        data: {
          id: token1Id,
          sessionId,
          userId: user.id,
          tokenHash: token1Hash,
          status: TokenStatus.ACTIVE,
          expiresAt: sessionExpires,
        },
      });

      // Second ACTIVE token for the same session MUST fail with unique index violation
      const token2Id = crypto.randomUUID();
      const token2Hash = crypto.randomBytes(32).toString('hex');
      await assert.rejects(
        async () => {
          await prisma.refreshToken.create({
            data: {
              id: token2Id,
              sessionId,
              userId: user.id,
              tokenHash: token2Hash,
              status: TokenStatus.ACTIVE,
              expiresAt: sessionExpires,
            },
          });
        },
        (err: any) => {
          assert.match(err.message, /Unique constraint failed|refresh_tokens_one_active_per_session_idx/i);
          return true;
        },
      );
    } finally {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
  });

  await test('1.4: Enforce Database Check Constraints (chk_no_self_replace & chk_consumed_state)', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
    const sessionId = crypto.randomUUID();
    const sessionExpires = new Date(Date.now() + 100000);

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt: sessionExpires,
      },
    });

    try {
      const tokenId = crypto.randomUUID();
      // Violation of chk_no_self_replace: replacedByTokenId = id
      await assert.rejects(
        async () => {
          await prisma.$executeRaw`
            INSERT INTO "refresh_tokens" ("id", "sessionId", "userId", "tokenHash", "status", "replacedByTokenId", "expiresAt")
            VALUES (${tokenId}::uuid, ${sessionId}::uuid, ${user.id}::uuid, ${crypto.randomBytes(32).toString('hex')}, 'ACTIVE'::"TokenStatus", ${tokenId}::uuid, ${sessionExpires});
          `;
        },
        (err: any) => {
          assert.match(err.message, /chk_no_self_replace/i);
          return true;
        },
      );

      // Violation of chk_consumed_state: status = 'CONSUMED' without replacedByTokenId / consumedAt
      await assert.rejects(
        async () => {
          await prisma.$executeRaw`
            INSERT INTO "refresh_tokens" ("id", "sessionId", "userId", "tokenHash", "status", "expiresAt")
            VALUES (${crypto.randomUUID()}::uuid, ${sessionId}::uuid, ${user.id}::uuid, ${crypto.randomBytes(32).toString('hex')}, 'CONSUMED'::"TokenStatus", ${sessionExpires});
          `;
        },
        (err: any) => {
          assert.match(err.message, /chk_consumed_state/i);
          return true;
        },
      );
    } finally {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
  });

  await test('1.5: Validate pre-backfill SHA-256 Hex regex check pattern', async () => {
    // Test that PostgreSQL POSIX regex correctly identifies valid 64-hex strings vs invalid strings
    const checkValid = await prisma.$queryRaw<Array<{ is_valid: boolean }>>`
      SELECT ('a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890' ~ '^[0-9a-fA-F]{64}$') AS is_valid;
    `;
    assert.strictEqual(checkValid[0].is_valid, true);

    const checkInvalidLength = await prisma.$queryRaw<Array<{ is_valid: boolean }>>`
      SELECT ('a1b2c3d4' ~ '^[0-9a-fA-F]{64}$') AS is_valid;
    `;
    assert.strictEqual(checkInvalidLength[0].is_valid, false);

    const checkInvalidChars = await prisma.$queryRaw<Array<{ is_valid: boolean }>>`
      SELECT ('g1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6789z' ~ '^[0-9a-fA-F]{64}$') AS is_valid;
    `;
    assert.strictEqual(checkInvalidChars[0].is_valid, false);
  });

  // =========================================================================
  // 2. Authentication Integration Tests
  // =========================================================================
  console.log('\n--- 2. Real PostgreSQL Authentication Integration Tests ---');

  await test('2.1: Login with Email against real Argon2id hash', async () => {
    const res = await authService.login(
      { identifier: adminEmail, password: commonPassword },
      { ipAddress: '127.0.0.1', userAgent: 'PostgresTest/1.0' },
    );

    assert.ok(res.response.accessToken, 'Access token must be present');
    assert.ok(res.rawRefreshToken, 'Raw refresh token must be present');
    assert.strictEqual(res.response.user.email, adminEmail);
    assert.strictEqual(res.response.user.role, 'admin');

    // Verify session in PostgreSQL
    const session = await prisma.session.findFirst({
      where: { userId: res.response.user.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(session, 'Session must exist in PostgreSQL');
    assert.strictEqual(session.isRevoked, false);

    // Verify refresh token in PostgreSQL
    const tokenHash = authService.hashToken(res.rawRefreshToken);
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    assert.ok(token, 'RefreshToken must exist in PostgreSQL');
    assert.strictEqual(token.status, TokenStatus.ACTIVE);
    assert.strictEqual(token.sessionId, session.id);

    await cleanupSessionsForUser(res.response.user.id);
  });

  await test('2.2: Login with Mobile phone number', async () => {
    const res = await authService.login(
      { identifier: marketingMobile, password: commonPassword },
      { ipAddress: '127.0.0.1' },
    );

    assert.ok(res.response.accessToken);
    assert.strictEqual(res.response.user.mobile, marketingMobile);
    assert.strictEqual(res.response.user.role, 'marketing_manager');

    await cleanupSessionsForUser(res.response.user.id);
  });

  await test('2.3: Rejection on Invalid Password (anti-enumeration)', async () => {
    await assert.rejects(
      async () => {
        await authService.login({ identifier: adminEmail, password: 'WrongPassword999!' });
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /اطلاعات ورود نامعتبر است/);
        return true;
      },
    );
  });

  await test('2.4: Rejection on Non-Existent User', async () => {
    await assert.rejects(
      async () => {
        await authService.login({ identifier: 'doesnotexist@gapji.dev', password: commonPassword });
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /اطلاعات ورود نامعتبر است/);
        return true;
      },
    );
  });

  await test('2.5: Rejection on Inactive User', async () => {
    await assert.rejects(
      async () => {
        await authService.login({ identifier: inactiveEmail, password: commonPassword });
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /غیرفعال/);
        return true;
      },
    );
  });

  await test('2.6: Rejection on Ambiguous Organization Membership', async () => {
    // ambiguous@gapji.dev has 2 active memberships across 2 organizations
    await assert.rejects(
      async () => {
        await authService.login({ identifier: ambiguousEmail, password: commonPassword });
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /چندین عضویت فعال|سازمان مشخص نشده/);
        return true;
      },
    );
  });

  await test('2.7: JWT Access Token validation via JwtStrategy against real DB', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
    const payload = {
      sub: user.id,
      email: user.email!,
      orgId: '00000000-0000-0000-0000-000000000001',
      role: 'admin',
    };

    const validatedUser = await jwtStrategy.validate(payload);
    assert.strictEqual(validatedUser.id, user.id);
    assert.strictEqual(validatedUser.email, adminEmail);

    // Inactive user in payload throws UnauthorizedException
    const inactiveUser = await prisma.user.findUniqueOrThrow({ where: { email: inactiveEmail } });
    await assert.rejects(
      async () => {
        await jwtStrategy.validate({ sub: inactiveUser.id, email: inactiveEmail, orgId: null, role: 'client' });
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        return true;
      },
    );
  });

  await test('2.8: Single Refresh Token Rotation (Zero Grace Period)', async () => {
    const login = await authService.login({ identifier: adminEmail, password: commonPassword });
    const t1Hash = authService.hashToken(login.rawRefreshToken);

    const rotation = await authService.rotate(login.rawRefreshToken);
    assert.ok(rotation.accessToken);
    assert.ok(rotation.rawRefreshToken);
    assert.notStrictEqual(rotation.rawRefreshToken, login.rawRefreshToken);

    // Verify in PostgreSQL: T1 is CONSUMED and replacedBy points to T2
    const t1 = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: t1Hash } });
    const t2Hash = authService.hashToken(rotation.rawRefreshToken);
    const t2 = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: t2Hash } });

    assert.strictEqual(t1.status, TokenStatus.CONSUMED);
    assert.notStrictEqual(t1.consumedAt, null);
    assert.strictEqual(t1.replacedByTokenId, t2.id);

    assert.strictEqual(t2.status, TokenStatus.ACTIVE);
    assert.strictEqual(t2.replacedByTokenId, null);

    await cleanupSessionsForUser(login.response.user.id);
  });

  await test('2.9: Sequential Rotations forming Genealogical Chain in PostgreSQL', async () => {
    const login = await authService.login({ identifier: adminEmail, password: commonPassword });
    const rot1 = await authService.rotate(login.rawRefreshToken);
    const rot2 = await authService.rotate(rot1.rawRefreshToken);
    const rot3 = await authService.rotate(rot2.rawRefreshToken);

    const t1 = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: authService.hashToken(login.rawRefreshToken) } });
    const t2 = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: authService.hashToken(rot1.rawRefreshToken) } });
    const t3 = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: authService.hashToken(rot2.rawRefreshToken) } });
    const t4 = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: authService.hashToken(rot3.rawRefreshToken) } });

    assert.strictEqual(t1.replacedByTokenId, t2.id);
    assert.strictEqual(t2.replacedByTokenId, t3.id);
    assert.strictEqual(t3.replacedByTokenId, t4.id);

    assert.strictEqual(t1.status, TokenStatus.CONSUMED);
    assert.strictEqual(t2.status, TokenStatus.CONSUMED);
    assert.strictEqual(t3.status, TokenStatus.CONSUMED);
    assert.strictEqual(t4.status, TokenStatus.ACTIVE);

    await cleanupSessionsForUser(login.response.user.id);
  });

  await test('2.10: Replay Detection on Consumed Token (T1 replay)', async () => {
    const login = await authService.login({ identifier: adminEmail, password: commonPassword });
    const rot1 = await authService.rotate(login.rawRefreshToken);

    // Replay attack: present consumed T1 again
    await assert.rejects(
      async () => {
        await authService.rotate(login.rawRefreshToken);
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /امنیت نشست به خطر افتاده است/);
        return true;
      },
    );

    // Verify session is revoked in PostgreSQL
    const session = await prisma.session.findUniqueOrThrow({ where: { id: (await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: authService.hashToken(login.rawRefreshToken) } })).sessionId } });
    assert.strictEqual(session.isRevoked, true);
    assert.strictEqual(session.revokedReason, 'REPLAY_ATTACK_DETECTED');

    // Verify all tokens for this user are now REVOKED or CONSUMED (no ACTIVE tokens)
    const activeTokens = await prisma.refreshToken.count({
      where: { userId: login.response.user.id, status: TokenStatus.ACTIVE },
    });
    assert.strictEqual(activeTokens, 0, 'No active tokens must remain after replay attack');

    await cleanupSessionsForUser(login.response.user.id);
  });

  await test('2.11: Replay Detection on Revoked Token', async () => {
    const login = await authService.login({ identifier: adminEmail, password: commonPassword });
    const tokenHash = authService.hashToken(login.rawRefreshToken);

    // Manually revoke the token
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { status: TokenStatus.REVOKED, revokedAt: new Date() },
    });

    await assert.rejects(
      async () => {
        await authService.rotate(login.rawRefreshToken);
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /توکن قبلاً باطل شده است/);
        return true;
      },
    );

    await cleanupSessionsForUser(login.response.user.id);
  });

  await test('2.12: Unknown token hash behavior (Anti-DoS)', async () => {
    const randomRawToken = crypto.randomBytes(64).toString('hex');
    await assert.rejects(
      async () => {
        await authService.rotate(randomRawToken);
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /توکن رفرش نامعتبر است/);
        return true;
      },
    );
  });

  await test('2.13: Expired refresh token behavior (status EXPIRED or past expiresAt)', async () => {
    const login = await authService.login({ identifier: adminEmail, password: commonPassword });
    const tokenHash = authService.hashToken(login.rawRefreshToken);

    // Manually set expiration in the past
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });

    await assert.rejects(
      async () => {
        await authService.rotate(login.rawRefreshToken);
      },
      (err: any) => {
        assert.strictEqual(err.name, 'UnauthorizedException');
        assert.match(err.message, /منقضی شده است/);
        return true;
      },
    );

    // Verify session marked SESSION_EXPIRED
    const session = await prisma.session.findFirst({
      where: { userId: login.response.user.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.strictEqual(session?.isRevoked, true);
    assert.strictEqual(session?.revokedReason, 'SESSION_EXPIRED');

    await cleanupSessionsForUser(login.response.user.id);
  });

  await test('2.14: Logout and Soft Session Revocation', async () => {
    const login = await authService.login({ identifier: adminEmail, password: commonPassword });
    const logoutRes = await authService.logout(login.rawRefreshToken);
    assert.strictEqual(logoutRes.success, true);

    const session = await prisma.session.findFirst({
      where: { userId: login.response.user.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.strictEqual(session?.isRevoked, true);
    assert.strictEqual(session?.revokedReason, 'USER_LOGOUT');

    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash: authService.hashToken(login.rawRefreshToken) },
    });
    assert.strictEqual(token?.status, TokenStatus.REVOKED);

    await cleanupSessionsForUser(login.response.user.id);
  });

  await test('2.15: Multiple independent sessions for one user', async () => {
    const userMulti = await prisma.user.findUniqueOrThrow({ where: { email: multisessionEmail } });
    await cleanupSessionsForUser(userMulti.id);

    const login1 = await authService.login(
      { identifier: multisessionEmail, password: commonPassword },
      { userAgent: 'Device-A/Desktop' },
    );
    const login2 = await authService.login(
      { identifier: multisessionEmail, password: commonPassword },
      { userAgent: 'Device-B/Mobile' },
    );

    // Both sessions exist and are active
    const activeSessions = await prisma.session.findMany({
      where: { userId: login1.response.user.id, isRevoked: false },
    });
    assert.strictEqual(activeSessions.length, 2, 'User must have 2 active sessions in PostgreSQL');

    // Rotate Session 1
    const rot1 = await authService.rotate(login1.rawRefreshToken);
    assert.ok(rot1.accessToken);

    // Rotate Session 2
    const rot2 = await authService.rotate(login2.rawRefreshToken);
    assert.ok(rot2.accessToken);

    // Both sessions should still be active
    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId: login1.response.user.id, status: TokenStatus.ACTIVE },
    });
    assert.strictEqual(activeTokens.length, 2, 'Both sessions have independent active tokens');

    await cleanupSessionsForUser(login1.response.user.id);
  });

  await test('2.16: Cross-user session isolation on Replay Attack', async () => {
    const userA = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
    const userB = await prisma.user.findUniqueOrThrow({ where: { email: multisessionEmail } });
    await cleanupSessionsForUser(userA.id);
    await cleanupSessionsForUser(userB.id);

    const loginUserA = await authService.login({ identifier: adminEmail, password: commonPassword });
    const loginUserB = await authService.login({ identifier: multisessionEmail, password: commonPassword });

    // Rotate User A token once
    const rotUserA = await authService.rotate(loginUserA.rawRefreshToken);

    // Replay attack on User A
    await assert.rejects(async () => {
      await authService.rotate(loginUserA.rawRefreshToken);
    });

    // Verify User A sessions are revoked
    const userASessions = await prisma.session.findMany({
      where: { userId: loginUserA.response.user.id, isRevoked: false },
    });
    assert.strictEqual(userASessions.length, 0, 'User A sessions must be completely revoked');

    // Verify User B sessions REMAIN ACTIVE in PostgreSQL!
    const userBSessions = await prisma.session.findMany({
      where: { userId: loginUserB.response.user.id, isRevoked: false },
    });
    assert.strictEqual(userBSessions.length, 1, 'User B sessions must NOT be affected by User A replay');

    await cleanupSessionsForUser(loginUserA.response.user.id);
    await cleanupSessionsForUser(loginUserB.response.user.id);
  });

  // =========================================================================
  // 3. Real PostgreSQL Concurrency Tests
  // =========================================================================
  console.log('\n--- 3. Real PostgreSQL Concurrency & Pessimistic Locking Tests ---');

  await test('3.1: True Concurrent Refresh Requests on the Same Token (Race Condition)', async () => {
    const userAdmin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
    await cleanupSessionsForUser(userAdmin.id);

    const login = await authService.login({ identifier: adminEmail, password: commonPassword });
    const initialToken = login.rawRefreshToken;

    // Fire 5 genuine concurrent rotation requests simultaneously against PostgreSQL
    const concurrencyFactor = 5;
    const promises = Array.from({ length: concurrencyFactor }, (_, i) =>
      authService.rotate(initialToken, { userAgent: `ConcurrentClient-${i}` }),
    );

    const results = await Promise.allSettled(promises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    console.log(`     [Concurrency] ${fulfilled.length} succeeded, ${rejected.length} rejected`);

    // In a race condition with Zero Grace Period and pessimistic row-locking:
    // Exactly ONE request can succeed, and remaining concurrent requests must be rejected,
    // OR if replay detection triggers during the race, at most 1 succeeds.
    assert.strictEqual(fulfilled.length <= 1, true, 'At most ONE concurrent request may succeed');
    assert.strictEqual(rejected.length >= concurrencyFactor - 1, true, 'All other concurrent requests must fail');

    // Check PostgreSQL state
    const session = await prisma.session.findFirst({
      where: { userId: login.response.user.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(session, 'Session must exist');

    const activeTokensInDb = await prisma.refreshToken.findMany({
      where: { sessionId: session.id, status: TokenStatus.ACTIVE },
    });

    // Invariant check: Engine-level invariant holds - at most 1 active token in DB
    assert.strictEqual(activeTokensInDb.length <= 1, true, 'Database partial index invariant preserved');

    await cleanupSessionsForUser(login.response.user.id);
  });

  await test('3.2: Concurrent Refresh on Independent Sessions of the Same User', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: multisessionEmail } });
    await cleanupSessionsForUser(user.id);

    const loginA = await authService.login(
      { identifier: multisessionEmail, password: commonPassword },
      { userAgent: 'Session-A' },
    );
    const loginB = await authService.login(
      { identifier: multisessionEmail, password: commonPassword },
      { userAgent: 'Session-B' },
    );

    // Concurrently rotate both independent sessions
    const [resA, resB] = await Promise.all([
      authService.rotate(loginA.rawRefreshToken),
      authService.rotate(loginB.rawRefreshToken),
    ]);

    assert.ok(resA.accessToken, 'Session A rotation must succeed');
    assert.ok(resB.accessToken, 'Session B rotation must succeed');

    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId: loginA.response.user.id, status: TokenStatus.ACTIVE },
    });
    assert.strictEqual(activeTokens.length, 2, 'Both independent sessions remain active in DB');

    await cleanupSessionsForUser(loginA.response.user.id);
  });

  console.log('\n========================================');
  console.log(`🐘 Real PostgreSQL Integration Test Summary:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPostgresIntegrationTests()
    .catch((err) => {
      console.error('Fatal Integration Test Runner Failure:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
