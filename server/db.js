'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const CATEGORIES = [
  'Logical Reasoning',
  'Number Series',
  'Pattern Recognition',
  'Verbal Reasoning',
  'Spatial Reasoning',
  'Basic Mathematical Reasoning'
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  leaderboard_opt_out INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS test_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  difficulty TEXT NOT NULL,
  questions TEXT NOT NULL,
  submitted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  kind TEXT NOT NULL DEFAULT 'test',
  difficulty TEXT NOT NULL,
  correct INTEGER NOT NULL,
  attempted INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage REAL NOT NULL,
  per_category TEXT NOT NULL,
  duration_sec INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS daily_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  result_id INTEGER,
  UNIQUE(user_id, date)
);
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  percentage REAL NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function initDb(dbPath) {
  const resolved = dbPath || process.env.BG_DB_PATH ||
    path.join(__dirname, '..', 'data', 'braingenius.db');
  if (resolved !== ':memory:') {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
  }
  const db = new DatabaseSync(resolved);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  seedQuestions(db);
  seedAdmin(db);
  return db;
}

function seedQuestions(db) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM questions').get();
  if (row.n > 0) return;
  const seedPath = path.join(__dirname, 'questions.seed.json');
  const bank = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const insert = db.prepare(
    'INSERT INTO questions (id, category, difficulty, prompt, options, correct_index, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const q of bank) {
    insert.run(q.id, q.category, q.difficulty, q.prompt, JSON.stringify(q.options), q.correctIndex, q.explanation);
  }
}

function seedAdmin(db) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (!existing) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare(
        "INSERT INTO users (display_name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
      ).run('Administrator', email.toLowerCase(), hash);
      console.log(`BrainGenius: admin account created for ${email.toLowerCase()}`);
    }
    return;
  }
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!admin) {
    console.warn(
      'BrainGenius WARNING: no admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD ' +
      'environment variables before first run to create one. There is no default admin password.'
    );
  }
}

function getAllQuestions(db) {
  return db.prepare('SELECT * FROM questions ORDER BY id').all().map(rowToQuestion);
}

function getQuestion(db, id) {
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  return row ? rowToQuestion(row) : null;
}

function rowToQuestion(row) {
  return {
    id: row.id,
    category: row.category,
    difficulty: row.difficulty,
    prompt: row.prompt,
    options: JSON.parse(row.options),
    correctIndex: row.correct_index,
    explanation: row.explanation
  };
}

module.exports = { initDb, getAllQuestions, getQuestion, CATEGORIES, DIFFICULTIES };
