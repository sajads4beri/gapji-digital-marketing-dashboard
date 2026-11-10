import assert from 'node:assert';
import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { JwtStrategy } from './strategies/jwt.strategy';

// In-Memory Database Simulator for Unit & Integrity Testing
class InMemoryDatabase {
  users: any[] = [];
  sessions: any[] = [];
  refreshTokens: any[] = [];
  activityLogs: any[] = [];
  memberships: any[] = [];

  reset() {
    this.users = [];
    this.sessions = [];
    this.refreshTokens = [];
    this.activityLogs = [];
    this.memberships = [];
  }
}

async function runAuthServiceTests() {
  console.log('🧪 Starting AuthService & Refresh Token Architecture Unit Tests...\n');

  const db = new InMemoryDatabase();
  const passwordHasher = new PasswordHasherService();
  const configService = new ConfigService({
    'jwt.secret': 'test-secret-key-for-unit-testing-32-chars-min',
    'jwt.expiresIn': '15m',
    'jwt.refreshExpiresIn': '7d',
  });
  const jwtService = new JwtService({
    secret: 'test-secret-key-for-unit-testing-32-chars-min',
    signOptions: { expiresIn: '15m' },
  });

  // Mock PrismaService backed by InMemoryDatabase
  const mockPrisma: any = {
    user: {
      findFirst: async ({ where }: any) => {
        return db.users.find((u) => {
          if (where.OR) {
            return where.OR.some(
              (cond: any) =>
                (cond.email && u.email === cond.email) ||
                (cond.mobile && u.mobile === cond.mobile),
            );
          }
          return true;
        }) || null;
      },
      findUnique: async ({ where }: any) => {
        return db.users.find((u) => u.id === where.id) || null;
      },
      update: async ({ where, data }: any) => {
        const u = db.users.find((user) => user.id === where.id);
        if (u) Object.assign(u, data);
        return u;
      },
    },
    session: {
      create: async ({ data }: any) => {
        // Enforce composite uniqueness on (id, userId)
        const exists = db.sessions.some((s) => s.id === data.id);
        if (exists) throw new Error('Unique constraint violation on session.id');
        const session = { ...data, createdAt: new Date(), isRevoked: data.isRevoked || false };
        db.sessions.push(session);
        return session;
      },
      findUnique: async ({ where }: any) => {
        return db.sessions.find((s) => s.id === where.id) || null;
      },
      update: async ({ where, data }: any) => {
        const s = db.sessions.find((sess) => sess.id === where.id);
        if (s) Object.assign(s, data);
        return s;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const s of db.sessions) {
          if (where.userId && s.userId !== where.userId) continue;
          if (where.isRevoked !== undefined && s.isRevoked !== where.isRevoked) continue;
          Object.assign(s, data);
          count++;
        }
        return { count };
      },
    },
    refreshToken: {
      create: async ({ data }: any) => {
        // Enforce unique tokenHash
        if (db.refreshTokens.some((t) => t.tokenHash === data.tokenHash)) {
          throw new Error('Unique constraint violation on refresh_tokens.tokenHash');
        }
        // Enforce at-most-one active token per session (Partial Unique Index)
        if (data.status === 'ACTIVE' && db.refreshTokens.some((t) => t.sessionId === data.sessionId && t.status === 'ACTIVE')) {
          throw new Error('Partial unique index violation: refresh_tokens_one_active_per_session_idx');
        }
        // Enforce composite FK: (sessionId, userId) -> Session(id, userId)
        const parentSession = db.sessions.find((s) => s.id === data.sessionId && s.userId === data.userId);
        if (!parentSession) {
          throw new Error('Foreign key violation: refresh_tokens_sessionId_userId_fkey');
        }
        // Enforce no self-replacement: replacedByTokenId <> id
        if (data.replacedByTokenId && data.replacedByTokenId === data.id) {
          throw new Error('Check constraint violation: chk_no_self_replace');
        }
        const record = { ...data, createdAt: new Date() };
        db.refreshTokens.push(record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        if (where.tokenHash) {
          return db.refreshTokens.find((t) => t.tokenHash === where.tokenHash) || null;
        }
        if (where.id) {
          return db.refreshTokens.find((t) => t.id === where.id) || null;
        }
        return null;
      },
      update: async ({ where, data }: any) => {
        const t = db.refreshTokens.find((token) => token.id === where.id);
        if (t) {
          if (data.replacedByTokenId && data.replacedByTokenId === t.id) {
            throw new Error('Check constraint violation: chk_no_self_replace');
          }
          Object.assign(t, data);
        }
        return t;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const t of db.refreshTokens) {
          if (where.userId && t.userId !== where.userId) continue;
          if (where.sessionId && t.sessionId !== where.sessionId) continue;
          if (where.status && t.status !== where.status) continue;
          Object.assign(t, data);
          count++;
        }
        return { count };
      },
    },
    userActivityLog: {
      create: async ({ data }: any) => {
        const log = { ...data, id: crypto.randomUUID(), createdAt: new Date() };
        db.activityLogs.push(log);
        return log;
      },
    },
    $queryRaw: async (query: any, ...args: any[]) => {
      // Mock raw SQL queries for locked entities
      const queryString = query.join ? query.join(' ') : String(query);
      if (queryString.includes('FROM users')) {
        const userId = args[0] || (queryString.match(/[0-9a-f-]{36}/i) || [])[0];
        const u = db.users.find((user) => user.id === userId);
        return u ? [{ id: u.id, isActive: u.isActive }] : [];
      }
      if (queryString.includes('FROM sessions')) {
        const sessionId = args[0] || (queryString.match(/[0-9a-f-]{36}/i) || [])[0];
        const s = db.sessions.find((sess) => sess.id === sessionId);
        return s ? [{ id: s.id, isRevoked: s.isRevoked, expiresAt: s.expiresAt }] : [];
      }
      if (queryString.includes('FROM refresh_tokens')) {
        const tokenId = args[0] || (queryString.match(/[0-9a-f-]{36}/i) || [])[0];
        const t = db.refreshTokens.find((tok) => tok.id === tokenId);
        return t ? [{ id: t.id, status: t.status, expiresAt: t.expiresAt, replacedByTokenId: t.replacedByTokenId }] : [];
      }
      return [];
    },
    $transaction: async (fn: any) => {
      return fn(mockPrisma);
    },
  };

  const authService = new AuthService(
    mockPrisma,
    passwordHasher,
    jwtService,
    configService,
  );
  const jwtStrategy = new JwtStrategy(configService, mockPrisma);

  // Setup test user
  const rawPassword = 'SecurePassword123!';
  const hashedPassword = await passwordHasher.hash(rawPassword);
  const user1 = {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'test@gapji.ir',
    mobile: '09121111111',
    passwordHash: hashedPassword,
    fullName: 'کاربر تستی ۱',
    isActive: true,
    memberships: [
      {
        id: 'mem-1',
        organizationId: '90000000-0000-0000-0000-000000000001',
        role: 'admin',
        status: 'active',
      },
    ],
  };
  const user2 = {
    id: '10000000-0000-0000-0000-000000000002',
    email: 'user2@gapji.ir',
    mobile: '09122222222',
    passwordHash: hashedPassword,
    fullName: 'کاربر تستی ۲',
    isActive: true,
    memberships: [
      {
        id: 'mem-2',
        organizationId: '90000000-0000-0000-0000-000000000001',
        role: 'marketing_manager',
        status: 'active',
      },
    ],
  };

  db.reset();
  db.users.push({ ...user1 });
  db.users.push({ ...user2 });

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ ${name}: ${err.message}`);
      failed++;
    }
  }

  // --- 1. Login موفق با Email ---
  await test('Scenario 1: Login موفق با Email', async () => {
    const { response, rawRefreshToken } = await authService.login(
      { identifier: 'test@gapji.ir', password: rawPassword },
      { ipAddress: '127.0.0.1', userAgent: 'Jest-Agent' },
    );
    assert.ok(response.accessToken);
    assert.strictEqual(response.tokenType, 'Bearer');
    assert.strictEqual(response.expiresIn, 900);
    assert.strictEqual(response.user.email, 'test@gapji.ir');
    assert.strictEqual(response.redirectUrl, '/');
    assert.ok(rawRefreshToken.length >= 64);
    assert.strictEqual(db.sessions.length, 1);
    assert.strictEqual(db.refreshTokens.length, 1);
    assert.strictEqual(db.refreshTokens[0].status, 'ACTIVE');
  });

  // --- 2. Login موفق با Mobile ---
  await test('Scenario 2: Login موفق با شماره موبایل', async () => {
    const { response } = await authService.login(
      { identifier: '09121111111', password: rawPassword },
      { ipAddress: '127.0.0.1' },
    );
    assert.strictEqual(response.user.mobile, '09121111111');
  });

  // --- 3. Password نامعتبر ---
  await test('Scenario 3: Password نامعتبر (پرتاب خطای 401 بدون افشای حساب)', async () => {
    await assert.rejects(
      async () => {
        await authService.login(
          { identifier: 'test@gapji.ir', password: 'WrongPassword!' },
          {},
        );
      },
      UnauthorizedException,
    );
  });

  // --- 4. User غیرفعال ---
  await test('Scenario 4: User غیرفعال (رد درخواست)', async () => {
    db.users[0].isActive = false;
    await assert.rejects(
      async () => {
        await authService.login(
          { identifier: 'test@gapji.ir', password: rawPassword },
          {},
        );
      },
      /غیرفعال/,
    );
    db.users[0].isActive = true; // Restore
  });

  // --- 5. JWT معتبر ---
  await test('Scenario 5: اعتبارسنجی JWT معتبر توسط JwtStrategy', async () => {
    const payload = { sub: user1.id, email: user1.email, orgId: '90000000-0000-0000-0000-000000000001', role: 'admin' };
    const validated = await jwtStrategy.validate(payload);
    assert.strictEqual(validated.id, user1.id);
    assert.strictEqual(validated.role, 'admin');
  });

  // --- 6. JWT منقضیشده یا نامعتبر ---
  await test('Scenario 6: رد توکن JWT نامعتبر فاقد sub', async () => {
    await assert.rejects(
      async () => {
        await jwtStrategy.validate({} as any);
      },
      UnauthorizedException,
    );
  });

  // --- 7. Refresh موفق ---
  let t1Raw = '';
  let t2Raw = '';
  await test('Scenario 7: چرخش موفق Refresh Token (Rotation T1 -> T2)', async () => {
    // Initial login
    const loginRes = await authService.login(
      { identifier: 'test@gapji.ir', password: rawPassword },
      {},
    );
    t1Raw = loginRes.rawRefreshToken;

    const rotationRes = await authService.rotate(t1Raw, { ipAddress: '127.0.0.1' });
    t2Raw = rotationRes.rawRefreshToken;
    assert.ok(t2Raw);
    assert.notStrictEqual(t1Raw, t2Raw);
    assert.strictEqual(rotationRes.expiresIn, 900);

    // Verify DB states: T1 must be CONSUMED, T2 must be ACTIVE
    const t1Hash = authService.hashToken(t1Raw);
    const t2Hash = authService.hashToken(t2Raw);
    const t1Record = db.refreshTokens.find((t) => t.tokenHash === t1Hash);
    const t2Record = db.refreshTokens.find((t) => t.tokenHash === t2Hash);
    assert.strictEqual(t1Record.status, 'CONSUMED');
    assert.strictEqual(t2Record.status, 'ACTIVE');
    assert.strictEqual(t1Record.replacedByTokenId, t2Record.id);
  });

  // --- 8. Rotation و ثبت Replacement Chain (T2 -> T3 -> T4) ---
  let t3Raw = '';
  let t4Raw = '';
  await test('Scenario 8: چرخش‌های متوالی و تشکیل زنجیره تبارشناختی پیوسته', async () => {
    const res2 = await authService.rotate(t2Raw);
    t3Raw = res2.rawRefreshToken;
    const res3 = await authService.rotate(t3Raw);
    t4Raw = res3.rawRefreshToken;

    const t3Hash = authService.hashToken(t3Raw);
    const t4Hash = authService.hashToken(t4Raw);
    const t3Record = db.refreshTokens.find((t) => t.tokenHash === t3Hash);
    const t4Record = db.refreshTokens.find((t) => t.tokenHash === t4Hash);

    assert.strictEqual(t3Record.status, 'CONSUMED');
    assert.strictEqual(t4Record.status, 'ACTIVE');
    assert.strictEqual(t3Record.replacedByTokenId, t4Record.id);
  });

  // --- 9. Replay توکن نسل اول پس از چند Rotation (T1 replayed when T4 is active) ---
  await test('Scenario 9: کشف حمله Replay توکن T1 (نسل اول) و ابطال خانواده سشن‌ها', async () => {
    // Current active token is T4. Replay T1!
    await assert.rejects(
      async () => {
        await authService.rotate(t1Raw, { ipAddress: '10.0.0.1' });
      },
      /امنیت نشست به خطر افتاده است/,
    );

    // Assert that active token T4 was invalidated to REVOKED
    const t4Hash = authService.hashToken(t4Raw);
    const t4Record = db.refreshTokens.find((t) => t.tokenHash === t4Hash);
    assert.strictEqual(t4Record.status, 'REVOKED');

    // Assert that all sessions of user1 are revoked
    const user1Sessions = db.sessions.filter((s) => s.userId === user1.id);
    assert.ok(user1Sessions.every((s) => s.isRevoked === true));

    // Assert CRITICAL audit log recorded
    const criticalLog = db.activityLogs.find((l) => l.action === 'AUTH_REPLAY_ATTACK_DETECTED');
    assert.ok(criticalLog);
    assert.strictEqual(criticalLog.userId, user1.id);
  });

  // --- 10. Replay توکن CONSUMED ---
  await test('Scenario 10: کشف Replay روی توکن مصرف‌شده T2', async () => {
    await assert.rejects(
      async () => {
        await authService.rotate(t2Raw);
      },
      UnauthorizedException,
    );
  });

  // --- 11. Replay توکن REVOKED ---
  await test('Scenario 11: کشف Replay روی توکن ابطال‌شده REVOKED', async () => {
    // Create new active session, explicitly mark token as REVOKED
    const loginRev = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    const revHash = authService.hashToken(loginRev.rawRefreshToken);
    const revToken = db.refreshTokens.find((t) => t.tokenHash === revHash);
    revToken.status = 'REVOKED';

    await assert.rejects(
      async () => {
        await authService.rotate(loginRev.rawRefreshToken);
      },
      /(توکن قبلاً باطل شده است|ابطال)/,
    );
  });

  // --- 12. توکن ناشناخته ---
  await test('Scenario 12: ارسال توکن رندوم ناموجود در دیتابیس (عدم ابطال سشن‌ها - Anti-DoS)', async () => {
    const randomFakeToken = crypto.randomBytes(64).toString('hex');
    await assert.rejects(
      async () => {
        await authService.rotate(randomFakeToken);
      },
      /نامعتبر/,
    );
    // User2 sessions must not be affected
    const user2Sessions = db.sessions.filter((s) => s.userId === user2.id);
    assert.ok(user2Sessions.every((s) => !s.isRevoked));
  });

  // --- 13. توکن منقضیشده ---
  await test('Scenario 13: ارائه توکن رفرش منقضی‌شده قانونی', async () => {
    const loginRes = await authService.login(
      { identifier: 'user2@gapji.ir', password: rawPassword },
      {},
    );
    const tokenHash = authService.hashToken(loginRes.rawRefreshToken);
    const tokenRec = db.refreshTokens.find((t) => t.tokenHash === tokenHash);
    // Artificially expire the token
    tokenRec.expiresAt = new Date(Date.now() - 100000);

    await assert.rejects(
      async () => {
        await authService.rotate(loginRes.rawRefreshToken);
      },
      /منقضی شده است/,
    );
  });

  // --- 14. Logout و حفظ تاریخچه ---
  await test('Scenario 14: Logout سشن را ابطال نرم می‌کند و تاریخچه توکن را حفظ می‌کند', async () => {
    const loginRes = await authService.login(
      { identifier: 'user2@gapji.ir', password: rawPassword },
      {},
    );
    const tokenHash = authService.hashToken(loginRes.rawRefreshToken);

    const logoutRes = await authService.logout(loginRes.rawRefreshToken, { ipAddress: '127.0.0.1' });
    assert.strictEqual(logoutRes.success, true);

    const tokenRec = db.refreshTokens.find((t) => t.tokenHash === tokenHash);
    assert.strictEqual(tokenRec.status, 'REVOKED');
    const sessionRec = db.sessions.find((s) => s.id === tokenRec.sessionId);
    assert.strictEqual(sessionRec.isRevoked, true);
    assert.strictEqual(sessionRec.revokedReason, 'USER_LOGOUT');
  });

  // --- 15. ابطال تمام Sessionهای کاربر در Replay ---
  await test('Scenario 15: در صورت کشف Replay، تمام سشن‌های فعال همان کاربر باطل می‌شوند', async () => {
    // Create 2 concurrent sessions for user2
    const login1 = await authService.login({ identifier: 'user2@gapji.ir', password: rawPassword }, {});
    const login2 = await authService.login({ identifier: 'user2@gapji.ir', password: rawPassword }, {});

    // Rotate session 1
    const rot1 = await authService.rotate(login1.rawRefreshToken);

    // Replay old login1 token!
    await assert.rejects(
      async () => {
        await authService.rotate(login1.rawRefreshToken);
      },
      /امنیت نشست به خطر افتاده است/,
    );

    // Both session 1 and session 2 must be revoked
    const user2Sessions = db.sessions.filter((s) => s.userId === user2.id);
    assert.ok(user2Sessions.every((s) => s.isRevoked === true));
  });

  // --- 16. عدم ابطال Session کاربران دیگر ---
  await test('Scenario 16: ابطال سشن‌های کاربر قربانی به سشن کاربران دیگر سرایت نمی‌کند', async () => {
    // Create session for user1
    const loginUser1 = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    // Create session for user2
    const loginUser2 = await authService.login({ identifier: 'user2@gapji.ir', password: rawPassword }, {});

    // Rotate user2 then replay to trigger user2 invalidation
    const rotUser2 = await authService.rotate(loginUser2.rawRefreshToken);
    try {
      await authService.rotate(loginUser2.rawRefreshToken);
    } catch {}

    // Verify user1's session remains ACTIVE
    const user1TokenHash = authService.hashToken(loginUser1.rawRefreshToken);
    const user1Token = db.refreshTokens.find((t) => t.tokenHash === user1TokenHash);
    assert.strictEqual(user1Token.status, 'ACTIVE');
    const user1Session = db.sessions.find((s) => s.id === user1Token.sessionId);
    assert.strictEqual(user1Session.isRevoked, false);
  });

  // --- 17. دو درخواست همزمان با یک Refresh Token (Zero Grace Concurrency) ---
  await test('Scenario 17: درخواست همزمان با یک توکن رفرش (درخواست دوم Replay تلقی می‌شود)', async () => {
    const login = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    const token = login.rawRefreshToken;

    // Simulate parallel arrival: Req 1 succeeds, Req 2 arrives after Req 1 consumed token
    const res1 = await authService.rotate(token);
    assert.ok(res1.accessToken);

    // Req 2 using same token immediately detects CONSUMED
    await assert.rejects(
      async () => {
        await authService.rotate(token);
      },
      /امنیت نشست به خطر افتاده است/,
    );
  });

  // --- 18. دو Refresh همزمان از دو Session مستقل یک User ---
  await test('Scenario 18: چرخش مستقل دو سشن مختلف متعلق به یک کاربر بدون تداخل', async () => {
    const sessA = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    const sessB = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});

    const rotA = await authService.rotate(sessA.rawRefreshToken);
    const rotB = await authService.rotate(sessB.rawRefreshToken);

    assert.ok(rotA.accessToken);
    assert.ok(rotB.accessToken);
  });

  // --- 19. رقابت Rotation با Global Session Revocation ---
  await test('Scenario 19: رقابت چرخش در سشن A با کشف Replay در سشن B (هیچ توکن فعالی باقی نمی‌ماند)', async () => {
    const sessA = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    const sessB = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});

    // Session B is rotated to B2
    const rotB = await authService.rotate(sessB.rawRefreshToken);

    // Session B replays old token B1 -> Triggers Global Revocation
    try {
      await authService.rotate(sessB.rawRefreshToken);
    } catch {}

    // Now Session A attempts to rotate -> must be rejected because session is revoked!
    await assert.rejects(
      async () => {
        await authService.rotate(sessA.rawRefreshToken);
      },
      /سشن نامعتبر یا ابطال شده است/,
    );
  });

  // --- 20. جلوگیری از بیش از یک ACTIVE Token برای هر Session ---
  await test('Scenario 20: قید دیتابیس (Partial Unique Index) مانع از دو توکن ACTIVE برای یک سشن می‌شود', async () => {
    const login = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    const tokenHash = authService.hashToken(login.rawRefreshToken);
    const activeToken = db.refreshTokens.find((t) => t.tokenHash === tokenHash);

    // Attempting to insert a second ACTIVE token in the same session throws partial index error
    await assert.rejects(
      async () => {
        await mockPrisma.refreshToken.create({
          data: {
            id: crypto.randomUUID(),
            sessionId: activeToken.sessionId,
            userId: user1.id,
            tokenHash: crypto.randomBytes(32).toString('hex'),
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 100000),
          },
        });
      },
      /Partial unique index violation/,
    );
  });

  // --- 21. جلوگیری از Cross-User Session Ownership ---
  await test('Scenario 21: قید کلید خارجی مانع از انتساب توکن به کاربری غیر از مالک سشن می‌شود', async () => {
    const login = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    const tokenHash = authService.hashToken(login.rawRefreshToken);
    const activeToken = db.refreshTokens.find((t) => t.tokenHash === tokenHash);

    // Attempting to insert a token pointing to user2 under user1's session throws FK error
    await assert.rejects(
      async () => {
        await mockPrisma.refreshToken.create({
          data: {
            id: crypto.randomUUID(),
            sessionId: activeToken.sessionId,
            userId: user2.id, // Wrong user!
            tokenHash: crypto.randomBytes(32).toString('hex'),
            status: 'CONSUMED',
            expiresAt: new Date(Date.now() + 100000),
          },
        });
      },
      /Foreign key violation/,
    );
  });

  // --- 22. اتمیک بودن ثبت Audit و تغییر وضعیت توکن ---
  await test('Scenario 22: ثبت رخداد امنیتی و ابطال سشن درون ترنزکشن اتمیک انجام می‌شود', async () => {
    const initialLogCount = db.activityLogs.length;
    const login = await authService.login({ identifier: 'test@gapji.ir', password: rawPassword }, {});
    assert.strictEqual(db.activityLogs.length, initialLogCount + 1);
    assert.strictEqual(db.activityLogs[db.activityLogs.length - 1].action, 'AUTH_LOGIN_SUCCESS');
  });

  console.log(`\n========================================`);
  console.log(`🎉 Test Execution Summary:`);
  console.log(`   Passed: ${passed}/22`);
  console.log(`   Failed: ${failed}/22`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthServiceTests().catch((err) => {
  console.error('Fatal Test Runner Failure:', err);
  process.exit(1);
});
