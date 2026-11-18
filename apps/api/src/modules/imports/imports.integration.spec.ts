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

import { PrismaClient } from '@prisma/client';
import http from 'http';
import * as crypto from 'crypto';

const API_BASE = 'http://localhost:3001/api';
const prisma = new PrismaClient();

function request(
  options: { url: string; method?: string; headers?: Record<string, string> },
  body: any = null,
): Promise<{
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

// Simple test framework
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    failed++;
    console.error(`  ❌ [FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  } else {
    passed++;
    console.log(`  ✅ [PASS] ${msg}`);
  }
}

async function login(email: string, password = 'Password123!'): Promise<string> {
  const res = await request(
    {
      url: `${API_BASE}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: email, password },
  );
  if (res.statusCode !== 200 || !res.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${res.statusCode} ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken;
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🚀 GAPJI P1-2 UNIVERSAL IMPORT WIZARD BACKEND INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // --- 1. Authenticating Roles ---
  console.log('--- 1. Authenticating Roles ---');
  const adminToken = await login('admin@gapji.dev');
  const marketingToken = await login('marketing@gapji.dev');
  const campaignToken = await login('campaign@gapji.dev');
  const salesToken = await login('sales@gapji.dev');
  const clientToken = await login('client@gapji.dev');
  assert(!!adminToken && !!marketingToken && !!campaignToken && !!salesToken && !!clientToken, 'All role tokens retrieved');

  const authHeader = (tok: string) => ({
    Authorization: `Bearer ${tok}`,
    'Content-Type': 'application/json',
  });

  // --- 2. Unauthenticated Rejection ---
  console.log('\n--- 2. Unauthenticated Request Rejection ---');
  const unauthFields = await request({ url: `${API_BASE}/imports/fields?type=leads` });
  assert(unauthFields.statusCode === 401, 'GET /api/imports/fields without token returns 401');

  const unauthInspect = await request(
    { url: `${API_BASE}/imports/inspect`, method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { dataType: 'leads', csvContent: 'نام,موبایل\nتست,09121110001' },
  );
  assert(unauthInspect.statusCode === 401, 'POST /api/imports/inspect without token returns 401');

  const unauthValidate = await request(
    { url: `${API_BASE}/imports/validate`, method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { dataType: 'leads', mapping: {}, rows: [] },
  );
  assert(unauthValidate.statusCode === 401, 'POST /api/imports/validate without token returns 401');

  const unauthExec = await request(
    { url: `${API_BASE}/imports/execute`, method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { dataType: 'leads', fileName: 'test.csv', validRows: [] },
  );
  assert(unauthExec.statusCode === 401, 'POST /api/imports/execute without token returns 401');

  // --- 3. Role-Based Access Enforcement (DEC-AUTH-11) ---
  console.log('\n--- 3. Role-Based Access Control & Invariants (DEC-AUTH-11) ---');
  // Campaign manager CANNOT access Leads imports
  const campLeadFields = await request({
    url: `${API_BASE}/imports/fields?type=leads`,
    headers: authHeader(campaignToken),
  });
  assert(campLeadFields.statusCode === 403, 'campaign_manager is strictly denied GET /api/imports/fields?type=leads (403)');

  const campLeadInspect = await request(
    { url: `${API_BASE}/imports/inspect`, method: 'POST', headers: authHeader(campaignToken) },
    { dataType: 'leads', csvContent: 'نام,موبایل\nلید کمپین,09121110001' },
  );
  assert(campLeadInspect.statusCode === 403, 'campaign_manager is strictly denied POST /api/imports/inspect (leads) (403)');

  // Client role CANNOT import costs or leads
  const clientCostInspect = await request(
    { url: `${API_BASE}/imports/inspect`, method: 'POST', headers: authHeader(clientToken) },
    { dataType: 'costs', csvContent: 'عنوان,مبلغ,تاریخ\nتبلیغات,1000,2026-11-10' },
  );
  assert(clientCostInspect.statusCode === 403, 'client role is strictly denied POST /api/imports/inspect (costs) (403)');

  // Sales agent CANNOT import costs
  const salesCostInspect = await request(
    { url: `${API_BASE}/imports/inspect`, method: 'POST', headers: authHeader(salesToken) },
    { dataType: 'costs', csvContent: 'عنوان,مبلغ,تاریخ\nتبلیغات,1000,2026-11-10' },
  );
  assert(salesCostInspect.statusCode === 403, 'sales_agent role is strictly denied POST /api/imports/inspect (costs) (403)');

  // Marketing manager and admin CAN access both
  const mmLeadFields = await request({
    url: `${API_BASE}/imports/fields?type=leads`,
    headers: authHeader(marketingToken),
  });
  assert(mmLeadFields.statusCode === 200, 'marketing_manager can access GET /api/imports/fields?type=leads (200)');
  assert(Array.isArray(mmLeadFields.data) && mmLeadFields.data.length >= 8, 'Target fields list has required metadata');

  const mmCostFields = await request({
    url: `${API_BASE}/imports/fields?type=costs`,
    headers: authHeader(marketingToken),
  });
  assert(mmCostFields.statusCode === 200, 'marketing_manager can access GET /api/imports/fields?type=costs (200)');

  // --- 4. CSV Inspection & Intelligent Column Mapping ---
  console.log('\n--- 4. CSV Inspection & Intelligent Auto-Mapping ---');
  const sampleCsvContent = `\uFEFF"نام و نام خانوادگی","شماره همراه","ایمیل","شهر","منبع","ارزش معامله"
"سهراب سپهری","09125556677","sohrab@poem.ir","کاشان","وبسایت","35000000"
"فروغ فرخزاد","09128889900","forough@poem.ir","تهران","اینستاگرام","50000000"`;

  const inspectRes = await request(
    { url: `${API_BASE}/imports/inspect`, method: 'POST', headers: authHeader(marketingToken) },
    { dataType: 'leads', csvContent: sampleCsvContent },
  );
  assert(inspectRes.statusCode === 200, 'POST /api/imports/inspect returns 200 OK');
  assert(inspectRes.data.headers.length === 6, 'Headers parsed correctly (6 columns)');
  assert(inspectRes.data.rowCount === 2, 'Row count correctly detected as 2');
  assert(inspectRes.data.suggestedMappings['نام و نام خانوادگی'] === 'fullName', 'Auto-mapped "نام و نام خانوادگی" -> fullName');
  assert(inspectRes.data.suggestedMappings['شماره همراه'] === 'mobile', 'Auto-mapped "شماره همراه" -> mobile');
  assert(inspectRes.data.suggestedMappings['ایمیل'] === 'email', 'Auto-mapped "ایمیل" -> email');
  assert(inspectRes.data.suggestedMappings['شهر'] === 'city', 'Auto-mapped "شهر" -> city');
  assert(inspectRes.data.suggestedMappings['منبع'] === 'source', 'Auto-mapped "منبع" -> source');
  assert(inspectRes.data.suggestedMappings['ارزش معامله'] === 'salesValue', 'Auto-mapped "ارزش معامله" -> salesValue');

  // --- 5. Authoritative Backend Validation: Missing Required Fields ---
  console.log('\n--- 5. Authoritative Validation: Missing Required Fields ---');
  const missingReqRes = await request(
    { url: `${API_BASE}/imports/validate`, method: 'POST', headers: authHeader(marketingToken) },
    {
      dataType: 'leads',
      mapping: { 'نام و نام خانوادگی': 'fullName' }, // mobile is missing!
      rows: [{ 'نام و نام خانوادگی': 'تست بدون موبایل' }],
    },
  );
  assert(missingReqRes.statusCode === 400, 'Validation rejects mapping missing required field (mobile) with 400');

  // --- 6. Authoritative Validation: Row-Level Validation & Duplicate Detection ---
  console.log('\n--- 6. Row-Level Validation, Duplicate Detection & Safe Policy ---');
  // Generate unique test mobiles
  const uniquePhone1 = `0919${Math.floor(1000000 + Math.random() * 9000000)}`;
  const uniquePhone2 = `0919${Math.floor(1000000 + Math.random() * 9000000)}`;

  const validateRes = await request(
    { url: `${API_BASE}/imports/validate`, method: 'POST', headers: authHeader(marketingToken) },
    {
      dataType: 'leads',
      mapping: {
        'نام': 'fullName',
        'موبایل': 'mobile',
        'ایمیل': 'email',
        'شهر': 'city',
        'ارزش': 'salesValue',
      },
      rows: [
        { نام: 'کاربر معتبر یک', موبایل: uniquePhone1, ایمیل: 'valid1@test.com', شهر: 'تهران', ارزش: '20000000' },
        { نام: 'کاربر معتبر دو', موبایل: uniquePhone2, ایمیل: 'valid2@test.com', شهر: 'شیراز', ارزش: '15000000' },
        { نام: '', موبایل: '09120001122', ایمیل: 'bad@test.com' }, // Invalid: missing fullName
        { نام: 'تلفن خراب', موبایل: '123456', ایمیل: 'badphone@test.com' }, // Invalid: bad phone
        { نام: 'ایمیل خراب', موبایل: '09127778899', ایمیل: 'not-an-email' }, // Invalid: bad email
        { نام: 'شماره تکراری در فایل', موبایل: uniquePhone1, ایمیل: 'dup@test.com' }, // Duplicate of row 1!
      ],
    },
  );
  assert(validateRes.statusCode === 200, 'POST /api/imports/validate returns 200 OK');
  assert(validateRes.data.totalRows === 6, 'Total rows = 6');
  assert(validateRes.data.validRowsCount === 2, 'Valid rows = 2');
  assert(validateRes.data.invalidRowsCount === 3, 'Invalid rows = 3');
  assert(validateRes.data.duplicateRowsCount === 1, 'Duplicate rows = 1');
  assert(validateRes.data.rows[5].status === 'duplicate', 'Row 6 flagged as duplicate');
  assert(validateRes.data.rows[2].status === 'invalid', 'Row 3 flagged as invalid (missing name)');
  assert(validateRes.data.rows[3].status === 'invalid', 'Row 4 flagged as invalid (bad mobile)');

  // --- 7. Execution: Lead Bulk Import & PostgreSQL Persistence ---
  console.log('\n--- 7. Execution: Lead Bulk Import & PostgreSQL Persistence ---');
  const leadImportKey = crypto.randomUUID();
  const validLeadRows = [
    {
      fullName: 'امیرعباس هویدا',
      mobile: uniquePhone1,
      email: 'amir.h@example.com',
      city: 'تهران',
      source: 'نمایشگاه الکامپ',
      salesValue: 20000000,
    },
    {
      fullName: 'جمشید آموزگار',
      mobile: uniquePhone2,
      email: 'jamshid.a@example.com',
      city: 'اصفهان',
      source: 'تبلیغات اینستاگرام',
      salesValue: 30000000,
    },
  ];

  const execLeadRes = await request(
    { url: `${API_BASE}/imports/execute`, method: 'POST', headers: authHeader(marketingToken) },
    {
      dataType: 'leads',
      fileName: 'leads_test_import.csv',
      validRows: validLeadRows,
      idempotencyKey: leadImportKey,
      duplicateHandling: 'skip',
    },
  );
  assert(execLeadRes.statusCode === 201, 'POST /api/imports/execute returns 201 Created');
  assert(execLeadRes.data.importedCount === 2, 'Successfully imported count = 2');
  assert(execLeadRes.data.failedCount === 0, 'Failed count = 0');
  assert(execLeadRes.data.status === 'completed', 'Job status = completed');

  // Verify in PostgreSQL
  const dbLead1 = await prisma.lead.findFirst({
    where: { mobile: uniquePhone1 },
    include: { activities: true },
  });
  assert(!!dbLead1, 'Lead 1 physically persisted in PostgreSQL');
  assert(dbLead1?.fullName === 'امیرعباس هویدا', 'Lead 1 fullName matches');
  assert(dbLead1?.source === 'نمایشگاه الکامپ', 'Lead 1 source matches');
  assert(Number(dbLead1?.salesValue) === 20000000, 'Lead 1 salesValue matches');
  assert(dbLead1?.activities.length! >= 1, 'Initial LeadActivity logged for imported lead');
  assert(dbLead1?.activities[0].title === 'ایمپورت لید از فایل', 'LeadActivity title indicates file import');

  // Verify ImportJob in PostgreSQL
  const dbJob = await prisma.importJob.findUnique({ where: { id: leadImportKey } });
  assert(!!dbJob, 'ImportJob record created in PostgreSQL import_jobs table');
  assert(dbJob?.dataType === 'leads', 'ImportJob dataType is leads');
  assert(dbJob?.status === 'completed', 'ImportJob status is completed');
  assert(dbJob?.successfulRows === 2, 'ImportJob successfulRows is 2');

  // --- 8. Idempotency Protection ---
  console.log('\n--- 8. Idempotency Protection ---');
  const replayRes = await request(
    { url: `${API_BASE}/imports/execute`, method: 'POST', headers: authHeader(marketingToken) },
    {
      dataType: 'leads',
      fileName: 'leads_test_import.csv',
      validRows: validLeadRows,
      idempotencyKey: leadImportKey, // SAME KEY!
      duplicateHandling: 'skip',
    },
  );
  assert(replayRes.statusCode === 201, 'Replay with same idempotencyKey returns 201 (idempotent result)');
  assert(replayRes.data.importedCount === 2, 'Returns existing completed result without duplicate insertion');

  // Ensure no duplicate leads were inserted in DB
  const duplicateCheck = await prisma.lead.count({ where: { mobile: uniquePhone1 } });
  assert(duplicateCheck === 1, 'Exactly 1 lead exists in DB for this phone (no duplicates created)');

  // Now validate against DB existing phone: should be detected as duplicate!
  const dbDupValidate = await request(
    { url: `${API_BASE}/imports/validate`, method: 'POST', headers: authHeader(marketingToken) },
    {
      dataType: 'leads',
      mapping: { نام: 'fullName', موبایل: 'mobile' },
      rows: [{ نام: 'تکرار لید ذخیره شده', موبایل: uniquePhone1 }],
    },
  );
  assert(dbDupValidate.statusCode === 200, 'Validate existing DB phone returns 200');
  assert(dbDupValidate.data.duplicateRowsCount === 1, 'Existing DB record correctly identified as duplicate');
  assert(dbDupValidate.data.rows[0].status === 'duplicate', 'Status flagged as duplicate');

  // --- 9. Execution: Cost Bulk Import & Campaign Spend Sync ---
  console.log('\n--- 9. Execution: Cost Bulk Import & Campaign Spend Sync ---');
  // Fetch active campaign in organization
  const campaign = await prisma.campaign.findFirst({
    where: { organizationId: '00000000-0000-0000-0000-000000000001' },
  });
  assert(!!campaign, 'Found active campaign for cost import test');

  const initialSpend = Number(campaign?.spend || 0);
  const costImportKey = crypto.randomUUID();
  const uniqueInvoice1 = `INV-IMP-${Math.floor(100000 + Math.random() * 900000)}`;
  const uniqueInvoice2 = `INV-IMP-${Math.floor(100000 + Math.random() * 900000)}`;

  const validCostRows = [
    {
      title: 'شارژ ادوردز کمپین تست',
      category: 'ad_media',
      amount: 10000000,
      date: '2026-11-12',
      channel: 'google_ads',
      campaignId: campaign?.id,
      vendor: 'گوگل ادز تهران',
      invoiceNumber: uniqueInvoice1,
      status: 'paid',
    },
    {
      title: 'طراحی بنر و استوری',
      category: 'content_production',
      amount: 5000000,
      date: '2026-11-13',
      channel: 'instagram',
      campaignId: campaign?.id,
      vendor: 'استودیو پویان',
      invoiceNumber: uniqueInvoice2,
      status: 'pending',
    },
  ];

  const execCostRes = await request(
    { url: `${API_BASE}/imports/execute`, method: 'POST', headers: authHeader(marketingToken) },
    {
      dataType: 'costs',
      fileName: 'marketing_costs_nov.csv',
      validRows: validCostRows,
      idempotencyKey: costImportKey,
      duplicateHandling: 'skip',
    },
  );
  assert(execCostRes.statusCode === 201, 'POST /api/imports/execute (costs) returns 201 Created');
  assert(execCostRes.data.importedCount === 2, 'Cost imported count = 2');
  assert(execCostRes.data.failedCount === 0, 'Cost failed count = 0');

  // Check Cost persistence & importJobId in PostgreSQL
  const dbCost = await prisma.cost.findFirst({
    where: { importJobId: costImportKey },
  });
  assert(!!dbCost, 'Cost physically persisted with importJobId in PostgreSQL');
  assert(Number(dbCost?.amount) === 10000000, 'Cost amount matches');

  // Check Campaign.spend was synced
  const updatedCampaign = await prisma.campaign.findUnique({ where: { id: campaign?.id } });
  const newSpend = Number(updatedCampaign?.spend || 0);
  assert(newSpend >= 15000000, 'Campaign.spend was automatically updated in PostgreSQL');

  // --- 10. Sample Template & Jobs List Endpoints ---
  console.log('\n--- 10. Sample Template & Jobs List Endpoints ---');
  const leadTemplateRes = await request({
    url: `${API_BASE}/imports/template?type=leads`,
    headers: authHeader(marketingToken),
  });
  assert(leadTemplateRes.statusCode === 200, 'GET /api/imports/template?type=leads returns 200 OK');
  assert(leadTemplateRes.data.content.includes('\uFEFF'), 'CSV template includes UTF-8 BOM');
  assert(leadTemplateRes.data.content.includes('نام و نام خانوادگی'), 'CSV template has standard Persian headers');

  const jobsListRes = await request({
    url: `${API_BASE}/imports/jobs`,
    headers: authHeader(marketingToken),
  });
  assert(jobsListRes.statusCode === 200, 'GET /api/imports/jobs returns 200 OK');
  assert(Array.isArray(jobsListRes.data) && jobsListRes.data.length >= 2, 'Import jobs returned in history list');

  // --- 11. Sales Agent Scoped Lead Import ---
  console.log('\n--- 11. Sales Agent Scoped Lead Import Enforcement ---');
  const salesPhone = `0919${Math.floor(1000000 + Math.random() * 9000000)}`;
  const salesExecRes = await request(
    { url: `${API_BASE}/imports/execute`, method: 'POST', headers: authHeader(salesToken) },
    {
      dataType: 'leads',
      fileName: 'sales_personal_leads.csv',
      validRows: [
        {
          fullName: 'لید تخصیص کارشناس',
          mobile: salesPhone,
          assignedToId: '10000000-0000-0000-0000-000000000001', // Attemping to assign to admin!
        },
      ],
      idempotencyKey: crypto.randomUUID(),
    },
  );
  assert(salesExecRes.statusCode === 201, 'Sales agent import executes with 201');
  const salesLead = await prisma.lead.findFirst({ where: { mobile: salesPhone } });
  const salesUser = await prisma.user.findFirst({ where: { email: 'sales@gapji.dev' } });
  assert(salesLead?.assignedToId === salesUser?.id, 'Sales agent imported lead is strictly forced to sales agent assignedToId (cannot assign to others)');

  // Clean up created test leads and costs to preserve database cleanliness
  console.log('\n--- Cleanup Test Records ---');
  await prisma.leadActivity.deleteMany({
    where: { lead: { mobile: { in: [uniquePhone1, uniquePhone2, salesPhone] } } },
  });
  await prisma.lead.deleteMany({
    where: { mobile: { in: [uniquePhone1, uniquePhone2, salesPhone] } },
  });
  await prisma.cost.deleteMany({
    where: { importJobId: costImportKey },
  });
  await prisma.importJob.deleteMany({
    where: { id: { in: [leadImportKey, costImportKey] } },
  });
  // Resync campaign spend
  if (campaign) {
    const sumResult = await prisma.cost.aggregate({
      where: { campaignId: campaign.id, organizationId: campaign.organizationId },
      _sum: { amount: true },
    });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { spend: sumResult._sum.amount || 0 },
    });
  }
  console.log('Test records safely cleaned up');

  console.log('\n================================================================');
  console.log(`IMPORTS INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Fatal error in test runner:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
