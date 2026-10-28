'use strict';

const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDb, getAllQuestions, getQuestion, CATEGORIES, DIFFICULTIES } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'braingenius-dev-secret-change-me';
if (!process.env.JWT_SECRET) {
  console.warn('BrainGenius WARNING: JWT_SECRET is not set; using a development-only fallback secret. Set JWT_SECRET in production.');
}
const TOKEN_TTL = '7d';
const QUESTIONS_PER_CATEGORY = 4;
const DAILY_COUNT = 5;

/* ---------------- utilities ---------------- */

function shuffle(arr, rng) {
  const rand = rng || Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic PRNG (mulberry32) seeded from a string — used for the daily challenge.
function seededRng(seedString) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedString.length; i++) {
    h ^= seedString.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return function () {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

// Present a bank question to a client: shuffled options, no answer data.
function presentQuestion(q, rng) {
  const order = shuffle(q.options.map((_, i) => i), rng);
  return {
    view: {
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      prompt: q.prompt,
      options: order.map((i) => q.options[i])
    },
    correctDisplayIndex: order.indexOf(q.correctIndex)
  };
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function cleanString(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (s.length === 0 || s.length > max) return null;
  return s;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return out;
}

/* ---------------- app factory ---------------- */

function createApp(options = {}) {
  const db = initDb(options.dbPath);
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  /* ----- auth helpers ----- */
  function userFromReq(req) {
    const token = parseCookies(req).bg_token;
    if (!token) return null;
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare(
        'SELECT id, display_name, email, role, leaderboard_opt_out FROM users WHERE id = ?'
      ).get(payload.uid);
      return user || null;
    } catch {
      return null;
    }
  }

  function optionalAuth(req, res, next) {
    req.user = userFromReq(req);
    next();
  }
  function requireAuth(req, res, next) {
    req.user = userFromReq(req);
    if (!req.user) return res.status(401).json({ error: 'Login required.' });
    next();
  }
  function requireAdmin(req, res, next) {
    req.user = userFromReq(req);
    if (!req.user) return res.status(401).json({ error: 'Login required.' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    next();
  }

  function publicUser(u) {
    return {
      id: u.id,
      displayName: u.display_name,
      email: u.email,
      role: u.role,
      leaderboardOptOut: !!u.leaderboard_opt_out
    };
  }

  /* ----- simple in-memory login rate limiter ----- */
  const loginAttempts = new Map(); // key -> [timestamps]
  function loginRateLimited(key) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const list = (loginAttempts.get(key) || []).filter((t) => now - t < windowMs);
    list.push(now);
    loginAttempts.set(key, list);
    return list.length > 10;
  }

  /* ================= AUTH ================= */

  app.post('/api/auth/register', (req, res) => {
    try {
      const body = req.body || {};
      const displayName = cleanString(body.displayName, 40);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!displayName) return res.status(400).json({ error: 'Display name is required (max 40 characters).' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email address is required.' });
      if (password.length < 6 || password.length > 100) {
        return res.status(400).json({ error: 'Password must be between 6 and 100 characters.' });
      }
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
      const hash = bcrypt.hashSync(password, 10);
      const info = db.prepare('INSERT INTO users (display_name, email, password_hash) VALUES (?, ?, ?)')
        .run(displayName, email, hash);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
      res.cookie('bg_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000, path: '/' });
      res.status(201).json({ user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const body = req.body || {};
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const key = `${req.ip || 'ip'}|${email}`;
      if (loginRateLimited(key)) {
        return res.status(429).json({ error: 'Too many login attempts. Please wait a few minutes and try again.' });
      }
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Email or password is incorrect.' });
      }
      const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
      res.cookie('bg_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000, path: '/' });
      res.json({ user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('bg_token', { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/me', optionalAuth, (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null });
  });

  app.get('/api/meta', (req, res) => {
    const row = db.prepare('SELECT COUNT(*) AS n FROM questions').get();
    res.json({ questionCount: row.n, categories: CATEGORIES, difficulties: DIFFICULTIES });
  });

  /* ================= TEST ENGINE ================= */

  app.post('/api/test/start', optionalAuth, (req, res) => {
    try {
      const difficulty = (req.body && req.body.difficulty) || 'mixed';
      if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
        return res.status(400).json({ error: 'difficulty must be easy, medium, hard or mixed.' });
      }
      const bank = getAllQuestions(db);
      const fillOrder = {
        easy: ['easy', 'medium', 'hard'],
        medium: ['medium', 'easy', 'hard'],
        hard: ['hard', 'medium', 'easy']
      };
      const sessionQuestions = [];
      for (const category of CATEGORIES) {
        const inCategory = bank.filter((q) => q.category === category);
        let pool;
        if (difficulty === 'mixed') {
          pool = shuffle(inCategory);
        } else {
          pool = [];
          for (const level of fillOrder[difficulty]) {
            pool = pool.concat(shuffle(inCategory.filter((q) => q.difficulty === level)));
          }
        }
        for (const q of pool.slice(0, QUESTIONS_PER_CATEGORY)) {
          const { view, correctDisplayIndex } = presentQuestion(q);
          sessionQuestions.push({ ...view, correctDisplayIndex, explanation: q.explanation });
        }
      }
      const ordered = shuffle(sessionQuestions);
      const testId = crypto.randomUUID();
      db.prepare('INSERT INTO test_sessions (id, user_id, difficulty, questions) VALUES (?, ?, ?, ?)')
        .run(testId, req.user ? req.user.id : null, difficulty, JSON.stringify(ordered));
      res.status(201).json({
        testId,
        difficulty,
        total: ordered.length,
        questions: ordered.map(({ correctDisplayIndex, explanation, ...view }) => view)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not start the test.' });
    }
  });

  function scoreAnswers(sessionQuestions, answers) {
    let correct = 0;
    let attempted = 0;
    const perCategory = {};
    const review = [];
    for (const q of sessionQuestions) {
      if (!perCategory[q.category]) perCategory[q.category] = { correct: 0, total: 0 };
      perCategory[q.category].total += 1;
      const raw = answers ? answers[q.id] : undefined;
      const given = Number.isInteger(raw) && raw >= 0 && raw < q.options.length ? raw : null;
      const isCorrect = given !== null && given === q.correctDisplayIndex;
      if (given !== null) attempted += 1;
      if (isCorrect) {
        correct += 1;
        perCategory[q.category].correct += 1;
      }
      review.push({
        id: q.id,
        category: q.category,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options,
        yourAnswer: given,
        correctIndex: q.correctDisplayIndex,
        correctAnswer: q.options[q.correctDisplayIndex],
        explanation: q.explanation,
        isCorrect
      });
    }
    const total = sessionQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
    return { correct, attempted, total, percentage, perCategory, review };
  }

  app.post('/api/test/submit', optionalAuth, (req, res) => {
    try {
      const body = req.body || {};
      const testId = typeof body.testId === 'string' ? body.testId : '';
      const session = db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(testId);
      if (!session) return res.status(404).json({ error: 'Test session not found.' });
      if (session.submitted) return res.status(409).json({ error: 'This test has already been submitted.' });
      const sessionQuestions = JSON.parse(session.questions);
      const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
      const durationSec = Number.isInteger(body.durationSec) && body.durationSec >= 0 && body.durationSec <= 86400
        ? body.durationSec : null;
      const scored = scoreAnswers(sessionQuestions, answers);
      db.prepare('UPDATE test_sessions SET submitted = 1 WHERE id = ?').run(testId);
      let resultId = null;
      if (req.user) {
        const info = db.prepare(
          'INSERT INTO results (user_id, session_id, kind, difficulty, correct, attempted, total, percentage, per_category, duration_sec) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, testId, 'test', session.difficulty, scored.correct, scored.attempted, scored.total,
          scored.percentage, JSON.stringify(scored.perCategory), durationSec);
        resultId = info.lastInsertRowid;
      }
      res.json({ resultId, difficulty: session.difficulty, ...scored });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not score the test.' });
    }
  });

  /* ================= PRACTICE ================= */

  app.get('/api/practice/next', optionalAuth, (req, res) => {
    try {
      const bank = getAllQuestions(db);
      let pool = bank;
      const category = typeof req.query.category === 'string' ? req.query.category : '';
      const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : '';
      if (category && CATEGORIES.includes(category)) pool = pool.filter((q) => q.category === category);
      if (difficulty && DIFFICULTIES.includes(difficulty)) pool = pool.filter((q) => q.difficulty === difficulty);
      if (pool.length === 0) return res.status(404).json({ error: 'No questions match that filter.' });
      const q = pool[Math.floor(Math.random() * pool.length)];
      const { view, correctDisplayIndex } = presentQuestion(q);
      const practiceToken = jwt.sign({ qid: q.id, ci: correctDisplayIndex, kind: 'practice' }, JWT_SECRET, { expiresIn: '30m' });
      res.json({ question: view, practiceToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load a practice question.' });
    }
  });

  app.post('/api/practice/answer', (req, res) => {
    try {
      const body = req.body || {};
      const questionId = typeof body.questionId === 'string' ? body.questionId : '';
      const optionIndex = body.optionIndex;
      let payload;
      try {
        payload = jwt.verify(typeof body.practiceToken === 'string' ? body.practiceToken : '', JWT_SECRET);
      } catch {
        return res.status(400).json({ error: 'Practice token is missing or expired. Please load a new question.' });
      }
      if (payload.kind !== 'practice' || payload.qid !== questionId) {
        return res.status(400).json({ error: 'Practice token does not match this question.' });
      }
      const q = getQuestion(db, questionId);
      if (!q) return res.status(404).json({ error: 'Question not found.' });
      const valid = Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex <= 3;
      res.json({
        correct: valid && optionIndex === payload.ci,
        correctIndex: payload.ci,
        explanation: q.explanation
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not check the answer.' });
    }
  });

  /* ================= DAILY CHALLENGE ================= */

  function dailySet(dateStr) {
    const bank = getAllQuestions(db);
    const rng = seededRng(`braingenius-daily-${dateStr}`);
    const picked = shuffle(bank, rng).slice(0, DAILY_COUNT);
    return picked.map((q) => {
      const { view, correctDisplayIndex } = presentQuestion(q, rng);
      return { ...view, correctDisplayIndex, explanation: q.explanation };
    });
  }

  app.get('/api/daily', optionalAuth, (req, res) => {
    try {
      const date = todayUtc();
      const set = dailySet(date);
      res.json({
        date,
        total: set.length,
        questions: set.map(({ correctDisplayIndex, explanation, ...view }) => view)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load the daily challenge.' });
    }
  });

  app.post('/api/daily/submit', optionalAuth, (req, res) => {
    try {
      const date = todayUtc();
      const set = dailySet(date);
      const answers = req.body && typeof req.body.answers === 'object' && req.body.answers !== null ? req.body.answers : {};
      const scored = scoreAnswers(set, answers);
      let resultId = null;
      if (req.user) {
        const info = db.prepare(
          'INSERT INTO results (user_id, session_id, kind, difficulty, correct, attempted, total, percentage, per_category, duration_sec) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, null, 'daily', 'daily', scored.correct, scored.attempted, scored.total,
          scored.percentage, JSON.stringify(scored.perCategory), null);
        resultId = info.lastInsertRowid;
        db.prepare('INSERT OR IGNORE INTO daily_completions (user_id, date, result_id) VALUES (?, ?, ?)')
          .run(req.user.id, date, resultId);
      }
      res.json({ resultId, date, ...scored });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not score the daily challenge.' });
    }
  });

  /* ================= LEADERBOARD ================= */

  app.post('/api/leaderboard', optionalAuth, (req, res) => {
    try {
      const body = req.body || {};
      const percentage = typeof body.percentage === 'number' ? body.percentage : NaN;
      const correct = body.correct;
      const total = body.total;
      const difficulty = typeof body.difficulty === 'string' ? body.difficulty : '';
      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        return res.status(400).json({ error: 'percentage must be a number between 0 and 100.' });
      }
      if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || total > 200 || correct < 0 || correct > total) {
        return res.status(400).json({ error: 'correct and total must be valid whole numbers.' });
      }
      if (!['easy', 'medium', 'hard', 'mixed', 'daily'].includes(difficulty)) {
        return res.status(400).json({ error: 'difficulty is invalid.' });
      }
      if (req.user && req.user.leaderboard_opt_out) {
        return res.json({ stored: false, reason: 'You have opted out of the leaderboard in your settings.' });
      }
      const fallbackName = req.user ? req.user.display_name : 'Guest';
      const displayName = cleanString(body.displayName, 30) || fallbackName;
      const info = db.prepare(
        'INSERT INTO leaderboard (display_name, percentage, correct, total, difficulty) VALUES (?, ?, ?, ?, ?)'
      ).run(displayName, percentage, correct, total, difficulty);
      res.status(201).json({ stored: true, id: info.lastInsertRowid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not save the leaderboard entry.' });
    }
  });

  app.get('/api/leaderboard', (req, res) => {
    const rows = db.prepare(
      'SELECT display_name, percentage, correct, total, difficulty, created_at FROM leaderboard ORDER BY percentage DESC, correct DESC, created_at ASC LIMIT 50'
    ).all();
    res.json({
      entries: rows.map((r) => ({
        displayName: r.display_name,
        percentage: r.percentage,
        correct: r.correct,
        total: r.total,
        difficulty: r.difficulty,
        date: r.created_at
      }))
    });
  });

  /* ================= REPORT + CONTACT ================= */

  app.post('/api/questions/:id/report', (req, res) => {
    try {
      const q = getQuestion(db, req.params.id);
      if (!q) return res.status(404).json({ error: 'Question not found.' });
      const reason = cleanString(req.body && req.body.reason, 500);
      if (!reason) return res.status(400).json({ error: 'Please give a short reason (max 500 characters).' });
      const info = db.prepare('INSERT INTO reports (question_id, reason) VALUES (?, ?)').run(q.id, reason);
      res.status(201).json({ ok: true, id: info.lastInsertRowid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not save the report.' });
    }
  });

  app.post('/api/contact', (req, res) => {
    try {
      const body = req.body || {};
      const name = cleanString(body.name, 80);
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      const message = cleanString(body.message, 2000);
      if (!name) return res.status(400).json({ error: 'Name is required.' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email address is required.' });
      if (!message) return res.status(400).json({ error: 'Message is required (max 2000 characters).' });
      db.prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
      res.status(201).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not send the message.' });
    }
  });

  /* ================= USER DASHBOARD ================= */

  app.get('/api/me/results', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 200')
      .all(req.user.id);
    res.json({
      results: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        difficulty: r.difficulty,
        correct: r.correct,
        attempted: r.attempted,
        total: r.total,
        percentage: r.percentage,
        perCategory: JSON.parse(r.per_category),
        durationSec: r.duration_sec,
        date: r.created_at
      }))
    });
  });

  function computeAchievements(userId) {
    const results = db.prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at ASC').all(userId);
    const tests = results.filter((r) => r.kind === 'test');
    const dailyCount = db.prepare('SELECT COUNT(*) AS n FROM daily_completions WHERE user_id = ?').get(userId).n;
    const difficulties = new Set(tests.map((r) => r.difficulty));
    let categoryMaster = false;
    for (const r of results) {
      const pc = JSON.parse(r.per_category);
      for (const cat of Object.keys(pc)) {
        if (pc[cat].total >= 4 && pc[cat].correct === pc[cat].total) categoryMaster = true;
      }
    }
    return [
      { key: 'first-steps', name: 'First Steps', description: 'Complete your first test.', earned: results.length >= 1 },
      { key: 'getting-serious', name: 'Getting Serious', description: 'Complete 5 full tests.', earned: tests.length >= 5 },
      { key: 'sharp-mind', name: 'Sharp Mind', description: 'Score 90% or higher on any test.', earned: results.some((r) => r.percentage >= 90) },
      { key: 'category-master', name: 'Category Master', description: 'Get 100% in a category with at least 4 questions.', earned: categoryMaster },
      { key: 'daily-challenger', name: 'Daily Challenger', description: 'Complete a daily challenge.', earned: dailyCount >= 1 },
      { key: 'all-rounder', name: 'All-Rounder', description: 'Complete a test at easy, medium and hard difficulty.', earned: ['easy', 'medium', 'hard'].every((d) => difficulties.has(d)) }
    ];
  }

  app.get('/api/me/achievements', requireAuth, (req, res) => {
    res.json({ achievements: computeAchievements(req.user.id) });
  });

  app.get('/api/me/stats', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT * FROM results WHERE user_id = ? ORDER BY created_at ASC, id ASC').all(req.user.id);
    const tests = rows.filter((r) => r.kind === 'test');
    const perCategory = {};
    for (const r of rows) {
      const pc = JSON.parse(r.per_category);
      for (const [cat, v] of Object.entries(pc)) {
        if (!perCategory[cat]) perCategory[cat] = { correct: 0, total: 0 };
        perCategory[cat].correct += v.correct;
        perCategory[cat].total += v.total;
      }
    }
    for (const cat of Object.keys(perCategory)) {
      const v = perCategory[cat];
      v.percentage = v.total > 0 ? Math.round((v.correct / v.total) * 1000) / 10 : 0;
    }
    const avg = tests.length ? Math.round((tests.reduce((s, r) => s + r.percentage, 0) / tests.length) * 10) / 10 : 0;
    const best = tests.length ? Math.max(...tests.map((r) => r.percentage)) : 0;
    res.json({
      totalResults: rows.length,
      testsTaken: tests.length,
      dailyCompleted: db.prepare('SELECT COUNT(*) AS n FROM daily_completions WHERE user_id = ?').get(req.user.id).n,
      averagePercentage: avg,
      bestPercentage: best,
      perCategory,
      progress: tests.map((r) => ({ date: r.created_at, percentage: r.percentage, difficulty: r.difficulty })),
      achievements: computeAchievements(req.user.id)
    });
  });

  app.patch('/api/me/settings', requireAuth, (req, res) => {
    try {
      const body = req.body || {};
      if (typeof body.leaderboardOptOut === 'boolean') {
        db.prepare('UPDATE users SET leaderboard_opt_out = ? WHERE id = ?')
          .run(body.leaderboardOptOut ? 1 : 0, req.user.id);
      }
      if (body.displayName !== undefined) {
        const name = cleanString(body.displayName, 40);
        if (!name) return res.status(400).json({ error: 'Display name must be 1–40 characters.' });
        db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(name, req.user.id);
      }
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      res.json({ user: publicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not update settings.' });
    }
  });

  app.delete('/api/me', requireAuth, (req, res) => {
    try {
      const names = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.user.id);
      db.prepare('DELETE FROM results WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM daily_completions WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM test_sessions WHERE user_id = ?').run(req.user.id);
      if (names) db.prepare('DELETE FROM leaderboard WHERE display_name = ?').run(names.display_name);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
      res.clearCookie('bg_token', { path: '/' });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not delete the account.' });
    }
  });

  /* ================= ADMIN ================= */

  function validateQuestionBody(body) {
    if (!body || typeof body !== 'object') return 'Invalid body.';
    if (!CATEGORIES.includes(body.category)) return 'Category is invalid.';
    if (!DIFFICULTIES.includes(body.difficulty)) return 'Difficulty must be easy, medium or hard.';
    if (!cleanString(body.prompt, 1000)) return 'Prompt is required (max 1000 characters).';
    if (!Array.isArray(body.options) || body.options.length !== 4 ||
        body.options.some((o) => !cleanString(o, 300))) {
      return 'Exactly 4 non-empty options are required.';
    }
    if (!Number.isInteger(body.correctIndex) || body.correctIndex < 0 || body.correctIndex > 3) {
      return 'correctIndex must be 0, 1, 2 or 3.';
    }
    if (!cleanString(body.explanation, 1000)) return 'Explanation is required (max 1000 characters).';
    return null;
  }

  app.get('/api/admin/questions', requireAdmin, (req, res) => {
    res.json({ questions: getAllQuestions(db) });
  });

  app.post('/api/admin/questions', requireAdmin, (req, res) => {
    const err = validateQuestionBody(req.body);
    if (err) return res.status(400).json({ error: err });
    const b = req.body;
    const id = 'q-' + crypto.randomBytes(4).toString('hex');
    db.prepare('INSERT INTO questions (id, category, difficulty, prompt, options, correct_index, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, b.category, b.difficulty, b.prompt.trim(), JSON.stringify(b.options.map((o) => o.trim())), b.correctIndex, b.explanation.trim());
    res.status(201).json({ question: getQuestion(db, id) });
  });

  app.put('/api/admin/questions/:id', requireAdmin, (req, res) => {
    const existing = getQuestion(db, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Question not found.' });
    const err = validateQuestionBody(req.body);
    if (err) return res.status(400).json({ error: err });
    const b = req.body;
    db.prepare('UPDATE questions SET category = ?, difficulty = ?, prompt = ?, options = ?, correct_index = ?, explanation = ? WHERE id = ?')
      .run(b.category, b.difficulty, b.prompt.trim(), JSON.stringify(b.options.map((o) => o.trim())), b.correctIndex, b.explanation.trim(), req.params.id);
    res.json({ question: getQuestion(db, req.params.id) });
  });

  app.delete('/api/admin/questions/:id', requireAdmin, (req, res) => {
    const info = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Question not found.' });
    res.json({ ok: true });
  });

  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const totalUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
    const totalTests = db.prepare('SELECT COUNT(*) AS n FROM results').get().n;
    const avgRow = db.prepare('SELECT AVG(percentage) AS a FROM results').get();
    const perDay = db.prepare(
      "SELECT date(created_at) AS day, COUNT(*) AS n FROM results WHERE created_at >= datetime('now', '-13 days') GROUP BY day ORDER BY day"
    ).all();
    const perCategory = db.prepare('SELECT category, COUNT(*) AS n FROM questions GROUP BY category').all();
    const openReports = db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'").get().n;
    res.json({
      totalUsers,
      totalTests,
      averagePercentage: avgRow.a ? Math.round(avgRow.a * 10) / 10 : 0,
      testsPerDay: perDay.map((r) => ({ day: r.day, count: r.n })),
      questionsPerCategory: perCategory.map((r) => ({ category: r.category, count: r.n })),
      openReports
    });
  });

  app.get('/api/admin/reports', requireAdmin, (req, res) => {
    const rows = db.prepare(
      `SELECT r.id, r.question_id, r.reason, r.status, r.created_at, q.prompt
       FROM reports r LEFT JOIN questions q ON q.id = r.question_id ORDER BY r.created_at DESC LIMIT 200`
    ).all();
    res.json({
      reports: rows.map((r) => ({
        id: r.id, questionId: r.question_id, prompt: r.prompt || '(question deleted)',
        reason: r.reason, status: r.status, date: r.created_at
      }))
    });
  });

  app.patch('/api/admin/reports/:id', requireAdmin, (req, res) => {
    const status = req.body && req.body.status;
    if (!['open', 'resolved'].includes(status)) return res.status(400).json({ error: 'status must be open or resolved.' });
    const info = db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Report not found.' });
    res.json({ ok: true });
  });

  app.get('/api/admin/leaderboard', requireAdmin, (req, res) => {
    const rows = db.prepare('SELECT * FROM leaderboard ORDER BY created_at DESC LIMIT 200').all();
    res.json({
      entries: rows.map((r) => ({
        id: r.id, displayName: r.display_name, percentage: r.percentage,
        correct: r.correct, total: r.total, difficulty: r.difficulty, date: r.created_at
      }))
    });
  });

  app.delete('/api/admin/leaderboard/:id', requireAdmin, (req, res) => {
    const info = db.prepare('DELETE FROM leaderboard WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ ok: true });
  });

  app.get('/api/admin/messages', requireAdmin, (req, res) => {
    const rows = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200').all();
    res.json({
      messages: rows.map((r) => ({ id: r.id, name: r.name, email: r.email, message: r.message, date: r.created_at }))
    });
  });

  /* ================= STATIC + FALLBACKS ================= */

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  // JSON error handler (malformed JSON bodies etc.)
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body.' });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  });

  app.locals.db = db;
  return app;
}

module.exports = { createApp };
