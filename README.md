# BrainGenius – IQ Test & Brain Challenge

A modern, mobile-friendly web app for taking an online **IQ-style reasoning test**: 24 questions drawn from a bank of 36 original questions across six categories, with instant results, a per-category breakdown, practice mode, a daily challenge, a leaderboard, optional user accounts, and an admin panel.

> **Honesty first:** BrainGenius is an informal IQ-style reasoning test for fun and practice. It is **not** a clinically validated IQ assessment, and your percentage score is **not** a measured IQ. For that reason the app never displays an "IQ score" number anywhere — results show correct/attempted counts, a percentage, and per-category performance only.

## Two versions in this repository

| Version | Folder | What it is |
| --- | --- | --- |
| **Full app** | `server/` + `public/` | Node.js + Express + SQLite. Accounts, server-side scoring, shared leaderboard, admin panel, contact form storage. |
| **Static version** | `docs/` | A fully self-contained build for GitHub Pages. No server calls: test, practice, daily challenge, results, local (per-device) leaderboard, progress tracking and badges all run in the browser. It has **no login and no admin panel** (those need the server) and says so plainly on the page. |

Both versions use the same question bank (`server/questions.seed.json`). After editing the seed bank, regenerate the static bundle with `node scripts/build-docs.js`.

## Features

- **Test engine** — 24 questions per test (4 per category), randomised order and shuffled options, Previous/Next navigation, answers changeable until submit, optional countdown timer, submit confirmation that reports unanswered questions, and server-side scoring (the full app never sends answer keys to the browser before submission).
- **Categories** — Logical Reasoning, Number Series, Pattern Recognition, Verbal Reasoning, Spatial Reasoning, Basic Mathematical Reasoning, each at easy / medium / hard.
- **Difficulty levels** — Mixed, Easy, Medium, Hard. Note: the bank holds 2 questions per level per category, so a level test prioritises that level and tops up from neighbouring levels where needed to reach 24 questions.
- **Results** — correct, attempted, total, percentage, per-category bar chart, full per-question review with explanations, Share button (Web Share API with clipboard fallback), retake, and an optional leaderboard post.
- **Practice mode** — one question at a time with instant feedback and explanations, filterable by category and difficulty.
- **Daily Brain Challenge** — 5 questions chosen deterministically from the date (UTC), identical for everyone that day, in both versions.
- **Leaderboard** — top 50 by percentage; display names and scores only, never emails or user ids. Registered users can opt out in settings.
- **Accounts (optional)** — register/login with bcrypt-hashed passwords and an httpOnly JWT cookie. Guests can do everything except save history. Dashboard shows result history, averages, per-category strengths, a progress chart and badges.
- **Badges** — First Steps, Getting Serious (5 tests), Sharp Mind (≥ 90%), Category Master (100% in a 4-question category), Daily Challenger, All-Rounder (a test at each of easy/medium/hard).
- **Admin panel** — role-protected: add/edit/delete questions, anonymous usage statistics (user count, test count, average score, tests per day, questions per category), question reports with resolve flow, leaderboard moderation, and contact-form messages.
- **Extras** — dark/light mode (persisted), optional WebAudio sound effects (default **off**, mutable), responsive premium UI in dark navy + purple, accessible buttons and focus states, SEO titles/descriptions.

## Honest limits

- **Database:** SQLite (via Node's built-in `node:sqlite`). Great for a single small server; not a multi-instance production database.
- **No email is ever sent.** The contact form stores messages in the database for the admin to read in the admin panel. There is no password-reset email flow — keep your password safe.
- **Admin account:** created **only** from the `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables on first run. There is deliberately no default admin password; if the variables are unset and no admin exists, the server prints a warning.
- **Login rate limiting** is a simple in-memory limiter (10 attempts / 15 min per IP + email). It resets when the server restarts and is not shared across instances.
- **GitHub Pages version is browser-only:** progress, badges and its leaderboard live in that browser's local storage on that device; clearing browser data erases them. Accounts, the shared leaderboard and the admin panel exist only in the full app.
- The test is **not** a medical or psychological instrument and results must not be presented as an IQ measurement.

## Running the full app

Requirements: **Node.js 22 or newer** (uses the built-in `node:sqlite` module).

```bash
npm install

# Configure (copy .env.example values into your environment, or export them):
export JWT_SECRET="a-long-random-string"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="a-strong-password"
export PORT=3000            # optional, default 3000

npm start
```

Then open <http://localhost:3000>.

Environment variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (default `3000`). |
| `JWT_SECRET` | Secret for signing login tokens. If unset, a clearly-warned development fallback is used — always set it in production. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | If both are set, an admin account with this email is created on first run. |
| `BG_DB_PATH` | Optional custom SQLite file path (default `data/braingenius.db`). |

## Running the tests

```bash
npm test
```

The suite (`tests/api.test.js`, Node's built-in test runner) starts the app on an ephemeral port with a temporary database and covers: registration/login/auth, answer-key non-leakage, exact scoring (100% / 0% / unanswered), practice explanations, daily-challenge determinism, leaderboard privacy, admin role guards (401/403), admin question CRUD, question reports, the contact form, achievements, malformed-input robustness and guest access.

## Deployment

- **Full app:** any Node.js host that supports long-running processes (a VPS, Render, Railway, Fly.io, etc.). Run `npm install`, set the environment variables above, then `npm start`. Put it behind HTTPS so the login cookie travels securely, and back up `data/braingenius.db` if you care about the data.
- **Static version:** enable GitHub Pages for this repository with the `docs/` folder as the source (a `.nojekyll` file is included). No build step is needed after cloning — `docs/` is committed ready to serve. Remember it is the browser-only version described above.

## Project layout

```
server/    index.js (entry), app.js (Express app + API), db.js (SQLite schema/seed),
           questions.seed.json (36 original questions with answer keys + explanations)
public/    index.html, styles.css, app.js  — SPA for the full app
docs/      index.html, styles.css, app.js  — static GitHub Pages build (app.js generated
           from app.template.js + the seed bank by scripts/build-docs.js)
tests/     api.test.js — API test suite
scripts/   build-docs.js — regenerates docs/app.js from the seed bank
data/      SQLite database lives here at runtime (git-ignored)
```

## License

MIT. All questions are original to this project.
