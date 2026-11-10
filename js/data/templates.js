// Zinsjablonen per tijd, met optionele werkwoordenlijst voor goede combinaties.
// "verbs" weglaten = de zin past bij elk persoonlijk werkwoord.
// "__blank__" markeert het antwoord; "(to + werkwoord)" toont de infinitief.
// V3.13: uitgebreid naar ~100 sjablonen (was 33) met ruimere werkwoordenlijsten.

const TEMPLATES = {
  "present-simple": [
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "listen", "brush", "practise", "tidy"], en: (s, v) => `${s} __blank__ (to ${v}) every day.` },
    { verbs: ["play", "watch", "enjoy", "study", "read", "cook", "visit", "bake", "paint"], en: (s, v) => `On Sundays, ${s} __blank__ (to ${v}).` },
    { verbs: ["play", "watch", "enjoy", "study", "practise"], en: (s, v) => `${s} __blank__ (to ${v}) football after school.` },
    { verbs: ["go", "walk", "run", "drive", "travel", "hurry", "arrive", "cycle", "ride"], en: (s, v) => `${s} __blank__ (to ${v}) to school every morning.` },
    { verbs: ["love", "hate", "enjoy", "like"], en: (s, v) => `${s} __blank__ (to ${v}) pizza.` },
    { verbs: ["speak", "read", "write", "study", "teach"], en: (s, v) => `${s} __blank__ (to ${v}) English with the teacher every week.` },
    { verbs: ["drink", "eat", "buy", "make", "cook"], en: (s, v) => `${s} __blank__ (to ${v}) tea every evening.` },
    { verbs: ["help", "call", "visit", "answer", "greet", "thank"], en: (s, v) => `After dinner, ${s} __blank__ (to ${v}) grandma.` },
    { verbs: ["listen", "sing", "dance", "play", "watch"], en: (s, v) => `${s} __blank__ (to ${v}) to music before bed.` },
    { verbs: ["feed", "brush", "walk", "wash", "hug"], en: (s, v) => `${s} __blank__ (to ${v}) the dog every afternoon.` }
  ],
  "past-simple": [
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "listen", "call", "help", "paint", "bake"], en: (s, v) => `Yesterday, ${s} __blank__ (to ${v}).` },
    { verbs: ["watch", "see", "enjoy", "finish", "review"], en: (s, v) => `${s} __blank__ (to ${v}) a beautiful film last night.` },
    { verbs: ["go", "walk", "run", "drive", "travel", "hurry", "cycle", "ride"], en: (s, v) => `${s} __blank__ (to ${v}) to the park yesterday.` },
    { verbs: ["buy", "read", "find", "choose", "lose", "borrow", "order"], en: (s, v) => `Last week, ${s} __blank__ (to ${v}) a book.` },
    { verbs: ["eat", "drink", "make", "cook", "taste", "serve"], en: (s, v) => `This morning, ${s} __blank__ (to ${v}) breakfast.` },
    { verbs: ["find", "lose", "see", "meet", "discover", "notice"], en: (s, v) => `${s} __blank__ (to ${v}) an old photo last weekend.` },
    { verbs: ["break", "drop", "lose", "spill"], en: (s, v) => `${s} __blank__ (to ${v}) a glass yesterday evening.` },
    { verbs: ["visit", "call", "help", "answer", "greet", "thank", "hug"], en: (s, v) => `Last Sunday, ${s} __blank__ (to ${v}) their grandparents.` },
    { verbs: ["play", "win", "lose", "watch", "join"], en: (s, v) => `Two days ago, ${s} __blank__ (to ${v}) a match.` },
    { verbs: ["study", "write", "read", "finish", "pass"], en: (s, v) => `Last year, ${s} __blank__ (to ${v}) the exam.` }
  ],
  "present-perfect": [
    { verbs: ["read", "study", "cook", "clean", "work", "write", "buy", "paint", "practise"], en: (s, v) => `This week, ${s} __blank__ (to ${v}) twice.` },
    { verbs: ["sleep", "eat", "drink", "work", "study", "read", "run", "jog"], en: (s, v) => `Since this morning, ${s} __blank__ (to ${v}).` },
    { verbs: ["go", "travel", "fly", "drive", "sail"], en: (s, v) => `${s} __blank__ (to ${v}) to London three times.` },
    { verbs: ["read", "buy", "finish", "borrow", "choose"], en: (s, v) => `${s} __blank__ (to ${v}) the book already.` },
    { verbs: ["break", "lose", "find", "forget", "hide"], en: (s, v) => `Oh no! ${s} __blank__ (to ${v}) the keys.` },
    { verbs: ["eat", "drink", "taste", "try", "buy"], en: (s, v) => `${s} __blank__ (to ${v}) sushi before.` },
    { verbs: ["meet", "see", "know", "speak", "visit"], en: (s, v) => `${s} __blank__ (to ${v}) that singer before.` },
    { verbs: ["grow", "build", "make", "paint", "decorate"], en: (s, v) => `${s} __blank__ (to ${v}) a treehouse this summer.` }
  ],
  "present-continuous": [
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "paint", "brush"], en: (s, v) => `Look! ${s} __blank__ (to ${v}) right now.` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "bake", "tidy"], en: (s, v) => `At the moment, ${s} __blank__ (to ${v}).` },
    { verbs: ["write", "read", "send", "open", "deliver", "type"], en: (s, v) => `${s} __blank__ (to ${v}) a letter at the moment.` },
    { verbs: ["run", "walk", "swim", "cycle", "ride", "jump", "crawl"], en: (s, v) => `Be quiet! ${s} __blank__ (to ${v}) in the garden.` },
    { verbs: ["eat", "drink", "taste", "cook", "serve"], en: (s, v) => `Right now, ${s} __blank__ (to ${v}) a sandwich.` },
    { verbs: ["watch", "enjoy", "review", "film"], en: (s, v) => `${s} __blank__ (to ${v}) a film tonight.` },
    { verbs: ["help", "carry", "push", "pull", "lift"], en: (s, v) => `Can't you see? ${s} __blank__ (to ${v}) the boxes right now.` },
    { verbs: ["study", "practise", "write", "read", "memorise"], en: (s, v) => `This week, ${s} __blank__ (to ${v}) for the test.` }
  ],
  "past-continuous": [
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep", "paint"], en: (s, v) => `At 8 o'clock last night, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `While ${s} __blank__ (to ${v}), the phone rang.` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `When I arrived, ${s} __blank__ (to ${v}).` },
    { verbs: ["drive", "ride", "cycle", "walk", "travel", "hurry"], en: (s, v) => `${s} __blank__ (to ${v}) home when it started to rain.` },
    { verbs: ["watch", "enjoy", "film"], en: (s, v) => `All evening yesterday, ${s} __blank__ (to ${v}) a series.` },
    { verbs: ["sleep", "dream", "rest", "doze"], en: (s, v) => `${s} __blank__ (to ${v}) when the alarm went off.` },
    { verbs: ["talk", "whisper", "argue", "chat", "discuss"], en: (s, v) => `While ${s} __blank__ (to ${v}), the teacher walked in.` }
  ],
  "future-simple": [
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "call", "help", "paint", "bake"], en: (s, v) => `Tomorrow, ${s} __blank__ (to ${v}).` },
    { verbs: ["play", "study", "work", "read", "cook", "clean", "jog", "walk", "swim", "sing", "dance", "call", "help", "visit"], en: (s, v) => `Next week, ${s} __blank__ (to ${v}).` },
    { verbs: ["watch", "win", "play", "see", "join"], en: (s, v) => `I think ${s} __blank__ (to ${v}) the match next week.` },
    { verbs: ["meet", "call", "help", "join", "greet", "thank"], en: (s, v) => `${s} __blank__ (to ${v}) you at the station tomorrow.` },
    { verbs: ["be", "go", "come", "stay", "arrive", "travel"], en: (s, v) => `Next summer, ${s} __blank__ (to ${v}) to Spain.` },
    { verbs: ["help", "carry", "lift", "push", "pull", "fetch"], en: (s, v) => `Don't worry, ${s} __blank__ (to ${v}) you with the homework.` },
    { verbs: ["buy", "order", "choose", "make", "bake"], en: (s, v) => `${s} __blank__ (to ${v}) a present for her birthday.` }
  ],
  "past-perfect": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "buy", "sleep", "eat", "paint", "finish"], en: (s, v) => `Before the film started, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "study", "work", "cook", "clean", "write", "buy", "sleep", "eat", "finish"], en: (s, v) => `By the time I arrived, ${s} __blank__ (to ${v}).` },
    { verbs: ["go", "walk", "run", "drive", "travel", "hurry", "leave", "cycle", "ride"], en: (s, v) => `${s} __blank__ (to ${v}) home before it started to rain.` },
    { verbs: ["eat", "drink", "finish", "taste"], en: (s, v) => `${s} __blank__ (to ${v}) all the cake before the party.` },
    { verbs: ["lose", "break", "forget", "hide", "spend"], en: (s, v) => `${s} __blank__ (to ${v}) the ticket before the show.` },
    { verbs: ["see", "meet", "know", "speak"], en: (s, v) => `${s} __blank__ (to ${v}) him before the wedding.` }
  ],
  "future-continuous": [
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep", "paint"], en: (s, v) => `At 9 o'clock tomorrow, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "write", "study", "work", "cook", "clean", "listen", "sing", "dance", "play", "walk", "run", "sleep"], en: (s, v) => `This time tomorrow, ${s} __blank__ (to ${v}).` },
    { verbs: ["fly", "drive", "travel", "sail", "ride"], en: (s, v) => `This time next week, ${s} __blank__ (to ${v}) to New York.` },
    { verbs: ["wait", "watch", "look", "listen"], en: (s, v) => `At noon tomorrow, ${s} __blank__ (to ${v}) for the bus.` },
    { verbs: ["sleep", "rest", "dream"], en: (s, v) => `At midnight, ${s} __blank__ (to ${v}) peacefully.` }
  ],
  "present-perfect-continuous": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "walk", "run", "play", "sleep", "paint", "practise"], en: (s, v) => `${s} __blank__ (to ${v}) for two hours.` },
    { verbs: ["read", "study", "work", "cook", "clean", "write", "walk", "run", "play", "sleep", "wait"], en: (s, v) => `${s} __blank__ (to ${v}) all morning.` },
    { verbs: ["wait", "stand", "sit"], en: (s, v) => `${s} __blank__ (to ${v}) here since 3 o'clock.` },    { verbs: ["learn", "study", "practise", "teach"], en: (s, v) => `${s} __blank__ (to ${v}) English for five years.` }
  ],
  "past-perfect-continuous": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "walk", "run", "play", "sleep", "paint", "wait"], en: (s, v) => `${s} __blank__ (to ${v}) for an hour when I called.` },
    { verbs: ["wait", "stand", "sit", "watch"], en: (s, v) => `${s} __blank__ (to ${v}) for hours before the train finally arrived.` },
    { verbs: ["work", "study", "practise", "learn"], en: (s, v) => `${s} __blank__ (to ${v}) all day, so they were tired.` }
  ],
  "future-perfect": [
    { verbs: ["read", "study", "work", "cook", "clean", "write", "buy", "sleep", "eat", "finish", "paint"], en: (s, v) => `By the end of the day, ${s} __blank__ (to ${v}).` },
    { verbs: ["read", "buy", "write", "study", "finish", "borrow"], en: (s, v) => `By next year, ${s} __blank__ (to ${v}) ten books.` },
    { verbs: ["finish", "complete", "send", "deliver"], en: (s, v) => `By Friday, ${s} __blank__ (to ${v}) the project.` },
    { verbs: ["learn", "study", "practise", "memorise"], en: (s, v) => `By the exam, ${s} __blank__ (to ${v}) all the words.` }
  ],
  "future-perfect-continuous": [
    { verbs: ["work", "study", "teach", "live", "play", "practise"], en: (s, v) => `By June, ${s} __blank__ (to ${v}) for five years.` },
    { verbs: ["wait", "stand", "sit"], en: (s, v) => `By the time you arrive, ${s} __blank__ (to ${v}) for two hours.` },
    { verbs: ["travel", "drive", "fly", "walk", "run"], en: (s, v) => `By midnight, ${s} __blank__ (to ${v}) for ten hours.` }
  ]
};

// Kiest een sjabloon dat past bij het opgegeven werkwoord.
function pickTemplate(tenseId, verb) {
  const all = TEMPLATES[tenseId] || [];
  const list = all.filter(t => !t.verbs || t.verbs.includes(verb));
  const pool = list.length ? list : all;
  return pool[Math.floor(Math.random() * pool.length)];
}
