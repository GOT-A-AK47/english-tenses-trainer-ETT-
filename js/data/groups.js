// Groepering van tijden voor het startscherm: eerst Present/Past/Future,
// daaronder pas de subtijden. Nieuwe tijd in een groep zetten = hier aanpassen.
const TENSE_GROUPS = [
  {
    id: "present",
    name: "Present",
    icon: "⏱",
    desc: "Nu, gewoontes en bezig",
    tenses: ["present-simple", "present-continuous", "present-perfect", "present-perfect-continuous"]
  },
  {
    id: "past",
    name: "Past",
    icon: "🕰",
    desc: "Gisteren en vroeger",
    tenses: ["past-simple", "past-continuous", "past-perfect", "past-perfect-continuous"]
  },
  {
    id: "future",
    name: "Future",
    icon: "🚀",
    desc: "Morgen en straks",
    tenses: ["future-simple", "future-continuous", "future-perfect", "future-perfect-continuous"]
  }
];
