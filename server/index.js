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
const PORT = process.env.PORT || 3000;

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

function studentKey(identity) {
  return `${identity.name}|${identity.klas}`;
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
// sessions: token -> { isAdmin }
const sessions = new Map();

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

function isTeacher(req) {
  const auth = req.headers["authorization"] || "";
  return auth.startsWith("Bearer ") && sessions.has(auth.slice(7));
}

function isAdmin(req) {
  const auth = req.headers["authorization"] || "";
  return auth.startsWith("Bearer ") && sessions.get(auth.slice(7)) === "admin";
}

// ---------- API ----------

function readBody(req) {
  return new Promise(resolve => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => resolve(body));
  });
}

function respond(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleApi(req, res) {
  const url = req.url.split("?")[0];

  // --- publiek ---
  if (req.method === "GET" && url === "/api/classes/list") {
    // openbare lijst voor leerlingen: alleen klasnamen
    return respond(res, 200, loadClasses().map(c => c.name));
  }

  if (req.method === "POST" && url === "/api/progress") {
    const payload = JSON.parse(await readBody(req) || "{}");
    const { identity, progress } = payload || {};
    if (!identity || !identity.name || !identity.klas || typeof progress !== "object") {
      return respond(res, 400, { error: "identity en progress zijn verplicht" });
    }
    const newAnswers = Array.isArray(payload.newAnswers) ? payload.newAnswers : [];
    const key = studentKey(identity);
    const all = loadProgress();
    all[key] = mergeProgress(all[key] || {}, progress);
    all[key]._identity = { name: identity.name, klas: identity.klas, lastSeen: new Date().toISOString() };
    saveProgress(all);
    trackUsage(identity, newAnswers);
    return respond(res, 200, { ok: true, progress });
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
    const { code } = JSON.parse(await readBody(req) || "{}") || {};
    if (!code) return respond(res, 400, { error: "code verplicht" });
    const teachers = loadTeachers();
    if (!teachers || !teachers.adminCode) {
      // allereerste login ooit: wordt de admin-code
      saveJson(TEACHERS_FILE, { adminCode: String(code), codes: [] });
      const token = newToken();
      sessions.set(token, "admin");
      return respond(res, 200, { token, firstTime: true, isAdmin: true });
    }
    const role = String(code) === teachers.adminCode ? "admin" : null;
    if (!role) {
      const extra = teachers.codes.find(c => c.code === String(code));
      if (!extra) return respond(res, 401, { error: "verkeerde code" });
      extra.lastUsed = new Date().toISOString();
      saveJson(TEACHERS_FILE, teachers);
      const token = newToken();
      sessions.set(token, "teacher");
      return respond(res, 200, { token, isAdmin: false });
    }
    const token = newToken();
    sessions.set(token, role);
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
    const { label } = JSON.parse(await readBody(req) || "{}") || {};
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
    const { name } = JSON.parse(await readBody(req) || "{}") || {};
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
    const { title, klas, tenseIds } = JSON.parse(await readBody(req) || "{}") || {};
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
    if (!klas) return respond(res, 400, { error: "klas verplicht" });
    return respond(res, 200, loadTasks().filter(t => t.klas === klas));
  }

  // --- feedback (openbaar posten, docenten lezen) ---
  if (req.method === "POST" && url === "/api/feedback") {
    const { message, identity, category } = JSON.parse(await readBody(req) || "{}") || {};
    if (!message || !String(message).trim()) {
      return respond(res, 400, { error: "bericht is leeg" });
    }
    const feedback = loadFeedback();
    feedback.push({
      id: "f" + Date.now().toString(36),
      message: String(message).trim().slice(0, 2000),
      category: ["bug", "idee", "klacht", "anders"].includes(category) ? category : "anders",
      from: identity ? `${identity.name} (${identity.klas})` : "anoniem",
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
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="voortgang.csv"'
    });
    return res.end("\uFEFF" + csv);
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
      respond(res, 500, { error: e.message });
    });
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`English Tenses Trainer server draait op http://localhost:${PORT}`);
  console.log(`Leerkrachtdashboard: http://localhost:${PORT}/teacher`);
});
