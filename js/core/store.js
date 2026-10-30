// ProgressStore: de enige plek waar voortgang bewaard wordt.
// V1: synchroniseert met de server (server/index.js) als die beschikbaar is;
// anders valt hij terug op localStorage. De rest van de app merkt daar niets van.

const ProgressStore = {
  KEY: "english-tenses-progress-v0",

  // Data-laag: localStorage als cache/fallback, server als bron van waarheid.
  backend: {
    load() {
      try { return JSON.parse(localStorage.getItem(ProgressStore.KEY)) || {}; }
      catch { return {}; }
    },
    save(data) {
      localStorage.setItem(ProgressStore.KEY, JSON.stringify(data));
    }
  },

  _cache: null,

  _data() {
    if (!this._cache) this._cache = this.backend.load();
    return this._cache;
  },

  _stats(tenseId) {
    const d = this._data();
    if (!d[tenseId]) d[tenseId] = { correct: 0, total: 0 };
    return d[tenseId];
  },

  record(tenseId, correct) {
    const s = this._stats(tenseId);
    s.total++;
    if (correct) s.correct++;
    this.backend.save(this._data());
  },

  get(tenseId) {
    return this._stats(tenseId);
  },

  all() {
    return this._data();
  },

  reset() {
    this._cache = {};
    localStorage.removeItem(this.KEY);
  },

  // V1.5: antwoorden sinds de vorige sync, voor usage-statistieken.
  _pendingAnswers: [],

  queueAnswer(tenseId, correct) {
    this._pendingAnswers.push({ tenseId, correct });
  },

  // V1: sync met de server. Stuurt naam + klas + voortgang naar /api/progress
  // en vervangt de lokale cache door het serverantwoord. Faalt de server
  // (offline, of static-only hosting), dan blijft de lokale opslag werken.
  sync() {
    const identity = typeof Identity !== "undefined" ? Identity.get() : null;
    if (!identity) return Promise.resolve(this.all());
    const newAnswers = this._pendingAnswers;
    this._pendingAnswers = [];
    const payload = {
      identity,
      progress: this.all(),
      newAnswers,
      game: (typeof Gamification !== "undefined" && Gamification.state) ? Gamification.state : null
    };
    return fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) throw new Error("sync mislukt: " + r.status);
        return r.json();
      })
      .then(data => {
        if (data && data.progress) {
          this._cache = data.progress;
          this.backend.save(this._cache);
        }
        // V2.7: Whiskers-state samenvoegen (server = verzamelpunt)
        if (data && data.game && typeof Gamification !== "undefined" && Gamification.mergeFromServer) {
          Gamification.mergeFromServer(data.game);
        }
        return this.all();
      })
      .catch(() => this.all());
  }
};

// MistakeStore: foutieve antwoorden om later te herhalen.
// Per fout wordt de combinatie (tijd, onderwerp, werkwoord) bewaard,
// max. MAX_PER_COMB keer — daarna is de fout blijkbaar geleerd.
// Bewust lokaal (per device): fouten herhalen hoort bij de sessie van de leerling.
const MistakeStore = {
  KEY: "english-tenses-mistakes-v0",
  MAX_PER_COMB: 3,

  _list: null,

  load() {
    if (!this._list) {
      try { this._list = JSON.parse(localStorage.getItem(this.KEY)) || []; }
      catch { this._list = []; }
    }
    return this._list;
  },

  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.load()));
  },

  add(tenseId, subject, verb) {
    const list = this.load();
    const same = list.filter(m =>
      m.tenseId === tenseId && m.subject === subject && m.verb === verb).length;
    if (same < this.MAX_PER_COMB) {
      list.push({ tenseId, subject, verb });
      this.save();
    }
  },

  remove(tenseId, subject, verb) {
    this._list = this.load().filter(m =>
      !(m.tenseId === tenseId && m.subject === subject && m.verb === verb));
    this.save();
  },

  count() {
    return this.load().length;
  },

  // Haalt de volgende te herhalen fout op en verwijdert hem uit de lijst.
  takeNext() {
    const list = this.load();
    if (!list.length) return null;
    const item = list.shift();
    this.save();
    return item;
  },

  clear() {
    this._list = [];
    localStorage.removeItem(this.KEY);
  }
};
