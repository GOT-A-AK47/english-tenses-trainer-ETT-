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

// ---------- docenten-auth ----------
// Eerste login: als er nog geen docenten zijn, wordt de ingevoerde code de docentenkode.
// Daarna: alleen die kode geldt. Sessies zijn in-memory tokens (vervallen bij herstart).

const TEACHER_CODE_FILE = path.join(DATA_DIR, "teacher-code.json");
const sessions = new Set();

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
    const key = studentKey(identity);
    const all = loadProgress();
    all[key] = mergeProgress(all[key] || {}, progress);
    all[key]._identity = { name: identity.name, klas: identity.klas, lastSeen: new Date().toISOString() };
    saveProgress(all);
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
    const stored = teacherCode();
    if (!stored) {
      setTeacherCode(String(code));
      const token = newToken();
      sessions.add(token);
      return respond(res, 200, { token, firstTime: true });
    }
    if (String(code) !== stored.code) {
      return respond(res, 401, { error: "verkeerde code" });
    }
    const token = newToken();
    sessions.add(token);
    return respond(res, 200, { token });
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
