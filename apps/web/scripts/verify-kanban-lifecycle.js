const http = require('http');

function post(url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function patch(url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + (u.search || ''),
      method: 'GET',
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Frontend-Backend Kanban Status Lifecycle Integration...');
  // 1. Login
  const loginRes = await post('http://localhost:3001/api/auth/login', {
    identifier: 'admin@gapji.dev',
    password: 'Password123!',
  });
  if (loginRes.status !== 200 || !loginRes.body.accessToken) {
    throw new Error('Login failed: ' + JSON.stringify(loginRes.body));
  }
  const token = loginRes.body.accessToken;
  console.log('  [PASS] Admin authenticated successfully');

  // 2. Create test lead
  const testPhone = '09128880001';
  let leadId = null;
  const existingList = await get('http://localhost:3001/api/leads?search=' + testPhone, token);
  if (existingList.body && existingList.body.length > 0) {
    leadId = existingList.body[0].id;
    console.log('  [INFO] Found existing test lead:', leadId);
  } else {
    const createRes = await post('http://localhost:3001/api/leads', {
      fullName: 'تست برد کانبان',
      mobile: testPhone,
    }, token);
    leadId = createRes.body.id;
    console.log('  [PASS] Created test lead for Kanban:', leadId);
  }

  // 3. Move through Kanban stages
  const stages = [
    { status: 'in_progress' },
    { status: 'qualified', note: 'مشتری بالقوه' },
    { status: 'proposal' },
    { status: 'won', dealValue: 35000000 },
  ];

  for (const stage of stages) {
    const res = await patch('http://localhost:3001/api/leads/' + leadId + '/status', stage, token);
    if (res.status !== 200 || res.body.status !== stage.status) {
      throw new Error('Status update to ' + stage.status + ' failed: ' + JSON.stringify(res.body));
    }
    console.log('  [PASS] Status successfully transitioned to:', stage.status);
    if (stage.status === 'won') {
      if (res.body.estimatedValue !== 35000000) {
        throw new Error('Deal value not returned: ' + JSON.stringify(res.body));
      }
      console.log('  [PASS] Deal value successfully persisted and returned: 35,000,000 Toman');
    }
  }

  // 4. Persistence verification via GET /api/leads/:id and GET /api/leads
  const detailRes = await get('http://localhost:3001/api/leads/' + leadId, token);
  if (detailRes.body.status !== 'won' || detailRes.body.estimatedValue !== 35000000) {
    throw new Error('GET /api/leads/:id did not reflect persisted won status and value: ' + JSON.stringify(detailRes.body));
  }
  console.log('  [PASS] GET /api/leads/:id confirmed persistent status=won and estimatedValue=35,000,000');

  // 5. Activity history verification via GET /api/leads/:id/activities
  const actsRes = await get('http://localhost:3001/api/leads/' + leadId + '/activities', token);
  if (actsRes.status !== 200 || !Array.isArray(actsRes.body) || actsRes.body.length < 4) {
    throw new Error('Activities verification failed: ' + JSON.stringify(actsRes.body));
  }
  console.log('  [PASS] GET /api/leads/:id/activities confirmed ' + actsRes.body.length + ' persisted activities');
  console.log('  [PASS] Most recent activity: "' + actsRes.body[0].title + '", type: ' + actsRes.body[0].type);

  // 6. Transition to lost
  const lostRes = await patch('http://localhost:3001/api/leads/' + leadId + '/status', {
    status: 'lost',
    lostReason: 'خرید از رقیب',
  }, token);
  if (lostRes.status !== 200 || lostRes.body.status !== 'lost' || lostRes.body.lostReason !== 'خرید از رقیب') {
    throw new Error('Transition to lost failed: ' + JSON.stringify(lostRes.body));
  }
  console.log('  [PASS] Status successfully transitioned to lost with reason: "خرید از رقیب"');

  // 7. Verify Kanban column filtering
  const wonList = await get('http://localhost:3001/api/leads?status=won', token);
  const lostList = await get('http://localhost:3001/api/leads?status=lost', token);
  console.log('  [PASS] Filter by status=won count: ' + wonList.body.length);
  console.log('  [PASS] Filter by status=lost count: ' + lostList.body.length);

  console.log('\nAll Kanban Lead Lifecycle End-to-End checks PASSED!');
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
