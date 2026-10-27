// Registry voor tijden. Elk tijd-bestand registreert zichzelf hier.
const TenseRegistry = {
  tenses: [],
  register(tense) {
    const existing = this.tenses.findIndex(t => t.id === tense.id);
    if (existing >= 0) this.tenses[existing] = tense;
    else this.tenses.push(tense);
  },
  get(id) { return this.tenses.find(t => t.id === id); },
  all() { return this.tenses; }
};
