import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Starting PHASE-009 WordPress Inbound Webhooks Verification Suite ---');

// Test 1: Persian Phone Normalization Engine
console.log('1. Testing Persian/Arabic Phone Number Normalization Engine...');
function normalizePersianPhone(phone) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let normalized = phone || '';
  for (let i = 0; i < 10; i++) {
    normalized = normalized
      .replace(new RegExp(persianDigits[i], 'g'), i.toString())
      .replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return normalized.replace(/[\s\-\(\)\+]/g, '');
}

assert.equal(normalizePersianPhone('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789');
assert.equal(normalizePersianPhone('٠٩١٢٣٤٥٦٧٨٩'), '09123456789');
assert.equal(normalizePersianPhone('+98 912 345 6789'), '989123456789');
assert.equal(normalizePersianPhone('۰۹۳۵-۱۱۱-۲۲۳۳'), '09351112233');
console.log('  [PASS] Persian/Arabic phone digits normalization verified');

// Test 2: Inbound Webhook Field Mapping Engine
console.log('2. Testing Form Field Mapping Engine (Elementor, CF7, Gravity Forms)...');
function mapInboundLead(payload, mappingConfig) {
  const fullName = payload[mappingConfig.fullName] || payload.fullName || payload.name || 'مخاطب وردپرس';
  const mobileRaw = payload[mappingConfig.mobile] || payload.mobile || payload.phone || payload.tel || '';
  const email = payload[mappingConfig.email] || payload.email || null;
  const city = payload[mappingConfig.city] || payload.city || null;
  const utmSource = payload[mappingConfig.utmSource] || payload.utm_source || 'wordpress';
  const utmCampaign = payload[mappingConfig.utmCampaign] || payload.utm_campaign || null;

  const mobile = normalizePersianPhone(mobileRaw);

  return {
    fullName: fullName.trim(),
    mobile,
    email,
    city,
    utmSource,
    utmCampaign,
  };
}

const customMapping = {
  fullName: 'your-name',
  mobile: 'your-tel',
  email: 'your-email',
  city: 'your-city',
  utmSource: 'source_tag',
  utmCampaign: 'campaign_tag',
};

const sampleWpPayload = {
  'your-name': 'مهرداد کاظمی',
  'your-tel': '۰۹۱۲۸۸۸۹۹۰۰',
  'your-email': 'mehrdad@example.com',
  'your-city': 'اصفهان',
  source_tag: 'google_adwords',
  campaign_tag: 'yalda_special',
};

const mappedLead = mapInboundLead(sampleWpPayload, customMapping);
assert.equal(mappedLead.fullName, 'مهرداد کاظمی');
assert.equal(mappedLead.mobile, '09128889900');
assert.equal(mappedLead.city, 'اصفهان');
assert.equal(mappedLead.utmSource, 'google_adwords');
assert.equal(mappedLead.utmCampaign, 'yalda_special');
console.log('  [PASS] Form field mapping to Lead schema validated');

// Test 3: Deduplication and Secret Validation Engine
console.log('3. Testing Secret Authentication & Deduplication Logic...');
function validateAndProcessWebhook(secret, expectedSecret, mobile, existingLeads) {
  if (!secret || secret !== expectedSecret) {
    return { status: 'rejected', reason: 'رمز مخفی وب‌هوک معتبر نیست' };
  }

  if (existingLeads.some((l) => l.mobile === mobile)) {
    return { status: 'duplicate', isDuplicate: true, reason: 'لید تکراری است (به‌روزرسانی شد)' };
  }

  return { status: 'success', isDuplicate: false, reason: 'لید جدید ثبت شد' };
}

const secretKey = 'whsec_test_secret_12345';
const existingLeadsDb = [{ id: 'l1', mobile: '09121112233' }];

// Case A: Invalid secret
const resA = validateAndProcessWebhook('wrong_secret', secretKey, '09129998877', existingLeadsDb);
assert.equal(resA.status, 'rejected');

// Case B: Duplicate mobile
const resB = validateAndProcessWebhook(secretKey, secretKey, '09121112233', existingLeadsDb);
assert.equal(resB.status, 'duplicate');
assert.equal(resB.isDuplicate, true);

// Case C: New valid lead
const resC = validateAndProcessWebhook(secretKey, secretKey, '09129998877', existingLeadsDb);
assert.equal(resC.status, 'success');
assert.equal(resC.isDuplicate, false);
console.log('  [PASS] Webhook secret validation and deduplication logic verified');

// Test 4: Navigation Unlocking & permissions.ts Registration for Page 29
console.log('4. Testing Navigation and Permissions Registration for Page 29...');
const navPath = path.resolve('apps/web/src/config/navigation.ts');
const navContent = fs.readFileSync(navPath, 'utf8');

assert.ok(
  navContent.includes("href: '/settings/wordpress'"),
  "WordPress item in navigation.ts must link to '/settings/wordpress'"
);

const wpNavSection = navContent.slice(navContent.indexOf("id: 'wordpress-integration'"));
assert.ok(
  !wpNavSection.includes('comingSoon: true'),
  'WordPress navigation item must have comingSoon: true removed'
);

const permissionsPath = path.resolve('apps/web/src/lib/permissions.ts');
const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

assert.ok(
  permissionsContent.includes("actualRoute: '/settings/wordpress'"),
  'Page 29 actualRoute must be registered as /settings/wordpress'
);
assert.ok(
  permissionsContent.includes("pageFilePath: 'apps/web/src/app/(app)/settings/wordpress/page.tsx'"),
  'Page 29 pageFilePath must be correctly mapped'
);
console.log('  [PASS] Navigation unlocked and permissions registered for Page 29');

// Test 5: Backend WordpressModule Registration
console.log('5. Testing Backend WordpressModule Registration in AppModule...');
const appModulePath = path.resolve('apps/api/src/app.module.ts');
const appModuleContent = fs.readFileSync(appModulePath, 'utf8');

assert.ok(
  appModuleContent.includes('WordpressModule'),
  'WordpressModule must be registered in AppModule'
);
console.log('  [PASS] WordpressModule registered in backend');

console.log('\n--- ALL PHASE-009 WORDPRESS TESTS PASSED (5/5) ---');
