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

// V2.3: bestaat deze leerling nog op de server? Zo niet: opnieuw inloggen.
// (Offline of geen identiteit: gewoon doorgaan — verwijderd worden merk je
// alleen als de server expliciet zegt dat je er niet meer bent.)
function verifyIdentity() {
  const id = Identity.get();
  if (!id) return;
  fetch(`/api/student/exists?name=${encodeURIComponent(id.name)}&klas=${encodeURIComponent(id.klas)}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      if (data && data.exists === false) {
        Identity.clear();
        MistakeStore.clear();
        try { localStorage.removeItem("english-tenses-session"); } catch {}
        toast("Your account no longer exists — please log in again.");
        ensureIdentity();
      }
    })
    .catch(() => { /* server onbereikbaar: lokaal verder */ });
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
  if (id && home) home.textContent = `Choose a tense, ${id.name} (${id.klas}):`;
}

function saveIdentity() {
  const name = $("id-name").value;
  const klasEl = $("id-klas");
  const klas = klasEl.value;
  if (!name.trim() || !klas || !klas.trim()) {
    $("id-feedback").textContent = "Enter your name and choose a class.";
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
  fetch("/api/tasks?klas=" + encodeURIComponent(id.klas) + "&name=" + encodeURIComponent(id.name))
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
    $("feedback-msg").textContent = "Please write a message first.";
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
      $("feedback-msg").textContent = "Sending failed — please try again later.";
    });
}

// ---- Sessie bewaren (V1.5): verder waar je was ----
function saveSession() {
  const id = Identity.get();
  if (!id) return;
  // V2.8: alleen de gekozen tijd bewaren — score/count starten per sessie op 0
  localStorage.setItem("english-tenses-session", JSON.stringify({
    tenseSelect: $("tense-select").value
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
    // V2.8: sessie-score begint altijd op 0; totalen staan in de voortgang
  } catch { /* geen sessie */ }
}

// ---- Whiskers & gamification (V1.7) ----
function showBadges() {
  Gamification.renderBadges();
  renderSkinPicker();
  $("badges-modal").style.display = "block";
}

function resetWhiskers() {
  if (!confirm("Start over with Whiskers?\n\nYou will lose: XP, level, badges, energy and fur choice.\nThis cannot be undone.")) return;
  Gamification.resetAll();
  renderSkinPicker();
  toast("🐾 Whiskers starts over as a kitten!");
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
      data-skin="${s.id}" title="${s.name}${unlocked ? "" : " — reach level " + s.level}">
      <span class="swatch" style="background:${s.fur}"></span>
      <span>${s.name}</span>
    </button>`;
  }).join("");
  holder.querySelectorAll("[data-skin]").forEach(btn => {
    btn.addEventListener("click", () => {
      const skin = Whiskers.SKINS.find(s => s.id === btn.dataset.skin);
      const lvlNow = (Gamification.LEVELS_REF || []).indexOf(Gamification.level()) + 1;
      if (lvlNow < skin.level) {
        toast(`🔒 ${skin.name} unlocks at level ${skin.level}`);
        return;
      }
      Whiskers.setSkin(skin.id);
      renderSkinPicker();
      Gamification.renderWhiskers("happy");
      toast(`🐾 Whiskers now wears: ${skin.name}`);
    });
  });
}

// ---- V3.3: Tense detective ----
function initDetective() {
  if (!$("detective-check")) return;
  // V3.4: tense-keuze (checkboxes per groep, leeg = alles)
  const picks = $("detective-tense-picks");
  if (picks) {
    picks.innerHTML = TENSE_GROUPS.map(g =>
      `<div class="custom-group"><div class="custom-group-title">${g.name}</div>
       <div class="custom-options">${g.tenses.map(id => {
         const t = TenseRegistry.get(id);
         return `<label><input type="checkbox" value="${id}" class="det-tense-check"> ${t ? t.name : id}</label>`;
       }).join("")}</div></div>`).join("");
  }
  const startBtn = $("detective-start");
  if (startBtn) startBtn.addEventListener("click", startDetective);
  $("detective-check").addEventListener("click", checkDetective);
  $("detective-hint").addEventListener("click", () => {
    const fb = DetectiveTrainer.reveal();
    $("detective-feedback").textContent = fb.text;
    $("detective-feedback").className = fb.className;
    $("detective-next").style.display = "inline-block";
  });
  $("detective-next").addEventListener("click", nextDetective);
  $("detective-answer").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); checkDetective(); }
  });
}

function startDetective() {
  const chosen = [...document.querySelectorAll(".det-tense-check:checked")].map(i => i.value);
  DetectiveTrainer.init(chosen.length ? chosen : null);
  $("detective-picker-card").style.display = "none";
  $("detective-practice-card").style.display = "block";
  Whiskers.showCompanion();
  nextDetective();
}

function nextDetective() {
  const item = DetectiveTrainer.next();
  $("detective-sentence").textContent = item.sentence;
  $("detective-answer").value = "";
  $("detective-answer").classList.remove("correct", "wrong");
  $("detective-answer").focus();
  $("detective-answer").scrollIntoView({ block: "center" });
  $("detective-feedback").textContent = "";
  $("detective-feedback").className = "";
  $("detective-next").style.display = "none";
}

function checkDetective() {
  const input = $("detective-answer");
  if (!DetectiveTrainer.current) return;
  if (input.classList.contains("correct")) { nextDetective(); return; }
  const ok = DetectiveTrainer.check(input.value);
  const tenseName = TenseRegistry.get(DetectiveTrainer.current.tenseId).name;
  const fb = DetectiveTrainer.feedback(ok, tenseName);
  $("detective-feedback").textContent = fb.text;
  $("detective-feedback").className = fb.className;
  input.classList.add(ok ? "correct" : "wrong");
  if (ok && DetectiveTrainer.hintUsed) {
    // antwoord stond al in beeld via de hint -> telt niet als verdienste
    input.classList.remove("wrong");
    input.classList.add("correct");
    $("detective-feedback").textContent = `Right — but the answer was already revealed. No points this time. ${fb.text}`;
    $("detective-feedback").className = "nok";
    $("detective-next").style.display = "inline-block";
    $("detective-next").focus();
  } else if (ok) {
    input.classList.remove("wrong");
    input.classList.add("correct");
    $("detective-next").style.display = "inline-block";
    $("detective-next").focus();
    Whiskers.react(true, 1, 0, null);
    Gamification.addXP(12); // detective is moeilijker -> meer XP
    ProgressStore.record(DetectiveTrainer.current.tenseId, true);
    ProgressStore.queueAnswer(DetectiveTrainer.current.tenseId, true);
    ProgressStore.sync();
    if (!duelState) Calendar.render();
  } else {
    input.select();
    if (DetectiveTrainer.attempts >= 3) $("detective-next").style.display = "inline-block";
    Whiskers.react(false, 0, DetectiveTrainer.attempts, null);
    Gamification.addXP(2);
    ProgressStore.record(DetectiveTrainer.current.tenseId, false);
    ProgressStore.queueAnswer(DetectiveTrainer.current.tenseId, false);
    ProgressStore.sync();
  }
}

// ---- V2.5: vocabulaire oefenen ----
function initVocab() {
  const sel = $("vocab-list");
  if (!sel) return;
  sel.innerHTML = VOCAB_LISTS.map(l =>
    `<option value="${l.id}">${l.name} (${l.words.length} woorden)</option>`).join("");
  sel.addEventListener("change", updateVocabDesc);
  updateVocabDesc();
  $("vocab-start").addEventListener("click", startVocab);
  $("vocab-check").addEventListener("click", checkVocab);
  $("vocab-hint").addEventListener("click", () => {
    VocabTrainer.hint($("vocab-feedback"));
    $("vocab-next").style.display = "inline-block";
  });
  $("vocab-next").addEventListener("click", nextVocab);
  $("vocab-answer").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); checkVocab(); }
  });
}

function updateVocabDesc() {
  const l = VOCAB_LISTS.find(x => x.id === $("vocab-list").value);
  $("vocab-list-desc").textContent = l ? l.desc || "" : "";
}

function startVocab() {
  const listId = $("vocab-list").value;
  if (!VOCAB_LISTS.some(l => l.id === listId)) return;
  $("vocab-picker-card").style.display = "none";
  $("vocab-practice-card").style.display = "block";
  Whiskers.showCompanion();
  nextVocab();
}

function nextVocab() {
  const listId = $("vocab-list").value;
  const ex = VocabTrainer.generate(listId);
  if (!ex) return;
  $("vocab-question").textContent = `How do you say "${ex.word.nl}" in English?`;
  $("vocab-answer").value = "";
  $("vocab-answer").classList.remove("correct", "wrong");
  $("vocab-answer").focus();
  $("vocab-answer").scrollIntoView({ block: "center" });
  $("vocab-feedback").textContent = "";
  $("vocab-feedback").className = "";
  $("vocab-next").style.display = "none";
}

function checkVocab() {
  const input = $("vocab-answer");
  if (!VocabTrainer.current) return;
  // al goed? volgende
  if (input.classList.contains("correct")) { nextVocab(); return; }
  const ok = VocabTrainer.submit(input.value, $("vocab-feedback"));
  input.classList.add(ok ? "correct" : "wrong");
  if (ok && VocabTrainer.hintUsed) {
    // antwoord stond al in beeld via de hint -> telt niet als verdienste
    input.classList.remove("wrong");
    $("vocab-feedback").textContent = `Right — but the answer was already revealed. No points this time.`;
    $("vocab-feedback").className = "nok";
    $("vocab-next").style.display = "inline-block";
    $("vocab-next").focus();
  } else if (ok) {
    input.classList.remove("wrong");
    $("vocab-next").style.display = "inline-block";
    $("vocab-next").focus();
    Whiskers.react(true, 1, 0, null);
    Gamification.addXP(8);
    ProgressStore.queueAnswer("vocab-" + VocabTrainer.current.list.id, true);
    ProgressStore.sync();
  } else {
    input.select();
    if (VocabTrainer.attempts >= 3) $("vocab-next").style.display = "inline-block";
    Whiskers.react(false, 0, VocabTrainer.attempts, null);
    Gamification.addXP(2);
    ProgressStore.queueAnswer("vocab-" + VocabTrainer.current.list.id, false);
    ProgressStore.sync();
  }
}

// Security (V3.0): HTML-escaping voor alle gebruikersnamen in innerHTML
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

// ---- V2.2: vrienden, duels, kalender ----
async function renderSocial() {
  if (!Identity.get()) return;
  renderRequests();
  const friends = await Social.loadFriends();
  const friendsList = $("friends-list");

  friendsList.innerHTML = friends.length
    ? friends.map(f => `
      <div class="friend-row">
        <span><strong>${esc(f.name)}</strong> <span class="last">${f.total} vragen · ${f.total ? Math.round(f.correct / f.total * 100) : 0}% goed</span></span>
        <button class="secondary" data-remove-friend="${f.who}">Remove</button>
      </div>`).join("")
    : '<p class="empty">No friends yet — add one from your class!</p>';

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
    .concat(mates.map(m => `<option value="${esc(m)}|${esc(cur.klas)}">${esc(m)}</option>`)).join("");
  $("mate-select").innerHTML = mateOptions;
  const friendWhos = friends.map(f => f.who);
  $("duel-opponent").innerHTML = friendWhos.length
    ? '<option value="">— choose a friend —</option>' + friendWhos.map(f => `<option value="${esc(f)}">${esc(f.split("|")[0])}</option>`).join("")
    : '<option value="">Eerst vrienden toevoegen</option>';

  // duellijst
  const duels = await Social.listDuels();
  const me = Social.who();
  $("duel-list").innerHTML = duels.length
    ? duels.map(d => {
        const cls = d.state !== "done" ? "" : d.winner === undefined ? "" : d.winner === "draw" ? "duel-draw" : (d.winner === me ? "duel-won" : "duel-lost");
        const scoreLabel = d.state === "done"
          ? `<span class="duel-score">${d.myScore ?? "?"} – ${d.theirScore ?? "?"}</span>`
          : d.state === "waiting"
            ? `<button class="secondary" data-play-duel="${d.id}">Waiting room — join</button>`
            : d.myScore !== null
              ? `<span class="duel-score">You: ${d.myScore}/10 — waiting for opponent</span>`
              : `<button class="secondary" data-play-duel="${d.id}">Play</button>`;
        return `<div class="duel-item ${cls}">
          <span class="vs">⚔️ vs ${esc(d.opponent.split("|")[0])}</span>
          ${scoreLabel}
        </div>`;
      }).join("")
    : '<p class="empty">No duels yet.</p>';
  $("duel-list").querySelectorAll("[data-play-duel]").forEach(btn => {
    btn.addEventListener("click", () => playDuel(btn.dataset.playDuel));
  });
}

async function addFriend() {
  const val = $("mate-select").value;
  if (!val) { $("friends-msg").textContent = "Please choose a classmate first."; return; }
  try {
    await Social.requestFriend(val);
    $("friends-msg").textContent = "";
    renderSocial();
    toast("📨 Friend request sent!");
  } catch (e) {
    try {
      const err = await e;
      $("friends-msg").textContent = err && err.error ? err.error : "Verzoek mislukt";
    } catch { $("friends-msg").textContent = "Could not send the request (is the server online?)"; }
  }
}

// V2.6: openstaande vriendschapsverzoeken renderen met accepteren/afwijzen
async function renderRequests() {
  const box = $("requests-list");
  if (!box) return;
  const reqs = await Social.listRequests();
  if (!reqs.length) { box.style.display = "none"; return; }
  box.style.display = "block";
  box.innerHTML = `
    <h3 class="section-title">Friend requests (${reqs.length})</h3>
    ${reqs.map(from => `
      <div class="friend-row">
        <span><strong>${esc(from.split("|")[0])}</strong> <span class="last">wants to be your friend</span></span>
        <span class="btnrow" style="margin:0">
          <button class="secondary" data-accept="${from}">✓ Accept</button>
          <button class="secondary" data-decline="${from}">✕</button>
        </span>
      </div>`).join("")}`;
  box.querySelectorAll("[data-accept]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await Social.acceptFriend(btn.dataset.accept);
      toast("🐱 You are friends now!");
      renderSocial();
    });
  });
  box.querySelectorAll("[data-decline]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await Social.declineFriend(btn.dataset.decline);
      renderSocial();
    });
  });
}

// ---- Duel spelen: 10 vragen in de practice-flow ----
let duelState = null;

async function startDuel() {
  const opponent = $("duel-opponent").value;
  if (!opponent) { toast("Choose a friend to duel with first."); return; }
  try {
    const r = await Social.newDuel(opponent);
    await joinDuelRoom(r.id);
  } catch (e) {
    toast("Could not start the duel — is the server online?");
  }
}

// V2.6: wachtkamer — beide spelers moeten er zijn voordat het duel begint
async function joinDuelRoom(id) {
  showView("practice");
  Whiskers.showCompanion();
  $("tense-info").textContent = "⚔️ Waiting room...";
  $("sentence").textContent = "Waiting for your opponent to join...";
  $("context").textContent = "";
  $("answer").value = "";
  $("answer").style.display = "none";
  $("feedback").textContent = "";
  $("duel-wait").style.display = "block";
  $("check").style.display = "none";

  const poll = async () => {
    try {
      const r = await Social.joinDuel(id);
      if (r.state === "live") {
        $("answer").style.display = "";
        $("check").style.display = "";
        $("duel-wait").style.display = "none";
        duelState = {
          id,
          exercises: Social.buildDuelExercises(r.questions),
          index: 0,
          correct: 0
        };
        Whiskers.say("⚔️ Duel mode! Both players ready — go!", 5000);
        nextDuelQuestion();
        return;
      }
    } catch (e) { /* opnieuw proberen */ }
    duelState = { id, waiting: true, timer: setTimeout(poll, 2000) };
  };
  poll();
}

async function playDuel(id) {
  const duel = await Social.getDuel(id);
  if (duel.state === "waiting") return joinDuelRoom(id);
  if (duel.state !== "live" || !duel.questions) {
    toast("This duel is no longer playable.");
    return;
  }
  duelState = {
    id,
    exercises: Social.buildDuelExercises(duel.questions),
    index: 0,
    correct: 0
  };
  showView("practice");
  Whiskers.showCompanion();
  Whiskers.say("⚔️ Duel mode! 10 questions — go for it!", 5000);
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
      if (result.winner === "draw") { toast("🤝 A draw!"); Whiskers.say("A draw — nicely shared!", 6000); }
      else if (result.winner === me) { toast("🏆 You won the duel!"); Whiskers.say("We woooone! 🏆", 6000); Gamification.addXP(50); }
      else { toast("😈 You lost... rematch?"); Whiskers.say("Too bad — you'll get them next time!", 6000); Gamification.addXP(15); }
    } else {
      toast(`Score submitted: ${score}/10 — waiting for your opponent!`);
    }
  } catch (e) {
    toast("Could not submit your score (offline?) — too bad!");
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
  verifyIdentity();
  $("intro-close").addEventListener("click", closeIntro);
  $("whiskers").addEventListener("click", () => {
    const home = document.getElementById("view-home");
    if (!home || !home.classList.contains("active")) return;
    const modal = $("badges-modal");
    if (modal.style.display === "block") {
      modal.style.display = "none"; // toggle: open -> dicht
    } else {
      showBadges();
    }
  });
  $("badges-close").addEventListener("click", () => $("badges-modal").style.display = "none");
  $("badges-reset").addEventListener("click", resetWhiskers);
  $("add-friend").addEventListener("click", addFriend);
  $("start-duel").addEventListener("click", startDuel);
  Calendar.render();
  initVocab();
  initDetective();
  $("id-name").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); saveIdentity(); }
  });
}

// ---- Navigatie ----
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $("view-" + id).classList.add("active");
  window.scrollTo(0, 0);
  // Focus + centreren: focus() alleen scrollt het veld naar de onderrand;
  // block center zet de oefening mooi in beeld.
  if (id === "practice") {
    $("answer").focus();
    $("answer").scrollIntoView({ block: "center" });
  }
  if (id === "irregular") {
    $("irr-past").focus();
    $("irr-past").scrollIntoView({ block: "center" });
  }
  if (id === "progress") renderProgress();
  if (id === "table") renderTable();
  if (id === "social") renderSocial();
  if (id === "vocab") { $("vocab-picker-card").style.display = "block"; $("vocab-practice-card").style.display = "none"; }
  if (id === "detective") { $("detective-picker-card").style.display = "block"; $("detective-practice-card").style.display = "none"; }
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
  let opts = `<option value="mix">Mix (all tenses)</option>`;
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
  // V2.4: al correct beantwoord? — niet nog eens tellen bij extra Enter
  if (currentExercise.solved) { newExercise(); return; }
  const isRepeat = !!currentExercise.isRepeat;
  const input = $("answer");
  const ok = currentExercise.check(input.value);
  count++;
  if (ok && currentExercise.hintUsed) {
    // antwoord was via de hint onthuld -> geen score, geen XP
    currentExercise.solved = true;
    input.classList.add("correct");
    $("feedback").textContent = `Right — but you used the hint, so no points this time.`;
    $("feedback").className = "nok";
  } else if (ok) {
    score++;
    currentExercise.solved = true;
    input.classList.add("correct");
    const attempts = currentExercise.attempts || 1;
    $("feedback").textContent = attempts > 1
      ? `Correct! "${currentExercise.answer}" — well done for persisting!`
      : `Correct! "${currentExercise.answer}"`;
    $("feedback").className = "ok";
  } else {
    currentExercise.attempts = (currentExercise.attempts || 0) + 1;
    input.classList.add("wrong");
    input.classList.remove("correct");
    // V2.4: laat de leerling opnieuw proberen — antwoord niet weggeven,
    // maar wel steeds duidelijker hulp bij herhaalde fouten.
    const n = currentExercise.attempts;
    let msg;
    if (n === 1) {
      msg = `Not correct — try again! Watch your spelling and the tense.`;
    } else if (n === 2) {
      msg = `Still not right. ${currentExercise.explain || ""} Take another look at the sentence.`;
    } else {
      msg = `Attempt ${n}... Tip: the answer starts with "${currentExercise.answer.slice(0, Math.max(1, Math.ceil(currentExercise.answer.length / 3)))}". Or press the hint button!`;
    }
    $("feedback").textContent = msg;
    $("feedback").className = "nok";
    // focus terug in het veld en selecteer de foutieve tekst
    input.focus();
    input.select();
  }
  // V2.6: duel-antwoorden zijn apart — niet in de gewone voortgang/sync
  if (duelState && !duelState.waiting) {
    // alleen Whiskers-reactie + duel-teller; geen ProgressStore/Gamification
    Whiskers.react(ok, ok ? 1 : 0, ok ? 0 : 1, currentExercise.tense.explain);
  } else {
    ProgressStore.record(currentExercise.tense.id, ok);
    ProgressStore.queueAnswer(currentExercise.tense.id, ok);
    Gamification.onAnswer(currentExercise.tense.id, ok);
    Whiskers.react(ok, Gamification._rowStreak, Gamification._mistakes, currentExercise.tense.explain);
    ProgressStore.sync();
  }
  if (!ok) {
    MistakeStore.add(currentExercise.tense.id, currentExercise.subject, currentExercise.verb);
  } else if (isRepeat) {
    MistakeStore.remove(currentExercise.tense.id, currentExercise.subject, currentExercise.verb);
    const next = MistakeStore.takeNext();
    if (next) {
      repeatNext = next;
    } else {
      toast("All mistakes have been repeated! ");
    }
  }
  updateMistakeBadge();
  $("score").textContent = score;
  $("count").textContent = count;
  // V2.8: kalender live bijwerken (geen handmatige herladen meer nodig)
  if (!duelState) Calendar.render();

  // V2.2: duel-modus — na elk antwoord door naar de volgende vraag
  if (duelState && currentExercise) {
    if (ok) duelState.correct++;
    duelState.timer = setTimeout(nextDuelQuestion, ok ? 700 : 1800);
  }
}

function showHint() {
  if (!currentExercise) return;
  currentExercise.hintUsed = true;
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
    .then(() => toast("Link copied — share it with your class! "))
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
    $("irr-feedback").textContent = "Both correct! ";
    $("irr-feedback").className = "ok";
  } else {
    $("irr-feedback").textContent =
      `The correct forms are: ${IrregularTrainer.current().base} — ${result.past} — ${result.pp}`;
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
    $("custom-feedback").textContent = "Tick at least one tense.";
    return;
  }
  startPractice("mix", checked);
}

// ---- Fouten herhalen ----
function repeatPractice() {
  const next = MistakeStore.takeNext();
  if (!next) {
    toast("No mistakes to repeat! ");
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

// V2.8: totaal-statistieken (uit de voortgang) — naast de sessie-score
function renderTotals() {
  const p = ProgressStore.all();
  let correct = 0, total = 0;
  for (const [k, v] of Object.entries(p)) {
    if (k.startsWith("_") || k.startsWith("vocab-")) continue;
    if (typeof v === "object" && v.total !== undefined) {
      total += v.total || 0;
      correct += v.correct || 0;
    }
  }
  const tc = $("total-correct");
  if (tc) tc.textContent = correct;
  const ta = $("total-answers");
  if (ta) ta.textContent = total;
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
  renderTotals();
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
    toast("Progress cleared");
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
