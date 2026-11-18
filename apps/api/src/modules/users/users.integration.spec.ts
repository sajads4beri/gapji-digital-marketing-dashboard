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
import { PrismaClient, Role, MembershipStatus } from '@prisma/client';
import { UsersService, CurrentUserPayload } from './users.service';
import { PasswordHasherService } from '../auth/services/password-hasher.service';
import { PrismaService } from '../../database/prisma.service';

const prisma = new PrismaClient();
const passwordHasher = new PasswordHasherService();
const prismaService = new PrismaService();
const usersService = new UsersService(prismaService, passwordHasher);

const PRIMARY_ORG_ID = '00000000-0000-0000-0000-000000000001';
const SECONDARY_ORG_ID = '00000000-0000-0000-0000-000000000002';

const ADMIN_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000001',
  email: 'admin@gapji.dev',
  fullName: 'مدیر ارشد گپ‌جی',
  organizationId: PRIMARY_ORG_ID,
  role: 'admin',
};

const SALES_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000004',
  email: 'sales@gapji.dev',
  fullName: 'نیما باقری (کارشناس فروش)',
  organizationId: PRIMARY_ORG_ID,
  role: 'sales_agent',
};

async function runTests() {
  console.log('👥 ========================================================');
  console.log('👥 Real PostgreSQL User Management & Membership Integration');
  console.log('👥 Target Database: gapji_dev (PostgreSQL Instance)');
  console.log('👥 ========================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ ${name}`);
      console.error('     Error:', err?.message || err);
      failed++;
    }
  }

  // --- گروه ۱: واکشی اعضا و فیلترها ---
  console.log('--- 1. Organization Member Listing & Filtering ---');

  await test('1.1: Retrieve all organization members (Tenant Isolated)', async () => {
    const members = await usersService.findAll(undefined, ADMIN_USER);
    assert.ok(Array.isArray(members), 'Members should be an array');
    assert.ok(members.length >= 6, 'Should return at least 6 seed members');

    const adminMember = members.find((m) => m.role === 'admin');
    assert.ok(adminMember, 'Admin member should exist in list');
    assert.strictEqual(adminMember.email, 'admin@gapji.dev');
    assert.strictEqual(adminMember.status, 'active');
  });

  await test('1.2: Filter members by Role (sales_agent)', async () => {
    const salesMembers = await usersService.findAll({ role: 'sales_agent' }, ADMIN_USER);
    assert.ok(salesMembers.length >= 1, 'Should find at least 1 sales agent');
    for (const m of salesMembers) {
      assert.strictEqual(m.role, 'sales_agent');
    }
  });

  await test('1.3: Filter members by Status (active vs disabled)', async () => {
    const activeMembers = await usersService.findAll({ status: 'active' }, ADMIN_USER);
    assert.ok(activeMembers.length >= 5, 'Should find active members');
    for (const m of activeMembers) {
      assert.strictEqual(m.status, 'active');
    }
  });

  await test('1.4: Search members by text (name or email query)', async () => {
    const results = await usersService.findAll({ search: 'سارا' }, ADMIN_USER);
    assert.ok(results.length >= 1, 'Should find Sara Rad');
    assert.ok(results[0].fullName.includes('سارا'));
  });

  await test('1.5: Access Matrix returns complete 6-role permission mapping', async () => {
    const matrix = usersService.getAccessMatrix();
    assert.strictEqual(matrix.roles.length, 6);
    assert.strictEqual(matrix.matrix.admin.users_manage, true);
    assert.strictEqual(matrix.matrix.sales_agent.users_manage, false);
    assert.strictEqual(matrix.matrix.client.dashboard_view, true);
    assert.strictEqual(matrix.matrix.client.campaigns_manage, false);
  });

  // --- گروه ۲: کنترل دسترسی و RBAC ---
  console.log('\n--- 2. RBAC & Tenant Isolation Enforcement ---');

  await test('2.1: Non-admin user (sales_agent) rejected from inviting users (HTTP 403)', async () => {
    let rejected = false;
    try {
      await usersService.invite(
        { email: 'unauthorized@example.com', role: Role.sales_agent },
        SALES_USER,
      );
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 403);
    }
    assert.ok(rejected, 'Sales agent should be denied invite operation');
  });

  await test('2.2: Non-admin user rejected from changing member roles (HTTP 403)', async () => {
    let rejected = false;
    try {
      await usersService.changeRole(
        SALES_USER.id,
        { role: Role.marketing_manager },
        SALES_USER,
      );
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 403);
    }
    assert.ok(rejected, 'Sales agent should be denied role-change operation');
  });

  await test('2.3: Non-admin user rejected from deactivating members (HTTP 403)', async () => {
    let rejected = false;
    try {
      await usersService.deactivate(ADMIN_USER.id, SALES_USER);
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 403);
    }
    assert.ok(rejected, 'Sales agent should be denied deactivate operation');
  });

  await test('2.4: Cross-tenant member lookup fails with NotFound (Tenant Boundary)', async () => {
    let notFound = false;
    try {
      // Trying to look up primary org admin from secondary org context
      await usersService.findOne(ADMIN_USER.id, {
        ...ADMIN_USER,
        organizationId: SECONDARY_ORG_ID,
      });
    } catch (e: any) {
      notFound = true;
      assert.strictEqual(e.status, 404);
    }
    assert.ok(notFound, 'Cross-tenant user query must return 404');
  });

  // --- گروه ۳: چرخه حیات دعوت‌نامه و بازاستفاده از حساب ---
  console.log('\n--- 3. Invitation Lifecycle & Account Reuse (DEC-AUTH-04, 05) ---');

  const testNewEmail = `test_invite_${Date.now()}@example.com`;
  let inviteToken: string | undefined;
  let invitedUserId: string | undefined;

  await test('3.1: Invite brand new user by email (One-time token & hash)', async () => {
    const res = await usersService.invite(
      {
        email: testNewEmail,
        role: Role.campaign_manager,
        fullName: 'کاربر تستی دعوت‌شده',
      },
      ADMIN_USER,
    );

    assert.ok(res.user, 'Returned user object');
    assert.strictEqual(res.user.status, 'invited');
    assert.strictEqual(res.user.role, 'campaign_manager');
    assert.ok(res.invitationToken, 'Raw token must be returned in response');
    inviteToken = res.invitationToken;
    invitedUserId = res.user.id;

    // Verify token hash in PostgreSQL
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: PRIMARY_ORG_ID,
        userId: invitedUserId,
      },
    });
    assert.ok(membership, 'Membership must exist in DB');
    assert.ok(membership.invitationTokenHash, 'invitationTokenHash must be set in DB');
    assert.notStrictEqual(membership.invitationTokenHash, inviteToken, 'Raw token must NEVER be stored in DB');

    // Verify hash matches SHA-256
    const expectedHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    assert.strictEqual(membership.invitationTokenHash, expectedHash);
  });

  await test('3.2: Rejection on duplicate invitation attempt (already pending)', async () => {
    let rejected = false;
    try {
      await usersService.invite(
        { email: testNewEmail, role: Role.campaign_manager },
        ADMIN_USER,
      );
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 400);
      assert.ok(e.message.includes('قبلاً ارسال شده'));
    }
    assert.ok(rejected, 'Duplicate invite should be rejected');
  });

  await test('3.3: Rejection on inviting already active member', async () => {
    let rejected = false;
    try {
      await usersService.invite(
        { email: 'sales@gapji.dev', role: Role.sales_agent },
        ADMIN_USER,
      );
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 400);
      assert.ok(e.message.includes('عضو فعال'));
    }
    assert.ok(rejected, 'Inviting active member must fail');
  });

  await test('3.4: Resend invitation updates token and dispatch timestamp', async () => {
    assert.ok(invitedUserId);
    const res = await usersService.resendInvite(invitedUserId, ADMIN_USER);
    assert.strictEqual(res.success, true);
    assert.ok(res.invitationToken);
    assert.notStrictEqual(res.invitationToken, inviteToken, 'New token must be issued');
    inviteToken = res.invitationToken; // update for acceptance test
  });

  await test('3.5: Accept invitation activates membership and sets user password', async () => {
    assert.ok(inviteToken);
    const acceptRes = await usersService.acceptInvite({
      token: inviteToken,
      password: 'NewStrongPassword123!',
      fullName: 'کاربر فعال‌شده نهایی',
    });

    assert.strictEqual(acceptRes.success, true);
    assert.strictEqual(acceptRes.user.status, 'active');

    // Verify in database
    const dbMember = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: PRIMARY_ORG_ID,
        userId: invitedUserId,
      },
    });
    assert.strictEqual(dbMember?.status, MembershipStatus.active);
    assert.strictEqual(dbMember?.invitationTokenHash, null, 'Token hash must be cleared upon acceptance');
    assert.ok(dbMember?.joinedAt, 'joinedAt timestamp must be recorded');

    // Verify user can authenticate password with Argon2id
    const dbUser = await prisma.user.findUnique({ where: { id: invitedUserId } });
    assert.ok(dbUser);
    const passwordValid = await passwordHasher.verify(dbUser.passwordHash, 'NewStrongPassword123!');
    assert.ok(passwordValid, 'User password hash in DB must match Argon2id');
  });

  await test('3.6: Replay of already accepted invitation token is rejected (HTTP 400)', async () => {
    let rejected = false;
    try {
      await usersService.acceptInvite({
        token: inviteToken!,
        password: 'AnotherPassword123!',
      });
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 400);
    }
    assert.ok(rejected, 'Accepted token replay must be rejected');
  });

  await test('3.7: Reuse existing user account when invited to another organization (DEC-AUTH-05)', async () => {
    // User testNewEmail now exists in the database from test 3.1
    // Admin invites them to SECONDARY_ORG_ID
    const secondaryAdmin: CurrentUserPayload = {
      id: ADMIN_USER.id,
      email: ADMIN_USER.email,
      organizationId: SECONDARY_ORG_ID,
      role: 'admin',
    };

    const res = await usersService.invite(
      {
        email: testNewEmail,
        role: Role.content_creator,
      },
      secondaryAdmin,
    );

    assert.strictEqual(res.user.id, invitedUserId, 'Must reuse the exact same User.id');
    assert.strictEqual(res.user.role, 'content_creator');

    // Verify existing user password was NOT altered
    const dbUser = await prisma.user.findUnique({ where: { id: invitedUserId } });
    const passwordValid = await passwordHasher.verify(dbUser!.passwordHash, 'NewStrongPassword123!');
    assert.ok(passwordValid, 'Existing password must remain completely intact');
  });

  // --- گروه ۴: تغییر نقش و گارد آخرین ادمین ---
  console.log('\n--- 4. Role Management & Minimum-One-Admin Invariant (DEC-AUTH-07) ---');

  await test('4.1: Admin successfully changes role of non-admin member', async () => {
    assert.ok(invitedUserId);
    const updated = await usersService.changeRole(
      invitedUserId,
      { role: Role.marketing_manager },
      ADMIN_USER,
    );
    assert.strictEqual(updated.role, 'marketing_manager');
  });

  await test('4.2: Protection against demoting sole active Admin (HTTP 400)', async () => {
    let rejected = false;
    try {
      await usersService.changeRole(
        ADMIN_USER.id,
        { role: Role.marketing_manager },
        ADMIN_USER,
      );
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 400);
      assert.ok(e.message.includes('آخرین ادمین'));
    }
    assert.ok(rejected, 'Demoting sole active Admin must be rejected');
  });

  await test('4.3: Protection against deactivating sole active Admin (HTTP 400)', async () => {
    let rejected = false;
    try {
      await usersService.deactivate(ADMIN_USER.id, ADMIN_USER);
    } catch (e: any) {
      rejected = true;
      assert.strictEqual(e.status, 400);
      assert.ok(e.message.includes('آخرین ادمین'));
    }
    assert.ok(rejected, 'Deactivating sole active Admin must be rejected');
  });

  await test('4.4: Concurrent race attempts to demote sole active Admin safely rejected', async () => {
    const attempts = [1, 2, 3, 4, 5];
    const results = await Promise.allSettled(
      attempts.map(() =>
        usersService.changeRole(
          ADMIN_USER.id,
          { role: Role.campaign_manager },
          ADMIN_USER,
        ),
      ),
    );

    const rejections = results.filter((r) => r.status === 'rejected');
    assert.strictEqual(rejections.length, 5, 'All 5 concurrent demotion attempts must be rejected');

    // Verify in DB that admin is STILL admin
    const adminInDb = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: PRIMARY_ORG_ID,
        userId: ADMIN_USER.id,
      },
    });
    assert.strictEqual(adminInDb?.role, Role.admin);
    assert.strictEqual(adminInDb?.status, MembershipStatus.active);
  });

  // --- گروه ۵: غیرفعال‌سازی، ابطال نشست و فعال‌سازی مجدد ---
  console.log('\n--- 5. Deactivation, Session Invalidation & Reactivation ---');

  await test('5.1: Deactivate member and revoke their active sessions in PostgreSQL', async () => {
    assert.ok(invitedUserId);

    // Create a mock session for this user
    const sessionId = crypto.randomUUID();
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: invitedUserId,
        organizationId: PRIMARY_ORG_ID,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    const deactivated = await usersService.deactivate(invitedUserId, ADMIN_USER);
    assert.strictEqual(deactivated.status, 'disabled');

    // Verify session revoked in PostgreSQL
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    assert.strictEqual(session?.isRevoked, true);
    assert.strictEqual(session?.revokedReason, 'MEMBERSHIP_DEACTIVATED');
  });

  await test('5.2: Reactivate member restores active status', async () => {
    assert.ok(invitedUserId);
    const reactivated = await usersService.activate(invitedUserId, ADMIN_USER);
    assert.strictEqual(reactivated.status, 'active');

    const dbMember = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: PRIMARY_ORG_ID,
        userId: invitedUserId,
      },
    });
    assert.strictEqual(dbMember?.status, MembershipStatus.active);
  });

  // --- گروه ۶: انتقال مسئولیت ادمین ---
  console.log('\n--- 6. Atomic Admin Authority Transfer Protocol (DEC-AUTH-07) ---');

  await test('6.1: Atomic Admin Authority Transfer between active members', async () => {
    assert.ok(invitedUserId);

    // Transfer admin to invitedUserId
    const transferRes = await usersService.transferAdmin(
      { replacementUserId: invitedUserId },
      ADMIN_USER,
    );
    assert.strictEqual(transferRes.success, true);

    // Verify in DB: replacement user is now Admin, old Admin is demoted
    const newAdmin = await prisma.organizationMembership.findFirst({
      where: { organizationId: PRIMARY_ORG_ID, userId: invitedUserId },
    });
    assert.strictEqual(newAdmin?.role, Role.admin);

    const oldAdmin = await prisma.organizationMembership.findFirst({
      where: { organizationId: PRIMARY_ORG_ID, userId: ADMIN_USER.id },
    });
    assert.strictEqual(oldAdmin?.role, Role.marketing_manager);

    // Restore baseline: Transfer back to original ADMIN_USER
    const tempAdminPayload: CurrentUserPayload = {
      id: invitedUserId,
      email: testNewEmail,
      organizationId: PRIMARY_ORG_ID,
      role: 'admin',
    };
    await usersService.transferAdmin(
      { replacementUserId: ADMIN_USER.id },
      tempAdminPayload,
    );

    // Verify original admin restored
    const restoredAdmin = await prisma.organizationMembership.findFirst({
      where: { organizationId: PRIMARY_ORG_ID, userId: ADMIN_USER.id },
    });
    assert.strictEqual(restoredAdmin?.role, Role.admin);
  });

  // Cleanup test user
  await prisma.organizationMembership.deleteMany({
    where: { userId: invitedUserId },
  });
  await prisma.session.deleteMany({
    where: { userId: invitedUserId },
  });
  await prisma.user.deleteMany({
    where: { id: invitedUserId },
  });

  console.log('\n========================================');
  console.log('👥 Real PostgreSQL User Management Test Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('========================================');

  await prisma.$disconnect();
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  prisma.$disconnect();
  process.exit(1);
});
