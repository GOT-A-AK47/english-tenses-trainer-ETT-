#!/bin/sh
# Bouwt één zelfstandig HTML-bestand (english-tenses-trainer.html in de root) waarin
# alle CSS en JS zijn ingebed. Leerlingen downloaden enkel dat ene bestand.
set -e
cd "$(dirname "$0")"

node - "." <<'EOF'
const fs = require("fs");
const path = require("path");

const SCRIPT_ORDER = [
  "js/data/groups.js",
  "js/core/registry.js",
  "js/core/store.js",
  "js/core/identity.js",
  "js/data/verbs.js",
  "js/data/templates.js",
  "js/tenses/_shared.js",
  "js/tenses/present-simple.js",
  "js/tenses/past-simple.js",
  "js/tenses/present-perfect.js",
  "js/tenses/present-continuous.js",
  "js/tenses/past-continuous.js",
  "js/tenses/future-simple.js",
  "js/tenses/past-perfect.js",
  "js/tenses/future-continuous.js",
  "js/tenses/present-perfect-continuous.js",
  "js/tenses/past-perfect-continuous.js",
  "js/tenses/future-perfect.js",
  "js/tenses/future-perfect-continuous.js",
  "js/core/engine.js",
  "js/core/irregular.js",
  "js/core/table.js",
  "js/app.js"
];

let html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/style.css", "utf8");
html = html.replace(
  /<link rel="stylesheet" href="css\/style.css">/,
  `<style>\n${css}\n</style>`
);

let js = SCRIPT_ORDER.map(f => fs.readFileSync(f, "utf8")).join("\n;\n");
html = html.replace(
  /<script src="js\/data\/groups.js"><\/script>[\s\S]*<script src="js\/app.js"><\/script>/,
  `<script>\n${js}\n</script>`
);

const outDir = process.argv[2];
const outFile = path.join(outDir, "english-tenses-trainer.html");
fs.writeFileSync(outFile, html);
console.log("Geschreven:", outFile, Math.round(html.length / 1024) + " KB");
EOF
