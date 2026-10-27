// Dev-paneel: verborgen testgereedschap. NIET bedoeld voor leerlingen.
// Openen: Ctrl+Shift+D of URL-parameter ?dev=1. Sluiten: Escape of kruisje.
const DevPanel = {
  open: false,
  seeded: false,
  _origRandom: Math.random,

  init() {
    if (new URLSearchParams(location.search).get("dev") === "1") this.toggle(true);
    document.addEventListener("keydown", e => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === "Escape" && this.open) this.toggle(false);
    });
  },

  toggle(force) {
    this.open = force !== undefined ? force : !this.open;
    const el = document.getElementById("dev-panel");
    if (el) el.style.display = this.open ? "block" : "none";
  },

  // Deterministische random (seeded LCG) voor reproduceerbare tests.
  setSeed(on, seed) {
    if (on && !this.seeded) {
      this._origRandom = Math.random;
      let s = seed || 42;
      Math.random = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };
      this.seeded = true;
    } else if (!on && this.seeded) {
      Math.random = this._origRandom;
      this.seeded = false;
    }
  },

  // --- Acties ---
  showAnswer() {
    const input = document.getElementById("answer");
    if (input && typeof currentExercise !== "undefined" && currentExercise) {
      input.value = currentExercise.answer;
      input.classList.remove("wrong");
      input.classList.add("correct");
      return currentExercise.answer;
    }
    return null;
  },

  injectMistake(tenseId, subject, verb) {
    const t = tenseId || (TenseRegistry.all()[0] && TenseRegistry.all()[0].id);
    MistakeStore.add(t, subject || "he", verb || "go");
    if (typeof updateMistakeBadge === "function") updateMistakeBadge();
    return MistakeStore.count();
  },

  wipeStorage() {
    ProgressStore.reset();
    MistakeStore.clear();
    if (typeof updateMistakeBadge === "function") updateMistakeBadge();
    if (typeof renderProgress === "function") {
      const list = document.getElementById("progress-list");
      if (list && document.getElementById("view-progress").classList.contains("active")) renderProgress();
    }
    return true;
  },

  dumpStorage() {
    return JSON.stringify({
      progress: ProgressStore.all(),
      mistakes: MistakeStore.load()
    }, null, 2);
  },

  // Ingebouwde zelftest: engine + conjugaties over alle tijden.
  selfTest() {
    let fails = 0;
    const msgs = [];
    const cases = [
      ["present-simple", "he", "go", "goes"],
      ["past-simple", "she", "go", "went"],
      ["present-perfect", "he", "go", "has gone"],
      ["present-continuous", "I", "go", "am going"],
      ["past-continuous", "they", "go", "were going"],
      ["future-simple", "it", "go", "will go"],
      ["past-perfect", "we", "go", "had gone"],
      ["future-continuous", "she", "go", "will be going"],
      ["present-perfect-continuous", "he", "go", "has been going"],
      ["past-perfect-continuous", "you", "go", "had been going"],
      ["future-perfect", "I", "go", "will have gone"],
      ["future-perfect-continuous", "they", "go", "will have been going"]
    ];
    cases.forEach(([tid, subj, verb, expected]) => {
      const t = TenseRegistry.get(tid);
      const got = t.conjugate(subj, verbInfo(verb));
      if (got !== expected) { fails++; msgs.push(`conjugate ${tid}/${subj}: "${got}" != "${expected}"`); }
    });
    for (let i = 0; i < 120; i++) {
      const t = TenseRegistry.all()[i % TenseRegistry.all().length];
      const ex = ExerciseEngine.generate(t.id, null);
      if (!ex.answer || !ex.check(ex.answer)) { fails++; msgs.push(`exercise broken: ${t.id}`); }
      if (!ex.sentence.startsWith(ex.sentence.charAt(0).toUpperCase())) { fails++; msgs.push(`geen hoofdletter: ${ex.sentence}`); }
      if (!/\(to [a-z]+\)/.test(ex.sentence)) { fails++; msgs.push(`geen infinitief: ${ex.sentence}`); }
    }
    return fails === 0
      ? `SELFTEST OK — ${cases.length} vervoegingen + 120 oefeningen in orde`
      : `SELFTEST FAALT — ${fails} fouten:\n` + msgs.slice(0, 10).join("\n");
  },

  // Bouwt het paneel in de DOM (verborgen).
  mount() {
    const panel = document.createElement("div");
    panel.id = "dev-panel";
    panel.style.display = "none";
    panel.innerHTML = `
      <div class="dev-box">
        <div class="dev-head">
          <strong>DEV</strong>
          <button id="dev-close" class="dev-x">✕</button>
        </div>
        <div class="dev-actions">
          <button data-dev="answer">Toon antwoord</button>
          <button data-dev="mistake">Injecteer fout</button>
          <button data-dev="wipe">Wis opslag</button>
          <button data-dev="dump">Toon opslag</button>
          <button data-dev="seed">Random: normaal</button>
          <button data-dev="test">Zelftest</button>
        </div>
        <pre id="dev-out" class="dev-out"></pre>
      </div>`;
    document.body.appendChild(panel);
    panel.addEventListener("click", e => {
      const btn = e.target.closest("[data-dev]");
      if (!btn) return;
      const out = panel.querySelector("#dev-out");
      if (btn.id === "dev-close") return this.toggle(false);
      switch (btn.dataset.dev) {
        case "answer": {
          const a = this.showAnswer();
          out.textContent = a ? `Antwoord: ${a}` : "Geen actieve oefening.";
          break;
        }
        case "mistake": {
          const n = this.injectMistake();
          out.textContent = `Fout geïnjecteerd. Fouten in wachtrij: ${n}`;
          break;
        }
        case "wipe":
          this.wipeStorage();
          out.textContent = "Voortgang en fouten gewist.";
          break;
        case "dump":
          out.textContent = this.dumpStorage();
          break;
        case "seed": {
          const on = !this.seeded;
          this.setSeed(on, 42);
          btn.textContent = `Random: ${on ? "seeded (42)" : "normaal"}`;
          out.textContent = on ? "Math.random vervangen door seeded LCG (42)." : "Originele Math.random hersteld.";
          break;
        }
        case "test":
          out.textContent = this.selfTest();
          break;
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  DevPanel.mount();
  DevPanel.init();
});
