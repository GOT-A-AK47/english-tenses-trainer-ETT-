// V1.2/V1.3: API-server + leerkrachtdashboard.
// Pure Node (geen dependencies): serveert de static site en een kleine API.
// Voortgang wordt per leerling (naam + klas) bewaard in server/data/progress.json.
// Starten: node server/index.js  (poort 3000, of via PORT-omgevingsvariabele)

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
const PORT = process.env.PORT || 3000;

// ---------- data-laag ----------

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")); }
  catch { return {}; }
}

function saveProgress(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

// progress.json: { "Anna|7B": { "present-simple": { correct, total }, ... } }
function studentKey(identity) {
  return `${identity.name}|${identity.klas}`;
}

function mergeProgress(existing, incoming) {
  // Per tijd het hoogste resultaat bewaren (voorkomt verlies bij offline gebruik).
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

// ---------- API ----------

function handleApi(req, res, body) {
  if (req.method === "POST" && req.url === "/api/progress") {
    let payload;
    try { payload = JSON.parse(body); }
    catch { return respond(res, 400, { error: "invalid JSON" }); }
    const { identity, progress } = payload || {};
    if (!identity || !identity.name || !identity.klas || typeof progress !== "object") {
      return respond(res, 400, { error: "identity en progress zijn verplicht" });
    }
    const key = studentKey(identity);
    const all = loadProgress();
    all[key] = mergeProgress(all[key] || {}, progress);
    all[key]._identity = { name: identity.name, klas: identity.klas, lastSeen: new Date().toISOString() };
    saveProgress(all);
    return respond(res, 200, { ok: true, progress: progress });
  }

  if (req.method === "GET" && req.url === "/api/classes") {
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

  respond(res, 404, { error: "not found" });
}

function respond(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
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
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => handleApi(req, res, body));
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`English Tenses Trainer server draait op http://localhost:${PORT}`);
  console.log(`Leerkrachtdashboard: http://localhost:${PORT}/teacher`);
});
