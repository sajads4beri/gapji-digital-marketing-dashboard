/**
 * تست جامع منطق فیلترها و همپوشانی تاریخ‌ها در Mock Service
 */
import assert from 'node:assert/strict';

// شبیه‌سازی دقیق کمپین‌ها
const sampleCampaigns = [
  {
    id: 'cmp_1',
    name: 'کمپین تبلیغاتی جذب لید پاییزی',
    channel: 'اینستاگرام',
    description: 'تبلیغات در اینستاگرام و استوری‌های تخصصی',
    status: 'active',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-10-31T00:00:00.000Z',
    spend: 21500000,
    impressions: 185000,
    clicks: 7400,
    conversions: 320,
  },
  {
    id: 'cmp_2',
    name: 'کمپین سرچ کلمات کلیدی B2B',
    channel: 'گوگل ادز',
    description: 'تبلیغات هدفمند گوگل ادز روی کلمات کلیدی',
    status: 'paused',
    startDate: '2026-10-15T00:00:00.000Z',
    endDate: '2026-11-15T00:00:00.000Z',
    spend: 12000000,
    impressions: 95000,
    clicks: 3800,
    conversions: 140,
  },
  {
    id: 'cmp_3',
    name: 'کمپین زمستانه برندینگ',
    channel: 'یکتانت',
    description: 'تبلیغات همسان و بنری شبکه یکتانت',
    status: 'draft',
    startDate: '2026-12-01T00:00:00.000Z',
    endDate: '2026-12-30T00:00:00.000Z',
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
  },
  {
    id: 'cmp_4',
    name: 'کمپین تابستانه ریتارگتینگ',
    channel: 'اینستاگرام',
    description: 'ریتارگتینگ لیدهای سایت',
    status: 'completed',
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-08-31T00:00:00.000Z',
    spend: 15000000,
    impressions: 110000,
    clicks: 4500,
    conversions: 210,
  },
];

// پیاده‌سازی متد فیلتر دقیقاً منطبق بر campaign.mock.ts
function filterList(list, filters) {
  if (!filters) return [...list];

  let result = [...list];

  // ۱. فیلتر جستجوی متنی
  if (filters.search && filters.search.trim()) {
    const query = filters.search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.channel.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
    );
  }

  // ۲. فیلتر وضعیت
  if (filters.status) {
    let statusList = [];
    if (Array.isArray(filters.status)) {
      statusList = filters.status.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof filters.status === 'string') {
      statusList = filters.status.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (statusList.length > 0) {
      result = result.filter((c) => statusList.includes(c.status));
    }
  }

  // ۳. فیلتر کانال
  if (filters.channel && filters.channel.trim()) {
    result = result.filter((c) => c.channel === filters.channel.trim());
  }

  // ۴. فیلتر بازه تاریخ (همپوشانی)
  const filterFrom = (filters.from || filters.startDate || '').trim().slice(0, 10);
  const filterTo = (filters.to || filters.endDate || '').trim().slice(0, 10);

  if (filterFrom || filterTo) {
    result = result.filter((c) => {
      const campStart = (c.startDate || '').slice(0, 10);
      const campEnd = (c.endDate || '').slice(0, 10);

      if (filterTo && campStart && campStart > filterTo) return false;
      if (filterFrom && campEnd && campEnd < filterFrom) return false;
      return true;
    });
  }

  return result;
}

function calculateStats(list) {
  return {
    total: list.length,
    active: list.filter((c) => c.status === 'active').length,
    totalSpend: list.reduce((sum, c) => sum + (c.spend || 0), 0),
    totalImpressions: list.reduce((sum, c) => sum + (c.impressions || 0), 0),
    totalClicks: list.reduce((sum, c) => sum + (c.clicks || 0), 0),
    totalConversions: list.reduce((sum, c) => sum + (c.conversions || 0), 0),
  };
}

console.log('🧪 Starting FilterBar & Mock Service verification tests...\n');

// تست ۱: بدون فیلتر
{
  const res = filterList(sampleCampaigns);
  assert.equal(res.length, 4, 'بدون فیلتر باید هر ۴ کمپین برگشت داده شوند');
  const stats = calculateStats(res);
  assert.equal(stats.total, 4);
  assert.equal(stats.active, 1);
  console.log('✅ Test 1: No filter passed.');
}

// تست ۲: جستجوی متنی نام
{
  const res = filterList(sampleCampaigns, { search: 'پاییزی' });
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 'cmp_1');
  console.log('✅ Test 2: Search by campaign name passed.');
}

// تست ۳: جستجوی متنی کانال
{
  const res = filterList(sampleCampaigns, { search: 'گوگل' });
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 'cmp_2');
  console.log('✅ Test 3: Search by channel passed.');
}

// تست ۴: فیلتر وضعیت تکی (رشته)
{
  const res = filterList(sampleCampaigns, { status: 'active' });
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 'cmp_1');
  console.log('✅ Test 4: Single status (string) passed.');
}

// تست ۵: فیلتر چند وضعیت (آرایه)
{
  const res = filterList(sampleCampaigns, { status: ['active', 'paused'] });
  assert.equal(res.length, 2);
  const ids = res.map((c) => c.id).sort();
  assert.deepEqual(ids, ['cmp_1', 'cmp_2']);
  const stats = calculateStats(res);
  assert.equal(stats.total, 2);
  assert.equal(stats.active, 1);
  assert.equal(stats.totalSpend, 33500000);
  console.log('✅ Test 5: Multi-status (array) and dynamic KPI sync passed.');
}

// تست ۶: فیلتر چند وضعیت (رشته کاما-جداشده از URL)
{
  const res = filterList(sampleCampaigns, { status: 'draft,completed' });
  assert.equal(res.length, 2);
  const ids = res.map((c) => c.id).sort();
  assert.deepEqual(ids, ['cmp_3', 'cmp_4']);
  console.log('✅ Test 6: Multi-status (comma-separated URL string) passed.');
}

// تست ۷: همپوشانی تاریخ - بازه پاییزی کامل (2026-10-01 تا 2026-10-31)
// cmp_1 (10-01 to 10-31): overlap
// cmp_2 (10-15 to 11-15): overlap
// cmp_3 (12-01 to 12-30): no overlap
// cmp_4 (07-01 to 08-31): no overlap
{
  const res = filterList(sampleCampaigns, { from: '2026-10-01', to: '2026-10-31' });
  assert.equal(res.length, 2);
  const ids = res.map((c) => c.id).sort();
  assert.deepEqual(ids, ['cmp_1', 'cmp_2']);
  console.log('✅ Test 7: Date overlap in middle month passed.');
}

// تست ۸: همپوشانی تاریخ - فقط شروع (from: 2026-11-01)
// cmp_1 ends on 10-31 < 11-01 -> false
// cmp_2 ends on 11-15 >= 11-01 -> true
// cmp_3 ends on 12-30 >= 11-01 -> true
// cmp_4 ends on 08-31 < 11-01 -> false
{
  const res = filterList(sampleCampaigns, { from: '2026-11-01' });
  assert.equal(res.length, 2);
  const ids = res.map((c) => c.id).sort();
  assert.deepEqual(ids, ['cmp_2', 'cmp_3']);
  console.log('✅ Test 8: Date overlap with only "from" bound passed.');
}

// تست ۹: همپوشانی تاریخ - فقط پایان (to: 2026-09-01)
// cmp_1 starts on 10-01 > 09-01 -> false
// cmp_2 starts on 10-15 > 09-01 -> false
// cmp_3 starts on 12-01 > 09-01 -> false
// cmp_4 starts on 07-01 <= 09-01 -> true
{
  const res = filterList(sampleCampaigns, { to: '2026-09-01' });
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 'cmp_4');
  console.log('✅ Test 9: Date overlap with only "to" bound passed.');
}

// تست ۱۰: ترکیب جستجو + وضعیت + بازه تاریخ
{
  const res = filterList(sampleCampaigns, {
    search: 'تبلیغات',
    status: ['active', 'paused'],
    from: '2026-10-10',
    to: '2026-10-20',
  });
  assert.equal(res.length, 2);
  const ids = res.map((c) => c.id).sort();
  assert.deepEqual(ids, ['cmp_1', 'cmp_2']);
  console.log('✅ Test 10: Combined search + multi-status + date range passed.');
}

// تست ۱۱: جستجو بدون نتیجه
{
  const res = filterList(sampleCampaigns, { search: 'کلمه‌ای که وجود ندارد' });
  assert.equal(res.length, 0);
  const stats = calculateStats(res);
  assert.equal(stats.total, 0);
  assert.equal(stats.totalSpend, 0);
  console.log('✅ Test 11: Empty search results & zeroed stats passed.');
}

console.log('\n🎉 All 11 verification tests passed successfully!\n');
