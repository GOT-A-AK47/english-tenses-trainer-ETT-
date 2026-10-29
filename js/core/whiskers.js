// Whiskers 2.0 (V1.8): vectorkat in hoge resolutie, ogen die meekijken,
// commentaar tijdens het oefenen en uitleg over de grammaticaregels.

const Whiskers = {
  // ---- commentaar-regels ----
  LINES: {
    praise: [
      "Purrrfect! 🐾",
      "Miauw, dat was goed!",
      "Whiskers is onder de indruk!",
      "Knap gedaan!",
      "*blij gekwispel*"
    ],
    comfort: [
      "Geeft niks, katten maken ook foutjes.",
      "Hmm, bijna! Kijk nog eens goed.",
      "*rekt zich uit* Probeer het nog eens.",
      "Niet opgeven hoor!"
    ],
    streak: ["Wauw, wat een reeks!", "Jij bent vandaag in vorm! 🐟"],
    levelup: ["Ik voel me groter worden!", "Miauw! Wat een level!"],
    encourage: [
      "Kom op, nog één goeie!",
      "Je kunt het!",
      "Nog even en de quest is binnen 🎣"
    ]
  },

  pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  },

  // ---- hoogwaardige SVG-kat ----
  // eye: "open" | "closed" | "star" | "sleep" ; mouth: "smile" | "frown" | "open"
  svg({ size = 96, mood = "idle", id = "whiskers-svg", interactive = false } = {}) {
    const eyeStates = {
      idle:    { eye: "open",  mouth: "smile", ears: 0,  blush: 0 },
      happy:   { eye: "closed", mouth: "smile", ears: 5,  blush: 1 },
      sad:     { eye: "open",  mouth: "frown", ears: -14, blush: 0 },
      excited: { eye: "star",  mouth: "open",  ears: 8,  blush: 1 },
      sleepy:  { eye: "sleep", mouth: "smile", ears: 2,  blush: 0 }
    };
    const st = eyeStates[mood] || eyeStates.idle;
    const uid = id;

    const eyes = {
      open: `
        <g class="pupil-anchor">
          <ellipse cx="36" cy="44" rx="7.5" ry="8.5" fill="#fff"/>
          <ellipse cx="60" cy="44" rx="7.5" ry="8.5" fill="#fff"/>
          <g class="pupils" data-uid="${uid}">
            <circle class="pupil" cx="36" cy="44" r="4.2" fill="#1d4fae"/>
            <circle class="pupil" cx="60" cy="44" r="4.2" fill="#1d4fae"/>
            <circle cx="37.5" cy="42" r="1.3" fill="#fff"/>
            <circle cx="61.5" cy="42" r="1.3" fill="#fff"/>
          </g>
        </g>`,
      closed: `
        <path d="M29 45 Q36 40 43 45" stroke="#21201c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M53 45 Q60 40 67 45" stroke="#21201c" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
      star: `
        <path d="M36 38 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2z" fill="#1d4fae"/>
        <path d="M60 38 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2z" fill="#1d4fae"/>`,
      sleep: `
        <path d="M29 45 h14" stroke="#21201c" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M53 45 h14" stroke="#21201c" stroke-width="2.2" stroke-linecap="round"/>
        <text x="76" y="30" font-size="12" fill="#5a6478">z</text>
        <text x="84" y="22" font-size="9" fill="#5a6478">z</text>`
    };

    const mouths = {
      smile: `<path d="M44 62 Q48 67 52 62" stroke="#21201c" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      frown: `<path d="M44 65 Q48 60 52 65" stroke="#21201c" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      open:  `<path d="M43 60 Q48 68 53 60 Q48 63 43 60z" fill="#c94040"/>`
    };

    const blush = st.blush ? `
      <ellipse cx="28" cy="54" rx="4.5" ry="2.8" fill="#ff8fa3" opacity="0.7"/>
      <ellipse cx="68" cy="54" rx="4.5" ry="2.8" fill="#ff8fa3" opacity="0.7"/>` : "";

    return `<svg id="${uid}" viewBox="0 0 96 96" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <radialGradient id="fur-${uid}" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#ffc25e"/>
          <stop offset="70%" stop-color="#f4a742"/>
          <stop offset="100%" stop-color="#d17f1f"/>
        </radialGradient>
      </defs>
      <g class="cat-root">
        <!-- staart -->
        <path d="M76 76 Q92 74 90 60 Q89 68 74 68" fill="url(#fur-${uid})" stroke="#b56a12" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- lijf -->
        <ellipse cx="52" cy="78" rx="26" ry="14" fill="url(#fur-${uid})" stroke="#b56a12" stroke-width="1.5"/>
        <!-- poten -->
        <ellipse cx="42" cy="88" rx="6" ry="4" fill="#ffd9a0" stroke="#b56a12" stroke-width="1"/>
        <ellipse cx="62" cy="88" rx="6" ry="4" fill="#ffd9a0" stroke="#b56a12" stroke-width="1"/>
        <!-- kop -->
        <g class="cat-head" style="transform-origin:48px 46px">
          <!-- oren -->
          <path d="M24 26 L30 8 L42 20 Z" fill="url(#fur-${uid})" stroke="#b56a12" stroke-width="1.5" stroke-linejoin="round" transform="rotate(${st.ears} 30 20)"/>
          <path d="M54 20 L66 8 L72 26 Z" fill="url(#fur-${uid})" stroke="#b56a12" stroke-width="1.5" stroke-linejoin="round" transform="rotate(${-st.ears} 66 20)"/>
          <path d="M28 22 L31 13 L37 19 Z" fill="#ff8fa3"/>
          <path d="M59 19 L65 13 L68 22 Z" fill="#ff8fa3"/>
          <circle cx="48" cy="46" r="28" fill="url(#fur-${uid})" stroke="#b56a12" stroke-width="1.5"/>
          <!-- snuit-markering -->
          <path d="M48 38 q-9 6 -6 14 q3 7 6 -2 q3 9 6 2 q3 -8 -6 -14z" fill="#ffe9c7" opacity="0.85"/>
          ${eyes[st.eye]}
          ${blush}
          <!-- neus -->
          <path d="M45.5 55 L50.5 55 L48 58.5 Z" fill="#ff8fa3" stroke="#d96a85" stroke-width="0.8"/>
          ${mouths[st.mouth]}
          <!-- snorharen -->
          <g stroke="#6e6a60" stroke-width="1.1" stroke-linecap="round" opacity="0.85">
            <path d="M20 52 h11" /><path d="M20 56 l11 2"/>
            <path d="M76 52 h-11" /><path d="M76 56 l-11 2"/>
          </g>
        </g>
      </g>
    </svg>`;
  },

  // ---- ogen laten meekijken ----
  trackEyes() {
    document.addEventListener("mousemove", e => {
      const svg = document.getElementById("whiskers-svg") || document.getElementById("whiskers-companion-svg");
      if (!svg) return;
      const pupils = svg.querySelector(".pupils");
      if (!pupils) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      // centrum van de ogen
      const cx = rect.left + rect.width * (48 / 96);
      const cy = rect.top + rect.height * (46 / 96);
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.min(28, Math.hypot(dx, dy));
      const ang = Math.atan2(dy, dx);
      const maxOff = 2.6;
      const ox = Math.cos(ang) * maxOff * (dist > 8 ? 1 : dist / 8);
      const oy = Math.sin(ang) * maxOff * (dist > 8 ? 1 : dist / 8);
      pupils.style.transform = `translate(${ox}px, ${oy}px)`;
    }, { passive: true });
  },

  // ---- metgezel tijdens het oefenen ----
  companionMood: "idle",

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
      this.svg({ size: 72, mood: "idle", id: "whiskers-companion-svg" });
  },

  hideCompanion() {
    const wrap = document.getElementById("whiskers-companion");
    if (wrap) wrap.style.display = "none";
  },

  setCompanionMood(mood) {
    const holder = document.getElementById("companion-cat-holder");
    if (!holder) return;
    this.companionMood = mood;
    holder.innerHTML = this.svg({ size: 72, mood, id: "whiskers-companion-svg" });
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

  // ---- reacties op antwoorden ----
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

  // ---- regel uitleggen ----
  explain(tense, hint, explainText) {
    this.setCompanionMood("idle");
    this.say(`${explainText || ""} ${hint || ""}`.trim() || "Vraag je leerkracht maar eens!", 9000);
  }
};
