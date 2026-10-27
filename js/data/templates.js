// Zinsjablonen per tijd, met optionele werkwoordenlijst voor goede combinaties.
// "verbs" weglaten = de zin past bij elk persoonlijk werkwoord.
// "__blank__" markeert het antwoord; "(to + werkwoord)" toont de infinitief.

const TEMPLATES = {
  "present-simple": [
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "listen"], en: (s, v) => `${s} __blank__ (to ${v}) every day.` },
    { verbs: ["play", "watch", "enjoy", "study", "read", "cook"], en: (s, v) => `On Sundays, ${s} __blank__ (to ${v}).` },
    { verbs: ["play", "watch", "enjoy", "study"], en: (s, v) => `${s} __blank__ (to ${v}) football after school.` },
    { verbs: ["go", "walk", "run", "drive", "travel", "hurry", "arrive"], en: (s, v) => `${s} __blank__ (to ${v}) to school every morning.` }
  ],
  "past-simple": [
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "listen", "call", "help"], en: (s, v) => `Yesterday, ${s} __blank__ (to ${v}).` },
    { verbs: ["watch", "see", "enjoy"], en: (s, v) => `${s} __blank__ (to ${v}) a beautiful film last night.` },
    { verbs: ["go", "walk", "run", "drive", "travel", "hurry"], en: (s, v) => `${s} __blank__ (to ${v}) to the park yesterday.` },
    { verbs: ["buy", "read", "find", "choose", "lose"], en: (s, v) => `Last week, ${s} __blank__ (to ${v}) a book.` }
  ],
  "present-perfect": [
    { verbs: ["read", "study", "cook", "clean", "work", "write", "buy"], en: (s, v) => `This week, ${s} __blank__ (to ${v}) twice.` },
    { verbs: ["sleep", "eat", "drink", "work", "study", "read", "run"], en: (s, v) => `Since this morning, ${s} __blank__ (to ${v}).` },
    { verbs: ["go", "travel", "fly", "drive"], en: (s, v) => `${s} __blank__ (to ${v}) to London three times.` },
    { verbs: ["read", "buy", "finish"], en: (s, v) => `${s} __blank__ (to ${v}) the book already.` }
  ],
  "present-continuous": [
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play"], en: (s, v) => `Look! ${s} __blank__ (to ${v}) right now.` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play"], en: (s, v) => `At the moment, ${s} __blank__ (to ${v}).` },
    { verbs: ["write", "read", "send", "open", "deliver", "type"], en: (s, v) => `${s} __blank__ (to ${v}) a letter at the moment.` }
  ],
  "past-continuous": [
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `At 8 o'clock last night, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `While ${s} __blank__ (to ${v}), the phone rang.` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `When I arrived, ${s} __blank__ (to ${v}).` }
  ],
  "future-simple": [
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "call", "help"], en: (s, v) => `Tomorrow, ${s} __blank__ (to ${v}).` },
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "call", "help"], en: (s, v) => `Next week, ${s} __blank__ (to ${v}).` },
    { verbs: ["watch", "win", "play", "see"], en: (s, v) => `I think ${s} __blank__ (to ${v}) the match next week.` },
    { verbs: ["meet", "call", "help", "join"], en: (s, v) => `${s} __blank__ (to ${v}) you at the station tomorrow.` }
  ],
  "past-perfect": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "buy", "sleep", "eat"], en: (s, v) => `Before the film started, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "study", "work", "cook", "clean", "write", "buy", "sleep", "eat"], en: (s, v) => `By the time I arrived, ${s} __blank__ (to ${v}).` },
    { verbs: ["go", "walk", "run", "drive", "travel", "hurry", "leave"], en: (s, v) => `${s} __blank__ (to ${v}) home before it started to rain.` }
  ],
  "future-continuous": [
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `At 9 o'clock tomorrow, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `This time tomorrow, ${s} __blank__ (to ${v}).` }
  ],
  "present-perfect-continuous": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "walk", "run", "play", "sleep"], en: (s, v) => `${s} __blank__ (to ${v}) for two hours.` },
    { verbs: ["read", "study", "work", "cook", "clean", "write", "walk", "run", "play", "sleep"], en: (s, v) => `${s} __blank__ (to ${v}) all morning.` }
  ],
  "past-perfect-continuous": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "walk", "run", "play", "sleep"], en: (s, v) => `${s} __blank__ (to ${v}) for an hour when I called.` }
  ],
  "future-perfect": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "buy", "sleep", "eat"], en: (s, v) => `By the end of the day, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "buy", "write", "study"], en: (s, v) => `By next year, ${s} __blank__ (to ${v}) ten books.` }
  ],
  "future-perfect-continuous": [
    { verbs: ["work", "study", "teach", "live", "play"], en: (s, v) => `By June, ${s} __blank__ (to ${v}) for five years.` }
  ]
};

// Kiest een sjabloon dat past bij het opgegeven werkwoord.
function pickTemplate(tenseId, verb) {
  const all = TEMPLATES[tenseId] || [];
  const list = all.filter(t => !t.verbs || t.verbs.includes(verb));
  const pool = list.length ? list : all;
  return pool[Math.floor(Math.random() * pool.length)];
}
