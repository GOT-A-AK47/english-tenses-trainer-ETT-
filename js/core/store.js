// ProgressStore: de enige plek waar voortgang bewaard wordt.
// V0 bewaart lokaal (localStorage). Voor V1 (server) hoef je alleen
// het "backend"-object hieronder te vervangen door fetch()-calls —
// de rest van de app merkt daar niets van.

const ProgressStore = {
  KEY: "english-tenses-progress-v0",

  // Data-laag: vervang dit object in V1 door een server-backend.
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

  // V1: sync met de server. In V0 lokaal; later bv.:
  // fetch("/api/progress", { method: "POST", body: JSON.stringify(this._data()) })
  sync() {
    return Promise.resolve(this.all());
  }
};

// MistakeStore: foutieve antwoorden om later te herhalen.
// Per fout wordt de combinatie (tijd, onderwerp, werkwoord) bewaard,
// max. MAX_PER_COMB keer — daarna is de fout blijkbaar geleerd.
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
