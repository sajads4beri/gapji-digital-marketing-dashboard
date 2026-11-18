import * as fs from 'fs';
import * as path from 'path';

// Automatically load .env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
    'F:/marketing-platform-backend/apps/api/.env',
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
      break;
    }
  }
}

import { PrismaClient } from '@prisma/client';
import http from 'http';

const API_BASE = 'http://localhost:3001/api';
const prisma = new PrismaClient();

function request(options: { url: string; method?: string; headers?: Record<string, string> }, body: any = null): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  data: any;
}> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(options.url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ statusCode: res.statusCode || 500, headers: res.headers, data });
        });
      },
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function loginUser(identifier: string): Promise<{ token: string; user: any }> {
  const res = await request(
    {
      url: `${API_BASE}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier, password: 'Password123!' },
  );
  if (res.statusCode !== 200 || !res.data.accessToken) {
    throw new Error(`Login failed for ${identifier}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.accessToken, user: res.data.user };
}

async function runCalendarIntegrationTests() {
  console.log('================================================================');
  console.log('📅 GAPJI B2.4.3 CALENDAR BACKEND INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details: string = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate users with different roles
    console.log('--- 1. Authenticating Roles ---');
    const adminAuth = await loginUser('admin@gapji.dev');
    const marketingAuth = await loginUser('marketing@gapji.dev');
    const campaignManagerAuth = await loginUser('campaign@gapji.dev');
    const salesAuth = await loginUser('sales@gapji.dev');
    const contentAuth = await loginUser('content@gapji.dev');
    const clientAuth = await loginUser('client@gapji.dev');

    assert(
      !!adminAuth.token && !!marketingAuth.token && !!campaignManagerAuth.token &&
      !!salesAuth.token && !!contentAuth.token && !!clientAuth.token,
      'Tokens retrieved for all 6 test roles (admin, marketing_manager, campaign_manager, sales_agent, content_creator, client)',
    );

    // 2. Unauthenticated Request Rejection
    console.log('\n--- 2. Unauthenticated Request Rejection ---');
    const unauthGet = await request({ url: `${API_BASE}/calendar/events` });
    assert(unauthGet.statusCode === 401, 'GET /api/calendar/events without token is rejected with 401');

    const unauthPost = await request(
      { url: `${API_BASE}/calendar/events`, method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { title: 'رویداد تست بدون احراز', eventType: 'meeting', startDate: '2026-11-20' },
    );
    assert(unauthPost.statusCode === 401, 'POST /api/calendar/events without token is rejected with 401');

    const unauthPatch = await request(
      { url: `${API_BASE}/calendar/events/00000000-0000-0000-0000-000000000001`, method: 'PATCH' },
    );
    assert(unauthPatch.statusCode === 401, 'PATCH /api/calendar/events/:id without token is rejected with 401');

    const unauthDelete = await request(
      { url: `${API_BASE}/calendar/events/00000000-0000-0000-0000-000000000001`, method: 'DELETE' },
    );
    assert(unauthDelete.statusCode === 401, 'DELETE /api/calendar/events/:id without token is rejected with 401');

    // 3. Validation & Invalid Input Handling
    console.log('\n--- 3. Validation & Invalid Input Handling ---');
    const noTitle = await request(
      {
        url: `${API_BASE}/calendar/events`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
      },
      { eventType: 'meeting', startDate: '2026-11-20' },
    );
    assert(noTitle.statusCode === 400, 'Missing title is rejected with 400 Bad Request');

    const shortTitle = await request(
      {
        url: `${API_BASE}/calendar/events`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
      },
      { title: 'ا', eventType: 'meeting', startDate: '2026-11-20' },
    );
    assert(shortTitle.statusCode === 400, 'Single character title is rejected with 400 Bad Request');

    const noStartDate = await request(
      {
        url: `${API_BASE}/calendar/events`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
      },
      { title: 'رویداد بدون تاریخ', eventType: 'meeting' },
    );
    assert(noStartDate.statusCode === 400, 'Missing startDate is rejected with 400 Bad Request');

    const endBeforeStart = await request(
      {
        url: `${API_BASE}/calendar/events`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
      },
      { title: 'رویداد با تاریخ معکوس', eventType: 'meeting', startDate: '2026-11-25', endDate: '2026-11-20' },
    );
    assert(endBeforeStart.statusCode === 400, 'endDate < startDate is rejected with 400 Bad Request');

    const invalidUuid = await request(
      {
        url: `${API_BASE}/calendar/events/not-a-valid-uuid`,
        method: 'GET',
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      },
    );
    assert(invalidUuid.statusCode === 400, 'Invalid UUID parameter is rejected with 400 Bad Request');

    const nonExistentUuid = await request(
      {
        url: `${API_BASE}/calendar/events/00000000-0000-0000-0000-999999999999`,
        method: 'GET',
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      },
    );
    assert(nonExistentUuid.statusCode === 404, 'Non-existent UUID returns 404 Not Found');

    // 4. Role-Based Access Enforcement (PRD p. 18-20 §20)
    console.log('\n--- 4. Role-Based Access Enforcement ---');
    const clientRead = await request({
      url: `${API_BASE}/calendar/events`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientAuth.token}` },
    });
    assert(clientRead.statusCode === 200, 'Client role can read calendar events via GET (200)');

    const clientPost = await request(
      {
        url: `${API_BASE}/calendar/events`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientAuth.token}` },
      },
      { title: 'رویداد کارفرما غیرمجاز', eventType: 'meeting', startDate: '2026-11-22' },
    );
    assert(clientPost.statusCode === 403, 'Client role is strictly forbidden from creating events (403)');

    // 5. Successful Calendar Event Creation & Persistence
    console.log('\n--- 5. Calendar Event Creation & DB Persistence ---');
    const newEventPayload = {
      title: 'جلسه هماهنگی کمپین یلدایی',
      description: 'بررسی تارگت‌های فروش و سناریوهای تبلیغاتی شب یلدا',
      eventType: 'campaign',
      startDate: '2026-11-25',
      endDate: '2026-11-26',
      isAllDay: false,
      startTime: '10:00',
      endTime: '11:30',
      color: '#10B981',
      equipmentStatus: 'ready',
    };

    const createRes = await request(
      {
        url: `${API_BASE}/calendar/events`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      newEventPayload,
    );

    assert(createRes.statusCode === 201, 'Marketing Manager creation returns 201 Created');
    assert(createRes.data.title === newEventPayload.title, 'Returned event title matches input');
    assert(createRes.data.eventType === 'campaign', 'Returned eventType is campaign');
    assert(createRes.data.startDate === '2026-11-25', 'Returned startDate matches 2026-11-25');
    assert(createRes.data.endDate === '2026-11-26', 'Returned endDate matches 2026-11-26');
    assert(createRes.data.startTime === '10:00', 'Returned startTime matches 10:00');
    assert(createRes.data.endTime === '11:30', 'Returned endTime matches 11:30');
    assert(Array.isArray(createRes.data.equipment) && createRes.data.equipment[0]?.status === 'ready', 'Equipment status mapped correctly');
    const createdId = createRes.data.id;
    assert(!!createdId, 'Event ID is generated and returned');

    // Verify physical persistence in PostgreSQL
    const dbEvent = await prisma.calendarEvent.findUnique({
      where: { id: createdId },
    });
    assert(!!dbEvent, 'Event physically exists in PostgreSQL database');
    assert(dbEvent?.title === newEventPayload.title, 'PostgreSQL event title matches exactly');
    assert(dbEvent?.organizationId === '00000000-0000-0000-0000-000000000001', 'OrganizationId derived strictly from JWT context');
    assert(dbEvent?.createdById === marketingAuth.user.id, 'Creator user ID matches authenticated user');

    // 6. Retrieval (List & Single Detail)
    console.log('\n--- 6. Event Retrieval & Detail ---');
    const getOneRes = await request({
      url: `${API_BASE}/calendar/events/${createdId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(getOneRes.statusCode === 200, 'GET /api/calendar/events/:id returns 200 OK');
    assert(getOneRes.data.id === createdId, 'Detail ID matches requested ID');
    assert(!!getOneRes.data.assignee, 'Assignee object is included');

    const getAllRes = await request({
      url: `${API_BASE}/calendar/events`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(getAllRes.statusCode === 200, 'GET /api/calendar/events returns 200 OK');
    assert(Array.isArray(getAllRes.data), 'Events list is returned as array');
    const foundInList = getAllRes.data.some((e: any) => e.id === createdId);
    assert(foundInList, 'Newly created event is present in the list');

    // 7. Filtering and Date Range Queries
    console.log('\n--- 7. Filtering and Date Range Queries ---');
    const typeFilterRes = await request({
      url: `${API_BASE}/calendar/events?eventType=campaign`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(typeFilterRes.statusCode === 200, 'Filter by eventType=campaign returns 200');
    assert(typeFilterRes.data.every((e: any) => e.eventType === 'campaign'), 'All returned events have eventType=campaign');

    const dateFilterRes = await request({
      url: `${API_BASE}/calendar/events?startDate=2026-11-24&endDate=2026-11-27`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(dateFilterRes.statusCode === 200, 'Filter by date range returns 200');
    const foundInDateRange = dateFilterRes.data.some((e: any) => e.id === createdId);
    assert(foundInDateRange, 'Event is returned when query overlaps with event dates');

    const searchFilterRes = await request({
      url: `${API_BASE}/calendar/events?search=${encodeURIComponent('یلدا')}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(searchFilterRes.statusCode === 200, 'Search by keyword returns 200');
    assert(searchFilterRes.data.some((e: any) => e.id === createdId), 'Search keyword matches newly created event');

    // 8. Event Update & Rescheduling
    console.log('\n--- 8. Event Update & Rescheduling ---');
    const updateRes = await request(
      {
        url: `${API_BASE}/calendar/events/${createdId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${marketingAuth.token}` },
      },
      {
        title: 'جلسه هماهنگی کمپین یلدایی (نهایی و ویرایش‌شده)',
        startDate: '2026-11-28',
        endDate: '2026-11-29',
        startTime: '14:00',
        endTime: '15:30',
      },
    );
    assert(updateRes.statusCode === 200, 'PATCH /api/calendar/events/:id returns 200 OK');
    assert(updateRes.data.title === 'جلسه هماهنگی کمپین یلدایی (نهایی و ویرایش‌شده)', 'Updated title matches');
    assert(updateRes.data.startDate === '2026-11-28', 'Updated startDate matches rescheduled date');
    assert(updateRes.data.startTime === '14:00', 'Updated startTime matches 14:00');

    // Client forbidden from PATCH
    const clientPatch = await request(
      {
        url: `${API_BASE}/calendar/events/${createdId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientAuth.token}` },
      },
      { title: 'تغییر عنوان توسط کارفرما' },
    );
    assert(clientPatch.statusCode === 403, 'Client role is forbidden from updating events (403)');

    // 9. Event Deletion & Cleanup
    console.log('\n--- 9. Event Deletion & Cleanup ---');
    const clientDelete = await request({
      url: `${API_BASE}/calendar/events/${createdId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientAuth.token}` },
    });
    assert(clientDelete.statusCode === 403, 'Client role cannot DELETE event (403 Forbidden)');

    const deleteRes = await request({
      url: `${API_BASE}/calendar/events/${createdId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${marketingAuth.token}` },
    });
    assert(deleteRes.statusCode === 200, 'DELETE /api/calendar/events/:id returns 200 OK');

    const verifyDeleted = await prisma.calendarEvent.findUnique({
      where: { id: createdId },
    });
    assert(verifyDeleted === null, 'Event is physically removed from PostgreSQL database');

    const getDeleted = await request({
      url: `${API_BASE}/calendar/events/${createdId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(getDeleted.statusCode === 404, 'GET deleted event returns 404 Not Found');

  } catch (err: any) {
    console.error('Fatal error during test execution:', err.message);
    failed++;
  } finally {
    await prisma.$disconnect();
    console.log('\n================================================================');
    console.log(`CALENDAR INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runCalendarIntegrationTests();
