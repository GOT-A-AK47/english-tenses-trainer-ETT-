// V2.2: vrienden, duels en de dagelijkse kalender (client-zijde).
// Praten met server/index.js endpoints; fallback naar niets zonder server.

const Social = {
  who() {
    const id = Identity.get();
    return id ? id.name + "|" + id.klas : null;
  },

  api(path, opts) {
    return fetch(path, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(opts && opts.headers || {}) }
    }).then(r => {
      if (!r.ok) throw new Error("server onbereikbaar");
      return r.json();
    });
  },

  // ---- vrienden ----
  async loadFriends() {
    const who = this.who();
    if (!who) return [];
    return this.api("/api/friends?who=" + encodeURIComponent(who)).catch(() => []);
  },

  async loadClassmates() {
    const id = Identity.get();
    if (!id) return [];
    return this.api(`/api/classmates?klas=${encodeURIComponent(id.klas)}&name=${encodeURIComponent(id.name)}`).catch(() => []);
  },

  // V2.6: vriendschapsverzoek (de ander accepteert)
  requestFriend(friendWho) {
    return this.api("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ me: this.who(), friend: friendWho })
    });
  },

  listRequests() {
    return this.api("/api/friends/requests?who=" + encodeURIComponent(this.who())).catch(() => []);
  },

  acceptFriend(from) {
    return this.api("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify({ me: this.who(), from })
    });
  },

  declineFriend(from) {
    return this.api("/api/friends/decline", {
      method: "POST",
      body: JSON.stringify({ me: this.who(), from })
    });
  },

  removeFriend(friendWho) {
    return this.api("/api/friends/remove", {
      method: "POST",
      body: JSON.stringify({ me: this.who(), friend: friendWho })
    });
  },

  // ---- duels ----
  newDuel(opponent) {
    return this.api("/api/duel/new", {
      method: "POST",
      body: JSON.stringify({ me: this.who(), opponent })
    }).then(r => r.duel);
  },

  listDuels() {
    return this.api("/api/duel/list?who=" + encodeURIComponent(this.who())).catch(() => []);
  },

  getDuel(id) {
    return this.api("/api/duel/get?id=" + encodeURIComponent(id));
  },

  // V2.6: join de wacht-kamer; server zegt of het duel live gaat
  joinDuel(id) {
    return this.api("/api/duel/join", {
      method: "POST",
      body: JSON.stringify({ id, who: this.who() })
    });
  },

  submitScore(id, score) {
    return this.api("/api/duel/score", {
      method: "POST",
      body: JSON.stringify({ id, who: this.who(), score })
    }).then(r => r.duel);
  },

  // Bouwt speelbare oefeningen uit de server-combinaties
  buildDuelExercises(questions) {
    return questions.map(q => ExerciseEngine.build(q.tenseId, q.subject, q.verb));
  },

  // ---- kalender ----
  loadCalendar() {
    return this.api("/api/calendar?who=" + encodeURIComponent(this.who())).catch(() => ({}));
  }
};

// Kalender-rendering: laatste 28 dagen als vinkjes-raster
const Calendar = {
  async render() {
    const holder = document.getElementById("calendar-grid");
    if (!holder) return;
    const data = await Social.loadCalendar();
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, d, stats: data[key] });
    }
    // GitHub-achtige bijdrage-raster: 4 weken x 7
    holder.innerHTML = days.map(day => {
      const s = day.stats;
      const cls = !s ? "cal-empty" :
        s.answers < 5 ? "cal-low" :
        s.answers < 15 ? "cal-mid" : "cal-high";
      const title = s
        ? `${day.d.toLocaleDateString("nl-NL")}: ${s.answers} vragen (${s.correct} goed)`
        : `${day.d.toLocaleDateString("nl-NL")}: niet geoefend`;
      return `<div class="cal-day ${cls}" title="${title}"></div>`;
    }).join("");
    const streak = this.calcStreak(data);
    const label = document.getElementById("calendar-streak");
    if (label) label.textContent = streak >= 2 ? `🔥 ${streak} dagen op rij geoefend!` : "Oefen vandaag voor je eerste vinkje!";
  },

  calcStreak(data) {
    // tel terug vanaf vandaag (of gisteren) zolang er dagen met >=1 antwoord zijn
    let streak = 0;
    const d = new Date();
    // als vandaag nog niks, mag de reeks gisteren beginnen
    if (!data[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
    while (data[d.toISOString().slice(0, 10)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
};
