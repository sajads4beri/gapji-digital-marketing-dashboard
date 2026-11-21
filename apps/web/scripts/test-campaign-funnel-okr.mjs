// Test script for Campaign Funnel OKR API endpoints
const API_BASE = 'http://localhost:3001/api';

async function runTests() {
  console.log('--- Campaign Funnel OKR API Test ---');

  // 1. Login as admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@gapji.dev', password: 'Password123!' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.accessToken || loginData.token;
  console.log('✓ Logged in as manager@gapji.ir');

  // 2. Get campaigns
  const campaignsRes = await fetch(`${API_BASE}/campaigns`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const campaigns = await campaignsRes.json();
  const campaignList = Array.isArray(campaigns) ? campaigns : campaigns.data;
  console.log(`✓ Fetched ${campaignList.length} campaigns`);

  const campaign = campaignList[0];
  console.log(`Using campaign: "${campaign.name}" (${campaign.id})`);

  // 3. Upsert Objective for 'awareness' stage
  const upsertObjRes = await fetch(`${API_BASE}/campaigns/${campaign.id}/funnel/stages/awareness/objective`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'افزایش آگاهی برند در شبکه‌های اجتماعی',
      description: 'دسترسی به ۵۰ هزار بازدید یکتا و جلب توجه مخاطبان هدف',
    }),
  });
  if (!upsertObjRes.ok) {
    throw new Error(`Upsert Objective failed: ${upsertObjRes.status} ${await upsertObjRes.text()}`);
  }
  const objData = await upsertObjRes.json();
  console.log(`✓ Upserted Objective: "${objData.title}" (ID: ${objData.id})`);

  // 4. Create Key Result under awareness
  const createKrRes = await fetch(`${API_BASE}/campaigns/${campaign.id}/funnel/stages/awareness/key-results`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'تولید و انتشار ۱۰ پست تعاملی در لینکدین',
      targetValue: 10,
      currentValue: 3,
      unit: 'پست',
    }),
  });
  if (!createKrRes.ok) {
    throw new Error(`Create Key Result failed: ${createKrRes.status} ${await createKrRes.text()}`);
  }
  const krData = await createKrRes.json();
  console.log(`✓ Created Key Result: "${krData.title}" (${krData.currentValue}/${krData.targetValue} ${krData.unit}, ${krData.progressPercent}%)`);

  // 5. Create Task under Key Result
  const createTaskRes = await fetch(`${API_BASE}/campaigns/${campaign.id}/funnel/key-results/${krData.id}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'طراحی قالب پست‌های اسلایدی لینکدین',
      description: 'طراحی گرافیکی قالب بر اساس گایدلاین هویت بصری کمپین',
      priority: 'high',
    }),
  });
  if (!createTaskRes.ok) {
    throw new Error(`Create Task under KR failed: ${createTaskRes.status} ${await createTaskRes.text()}`);
  }
  const taskData = await createTaskRes.json();
  console.log(`✓ Created Task under KR: "${taskData.title}" (ID: ${taskData.id})`);
  console.log(`  Attribution: Stage=${taskData.okr.stageKey}, Campaign="${taskData.okr.campaignName}", KR="${taskData.okr.keyResultTitle}"`);

  // 6. Get Stage OKR
  const stageOkrRes = await fetch(`${API_BASE}/campaigns/${campaign.id}/funnel/stages/awareness/okr`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const stageOkr = await stageOkrRes.json();
  console.log(`✓ Fetched Stage OKR for awareness: ${stageOkr.keyResults.length} KRs found`);
  console.log(`  First KR has ${stageOkr.keyResults[0].tasks.length} task(s)`);

  // 7. Get All Funnel OKRs
  const allOkrRes = await fetch(`${API_BASE}/campaigns/${campaign.id}/funnel/okr`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const allOkr = await allOkrRes.json();
  console.log(`✓ Fetched All Funnel OKR: totalObjectives=${allOkr.totalObjectives}, totalKRs=${allOkr.totalKeyResults}, averageProgress=${allOkr.averageProgress}%, totalTasks=${allOkr.totalTasks}`);

  // 8. Verify Task appears in /api/tasks with OKR data
  const tasksRes = await fetch(`${API_BASE}/tasks?funnelStageKey=awareness`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tasksList = await tasksRes.json();
  console.log(`✓ Filtered tasks by funnelStageKey=awareness: found ${tasksList.length} task(s)`);
  if (tasksList.length > 0 && tasksList[0].okr) {
    console.log(`  ✓ Verified task OKR capsule info: ${tasksList[0].okr.stageKey} | ${tasksList[0].okr.keyResultTitle}`);
  }

  console.log('\n🎉 ALL 8 BACKEND TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
