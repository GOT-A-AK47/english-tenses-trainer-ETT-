// App: eenvoudig startscherm (Present/Past/Future), subtijden per groep, mix-oefeningen.
let currentExercise = null;
let currentMix = null; // array van tense-ids bij mix-modus, anders null
let repeatNext = null; // combinatie (tenseId, subject, verb) die als volgende moet komen uit de foutenlijst
let score = 0, count = 0;

const $ = id => document.getElementById(id);

// ---- Identiteit (V1.4: naam + klas uit docentlijst) ----
function fetchClassList() {
  return fetch("/api/classes/list")
    .then(r => r.ok ? r.json() : Promise.reject())
    .catch(() => null); // geen server: lokale fallback (vrije invoer)
}

function ensureIdentity() {
  if (Identity.get()) {
    updateIdentityLabel();
    loadTasks();
    return;
  }
  fetchClassList().then(classes => {
    const sel = $("id-klas");
    if (classes && classes.length) {
      sel.innerHTML = classes.map(c => `<option value="${c}">${c}</option>`).join("");
    } else {
      sel.outerHTML = '<input type="text" id="id-klas" placeholder="bv. 7B" autocomplete="off" spellcheck="false">';
    }
    $("identity-modal").style.display = "block";
    $("id-name").focus();
  });
}

function updateIdentityLabel() {
  const id = Identity.get();
  const home = document.querySelector("#view-home .lead");
  if (id && home) home.textContent = `Kies een tijd, ${id.name} (${id.klas}):`;
}

function saveIdentity() {
  const name = $("id-name").value;
  const klasEl = $("id-klas");
  const klas = klasEl.value;
  if (!name.trim() || !klas || !klas.trim()) {
    $("id-feedback").textContent = "Vul je naam in en kies een klas.";
    return;
  }
  Identity.save(name, klas);
  $("identity-modal").style.display = "none";
  updateIdentityLabel();
  ProgressStore.sync();
  loadTasks();
  toast(`Welkom, ${name.trim()}!`);
}

// ---- Taken van de leerkracht (V1.4) ----
function loadTasks() {
  const id = Identity.get();
  if (!id) return;
  fetch("/api/tasks?klas=" + encodeURIComponent(id.klas))
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(tasks => {
      const wrap = $("home-tasks");
      const grid = $("task-grid");
      if (!tasks || !tasks.length) { wrap.style.display = "none"; return; }
      wrap.style.display = "block";
      grid.innerHTML = tasks.map(t => `
        <button class="tile task-tile" data-task-mix="${t.tenseIds.join(",")}">
          <span class="tile-name">${t.title}</span>
          <span class="tile-desc">${t.tenseIds.length} tijd${t.tenseIds.length === 1 ? "" : "en"} door elkaar</span>
        </button>`).join("");
    })
    .catch(() => { $("home-tasks").style.display = "none"; });
}

// ---- Feedback (V1.5) ----
function openFeedback() {
  $("feedback-modal").style.display = "block";
  const id = Identity.get();
  $("feedback-from").textContent = id ? `Verstuurd als ${id.name} (${id.klas})` : "Verstuurd anoniem";
  $("feedback-text").focus();
}

function sendFeedback() {
  const message = $("feedback-text").value;
  if (!message.trim()) {
    $("feedback-msg").textContent = "Schrijf eerst een berichtje.";
    return;
  }
  const payload = {
    message,
    identity: Identity.get(),
    category: $("feedback-category").value
  };
  fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(r => {
      if (!r.ok) throw new Error();
      $("feedback-modal").style.display = "none";
      $("feedback-text").value = "";
      toast("Bedankt voor je feedback!");
    })
    .catch(() => {
      $("feedback-msg").textContent = "Versturen mislukt — probeer het later opnieuw.";
    });
}

// ---- Sessie bewaren (V1.5): verder waar je was ----
function saveSession() {
  const id = Identity.get();
  if (!id) return;
  localStorage.setItem("english-tenses-session", JSON.stringify({
    tenseSelect: $("tense-select").value,
    score,
    count
  }));
}

function restoreSession() {
  const id = Identity.get();
  if (!id) return;
  try {
    const sess = JSON.parse(localStorage.getItem("english-tenses-session"));
    if (!sess || !sess.tenseSelect) return;
    $("tense-select").value = sess.tenseSelect;
    currentMix = sess.tenseSelect === "mix" ? TenseRegistry.all().map(t => t.id) : null;
    score = sess.score || 0;
    count = sess.count || 0;
    $("score").textContent = score;
    $("count").textContent = count;
  } catch { /* geen sessie */ }
}

// ---- Whiskers & gamification (V1.7) ----
function showBadges() {
  Gamification.renderBadges();
  renderSkinPicker();
  $("badges-modal").style.display = "block";
}

function resetWhiskers() {
  if (!confirm("Alles van Whiskers opnieuw beginnen?\n\nJe verliest: XP, level, badges, energie en pelskeuze.\nDit kan niet ongedaan gemaakt worden.")) return;
  Gamification.resetAll();
  renderSkinPicker();
  toast("🐾 Whiskers begint opnieuw als katje!");
}

// ---- V1.9: introductie-scherm (eerste bezoek) ----
function maybeShowIntro() {
  const seen = localStorage.getItem("whiskers-intro-seen");
  if (seen) return;
  $("intro-cat").innerHTML = Whiskers.pixelSVG({ size: 120, mood: "happy", id: "intro-cat-svg" });
  $("intro-modal").style.display = "block";
}

function closeIntro() {
  localStorage.setItem("whiskers-intro-seen", "1");
  $("intro-modal").style.display = "none";
}

// ---- V1.9: pels-kiezer in het badges-scherm ----
function renderSkinPicker() {
  const holder = $("skin-picker");
  if (!holder) return;
  const cur = Whiskers.getSkin().id;
  const lvlIndex = (Gamification.LEVELS_REF || []).indexOf(Gamification.level()) + 1;
  holder.innerHTML = Whiskers.SKINS.map(s => {
    const unlocked = lvlIndex >= s.level;
    return `<button class="skin-swatch ${s.id === cur ? "selected" : ""} ${unlocked ? "" : "locked"}"
      data-skin="${s.id}" title="${s.name}${unlocked ? "" : " — bereik level " + s.level}">
      <span class="swatch" style="background:${s.fur}"></span>
      <span>${s.name}</span>
    </button>`;
  }).join("");
  holder.querySelectorAll("[data-skin]").forEach(btn => {
    btn.addEventListener("click", () => {
      const skin = Whiskers.SKINS.find(s => s.id === btn.dataset.skin);
      const lvlNow = (Gamification.LEVELS_REF || []).indexOf(Gamification.level()) + 1;
      if (lvlNow < skin.level) {
        toast(`🔒 ${skin.name} ontgrendelt op level ${skin.level}`);
        return;
      }
      Whiskers.setSkin(skin.id);
      renderSkinPicker();
      Gamification.renderWhiskers("happy");
      toast(`🐾 Whiskers draagt nu: ${skin.name}`);
    });
  });
}

// ---- V2.2: vrienden, duels, kalender ----
async function renderSocial() {
  if (!Identity.get()) return;
  const friends = await Social.loadFriends();
  const friendsList = $("friends-list");

  friendsList.innerHTML = friends.length
    ? friends.map(f => `
      <div class="friend-row">
        <span><strong>${f.name}</strong> <span class="last">${f.total} vragen · ${f.total ? Math.round(f.correct / f.total * 100) : 0}% goed</span></span>
        <button class="secondary" data-remove-friend="${f.who}">Verwijderen</button>
      </div>`).join("")
    : '<p class="empty">Nog geen vrienden — voeg er één toe uit je klas!</p>';

  friendsList.querySelectorAll("[data-remove-friend]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await Social.removeFriend(btn.dataset.removeFriend);
      renderSocial();
    });
  });

  // klasgenoten in beide selects
  const mates = await Social.loadClassmates();
  const cur = Identity.get();
  const mateOptions = ['<option value="">— kies —</option>']
    .concat(mates.map(m => `<option value="${m}|${cur.klas}">${m}</option>`)).join("");
  $("mate-select").innerHTML = mateOptions;
  const friendWhos = friends.map(f => f.who);
  $("duel-opponent").innerHTML = friendWhos.length
    ? '<option value="">— kies vriend —</option>' + friendWhos.map(f => `<option value="${f}">${f.split("|")[0]}</option>`).join("")
    : '<option value="">Eerst vrienden toevoegen</option>';

  // duellijst
  const duels = await Social.listDuels();
  const me = Social.who();
  $("duel-list").innerHTML = duels.length
    ? duels.map(d => {
        const cls = d.state !== "done" ? "" : d.winner === undefined ? "" : d.winner === "draw" ? "duel-draw" : (d.winner === me ? "duel-won" : "duel-lost");
        const scoreLabel = d.state === "done"
          ? `<span class="duel-score">${d.myScore ?? "?"} – ${d.theirScore ?? "?"}</span>`
          : d.myScore !== null
            ? `<span class="duel-score">Jij: ${d.myScore}/10 — wacht op tegenstander</span>`
            : `<button class="secondary" data-play-duel="${d.id}">Spelen</button>`;
        return `<div class="duel-item ${cls}">
          <span class="vs">⚔️ vs ${d.opponent.split("|")[0]}</span>
          ${scoreLabel}
        </div>`;
      }).join("")
    : '<p class="empty">Nog geen duels.</p>';
  $("duel-list").querySelectorAll("[data-play-duel]").forEach(btn => {
    btn.addEventListener("click", () => playDuel(btn.dataset.playDuel));
  });
}

async function addFriend() {
  const val = $("mate-select").value;
  if (!val) { $("friends-msg").textContent = "Kies eerst een klasgenoot."; return; }
  try {
    await Social.addFriend(val);
    $("friends-msg").textContent = "";
    renderSocial();
    toast("🐱 Vriend toegevoegd!");
  } catch (e) {
    $("friends-msg").textContent = "Kon vriend niet toevoegen (server bereikbaar?)";
  }
}

// ---- Duel spelen: 10 vragen in de practice-flow ----
let duelState = null;

async function startDuel() {
  const opponent = $("duel-opponent").value;
  if (!opponent) { toast("Kies eerst een vriend om tegen te duelleren."); return; }
  try {
    const duel = await Social.newDuel(opponent);
    await playDuel(duel.id);
  } catch (e) {
    toast("Duel starten mislukt — is de server bereikbaar?");
  }
}

async function playDuel(id) {
  const duel = await Social.getDuel(id);
  duelState = {
    id,
    exercises: Social.buildDuelExercises(duel.questions),
    index: 0,
    correct: 0
  };
  showView("practice");
  Whiskers.showCompanion();
  Whiskers.say("⚔️ Duel-modus! 10 vragen — ga ervoor!", 5000);
  nextDuelQuestion();
}

function nextDuelQuestion() {
  if (!duelState) return;
  if (duelState.index >= duelState.exercises.length) return finishDuel();
  const ex = duelState.exercises[duelState.index++];
  ex.isRepeat = false;
  currentExercise = ex;
  // renderen zoals newExercise dat doet
  $("tense-info").textContent = `⚔️ Duel ${duelState.index}/${duelState.exercises.length} — ${ex.tense.name}`;
  $("sentence").textContent = ex.sentence;
  $("context").textContent = "";
  $("answer").value = "";
  $("answer").classList.remove("correct", "wrong");
  $("answer").focus();
  $("feedback").textContent = "";
  $("feedback").className = "";
}

async function finishDuel() {
  const score = duelState.correct;
  const id = duelState.id;
  duelState = null;
  try {
    const result = await Social.submitScore(id, score);
    if (result.state === "done") {
      const me = Social.who();
      if (result.winner === "draw") { toast("🤝 Gelijkspel!"); Whiskers.say("Gelijkspel — eerlijk gedeeld!", 6000); }
      else if (result.winner === me) { toast("🏆 Je hebt het duel gewonnen!"); Whiskers.say("Gewonnennn! 🏆", 6000); Gamification.addXP(50); }
      else { toast("😈 Verloren... revanche?"); Whiskers.say("Jammer — volgende keer beter!", 6000); Gamification.addXP(15); }
    } else {
      toast(`Score ingediend: ${score}/10 — wacht op je tegenstander!`);
    }
  } catch (e) {
    toast("Score kon niet indienen (offline?) — jammer!");
  }
  showView("social");
  renderSocial();
}

function init() {
  initTenseSelectors();
  IrregularTrainer.init();
  renderIrregularList();
  bindNavigation();
  handleTaskLink();
  ensureIdentity();
  restoreSession();
  $("id-save").addEventListener("click", saveIdentity);
  $("feedback-btn").addEventListener("click", openFeedback);
  $("feedback-send").addEventListener("click", sendFeedback);
  $("feedback-cancel").addEventListener("click", () => $("feedback-modal").style.display = "none");
  $("feedback-text").addEventListener("keydown", e => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendFeedback(); }
  });
  window.addEventListener("beforeunload", saveSession);
  Gamification.init();
  Whiskers.trackEyes();
  maybeShowIntro();
  $("intro-close").addEventListener("click", closeIntro);
  $("whiskers").addEventListener("click", showBadges);
  $("badges-close").addEventListener("click", () => $("badges-modal").style.display = "none");
  $("badges-reset").addEventListener("click", resetWhiskers);
  $("add-friend").addEventListener("click", addFriend);
  $("start-duel").addEventListener("click", startDuel);
  Calendar.render();
  $("id-name").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); saveIdentity(); }
  });
}

// ---- Navigatie ----
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $("view-" + id).classList.add("active");
  window.scrollTo(0, 0);
  if (id === "practice") $("answer").focus();
  if (id === "irregular") $("irr-past").focus();
  if (id === "progress") renderProgress();
  if (id === "table") renderTable();
  if (id === "social") renderSocial();
}

function bindNavigation() {
  document.querySelectorAll("[data-view]").forEach(el => {
    el.addEventListener("click", () => { showView(el.dataset.view); if (el.dataset.view !== "practice") Whiskers.hideCompanion(); });
  });
  document.querySelectorAll("[data-group]").forEach(el => {
    el.addEventListener("click", () => openGroup(el.dataset.group));
  });
  const repeatTile = document.querySelector('[data-action="repeat"]');
  if (repeatTile) repeatTile.addEventListener("click", repeatPractice);
  const customTile = document.querySelector('[data-action="custom"]');
  if (customTile) customTile.addEventListener("click", () => { renderCustom(); showView("custom"); });
  const startBtn = document.getElementById("start-custom");
  if (startBtn) startBtn.addEventListener("click", startCustom);
}

// ---- Groepen (Present/Past/Future) ----
function openGroup(groupId) {
  const group = TENSE_GROUPS.find(g => g.id === groupId);
  if (!group) return;
  $("group-lead").textContent = `${group.name}: kies wat je wilt oefenen`;
  $("group-tense-grid").innerHTML = group.tenses.map(id => {
    const t = TenseRegistry.get(id);
    if (!t) return "";
    const s = ProgressStore.get(id);
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : null;
    const badge = pct === null
      ? `<span class="tile-score muted">nog niet geoefend</span>`
      : `<span class="tile-score">${s.correct}/${s.total} · ${pct}%</span>`;
    return `<button class="tile tense-tile" style="--tile:${t.color}" data-tense="${id}">
      <span class="tile-name">${t.name}</span>
      <span class="tile-desc">${t.hint()}</span>
      ${badge}
    </button>`;
  }).join("");
  $("group-mix-grid").innerHTML =
    `<button class="tile mix-tile" data-mix="${group.tenses.join(",")}">
      <span class="tile-name">Mix: alle ${group.name}-tijden</span>
      <span class="tile-desc">De 4 tijden door elkaar</span>
    </button>`;
  showView("group");
}

// tiles met losse tijd of mix: event delegation (grid wordt dynamisch gevuld)
document.addEventListener("click", e => {
  const tenseTile = e.target.closest("[data-tense]");
  if (tenseTile && tenseTile.dataset.tense) {
    startPractice(tenseTile.dataset.tense, null);
    return;
  }
  const mixTile = e.target.closest("[data-mix]");
  if (mixTile && mixTile.dataset.mix) {
    startPractice("mix", mixTile.dataset.mix.split(","));
    return;
  }
  const taskTile = e.target.closest("[data-task-mix]");
  if (taskTile && taskTile.dataset.taskMix) {
    startPractice("mix", taskTile.dataset.taskMix.split(","));
  }
});

// ---- Whiskers metgezel (V1.8) ----
function whiskersExplain() {
  const t = currentExercise ? TenseRegistry.get(currentExercise.tense.id) : null;
  if (!t) return;
  Whiskers.explain(t.id, t.hint(), t.explain);
}

function startPractice(tenseId, mixIds) {
  currentMix = mixIds;
  if (mixIds) {
    $("tense-select").value = "mix";
  } else {
    $("tense-select").value = tenseId;
  }
  newExercise();
  showView("practice");
  Whiskers.showCompanion();
}

// ---- Selects ----
function initTenseSelectors() {
  let opts = `<option value="mix">Mix (alle tijden)</option>`;
  TENSE_GROUPS.forEach(g => {
    opts += `<optgroup label="${g.name}">` +
      g.tenses.map(id => {
        const t = TenseRegistry.get(id);
        return t ? `<option value="${id}">${t.name}</option>` : "";
      }).join("") + `</optgroup>`;
  });
  $("tense-select").innerHTML = opts;
  $("table-select").innerHTML =
    TenseRegistry.all().map(t => `<option value="${t.id}">${t.name}</option>`).join("");
  $("tense-select").addEventListener("change", () => {
    currentMix = $("tense-select").value === "mix"
      ? TenseRegistry.all().map(t => t.id)
      : null;
    newExercise();
  });
  $("table-select").addEventListener("change", renderTable);
}

// ---- Oefenen ----
function newExercise() {
  if (repeatNext) {
    const m = repeatNext;
    repeatNext = null;
    currentExercise = ExerciseEngine.build(m.tenseId, m.subject, m.verb);
    currentExercise.isRepeat = true;
    $("tense-select").value = m.tenseId;
    currentMix = null;
  } else {
    const sel = $("tense-select").value;
    let mixIds = null;
    if (sel === "mix") {
      mixIds = currentMix && currentMix.length
        ? currentMix
        : TenseRegistry.all().map(t => t.id);
    }
    currentExercise = ExerciseEngine.generate(sel === "mix" ? null : sel, mixIds);
    currentExercise.isRepeat = false;
  }
  $("tense-info").textContent = currentExercise.tense.name;
  $("sentence").textContent = currentExercise.sentence;
  $("context").textContent = "";
  $("answer").value = "";
  $("answer").classList.remove("correct", "wrong");
  $("answer").focus();
  $("feedback").textContent = "";
  $("feedback").className = "";
}

function checkAnswer() {
  if (!currentExercise) return;
  const isRepeat = !!currentExercise.isRepeat;
  const input = $("answer");
  const ok = currentExercise.check(input.value);
  count++;
  if (ok) {
    score++;
    input.classList.add("correct");
    $("feedback").textContent = `Juist! "${currentExercise.answer}"`;
    $("feedback").className = "ok";
  } else {
    input.classList.add("wrong");
    $("feedback").textContent = `Fout. Het juiste antwoord is "${currentExercise.answer}". ${currentExercise.explain || ""}`;
    $("feedback").className = "nok";
  }
  ProgressStore.record(currentExercise.tense.id, ok);
  ProgressStore.queueAnswer(currentExercise.tense.id, ok);
  Gamification.onAnswer(currentExercise.tense.id, ok);
  Whiskers.react(ok, Gamification._rowStreak, Gamification._mistakes, currentExercise.tense.explain);
  ProgressStore.sync();
  if (!ok) {
    MistakeStore.add(currentExercise.tense.id, currentExercise.subject, currentExercise.verb);
  } else if (isRepeat) {
    MistakeStore.remove(currentExercise.tense.id, currentExercise.subject, currentExercise.verb);
    const next = MistakeStore.takeNext();
    if (next) {
      repeatNext = next;
    } else {
      toast("Alle fouten zijn herhaald! ");
    }
  }
  updateMistakeBadge();
  $("score").textContent = score;
  $("count").textContent = count;

  // V2.2: duel-modus — na elk antwoord door naar de volgende vraag
  if (duelState && currentExercise) {
    if (ok) duelState.correct++;
    duelState.timer = setTimeout(nextDuelQuestion, ok ? 700 : 1800);
  }
}

function showHint() {
  if (!currentExercise) return;
  $("feedback").textContent = `Hint: ${currentExercise.hint}`;
  $("feedback").className = "";
}

// ---- Taken delen ----
function shareTask() {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  const mixStr = currentMix ? currentMix.join(",") : null;
  if (mixStr) url.searchParams.set("mix", mixStr);
  else if ($("tense-select").value !== "mix") url.searchParams.set("tense", $("tense-select").value);
  url.searchParams.set("task", "practice");
  const link = url.toString();
  navigator.clipboard.writeText(link)
    .then(() => toast("Link gekopieerd — deel hem met je klas! "))
    .catch(() => prompt("Kopieer deze link:", link));
}

function handleTaskLink() {
  const params = new URLSearchParams(location.search);
  const tense = params.get("tense");
  const mix = params.get("mix");
  const task = params.get("task");
  if (task === "irregular") return showView("irregular");
  if (task === "table") return showView("table");
  if (mix && mix.split(",").every(id => TenseRegistry.get(id))) {
    startPractice("mix", mix.split(","));
  } else if (tense && TenseRegistry.get(tense)) {
    startPractice(tense, null);
  }
}

// ---- Naslagtabel ----
function renderTable() {
  const rows = ConjugationTable.build($("table-select").value);
  if (!rows) return;
  $("conj-table").querySelector("tbody").innerHTML = rows.map(r =>
    `<tr><td>${r.subject}</td><td>${r.form}</td></tr>`).join("");
}

// ---- Onregelmatige werkwoorden ----
function renderIrregularList() {
  const rows = IRREGULAR_VERBS.map(v =>
    `<tr><td>${v.base}</td><td>${v.past}</td><td>${v.pastParticiple}</td></tr>`).join("");
  $("irr-table").querySelector("tbody").innerHTML = rows;
}

function nextIrregular() {
  IrregularTrainer.next();
  $("irr-base").textContent = IrregularTrainer.current().base;
  $("irr-past").value = "";
  $("irr-pp").value = "";
  $("irr-past").classList.remove("correct", "wrong");
  $("irr-pp").classList.remove("correct", "wrong");
  $("irr-feedback").textContent = "";
  $("irr-feedback").className = "";
  $("irr-past").focus();
}

function checkIrregular() {
  const result = IrregularTrainer.check($("irr-past").value, $("irr-pp").value);
  $("irr-past").classList.add(result.pastOk ? "correct" : "wrong");
  $("irr-pp").classList.add(result.ppOk ? "correct" : "wrong");
  if (result.pastOk && result.ppOk) {
    $("irr-feedback").textContent = "Allebei juist! ";
    $("irr-feedback").className = "ok";
  } else {
    $("irr-feedback").textContent =
      `Juist is: ${IrregularTrainer.current().base} — ${result.past} — ${result.pp}`;
    $("irr-feedback").className = "nok";
  }
  $("irr-score").textContent = IrregularTrainer.score;
  $("irr-total").textContent = IrregularTrainer.total;
}

// ---- Zelf kiezen ----
function renderCustom() {
  $("custom-groups").innerHTML = TENSE_GROUPS.map(g => `
    <div class="custom-group">
      <div class="custom-group-title">${g.name}</div>
      <div class="custom-options">
        ${g.tenses.map(id => {
          const t = TenseRegistry.get(id);
          if (!t) return "";
          return `<label class="check"><input type="checkbox" value="${id}"> ${t.name}</label>`;
        }).join("")}
      </div>
    </div>`).join("");
  $("custom-feedback").textContent = "";
}

function startCustom() {
  const checked = [...document.querySelectorAll("#custom-groups input:checked")]
    .map(i => i.value).filter(id => TenseRegistry.get(id));
  if (!checked.length) {
    $("custom-feedback").textContent = "Vink minstens één tijd aan.";
    return;
  }
  startPractice("mix", checked);
}

// ---- Fouten herhalen ----
function repeatPractice() {
  const next = MistakeStore.takeNext();
  if (!next) {
    toast("Geen fouten om te herhalen! ");
    return;
  }
  repeatNext = next;
  currentMix = null;
  score = 0;
  count = 0;
  $("score").textContent = "0";
  $("count").textContent = "0";
  newExercise();
  showView("practice");
  Whiskers.showCompanion();
}

function updateMistakeBadge() {
  const n = MistakeStore.count();
  const el = $("mistake-badge");
  if (el) el.textContent = n > 0 ? n : "";
  const tile = document.getElementById("mistake-tile");
  if (tile) tile.style.display = n > 0 ? "flex" : "none";
}

// ---- Voortgang ----
function renderProgress() {
  $("progress-list").innerHTML = TENSE_GROUPS.map(g => {
    const rows = g.tenses.map(id => {
      const t = TenseRegistry.get(id);
      if (!t) return "";
      const s = ProgressStore.get(id);
      const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
      return `<tr>
        <td class="prog-name">${t.name}</td>
        <td class="prog-bar"><div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div></td>
        <td class="prog-num">${s.correct}/${s.total}</td>
        <td class="prog-pct">${pct}%</td>
      </tr>`;
    }).join("");
    return `<h3 class="progress-group">${g.name}</h3>
      <table class="progress-table"><tbody>${rows}</tbody></table>`;
  }).join("");
}

// ---- Toast ----
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  updateMistakeBadge();
  $("check").addEventListener("click", checkAnswer);
  $("next").addEventListener("click", newExercise);
  $("show-hint").addEventListener("click", showHint);
  $("show-hint").addEventListener("click", whiskersExplain);
  $("share").addEventListener("click", shareTask);
  $("repeat-btn") && $("repeat-btn").addEventListener("click", repeatPractice);
  $("irr-check").addEventListener("click", checkIrregular);
  $("irr-next").addEventListener("click", nextIrregular);
  $("reset-progress").addEventListener("click", () => {
    ProgressStore.reset();
    renderProgress();
    toast("Voortgang gewist");
  });
  $("answer").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); checkAnswer(); newExercise(); }
  });
  ["irr-past", "irr-pp"].forEach(id => {
    $(id).addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); checkIrregular(); nextIrregular(); }
    });
  });
  nextIrregular();
});
