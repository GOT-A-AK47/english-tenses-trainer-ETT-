// V3.3: Detective mode — leerlingen lezen een zin met context (tijdsmarkers)
// en moeten zelf afleiden WELKE tijd ze nodig hebben. De zin vertelt het:
// "every day" -> present simple, "yesterday" -> past simple, enz.
// Na het antwoord onthult de feedback welke tijd het was en waarom.

const DETECTIVE_SENTENCES = [
  // --- present simple (gewoontes, feiten) ---
  { tenseId: "present-simple", answer: "goes",
    sentence: "Anna ______ to school by bike every single day.",
    why: "'every day' = a habit -> present simple." },
  { tenseId: "present-simple", answer: "works",
    sentence: "My father ______ in a hospital. He is a nurse.",
    why: "A fact that is true now -> present simple." },
  { tenseId: "present-simple", answer: "rains",
    sentence: "It often ______ in Belgium, so bring an umbrella.",
    why: "'often' = a habit -> present simple." },

  // --- present continuous (nu bezig) ---
  { tenseId: "present-continuous", answer: "is watching",
    sentence: "Be quiet! The baby ______ television right now.",
    why: "'right now' = happening at this moment -> present continuous." },
  { tenseId: "present-continuous", answer: "are playing",
    sentence: "Look! The children ______ football in the garden at the moment.",
    why: "'Look!' + 'at the moment' = now -> present continuous." },

  // --- past simple (afgerond verleden) ---
  { tenseId: "past-simple", answer: "visited",
    sentence: "Last summer, we ______ our grandparents in Italy.",
    why: "'last summer' = finished past -> past simple." },
  { tenseId: "past-simple", answer: "watched",
    sentence: "Yesterday evening, I ______ a great film on TV.",
    why: "'yesterday' = finished past -> past simple." },

  // --- past continuous (bezig in het verleden) ---
  { tenseId: "past-continuous", answer: "was cooking",
    sentence: "The phone rang while she ______ dinner in the kitchen.",
    why: "'while' + an action in progress in the past -> past continuous." },
  { tenseId: "past-continuous", answer: "were playing",
    sentence: "At eight o'clock last night, the kids ______ in their room.",
    why: "An action in progress at a past moment -> past continuous." },

  // --- present perfect (verleden met relevantie nu) ---
  { tenseId: "present-perfect", answer: "has lost",
    sentence: "Oh no! Tom ______ his keys, so he can't get into the house.",
    why: "The past matters now (he can't get in) -> present perfect." },
  { tenseId: "present-perfect", answer: "have never been",
    sentence: "I ______ to London, but I would love to go someday.",
    why: "Life experience up to now -> present perfect." },

  // --- present perfect continuous (duur tot nu) ---
  { tenseId: "present-perfect-continuous", answer: "has been studying",
    sentence: "Emma ______ for three hours already, and she's still going.",
    why: "Started in the past, still going on ('for three hours') -> present perfect continuous." },

  // --- past perfect (eerder dan iets anders) ---
  { tenseId: "past-perfect", answer: "had left",
    sentence: "When we arrived at the station, the train ______ already.",
    why: "The train left BEFORE we arrived -> past perfect." },
  { tenseId: "past-perfect", answer: "had eaten",
    sentence: "I wasn't hungry because I ______ just before the party started.",
    why: "Eating happened before the other past action -> past perfect." },

  // --- past perfect continuous (duur vóór iets in het verleden) ---
  { tenseId: "past-perfect-continuous", answer: "had been waiting",
    sentence: "The bus finally came. We ______ for forty minutes in the rain.",
    why: "A duration before another past moment -> past perfect continuous." },

  // --- future simple (belofte/voorspelling) ---
  { tenseId: "future-simple", answer: "will help",
    sentence: "Don't worry, I ______ you with your homework tomorrow.",
    why: "A promise about the future -> future simple (will)." },
  { tenseId: "future-simple", answer: "will rain",
    sentence: "Look at those dark clouds! It ______ soon.",
    why: "A prediction about the future -> future simple (will)." },

  // --- future continuous (bezig in de toekomst) ---
  { tenseId: "future-continuous", answer: "will be flying",
    sentence: "This time tomorrow, we ______ to New York on holiday.",
    why: "An action in progress at a future moment -> future continuous." },

  // --- future perfect (afgerond vóór toekomstig moment) ---
  { tenseId: "future-perfect", answer: "will have finished",
    sentence: "By the end of this year, I ______ all twelve tenses.",
    why: "Completed before a future moment ('by...') -> future perfect." },

  // --- future perfect continuous (duur tot toekomstig moment) ---
  { tenseId: "future-perfect-continuous", answer: "will have been living",
    sentence: "In June, my parents ______ in this house for twenty years.",
    why: "A duration up to a future moment -> future perfect continuous." }
];
