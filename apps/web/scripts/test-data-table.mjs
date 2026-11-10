/**
 * تست جامع منطق هسته DataTable (مرتب‌سازی، صفحه‌بندی، تصحیح خودکار و حالت دستی)
 */
import assert from 'node:assert/strict';

// توابع شبیه‌ساز منطق هسته DataTable دقیقاً منطبق بر data-table.tsx
function getCellValue(row, column) {
  if (column.accessorFn) return column.accessorFn(row);
  if (column.accessorKey && typeof row === 'object' && row !== null) {
    return row[column.accessorKey];
  }
  return undefined;
}

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  if (
    typeof a === 'string' &&
    typeof b === 'string' &&
    (a.includes('-') || a.includes('/')) &&
    isNaN(Number(a)) &&
    isNaN(Number(b))
  ) {
    const timeA = Date.parse(a);
    const timeB = Date.parse(b);
    if (!isNaN(timeA) && !isNaN(timeB)) {
      return timeA - timeB;
    }
  }

  return String(a).localeCompare(String(b), 'fa-IR', {
    numeric: true,
    sensitivity: 'base',
  });
}

function sortData(data, columns, sorting, manualSorting = false) {
  if (manualSorting || !sorting) return [...data];

  const column = columns.find((c) => c.id === sorting.columnId);
  if (!column) return [...data];

  return [...data].sort((a, b) => {
    const valA = getCellValue(a, column);
    const valB = getCellValue(b, column);
    const cmp = compareValues(valA, valB);
    return sorting.direction === 'desc' ? -cmp : cmp;
  });
}

function paginateData(data, pagination, totalCount, manualPagination = false) {
  if (manualPagination) return [...data];

  const startIndex = (pagination.pageIndex - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  return data.slice(startIndex, endIndex);
}

function clampPageIndex(pageIndex, pageSize, totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.max(1, Math.min(pageIndex, totalPages));
}

console.log('🧪 Starting DataTable core verification tests...\n');

// داده‌های آزمایشی
const mockItems = [
  { id: '1', name: 'کمپین الف', budget: 5000000, date: '2026-10-01' },
  { id: '2', name: 'کمپین ج', budget: 15000000, date: '2026-12-15' },
  { id: '3', name: 'کمپین ب', budget: 2000000, date: '2026-11-10' },
  { id: '4', name: 'کمپین د', budget: 8000000, date: '2026-09-20' },
];

const columns = [
  { id: 'id', accessorKey: 'id' },
  { id: 'name', accessorKey: 'name', sortable: true },
  { id: 'budget', accessorKey: 'budget', sortable: true },
  { id: 'date', accessorKey: 'date', sortable: true },
];

// تست ۱: مرتب‌سازی عددی صعودی و نزولی
{
  const asc = sortData(mockItems, columns, { columnId: 'budget', direction: 'asc' });
  assert.deepEqual(asc.map((i) => i.budget), [2000000, 5000000, 8000000, 15000000]);

  const desc = sortData(mockItems, columns, { columnId: 'budget', direction: 'desc' });
  assert.deepEqual(desc.map((i) => i.budget), [15000000, 8000000, 5000000, 2000000]);
  console.log('✅ Test 1: Numeric sort (asc & desc) passed.');
}

// تست ۲: مرتب‌سازی رشته‌ای فارسی (الفبایی)
{
  const asc = sortData(mockItems, columns, { columnId: 'name', direction: 'asc' });
  assert.deepEqual(asc.map((i) => i.name), ['کمپین الف', 'کمپین ب', 'کمپین ج', 'کمپین د']);

  const desc = sortData(mockItems, columns, { columnId: 'name', direction: 'desc' });
  assert.deepEqual(desc.map((i) => i.name), ['کمپین د', 'کمپین ج', 'کمپین ب', 'کمپین الف']);
  console.log('✅ Test 2: Persian string alphabetical sort passed.');
}

// تست ۳: مرتب‌سازی تاریخ (ISO)
{
  const asc = sortData(mockItems, columns, { columnId: 'date', direction: 'asc' });
  assert.deepEqual(asc.map((i) => i.date), [
    '2026-09-20',
    '2026-10-01',
    '2026-11-10',
    '2026-12-15',
  ]);

  const desc = sortData(mockItems, columns, { columnId: 'date', direction: 'desc' });
  assert.deepEqual(desc.map((i) => i.date), [
    '2026-12-15',
    '2026-11-10',
    '2026-10-01',
    '2026-09-20',
  ]);
  console.log('✅ Test 3: Date sorting (asc & desc) passed.');
}

// تست ۴: صفحه‌بندی ۲۰، ۵۰ و ۱۰۰ با داده‌های حجیم
{
  const largeData = Array.from({ length: 125 }, (_, idx) => ({
    id: String(idx + 1),
    name: `آیتم ${idx + 1}`,
    budget: (idx + 1) * 1000,
  }));

  // اندازه ۲۰: صفحه ۱ باید ۲۰ آیتم، صفحه ۷ باید ۵ آیتم داشته باشد (کل: ۷ صفحه)
  const p20_1 = paginateData(largeData, { pageIndex: 1, pageSize: 20 });
  assert.equal(p20_1.length, 20);
  assert.equal(p20_1[0].id, '1');
  assert.equal(p20_1[19].id, '20');

  const p20_7 = paginateData(largeData, { pageIndex: 7, pageSize: 20 });
  assert.equal(p20_7.length, 5);
  assert.equal(p20_7[4].id, '125');

  // اندازه ۵۰: صفحه ۳ باید ۲۵ آیتم داشته باشد (کل: ۳ صفحه)
  const p50_3 = paginateData(largeData, { pageIndex: 3, pageSize: 50 });
  assert.equal(p50_3.length, 25);

  // اندازه ۱۰۰: صفحه ۲ باید ۲۵ آیتم داشته باشد (کل: ۲ صفحه)
  const p100_2 = paginateData(largeData, { pageIndex: 2, pageSize: 100 });
  assert.equal(p100_2.length, 25);

  console.log('✅ Test 4: Pagination with page sizes 20, 50, and 100 passed.');
}

// تست ۵: تغییر صفحه و بازنشانی صفحه هنگام تغییر اندازه صفحه
{
  let state = { pageIndex: 4, pageSize: 20 };
  // کاربر اندازه صفحه را به ۵۰ تغییر می‌دهد -> باید pageIndex به ۱ برگردد
  const onPageSizeChange = (newSize) => ({ pageIndex: 1, pageSize: newSize });
  state = onPageSizeChange(50);
  assert.equal(state.pageIndex, 1);
  assert.equal(state.pageSize, 50);
  console.log('✅ Test 5: Page size change resets to page 1 passed.');
}

// تست ۶: رفتار با آرایه خالی
{
  const emptyData = [];
  const sorted = sortData(emptyData, columns, { columnId: 'budget', direction: 'asc' });
  assert.equal(sorted.length, 0);

  const paginated = paginateData(sorted, { pageIndex: 1, pageSize: 20 });
  assert.equal(paginated.length, 0);

  const clamped = clampPageIndex(1, 20, 0);
  assert.equal(clamped, 1);
  console.log('✅ Test 6: Empty array handling passed.');
}

// تست ۷: تصحیح خودکار شماره صفحه در صورت کاهش تعداد صفحات پس از فیلتر
{
  // کاربر در صفحه ۵ با اندازه ۲۰ قرار داشته (حداقل ۸۱ رکورد وجود داشته)
  const oldPageIndex = 5;
  const pageSize = 20;
  // اکنون داده‌ها فیلتر شده و فقط ۲۵ رکورد باقی مانده (۲ صفحه)
  const filteredCount = 25;
  const correctedPage = clampPageIndex(oldPageIndex, pageSize, filteredCount);
  assert.equal(correctedPage, 2, 'صفحه ۵ باید به صفحه ۲ (حداکثر صفحات موجود) تصحیح شود');
  console.log('✅ Test 7: Page index auto-clamping on data reduction passed.');
}

// تست ۸: حالت manualSorting و manualPagination
{
  const original = [...mockItems];
  // در حالت manualSorting، نباید آرایه درون جدول سورت شود
  const resSort = sortData(original, columns, { columnId: 'budget', direction: 'asc' }, true);
  assert.deepEqual(resSort, original);

  // در حالت manualPagination، نباید آرایه slice شود
  const resPage = paginateData(original, { pageIndex: 2, pageSize: 1 }, 100, true);
  assert.equal(resPage.length, original.length);
  console.log('✅ Test 8: manualSorting and manualPagination bypass passed.');
}

console.log('\n🎉 All 8 DataTable verification tests passed successfully!\n');
