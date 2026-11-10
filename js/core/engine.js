// Oefen-engine: genereert invuloefeningen voor één tijd, een mix van tijden
// of een specifieke combinatie (voor de fouten-herhaalmodus).
// Zin en werkwoord worden samen gekozen, zodat de combinatie altijd klopt.
const ExerciseEngine = {
  capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  // Bouwt een oefening voor één concrete combinatie van tijd/onderwerp/werkwoord.
  build(tenseId, subject, verbBase) {
    const tense = TenseRegistry.get(tenseId);
    const info = verbInfo(verbBase);
    const answer = tense.conjugate(subject, info);
    const tpl = pickTemplate(tenseId, verbBase);
    let sentence = tpl.en(subject, verbBase);
    sentence = this.capitalize(sentence.replace(/\s+/g, " ").trim());
    return {
      tense,
      subject,
      verb: verbBase,
      answer,
      sentence: sentence.replace("__blank__", "______"),
      hint: tense.hint(),
      check(input) {
        const norm = s => s.trim().toLowerCase().replace(/\s+/g, " ")
          .replace(/[.!?,;]+$/, "");
        return norm(input) === norm(answer);
      }
    };
  },

  // Genereert één oefenvraag: kiest eerst een sjabloon en daarna een
  // werkwoord dat bij dat sjabloon past (andersom kan "They rain every day"
  // ontstaan). mixIds = array van tense-ids (mix-modus).
  // V3.16.1: moeilijkheid per gekozen tijd/mix — de verbMode bepaalt
  // welke werkwoorden langskomen: "regular" (easy), "irregular" (hard)
  // of alles (medium). De tijdenkeuze blijft helemaal aan de leerling.
  generate(tenseId, mixIds, opts = {}) {
    let actualId = tenseId;
    if (mixIds && mixIds.length) {
      actualId = mixIds[Math.floor(Math.random() * mixIds.length)];
    }
    const templates = TEMPLATES[actualId] || [];
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    const mode = opts.verbMode; // "regular" | "irregular" | undefined
    let verb;
    if (tpl.verbs) {
      let pool = tpl.verbs;
      if (mode === "regular") {
        pool = tpl.verbs.filter(v => !IRREGULAR_MAP[v]);
        if (!pool.length) pool = REGULAR_VERBS;
      } else if (mode === "irregular") {
        pool = tpl.verbs.filter(v => IRREGULAR_MAP[v]);
        if (!pool.length) pool = IRREGULAR_VERBS.map(v => v.base);
      }
      verb = pool[Math.floor(Math.random() * pool.length)];
    } else {
      if (mode === "regular") verb = REGULAR_VERBS[Math.floor(Math.random() * REGULAR_VERBS.length)];
      else if (mode === "irregular") verb = IRREGULAR_VERBS[Math.floor(Math.random() * IRREGULAR_VERBS.length)].base;
      else verb = randomVerb();
    }
    return this.build(actualId, randomSubject(), verb);
  }
};
