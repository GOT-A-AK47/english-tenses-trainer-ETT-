// V1.4: klassen & taken + eenvoudige docenten-auth (session token in memory).
// Uitbreiding op index.js: alle /api/-routes staan hier bij elkaar.

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
// Data-map: via omgevingsvariabele te overschrijven (container-mount),
// default lokaal naast het script.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
const CLASSES_FILE = path.join(DATA_DIR, "classes.json");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");
const USAGE_FILE = path.join(DATA_DIR, "usage.json");
const FRIENDS_FILE = path.join(DATA_DIR, "friends.json");
const REQUESTS_FILE = path.join(DATA_DIR, "friend-requests.json");
const DUELS_FILE = path.join(DATA_DIR, "duels.json");
const CALENDAR_FILE = path.join(DATA_DIR, "calendar.json");
const PORT = process.env.PORT || 3000;

// V2.2: basislijsten voor duel-vragen (gesynchroniseerd met de client-engine)
const TENSE_IDS = [
  "present-simple", "present-continuous", "present-perfect", "present-perfect-continuous",
  "past-simple", "past-continuous", "past-perfect", "past-perfect-continuous",
  "future-simple", "future-continuous", "future-perfect", "future-perfect-continuous"
];
const VERBS = ["work", "play", "study", "watch", "go", "do", "make", "take", "write", "read", "eat", "speak"];

// ---------- data-laag ----------

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function saveJson(file, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const loadProgress = () => loadJson(PROGRESS_FILE, {});
const saveProgress = d => saveJson(PROGRESS_FILE, d);
const loadClasses = () => loadJson(CLASSES_FILE, []);
const saveClasses = d => saveJson(CLASSES_FILE, d);
const loadTasks = () => loadJson(TASKS_FILE, []);
const saveTasks = d => saveJson(TASKS_FILE, d);
const loadFeedback = () => loadJson(FEEDBACK_FILE, []);
const saveFeedback = d => saveJson(FEEDBACK_FILE, d);
const loadUsage = () => loadJson(USAGE_FILE, {});
const saveUsage = d => saveJson(USAGE_FILE, d);
const loadFriends = () => loadJson(FRIENDS_FILE, {});
const saveFriends = d => saveJson(FRIENDS_FILE, d);
const loadRequests = () => loadJson(REQUESTS_FILE, {});
const saveRequests = d => saveJson(REQUESTS_FILE, d);
const loadDuels = () => loadJson(DUELS_FILE, []);
const saveDuels = d => saveJson(DUELS_FILE, d);
const loadCalendar = () => loadJson(CALENDAR_FILE, {});
const saveCalendar = d => saveJson(CALENDAR_FILE, d);

function studentKey(identity) {
  return `${identity.name}|${identity.klas}`;
}

// Security (V3.0): leerling-namen/-klassen sanitizen — stopt XSS-injectie
// via namen en houdt data-sleutels betrouwbaar.
function sanitizeName(raw) {
  return String(raw || "")
    .replace(/[\u0000-\u001f<>|"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

// who-keys ("Naam|Klas") sanitizen
function sanitizeWho(who) {
  const parts = String(who || "").split("|");
  if (parts.length !== 2) return "";
  return sanitizeName(parts[0]) + "|" + sanitizeName(parts[1]);
}

function mergeProgress(existing, incoming) {
  const merged = { ...existing };
  for (const [tenseId, stats] of Object.entries(incoming)) {
    const cur = merged[tenseId] || { correct: 0, total: 0 };
    merged[tenseId] = {
      correct: Math.max(cur.correct, stats.correct || 0),
      total: Math.max(cur.total, stats.total || 0)
    };
  }
  return merged;
}

// ---------- usage-statistieken ----------
// Bewaart per dag: unieke leerlingen, beantwoorde vragen en gebruik per tijd.
// De client stuurt per sync "newAnswers": [{tenseId, correct}] voor enkel de
// vragen die sinds de vorige sync beantwoord zijn.
function trackUsage(identity, newAnswers) {
  const today = new Date().toISOString().slice(0, 10);
  const usage = loadUsage();
  if (!usage.days) usage.days = {};
  if (!usage.days[today]) usage.days[today] = { students: [], answers: 0, tenses: {} };
  const day = usage.days[today];
  const student = identity.name + "|" + identity.klas;
  if (!day.students.includes(student)) day.students.push(student);
  for (const a of newAnswers) {
    day.answers++;
    if (!day.tenses[a.tenseId]) day.tenses[a.tenseId] = { total: 0, correct: 0 };
    day.tenses[a.tenseId].total++;
    if (a.correct) day.tenses[a.tenseId].correct++;
  }
  saveUsage(usage);
}

// ---------- docenten-auth ----------
// Eerste login: als er nog geen docenten zijn, wordt de ingevoerde code de docentenkode.
// Daarna: alleen die kode geldt. Sessies zijn in-memory tokens (vervallen bij herstart).

const TEACHER_CODE_FILE = path.join(DATA_DIR, "teacher-code.json");
const TEACHERS_FILE = path.join(DATA_DIR, "teachers.json");
// sessions: token -> "admin" | "teacher"
// Security (V3.0): tokens verlopen na 8 uur
const SESSION_TTL = 8 * 60 * 60 * 1000;
const sessions = new Map(); // token -> { role, expires }

// V1.6: docentenbeheer. Eén admin (hoofdcode) + extra docentencodes
// die de admin zelf aanmaakt via het dashboard. Migratie: als er nog
// alleen een oude teacher-code.json is, wordt die de admin-code.
function loadTeachers() {
  const old = teacherCode();
  const t = loadJson(TEACHERS_FILE, null);
  if (t && Array.isArray(t.codes)) return t;
  if (old && old.code) {
    const migrated = { adminCode: old.code, codes: [] };
    saveJson(TEACHERS_FILE, migrated);
    return migrated;
  }
  return null;
}

function teacherCode() {
  return loadJson(TEACHER_CODE_FILE, null);
}

function setTeacherCode(code) {
  saveJson(TEACHER_CODE_FILE, { code });
}

function sessionValid(token) {
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expires) { sessions.delete(token); return null; }
  return s.role;
}

function isTeacher(req) {
  const auth = req.headers["authorization"] || "";
  return auth.startsWith("Bearer ") && !!sessionValid(auth.slice(7));
}

function isAdmin(req) {
  const auth = req.headers["authorization"] || "";
  return auth.startsWith("Bearer ") && sessionValid(auth.slice(7)) === "admin";
}

// ---------- API ----------

const MAX_BODY = 100 * 1024; // 100 KB — genoeg voor alle payloads, stopt geheugen-DoS

function readBody(req) {
  return new Promise(resolve => {
    let body = "";
    let oversized = false;
    req.on("data", chunk => {
      body += chunk;
      if (body.length > MAX_BODY) { oversized = true; body = ""; req.destroy(); }
    });
    req.on("end", () => resolve(oversized ? null : body));
    req.on("error", () => resolve(null));
  });
}

// Veilig JSON parsen: kapot request-body kan de server nooit meer crashen
function readJson(req) {
  return readBody(req).then(b => {
    if (b === null) throw new Error("body too large");
    if (!b) return {};
    try { return JSON.parse(b); }
    catch { throw new Error("invalid json"); }
  });
}

function respond(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

// Security (V3.0): simpele rate-limit per IP. Beschermt login (brute force),
// feedback en duels tegen spam. Schoolnetwerk = vaak gedeelde IP's, dus
// limieten bewust ruim (60 req/min algemeen, 10/min voor login + feedback).
const RATE_LIMITS = { default: 60, login: 10, feedback: 10 };
const rateBuckets = new Map(); // ip -> { count, reset, loginCount, loginReset, feedbackCount, feedbackReset }

function rateLimited(req, kind) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?").split(",")[0].trim();
  const now = Date.now();
  if (!rateBuckets.has(ip)) rateBuckets.set(ip, { count: 0, reset: now + 60000, loginCount: 0, loginReset: now + 60000, feedbackCount: 0, feedbackReset: now + 60000 });
  const b = rateBuckets.get(ip);
  // algemene bucket
  if (b.reset < now) { b.count = 0; b.reset = now + 60000; }
  b.count++;
  if (kind === "login") {
    if (b.loginReset < now) { b.loginCount = 0; b.loginReset = now + 60000; }
    b.loginCount++;
  }
  if (kind === "feedback") {
    if (b.feedbackReset < now) { b.feedbackCount = 0; b.feedbackReset = now + 60000; }
    b.feedbackCount++;
  }
  if (b.count > RATE_LIMITS.default) return true;
  if (kind === "login" && b.loginCount > RATE_LIMITS.login) return true;
  if (kind === "feedback" && b.feedbackCount > RATE_LIMITS.feedback) return true;
  return false;
}

async function handleApi(req, res) {
  const url = req.url.split("?")[0];
  // Security (V3.0): rate limiting
  const kind = url === "/api/teacher/login" ? "login" : url === "/api/feedback" ? "feedback" : "default";
  if (rateLimited(req, kind)) {
    return respond(res, 429, { error: "te veel verzoeken — probeer over een minuut" });
  }
  // Security (V3.0): requests met een Origin van een ándere site blokkeren
  // (stopt cross-site misbruik vanuit de browser van een leerling)
  const origin = req.headers["origin"];
  if (origin) {
    try {
      const o = new URL(origin);
      const host = req.headers["host"] || "";
      if (o.host !== host) return respond(res, 403, { error: "niet toegestaan" });
    } catch { return respond(res, 403, { error: "niet toegestaan" }); }
  }

  // --- publiek ---
  if (req.method === "GET" && url === "/api/classes/list") {
    // openbare lijst voor leerlingen: alleen klasnamen
    return respond(res, 200, loadClasses().map(c => c.name));
  }

  if (req.method === "POST" && url === "/api/progress") {
    const payload = await readJson(req);
    const { identity, progress } = payload || {};
    if (!identity || !identity.name || !identity.klas || typeof progress !== "object") {
      return respond(res, 400, { error: "identity en progress zijn verplicht" });
    }
    identity.name = sanitizeName(identity.name);
    identity.klas = sanitizeName(identity.klas);
    if (!identity.name || !identity.klas) {
      return respond(res, 400, { error: "ongeldige naam of klas" });
    }
    const newAnswers = Array.isArray(payload.newAnswers) ? payload.newAnswers : [];
    // V2.2: dagelijkse kalender per leerling
    const today = new Date().toISOString().slice(0, 10);
    const cal = loadCalendar();
    const who = studentKey(identity);
    if (!cal[who]) cal[who] = {};
    if (!cal[who][today]) cal[who][today] = { answers: 0, correct: 0 };
    cal[who][today].answers += newAnswers.length;
    cal[who][today].correct += newAnswers.filter(a => a.correct).length;
    saveCalendar(cal);
    const key = studentKey(identity);
    const all = loadProgress();
    all[key] = mergeProgress(all[key] || {}, progress);
    // V2.7: Whiskers-game-state (XP, badges, energie) per leerling bewaren
    if (payload.game && typeof payload.game === "object") {
      all[key]._game = payload.game;
    }
    all[key]._identity = { name: identity.name, klas: identity.klas, lastSeen: new Date().toISOString() };
    saveProgress(all);
    trackUsage(identity, newAnswers);
    return respond(res, 200, { ok: true, progress, game: all[key]._game || null });
  }

  if (req.method === "GET" && url === "/api/classes") {
    const all = loadProgress();
    const classes = {};
    for (const [key, entry] of Object.entries(all)) {
      const id = entry._identity;
      if (!id) continue;
      if (!classes[id.klas]) classes[id.klas] = [];
      const progress = { ...entry };
      delete progress._identity;
      classes[id.klas].push({ name: id.name, lastSeen: id.lastSeen, progress });
    }
    return respond(res, 200, classes);
  }

  // --- docenten-auth ---
  if (req.method === "POST" && url === "/api/teacher/login") {
    const { code } = (await readJson(req));
    if (!code) return respond(res, 400, { error: "code verplicht" });
    const teachers = loadTeachers();
    if (!teachers || !teachers.adminCode) {
      // allereerste login ooit: wordt de admin-code
      saveJson(TEACHERS_FILE, { adminCode: String(code), codes: [] });
      const token = newToken();
      sessions.set(token, { role: "admin", expires: Date.now() + SESSION_TTL });
      return respond(res, 200, { token, firstTime: true, isAdmin: true });
    }
    const role = String(code) === teachers.adminCode ? "admin" : null;
    if (!role) {
      const extra = teachers.codes.find(c => c.code === String(code));
      if (!extra) return respond(res, 401, { error: "verkeerde code" });
      extra.lastUsed = new Date().toISOString();
      saveJson(TEACHERS_FILE, teachers);
      const token = newToken();
      sessions.set(token, { role: "teacher", expires: Date.now() + SESSION_TTL });
      return respond(res, 200, { token, isAdmin: false });
    }
    const token = newToken();
    sessions.set(token, { role, expires: Date.now() + SESSION_TTL });
    return respond(res, 200, { token, isAdmin: true });
  }

  // --- admin: docentencodes beheren ---
  if (req.method === "GET" && url === "/api/teacher/codes") {
    if (!isAdmin(req)) return respond(res, 401, { error: "alleen admin" });
    const teachers = loadTeachers();
    return respond(res, 200, teachers ? teachers.codes : []);
  }

  if (req.method === "POST" && url === "/api/teacher/codes") {
    if (!isAdmin(req)) return respond(res, 401, { error: "alleen admin" });
    const { label } = (await readJson(req));
    const teachers = loadTeachers();
    const code = "ETT-" + require("crypto").randomBytes(4).toString("hex").toUpperCase();
    teachers.codes.push({
      code,
      label: String(label || "docent").slice(0, 60),
      createdAt: new Date().toISOString(),
      lastUsed: null
    });
    saveJson(TEACHERS_FILE, teachers);
    return respond(res, 200, { ok: true, code });
  }

  if (req.method === "DELETE" && url.startsWith("/api/teacher/codes/")) {
    if (!isAdmin(req)) return respond(res, 401, { error: "alleen admin" });
    const code = decodeURIComponent(url.split("/").pop());
    const teachers = loadTeachers();
    teachers.codes = teachers.codes.filter(c => c.code !== code);
    saveJson(TEACHERS_FILE, teachers);
    return respond(res, 200, { ok: true });
  }

  // --- docenten: klassen ---
  if (req.method === "GET" && url === "/api/teacher/classes") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    return respond(res, 200, loadClasses());
  }

  if (req.method === "POST" && url === "/api/teacher/classes") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const { name } = (await readJson(req));
    if (!name || !name.trim()) return respond(res, 400, { error: "naam verplicht" });
    const classes = loadClasses();
    if (classes.some(c => c.name === name.trim())) {
      return respond(res, 400, { error: "klas bestaat al" });
    }
    classes.push({ name: name.trim(), createdAt: new Date().toISOString() });
    saveClasses(classes);
    return respond(res, 200, { ok: true, classes });
  }

  if (req.method === "DELETE" && url.startsWith("/api/teacher/classes/")) {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const name = decodeURIComponent(url.split("/").pop());
    const classes = loadClasses().filter(c => c.name !== name);
    saveClasses(classes);
    return respond(res, 200, { ok: true, classes });
  }

  // --- docenten: taken ---
  if (req.method === "GET" && url === "/api/teacher/tasks") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    return respond(res, 200, loadTasks());
  }

  if (req.method === "POST" && url === "/api/teacher/tasks") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const { title, klas, tenseIds, students: payloadStudents } = (await readJson(req));
    if (!title || !klas || !Array.isArray(tenseIds) || !tenseIds.length) {
      return respond(res, 400, { error: "title, klas en tenseIds zijn verplicht" });
    }
    const classes = loadClasses();
    if (!classes.some(c => c.name === klas)) {
      return respond(res, 400, { error: "klas bestaat niet" });
    }
    const tasks = loadTasks();
    const task = {
      id: "t" + Date.now().toString(36),
      title: String(title).trim(),
      klas: String(klas),
      tenseIds,
      // V2.3: optioneel specifieke leerlingen; leeg/afwezig = hele klas
      students: Array.isArray(payloadStudents) && payloadStudents.length
        ? payloadStudents.map(n => String(n).trim())
        : null,
      createdAt: new Date().toISOString()
    };
    tasks.push(task);
    saveTasks(tasks);
    return respond(res, 200, { ok: true, task });
  }

  if (req.method === "DELETE" && url.startsWith("/api/teacher/tasks/")) {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const id = url.split("/").pop();
    saveTasks(loadTasks().filter(t => t.id !== id));
    return respond(res, 200, { ok: true });
  }

  // --- leerlingen: taken voor mijn klas ---
  if (req.method === "GET" && url === "/api/tasks") {
    const klas = new URL(req.url, "http://x").searchParams.get("klas");
    const name = new URL(req.url, "http://x").searchParams.get("name");
    if (!klas) return respond(res, 400, { error: "klas verplicht" });
    return respond(res, 200, loadTasks().filter(t =>
      t.klas === klas && (!t.students || !name || t.students.includes(name))
    ));
  }

  // --- bestaan-check leerling (V2.3; maakt niks aan) ---
  if (req.method === "GET" && url === "/api/student/exists") {
    const name = new URL(req.url, "http://x").searchParams.get("name");
    const klas = new URL(req.url, "http://x").searchParams.get("klas");
    if (!name || !klas) return respond(res, 400, { error: "naam en klas verplicht" });
    const exists = !!loadProgress()[name + "|" + klas];
    return respond(res, 200, { exists });
  }

  // --- feedback (openbaar posten, docenten lezen) ---
  if (req.method === "POST" && url === "/api/feedback") {
    const { message, identity, category } = (await readJson(req));
    if (!message || !String(message).trim()) {
      return respond(res, 400, { error: "bericht is leeg" });
    }
    const feedback = loadFeedback();
    feedback.push({
      id: "f" + Date.now().toString(36),
      message: String(message).trim().slice(0, 2000),
      category: ["bug", "idee", "klacht", "anders"].includes(category) ? category : "anders",
      from: identity ? `${sanitizeName(identity.name)} (${sanitizeName(identity.klas)})` : "anoniem",
      createdAt: new Date().toISOString(),
      read: false
    });
    saveFeedback(feedback);
    return respond(res, 200, { ok: true });
  }

  if (req.method === "GET" && url === "/api/teacher/feedback") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    return respond(res, 200, loadFeedback().slice().reverse());
  }

  if (req.method === "POST" && url.startsWith("/api/teacher/feedback/") && url.endsWith("/read")) {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const id = url.split("/")[4];
    const feedback = loadFeedback();
    const item = feedback.find(f => f.id === id);
    if (item) { item.read = true; saveFeedback(feedback); }
    return respond(res, 200, { ok: true });
  }

  if (req.method === "DELETE" && url.startsWith("/api/teacher/feedback/")) {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const id = url.split("/").pop();
    saveFeedback(loadFeedback().filter(f => f.id !== id));
    return respond(res, 200, { ok: true });
  }

  // --- leerling verwijderen (docenten) ---
  // Verwijdert progress + kalender + vriendschappen + duels van de leerling.
  // De client krijgt dan geen data meer en vraagt opnieuw om naam+klas.
  if (req.method === "DELETE" && url.startsWith("/api/teacher/student/")) {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const name = decodeURIComponent(url.split("/").pop());
    const klas = new URL(req.url, "http://x").searchParams.get("klas");
    if (!name || !klas) return respond(res, 400, { error: "naam en klas verplicht" });
    const who = name + "|" + klas;

    const all = loadProgress();
    delete all[who];
    saveProgress(all);

    const cal = loadCalendar();
    delete cal[who];
    saveCalendar(cal);

    const friends = loadFriends();
    delete friends[who];
    for (const [key, list] of Object.entries(friends)) {
      if (Array.isArray(list)) friends[key] = list.filter(f => f !== who);
    }
    saveFriends(friends);

    saveDuels(loadDuels().filter(d => !d.players.includes(who)));

    return respond(res, 200, { ok: true });
  }

  // --- leerlingen per klas (voor taak-toewijzing en verwijderen) ---
  if (req.method === "GET" && url === "/api/teacher/students") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const klas = new URL(req.url, "http://x").searchParams.get("klas");
    if (!klas) return respond(res, 400, { error: "klas verplicht" });
    const all = loadProgress();
    const students = [];
    for (const [key, entry] of Object.entries(all)) {
      if (!entry._identity || entry._identity.klas !== klas) continue;
      students.push({ name: entry._identity.name, lastSeen: entry._identity.lastSeen });
    }
    return respond(res, 200, students.sort((a, b) => a.name.localeCompare(b.name)));
  }

  // --- usage-statistieken (docenten) ---
  if (req.method === "GET" && url === "/api/teacher/usage") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const usage = loadUsage();
    const days = Object.entries(usage.days || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, d]) => ({ date, students: d.students.length, answers: d.answers, tenses: d.tenses }));
    const totalAnswers = days.reduce((a, d) => a + d.answers, 0);
    const totalStudents = new Set(days.flatMap(d => d.students)).size;
    const tenseTotals = {};
    for (const d of Object.values(usage.days || {})) {
      for (const [tenseId, t] of Object.entries(d.tenses || {})) {
        if (!tenseTotals[tenseId]) tenseTotals[tenseId] = { total: 0, correct: 0 };
        tenseTotals[tenseId].total += t.total || 0;
        tenseTotals[tenseId].correct += t.correct || 0;
      }
    }
    return respond(res, 200, { days, totalAnswers, totalStudents, tenseTotals });
  }

  // --- CSV-export voortgang (docenten) ---
  if (req.method === "GET" && url === "/api/teacher/export.csv") {
    if (!isTeacher(req)) return respond(res, 401, { error: "niet ingelogd" });
    const all = loadProgress();
    const tenseIds = new Set();
    for (const entry of Object.values(all)) {
      Object.keys(entry).forEach(k => { if (!k.startsWith("_")) tenseIds.add(k); });
    }
    const cols = ["naam", "klas", ...tenseIds, "totaal_correct", "totaal_vragen"];
    const rows = Object.values(all).filter(e => e._identity).map(e => {
      let c = 0, t = 0;
      const cells = [e._identity.name, e._identity.klas];
      for (const tenseId of tenseIds) {
        const st = e[tenseId] || { correct: 0, total: 0 };
        cells.push(`${st.correct}/${st.total}`);
        c += st.correct; t += st.total;
      }
      cells.push(c, t);
      return cells;
    });
    const csv = [cols, ...rows]
      .map(r => r.map(v => {
        let cell = String(v).replace(/"/g, '""');
        // Security (V3.0): spreadsheet-formule-injectie blokkeren
        if (/^[=+@\-]/.test(cell)) cell = "'" + cell;
        return `"${cell}"`;
      }).join(","))
      .join("\r\n");
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="voortgang.csv"'
    });
    return res.end("\uFEFF" + csv);
  }

  // ===== V2.2: vrienden =====
  // vriendenlijst: friends.json = { "Anna|7B": ["Ben|7B", ...] }
  if (req.method === "GET" && url === "/api/friends") {
    const who = new URL(req.url, "http://x").searchParams.get("who");
    if (!who) return respond(res, 400, { error: "who verplicht" });
    const friends = loadFriends();
    const list = friends[who] || [];
    // verrijk met voortgang-samenvatting
    const all = loadProgress();
    const enriched = list.map(f => {
      const entry = all[f];
      let total = 0, correct = 0;
      for (const [k, v] of Object.entries(entry || {})) {
        if (k.startsWith("_")) continue;
        total += v.total || 0; correct += v.correct || 0;
      }
      return { who: f, name: f.split("|")[0], total, correct };
    });
    return respond(res, 200, enriched);
  }

  // zoek klasgenoten (voor vriendschapsverzoeken)
  if (req.method === "GET" && url === "/api/classmates") {
    const klas = new URL(req.url, "http://x").searchParams.get("klas");
    const name = new URL(req.url, "http://x").searchParams.get("name");
    if (!klas || !name) return respond(res, 400, { error: "klas en name verplicht" });
    const all = loadProgress();
    const me = name + "|" + klas;
    const mates = [];
    for (const [key, entry] of Object.entries(all)) {
      if (key === me || !entry._identity) continue;
      if (entry._identity.klas !== klas) continue;
      mates.push(entry._identity.name);
    }
    return respond(res, 200, mates.sort());
  }

  // V2.6: vriendschapsverzoek — de ander moet accepteren
  if (req.method === "POST" && url === "/api/friends/request") {
    const body = await readJson(req);
    const me = sanitizeWho(body.me), friend = sanitizeWho(body.friend);
    if (!me || !friend) return respond(res, 400, { error: "me en friend verplicht" });
    if (me === friend) return respond(res, 400, { error: "jezelf kan niet" });
    const friends = loadFriends();
    if (friends[me] && friends[me].includes(friend)) {
      return respond(res, 400, { error: "al vrienden" });
    }
    const requests = loadRequests();
    if (!requests[friend]) requests[friend] = [];
    if (!requests[friend].includes(me)) requests[friend].push(me);
    saveRequests(requests);
    return respond(res, 200, { ok: true });
  }

  // openstaande verzoeken voor mij
  if (req.method === "GET" && url === "/api/friends/requests") {
    const who = new URL(req.url, "http://x").searchParams.get("who");
    if (!who) return respond(res, 400, { error: "who verplicht" });
    const requests = loadRequests();
    return respond(res, 200, requests[who] || []);
  }

  // verzoek accepteren -> wederzijdse vriendschap
  if (req.method === "POST" && url === "/api/friends/accept") {
    const body = await readJson(req);
    const me = sanitizeWho(body.me), from = sanitizeWho(body.from);
    if (!me || !from) return respond(res, 400, { error: "me en from verplicht" });
    const requests = loadRequests();
    if (!requests[me] || !requests[me].includes(from)) {
      return respond(res, 400, { error: "geen openstaand verzoek" });
    }
    requests[me] = requests[me].filter(f => f !== from);
    saveRequests(requests);
    const friends = loadFriends();
    if (!friends[me]) friends[me] = [];
    if (!friends[from]) friends[from] = [];
    if (!friends[me].includes(from)) friends[me].push(from);
    if (!friends[from].includes(me)) friends[from].push(me);
    saveFriends(friends);
    return respond(res, 200, { ok: true });
  }

  // verzoek afwijzen
  if (req.method === "POST" && url === "/api/friends/decline") {
    const body = await readJson(req);
    const me = sanitizeWho(body.me), from = sanitizeWho(body.from);
    if (!me || !from) return respond(res, 400, { error: "me en from verplicht" });
    const requests = loadRequests();
    if (requests[me]) requests[me] = requests[me].filter(f => f !== from);
    saveRequests(requests);
    return respond(res, 200, { ok: true });
  }

  // vriend verwijderen (wederzijds)
  if (req.method === "POST" && url === "/api/friends/remove") {
    const body = await readJson(req);
    const me = sanitizeWho(body.me), friend = sanitizeWho(body.friend);
    if (!me || !friend) return respond(res, 400, { error: "me en friend verplicht" });
    const friends = loadFriends();
    if (friends[me]) friends[me] = friends[me].filter(f => f !== friend);
    if (friends[friend]) friends[friend] = friends[friend].filter(f => f !== me);
    saveFriends(friends);
    return respond(res, 200, { ok: true });
  }

  // ===== V2.2: duels =====
  // duels.json = [{ id, players: [whoA, whoB], tenseIds, questions: [...], scores: {whoA: null|n}, state }]
  // vragen zijn combi-lijsten: [{tenseId, subject, verb}] die beide spelers
  // via de bestaande engine identiek voorgeschoteld krijgen.
  const DUEL_QUESTIONS = 10;

  function genDuelQuestions() {
    // deterministische random combinaties; de client bouwt de echte zinnen
    const SUBJS = ["I", "you", "he", "she", "it", "we", "they"];
    const qs = [];
    for (let i = 0; i < DUEL_QUESTIONS; i++) {
      qs.push({
        tenseId: TENSE_IDS[i % TENSE_IDS.length],
        subject: SUBJS[Math.floor(Math.random() * SUBJS.length)],
        verb: VERBS[Math.floor(Math.random() * VERBS.length)]
      });
    }
    return qs;
  }

  if (req.method === "POST" && url === "/api/duel/new") {
    const body = await readJson(req);
    const me = sanitizeWho(body.me), opponent = sanitizeWho(body.opponent);
    if (!me || !opponent) return respond(res, 400, { error: "me en opponent verplicht" });
    if (me === opponent) return respond(res, 400, { error: "tegen jezelf kan niet" });
    const duels = loadDuels();
    const duel = {
      id: "d" + Date.now().toString(36),
      players: [me, opponent],
      questions: null,           // pas als beide klaarstaan
      scores: { [me]: null, [opponent]: null },
      joined: [me],              // wie zit er al in de wacht-kamer
      state: "waiting",          // waiting -> live -> done
      createdAt: new Date().toISOString()
    };
    duels.push(duel);
    saveDuels(duels);
    return respond(res, 200, { duel: { id: duel.id, state: duel.state } });
  }

  // duel/join: in de wacht-kamer; als beide er zijn gaat het duel live
  if (req.method === "POST" && url === "/api/duel/join") {
    const body = await readJson(req);
    const id = String(body.id || ""), who = sanitizeWho(body.who);
    const duels = loadDuels();
    const duel = duels.find(d => d.id === id);
    if (!duel) return respond(res, 404, { error: "duel bestaat niet" });
    if (!duel.players.includes(who)) return respond(res, 403, { error: "je zit niet in dit duel" });
    if (!duel.joined.includes(who)) duel.joined.push(who);
    if (duel.joined.length === 2 && !duel.questions) {
      duel.questions = genDuelQuestions();
      duel.state = "live";
    }
    saveDuels(duels);
    return respond(res, 200, {
      state: duel.state,
      joined: duel.joined.length,
      questions: duel.state === "live" ? duel.questions : null
    });
  }

  // mijn duels (open + afgerond)
  if (req.method === "GET" && url === "/api/duel/list") {
    const who = new URL(req.url, "http://x").searchParams.get("who");
    if (!who) return respond(res, 400, { error: "who verplicht" });
    const duels = loadDuels().filter(d => d.players.includes(who));
    return respond(res, 200, duels.map(d => ({
      id: d.id,
      opponent: d.players.find(p => p !== who),
      state: d.state,
      myScore: d.scores[who],
      theirScore: d.scores[d.players.find(p => p !== who)],
      createdAt: d.createdAt
    })));
  }

  // duel-details (vragen ophalen om te spelen; pas als live)
  if (req.method === "GET" && url === "/api/duel/get") {
    const id = new URL(req.url, "http://x").searchParams.get("id");
    const duels = loadDuels();
    const duel = duels.find(d => d.id === id);
    if (!duel) return respond(res, 404, { error: "duel bestaat niet" });
    // vragen zijn pas zichtbaar als het duel live is
    const safe = { ...duel };
    if (safe.state !== "live" && safe.state !== "done") safe.questions = null;
    return respond(res, 200, safe);
  }

  // score indienen
  if (req.method === "POST" && url === "/api/duel/score") {
    const body = await readJson(req);
    const id = String(body.id || ""), who = sanitizeWho(body.who), score = body.score;
    const duels = loadDuels();
    const duel = duels.find(d => d.id === id);
    if (!duel) return respond(res, 404, { error: "duel bestaat niet" });
    if (!duel.players.includes(who)) return respond(res, 403, { error: "je zit niet in dit duel" });
    duel.scores[who] = Math.max(0, Math.min(DUEL_QUESTIONS, Number(score) || 0));
    // afronden als beide scores binnen zijn
    if (duel.players.every(p => duel.scores[p] !== null)) {
      duel.state = "done";
      const [a, b] = duel.players;
      duel.winner = duel.scores[a] === duel.scores[b] ? "draw" : (duel.scores[a] > duel.scores[b] ? a : b);
    }
    saveDuels(duels);
    return respond(res, 200, { duel: { id: duel.id, state: duel.state, winner: duel.winner || null } });
  }

  // ===== V2.2: dagelijkse kalender =====
  // calendar.json = { "Anna|7B": { "2026-10-29": { answers: 12, correct: 10 }, ... } }
  // (gevuld door /api/progress via newAnswers — dezelfde data als usage, maar per leerling)
  if (req.method === "GET" && url === "/api/calendar") {
    const who = new URL(req.url, "http://x").searchParams.get("who");
    if (!who) return respond(res, 400, { error: "who verplicht" });
    const cal = loadCalendar();
    return respond(res, 200, cal[who] || {});
  }

  respond(res, 404, { error: "not found" });
}

function newToken() {
  return require("crypto").randomBytes(24).toString("hex");
}

// ---------- static files ----------

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/teacher") urlPath = "/server/teacher.html";

  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end("forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("404");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

// ---------- server ----------

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res).catch(e => {
      // bekende request-fouten nette status geven; rest is server-fout
      if (e && e.message === "body too large") return respond(res, 413, { error: "payload te groot" });
      if (e && e.message === "invalid json") return respond(res, 400, { error: "ongeldige JSON" });
      respond(res, 500, { error: "serverfout" });
    });
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`English Tenses Trainer server draait op http://localhost:${PORT}`);
  console.log(`Leerkrachtdashboard: http://localhost:${PORT}/teacher`);
});
