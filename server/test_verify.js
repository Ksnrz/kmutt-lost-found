// Integration tests for the verify (claim) flow. Starts the real server on TEST_PORT,
// creates throwaway users/posts in the dev database and deletes them afterwards.
// Run: npm run test:verify
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { pool } from './src/db.js';

const PORT = process.env.TEST_PORT || 3998;
const BASE = `http://127.0.0.1:${PORT}`;
const tag = Date.now().toString().slice(-8);
const userIds = [];
const tok = {};
let server;
let locationId;

async function call(path, { token, method = 'GET', body, form } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}/api${path}`, { method, headers, body: form ?? (body && JSON.stringify(body)) });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function makePost({ custody_type = 'SELF_KEPT' } = {}) {
  const f = new FormData();
  const fields = { post_type: 'FOUND', custody_type, title: 'test wallet', location_id: locationId, event_date: '2026-11-14', description: 'd', contact_text: '0812345678' };
  if (custody_type === 'DEPOSITED') fields.deposit_location_id = locationId;
  Object.entries(fields).forEach(([k, v]) => f.append(k, v));
  const { status, json } = await call('/posts', { token: tok.owner, method: 'POST', form: f });
  assert.equal(status, 201);
  return json.post.post_id;
}

async function makeClaim(postId, who = 'claimant') {
  const { status, json } = await call(`/posts/${postId}/verify`, { token: tok[who], method: 'POST', body: { proof_description: 'SECRET: scratch inside' } });
  assert.equal(status, 201);
  return json.data.verify_id;
}

const claimStatus = async (verifyId) =>
  (await pool.query('SELECT verify_status FROM verify_items WHERE verify_id = $1', [verifyId])).rows[0].verify_status;

before(async () => {
  server = spawn(process.execPath, ['--env-file=.env', 'src/index.js'], { env: { ...process.env, PORT }, stdio: 'inherit' });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  for (const [i, who] of ['owner', 'claimant', 'other', 'stranger'].entries()) {
    const sid = `7${tag}${i}`;
    const reg = await call('/auth/register', { method: 'POST', body: { student_id: sid, email: `t${tag}${i}@test.local`, password: 'Test1234!' } });
    userIds.push(reg.json.user_id);
    tok[who] = (await call('/auth/login', { method: 'POST', body: { identifier: sid, password: 'Test1234!' } })).json.token;
  }
  locationId = (await call('/locations')).json.locations[0].location_id;
});

after(async () => {
  const { rows } = await pool.query(
    `SELECT item_image_url AS url FROM item_images i JOIN posts p USING (post_id) WHERE p.user_id = ANY($1)
     UNION SELECT verify_image_url FROM verify_images vi JOIN verify_items v USING (verify_id) WHERE v.user_id = ANY($1)`,
    [userIds]
  );
  rows.forEach(({ url }) => fs.rmSync(`.${url}`, { force: true }));
  await pool.query('DELETE FROM users WHERE user_id = ANY($1)', [userIds]);
  await pool.end();
  server.kill();
});

test('claim decisions and handover events notify only the claimant without duplicate retries', async () => {
  const accepted = await makeClaim(await makePost());
  const rejected = await makeClaim(await makePost());
  const cancelled = await makeClaim(await makePost());
  const putStatus = (id, status) =>
    call(`/verify/${id}/status`, { token: tok.owner, method: 'PUT', body: { status } });
  const list = async (token = tok.claimant) => {
    const result = await call('/claim-notifications', { token });
    assert.equal(result.status, 200);
    return result.json.notifications;
  };
  const markRead = (id, token = tok.claimant) =>
    call(`/claim-notifications/${id}/read`, { token, method: 'PATCH' });
  const unread = async () => (await list()).filter((item) => !item.read_at).length;

  assert.equal((await call('/claim-notifications')).status, 401);
  assert.equal((await putStatus(accepted, 'ACCEPTED')).status, 200);
  assert.equal((await putStatus(accepted, 'ACCEPTED')).status, 400);
  assert.equal((await putStatus(accepted, 'PENDING')).status, 200);
  assert.equal((await putStatus(accepted, 'PENDING')).status, 400);
  assert.equal((await putStatus(accepted, 'ACCEPTED')).status, 200);
  assert.equal((await putStatus(rejected, 'REJECTED')).status, 200);
  const notifications = await list();
  assert.deepEqual(notifications.map(({ verify_id, outcome, item_title }) => [verify_id, outcome, item_title]), [
    [rejected, 'REJECTED', 'test wallet'],
    [accepted, 'ACCEPTED', 'test wallet'],
    [accepted, 'HANDOVER_CANCELLED', 'test wallet'],
    [accepted, 'ACCEPTED', 'test wallet'],
  ]);
  assert.equal(await unread(), 4);
  assert.deepEqual(await list(tok.owner), []);
  assert.equal((await markRead(notifications[0].notification_id, tok.owner)).status, 404);
  const firstRead = await markRead(notifications[0].notification_id);
  assert.equal(firstRead.status, 200);
  assert.ok(firstRead.json.read_at);
  assert.equal(await unread(), 3);
  assert.equal((await markRead(notifications[0].notification_id)).json.read_at, firstRead.json.read_at);
  assert.equal((await list())[0].read_at, firstRead.json.read_at);
  const markClaimRead = (token) =>
    call(`/verify/${accepted}/notifications/read`, { token, method: 'PATCH' });
  assert.deepEqual((await markClaimRead(tok.owner)).json.notifications, []);
  assert.equal(await unread(), 3);
  const secondRead = await markClaimRead(tok.claimant);
  assert.equal(secondRead.status, 200);
  assert.deepEqual(
    new Set(secondRead.json.notifications.map(({ notification_id }) => notification_id)),
    new Set(notifications.slice(1).map(({ notification_id }) => notification_id))
  );
  assert.ok(secondRead.json.notifications.every(({ read_at }) => read_at));
  assert.deepEqual((await markClaimRead(tok.claimant)).json.notifications, []);
  assert.equal(await unread(), 0);

  assert.equal((await call(`/verify/${cancelled}/cancel`, { token: tok.claimant, method: 'PATCH', body: {} })).status, 200);
  const confirmFinder = () =>
    call(`/verify/${accepted}/confirm`, { token: tok.owner, method: 'PUT', body: { party: 'finder' } });
  const finderResult = await confirmFinder();
  assert.equal(finderResult.status, 200);
  assert.equal(finderResult.json.postClosed, false);
  assert.equal(await claimStatus(accepted), 'ACCEPTED');
  assert.equal((await confirmFinder()).status, 200);
  assert.equal(await unread(), 1);
  const [handover] = await list();
  assert.equal(handover.outcome, 'HANDOVER_CONFIRMED');
  assert.deepEqual(await list(tok.owner), []);
  assert.equal((await call(`/verify/${accepted}/confirm`, { token: tok.claimant, method: 'PUT', body: { party: 'receiver' } })).status, 200);
  assert.equal(await claimStatus(cancelled), 'CANCELLED');
  assert.equal(await claimStatus(accepted), 'COMPLETED');
  assert.equal((await list()).length, 5);
  assert.equal(await unread(), 1);
  assert.equal((await markRead(handover.notification_id)).status, 200);
  assert.equal(await unread(), 0);
});

test('requests without a token are rejected', async () => {
  const postId = await makePost();
  assert.equal((await call(`/posts/${postId}/verify`, { method: 'POST', body: { proof_description: 'x' } })).status, 401);
});

test('owner cannot claim own post; DEPOSITED posts cannot be claimed', async () => {
  const own = await makePost();
  assert.equal((await call(`/posts/${own}/verify`, { token: tok.owner, method: 'POST', body: { proof_description: 'x' } })).status, 403);
  const deposited = await makePost({ custody_type: 'DEPOSITED' });
  assert.equal((await call(`/posts/${deposited}/verify`, { token: tok.claimant, method: 'POST', body: { proof_description: 'x' } })).status, 400);
});

test('only the post owner can read its claims', async () => {
  const postId = await makePost();
  await makeClaim(postId);
  assert.equal((await call(`/posts/${postId}/verify`, { token: tok.stranger })).status, 403);
  const { status, json } = await call(`/posts/${postId}/verify`, { token: tok.owner });
  assert.equal(status, 200);
  assert.equal(json.requests.length, 1);
});

test('C1: unguarded /api/claims routes are gone', async () => {
  const postId = await makePost();
  const verifyId = await makeClaim(postId);
  assert.equal((await call(`/claims/post/${postId}`, { token: tok.stranger })).status, 404);
  assert.equal((await call(`/claims/${verifyId}/status`, { token: tok.claimant, method: 'PUT', body: { status: 'ACCEPTED' } })).status, 404);
  assert.equal(await claimStatus(verifyId), 'PENDING');
});

test('C2: uploads get an image extension and are served with nosniff', async () => {
  const f = new FormData();
  const fields = { post_type: 'LOST', title: 't', location_id: locationId, event_date: '2026-11-14', description: 'd', contact_text: '0812345678' };
  Object.entries(fields).forEach(([k, v]) => f.append(k, v));
  f.append('images', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.html');
  const { status, json } = await call('/posts', { token: tok.owner, method: 'POST', form: f });
  assert.equal(status, 201);
  const url = json.images[0].item_image_url;
  assert.match(url, /\.png$/);
  const res = await fetch(`${BASE}${url}`);
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('C2: non-image upload is a 400, not a 500', async () => {
  const f = new FormData();
  f.append('images', new Blob(['x'], { type: 'text/plain' }), 'a.txt');
  assert.equal((await call('/posts', { token: tok.owner, method: 'POST', form: f })).status, 400);
});

test('C3: owner cannot accept a claim the requester cancelled', async () => {
  const postId = await makePost();
  const verifyId = await makeClaim(postId);
  assert.equal((await call(`/verify/${verifyId}/cancel`, { token: tok.claimant, method: 'PATCH', body: {} })).status, 200);
  assert.equal((await call(`/verify/${verifyId}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } })).status, 400);
  assert.equal(await claimStatus(verifyId), 'CANCELLED');
});

test('C3: rejected claim cannot be reopened; accepted claim can be returned to PENDING', async () => {
  const postId = await makePost();
  const rejected = await makeClaim(postId);
  const accepted = await makeClaim(postId, 'other');
  assert.equal((await call(`/verify/${rejected}/status`, { token: tok.owner, method: 'PUT', body: { status: 'REJECTED' } })).status, 200);
  assert.equal((await call(`/verify/${rejected}/status`, { token: tok.owner, method: 'PUT', body: { status: 'PENDING' } })).status, 400);
  assert.equal((await call(`/verify/${accepted}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } })).status, 200);
  assert.equal((await call(`/verify/${accepted}/confirm`, { token: tok.owner, method: 'PUT', body: { party: 'finder' } })).status, 200);
  assert.equal((await call(`/verify/${accepted}/status`, { token: tok.owner, method: 'PUT', body: { status: 'PENDING' } })).status, 200);
  const { rows } = await pool.query('SELECT verify_status, finder_confirmed FROM verify_items WHERE verify_id = $1', [accepted]);
  assert.deepEqual(rows[0], { verify_status: 'PENDING', finder_confirmed: false });
});

test('C4: cancelling a post cancels its open claims', async () => {
  const postId = await makePost();
  const verifyId = await makeClaim(postId);
  assert.equal((await call(`/posts/${postId}/cancel`, { token: tok.owner, method: 'PATCH' })).status, 200);
  assert.equal(await claimStatus(verifyId), 'CANCELLED');
});

test('accept: one claim per post, others stay PENDING so the owner can switch', async () => {
  const postId = await makePost();
  const first = await makeClaim(postId);
  const second = await makeClaim(postId, 'other');
  const accept = (id) => call(`/verify/${id}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } });
  assert.equal((await accept(first)).status, 200);
  assert.equal(await claimStatus(second), 'PENDING');
  assert.equal((await accept(second)).status, 400);
  // hand-over fell through: owner withdraws the acceptance and picks the other claim
  assert.equal((await call(`/verify/${first}/status`, { token: tok.owner, method: 'PUT', body: { status: 'PENDING' } })).status, 200);
  assert.equal((await accept(second)).status, 200);
});

test('hand-over completing cancels the claims that were left pending', async () => {
  const postId = await makePost();
  const winner = await makeClaim(postId);
  const loser = await makeClaim(postId, 'other');
  await call(`/verify/${winner}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } });
  await call(`/verify/${winner}/confirm`, { token: tok.owner, method: 'PUT', body: { party: 'finder' } });
  await call(`/verify/${winner}/confirm`, { token: tok.claimant, method: 'PUT', body: { party: 'receiver' } });
  assert.equal(await claimStatus(loser), 'CANCELLED');
});

test('full handover: both parties confirm and the post closes', async () => {
  const postId = await makePost();
  const verifyId = await makeClaim(postId);
  await call(`/verify/${verifyId}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } });
  assert.equal((await call(`/verify/${verifyId}/confirm`, { token: tok.claimant, method: 'PUT', body: { party: 'finder' } })).status, 403);
  await call(`/verify/${verifyId}/confirm`, { token: tok.owner, method: 'PUT', body: { party: 'finder' } });
  const done = await call(`/verify/${verifyId}/confirm`, { token: tok.claimant, method: 'PUT', body: { party: 'receiver' } });
  assert.equal(done.json.postClosed, true);
  assert.equal((await call(`/posts/${postId}`)).json.post.post_status, 'CLOSED');
});

test('rejected claims keep their status and reason after the hand-over completes', async () => {
  const postId = await makePost();
  const winner = await makeClaim(postId);
  const rejected = await makeClaim(postId, 'other');
  await call(`/verify/${rejected}/status`, { token: tok.owner, method: 'PUT', body: { status: 'REJECTED', note: 'scratch does not match' } });
  await call(`/verify/${winner}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } });
  await call(`/verify/${winner}/confirm`, { token: tok.owner, method: 'PUT', body: { party: 'finder' } });
  await call(`/verify/${winner}/confirm`, { token: tok.claimant, method: 'PUT', body: { party: 'receiver' } });
  const { rows } = await pool.query('SELECT verify_status, note FROM verify_items WHERE verify_id = $1', [rejected]);
  assert.deepEqual(rows[0], { verify_status: 'REJECTED', note: 'scratch does not match' });
});

test('requester cannot cancel a claim that is already accepted', async () => {
  const postId = await makePost();
  const verifyId = await makeClaim(postId);
  await call(`/verify/${verifyId}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } });
  assert.equal((await call(`/verify/${verifyId}/cancel`, { token: tok.claimant, method: 'PATCH', body: {} })).status, 400);
  assert.equal(await claimStatus(verifyId), 'ACCEPTED');
});

test('event_date round-trips unchanged (no timezone shift)', async () => {
  const postId = await makePost();
  assert.equal((await call(`/posts/${postId}`)).json.post.event_date, '2026-11-14');
});

test('DEPOSITED posts need a deposit building; other posts drop deposit fields', async () => {
  const create = (fields) => {
    const f = new FormData();
    Object.entries({ post_type: 'FOUND', title: 't', location_id: locationId, event_date: '2026-11-14', description: 'd', contact_text: '0812345678', ...fields })
      .forEach(([k, v]) => f.append(k, v));
    return call('/posts', { token: tok.owner, method: 'POST', form: f });
  };
  assert.equal((await create({ custody_type: 'DEPOSITED' })).status, 400);

  const ok = await create({ custody_type: 'DEPOSITED', deposit_location_id: locationId, deposit_detail: ' แม่บ้านชั้น 1 ' });
  assert.equal(ok.status, 201);
  const { post } = (await call(`/posts/${ok.json.post.post_id}`)).json;
  assert.equal(post.deposit_detail, 'แม่บ้านชั้น 1');
  assert.ok(post.deposit_building_name);

  const kept = await create({ custody_type: 'SELF_KEPT', deposit_location_id: locationId, deposit_detail: 'x' });
  assert.equal(kept.status, 201);
  assert.equal(kept.json.post.deposit_location_id, null);
  assert.equal(kept.json.post.deposit_detail, null);
});

test('GET /me/posts returns only my own posts with their pending claim count', async () => {
  const postId = await makePost();
  await makeClaim(postId);
  const mine = (await call('/me/posts', { token: tok.owner })).json.posts;
  const row = mine.find((p) => p.post_id === postId);
  assert.equal(row.pending_count, 1);
  assert.ok(row.latest_claimant);
  const theirs = (await call('/me/posts', { token: tok.stranger })).json.posts;
  assert.equal(theirs.some((p) => p.post_id === postId), false);
  assert.equal((await call('/me/posts')).status, 401);
});

test('claim body cannot inject arbitrary evidence URLs', async () => {
  const postId = await makePost();
  const { json } = await call(`/posts/${postId}/verify`, {
    token: tok.claimant, method: 'POST', body: { proof_description: 'x', images: ['javascript:alert(1)'] },
  });
  const { rows } = await pool.query('SELECT 1 FROM verify_images WHERE verify_id = $1', [json.data.verify_id]);
  assert.equal(rows.length, 0);
});

test('the poster sees the claimant contact only after accepting the claim', async () => {
  const postId = await makePost();
  const verifyId = await makeClaim(postId);
  await call('/me', { token: tok.claimant, method: 'PATCH', body: { phone_number: '0812345678', contact_info: ' IG: @claimant ' } });
  const contact = async () => {
    const { requesterPhone, requesterContact } = (await call(`/posts/${postId}/verify`, { token: tok.owner })).json.requests[0];
    return { requesterPhone, requesterContact };
  };
  assert.deepEqual(await contact(), { requesterPhone: null, requesterContact: null });
  await call(`/verify/${verifyId}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } });
  const shown = await contact();
  assert.equal(shown.requesterPhone, '0812345678');
  assert.equal(shown.requesterContact, 'IG: @claimant');
});

test('the profile phone is required and cannot be cleared', async () => {
  assert.equal((await call('/me', { token: tok.claimant, method: 'PATCH', body: { phone_number: '' } })).status, 400);
  assert.equal((await call('/me', { token: tok.claimant, method: 'PATCH', body: { phone_number: '0812345678' } })).status, 200);
});
