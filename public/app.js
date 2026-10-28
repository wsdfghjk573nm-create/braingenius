'use strict';
/* BrainGenius — server app client */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  user: null,
  meta: { questionCount: 36, categories: [] },
  lastResult: null,
  lastDifficulty: 'mixed'
};

/* ---------- small helpers ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- sound (WebAudio, default OFF) ---------- */
const Sound = {
  enabled: localStorage.getItem('bg_sound') === 'on',
  ctx: null,
  play(freq, dur = 0.08, type = 'sine', when = 0) {
    if (!this.enabled) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t); osc.stop(t + dur);
    } catch { /* audio unavailable */ }
  },
  click() { this.play(620, 0.05, 'triangle'); },
  good() { this.play(660, 0.09, 'sine'); this.play(880, 0.12, 'sine', 0.09); },
  bad() { this.play(220, 0.14, 'sawtooth'); },
  updateBtn() {
    const b = $('#soundToggle');
    b.textContent = this.enabled ? '🔊' : '🔇';
    b.setAttribute('aria-label', this.enabled ? 'Turn sound effects off' : 'Turn sound effects on');
  },
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('bg_sound', this.enabled ? 'on' : 'off');
    this.updateBtn();
    this.click();
  }
};

/* ---------- theme ---------- */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  $('#themeToggle').textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('bg_theme', t);
}

/* ---------- navigation ---------- */
const VIEWS = ['home', 'start', 'test', 'results', 'practice', 'daily', 'leaderboard', 'dashboard', 'admin', 'about', 'privacy', 'terms', 'contact'];
function show(view) {
  if (!VIEWS.includes(view)) view = 'home';
  if (view === 'admin' && !(state.user && state.user.role === 'admin')) view = 'dashboard';
  for (const v of VIEWS) $('#view-' + v).classList.toggle('hidden', v !== view);
  $$('.main-nav button').forEach((b) => b.classList.toggle('active', b.dataset.nav === view));
  $('#mainNav').classList.remove('open');
  window.scrollTo({ top: 0 });
  if (view === 'leaderboard') loadLeaderboard();
  if (view === 'dashboard') renderDashboard();
  if (view === 'admin') loadAdmin();
  if (view === 'daily') $('#dailyDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* ---------- user chip ---------- */
function renderUserChip() {
  const chip = $('#userChip');
  if (state.user) {
    chip.textContent = `👤 ${state.user.displayName}`;
    chip.classList.remove('hidden');
  } else {
    chip.classList.add('hidden');
  }
  $('#navAdmin').classList.toggle('hidden', !(state.user && state.user.role === 'admin'));
}

/* ---------- home sample question ---------- */
const SAMPLE = {
  prompt: 'What comes next in the series? 3, 6, 11, 18, 27, ?',
  options: ['35', '36', '38', '40'],
  correct: 2,
  explanation: 'The gaps grow by 2 each time (+3, +5, +7, +9), so the next gap is +11: 27 + 11 = 38.'
};
function renderSample() {
  $('#samplePrompt').textContent = SAMPLE.prompt;
  const box = $('#sampleOptions');
  box.innerHTML = '';
  SAMPLE.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'option-btn';
    b.textContent = opt;
    b.addEventListener('click', () => {
      $$('#sampleOptions .option-btn').forEach((x, j) => {
        x.disabled = true;
        if (j === SAMPLE.correct) x.classList.add('correct');
        else if (j === i) x.classList.add('wrong');
      });
      const fb = $('#sampleFeedback');
      if (i === SAMPLE.correct) { fb.textContent = `✔ Correct! ${SAMPLE.explanation}`; fb.className = 'feedback good'; Sound.good(); }
      else { fb.textContent = `✖ Not quite. ${SAMPLE.explanation}`; fb.className = 'feedback bad'; Sound.bad(); }
    });
    box.appendChild(b);
  });
}

/* ================= TEST RUNNER ================= */
const T = {
  mode: 'test', // 'test' | 'daily'
  testId: null,
  questions: [],
  answers: {},
  idx: 0,
  startedAt: 0,
  timerInt: null,
  timerEndsAt: 0,
  submitting: false
};

function stopTimer() {
  if (T.timerInt) { clearInterval(T.timerInt); T.timerInt = null; }
}

function startTimer(minutes) {
  stopTimer();
  const el = $('#testTimer');
  T.timerEndsAt = Date.now() + minutes * 60 * 1000;
  el.classList.remove('hidden');
  const tick = () => {
    const left = Math.max(0, T.timerEndsAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    el.classList.toggle('low', left < 60000);
    if (left <= 0) {
      stopTimer();
      alert('Time is up! Let us submit your test.');
      submitTest(true);
    }
  };
  tick();
  T.timerInt = setInterval(tick, 500);
}

async function beginTest() {
  const level = document.querySelector('.level-card.selected').dataset.level;
  state.lastDifficulty = level;
  $('#startError').textContent = '';
  try {
    const data = await api('/api/test/start', { method: 'POST', body: JSON.stringify({ difficulty: level }) });
    T.mode = 'test';
    T.testId = data.testId;
    T.questions = data.questions;
    T.answers = {};
    T.idx = 0;
    T.startedAt = Date.now();
    T.submitting = false;
    show('test');
    renderQuestion();
    if ($('#timerEnabled').checked) {
      const mins = Math.min(120, Math.max(1, parseInt($('#timerMinutes').value, 10) || 15));
      startTimer(mins);
    } else {
      $('#testTimer').classList.add('hidden');
    }
  } catch (err) {
    $('#startError').textContent = err.message;
  }
}

async function beginDaily() {
  $('#dailyError').textContent = '';
  try {
    const data = await api('/api/daily');
    T.mode = 'daily';
    T.testId = null;
    T.questions = data.questions;
    T.answers = {};
    T.idx = 0;
    T.startedAt = Date.now();
    T.submitting = false;
    $('#testTimer').classList.add('hidden');
    show('test');
    renderQuestion();
  } catch (err) {
    $('#dailyError').textContent = err.message;
  }
}

function renderQuestion() {
  const q = T.questions[T.idx];
  if (!q) return;
  $('#testCounter').textContent = `Question ${T.idx + 1} of ${T.questions.length}`;
  $('#progressBar').style.width = `${((T.idx + 1) / T.questions.length) * 100}%`;
  $('#qCategory').textContent = `${q.category} · ${q.difficulty}`;
  $('#qPrompt').textContent = q.prompt;
  $('#reportBox').classList.add('hidden');
  $('#reportMsg').textContent = '';
  const box = $('#qOptions');
  box.innerHTML = '';
  q.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'option-btn' + (T.answers[q.id] === i ? ' selected' : '');
    b.textContent = opt;
    b.setAttribute('aria-label', `Option ${i + 1}: ${opt}`);
    b.addEventListener('click', () => {
      T.answers[q.id] = i;
      Sound.click();
      $$('#qOptions .option-btn').forEach((x, j) => x.classList.toggle('selected', j === i));
    });
    box.appendChild(b);
  });
  $('#prevBtn').disabled = T.idx === 0;
  $('#nextBtn').disabled = T.idx === T.questions.length - 1;
}

async function submitTest(fromTimer = false) {
  if (T.submitting) return;
  const unanswered = T.questions.filter((q) => T.answers[q.id] === undefined).length;
  if (!fromTimer) {
    const msg = unanswered > 0
      ? `You still have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Unanswered questions score zero. Submit anyway?`
      : 'Submit your test now? You cannot change answers afterwards.';
    if (!confirm(msg)) return;
  }
  T.submitting = true;
  stopTimer();
  const durationSec = Math.round((Date.now() - T.startedAt) / 1000);
  try {
    let data;
    if (T.mode === 'daily') {
      data = await api('/api/daily/submit', { method: 'POST', body: JSON.stringify({ answers: T.answers }) });
      data.difficulty = 'daily';
    } else {
      data = await api('/api/test/submit', {
        method: 'POST',
        body: JSON.stringify({ testId: T.testId, answers: T.answers, durationSec })
      });
    }
    state.lastResult = data;
    renderResults(data);
    show('results');
    if (data.percentage >= 50) Sound.good(); else Sound.bad();
  } catch (err) {
    T.submitting = false;
    alert(`Could not submit: ${err.message}`);
  }
}

function categoryBars(perCategory) {
  return Object.entries(perCategory).map(([cat, v]) => {
    const pct = v.total ? Math.round((v.correct / v.total) * 1000) / 10 : 0;
    return `<div class="bar-row"><span class="bar-name">${esc(cat)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <span class="bar-val">${v.correct}/${v.total} · ${pct}%</span></div>`;
  }).join('');
}

function renderResults(data) {
  $('#resCorrect').textContent = data.correct;
  $('#resAttempted').textContent = data.attempted;
  $('#resTotal').textContent = data.total;
  $('#resPercent').textContent = `${data.percentage}%`;
  $('#resCategories').innerHTML = categoryBars(data.perCategory);
  $('#lbMsg').textContent = '';
  $('#lbName').value = state.user ? state.user.displayName : '';
  const review = $('#resReview');
  review.innerHTML = data.review.map((r, i) => {
    const status = r.yourAnswer === null
      ? '<span class="tag-skip">Not answered</span>'
      : r.isCorrect ? '<span class="tag-ok">✔ Correct</span>' : '<span class="tag-no">✖ Wrong</span>';
    return `<div class="review-item">
      <div class="r-head"><span>Q${i + 1}. ${esc(r.category)}</span>${status}</div>
      <p>${esc(r.prompt)}</p>
      <p>Your answer: <strong>${r.yourAnswer === null ? '—' : esc(r.options[r.yourAnswer])}</strong><br>
      Correct answer: <strong>${esc(r.correctAnswer)}</strong></p>
      <p class="expl">${esc(r.explanation)}</p>
    </div>`;
  }).join('');
}

async function postLeaderboard() {
  const data = state.lastResult;
  if (!data) return;
  const name = $('#lbName').value.trim();
  try {
    const res = await api('/api/leaderboard', {
      method: 'POST',
      body: JSON.stringify({
        displayName: name || undefined,
        percentage: data.percentage,
        correct: data.correct,
        total: data.total,
        difficulty: data.difficulty || state.lastDifficulty
      })
    });
    $('#lbMsg').textContent = res.stored ? 'Posted! See it on the Leaderboard page.' : (res.reason || 'Not posted.');
    $('#lbMsg').className = 'feedback ' + (res.stored ? 'good' : '');
  } catch (err) {
    $('#lbMsg').textContent = err.message;
    $('#lbMsg').className = 'feedback bad';
  }
}

async function shareResult() {
  const d = state.lastResult;
  if (!d) return;
  const text = `I scored ${d.percentage}% (${d.correct}/${d.total}) on BrainGenius, an informal IQ-style reasoning test. Try it yourself!`;
  if (navigator.share) {
    try { await navigator.share({ title: 'BrainGenius result', text, url: location.href }); return; } catch { /* user cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${location.href}`);
    alert('Result copied to clipboard — paste it anywhere to share.');
  } catch {
    alert(text);
  }
}

/* ================= PRACTICE ================= */
const P = { question: null, token: null, answered: false };
async function loadPractice() {
  const cat = $('#practiceCategory').value;
  const diff = $('#practiceDifficulty').value;
  const params = new URLSearchParams();
  if (cat) params.set('category', cat);
  if (diff) params.set('difficulty', diff);
  $('#pFeedback').textContent = '';
  try {
    const data = await api(`/api/practice/next?${params.toString()}`);
    P.question = data.question;
    P.token = data.practiceToken;
    P.answered = false;
    $('#pCategory').textContent = `${P.question.category} · ${P.question.difficulty}`;
    $('#pPrompt').textContent = P.question.prompt;
    $('#practiceNextBtn').classList.add('hidden');
    const box = $('#pOptions');
    box.innerHTML = '';
    P.question.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'option-btn';
      b.textContent = opt;
      b.addEventListener('click', () => answerPractice(i));
      box.appendChild(b);
    });
  } catch (err) {
    $('#pFeedback').textContent = err.message;
    $('#pFeedback').className = 'feedback bad';
  }
}

async function answerPractice(i) {
  if (P.answered || !P.question) return;
  P.answered = true;
  try {
    const data = await api('/api/practice/answer', {
      method: 'POST',
      body: JSON.stringify({ questionId: P.question.id, optionIndex: i, practiceToken: P.token })
    });
    $$('#pOptions .option-btn').forEach((x, j) => {
      x.disabled = true;
      if (j === data.correctIndex) x.classList.add('correct');
      else if (j === i) x.classList.add('wrong');
    });
    const fb = $('#pFeedback');
    fb.textContent = `${data.correct ? '✔ Correct!' : '✖ Not quite.'} ${data.explanation}`;
    fb.className = 'feedback ' + (data.correct ? 'good' : 'bad');
    if (data.correct) Sound.good(); else Sound.bad();
    $('#practiceNextBtn').classList.remove('hidden');
  } catch (err) {
    P.answered = false;
    $('#pFeedback').textContent = err.message;
  }
}

/* ================= LEADERBOARD ================= */
async function loadLeaderboard() {
  try {
    const data = await api('/api/leaderboard');
    const tbody = $('#lbTable tbody');
    tbody.innerHTML = data.entries.map((e, i) => `<tr>
      <td>${i + 1}</td><td>${esc(e.displayName)}</td><td><strong>${e.percentage}%</strong></td>
      <td>${e.correct}/${e.total}</td><td>${esc(e.difficulty)}</td><td>${esc(String(e.date).slice(0, 10))}</td></tr>`).join('');
    $('#lbEmpty').classList.toggle('hidden', data.entries.length > 0);
  } catch { /* leave as-is */ }
}

/* ================= DASHBOARD ================= */
function renderDashboard() {
  const loggedIn = !!state.user;
  $('#authBox').classList.toggle('hidden', loggedIn);
  $('#profileBox').classList.toggle('hidden', !loggedIn);
  if (loggedIn) loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [stats, history] = await Promise.all([api('/api/me/stats'), api('/api/me/results')]);
    $('#profileName').textContent = `Welcome back, ${state.user.displayName}`;
    $('#stTests').textContent = stats.testsTaken;
    $('#stAvg').textContent = `${stats.averagePercentage}%`;
    $('#stBest').textContent = `${stats.bestPercentage}%`;
    $('#stDaily').textContent = stats.dailyCompleted;
    $('#stCategories').innerHTML = Object.keys(stats.perCategory).length
      ? categoryBars(stats.perCategory) : '<p class="hint">Take a test to see your category strengths.</p>';
    $('#stProgress').innerHTML = stats.progress.length
      ? stats.progress.map((p) => `<div class="p-dot" style="height:${Math.max(4, p.percentage * 0.6)}px" title="${esc(String(p.date).slice(0, 10))} · ${esc(p.difficulty)} · ${p.percentage}%"></div>`).join('')
      : '<p class="hint">No tests yet — your progress chart will appear here.</p>';
    const icons = { 'first-steps': '👣', 'getting-serious': '📚', 'sharp-mind': '⚡', 'category-master': '🏆', 'daily-challenger': '📅', 'all-rounder': '🎯' };
    $('#badges').innerHTML = stats.achievements.map((a) => `
      <div class="badge ${a.earned ? 'earned' : 'locked'}">
        <div class="b-icon">${icons[a.key] || '🎖️'}</div>
        <strong>${esc(a.name)}</strong><span>${esc(a.description)}</span>
        <div>${a.earned ? '✔ Earned' : 'Not yet'}</div>
      </div>`).join('');
    $('#historyTable tbody').innerHTML = history.results.map((r) => `<tr>
      <td>${esc(String(r.date).slice(0, 10))}</td><td>${esc(r.kind)}</td><td>${esc(r.difficulty)}</td>
      <td><strong>${r.percentage}%</strong></td><td>${r.correct}/${r.total}</td></tr>`).join('') ||
      '<tr><td colspan="5">No results yet.</td></tr>';
    $('#setName').value = state.user.displayName;
    $('#setOptOut').checked = !!state.user.leaderboardOptOut;
  } catch (err) {
    console.error(err);
  }
}

async function handleAuth(kind, form) {
  const msgEl = kind === 'login' ? $('#loginMsg') : $('#registerMsg');
  msgEl.textContent = '';
  try {
    let data;
    if (kind === 'login') {
      data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: $('#loginEmail').value, password: $('#loginPassword').value })
      });
    } else {
      data = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName: $('#regName').value, email: $('#regEmail').value, password: $('#regPassword').value })
      });
    }
    state.user = data.user;
    renderUserChip();
    form.reset();
    renderDashboard();
  } catch (err) {
    msgEl.textContent = err.message;
    msgEl.className = 'feedback bad';
  }
}

/* ================= ADMIN ================= */
function switchAdminTab(name) {
  $$('.tab').forEach((t) => t.classList.toggle('selected', t.dataset.atab === name));
  ['questions', 'stats', 'reports', 'leaderboard', 'messages'].forEach((n) =>
    $('#atab-' + n).classList.toggle('hidden', n !== name));
  if (name === 'questions') loadAdminQuestions();
  if (name === 'stats') loadAdminStats();
  if (name === 'reports') loadAdminReports();
  if (name === 'leaderboard') loadAdminLeaderboard();
  if (name === 'messages') loadAdminMessages();
}

function loadAdmin() {
  if (!(state.user && state.user.role === 'admin')) return;
  const sel = $('#qCategorySel');
  if (!sel.options.length) {
    for (const c of state.meta.categories) {
      const o = document.createElement('option'); o.textContent = c; sel.appendChild(o);
    }
  }
  switchAdminTab(document.querySelector('.tab.selected')?.dataset.atab || 'questions');
}

async function loadAdminQuestions() {
  try {
    const data = await api('/api/admin/questions');
    $('#adminQuestions').innerHTML = data.questions.map((q) => `
      <div class="admin-q">
        <span class="q-meta">${esc(q.category)} · ${esc(q.difficulty)}</span>
        <p><strong>${esc(q.id)}</strong> — ${esc(q.prompt)}</p>
        <p class="hint">Answer: ${esc(q.options[q.correctIndex])} · ${esc(q.explanation)}</p>
        <div class="row-actions">
          <button class="btn btn-small" data-edit="${esc(q.id)}">Edit</button>
          <button class="btn btn-small btn-danger" data-del="${esc(q.id)}">Delete</button>
        </div>
      </div>`).join('');
    $$('#adminQuestions [data-edit]').forEach((b) => b.addEventListener('click', () => fillQuestionForm(data.questions.find((q) => q.id === b.dataset.edit))));
    $$('#adminQuestions [data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(`Delete question ${b.dataset.del}?`)) return;
      await api(`/api/admin/questions/${encodeURIComponent(b.dataset.del)}`, { method: 'DELETE' });
      loadAdminQuestions();
    }));
  } catch (err) { console.error(err); }
}

function fillQuestionForm(q) {
  if (!q) return;
  $('#qFormTitle').textContent = `Edit question ${q.id}`;
  $('#qId').value = q.id;
  $('#qCategorySel').value = q.category;
  $('#qDifficulty').value = q.difficulty;
  $('#qPromptInput').value = q.prompt;
  q.options.forEach((o, i) => { $('#qOpt' + i).value = o; });
  $('#qCorrect').value = String(q.correctIndex);
  $('#qExplanation').value = q.explanation;
  $('#qCancelEdit').classList.remove('hidden');
  window.scrollTo({ top: 0 });
}

function resetQuestionForm() {
  $('#qForm').reset();
  $('#qId').value = '';
  $('#qFormTitle').textContent = 'Add a question';
  $('#qCancelEdit').classList.add('hidden');
}

async function submitQuestionForm(ev) {
  ev.preventDefault();
  const id = $('#qId').value;
  const body = {
    category: $('#qCategorySel').value,
    difficulty: $('#qDifficulty').value,
    prompt: $('#qPromptInput').value,
    options: [0, 1, 2, 3].map((i) => $('#qOpt' + i).value),
    correctIndex: parseInt($('#qCorrect').value, 10),
    explanation: $('#qExplanation').value
  };
  try {
    if (id) await api(`/api/admin/questions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/api/admin/questions', { method: 'POST', body: JSON.stringify(body) });
    $('#qFormMsg').textContent = 'Saved.';
    $('#qFormMsg').className = 'feedback good';
    resetQuestionForm();
    loadAdminQuestions();
  } catch (err) {
    $('#qFormMsg').textContent = err.message;
    $('#qFormMsg').className = 'feedback bad';
  }
}

async function loadAdminStats() {
  try {
    const s = await api('/api/admin/stats');
    $('#aUsers').textContent = s.totalUsers;
    $('#aTests').textContent = s.totalTests;
    $('#aAvg').textContent = `${s.averagePercentage}%`;
    $('#aReports').textContent = s.openReports;
    const maxDay = Math.max(1, ...s.testsPerDay.map((d) => d.count));
    $('#aPerDay').innerHTML = s.testsPerDay.length
      ? s.testsPerDay.map((d) => `<div class="bar-row"><span class="bar-name">${esc(d.day)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(d.count / maxDay) * 100}%"></div></div>
          <span class="bar-val">${d.count}</span></div>`).join('')
      : '<p class="hint">No tests in the last 14 days.</p>';
    $('#aPerCategory').innerHTML = s.questionsPerCategory.map((c) =>
      `<div class="bar-row"><span class="bar-name">${esc(c.category)}</span>
       <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, c.count * 10)}%"></div></div>
       <span class="bar-val">${c.count}</span></div>`).join('');
  } catch (err) { console.error(err); }
}

async function loadAdminReports() {
  try {
    const data = await api('/api/admin/reports');
    $('#adminReports').innerHTML = data.reports.length ? data.reports.map((r) => `
      <div class="admin-q">
        <p><strong>${esc(r.questionId)}</strong> — ${esc(r.prompt)}</p>
        <p>Reason: ${esc(r.reason)}</p>
        <p class="hint">${esc(String(r.date).slice(0, 10))} · Status: ${esc(r.status)}</p>
        ${r.status === 'open' ? `<button class="btn btn-small" data-resolve="${r.id}">Mark resolved</button>` : ''}
      </div>`).join('') : '<p class="hint">No reports.</p>';
    $$('#adminReports [data-resolve]').forEach((b) => b.addEventListener('click', async () => {
      await api(`/api/admin/reports/${b.dataset.resolve}`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) });
      loadAdminReports();
    }));
  } catch (err) { console.error(err); }
}

async function loadAdminLeaderboard() {
  try {
    const data = await api('/api/admin/leaderboard');
    $('#adminLeaderboard').innerHTML = data.entries.length ? data.entries.map((e) => `
      <div class="admin-q">
        <p><strong>${esc(e.displayName)}</strong> — ${e.percentage}% (${e.correct}/${e.total}, ${esc(e.difficulty)}) · ${esc(String(e.date).slice(0, 10))}</p>
        <button class="btn btn-small btn-danger" data-del-lb="${e.id}">Delete entry</button>
      </div>`).join('') : '<p class="hint">No leaderboard entries.</p>';
    $$('#adminLeaderboard [data-del-lb]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Delete this leaderboard entry?')) return;
      await api(`/api/admin/leaderboard/${b.dataset.delLb}`, { method: 'DELETE' });
      loadAdminLeaderboard();
    }));
  } catch (err) { console.error(err); }
}

async function loadAdminMessages() {
  try {
    const data = await api('/api/admin/messages');
    $('#adminMessages').innerHTML = data.messages.length ? data.messages.map((m) => `
      <div class="admin-q">
        <p><strong>${esc(m.name)}</strong> &lt;${esc(m.email)}&gt; · ${esc(String(m.date).slice(0, 10))}</p>
        <p>${esc(m.message)}</p>
      </div>`).join('') : '<p class="hint">No messages.</p>';
  } catch (err) { console.error(err); }
}

/* ================= INIT ================= */
function bindEvents() {
  document.addEventListener('click', (ev) => {
    const navBtn = ev.target.closest('[data-nav]');
    if (navBtn) { ev.preventDefault(); Sound.click(); show(navBtn.dataset.nav); }
  });
  $('#navToggle').addEventListener('click', () => {
    const nav = $('#mainNav');
    const open = nav.classList.toggle('open');
    $('#navToggle').setAttribute('aria-expanded', String(open));
  });
  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
  $('#soundToggle').addEventListener('click', () => Sound.toggle());

  // start view
  $$('.level-card').forEach((c) => c.addEventListener('click', () => {
    $$('.level-card').forEach((x) => { x.classList.toggle('selected', x === c); x.setAttribute('aria-checked', String(x === c)); });
    Sound.click();
  }));
  $('#timerEnabled').addEventListener('change', (e) => {
    $('#timerMinutesWrap').style.opacity = e.target.checked ? '1' : '0.5';
  });
  $('#beginTestBtn').addEventListener('click', beginTest);
  $('#dailyStartBtn').addEventListener('click', beginDaily);

  // test runner
  $('#prevBtn').addEventListener('click', () => { if (T.idx > 0) { T.idx--; renderQuestion(); } });
  $('#nextBtn').addEventListener('click', () => { if (T.idx < T.questions.length - 1) { T.idx++; renderQuestion(); } });
  $('#submitBtn').addEventListener('click', () => submitTest(false));
  $('#reportBtn').addEventListener('click', () => $('#reportBox').classList.toggle('hidden'));
  $('#reportSendBtn').addEventListener('click', async () => {
    const q = T.questions[T.idx];
    const reason = $('#reportReason').value.trim();
    if (!q || !reason) { $('#reportMsg').textContent = 'Please write a short reason first.'; return; }
    try {
      await api(`/api/questions/${encodeURIComponent(q.id)}/report`, { method: 'POST', body: JSON.stringify({ reason }) });
      $('#reportMsg').textContent = 'Thanks — report sent to the admin.';
      $('#reportReason').value = '';
    } catch (err) { $('#reportMsg').textContent = err.message; }
  });

  // results
  $('#retakeBtn').addEventListener('click', () => show('start'));
  $('#shareBtn').addEventListener('click', shareResult);
  $('#lbPostBtn').addEventListener('click', postLeaderboard);

  // practice
  $('#practiceLoadBtn').addEventListener('click', loadPractice);
  $('#practiceNextBtn').addEventListener('click', loadPractice);

  // auth + dashboard
  $('#loginForm').addEventListener('submit', (e) => { e.preventDefault(); handleAuth('login', e.target); });
  $('#registerForm').addEventListener('submit', (e) => { e.preventDefault(); handleAuth('register', e.target); });
  $('#logoutBtn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    state.user = null;
    renderUserChip();
    renderDashboard();
    show('home');
  });
  $('#settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await api('/api/me/settings', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: $('#setName').value, leaderboardOptOut: $('#setOptOut').checked })
      });
      state.user = data.user;
      renderUserChip();
      $('#settingsMsg').textContent = 'Settings saved.';
      $('#settingsMsg').className = 'feedback good';
    } catch (err) {
      $('#settingsMsg').textContent = err.message;
      $('#settingsMsg').className = 'feedback bad';
    }
  });
  $('#deleteAccountBtn').addEventListener('click', async () => {
    if (!confirm('Permanently delete your account, results and leaderboard entries? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    await api('/api/me', { method: 'DELETE' });
    state.user = null;
    renderUserChip();
    show('home');
  });

  // admin
  $$('.tab').forEach((t) => t.addEventListener('click', () => switchAdminTab(t.dataset.atab)));
  $('#qForm').addEventListener('submit', submitQuestionForm);
  $('#qCancelEdit').addEventListener('click', resetQuestionForm);

  // contact
  $('#contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name: $('#cName').value, email: $('#cEmail').value, message: $('#cMessage').value })
      });
      $('#contactMsg').textContent = 'Message sent — thank you!';
      $('#contactMsg').className = 'feedback good';
      e.target.reset();
    } catch (err) {
      $('#contactMsg').textContent = err.message;
      $('#contactMsg').className = 'feedback bad';
    }
  });
}

async function init() {
  applyTheme(localStorage.getItem('bg_theme') || 'dark');
  Sound.updateBtn();
  bindEvents();
  renderSample();
  try {
    const [me, meta] = await Promise.all([api('/api/me'), api('/api/meta')]);
    state.user = me.user;
    state.meta = meta;
    $('#factQuestions').textContent = meta.questionCount;
    const sel = $('#practiceCategory');
    for (const c of meta.categories) {
      const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o);
    }
  } catch { /* offline — sample still works */ }
  renderUserChip();
  show('home');
}

document.addEventListener('DOMContentLoaded', init);
