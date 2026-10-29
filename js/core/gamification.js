// Gamification (V1.7): XP, levels, badges, dagelijkse quest en de muis-mini-game.
// Whiskers de kat reageert op alles. Puur frontend; bewaard naast de voortgang.

const LEVELS = [
  { xp: 0,    name: "Katje",           scale: 0.9 },
  { xp: 50,   name: "Jonge kat",       scale: 1.0 },
  { xp: 150,  name: "Volwassen kat",   scale: 1.1 },
  { xp: 300,  name: "Ervaren jager",   scale: 1.2 },
  { xp: 500,  name: "Wijze kater",     scale: 1.3 },
  { xp: 800,  name: "Legendarische leeuw", scale: 1.45 }
];

const BADGES = [
  { id: "first-correct", name: "Eerste vangst",        desc: "Beantwoord je eerste vraag goed.",       icon: "🐾" },
  { id: "streak-10",     name: "Op jacht",             desc: "10 vragen op rij goed.",                 icon: "🎯" },
  { id: "answers-100",   name: "Doorzetter",           desc: "100 vragen beantwoord.",                 icon: "💪" },
  { id: "answers-500",   name: "Klimmer",              desc: "500 vragen beantwoord.",                 icon: "⛰️" },
  { id: "all-tenses",    name: "Tijdentraveler",       desc: "Alle 12 tijden minstens 1x geoefend.",    icon: "⏳" },
  { id: "comeback",      name: "Niet op je kop getrapt", desc: "Na 3 fouten 5 goede op rij.",           icon: "🔥" },
  { id: "mouse-catch",   name: "Muisenvanger",         desc: "Vang Whiskers' muis in de bonusronde.",  icon: "🐁" },
  { id: "quest-done",    name: "Dagvisser",            desc: "Haal de dagelijkse quest binnen.",       icon: "🐟" },
  { id: "irregular-25",  name: "Onregelmatigheid te baas", desc: "25 onregelmatige werkwoorden goed.", icon: "📓" }
];

const QUEST_GOAL = 10;      // vragen per dag
const QUEST_REWARD = 25;    // bonus-XP

const Gamification = {
  KEY: "english-tenses-game-v1",
  state: null,
  _rowStreak: 0,     // goede antwoorden op rij (deze sessie)
  _mistakes: 0,      // fouten sinds laatste goede reeks
  _sinceMistakeStreak: 0,

  load() {
    try { this.state = JSON.parse(localStorage.getItem(this.KEY)) || null; }
    catch { this.state = null; }
    if (!this.state) this.state = { xp: 0, badges: [], quest: null, questDone: false };
    // dagelijkse quest reset bij nieuwe dag
    const today = new Date().toISOString().slice(0, 10);
    if (!this.state.quest || this.state.quest.date !== today) {
      this.state.quest = { date: today, answered: 0 };
      this.state.questDone = false;
    }
    this.save();
  },

  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.state));
  },

  // ---- XP & levels ----
  level() {
    let lvl = LEVELS[0];
    for (const l of LEVELS) if (this.state.xp >= l.xp) lvl = l;
    return lvl;
  },

  nextLevel() {
    return LEVELS.find(l => l.xp > this.state.xp) || null;
  },

  addXP(amount, reason) {
    const before = this.level();
    this.state.xp += amount;
    this.save();
    this.renderBar();
    if (this.level() !== before && this.level().xp > before.xp) {
      toast(`⬆️ Level up! Whiskers is nu een ${this.level().name}!`);
      this.renderWhiskers("excited");
    } else if (amount > 0) {
      this.renderWhiskers("happy");
    }
  },

  onAnswer(tenseId, correct) {
    // XP
    this.addXP(correct ? 10 : 2);

    // reeksen voor badges + mini-game
    if (correct) {
      this._rowStreak++;
      this._sinceMistakeStreak++;
    } else {
      this._mistakes++;
      this._rowStreak = 0;
      this._sinceMistakeStreak = 0;
      this.renderWhiskers(this._mistakes >= 3 ? "sleepy" : "sad");
    }

    // dagelijkse quest
    if (!this.state.questDone) {
      this.state.quest.answered++;
      if (this.state.quest.answered >= QUEST_GOAL) {
        this.state.questDone = true;
        this.earnBadge("quest-done");
        this.addXP(QUEST_REWARD);
        toast("🐟 Dagelijkse quest voltooid! +25 XP");
      }
      this.save();
      this.renderQuest();
    }

    // badges
    if (correct && this._rowStreak === 1) this.earnBadge("first-correct");
    if (this._rowStreak >= 10) this.earnBadge("streak-10");
    const total = Object.values(ProgressStore.all()).reduce((a, t) => a + (t.total || 0), 0);
    if (total >= 100) this.earnBadge("answers-100");
    if (total >= 500) this.earnBadge("answers-500");
    const tensesSeen = Object.keys(ProgressStore.all()).filter(k => !k.startsWith("_")).length;
    if (tensesSeen >= 12) this.earnBadge("all-tenses");
    if (this._mistakes >= 3 && this._sinceMistakeStreak >= 5) this.earnBadge("comeback");

    // muis-mini-game: 5 op rij
    if (this._rowStreak > 0 && this._rowStreak % 5 === 0) this.spawnMouse();
  },

  earnBadge(id) {
    if (this.state.badges.includes(id)) return;
    this.state.badges.push(id);
    this.save();
    const badge = BADGES.find(b => b.id === id);
    if (badge) toast(`${badge.icon} Badge verdiend: ${badge.name}!`);
  },

  // ---- muis-mini-game ----
  spawnMouse() {
    if (document.getElementById("bonus-mouse")) return;
    const mouse = document.createElement("div");
    mouse.id = "bonus-mouse";
    mouse.textContent = "🐁";
    mouse.title = "Vang me!";
    document.body.appendChild(mouse);
    const dur = 3500;
    mouse.style.animation = `mouseRun ${dur}ms linear`;
    mouse.addEventListener("click", () => {
      mouse.remove();
      this.earnBadge("mouse-catch");
      this.addXP(15);
      toast("🖱️ Whiskers ving de muis! +15 XP");
      this.renderWhiskers("excited");
    });
    setTimeout(() => mouse.remove(), dur);
  },

  // ---- UI render ----
  renderBar() {
    const bar = document.getElementById("xp-fill");
    const label = document.getElementById("xp-label");
    const lvlBadge = document.getElementById("level-badge");
    if (!bar || !label || !lvlBadge) return;
    const lvl = this.level();
    const next = this.nextLevel();
    const pct = next
      ? Math.min(100, Math.round(((this.state.xp - lvl.xp) / (next.xp - lvl.xp)) * 100))
      : 100;
    bar.style.width = pct + "%";
    label.textContent = next
      ? `${this.state.xp} / ${next.xp} XP`
      : `${this.state.xp} XP — max!`;
    lvlBadge.textContent = lvl.name;
  },

  renderQuest() {
    const chip = document.getElementById("quest-chip");
    if (!chip) return;
    chip.style.display = "inline-flex";
    const q = this.state.quest;
    chip.innerHTML = this.state.questDone
      ? "🐟 Quest voltooid — Whiskers is blij!"
      : `🎣 Dagelijkse quest: ${q.answered}/${QUEST_GOAL} vragen`;
  },

  // ---- Whiskers (8-bit pixelkat) ----
  CAT_COLORS: { k: "#21201c", o: "#f4a742", d: "#d17f1f", p: "#ff8fa3", w: "#ffffff", e: "#1d4fae" },

  // 12 breed x 11 hoog. k=lijn, o=vacht, d=donkere vacht, w=wit (oogwit),
  // e=oogblauw, p=neus/blos, n=snorhaar-pixel
  PIXELS: {
    // aandachtig kijken, ogen open
    idle: [
      ".k........k.",
      ".ko......ok.",
      ".koo....ook.",
      ".kooo..ooko.",
      ".koowoowook.",
      ".koweeoeeok.",
      ".koowwewwok.",
      ".koooopooo..",
      ".kooonooook.",
      "..ko.oo.ook.",
      "...kkkkkk..."
    ],
    // blij: ogen dicht als ^^, blos
    happy: [
      ".k........k.",
      ".ko......ok.",
      ".koo....ook.",
      ".kooo..ooko.",
      ".koowwowwok.",
      ".kowwwwwwok.",
      ".koopooopo..",
      ".koopppppo..",
      ".kooonooook.",
      "..ko.oo.ook.",
      "...kkkkkk..."
    ],
    // droevig: oren plat, blik omlaag
    sad: [
      "............",
      "..k......k..",
      ".koo....ook.",
      ".koood.ooko.",
      ".koowoowook.",
      ".kowedeowok.",
      ".koowwewwok.",
      ".koooppooo..",
      ".kooonooook.",
      "..ko.oo.ook.",
      "...kkkkkk..."
    ],
    // excited: ster-ogen na level-up of muisvangst
    excited: [
      ".k........k.",
      ".ko......ok.",
      ".koo....ook.",
      ".koood.ooko.",
      ".kowwwwwwok.",
      ".koweweweok.",
      ".koweweweok.",
      ".koopppppo..",
      ".koopoooopo.",
      "..konooonk..",
      "...kkkkkk..."
    ],
    // sleepy: ogen dicht als -, na veel fouten
    sleepy: [
      ".k........k.",
      ".ko......ok.",
      ".koo....ook.",
      ".kooo..ooko.",
      ".koowoowook.",
      ".kokkkkkkok.",
      ".koowwewwok.",
      ".koooopooo..",
      ".kooonooook.",
      "..ko.oo.ook.",
      "...kkkkkk..."
    ]
  },

  renderWhiskers(mood) {
    const holder = document.getElementById("whiskers");
    if (!holder) return;
    const map = this.PIXELS[mood] || this.PIXELS.idle;
    const px = 8;
    const svg = map.map((row, y) =>
      row.split("").map((ch, x) =>
        ch === "." ? "" :
        `<rect x="${x * px}" y="${y * px}" width="${px}" height="${px}" fill="${this.CAT_COLORS[ch] || "#f4a742"}"/>`
      ).join("")
    ).join("");
    holder.innerHTML =
      `<svg viewBox="0 0 96 88" shape-rendering="crispEdges" width="100%" height="100%">${svg}</svg>`;
    const lvl = this.level();
    holder.style.setProperty("--cat-scale", lvl.scale);
    // korte bounce-animatie bij sterke emoties
    holder.classList.remove("cat-bounce");
    if (mood === "happy" || mood === "excited") {
      void holder.offsetWidth; // reflow zodat animatie herstart
      holder.classList.add("cat-bounce");
    }
  },

  // ---- badges-scherm ----
  renderBadges() {
    const grid = document.getElementById("badges-grid");
    if (!grid) return;
    grid.innerHTML = BADGES.map(b => {
      const earned = this.state.badges.includes(b.id);
      return `<div class="badge ${earned ? "" : "locked"}" title="${b.desc}">
        <span class="badge-icon">${earned ? b.icon : "🔒"}</span>
        <span class="badge-name">${b.name}</span>
      </div>`;
    }).join("");
    const xpEl = document.getElementById("badges-xp");
    if (xpEl) xpEl.textContent = `${this.state.xp} XP · Level: ${this.level().name}`;
  },

  init() {
    this.load();
    this.renderBar();
    this.renderQuest();
    this.renderWhiskers("idle");
    this.renderBadges();
  }
};
