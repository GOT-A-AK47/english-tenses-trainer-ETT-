// Werkwoorden-data: regelmatig + onregelmatig.
// vorm: { base, past, pastParticiple, third (optioneel, voor onregelmatige -s) }

const REGULAR_VERBS = [
  "walk", "play", "work", "jump", "clean", "cook", "watch", "talk",
  "listen", "help", "open", "close", "study", "visit", "arrive", "borrow",
  "call", "dance", "decide", "deliver", "enjoy", "explain", "follow",
  "gather", "happen", "hurry", "improve", "jog", "kick", "laugh", "look",
  "move", "notice", "offer", "paint", "question", "rain", "smile", "start",
  "travel", "type", "use", "wait", "walk", "wash", "yell", "shout", "cook"
];

const IRREGULAR_VERBS = [
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
  { base: "write",  past: "wrote",    pastParticiple: "written",  third: "writes" },
  { base: "speak",  past: "spoke",    pastParticiple: "spoken",   third: "speaks" },
  { base: "swim",   past: "swam",     pastParticiple: "swum",     third: "swims" },
  { base: "sing",   past: "sang",     pastParticiple: "sung",     third: "sings" },
  { base: "drink",  past: "drank",    pastParticiple: "drunk",    third: "drinks" },
  { base: "run",    past: "ran",     pastParticiple: "run",      third: "runs" },
  { base: "read",   past: "read",     pastParticiple: "read",     third: "reads" },
  { base: "sleep",  past: "slept",    pastParticiple: "slept",    third: "sleeps" },
  { base: "buy",    past: "bought",   pastParticiple: "bought",   third: "buys" },
  { base: "bring",  past: "brought",  pastParticiple: "brought",  third: "brings" },
  { base: "think",  past: "thought", pastParticiple: "thought",  third: "thinks" },
  { base: "teach",  past: "taught",  pastParticiple: "taught",   third: "teaches" },
  { base: "catch",  past: "caught",  pastParticiple: "caught",   third: "catches" },
  { base: "fly",    past: "flew",    pastParticiple: "flown",    third: "flies" },
  { base: "break",  past: "broke",   pastParticiple: "broken",   third: "breaks" },
  { base: "begin",  past: "began",   pastParticiple: "begun",    third: "begins" },
  { base: "choose", past: "chose",   pastParticiple: "chosen",   third: "chooses" },
  { base: "drive",  past: "drove",   pastParticiple: "driven",   third: "drives" },
  { base: "fall",   past: "fell",    pastParticiple: "fallen",   third: "falls" },
  { base: "feel",   past: "felt",    pastParticiple: "felt",     third: "feels" },
  { base: "find",   past: "found",   pastParticiple: "found",    third: "finds" },
  { base: "forget", past: "forgot",  pastParticiple: "forgotten", third: "forgets" },
  { base: "know",   past: "knew",    pastParticiple: "known",    third: "knows" },
  { base: "leave",  past: "left",    pastParticiple: "left",     third: "leaves" },
  { base: "lose",   past: "lost",    pastParticiple: "lost",     third: "loses" },
  { base: "meet",   past: "met",     pastParticiple: "met",      third: "meets" },
  { base: "pay",    past: "paid",    pastParticiple: "paid",     third: "pays" },
  { base: "sell",   past: "sold",    pastParticiple: "sold",     third: "sells" },
  { base: "send",   past: "sent",    pastParticiple: "sent",     third: "sends" },
  { base: "sit",    past: "sat",     pastParticiple: "sat",      third: "sits" },
  { base: "stand", past: "stood",   pastParticiple: "stood",     third: "stands" },
  { base: "win",    past: "won",     pastParticiple: "won",      third: "wins" }
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
const DOUBLING_VERBS = ["stop", "jog", "sit", "run", "swim", "cut", "put", "get", "let", "plan", "drop", "win", "begin", "travel"]; 

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
