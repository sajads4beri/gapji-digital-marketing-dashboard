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
import { PrismaClient, TaskStatus, TaskPriority, TaskRelatedType } from '@prisma/client';
import { TasksService, CurrentUserPayload } from './tasks.service';
import { PrismaService } from '../../database/prisma.service';

const prisma = new PrismaClient();
const prismaService = new PrismaService();
const tasksService = new TasksService(prismaService);

const PRIMARY_ORG_ID = '00000000-0000-0000-0000-000000000001';
const SECONDARY_ORG_ID = '00000000-0000-0000-0000-000000000002';

const ADMIN_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000001',
  email: 'admin@gapji.dev',
  fullName: 'مدیر ارشد گپ‌جی',
  organizationId: PRIMARY_ORG_ID,
  role: 'admin',
};

const CAMPAIGN_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000003',
  email: 'campaign@gapji.dev',
  fullName: 'امیر نوری (کمپین‌چی)',
  organizationId: PRIMARY_ORG_ID,
  role: 'campaign_manager',
};

const SALES_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000004',
  email: 'sales@gapji.dev',
  fullName: 'نیما باقری (کارشناس فروش)',
  organizationId: PRIMARY_ORG_ID,
  role: 'sales_agent',
};

const CLIENT_USER: CurrentUserPayload = {
  id: '10000000-0000-0000-0000-000000000006',
  email: 'client@gapji.dev',
  fullName: 'رضا بهرامی (کارفرما)',
  organizationId: PRIMARY_ORG_ID,
  role: 'client',
};

async function runTests() {
  console.log('📋 ========================================================');
  console.log('📋 Real PostgreSQL Tasks Management Integration Test Suite');
  console.log('📋 Target Database: gapji_dev (PostgreSQL Instance)');
  console.log('📋 ========================================================');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ ${name}: ${err?.message || err}`);
      failed++;
    }
  }

  // ایجاد متغیرهای نگه‌دارنده برای تست‌ها
  let createdTaskId = '';
  let subtaskId = '';
  let commentId = '';
  const nowSuffix = Date.now();

  try {
    console.log('\n--- 1. Task Creation (Full & Quick) ---');

    await test('1.1: Create full task with priority, dueDate, assignee, and initial subtasks', async () => {
      const task = await tasksService.create(
        {
          title: `تسک آزمایشی فول فرم ${nowSuffix}`,
          description: 'توضیحات تست یکپارچگی مدیریت تسک‌ها',
          priority: TaskPriority.high,
          status: TaskStatus.todo,
          dueDate: '2026-11-25',
          assigneeId: CAMPAIGN_USER.id,
          relatedType: TaskRelatedType.campaign,
          relatedId: '30000000-0000-0000-0000-000000000001',
          subtasks: [
            { title: 'بررسی تصاویر بنر', completed: false },
            { title: 'تنظیم متن تبلیغاتی', completed: true },
          ],
        },
        ADMIN_USER,
      );

      createdTaskId = task.id;
      subtaskId = task.subtasks[0]?.id || '';

      assert.ok(task.id, 'Task ID must exist');
      assert.strictEqual(task.title, `تسک آزمایشی فول فرم ${nowSuffix}`);
      assert.strictEqual(task.priority, 'high');
      assert.strictEqual(task.status, 'todo');
      assert.strictEqual(task.dueDate, '2026-11-25');
      assert.strictEqual(task.assignee?.id, CAMPAIGN_USER.id);
      assert.strictEqual(task.subtasks.length, 2);
      assert.ok(task.subtasks.some((s: any) => s.title === 'بررسی تصاویر بنر'));
      assert.ok(task.subtasks.some((s: any) => s.title === 'تنظیم متن تبلیغاتی'));
      assert.ok(task.relatedTo, 'Related entity must be present');
      assert.strictEqual(task.relatedTo?.type, 'campaign');
    });

    await test('1.2: Create quick task with default priority and dueDate', async () => {
      const quickTask = await tasksService.create(
        {
          title: `تسک سریع آزمایشی ${nowSuffix}`,
        },
        CAMPAIGN_USER,
      );

      assert.ok(quickTask.id);
      assert.strictEqual(quickTask.priority, 'medium');
      assert.strictEqual(quickTask.status, 'todo');
      assert.ok(quickTask.dueDate, 'Default dueDate should be populated');
      assert.strictEqual(quickTask.subtasks.length, 0);

      // پاکسازی تسک سریع
      await prisma.task.delete({ where: { id: quickTask.id } });
    });

    console.log('\n--- 2. Task Retrieval & Multi-dimensional Filtering ---');

    await test('2.1: Retrieve all organization tasks (Team Scope)', async () => {
      const tasks = await tasksService.findAll({ scope: 'team' }, ADMIN_USER);
      assert.ok(Array.isArray(tasks));
      const found = tasks.find((t) => t.id === createdTaskId);
      assert.ok(found, 'Created task must be in team tasks list');
    });

    await test('2.2: Retrieve My Tasks (scope=my) returns only assigned tasks', async () => {
      // برای کاربر کمپین‌چی که تسک به او تخصیص داده شده
      const myTasks = await tasksService.findAll({ scope: 'my' }, CAMPAIGN_USER);
      const foundInCampaign = myTasks.find((t) => t.id === createdTaskId);
      assert.ok(foundInCampaign, 'Task should appear in CAMPAIGN_USER my tasks');

      // برای کارشناس فروش که تسک به او تخصیص داده نشده
      const salesMyTasks = await tasksService.findAll({ scope: 'my' }, SALES_USER);
      const foundInSales = salesMyTasks.find((t) => t.id === createdTaskId);
      assert.strictEqual(foundInSales, undefined, 'Task should NOT appear in SALES_USER my tasks');
    });

    await test('2.3: Filter tasks by Status (todo)', async () => {
      const todoTasks = await tasksService.findAll({ status: 'todo' }, ADMIN_USER);
      assert.ok(todoTasks.every((t) => t.status === 'todo'));
      assert.ok(todoTasks.some((t) => t.id === createdTaskId));
    });

    await test('2.4: Filter tasks by Overdue status', async () => {
      // ایجاد تسک گذشته
      const pastTask = await tasksService.create(
        {
          title: `تسک معوقه ${nowSuffix}`,
          dueDate: '2026-10-01',
          status: TaskStatus.todo,
        },
        ADMIN_USER,
      );

      const overdueTasks = await tasksService.findAll({ status: 'overdue' }, ADMIN_USER);
      assert.ok(overdueTasks.some((t) => t.id === pastTask.id));

      await prisma.task.delete({ where: { id: pastTask.id } });
    });

    await test('2.5: Filter tasks by Priority (high)', async () => {
      const highTasks = await tasksService.findAll({ priority: 'high' }, ADMIN_USER);
      assert.ok(highTasks.every((t) => t.priority === 'high'));
      assert.ok(highTasks.some((t) => t.id === createdTaskId));
    });

    await test('2.6: Filter tasks by Assignee ID', async () => {
      const assignedTasks = await tasksService.findAll({ assigneeId: CAMPAIGN_USER.id }, ADMIN_USER);
      assert.ok(assignedTasks.every((t) => t.assignee?.id === CAMPAIGN_USER.id));
      assert.ok(assignedTasks.some((t) => t.id === createdTaskId));
    });

    await test('2.7: Search tasks by query term in title or description', async () => {
      const searchResults = await tasksService.findAll({ search: `فول فرم ${nowSuffix}` }, ADMIN_USER);
      assert.strictEqual(searchResults.length, 1);
      assert.strictEqual(searchResults[0].id, createdTaskId);
    });

    await test('2.8: Get task details by ID', async () => {
      const task = await tasksService.findOne(createdTaskId, ADMIN_USER);
      assert.strictEqual(task.id, createdTaskId);
      assert.strictEqual(task.title, `تسک آزمایشی فول فرم ${nowSuffix}`);
    });

    console.log('\n--- 3. Task Update & Lifecycle Transitions ---');

    await test('3.1: Update task title, description, and priority', async () => {
      const updated = await tasksService.update(
        createdTaskId,
        {
          title: `عنوان ویرایش‌شده ${nowSuffix}`,
          priority: TaskPriority.urgent,
          description: 'توضیحات ویرایش‌شده',
        },
        ADMIN_USER,
      );

      assert.strictEqual(updated.title, `عنوان ویرایش‌شده ${nowSuffix}`);
      assert.strictEqual(updated.priority, 'urgent');
      assert.strictEqual(updated.description, 'توضیحات ویرایش‌شده');
    });

    await test('3.2: Reassign task to another user (SALES_USER)', async () => {
      const updated = await tasksService.updateAssignee(createdTaskId, SALES_USER.id, ADMIN_USER);
      assert.strictEqual(updated.assignee?.id, SALES_USER.id);
    });

    await test('3.3: Unassign task (set assignee to null)', async () => {
      const updated = await tasksService.updateAssignee(createdTaskId, null, ADMIN_USER);
      assert.strictEqual(updated.assignee, undefined);
    });

    await test('3.4: Transition task status: todo -> in_progress -> done', async () => {
      let task = await tasksService.updateStatus(createdTaskId, TaskStatus.in_progress, ADMIN_USER);
      assert.strictEqual(task.status, 'in_progress');

      task = await tasksService.updateStatus(createdTaskId, TaskStatus.done, ADMIN_USER);
      assert.strictEqual(task.status, 'done');
      assert.ok(task.completedAt, 'completedAt must be set when done');
    });

    await test('3.5: Toggle complete: done -> todo -> done', async () => {
      let task = await tasksService.toggleComplete(createdTaskId, undefined, ADMIN_USER);
      assert.strictEqual(task.status, 'todo');

      task = await tasksService.toggleComplete(createdTaskId, undefined, ADMIN_USER);
      assert.strictEqual(task.status, 'done');
    });

    console.log('\n--- 4. Subtasks Checklist Management ---');

    await test('4.1: Add a new subtask to existing task', async () => {
      const newSubtask = await tasksService.addSubtask(
        createdTaskId,
        { title: 'زیرتسک اضافه شده بعدی' },
        ADMIN_USER,
      );

      assert.ok(newSubtask.id);
      assert.strictEqual(newSubtask.title, 'زیرتسک اضافه شده بعدی');
      assert.strictEqual(newSubtask.completed, false);
    });

    await test('4.2: Toggle subtask completion status', async () => {
      const toggled = await tasksService.toggleSubtask(createdTaskId, subtaskId, true, ADMIN_USER);
      assert.strictEqual(toggled.completed, true);

      const unToggled = await tasksService.toggleSubtask(createdTaskId, subtaskId, false, ADMIN_USER);
      assert.strictEqual(unToggled.completed, false);
    });

    await test('4.3: Update subtask title', async () => {
      const updated = await tasksService.updateSubtask(
        createdTaskId,
        subtaskId,
        { title: 'عنوان اصلاح‌شده زیرتسک' },
        ADMIN_USER,
      );
      assert.strictEqual(updated.title, 'عنوان اصلاح‌شده زیرتسک');
    });

    console.log('\n--- 5. Task Comments & Discussion ---');

    await test('5.1: Add comment to task and verify author info', async () => {
      const comment = await tasksService.addComment(
        createdTaskId,
        { content: 'دیدگاه تستی در فرآیند بررسی' },
        SALES_USER,
      );

      assert.ok(comment.id);
      assert.strictEqual(comment.content, 'دیدگاه تستی در فرآیند بررسی');
      assert.strictEqual(comment.author.id, SALES_USER.id);
      assert.strictEqual(comment.author.name, SALES_USER.fullName);
      commentId = comment.id;
    });

    await test('5.2: Verify comments returned when retrieving task', async () => {
      const task = await tasksService.findOne(createdTaskId, ADMIN_USER);
      assert.ok(task.comments.length >= 1);
      const foundComment = task.comments.find((c: any) => c.id === commentId);
      assert.ok(foundComment);
      assert.strictEqual(foundComment.content, 'دیدگاه تستی در فرآیند بررسی');
    });

    console.log('\n--- 6. Task Activity History & Assignees ---');

    await test('6.1: Verify user activity logs for task operations', async () => {
      const history = await tasksService.getHistory(createdTaskId, ADMIN_USER);
      assert.ok(Array.isArray(history));
      assert.ok(history.length > 0, 'History should contain activity logs');
      assert.ok(history.some((h) => h.title.includes('TASK_') || h.title.includes('SUBTASK_')));
    });

    await test('6.2: Get organization active assignees list', async () => {
      const assignees = await tasksService.getAssignees(ADMIN_USER);
      assert.ok(Array.isArray(assignees));
      assert.ok(assignees.length >= 5);
      assert.ok(assignees.some((a) => a.id === CAMPAIGN_USER.id));
      assert.ok(assignees.some((a) => a.id === SALES_USER.id));
    });

    console.log('\n--- 7. Authorization & Tenant Isolation ---');

    await test('7.1: Client role rejected from accessing tasks (DEC-AUTH-11, HTTP 403)', async () => {
      let rejected = false;
      try {
        await tasksService.findAll({}, CLIENT_USER);
      } catch (err: any) {
        if (err?.status === 403 || err?.message?.includes('کارفرما')) {
          rejected = true;
        }
      }
      assert.strictEqual(rejected, true, 'Client role must be rejected with 403 Forbidden');
    });

    await test('7.2: Cross-tenant lookup rejected (Tenant Boundary)', async () => {
      const SECONDARY_ADMIN: CurrentUserPayload = {
        id: '10000000-0000-0000-0000-000000000008',
        email: 'ambiguous@gapji.dev',
        organizationId: SECONDARY_ORG_ID,
        role: 'admin',
      };

      let rejected = false;
      try {
        await tasksService.findOne(createdTaskId, SECONDARY_ADMIN);
      } catch (err: any) {
        if (err?.status === 404 || err?.message?.includes('یافت نشد')) {
          rejected = true;
        }
      }
      assert.strictEqual(rejected, true, 'Cross-tenant task lookup must return NotFound');
    });

    await test('7.3: Non-admin, non-creator user rejected from deleting task (HTTP 403)', async () => {
      let rejected = false;
      try {
        // createdTaskId توسط ADMIN_USER ایجاد شده، SALES_USER نمی‌تواند آن را حذف کند
        await tasksService.remove(createdTaskId, SALES_USER);
      } catch (err: any) {
        if (err?.status === 403 || err?.message?.includes('مجاز به حذف')) {
          rejected = true;
        }
      }
      assert.strictEqual(rejected, true, 'Non-admin/non-creator user must be rejected from deleting task');
    });

    await test('7.4: Task deletion with cascading cleanup of subtasks and comments', async () => {
      const deleteResult = await tasksService.remove(createdTaskId, ADMIN_USER);
      assert.strictEqual(deleteResult.success, true);

      // بررسی عدم وجود تسک
      const taskInDb = await prisma.task.findUnique({ where: { id: createdTaskId } });
      assert.strictEqual(taskInDb, null, 'Task must be deleted');

      // بررسی پاکسازی آبشاری زیرتسک‌ها
      const subtasksInDb = await prisma.taskSubtask.findMany({ where: { taskId: createdTaskId } });
      assert.strictEqual(subtasksInDb.length, 0, 'Subtasks must be cascade deleted');

      // بررسی پاکسازی آبشاری کامنت‌ها
      const commentsInDb = await prisma.taskComment.findMany({ where: { taskId: createdTaskId } });
      assert.strictEqual(commentsInDb.length, 0, 'Comments must be cascade deleted');
    });

    console.log('\n--- 8. Validation & Invariant Guardrails ---');

    await test('8.1: Reject task creation with assignee from outside organization', async () => {
      let rejected = false;
      try {
        await tasksService.create(
          {
            title: 'تسک با مسئول نامعتبر',
            assigneeId: '00000000-0000-0000-0000-999999999999',
          },
          ADMIN_USER,
        );
      } catch (err: any) {
        if (err?.status === 400 || err?.message?.includes('فعال نیست')) {
          rejected = true;
        }
      }
      assert.strictEqual(rejected, true, 'Task creation with invalid assignee must be rejected with 400');
    });

    await test('8.2: Reject task update with invalid due date', async () => {
      const tempTask = await tasksService.create({ title: 'تسک موقت اعتبارسنجی' }, ADMIN_USER);
      let rejected = false;
      try {
        await tasksService.update(tempTask.id, { dueDate: 'invalid-date' }, ADMIN_USER);
      } catch (err: any) {
        if (err?.status === 400 || err?.message?.includes('نامعتبر')) {
          rejected = true;
        }
      }
      assert.strictEqual(rejected, true, 'Invalid date string must be rejected');

      await prisma.task.delete({ where: { id: tempTask.id } });
    });

  } finally {
    await prisma.$disconnect();
  }

  console.log('\n========================================');
  console.log('📋 Real PostgreSQL Tasks Management Test Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
