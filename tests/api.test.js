'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Env must be set BEFORE the app is created so the admin account is seeded.
process.env.JWT_SECRET = 'test-secret-for-braingenius';
process.env.ADMIN_EMAIL = 'admin@braingenius.test';
process.env.ADMIN_PASSWORD = 'admin-test-password-123';

const { createApp } = require('../server/app');
const SEED = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'questions.seed.json'), 'utf8'));
const seedById = new Map(SEED.map((q) => [q.id, q]));

let server;
let base;
let tmpDir;

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'braingenius-test-'));
  const app = createApp({ dbPath: path.join(tmpDir, 'test.db') });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function req(pathname, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(base + pathname, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* not json */ }
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, json, cookie: setCookie ? setCookie.split(';')[0] : cookie };
}

// Build an answers object from a started test's displayed questions, using the
// seed bank's correct option TEXT to find the displayed index (black-box style).
function answersFor(questions, mode) {
  const answers = {};
  for (const q of questions) {
    const seed = seedById.get(q.id);
    assert.ok(seed, `seed question ${q.id} exists`);
    const correctText = seed.options[seed.correctIndex];
    if (mode === 'correct') {
      answers[q.id] = q.options.indexOf(correctText);
    } else if (mode === 'wrong') {
      answers[q.id] = q.options.findIndex((o) => o !== correctText);
    }
    assert.notEqual(answers[q.id], -1);
  }
  return answers;
}

let userCookie;

test('1) register, login, cookie auth; wrong password rejected', async () => {
  const bad = await req('/api/auth/register', {
    method: 'POST',
    body: { displayName: 'Shorty', email: 'shorty@test.dev', password: '123' }
  });
  assert.equal(bad.status, 400);

  const reg = await req('/api/auth/register', {
    method: 'POST',
    body: { displayName: 'Test User', email: 'user@test.dev', password: 'user-password-1' }
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.json.user.email, 'user@test.dev');
  assert.ok(reg.cookie && reg.cookie.startsWith('bg_token='));
  userCookie = reg.cookie;

  const me = await req('/api/me', { cookie: userCookie });
  assert.equal(me.json.user.displayName, 'Test User');

  const wrong = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'user@test.dev', password: 'not-the-password' }
  });
  assert.equal(wrong.status, 401);

  const login = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'user@test.dev', password: 'user-password-1' }
  });
  assert.equal(login.status, 200);
  assert.ok(login.cookie.startsWith('bg_token='));
});

test('2) guest test start: 24 questions, no answer data leaks', async () => {
  const start = await req('/api/test/start', { method: 'POST', body: { difficulty: 'mixed' } });
  assert.equal(start.status, 201);
  assert.equal(start.json.questions.length, 24);
  const raw = JSON.stringify(start.json);
  assert.ok(!raw.includes('correctIndex'), 'payload must not contain correctIndex');
  assert.ok(!raw.includes('explanation'), 'payload must not contain explanations');
  const perCat = {};
  for (const q of start.json.questions) perCat[q.category] = (perCat[q.category] || 0) + 1;
  assert.deepEqual(Object.values(perCat).sort(), [4, 4, 4, 4, 4, 4]);
});

test('12) guest can submit a full test without auth', async () => {
  const start = await req('/api/test/start', { method: 'POST', body: { difficulty: 'easy' } });
  const submit = await req('/api/test/submit', {
    method: 'POST',
    body: { testId: start.json.testId, answers: answersFor(start.json.questions, 'correct'), durationSec: 300 }
  });
  assert.equal(submit.status, 200);
  assert.equal(submit.json.resultId, null); // guests are not stored server-side
});

test('3) submitting all-correct answers scores 100% with per-category totals', async () => {
  const start = await req('/api/test/start', { method: 'POST', body: { difficulty: 'mixed' }, cookie: userCookie });
  const submit = await req('/api/test/submit', {
    method: 'POST',
    cookie: userCookie,
    body: { testId: start.json.testId, answers: answersFor(start.json.questions, 'correct'), durationSec: 240 }
  });
  assert.equal(submit.status, 200);
  assert.equal(submit.json.percentage, 100);
  assert.equal(submit.json.correct, 24);
  assert.equal(submit.json.attempted, 24);
  assert.ok(submit.json.resultId, 'logged-in result is saved');
  for (const v of Object.values(submit.json.perCategory)) {
    assert.deepEqual(v, { correct: 4, total: 4 });
  }
  assert.equal(submit.json.review.length, 24);
  assert.ok(submit.json.review.every((r) => r.isCorrect && r.explanation.length > 0));
});

test('4) submitting all-wrong answers scores 0%', async () => {
  const start = await req('/api/test/start', { method: 'POST', body: { difficulty: 'mixed' } });
  const submit = await req('/api/test/submit', {
    method: 'POST',
    body: { testId: start.json.testId, answers: answersFor(start.json.questions, 'wrong'), durationSec: 60 }
  });
  assert.equal(submit.status, 200);
  assert.equal(submit.json.percentage, 0);
  assert.equal(submit.json.correct, 0);
  assert.equal(submit.json.attempted, 24);
});

test('5) unanswered questions are handled (empty answers, no crash)', async () => {
  const start = await req('/api/test/start', { method: 'POST', body: { difficulty: 'hard' } });
  const submit = await req('/api/test/submit', {
    method: 'POST',
    body: { testId: start.json.testId, answers: {}, durationSec: 5 }
  });
  assert.equal(submit.status, 200);
  assert.equal(submit.json.attempted, 0);
  assert.equal(submit.json.correct, 0);
  assert.equal(submit.json.total, 24);
});

test('achievements unlock after a perfect logged-in test', async () => {
  const ach = await req('/api/me/achievements', { cookie: userCookie });
  assert.equal(ach.status, 200);
  const byKey = Object.fromEntries(ach.json.achievements.map((a) => [a.key, a.earned]));
  assert.equal(byKey['first-steps'], true);
  assert.equal(byKey['sharp-mind'], true);
  assert.equal(byKey['category-master'], true);
  assert.equal(byKey['getting-serious'], false);
});

test('6) practice answer returns correctness and explanation', async () => {
  const next = await req('/api/practice/next');
  assert.equal(next.status, 200);
  assert.ok(!JSON.stringify(next.json.question).includes('correctIndex'));
  const q = next.json.question;
  const seed = seedById.get(q.id);
  const correctDisplayed = q.options.indexOf(seed.options[seed.correctIndex]);
  const ans = await req('/api/practice/answer', {
    method: 'POST',
    body: { questionId: q.id, optionIndex: correctDisplayed, practiceToken: next.json.practiceToken }
  });
  assert.equal(ans.status, 200);
  assert.equal(ans.json.correct, true);
  assert.ok(ans.json.explanation && ans.json.explanation.length > 10);
});

test('7) daily challenge returns the same 5 question ids on repeat calls', async () => {
  const a = await req('/api/daily');
  const b = await req('/api/daily');
  assert.equal(a.status, 200);
  assert.equal(a.json.questions.length, 5);
  assert.deepEqual(a.json.questions.map((q) => q.id), b.json.questions.map((q) => q.id));
  assert.deepEqual(a.json.questions.map((q) => q.options.join('|')), b.json.questions.map((q) => q.options.join('|')));
  assert.ok(!JSON.stringify(a.json).includes('correctIndex'));
});

test('8) leaderboard post + get works and contains no email or user id', async () => {
  const post = await req('/api/leaderboard', {
    method: 'POST',
    body: { displayName: 'Leaderboard Tester', percentage: 87.5, correct: 21, total: 24, difficulty: 'mixed' }
  });
  assert.equal(post.status, 201);
  assert.equal(post.json.stored, true);
  const get = await req('/api/leaderboard');
  assert.equal(get.status, 200);
  const entry = get.json.entries.find((e) => e.displayName === 'Leaderboard Tester');
  assert.ok(entry);
  assert.equal(entry.percentage, 87.5);
  const raw = JSON.stringify(get.json);
  assert.ok(!raw.includes('@test.dev'), 'leaderboard must never contain emails');
  assert.ok(!raw.includes('userId'), 'leaderboard must never contain user ids');
});

test('leaderboard opt-out is honoured for logged-in users', async () => {
  const patch = await req('/api/me/settings', {
    method: 'PATCH', cookie: userCookie, body: { leaderboardOptOut: true }
  });
  assert.equal(patch.status, 200);
  assert.equal(patch.json.user.leaderboardOptOut, true);
  const post = await req('/api/leaderboard', {
    method: 'POST', cookie: userCookie,
    body: { displayName: 'Should Not Appear', percentage: 50, correct: 12, total: 24, difficulty: 'easy' }
  });
  assert.equal(post.status, 200);
  assert.equal(post.json.stored, false);
  const get = await req('/api/leaderboard');
  assert.ok(!get.json.entries.some((e) => e.displayName === 'Should Not Appear'));
  await req('/api/me/settings', { method: 'PATCH', cookie: userCookie, body: { leaderboardOptOut: false } });
});

test('9) admin routes: 401 when logged out, 403 for non-admin', async () => {
  const anon = await req('/api/admin/questions');
  assert.equal(anon.status, 401);
  const nonAdmin = await req('/api/admin/questions', { cookie: userCookie });
  assert.equal(nonAdmin.status, 403);
});

let adminCookie;
let createdQuestionId;

test('10) admin (from env) can create, edit and delete a question', async () => {
  const login = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@braingenius.test', password: 'admin-test-password-123' }
  });
  assert.equal(login.status, 200);
  assert.equal(login.json.user.role, 'admin');
  adminCookie = login.cookie;

  const created = await req('/api/admin/questions', {
    method: 'POST', cookie: adminCookie,
    body: {
      category: 'Number Series', difficulty: 'easy',
      prompt: 'What comes next? 10, 20, 30, ?',
      options: ['35', '40', '45', '50'], correctIndex: 1,
      explanation: 'The series increases by 10 each time.'
    }
  });
  assert.equal(created.status, 201);
  createdQuestionId = created.json.question.id;

  const edited = await req(`/api/admin/questions/${createdQuestionId}`, {
    method: 'PUT', cookie: adminCookie,
    body: {
      category: 'Number Series', difficulty: 'medium',
      prompt: 'Edited: what comes next? 10, 20, 30, ?',
      options: ['35', '40', '45', '50'], correctIndex: 1,
      explanation: 'The series increases by 10 each time.'
    }
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.json.question.difficulty, 'medium');
  assert.ok(edited.json.question.prompt.startsWith('Edited:'));

  const del = await req(`/api/admin/questions/${createdQuestionId}`, { method: 'DELETE', cookie: adminCookie });
  assert.equal(del.status, 200);
  const list = await req('/api/admin/questions', { cookie: adminCookie });
  assert.ok(!list.json.questions.some((q) => q.id === createdQuestionId));
  assert.equal(list.json.questions.length, 36);
});

test('11) reporting a question makes it appear in admin reports', async () => {
  const rep = await req('/api/questions/lr-e1/report', {
    method: 'POST', body: { reason: 'Testing the report flow' }
  });
  assert.equal(rep.status, 201);
  const reports = await req('/api/admin/reports', { cookie: adminCookie });
  assert.equal(reports.status, 200);
  const found = reports.json.reports.find((r) => r.questionId === 'lr-e1');
  assert.ok(found);
  assert.equal(found.reason, 'Testing the report flow');
  const resolved = await req(`/api/admin/reports/${found.id}`, {
    method: 'PATCH', cookie: adminCookie, body: { status: 'resolved' }
  });
  assert.equal(resolved.status, 200);
});

test('contact form stores a message the admin can read', async () => {
  const post = await req('/api/contact', {
    method: 'POST',
    body: { name: 'Visitor', email: 'visitor@example.com', message: 'Great site, one question had a typo.' }
  });
  assert.equal(post.status, 201);
  const messages = await req('/api/admin/messages', { cookie: adminCookie });
  assert.ok(messages.json.messages.some((m) => m.message.includes('typo')));
});

test('admin stats respond with aggregates', async () => {
  const stats = await req('/api/admin/stats', { cookie: adminCookie });
  assert.equal(stats.status, 200);
  assert.ok(stats.json.totalUsers >= 2);
  assert.ok(stats.json.totalTests >= 1);
  assert.ok(Array.isArray(stats.json.questionsPerCategory));
});

test('malformed input does not crash the server', async () => {
  const res = await fetch(base + '/api/test/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not valid json'
  });
  assert.equal(res.status, 400);
  const meta = await req('/api/meta');
  assert.equal(meta.status, 200);
  assert.equal(meta.json.questionCount, 36);
});

test('daily submit for a logged-in user unlocks Daily Challenger', async () => {
  const daily = await req('/api/daily', { cookie: userCookie });
  const submit = await req('/api/daily/submit', {
    method: 'POST', cookie: userCookie,
    body: { answers: answersFor(daily.json.questions, 'correct') }
  });
  assert.equal(submit.status, 200);
  assert.equal(submit.json.percentage, 100);
  const ach = await req('/api/me/achievements', { cookie: userCookie });
  const byKey = Object.fromEntries(ach.json.achievements.map((a) => [a.key, a.earned]));
  assert.equal(byKey['daily-challenger'], true);
});
