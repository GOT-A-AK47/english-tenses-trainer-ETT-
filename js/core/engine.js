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
  // V3.16: moeilijkheidsgraad — "easy" gebruikt alleen regelmatige
  // werkwoorden (de tijden-mix regelt de rest van de moeilijkheid).
  generate(tenseId, mixIds, opts = {}) {
    let actualId = tenseId;
    if (mixIds && mixIds.length) {
      actualId = mixIds[Math.floor(Math.random() * mixIds.length)];
    }
    const templates = TEMPLATES[actualId] || [];
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    let verb;
    if (tpl.verbs) {
      let pool = tpl.verbs;
      if (opts.regularOnly) {
        // filter onregelmatige eruit; leeg -> willekeurig regelmatig werkwoord
        pool = tpl.verbs.filter(v => !IRREGULAR_MAP[v]);
        if (!pool.length) pool = REGULAR_VERBS;
      }
      verb = pool[Math.floor(Math.random() * pool.length)];
    } else {
      verb = opts.regularOnly
        ? REGULAR_VERBS[Math.floor(Math.random() * REGULAR_VERBS.length)]
        : randomVerb();
    }
    return this.build(actualId, randomSubject(), verb);
  }
};
