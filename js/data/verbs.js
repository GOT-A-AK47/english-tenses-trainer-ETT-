// Werkwoorden-data: regelmatig + onregelmatig.
// vorm: { base, past, pastParticiple, third (optioneel, voor onregelmatige -s) }
// V3.13: uitgebreid naar ~100 regelmatige en ~75 onregelmatige werkwoorden
// voor veel meer zinsvariatie.

const REGULAR_VERBS = [
  // originele set
  "walk", "play", "work", "jump", "clean", "cook", "watch", "talk",
  "listen", "help", "open", "close", "study", "visit", "arrive", "borrow",
  "call", "dance", "decide", "deliver", "enjoy", "explain", "follow",
  "gather", "happen", "hurry", "improve", "jog", "kick", "laugh", "look",
  "move", "notice", "offer", "paint", "question", "rain", "smile", "start",
  "travel", "type", "use", "wait", "wash", "yell", "shout",
  // V3.13: alledaagse acties
  "ask", "answer", "bake", "boil", "brush", "camp", "carry", "chase",
  "check", "clap", "collect", "comb", "copy", "count", "cover", "crawl",
  "cry", "cycle", "decorate", "destroy", "discover", "dry", "earn",
  "enter", "escape", "exercise", "fetch", "fill", "fix", "fold", "frown",
  "glow", "greet", "guess", "hammer", "handle", "heat", "hug", "imagine",
  "itch", "join", "joke", "knock", "land", "lift", "load", "march",
  "marry", "melt", "mend", "mix", "moan", "obey", "order", "pass", "pause",
  "peel", "pinch", "point", "polish", "practise", "press", "pretend",
  "promise", "pull", "push", "realise", "rescue", "roast", "rock", "rub",
  "rule", "rush", "sail", "save", "scream", "serve", "settle", "shave",
  "sip", "ski", "sniff", "spark", "spill", "spoil", "spray", "squeeze",
  "stack", "stare", "steer", "stretch", "stroll", "succeed", "suffer",
  "suggest", "support", "surprise", "surround", "taste", "thank", "tickle",
  "tidy", "toast", "touch", "tug", "tumble", "warn", "water", "whisper",
  "whistle", "wiggle", "wink", "wonder", "wrap", "yawn",
  // V3.13: verdubbelingswerkwoorden (korte klinker + medeklinker)
  "hop", "tap", "snap", "pop", "slam", "stir", "chat", "pat", "grab",
  "drag", "flag", "pin", "slip", "skip", "spot", "brag", "shrug", "nod"
];

const IRREGULAR_VERBS = [
  // kerndeel
  { base: "be",     past: "was/were", pastParticiple: "been",     third: "is" },
  { base: "go",     past: "went",     pastParticiple: "gone",     third: "goes" },
  { base: "eat",    past: "ate",      pastParticiple: "eaten",    third: "eats" },
  { base: "see",    past: "saw",      pastParticiple: "seen",     third: "sees" },
  { base: "do",     past: "did",      pastParticiple: "done",     third: "does" },
  { base: "have",   past: "had",      pastParticiple: "had",      third: "has" },
  { base: "make",   past: "made",     pastParticiple: "made",     third: "makes" },
  { base: "take",   past: "took",     pastParticiple: "taken",    third: "takes" },
  { base: "come",   past: "came",     pastParticiple: "come",     third: "comes" },
  { base: "give",   past: "gave",     pastParticiple: "given",    third: "gives" },
  { base: "write",  past: "wrote",    pastParticiple: "written",   third: "writes" },
  { base: "speak",  past: "spoke",    pastParticiple: "spoken",   third: "speaks" },
  { base: "swim",   past: "swam",     pastParticiple: "swum",     third: "swims" },
  { base: "sing",   past: "sang",     pastParticiple: "sung",     third: "sings" },
  { base: "drink",  past: "drank",    pastParticiple: "drunk",    third: "drinks" },
  { base: "run",    past: "ran",      pastParticiple: "run",      third: "runs" },
  { base: "read",   past: "read",     pastParticiple: "read",     third: "reads" },
  { base: "sleep",  past: "slept",    pastParticiple: "slept",    third: "sleeps" },
  { base: "buy",    past: "bought",   pastParticiple: "bought",   third: "buys" },
  { base: "bring",  past: "brought",  pastParticiple: "brought",  third: "brings" },
  { base: "think",  past: "thought",  pastParticiple: "thought",  third: "thinks" },
  { base: "teach",  past: "taught",   pastParticiple: "taught",   third: "teaches" },
  { base: "catch",  past: "caught",   pastParticiple: "caught",   third: "catches" },
  { base: "fly",    past: "flew",     pastParticiple: "flown",    third: "flies" },
  { base: "break",  past: "broke",    pastParticiple: "broken",   third: "breaks" },
  { base: "begin",  past: "began",    pastParticiple: "begun",    third: "begins" },
  { base: "choose", past: "chose",    pastParticiple: "chosen",   third: "chooses" },
  { base: "drive",  past: "drove",    pastParticiple: "driven",   third: "drives" },
  { base: "fall",   past: "fell",     pastParticiple: "fallen",   third: "falls" },
  { base: "feel",   past: "felt",     pastParticiple: "felt",     third: "feels" },
  { base: "find",   past: "found",    pastParticiple: "found",    third: "finds" },
  { base: "forget", past: "forgot",   pastParticiple: "forgotten", third: "forgets" },
  { base: "know",   past: "knew",     pastParticiple: "known",    third: "knows" },
  { base: "leave",  past: "left",     pastParticiple: "left",     third: "leaves" },
  { base: "lose",   past: "lost",     pastParticiple: "lost",     third: "loses" },
  { base: "meet",   past: "met",      pastParticiple: "met",      third: "meets" },
  { base: "pay",    past: "paid",     pastParticiple: "paid",     third: "pays" },
  { base: "sell",   past: "sold",     pastParticiple: "sold",     third: "sells" },
  { base: "send",   past: "sent",     pastParticiple: "sent",     third: "sends" },
  { base: "sit",    past: "sat",      pastParticiple: "sat",      third: "sits" },
  { base: "stand",  past: "stood",    pastParticiple: "stood",    third: "stands" },
  { base: "win",    past: "won",      pastParticiple: "won",      third: "wins" },
  // V3.13: nieuwe onregelmatige
  { base: "ride",      past: "rode",      pastParticiple: "ridden",    third: "rides" },
  { base: "rise",      past: "rose",      pastParticiple: "risen",     third: "rises" },
  { base: "wear",      past: "wore",      pastParticiple: "worn",      third: "wears" },
  { base: "tear",      past: "tore",      pastParticiple: "torn",      third: "tears" },
  { base: "swear",     past: "swore",     pastParticiple: "sworn",    third: "swears" },
  { base: "grow",      past: "grew",      pastParticiple: "grown",     third: "grows" },
  { base: "throw",     past: "threw",     pastParticiple: "thrown",   third: "throws" },
  { base: "blow",      past: "blew",      pastParticiple: "blown",    third: "blows" },
  { base: "draw",      past: "drew",      pastParticiple: "drawn",     third: "draws" },
  { base: "show",      past: "showed",    pastParticiple: "shown",    third: "shows" },
  { base: "keep",      past: "kept",      pastParticiple: "kept",     third: "keeps" },
  { base: "lend",      past: "lent",      pastParticiple: "lent",     third: "lends" },
  { base: "mean",      past: "meant",     pastParticiple: "meant",    third: "means" },
  { base: "say",       past: "said",      pastParticiple: "said",     third: "says" },
  { base: "shine",     past: "shone",     pastParticiple: "shone",    third: "shines" },
  { base: "shoot",     past: "shot",      pastParticiple: "shot",     third: "shoots" },
  { base: "understand", past: "understood", pastParticiple: "understood", third: "understands" },
  { base: "hold",      past: "held",      pastParticiple: "held",     third: "holds" },
  { base: "tell",      past: "told",      pastParticiple: "told",     third: "tells" },
  { base: "build",     past: "built",     pastParticiple: "built",    third: "builds" },
  { base: "spend",     past: "spent",     pastParticiple: "spent",    third: "spends" },
  { base: "bend",      past: "bent",      pastParticiple: "bent",     third: "bends" },
  { base: "feed",      past: "fed",       pastParticiple: "fed",      third: "feeds" },
  { base: "lead",      past: "led",       pastParticiple: "led",      third: "leads" },
  { base: "stick",     past: "stuck",     pastParticiple: "stuck",    third: "sticks" },
  { base: "sting",     past: "stung",     pastParticiple: "stung",    third: "stings" },
  { base: "swing",     past: "swung",     pastParticiple: "swung",    third: "swings" },
  { base: "dig",       past: "dug",       pastParticiple: "dug",      third: "digs" },
  { base: "hang",      past: "hung",      pastParticiple: "hung",     third: "hangs" },
  { base: "strike",    past: "struck",    pastParticiple: "struck",   third: "strikes" },
  { base: "sweep",     past: "swept",     pastParticiple: "swept",    third: "sweeps" },
  { base: "weep",      past: "wept",      pastParticiple: "wept",     third: "weeps" },
  { base: "freeze",    past: "froze",     pastParticiple: "frozen",   third: "freezes" },
  { base: "steal",     past: "stole",     pastParticiple: "stolen",   third: "steals" },
  { base: "get",       past: "got",       pastParticiple: "gotten",   third: "gets" },
  { base: "shake",     past: "shook",     pastParticiple: "shaken",   third: "shakes" },
  { base: "wake",      past: "woke",      pastParticiple: "woken",    third: "wakes" },
  { base: "beat",      past: "beat",      pastParticiple: "beaten",   third: "beats" },
  { base: "bite",      past: "bit",       pastParticiple: "bitten",   third: "bites" },
  { base: "hide",      past: "hid",       pastParticiple: "hidden",   third: "hides" },
  { base: "slide",     past: "slid",      pastParticiple: "slid",     third: "slides" },
  { base: "ring",      past: "rang",      pastParticiple: "rung",     third: "rings" },
  { base: "sink",      past: "sank",      pastParticiple: "sunk",     third: "sinks" },
  { base: "spring",    past: "sprang",    pastParticiple: "sprung",   third: "springs" },
  { base: "cost",      past: "cost",      pastParticiple: "cost",     third: "costs" },
  { base: "cut",       past: "cut",       pastParticiple: "cut",      third: "cuts" },
  { base: "hit",       past: "hit",       pastParticiple: "hit",      third: "hits" },
  { base: "hurt",      past: "hurt",      pastParticiple: "hurt",     third: "hurts" },
  { base: "let",       past: "let",       pastParticiple: "let",      third: "lets" },
  { base: "put",       past: "put",       pastParticiple: "put",      third: "puts" }
];

const IRREGULAR_MAP = Object.fromEntries(
  IRREGULAR_VERBS.map(v => [v.base, v])
);

// Spelfuncties voor regelmatige werkwoorden
function thirdPerson(base) {
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
  if (/(s|sh|ch|x|z|o)$/.test(base)) return base + "es";
  return base + "s";
}

// Werkwoorden waarvan de laatste medeklinker verdubbelt in de -ing vorm
// (korte beklemtoonde lettergreep: stop -> stopping). Andere klinker-medeklinker
// werkwoorden verdubbelen NIET: read -> reading, visit -> visiting.
const DOUBLING_VERBS = [
  "stop", "jog", "sit", "run", "swim", "cut", "put", "get", "let", "plan",
  "drop", "win", "begin", "travel",
  // V3.13: nieuwe verdubbelingswerkwoorden
  "hop", "tap", "snap", "pop", "slam", "stir", "chat", "pat", "grab",
  "drag", "flag", "pin", "slip", "skip", "spot", "brag", "shrug", "nod",
  "hug", "rub", "spill"
];

function pastSimple(base) {
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ied";
  if (/e$/.test(base)) return base + "d";
  if (DOUBLING_VERBS.includes(base)) return base + base.slice(-1) + "ed";
  return base + "ed";
}

function ing(base) {
  if (/ie$/.test(base)) return base.slice(0, -2) + "ying";
  if (/e$/.test(base)) return base.slice(0, -1) + "ing";
  if (DOUBLING_VERBS.includes(base)) return base + base.slice(-1) + "ing";
  return base + "ing";
}

function verbInfo(base) {
  const irr = IRREGULAR_MAP[base];
  if (irr) return {
    base,
    past: irr.past.split("/")[0],
    pastParticiple: irr.pastParticiple,
    third: irr.third || thirdPerson(base),
    ing: ing(base),
    irregular: true
  };
  return {
    base,
    past: pastSimple(base),
    pastParticiple: pastSimple(base),
    third: thirdPerson(base),
    ing: ing(base),
    irregular: false
  };
}

function randomVerb() {
  const all = REGULAR_VERBS.concat(IRREGULAR_VERBS.map(v => v.base));
  return all[Math.floor(Math.random() * all.length)];
}

const SUBJECTS = ["I", "you", "he", "she", "it", "we", "they"];
// Persoonlijke onderwerpen voor "normale" zinnen (geen "it" voor weer-achtige constructies)
const PERSONAL_SUBJECTS = ["I", "you", "he", "she", "we", "they"];
const SUBJECT_DATA = {
  "I":     { person: 1, plural: false },
  "you":   { person: 2, plural: true },
  "he":    { person: 3, plural: false },
  "she":   { person: 3, plural: false },
  "it":    { person: 3, plural: false },
  "we":    { person: 1, plural: true },
  "they":  { person: 3, plural: true }
};

function randomSubject() {
  return PERSONAL_SUBJECTS[Math.floor(Math.random() * PERSONAL_SUBJECTS.length)];
}
