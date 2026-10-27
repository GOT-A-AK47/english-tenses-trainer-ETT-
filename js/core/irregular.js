// Irregular verbs oefenmodule: geef de past simple en het past participle.
const IrregularTrainer = {
  pool: [],
  index: 0,
  score: 0,
  total: 0,

  init() {
    this.pool = [...IRREGULAR_VERBS].sort(() => Math.random() - 0.5);
    this.index = 0;
    this.score = 0;
    this.total = 0;
  },

  current() { return this.pool[this.index]; },

  next() {
    if (this.index >= this.pool.length - 1) {
      this.pool.sort(() => Math.random() - 0.5);
      this.index = 0;
    } else {
      this.index++;
    }
    return this.current();
  },

  // Checkt beide velden; geeft per veld correct/fout terug.
  check(pastInput, ppInput) {
    const v = this.current();
    const norm = s => s.trim().toLowerCase();
    const pastOk = norm(pastInput) === v.past;
    const ppOk = norm(ppInput) === v.pastParticiple;
    this.total += 2;
    if (pastOk) this.score++;
    if (ppOk) this.score++;
    return { pastOk, ppOk, past: v.past, pp: v.pastParticiple };
  }
};
