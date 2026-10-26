(() => {
  "use strict";

  const STORAGE_KEY = "til-quiz:v1";
  const MIN = 60000;
  const DAY = 86400000;
  const LEARN_AHEAD = 20 * MIN;
  const GRADES = ["again", "hard", "good", "easy"];
  const GRADE_LABELS = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };
  const TYPE_LABELS = {
    recall: "Quick recall",
    cloze: "Fill the blank",
    mcq: "Pick one",
    odd_one_out: "Odd one out",
    myth_or_fact: "Myth or fact?",
    sequence: "Put in order",
    explain: "Explain like I'm 10",
    scenario: "Real-life scenario",
    riddle: "Riddle",
  };
  const CHOICE_TYPES = new Set(["mcq", "odd_one_out", "myth_or_fact"]);

  const app = document.getElementById("quiz-app");
  if (!app) return;

  let cards = [];
  let cardIds = new Set();
  let newOrder = [];
  let state = null;
  let canSave = true;
  let current = null; // { card, revealed }
  let refreshTimer = null;

  // ---------- helpers ----------

  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key === "on") for (const [ev, fn] of Object.entries(value)) node.addEventListener(ev, fn);
        else node.setAttribute(key, value === true ? "" : value);
      }
    }
    for (const child of children || []) if (child) node.append(child);
    return node;
  }

  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function localDate(ms) {
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function endOfToday(now) {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }

  function trimZero(n) {
    return n.toFixed(1).replace(/\.0$/, "");
  }

  function formatInterval(ms) {
    if (ms < MIN) return "<1m";
    if (ms < 60 * MIN) return `${Math.round(ms / MIN)}m`;
    if (ms < DAY) return `${trimZero(ms / (60 * MIN))}h`;
    const days = ms / DAY;
    if (days < 30) return `${Math.round(days)}d`;
    if (days < 365) return `${trimZero(days / 30)}mo`;
    return `${trimZero(days / 365)}y`;
  }

  // ---------- storage ----------

  function freshState() {
    return { version: 1, cards: {}, day: { date: localDate(Date.now()), newStudied: 0 }, settings: { newPerDay: 20 } };
  }

  function loadState() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      canSave = false;
      return freshState();
    }
    if (raw == null) return freshState();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || typeof parsed.cards !== "object" || !parsed.cards) throw new Error("bad shape");
      const base = freshState();
      return {
        version: 1,
        cards: parsed.cards,
        day: parsed.day && typeof parsed.day.date === "string" ? parsed.day : base.day,
        settings: { newPerDay: clampNewPerDay(parsed.settings && parsed.settings.newPerDay) },
      };
    } catch {
      canSave = false;
      return freshState();
    }
  }

  function saveState() {
    if (!canSave) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      canSave = false;
      renderNotice();
    }
  }

  function clampNewPerDay(value) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(200, Math.max(0, n)) : 20;
  }

  function ensureDay(now) {
    const today = localDate(now);
    if (state.day.date !== today) {
      state.day = { date: today, newStudied: 0 };
      saveState();
    }
  }

  function pruneState() {
    let changed = false;
    for (const id of Object.keys(state.cards)) {
      if (!cardIds.has(id)) {
        delete state.cards[id];
        changed = true;
      }
    }
    if (changed) saveState();
  }

  // ---------- scheduling ----------

  function schedule(entry, grade, now) {
    const e = entry
      ? Object.assign({}, entry)
      : { state: "learning", step: 0, due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
    e.reps += 1;
    const graduate = (days) => {
      e.state = "review";
      e.step = 0;
      e.interval = days;
      e.due = now + days * DAY;
    };
    if (e.state === "learning") {
      if (grade === "again") {
        e.step = 0;
        e.due = now + MIN;
      } else if (grade === "hard") {
        e.due = now + (e.step === 0 ? 6 : 10) * MIN;
      } else if (grade === "good") {
        if (e.step === 0) {
          e.step = 1;
          e.due = now + 10 * MIN;
        } else graduate(1);
      } else graduate(4);
      return e;
    }
    if (grade === "again") {
      e.lapses += 1;
      e.ease = Math.max(1.3, e.ease - 0.2);
      e.state = "learning";
      e.step = 1;
      e.due = now + 10 * MIN;
      return e;
    }
    if (grade === "hard") {
      e.ease = Math.max(1.3, e.ease - 0.15);
      e.interval = Math.max(e.interval + 1, Math.round(e.interval * 1.2));
    } else if (grade === "good") {
      e.interval = Math.max(e.interval + 1, Math.round(e.interval * e.ease));
    } else {
      e.ease += 0.15;
      e.interval = Math.max(e.interval + 1, Math.round(e.interval * e.ease * 1.3));
    }
    e.due = now + e.interval * DAY;
    return e;
  }

  // ---------- queue ----------

  function computeQueue(now) {
    ensureDay(now);
    const eod = endOfToday(now);
    const learningDue = [];
    const learningLater = [];
    const reviewDue = [];
    let learningToday = 0;
    for (const card of cards) {
      const entry = state.cards[card.id];
      if (!entry) continue;
      if (entry.state === "learning") {
        if (entry.due <= eod) learningToday++;
        if (entry.due <= now) learningDue.push(card);
        else learningLater.push(card);
      } else if (entry.due <= eod) reviewDue.push(card);
    }
    const byDue = (a, b) => state.cards[a.id].due - state.cards[b.id].due;
    learningDue.sort(byDue);
    reviewDue.sort(byDue);
    learningLater.sort(byDue);

    const allowance = Math.max(0, state.settings.newPerDay - state.day.newStudied);
    const newCards = allowance > 0 ? newOrder.filter((card) => !state.cards[card.id]) : [];

    let next = learningDue[0] || reviewDue[0] || newCards[0] || null;
    if (!next && learningLater.length && state.cards[learningLater[0].id].due <= now + LEARN_AHEAD) {
      next = learningLater[0];
    }
    return {
      next,
      counts: { new: Math.min(allowance, newCards.length), learning: learningToday, due: reviewDue.length },
    };
  }

  function nextDue(now) {
    let min = Infinity;
    for (const id of Object.keys(state.cards)) {
      const due = state.cards[id].due;
      if (due > now && due < min) min = due;
    }
    return min === Infinity ? null : min;
  }

  // ---------- rendering ----------

  let countsEl;
  let noticeEl;
  let stageEl;
  let newPerDayInput;

  function renderShell() {
    countsEl = el("div", { class: "quiz-counts", "aria-live": "polite" });
    noticeEl = el("p", { class: "quiz-notice", hidden: true });
    stageEl = el("div", { class: "quiz-stage" });
    newPerDayInput = el("input", {
      type: "number",
      min: "0",
      max: "200",
      step: "1",
      id: "quiz-new-per-day",
      on: { change: onNewPerDayChange },
    });
    const footer = el("div", { class: "quiz-footer" }, [
      el("label", { for: "quiz-new-per-day", class: "quiz-setting" }, [
        el("span", { text: "New cards/day" }),
        newPerDayInput,
      ]),
      el("button", { type: "button", class: "quiz-link-button", text: "Reset progress", on: { click: onReset } }),
    ]);
    app.replaceChildren(
      el("div", { class: "quiz-header" }, [el("h1", { class: "quiz-title", text: "Quiz" }), countsEl]),
      noticeEl,
      stageEl,
      footer,
    );
  }

  function renderNotice() {
    if (!noticeEl) return;
    noticeEl.hidden = canSave;
    noticeEl.textContent = canSave ? "" : "Progress can't be saved in this browser.";
  }

  function renderCounts(counts) {
    countsEl.replaceChildren(
      el("span", { class: "quiz-count quiz-count-new", title: "New" }, [
        el("strong", { text: String(counts.new) }), " New",
      ]),
      " · ",
      el("span", { class: "quiz-count quiz-count-learning", title: "Learning" }, [
        el("strong", { text: String(counts.learning) }), " Learning",
      ]),
      " · ",
      el("span", { class: "quiz-count quiz-count-due", title: "Due" }, [
        el("strong", { text: String(counts.due) }), " Due",
      ]),
    );
  }

  function renderMessage(title, detail, action) {
    current = null;
    stageEl.replaceChildren(
      el("div", { class: "quiz-card quiz-message" }, [
        el("p", { class: "quiz-message-title", text: title }),
        detail ? el("p", { class: "quiz-message-detail", text: detail }) : null,
        action || null,
      ]),
    );
  }

  function showNext() {
    clearTimeout(refreshTimer);
    const now = Date.now();
    const { next, counts } = computeQueue(now);
    renderCounts(counts);
    if (next) {
      renderCard(next);
      return;
    }
    const due = nextDue(now);
    renderMessage("🎉 Done for today!", due ? `Next review in ${formatInterval(due - now)}` : null);
    if (due && due - now - LEARN_AHEAD < 60 * MIN) {
      refreshTimer = setTimeout(showNext, Math.max(1000, due - now - LEARN_AHEAD));
    }
  }

  function renderCard(card) {
    current = { card, revealed: false, choices: null, suggested: null };
    const front = el("div", { class: "quiz-front" });
    const back = el("div", { class: "quiz-back", hidden: true });
    const meta = el("div", { class: "quiz-meta" }, [
      el("span", { class: "quiz-badge", text: TYPE_LABELS[card.type] || card.type }),
      el("span", { class: `quiz-chip quiz-chip-${card.difficulty}`, text: card.difficulty }),
    ]);

    const promptText = card.type === "cloze" ? card.prompt.replace("____", "[ … ]") : card.prompt;
    front.append(el("p", { class: "quiz-prompt", dir: "auto", text: promptText }));

    if (card.type === "mcq" || card.type === "odd_one_out") {
      const order = shuffle(card.options.map((text, index) => ({ text, index })));
      current.choices = order.map(({ text, index }, i) =>
        el("button", {
          type: "button",
          class: "quiz-option",
          dir: "auto",
          "data-key": String(i + 1),
          "data-correct": index === card.correct ? "true" : "false",
          on: { click: () => choose(i) },
        }, [el("span", { class: "quiz-option-key", text: String(i + 1) }), el("span", { text })]),
      );
      front.append(el("div", { class: "quiz-options" }, current.choices));
    } else if (card.type === "myth_or_fact") {
      current.choices = [
        { label: "Myth", isCorrect: card.correct === false },
        { label: "Fact", isCorrect: card.correct === true },
      ].map(({ label, isCorrect }, i) =>
        el("button", {
          type: "button",
          class: "quiz-option quiz-option-inline",
          "data-correct": isCorrect ? "true" : "false",
          on: { click: () => choose(i) },
        }, [el("span", { class: "quiz-option-key", text: String(i + 1) }), el("span", { text: label })]),
      );
      front.append(el("div", { class: "quiz-options quiz-options-inline" }, current.choices));
    } else {
      if (card.type === "sequence") {
        const letters = "ABCDEF";
        front.append(
          el("ul", { class: "quiz-sequence" },
            shuffle(card.items).map((item, i) =>
              el("li", { dir: "auto" }, [el("span", { class: "quiz-option-key", text: letters[i] }), el("span", { text: item })]),
            ),
          ),
        );
      }
      front.append(
        el("button", { type: "button", class: "quiz-primary", text: "Show answer", on: { click: () => reveal() } }),
      );
    }

    stageEl.replaceChildren(el("article", { class: "quiz-card" }, [meta, front, back]));
    current.front = front;
    current.back = back;
  }

  function choose(i) {
    if (!current || current.revealed || !current.choices) return;
    const picked = current.choices[i];
    if (!picked) return;
    const right = picked.dataset.correct === "true";
    for (const button of current.choices) {
      button.disabled = true;
      if (button.dataset.correct === "true") button.classList.add("is-correct");
    }
    if (!right) picked.classList.add("is-wrong");
    reveal(right ? "good" : "again");
  }

  function reveal(suggested) {
    if (!current || current.revealed) return;
    current.revealed = true;
    const { card, back, front } = current;
    const showAnswerButton = front.querySelector(".quiz-primary");
    if (showAnswerButton) showAnswerButton.remove();

    if (card.type === "cloze") {
      const [before, after] = card.prompt.split("____");
      back.append(el("p", { class: "quiz-cloze", dir: "auto" }, [before, el("mark", { text: card.answer }), after]));
    }
    if (card.type === "sequence") {
      back.append(el("ol", { class: "quiz-sequence-answer" }, card.items.map((item) => el("li", { dir: "auto", text: item }))));
    }
    back.append(el("p", { class: "quiz-answer", dir: "auto", text: card.answer }));
    if (card.explanation) back.append(el("p", { class: "quiz-explanation", dir: "auto", text: card.explanation }));
    back.append(
      el("p", { class: "quiz-source" }, [
        "From: ",
        el("a", { href: card.postUrl, target: "_blank", rel: "noopener", dir: "auto", text: card.postTitle }),
      ]),
    );

    const now = Date.now();
    const entry = state.cards[card.id];
    back.append(
      el("div", { class: "quiz-grades" },
        GRADES.map((grade, i) =>
          el("button", {
            type: "button",
            class: `quiz-grade quiz-grade-${grade}${grade === suggested ? " is-suggested" : ""}`,
            title: `${GRADE_LABELS[grade]} (${i + 1})`,
            on: { click: () => answer(grade) },
          }, [
            el("span", { class: "quiz-grade-label", text: GRADE_LABELS[grade] }),
            el("span", { class: "quiz-grade-interval", text: formatInterval(schedule(entry, grade, now).due - now) }),
          ]),
        ),
      ),
    );
    back.hidden = false;
  }

  function answer(grade) {
    if (!current || !current.revealed) return;
    const now = Date.now();
    ensureDay(now);
    const { card } = current;
    const entry = state.cards[card.id];
    if (!entry) state.day.newStudied += 1;
    state.cards[card.id] = schedule(entry, grade, now);
    saveState();
    showNext();
  }

  // ---------- controls ----------

  function onKeyDown(event) {
    if (!current || event.ctrlKey || event.metaKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    const { card, revealed } = current;
    const digit = /^[1-9]$/.test(event.key) ? Number(event.key) : null;
    if (revealed) {
      if (digit && digit <= 4) {
        event.preventDefault();
        answer(GRADES[digit - 1]);
      }
      return;
    }
    if (CHOICE_TYPES.has(card.type)) {
      if (digit && digit <= current.choices.length) {
        event.preventDefault();
        choose(digit - 1);
      }
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      reveal();
    }
  }

  function onNewPerDayChange() {
    state.settings.newPerDay = clampNewPerDay(newPerDayInput.value);
    newPerDayInput.value = String(state.settings.newPerDay);
    saveState();
    showNext();
  }

  function onReset() {
    if (!confirm("Reset all quiz progress on this browser?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      canSave = true;
    } catch {
      canSave = false;
    }
    const newPerDay = state.settings.newPerDay;
    state = freshState();
    state.settings.newPerDay = newPerDay;
    renderNotice();
    showNext();
  }

  // ---------- loading ----------

  async function load() {
    renderMessage("Loading cards…");
    let decks;
    try {
      const res = await fetch(app.dataset.decks);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      decks = await res.json();
    } catch {
      renderMessage(
        "Couldn't load quiz cards.",
        null,
        el("button", { type: "button", class: "quiz-primary", text: "Retry", on: { click: load } }),
      );
      return;
    }
    cards = [];
    for (const deck of Array.isArray(decks) ? decks : []) {
      for (const card of deck.cards || []) cards.push(Object.assign({}, card, { postTitle: deck.title, postUrl: deck.url }));
    }
    cardIds = new Set(cards.map((card) => card.id));
    newOrder = shuffle(cards);
    if (!cards.length) {
      renderCounts({ new: 0, learning: 0, due: 0 });
      renderMessage("No quiz cards yet.");
      return;
    }
    pruneState();
    showNext();
  }

  state = loadState();
  renderShell();
  renderNotice();
  newPerDayInput.value = String(state.settings.newPerDay);
  document.addEventListener("keydown", onKeyDown);
  load();
})();
