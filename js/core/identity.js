// Identity: lightweight leerling-identiteit (naam + klascode).
// Geen wachtwoorden — bewaard op het toestel en meegestuurd bij elke sync.
const Identity = {
  KEY: "english-tenses-identity-v1",

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || null; }
    catch { return null; }
  },

  save(name, klas) {
    const identity = { name: name.trim(), klas: klas.trim().toUpperCase() };
    localStorage.setItem(this.KEY, JSON.stringify(identity));
    return identity;
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },

  // Toon-vriendelijke naam, bv. "Anna (7B)"
  label() {
    const id = this.get();
    return id ? `${id.name} (${id.klas})` : "";
  }
};
