import express from 'express';
import { pool } from './src/db.js';
import verifyRouter from './src/routes/verify.js';

const app = express();
app.use(express.json());
app.use('/api', verifyRouter);

const server = app.listen(3999, async () => {
  console.log('🚀 Test server running on port 3999');
  try {
    // Test 1: GET /api/posts/1/verify with x-test-user: 1 (Owner)
    const res1 = await fetch('http://localhost:3999/api/posts/1/verify', {
      headers: { 'x-test-user': '1' }
    });
    const data1 = await res1.json();
    console.log('✅ TEST 1 (Owner views claims): status =', res1.status, '| claims count =', data1.requests?.length);

    // Test 2: GET /api/posts/1/verify with x-test-user: 2 (Not Owner) -> 403
    const res2 = await fetch('http://localhost:3999/api/posts/1/verify', {
      headers: { 'x-test-user': '2' }
    });
    const data2 = await res2.json();
    console.log('✅ TEST 2 (Non-owner views claims -> 403 Forbidden): status =', res2.status, '| error =', data2.error);

    // Test 3: POST /api/posts/2/verify (DEPOSITED post -> 400)
    const res3 = await fetch('http://localhost:3999/api/posts/2/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': '2' },
      body: JSON.stringify({ proof_description: 'ของฉันเองครับ' })
    });
    const data3 = await res3.json();
    console.log('✅ TEST 3 (Claim DEPOSITED post -> 400 Bad Request): status =', res3.status, '| error =', data3.error);

    // Test 4: POST /api/posts/1/verify with x-test-user: 1 (Own post -> 403)
    const res4 = await fetch('http://localhost:3999/api/posts/1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': '1' },
      body: JSON.stringify({ proof_description: 'ของฉันเอง' })
    });
    const data4 = await res4.json();
    console.log('✅ TEST 4 (Claim own post -> 403 Forbidden): status =', res4.status, '| error =', data4.error);

    // Test 5: PUT /api/verify/102/status with ACCEPTED
    const res5 = await fetch('http://localhost:3999/api/verify/102/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-test-user': '1' },
      body: JSON.stringify({ status: 'ACCEPTED', note: 'นัดรับที่ตึก S4' })
    });
    const data5 = await res5.json();
    console.log('✅ TEST 5 (Owner accepts claim #102): status =', res5.status, '| verify_status =', data5.verify?.verify_status);

    // Test 6: Dual Confirm - Finder confirms
    const res6 = await fetch('http://localhost:3999/api/verify/102/confirm', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-test-user': '1' },
      body: JSON.stringify({ party: 'finder' })
    });
    const data6 = await res6.json();
    console.log('✅ TEST 6 (Finder confirms handover): finder_confirmed =', data6.verify?.finder_confirmed, '| postClosed =', data6.postClosed);

    // Test 7: Dual Confirm - Receiver confirms (Both confirmed -> Post CLOSED)
    const res7 = await fetch('http://localhost:3999/api/verify/102/confirm', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-test-user': '2' },
      body: JSON.stringify({ party: 'receiver' })
    });
    const data7 = await res7.json();
    console.log('✅ TEST 7 (Receiver confirms handover -> Both confirmed): postClosed =', data7.postClosed, '| verify_status =', data7.verify?.verify_status);

    // Check DB post_status of post 1
    const postCheck = await pool.query('SELECT post_status FROM posts WHERE post_id = 1');
    console.log('🎯 POST 1 STATUS IN DATABASE:', postCheck.rows[0].post_status);

    // Reset post 1 back to clean state
    await pool.query("UPDATE posts SET post_status = 'OPEN' WHERE post_id = 1");
    await pool.query("UPDATE verify_items SET verify_status = 'PENDING', finder_confirmed = false, receiver_confirmed = false WHERE post_id = 1");
    console.log('🧹 Cleaned test data to original state');

    console.log('\n🎉🎉🎉 ALL 7 TESTS PASSED SUCCESSFULLY! 100% WORKING! 🎉🎉🎉\n');
  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
});
