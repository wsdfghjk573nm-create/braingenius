'use strict';
/* BrainGenius — static (GitHub Pages) client. Fully self-contained: no server calls.
   Question bank is embedded below by scripts/build-docs.js. */

const QUESTION_BANK = [
 {
  "category": "Logical Reasoning",
  "correctIndex": 2,
  "difficulty": "easy",
  "explanation": "The order is Tom, then Sam, then Alex from tallest to shortest, so Alex is the shortest.",
  "id": "lr-e1",
  "options": [
   "Tom",
   "Sam",
   "Alex",
   "It cannot be determined"
  ],
  "prompt": "Tom is taller than Sam. Sam is taller than Alex. Who is the shortest?"
 },
 {
  "category": "Logical Reasoning",
  "correctIndex": 0,
  "difficulty": "easy",
  "explanation": "The rule applies directly: because it is raining, the ground gets wet.",
  "id": "lr-e2",
  "options": [
   "The ground is wet",
   "The ground is dry",
   "It will rain all day",
   "Nothing can be concluded"
  ],
  "prompt": "If it rains, the ground gets wet. It is raining now. What can we conclude?"
 },
 {
  "category": "Logical Reasoning",
  "correctIndex": 0,
  "difficulty": "medium",
  "explanation": "The middle of five seats is seat 3, so Jordan is in seat 3, and Priya, immediately to his left, is in seat 2.",
  "id": "lr-m1",
  "options": [
   "Priya",
   "Jordan",
   "Maria",
   "It cannot be determined"
  ],
  "prompt": "Five friends sit in a row of five seats. Jordan sits in the middle seat. Priya sits immediately to Jordan's left. Maria sits at one of the ends. Counting seats from the left, who is sitting in seat 2?"
 },
 {
  "category": "Logical Reasoning",
  "correctIndex": 0,
  "difficulty": "medium",
  "explanation": "The poets who are also painters cannot be engineers, because no poet is an engineer. So at least some painters are not engineers.",
  "id": "lr-m2",
  "options": [
   "Some painters are not engineers",
   "No painters are engineers",
   "Some engineers are painters",
   "All painters are poets"
  ],
  "prompt": "No engineers are poets. Some poets are painters. Which conclusion definitely follows?"
 },
 {
  "category": "Logical Reasoning",
  "correctIndex": 2,
  "difficulty": "hard",
  "explanation": "Cara must follow Ana directly, and Dan can only take Tuesday or Wednesday. The only arrangement that fits all the rules is Ana on Monday, Cara on Tuesday, Dan on Wednesday and Ben on Thursday.",
  "id": "lr-h1",
  "options": [
   "Monday",
   "Tuesday",
   "Wednesday",
   "Thursday"
  ],
  "prompt": "Four colleagues — Ana, Ben, Cara and Dan — each work on a different day: Monday, Tuesday, Wednesday or Thursday. Ana works earlier in the week than Ben. Cara works on the day immediately after Ana. Dan does not work on Monday or Thursday. On which day does Dan work?"
 },
 {
  "category": "Logical Reasoning",
  "correctIndex": 0,
  "difficulty": "hard",
  "explanation": "If Ash were a knave, his statement would be false, making Bo a knight — but then Bo's statement would be true, which would make them the same type, a contradiction. So Ash is a knight and Bo is a knave.",
  "id": "lr-h2",
  "options": [
   "Ash is a knight",
   "Ash is a knave",
   "Both are knaves",
   "It cannot be determined"
  ],
  "prompt": "On an island, knights always tell the truth and knaves always lie. You meet Ash and Bo. Ash says: \"Bo is a knave.\" Bo says: \"Ash and I are the same type.\" Which statement is true?"
 },
 {
  "category": "Number Series",
  "correctIndex": 1,
  "difficulty": "easy",
  "explanation": "Each number increases by 2, so the next number is 8 + 2 = 10.",
  "id": "ns-e1",
  "options": [
   "9",
   "10",
   "12",
   "16"
  ],
  "prompt": "What comes next in the series? 2, 4, 6, 8, ?"
 },
 {
  "category": "Number Series",
  "correctIndex": 1,
  "difficulty": "easy",
  "explanation": "Each number increases by 5, so the next number is 20 + 5 = 25.",
  "id": "ns-e2",
  "options": [
   "22",
   "25",
   "28",
   "30"
  ],
  "prompt": "What comes next in the series? 5, 10, 15, 20, ?"
 },
 {
  "category": "Number Series",
  "correctIndex": 2,
  "difficulty": "medium",
  "explanation": "The gaps grow by 2 each time: +3, +5, +7, +9, so the next gap is +11, giving 27 + 11 = 38.",
  "id": "ns-m1",
  "options": [
   "35",
   "36",
   "38",
   "40"
  ],
  "prompt": "What comes next in the series? 3, 6, 11, 18, 27, ?"
 },
 {
  "category": "Number Series",
  "correctIndex": 0,
  "difficulty": "medium",
  "explanation": "From the third term on, each number is the sum of the two before it: 13 = 5 + 8, so the next is 8 + 13 = 21.",
  "id": "ns-m2",
  "options": [
   "21",
   "18",
   "20",
   "24"
  ],
  "prompt": "What comes next in the series? 2, 3, 5, 8, 13, ?"
 },
 {
  "category": "Number Series",
  "correctIndex": 1,
  "difficulty": "hard",
  "explanation": "Each term is n × (n + 1): 1×2, 2×3, 3×4, 4×5, 5×6, so the next is 6×7 = 42. The gaps also confirm it: +4, +6, +8, +10, +12.",
  "id": "ns-h1",
  "options": [
   "40",
   "42",
   "44",
   "48"
  ],
  "prompt": "What comes next in the series? 2, 6, 12, 20, 30, ?"
 },
 {
  "category": "Number Series",
  "correctIndex": 3,
  "difficulty": "hard",
  "explanation": "Each term is multiplied by an increasing number: ×2, ×3, ×4, ×5, so the next is 120 × 6 = 720.",
  "id": "ns-h2",
  "options": [
   "240",
   "360",
   "600",
   "720"
  ],
  "prompt": "What comes next in the series? 1, 2, 6, 24, 120, ?"
 },
 {
  "category": "Pattern Recognition",
  "correctIndex": 1,
  "difficulty": "easy",
  "explanation": "The two shapes simply alternate: triangle, circle, triangle, circle — so a circle comes next.",
  "id": "pr-e1",
  "options": [
   "▲",
   "●",
   "■",
   "◆"
  ],
  "prompt": "Which shape comes next in the pattern? ▲ ● ▲ ● ▲ ?"
 },
 {
  "category": "Pattern Recognition",
  "correctIndex": 0,
  "difficulty": "easy",
  "explanation": "The pattern repeats in groups of three: two squares, then one circle. After two squares, a circle comes next.",
  "id": "pr-e2",
  "options": [
   "●",
   "■",
   "▲",
   "◆"
  ],
  "prompt": "Which shape comes next in the pattern? ■ ■ ● ■ ■ ● ■ ■ ?"
 },
 {
  "category": "Pattern Recognition",
  "correctIndex": 2,
  "difficulty": "medium",
  "explanation": "The sequence repeats ◆ ▲ ●. After ◆ starts the pattern again, the next shape is ▲.",
  "id": "pr-m1",
  "options": [
   "●",
   "◆",
   "▲",
   "■"
  ],
  "prompt": "Which shape comes next in the pattern? ◆ ▲ ● ◆ ▲ ● ◆ ?"
 },
 {
  "category": "Pattern Recognition",
  "correctIndex": 1,
  "difficulty": "medium",
  "explanation": "Filled and outline stars alternate while the count grows: 1 filled, 1 outline, 2 filled, 2 outline, 3 filled — so next is 3 outline stars, ☆☆☆.",
  "id": "pr-m2",
  "options": [
   "★★★★",
   "☆☆☆",
   "★☆★",
   "☆☆"
  ],
  "prompt": "Which group comes next in the pattern? ★ ☆ ★★ ☆☆ ★★★ ?"
 },
 {
  "category": "Pattern Recognition",
  "correctIndex": 1,
  "difficulty": "hard",
  "explanation": "Each row is the previous row shifted one place to the left, and every row contains ▲, ● and ■ exactly once. Row 3 already has ■ and ▲, so the missing shape is ●.",
  "id": "pr-h1",
  "options": [
   "▲",
   "●",
   "■",
   "◆"
  ],
  "prompt": "Each row of this grid holds the same three shapes in a rotated order.\nRow 1: ▲ ● ■\nRow 2: ● ■ ▲\nRow 3: ■ ▲ ?\nWhich shape completes Row 3?"
 },
 {
  "category": "Pattern Recognition",
  "correctIndex": 1,
  "difficulty": "hard",
  "explanation": "Filled and outline diamonds alternate while the group size grows by one each pair: 1, 1, 2, 2, 3, 3, 4 filled — so next is 4 outline diamonds, ◇◇◇◇.",
  "id": "pr-h2",
  "options": [
   "◆◆◆◆◆",
   "◇◇◇◇",
   "◆◇◆◇",
   "◇◇◇"
  ],
  "prompt": "Which group comes next in the pattern? ◆ ◇ ◆◆ ◇◇ ◆◆◆ ◇◇◇ ◆◆◆◆ ?"
 },
 {
  "category": "Verbal Reasoning",
  "correctIndex": 1,
  "difficulty": "easy",
  "explanation": "A book is built up from pages, just as a wall is built up from bricks.",
  "id": "vr-e1",
  "options": [
   "Paint",
   "Bricks",
   "Roof",
   "Window"
  ],
  "prompt": "Book is to Pages as Wall is to ___"
 },
 {
  "category": "Verbal Reasoning",
  "correctIndex": 2,
  "difficulty": "easy",
  "explanation": "Apple, banana and mango are fruits; a carrot is a vegetable.",
  "id": "vr-e2",
  "options": [
   "Apple",
   "Banana",
   "Carrot",
   "Mango"
  ],
  "prompt": "Which word is the odd one out?"
 },
 {
  "category": "Verbal Reasoning",
  "correctIndex": 2,
  "difficulty": "medium",
  "explanation": "A hospital is where a doctor works, and a school is where a teacher works.",
  "id": "vr-m1",
  "options": [
   "Book",
   "Student",
   "School",
   "Lesson"
  ],
  "prompt": "Doctor is to Hospital as Teacher is to ___"
 },
 {
  "category": "Verbal Reasoning",
  "correctIndex": 3,
  "difficulty": "medium",
  "explanation": "Whispering, murmuring and shouting are all ways of producing speech; listening is receiving sound, not producing it.",
  "id": "vr-m2",
  "options": [
   "Whisper",
   "Murmur",
   "Shout",
   "Listen"
  ],
  "prompt": "Which word does NOT belong with the others?"
 },
 {
  "category": "Verbal Reasoning",
  "correctIndex": 1,
  "difficulty": "hard",
  "explanation": "Candid means honest and direct in expression, which is what \"frank\" means.",
  "id": "vr-h1",
  "options": [
   "Secretive",
   "Frank",
   "Cautious",
   "Proud"
  ],
  "prompt": "\"Candid\" is closest in meaning to which word?"
 },
 {
  "category": "Verbal Reasoning",
  "correctIndex": 2,
  "difficulty": "hard",
  "explanation": "Scarce means in short supply; its opposite is plentiful, meaning available in large amounts.",
  "id": "vr-h2",
  "options": [
   "Rare",
   "Valuable",
   "Plentiful",
   "Distant"
  ],
  "prompt": "\"Scarce\" is most nearly the OPPOSITE of which word?"
 },
 {
  "category": "Spatial Reasoning",
  "correctIndex": 1,
  "difficulty": "easy",
  "explanation": "At exactly 3 o'clock the hour hand points straight at the 3.",
  "id": "sr-e1",
  "options": [
   "12",
   "3",
   "6",
   "9"
  ],
  "prompt": "A clock shows exactly 3:00, so the minute hand points at 12. At which number does the hour hand point?"
 },
 {
  "category": "Spatial Reasoning",
  "correctIndex": 2,
  "difficulty": "easy",
  "explanation": "Facing north, a right turn faces you east; a second right turn faces you south.",
  "id": "sr-e2",
  "options": [
   "North",
   "East",
   "South",
   "West"
  ],
  "prompt": "You are facing north. You turn right, and then you turn right again. Which direction are you facing now?"
 },
 {
  "category": "Spatial Reasoning",
  "correctIndex": 1,
  "difficulty": "medium",
  "explanation": "When you face south, your left hand points east, so turning left faces you east.",
  "id": "sr-m1",
  "options": [
   "North",
   "East",
   "South",
   "West"
  ],
  "prompt": "You are facing south. You turn to your left. Which direction are you facing now?"
 },
 {
  "category": "Spatial Reasoning",
  "correctIndex": 1,
  "difficulty": "medium",
  "explanation": "Folding once gives 2 layers, so the punch makes one hole in each layer — 2 holes when unfolded.",
  "id": "sr-m2",
  "options": [
   "1",
   "2",
   "3",
   "4"
  ],
  "prompt": "A sheet of paper is folded in half once. A single hole is punched through the folded paper. When the paper is opened flat again, how many holes are there?"
 },
 {
  "category": "Spatial Reasoning",
  "correctIndex": 1,
  "difficulty": "hard",
  "explanation": "The punch passes through all 4 layers, so unfolding reveals 4 holes, one from each layer.",
  "id": "sr-h1",
  "options": [
   "2",
   "4",
   "6",
   "8"
  ],
  "prompt": "A sheet of paper is folded in half, and then folded in half again, so it has 4 layers. A single hole is punched through all the layers. When the paper is completely unfolded, how many holes are there?"
 },
 {
  "category": "Spatial Reasoning",
  "correctIndex": 1,
  "difficulty": "hard",
  "explanation": "From west, a clockwise quarter turn faces you north. A half turn then faces you south. An anticlockwise quarter turn from south faces you east.",
  "id": "sr-h2",
  "options": [
   "North",
   "East",
   "South",
   "West"
  ],
  "prompt": "You are facing west. You make a quarter turn clockwise, then a half turn, then a quarter turn anticlockwise. Which direction are you facing at the end?"
 },
 {
  "category": "Basic Mathematical Reasoning",
  "correctIndex": 1,
  "difficulty": "easy",
  "explanation": "15 + 27 = 42.",
  "id": "mr-e1",
  "options": [
   "32",
   "42",
   "52",
   "45"
  ],
  "prompt": "What is 15 + 27?"
 },
 {
  "category": "Basic Mathematical Reasoning",
  "correctIndex": 1,
  "difficulty": "easy",
  "explanation": "Half of 24 is 12, so Sara keeps 24 − 12 = 12 marbles.",
  "id": "mr-e2",
  "options": [
   "14",
   "12",
   "10",
   "8"
  ],
  "prompt": "Sara has 24 marbles. She gives exactly half of them to her brother. How many marbles does Sara have left?"
 },
 {
  "category": "Basic Mathematical Reasoning",
  "correctIndex": 2,
  "difficulty": "medium",
  "explanation": "10% of 200 is 20 and 5% is 10, so 15% of 200 is 20 + 10 = 30.",
  "id": "mr-m1",
  "options": [
   "15",
   "20",
   "30",
   "45"
  ],
  "prompt": "What is 15% of 200?"
 },
 {
  "category": "Basic Mathematical Reasoning",
  "correctIndex": 1,
  "difficulty": "medium",
  "explanation": "Speed = distance ÷ time = 60 ÷ 1.5 = 40 km/h.",
  "id": "mr-m2",
  "options": [
   "30 km/h",
   "40 km/h",
   "45 km/h",
   "90 km/h"
  ],
  "prompt": "A train travels 60 kilometres in 1.5 hours at a steady speed. What is its average speed?"
 },
 {
  "category": "Basic Mathematical Reasoning",
  "correctIndex": 2,
  "difficulty": "hard",
  "explanation": "The wall needs 3 × 12 = 36 worker-days of effort. With 4 workers: 36 ÷ 4 = 9 days.",
  "id": "mr-h1",
  "options": [
   "16 days",
   "8 days",
   "9 days",
   "6 days"
  ],
  "prompt": "Three workers, all working at the same rate, can build a wall in 12 days. How long would four workers take to build the same wall?"
 },
 {
  "category": "Basic Mathematical Reasoning",
  "correctIndex": 2,
  "difficulty": "hard",
  "explanation": "Work backwards: 26 − 6 = 20, and 20 ÷ 2 = 10. Check: 10 doubled is 20, plus 6 is 26.",
  "id": "mr-h2",
  "options": [
   "12",
   "8",
   "10",
   "16"
  ],
  "prompt": "A number is doubled, and then 6 is added. The result is 26. What was the original number?"
 }
];

const CATEGORIES = [
  'Logical Reasoning',
  'Number Series',
  'Pattern Recognition',
  'Verbal Reasoning',
  'Spatial Reasoning',
  'Basic Mathematical Reasoning'
];
const QUESTIONS_PER_CATEGORY = 4;
const DAILY_COUNT = 5;
// Sorted by id so the daily shuffle matches the server version's bank order.
const BANK = [...QUESTION_BANK].sort((a, b) => (a.id < b.id ? -1 : 1));

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- local storage ---------- */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/blocked */ }
  },
  history() { return Store.get('bg_local_history', []); },
  saveResult(entry) {
    const h = Store.history();
    h.push(entry);
    Store.set('bg_local_history', h);
  },
  leaderboard() { return Store.get('bg_local_leaderboard', []); },
  addLeaderboard(entry) {
    const lb = Store.leaderboard();
    lb.push(entry);
    Store.set('bg_local_leaderboard', lb.slice(-200));
  },
  dailyDates() { return Store.get('bg_local_daily_dates', []); },
  markDaily(date) {
    const dates = Store.dailyDates();
    if (!dates.includes(date)) { dates.push(date); Store.set('bg_local_daily_dates', dates); }
  },
  playerName() { return Store.get('bg_player_name', ''); },
  setPlayerName(n) { Store.set('bg_player_name', n); }
};

/* ---------- randomness ---------- */
function shuffle(arr, rng) {
  const rand = rng || Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Same seeded PRNG as the server version, so the daily set matches.
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

// Build a client question with shuffled options, keeping the answer key private to this module.
function present(q, rng) {
  const order = shuffle(q.options.map((_, i) => i), rng);
  return {
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: order.map((i) => q.options[i]),
    correctDisplayIndex: order.indexOf(q.correctIndex),
    explanation: q.explanation
  };
}

function buildTestQuestions(difficulty) {
  const fillOrder = {
    easy: ['easy', 'medium', 'hard'],
    medium: ['medium', 'easy', 'hard'],
    hard: ['hard', 'medium', 'easy']
  };
  const picked = [];
  for (const category of CATEGORIES) {
    const inCategory = BANK.filter((q) => q.category === category);
    let pool;
    if (difficulty === 'mixed') {
      pool = shuffle(inCategory);
    } else {
      pool = [];
      for (const level of fillOrder[difficulty]) {
        pool = pool.concat(shuffle(inCategory.filter((q) => q.difficulty === level)));
      }
    }
    for (const q of pool.slice(0, QUESTIONS_PER_CATEGORY)) picked.push(present(q));
  }
  return shuffle(picked);
}

function dailyQuestions() {
  const rng = seededRng(`braingenius-daily-${todayUtc()}`);
  return shuffle(BANK, rng).slice(0, DAILY_COUNT).map((q) => present(q, rng));
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
const VIEWS = ['home', 'start', 'test', 'results', 'practice', 'daily', 'leaderboard', 'progress', 'about', 'privacy', 'terms', 'contact'];
function show(view) {
  if (!VIEWS.includes(view)) view = 'home';
  for (const v of VIEWS) $('#view-' + v).classList.toggle('hidden', v !== view);
  $$('.main-nav button').forEach((b) => b.classList.toggle('active', b.dataset.nav === view));
  $('#mainNav').classList.remove('open');
  window.scrollTo({ top: 0 });
  if (view === 'leaderboard') renderLeaderboard();
  if (view === 'progress') renderProgress();
  if (view === 'daily') $('#dailyDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* ---------- home sample ---------- */
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
const state = { lastResult: null, lastDifficulty: 'mixed' };
const T = {
  mode: 'test',
  difficulty: 'mixed',
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

function beginTest(difficulty) {
  const level = difficulty || document.querySelector('.level-card.selected').dataset.level;
  state.lastDifficulty = level;
  T.mode = 'test';
  T.difficulty = level;
  T.questions = buildTestQuestions(level);
  T.answers = {};
  T.idx = 0;
  T.startedAt = Date.now();
  T.submitting = false;
  show('test');
  renderQuestion();
  if ($('#timerEnabled').checked && !difficulty) {
    const mins = Math.min(120, Math.max(1, parseInt($('#timerMinutes').value, 10) || 15));
    startTimer(mins);
  } else if (!difficulty) {
    $('#testTimer').classList.add('hidden');
  } else {
    $('#testTimer').classList.add('hidden');
  }
}

function beginDaily() {
  T.mode = 'daily';
  T.difficulty = 'daily';
  T.questions = dailyQuestions();
  T.answers = {};
  T.idx = 0;
  T.startedAt = Date.now();
  T.submitting = false;
  $('#testTimer').classList.add('hidden');
  stopTimer();
  show('test');
  renderQuestion();
}

function renderQuestion() {
  const q = T.questions[T.idx];
  if (!q) return;
  $('#testCounter').textContent = `Question ${T.idx + 1} of ${T.questions.length}`;
  $('#progressBar').style.width = `${((T.idx + 1) / T.questions.length) * 100}%`;
  $('#qCategory').textContent = `${q.category} · ${q.difficulty}`;
  $('#qPrompt').textContent = q.prompt;
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

function scoreCurrent() {
  let correct = 0;
  let attempted = 0;
  const perCategory = {};
  const review = [];
  for (const q of T.questions) {
    if (!perCategory[q.category]) perCategory[q.category] = { correct: 0, total: 0 };
    perCategory[q.category].total += 1;
    const given = T.answers[q.id] === undefined ? null : T.answers[q.id];
    const isCorrect = given !== null && given === q.correctDisplayIndex;
    if (given !== null) attempted += 1;
    if (isCorrect) { correct += 1; perCategory[q.category].correct += 1; }
    review.push({
      id: q.id, category: q.category, difficulty: q.difficulty, prompt: q.prompt,
      options: q.options, yourAnswer: given, correctIndex: q.correctDisplayIndex,
      correctAnswer: q.options[q.correctDisplayIndex], explanation: q.explanation, isCorrect
    });
  }
  const total = T.questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
  return { correct, attempted, total, percentage, perCategory, review };
}

function submitTest(fromTimer = false) {
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
  const scored = scoreCurrent();
  const entry = {
    date: new Date().toISOString(),
    kind: T.mode,
    difficulty: T.difficulty,
    correct: scored.correct,
    attempted: scored.attempted,
    total: scored.total,
    percentage: scored.percentage,
    perCategory: scored.perCategory
  };
  Store.saveResult(entry);
  if (T.mode === 'daily') Store.markDaily(todayUtc());
  state.lastResult = { ...scored, difficulty: T.difficulty };
  renderResults(state.lastResult);
  show('results');
  if (scored.percentage >= 50) Sound.good(); else Sound.bad();
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
  $('#lbName').value = Store.playerName();
  $('#resReview').innerHTML = data.review.map((r, i) => {
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

function postLeaderboard() {
  const d = state.lastResult;
  if (!d) return;
  const name = $('#lbName').value.trim();
  if (!name) { $('#lbMsg').textContent = 'Please enter a display name first.'; $('#lbMsg').className = 'feedback bad'; return; }
  Store.setPlayerName(name);
  Store.addLeaderboard({
    displayName: name,
    percentage: d.percentage,
    correct: d.correct,
    total: d.total,
    difficulty: d.difficulty,
    date: new Date().toISOString()
  });
  $('#lbMsg').textContent = 'Posted! See it on the Leaderboard page.';
  $('#lbMsg').className = 'feedback good';
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
const P = { current: null, answered: false };
function loadPractice() {
  const cat = $('#practiceCategory').value;
  const diff = $('#practiceDifficulty').value;
  let pool = BANK;
  if (cat) pool = pool.filter((q) => q.category === cat);
  if (diff) pool = pool.filter((q) => q.difficulty === diff);
  $('#pFeedback').textContent = '';
  if (!pool.length) {
    $('#pPrompt').textContent = 'No questions match that filter.';
    $('#pOptions').innerHTML = '';
    return;
  }
  P.current = present(pool[Math.floor(Math.random() * pool.length)]);
  P.answered = false;
  $('#pCategory').textContent = `${P.current.category} · ${P.current.difficulty}`;
  $('#pPrompt').textContent = P.current.prompt;
  $('#practiceNextBtn').classList.add('hidden');
  const box = $('#pOptions');
  box.innerHTML = '';
  P.current.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'option-btn';
    b.textContent = opt;
    b.addEventListener('click', () => answerPractice(i));
    box.appendChild(b);
  });
}

function answerPractice(i) {
  if (P.answered || !P.current) return;
  P.answered = true;
  const correct = i === P.current.correctDisplayIndex;
  $$('#pOptions .option-btn').forEach((x, j) => {
    x.disabled = true;
    if (j === P.current.correctDisplayIndex) x.classList.add('correct');
    else if (j === i) x.classList.add('wrong');
  });
  const fb = $('#pFeedback');
  fb.textContent = `${correct ? '✔ Correct!' : '✖ Not quite.'} ${P.current.explanation}`;
  fb.className = 'feedback ' + (correct ? 'good' : 'bad');
  if (correct) Sound.good(); else Sound.bad();
  $('#practiceNextBtn').classList.remove('hidden');
}

/* ================= LEADERBOARD (local) ================= */
function renderLeaderboard() {
  const entries = Store.leaderboard().slice().sort((a, b) =>
    b.percentage - a.percentage || b.correct - a.correct || String(a.date).localeCompare(String(b.date)));
  $('#lbTable tbody').innerHTML = entries.slice(0, 50).map((e, i) => `<tr>
    <td>${i + 1}</td><td>${esc(e.displayName)}</td><td><strong>${e.percentage}%</strong></td>
    <td>${e.correct}/${e.total}</td><td>${esc(e.difficulty)}</td><td>${esc(String(e.date).slice(0, 10))}</td></tr>`).join('');
  $('#lbEmpty').classList.toggle('hidden', entries.length > 0);
}

/* ================= YOUR PROGRESS (local) ================= */
function computeLocalAchievements() {
  const history = Store.history();
  const tests = history.filter((r) => r.kind === 'test');
  const dailyCount = Store.dailyDates().length;
  const difficulties = new Set(tests.map((r) => r.difficulty));
  let categoryMaster = false;
  for (const r of history) {
    for (const v of Object.values(r.perCategory || {})) {
      if (v.total >= 4 && v.correct === v.total) categoryMaster = true;
    }
  }
  return [
    { key: 'first-steps', name: 'First Steps', description: 'Complete your first test.', earned: history.length >= 1 },
    { key: 'getting-serious', name: 'Getting Serious', description: 'Complete 5 full tests.', earned: tests.length >= 5 },
    { key: 'sharp-mind', name: 'Sharp Mind', description: 'Score 90% or higher on any test.', earned: history.some((r) => r.percentage >= 90) },
    { key: 'category-master', name: 'Category Master', description: 'Get 100% in a category with at least 4 questions.', earned: categoryMaster },
    { key: 'daily-challenger', name: 'Daily Challenger', description: 'Complete a daily challenge.', earned: dailyCount >= 1 },
    { key: 'all-rounder', name: 'All-Rounder', description: 'Complete a test at easy, medium and hard difficulty.', earned: ['easy', 'medium', 'hard'].every((d) => difficulties.has(d)) }
  ];
}

function renderProgress() {
  const history = Store.history();
  const tests = history.filter((r) => r.kind === 'test');
  $('#playerName').value = Store.playerName();
  $('#stTests').textContent = tests.length;
  $('#stAvg').textContent = tests.length
    ? `${Math.round((tests.reduce((s, r) => s + r.percentage, 0) / tests.length) * 10) / 10}%` : '0%';
  $('#stBest').textContent = tests.length ? `${Math.max(...tests.map((r) => r.percentage))}%` : '0%';
  $('#stDaily').textContent = Store.dailyDates().length;
  const perCategory = {};
  for (const r of history) {
    for (const [cat, v] of Object.entries(r.perCategory || {})) {
      if (!perCategory[cat]) perCategory[cat] = { correct: 0, total: 0 };
      perCategory[cat].correct += v.correct;
      perCategory[cat].total += v.total;
    }
  }
  $('#stCategories').innerHTML = Object.keys(perCategory).length
    ? categoryBars(perCategory) : '<p class="hint">Take a test to see your category strengths.</p>';
  $('#stProgress').innerHTML = tests.length
    ? tests.map((p) => `<div class="p-dot" style="height:${Math.max(4, p.percentage * 0.6)}px" title="${esc(String(p.date).slice(0, 10))} · ${esc(p.difficulty)} · ${p.percentage}%"></div>`).join('')
    : '<p class="hint">No tests yet — your progress chart will appear here.</p>';
  const icons = { 'first-steps': '👣', 'getting-serious': '📚', 'sharp-mind': '⚡', 'category-master': '🏆', 'daily-challenger': '📅', 'all-rounder': '🎯' };
  $('#badges').innerHTML = computeLocalAchievements().map((a) => `
    <div class="badge ${a.earned ? 'earned' : 'locked'}">
      <div class="b-icon">${icons[a.key] || '🎖️'}</div>
      <strong>${esc(a.name)}</strong><span>${esc(a.description)}</span>
      <div>${a.earned ? '✔ Earned' : 'Not yet'}</div>
    </div>`).join('');
  $('#historyTable tbody').innerHTML = history.slice().reverse().map((r) => `<tr>
    <td>${esc(String(r.date).slice(0, 10))}</td><td>${esc(r.kind)}</td><td>${esc(r.difficulty)}</td>
    <td><strong>${r.percentage}%</strong></td><td>${r.correct}/${r.total}</td></tr>`).join('') ||
    '<tr><td colspan="5">No results yet.</td></tr>';
}

/* ================= INIT ================= */
function bindEvents() {
  document.addEventListener('click', (ev) => {
    const navBtn = ev.target.closest('[data-nav]');
    if (navBtn) { ev.preventDefault(); Sound.click(); show(navBtn.dataset.nav); }
    const retake = ev.target.closest('[data-retake]');
    if (retake) { Sound.click(); beginTest(retake.dataset.retake); }
  });
  $('#navToggle').addEventListener('click', () => {
    const open = $('#mainNav').classList.toggle('open');
    $('#navToggle').setAttribute('aria-expanded', String(open));
  });
  $('#themeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  $('#soundToggle').addEventListener('click', () => Sound.toggle());
  $$('.level-card').forEach((c) => c.addEventListener('click', () => {
    $$('.level-card').forEach((x) => { x.classList.toggle('selected', x === c); x.setAttribute('aria-checked', String(x === c)); });
    Sound.click();
  }));
  $('#beginTestBtn').addEventListener('click', () => beginTest());
  $('#dailyStartBtn').addEventListener('click', beginDaily);
  $('#prevBtn').addEventListener('click', () => { if (T.idx > 0) { T.idx--; renderQuestion(); } });
  $('#nextBtn').addEventListener('click', () => { if (T.idx < T.questions.length - 1) { T.idx++; renderQuestion(); } });
  $('#submitBtn').addEventListener('click', () => submitTest(false));
  $('#retakeBtn').addEventListener('click', () => show('start'));
  $('#shareBtn').addEventListener('click', shareResult);
  $('#lbPostBtn').addEventListener('click', postLeaderboard);
  $('#practiceLoadBtn').addEventListener('click', loadPractice);
  $('#practiceNextBtn').addEventListener('click', loadPractice);
  $('#saveNameBtn').addEventListener('click', () => {
    const name = $('#playerName').value.trim();
    if (!name) { $('#nameMsg').textContent = 'Please type a name first.'; $('#nameMsg').className = 'feedback bad'; return; }
    Store.setPlayerName(name.slice(0, 30));
    $('#nameMsg').textContent = 'Name saved.';
    $('#nameMsg').className = 'feedback good';
  });
  $('#clearDataBtn').addEventListener('click', () => {
    if (!confirm('Erase all BrainGenius data saved in this browser (results, badges, leaderboard, name)?')) return;
    for (const k of ['bg_local_history', 'bg_local_leaderboard', 'bg_local_daily_dates', 'bg_player_name']) {
      localStorage.removeItem(k);
    }
    renderProgress();
  });
}

function init() {
  applyTheme(localStorage.getItem('bg_theme') || 'dark');
  Sound.updateBtn();
  $('#factQuestions').textContent = QUESTION_BANK.length;
  const sel = $('#practiceCategory');
  for (const c of CATEGORIES) {
    const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o);
  }
  bindEvents();
  renderSample();
  show('home');
}

document.addEventListener('DOMContentLoaded', init);
