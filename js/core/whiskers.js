// Whiskers 2.1 (V1.8.1): hoogresolutie pixel-art kat, procedureel getekend.
// Bit-style behouden, maar op een 24x20-grid met detail: streepjes vacht,
// oogglans, snorharen, blos, staart en pootjes. Ogen kunnen meekijken.

const Whiskers = {
  W: 24, H: 20,

  // ---- pels-customisatie ----
  SKINS: [
    { id: "oranje", name: "Klassiek oranje", level: 1,  fur: "#f4a742", light: "#ffb84d", stripe: "#c97d1c" },
    { id: "grijs",  name: "Grijze poes",     level: 2,  fur: "#9aa0ab", light: "#c3c8d1", stripe: "#6d7280" },
    { id: "zwart",  name: "Zwarte panter",  level: 3,  fur: "#3a3d45", light: "#565a64", stripe: "#212229" },
    { id: "wit",    name: "Witte sneeuwkat", level: 4, fur: "#eef0f4", light: "#ffffff", stripe: "#c4c9d4" },
    { id: "roze",   name: "Roze knuffelkat", level: 5, fur: "#f7a8c4", light: "#ffd3e3", stripe: "#d97ba3" }
  ],

  getSkin() {
    try { return JSON.parse(localStorage.getItem("whiskers-skin") || "null") || { id: "oranje" }; }
    catch { return { id: "oranje" }; }
  },

  setSkin(id) {
    localStorage.setItem("whiskers-skin", JSON.stringify({ id }));
  },

  skinColors() {
    const skin = this.SKINS.find(s => s.id === this.getSkin().id) || this.SKINS[0];
    return {
      k: "#21201c",
      o: skin.fur,
      O: skin.light,
      d: skin.stripe,
      w: "#ffffff",
      e: "#1d4fae",
      p: "#ff8fa3",
      n: "#6e6a60"
    };
  },

  COLORS: null, // legacy; skinColors() is de bron

  // ---- grid helpers ----
  blank() { return Array.from({ length: this.H }, () => Array(this.W).fill(".")); },

  px(g, x, y, ch) {
    if (y >= 0 && y < this.H && x >= 0 && x < this.W) g[y][x] = ch;
  },

  rect(g, x, y, w, h, ch) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) this.px(g, i, j, ch);
  },

  // spiegel om het midden (x=11.5): teken links en rechts
  mirrorPx(g, x, y, ch) { this.px(g, x, y, ch); this.px(g, this.W - 1 - x, y, ch); },
  mirrorRect(g, x, y, w, h, ch) { this.rect(g, x, y, w, h, ch); this.rect(g, this.W - x - w, y, w, h, ch); },

  // ---- vaste vorm (hand-getekende kaart, 24 breed x 20 hoog) ----
  // . = leeg, k = outline, o = vacht, O = lichte borst, d = strepen,
  // w = oogwit, e = pupil, p = roze, n = snorhaar, s = staart
  BASE_MAP: [
    "......kk........kk......",
    ".....koOk......kOok.....",
    ".....kOpOk....kOpOk.....",
    ".....kOOooooooooOOk.....",
    ".....koddooooooddok.....",
    "....kdooooooooooodk.....",
    "....koooooooooooook.....",
    "....koooooooooooook....k",
    "....koooooooooooook...ko",
    "....koooooooooooook..ko.",
    "....koooooooooooook.ko..",
    "...knkoooooooooooookko..",
    "...knkoooooooooooookko..",
    "...kn.koooooooooookko...",
    ".....koOddooooodOokko...",
    ".....kooOooooooOoooko...",
    ".....koooOOOOOooook.o...",
    "......koOOOOOOook..o....",
    ".......kkOOOOOkk..o.....",
    ".........kkkkkk...o....."
  ],

  base(g) {
    this.BASE_MAP.forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        if (ch !== ".") this.px(g, x, y, ch === "s" ? "o" : ch);
      });
    });
  },

  // ---- emotie-overlays (op de vaste kaart) ----
  // ogen: links x=6-8, rechts x=15-17, rijen 6-8 (kaart-oppervlak is daar 'o')
  eyes(g, kind) {
    const LX = [6, 7, 8], RX = [15, 16, 17];
    if (kind === "open") {
      for (const x of LX) { this.px(g, x, 6, "w"); this.px(g, x, 7, "w"); }
      for (const x of RX) { this.px(g, x, 6, "w"); this.px(g, x, 7, "w"); }
      this.px(g, 7, 7, "e"); this.px(g, 16, 7, "e");
    } else if (kind === "closed") {
      this.px(g, 7, 6, "k"); this.px(g, 6, 7, "k"); this.px(g, 8, 7, "k");
      this.px(g, 16, 6, "k"); this.px(g, 15, 7, "k"); this.px(g, 17, 7, "k");
    } else if (kind === "sad") {
      for (const x of LX) this.px(g, x, 6, "w");
      for (const x of RX) this.px(g, x, 6, "w");
      this.px(g, 7, 7, "e"); this.px(g, 16, 7, "e");
      this.px(g, 6, 8, "k"); this.px(g, 17, 8, "k");
    } else if (kind === "star") {
      const star = [[7,5],[6,6],[7,6],[8,6],[7,7]];
      for (const [x,y] of star) { this.px(g, x, y, "e"); this.px(g, this.W-1-x, y, "e"); }
      this.px(g, 7, 6, "w"); this.px(g, 16, 6, "w");
    } else if (kind === "sleep") {
      for (const x of LX) this.px(g, x, 7, "k");
      for (const x of RX) this.px(g, x, 7, "k");
    }
  },

  mouth(g, kind) {
    // neusje
    this.px(g, 11, 8, "p"); this.px(g, 12, 8, "p");
    this.px(g, 11, 9, "p"); this.px(g, 12, 9, "p");
    if (kind === "smile") {
      this.px(g, 9, 10, "k"); this.px(g, 14, 10, "k");
      this.px(g, 10, 11, "k"); this.px(g, 11, 11, "k"); this.px(g, 12, 11, "k"); this.px(g, 13, 11, "k");
    } else if (kind === "frown") {
      this.px(g, 9, 10, "k"); this.px(g, 14, 10, "k");
      this.px(g, 10, 9, "k"); this.px(g, 13, 9, "k");
      this.px(g, 11, 10, "k"); this.px(g, 12, 10, "k");
    } else if (kind === "open") {
      this.rect(g, 10, 10, 4, 2, "k");
      this.px(g, 11, 10, "p"); this.px(g, 12, 10, "p");
    }
  },

  extras(g, mood) {
    if (mood === "happy" || mood === "excited") {
      this.rect(g, 5, 9, 2, 1, "p"); this.rect(g, 17, 9, 2, 1, "p");
    }
    if (mood === "sleepy") {
      this.px(g, 21, 4, "n"); this.px(g, 22, 3, "n"); this.px(g, 23, 2, "n");
    }
    if (mood === "excited") {
      this.px(g, 10, 1, "e"); this.px(g, 13, 0, "p"); this.px(g, 2, 5, "e");
    }
  },

  MOODS: {
    idle:    { eye: "open",   mouth: "smile" },
    happy:   { eye: "closed", mouth: "smile" },
    sad:     { eye: "sad",    mouth: "frown" },
    excited: { eye: "star",   mouth: "open"  },
    sleepy:  { eye: "sleep",  mouth: "smile" }
  },

  // ---- render: grid -> pixel-SVG ----
  pixelSVG({ size = 96, mood = "idle", id = "whiskers-svg" } = {}) {
    const g = this.blank();
    this.base(g);
    const m = this.MOODS[mood] || this.MOODS.idle;
    this.eyes(g, m.eye);
    this.mouth(g, m.mouth);
    this.extras(g, mood);

    // hongerige kat (energie < 30): denkpuntjes boven de kop
    if (mood === "idle" && typeof Gamification !== "undefined" && Gamification.state && Gamification.state.energy < 30) {
      this.px(g, 9, 0, "n"); this.px(g, 14, 1, "n"); this.px(g, 19, 0, "n");
    }

    const colors = this.skinColors();
    const pxSize = 4; // viewBox = 24*4 x 20*4
    let body = "", pupils = "";
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const ch = g[y][x];
        if (ch === ".") continue;
        const r = `<rect x="${x * pxSize}" y="${y * pxSize}" width="${pxSize}" height="${pxSize}" fill="${colors[ch] || colors.o}"/>`;
        if (ch === "e") pupils += r;
        else body += r;
      }
    }
    return `<svg id="${id}" viewBox="0 0 96 80" width="${size}" height="${Math.round(size * 80 / 96)}" shape-rendering="crispEdges" aria-hidden="true">
      <g class="cat-body">${body}</g>
      <g class="pupils" data-uid="${id}">${pupils}</g>
    </svg>`;
  },

  // voedings-moment: Whiskers eet een visje
  showFeeding() {
    const holder = document.getElementById("companion-bubble");
    if (!holder) return;
    this.say("🐟 *hap hap* Lekker visje! Bedankt!", 3500);
    this.setCompanionMood("excited");
  },

  // ---- ogen laten meekijken ----
  trackEyes() {
    document.addEventListener("mousemove", e => {
      const svg = document.getElementById("whiskers-svg") || document.getElementById("whiskers-companion-svg");
      if (!svg || !svg.getBoundingClientRect) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      const pupils = svg.querySelector(".pupils");
      if (!pupils) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.35;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const ang = Math.atan2(dy, dx);
      const near = Math.hypot(dx, dy) < 40;
      const maxOff = near ? 1.2 : 3;
      const ox = Math.cos(ang) * maxOff;
      const oy = Math.sin(ang) * maxOff * 0.6;
      pupils.style.transform = `translate(${ox}px, ${oy}px)`;
    }, { passive: true });
  },

  // ---- commentaar-regels ----
  LINES: {
    praise: ["Purrrfect! 🐾", "Miauw, dat was goed!", "Whiskers is onder de indruk!", "Knap gedaan!", "*blij gekwispel*"],
    comfort: ["Geeft niks, katten maken ook foutjes.", "Hmm, bijna! Kijk nog eens goed.", "*rekt zich uit* Probeer het nog eens.", "Niet opgeven hoor!"],
    streak: ["Wauw, wat een reeks!", "Jij bent vandaag in vorm! 🐟"],
    levelup: ["Ik voel me groter worden!", "Miauw! Wat een level!"]
  },

  pick(list) { return list[Math.floor(Math.random() * list.length)]; },

  // ---- metgezel tijdens het oefenen ----
  showCompanion() {
    const wrap = document.getElementById("whiskers-companion");
    if (wrap) { wrap.style.display = "flex"; this.setCompanionMood("idle"); return; }
    const el = document.createElement("div");
    el.id = "whiskers-companion";
    el.innerHTML = `
      <div class="companion-bubble" id="companion-bubble"></div>
      <div class="companion-cat" id="companion-cat-holder"></div>`;
    document.body.appendChild(el);
    document.getElementById("companion-cat-holder").innerHTML =
      this.pixelSVG({ size: 72, mood: "idle", id: "whiskers-companion-svg" });
    el.style.display = "flex";
  },

  hideCompanion() {
    const wrap = document.getElementById("whiskers-companion");
    if (wrap) wrap.style.display = "none";
  },

  setCompanionMood(mood) {
    const holder = document.getElementById("companion-cat-holder");
    if (!holder) return;
    holder.innerHTML = this.pixelSVG({ size: 72, mood, id: "whiskers-companion-svg" });
    holder.classList.remove("cat-bounce");
    if (mood === "happy" || mood === "excited") {
      void holder.offsetWidth;
      holder.classList.add("cat-bounce");
    }
  },

  say(text, ms = 4000) {
    const bubble = document.getElementById("companion-bubble");
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("visible");
    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => bubble.classList.remove("visible"), ms);
  },

  react(correct, streak, mistakes, explain) {
    if (correct) {
      this.setCompanionMood(streak >= 5 ? "excited" : "happy");
      if (streak >= 5) this.say(this.pick(this.LINES.streak));
      else if (Math.random() < 0.5) this.say(this.pick(this.LINES.praise));
    } else {
      this.setCompanionMood(mistakes >= 3 ? "sleepy" : "sad");
      if (explain) this.say(this.pick(this.LINES.comfort));
    }
  },

  explain(tense, hint, explainText) {
    this.setCompanionMood("idle");
    this.say(`${explainText || ""} ${hint || ""}`.trim() || "Vraag je leerkracht maar eens!", 9000);
  }
};
