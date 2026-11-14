// Integration tests for the verify (claim) flow. Starts the real server on TEST_PORT,
// creates throwaway users/posts in the dev database and deletes them afterwards.
// Run: npm run test:verify
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { pool } from './src/db.js';

const PORT = process.env.TEST_PORT || 3998;
const BASE = `http://localhost:${PORT}`;
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
  server = spawn(process.execPath, ['src/index.js'], { env: { ...process.env, PORT }, stdio: 'ignore' });
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

test('C4: accepting one claim cancels the other pending claims', async () => {
  const postId = await makePost();
  const chosen = await makeClaim(postId);
  const other = await makeClaim(postId, 'other');
  assert.equal((await call(`/verify/${chosen}/status`, { token: tok.owner, method: 'PUT', body: { status: 'ACCEPTED' } })).status, 200);
  assert.equal(await claimStatus(other), 'CANCELLED');
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
