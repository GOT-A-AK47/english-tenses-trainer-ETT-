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
  $("badges-modal").style.display = "block";
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
  $("whiskers-btn").addEventListener("click", showBadges);
  $("badges-close").addEventListener("click", () => $("badges-modal").style.display = "none");
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
}

function bindNavigation() {
  document.querySelectorAll("[data-view]").forEach(el => {
    el.addEventListener("click", () => showView(el.dataset.view));
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

function startPractice(tenseId, mixIds) {
  currentMix = mixIds;
  if (mixIds) {
    $("tense-select").value = "mix";
  } else {
    $("tense-select").value = tenseId;
  }
  newExercise();
  showView("practice");
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
