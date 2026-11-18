import assert from 'node:assert';
import {
  isoToJalali,
  jalaliToIso,
  getPersianMonthDays,
  getPersianMonthStartWeekday,
  isValidIsoDate,
  formatPersianDate,
} from '../src/lib/persian-date.ts';

// Grid logic verified against calendar-grid specifications
function isEventOnDate(event, dateIso) {
  const eventStart = (event.startDate || '').slice(0, 10);
  const eventEnd = (event.endDate || event.startDate || '').slice(0, 10);
  const target = dateIso.slice(0, 10);
  return target >= eventStart && target <= eventEnd;
}

function buildJalaliMonthGrid(jYear, jMonth, events = []) {
  const daysInCurrentMonth = getPersianMonthDays(jYear, jMonth);
  const startWeekday = getPersianMonthStartWeekday(jYear, jMonth);
  const cells = [];

  // Leading days
  if (startWeekday > 0) {
    const prevMonth = jMonth === 1 ? 12 : jMonth - 1;
    const prevYear = jMonth === 1 ? jYear - 1 : jYear;
    const daysInPrevMonth = getPersianMonthDays(prevYear, prevMonth);

    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateIso = jalaliToIso(prevYear, prevMonth, dayNum);
      const dayOfWeek = (startWeekday - 1 - i) % 7;
      cells.push({
        dateIso,
        jalaliYear: prevYear,
        jalaliMonth: prevMonth,
        jalaliDay: dayNum,
        dayOfWeek,
        isCurrentMonth: false,
        isFriday: dayOfWeek === 6,
        events: events.filter((e) => isEventOnDate(e, dateIso)),
      });
    }
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const dateIso = jalaliToIso(jYear, jMonth, dayNum);
    const dayOfWeek = (startWeekday + dayNum - 1) % 7;
    cells.push({
      dateIso,
      jalaliYear: jYear,
      jalaliMonth: jMonth,
      jalaliDay: dayNum,
      dayOfWeek,
      isCurrentMonth: true,
      isFriday: dayOfWeek === 6,
      events: events.filter((e) => isEventOnDate(e, dateIso)),
    });
  }

  // Trailing days
  const remainder = cells.length % 7;
  if (remainder > 0) {
    const daysToAdd = 7 - remainder;
    const nextMonth = jMonth === 12 ? 1 : jMonth + 1;
    const nextYear = jMonth === 12 ? jYear + 1 : jYear;

    for (let dayNum = 1; dayNum <= daysToAdd; dayNum++) {
      const dateIso = jalaliToIso(nextYear, nextMonth, dayNum);
      const dayOfWeek = cells.length % 7;
      cells.push({
        dateIso,
        jalaliYear: nextYear,
        jalaliMonth: nextMonth,
        jalaliDay: dayNum,
        dayOfWeek,
        isCurrentMonth: false,
        isFriday: dayOfWeek === 6,
        events: events.filter((e) => isEventOnDate(e, dateIso)),
      });
    }
  }

  return cells;
}

function buildJalaliWeekGrid(anchorIsoDate, events = []) {
  const safeDate = isValidIsoDate(anchorIsoDate) ? anchorIsoDate : '2026-11-18';
  const anchorDateObj = new Date(`${safeDate}T12:00:00Z`);
  const anchorWeekday = (anchorDateObj.getUTCDay() + 1) % 7;
  const saturdayTimestamp = anchorDateObj.getTime() - anchorWeekday * 86400000;
  const cells = [];

  for (let offset = 0; offset < 7; offset++) {
    const dayDate = new Date(saturdayTimestamp + offset * 86400000);
    const dateIso = dayDate.toISOString().split('T')[0];
    const j = isoToJalali(dateIso);
    cells.push({
      dateIso,
      jalaliYear: j.year,
      jalaliMonth: j.month,
      jalaliDay: j.day,
      dayOfWeek: offset,
      isCurrentMonth: true,
      isFriday: offset === 6,
      events: events.filter((e) => isEventOnDate(e, dateIso)),
    });
  }
  return cells;
}

async function runTests() {
  console.log('================================================================');
  console.log('🗓️ GAPJI B2.4.3 CALENDAR FRONTEND & INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // --- 1. Persian Date & Calendar Grid Engine ---
  console.log('--- 1. Persian Date & Calendar Grid Logic ---');

  test('isoToJalali and jalaliToIso round-trip accurately across seasons', () => {
    const dates = ['2026-03-21', '2026-09-22', '2026-11-18', '2026-12-21', '2027-01-01'];
    for (const d of dates) {
      const j = isoToJalali(d);
      const isoBack = jalaliToIso(j.year, j.month, j.day);
      assert.strictEqual(isoBack, d, `Roundtrip failed for ${d}: got ${isoBack}`);
    }
  });

  test('buildJalaliMonthGrid produces complete 35 or 42 cells starting on Saturday and ending on Friday', () => {
    const cells = buildJalaliMonthGrid(1405, 8); // Aban 1405
    assert.ok(cells.length === 35 || cells.length === 42, `Invalid grid size: ${cells.length}`);
    assert.strictEqual(cells[0].dayOfWeek, 0, 'First cell must be Saturday (0)');
    assert.strictEqual(cells[cells.length - 1].dayOfWeek, 6, 'Last cell must be Friday (6)');
  });

  test('buildJalaliWeekGrid produces exactly 7 cells starting on Saturday and ending on Friday', () => {
    const week = buildJalaliWeekGrid('2026-11-18');
    assert.strictEqual(week.length, 7, 'Week grid must have exactly 7 cells');
    assert.strictEqual(week[0].dayOfWeek, 0, 'First day must be Saturday');
    assert.strictEqual(week[6].dayOfWeek, 6, 'Last day must be Friday');
    assert.strictEqual(week[6].isFriday, true, 'Last day must have isFriday: true');
  });

  test('isEventOnDate correctly identifies events covering single and multi-day spans', () => {
    const multiDayEvent = {
      id: 'test-1',
      title: 'کمپین چند روزه',
      eventType: 'campaign',
      startDate: '2026-11-20',
      endDate: '2026-11-25',
      isAllDay: true,
    };
    assert.strictEqual(isEventOnDate(multiDayEvent, '2026-11-19'), false, 'Should be false before start');
    assert.strictEqual(isEventOnDate(multiDayEvent, '2026-11-20'), true, 'Should be true on start');
    assert.strictEqual(isEventOnDate(multiDayEvent, '2026-11-23'), true, 'Should be true in middle');
    assert.strictEqual(isEventOnDate(multiDayEvent, '2026-11-25'), true, 'Should be true on end');
    assert.strictEqual(isEventOnDate(multiDayEvent, '2026-11-26'), false, 'Should be false after end');
  });

  test('isEventOnDate correctly handles single-day events without date shifts', () => {
    const singleDayEvent = {
      id: 'test-single',
      title: 'جلسه برنامه‌ریزی',
      eventType: 'meeting',
      startDate: '2026-11-18',
      endDate: '2026-11-18',
      isAllDay: false,
    };
    assert.strictEqual(isEventOnDate(singleDayEvent, '2026-11-17'), false);
    assert.strictEqual(isEventOnDate(singleDayEvent, '2026-11-18'), true);
    assert.strictEqual(isEventOnDate(singleDayEvent, '2026-11-19'), false);
  });

  // --- 2. Live Backend Request Flow ---
  console.log('\n--- 2. Frontend-to-Backend Live Request Flow ---');

  await testAsync('Authenticate against NestJS backend and receive JWT', async () => {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@gapji.dev', password: 'Password123!' }),
    });
    assert.strictEqual(loginRes.status, 200, 'Login response must be 200');
    const { accessToken, user } = await loginRes.json();
    assert.ok(accessToken, 'Access token must be present');
    assert.strictEqual(user.role, 'admin', 'User role must be admin');
  });

  await testAsync('Fetch calendar events list from real database', async () => {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@gapji.dev', password: 'Password123!' }),
    });
    const { accessToken } = await loginRes.json();

    const calRes = await fetch('http://localhost:3001/api/calendar/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(calRes.status, 200, 'GET /calendar/events must be 200');
    const events = await calRes.json();
    assert.ok(Array.isArray(events), 'Events must be an array');
    assert.ok(events.length > 0, 'Must have seed events in DB');

    const ev = events[0];
    assert.ok(ev.id, 'Event must have id');
    assert.ok(ev.title, 'Event must have title');
    assert.ok(ev.eventType, 'Event must have eventType');
    assert.ok(ev.startDate, 'Event must have startDate');
    assert.ok(isValidIsoDate(ev.startDate), 'Event startDate must be valid ISO date');
  });

  await testAsync('Filter calendar events by eventType=campaign', async () => {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@gapji.dev', password: 'Password123!' }),
    });
    const { accessToken } = await loginRes.json();

    const calRes = await fetch('http://localhost:3001/api/calendar/events?eventType=campaign', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(calRes.status, 200);
    const events = await calRes.json();
    assert.ok(events.length > 0, 'Must return at least one campaign event');
    assert.ok(events.every((e) => e.eventType === 'campaign'), 'All returned events must be campaign type');
  });

  await testAsync('Full CRUD lifecycle: Create, Reschedule, Update, and Delete event', async () => {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'marketing@gapji.dev', password: 'Password123!' }),
    });
    const { accessToken } = await loginRes.json();

    // 1. Create
    const createRes = await fetch('http://localhost:3001/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: 'رویداد آزمایشی وبینار سئو و هوش مصنوعی',
        description: 'بررسی راهکارهای افزایش ترافیک ارگانیک',
        eventType: 'webinar',
        startDate: '2026-11-28',
        endDate: '2026-11-28',
        isAllDay: false,
        startTime: '16:00',
        endTime: '17:30',
        color: '#38BDF8',
        equipmentStatus: 'ready',
      }),
    });
    assert.strictEqual(createRes.status, 201, 'Create must return 201');
    const created = await createRes.json();
    assert.strictEqual(created.title, 'رویداد آزمایشی وبینار سئو و هوش مصنوعی');
    assert.strictEqual(created.eventType, 'webinar');
    assert.strictEqual(created.startDate, '2026-11-28');
    assert.strictEqual(created.startTime, '16:00');

    // 2. Reschedule via PATCH
    const patchRes = await fetch(`http://localhost:3001/api/calendar/events/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        startDate: '2026-11-29',
        endDate: '2026-11-29',
      }),
    });
    assert.strictEqual(patchRes.status, 200, 'Reschedule must return 200');
    const updated = await patchRes.json();
    assert.strictEqual(updated.startDate, '2026-11-29', 'startDate must be updated');

    // 3. Delete
    const delRes = await fetch(`http://localhost:3001/api/calendar/events/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(delRes.status, 200, 'Delete must return 200');

    // 4. Verify 404
    const getDeleted = await fetch(`http://localhost:3001/api/calendar/events/${created.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(getDeleted.status, 404, 'Deleted event must return 404');
  });

  console.log('\n================================================================');
  console.log(`CALENDAR FRONTEND & INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
