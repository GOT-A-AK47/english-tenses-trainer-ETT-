// V3.3: DetectiveTrainer — de leerling ziet een zin met context en moet
// zelf bepalen welke tijd nodig is. Geen tijd-label in beeld; pas na het
// antwoord wordt onthuld welke tijd het was en welke marker dat verraadde.

const DetectiveTrainer = {
  pool: [],
  index: 0,
  current: null,
  attempts: 0,
  hintUsed: false,

  init(tenseIds) {
    // V3.4: optionele filter — alleen de gekozen tijden oefenen
    let source = DETECTIVE_SENTENCES;
    if (Array.isArray(tenseIds) && tenseIds.length) {
      source = source.filter(s => tenseIds.includes(s.tenseId));
    }
    this.pool = [...source].sort(() => Math.random() - 0.5);
    this.index = 0;
  },

  next() {
    if (this.index >= this.pool.length) {
      this.pool.sort(() => Math.random() - 0.5);
      this.index = 0;
    }
    this.current = this.pool[this.index++];
    this.attempts = 0;
    this.hintUsed = false;
    return this.current;
  },

  check(input) {
    const norm = s => s.trim().toLowerCase().replace(/\s+/g, " ")
      .replace(/[.!?,;]+$/, "");
    return norm(input) === norm(this.current.answer);
  },

  // feedback-escalatie zoals de normale oefening (V2.4)
  feedback(ok, tenseName) {
    if (ok) {
      return {
        className: "ok",
        text: this.attempts > 1
          ? `Correct! "${this.current.answer}" — well done for persisting! This was: ${tenseName}. ${this.current.why}`
          : `Correct! "${this.current.answer}" — this was: ${tenseName}. ${this.current.why}`
      };
    }
    this.attempts++;
    if (this.attempts === 1) {
      return {
        className: "nok",
        text: "Not right — read the sentence again and look for time words (every day, yesterday, while, by...). Which tense do they point to?"
      };
    } else if (this.attempts === 2) {
      return {
        className: "nok",
        text: `Still not right. Hint: the answer starts with "${this.current.answer.slice(0, Math.max(1, Math.ceil(this.current.answer.length / 3)))}".`
      };
    }
    return {
      className: "nok",
      text: `Tip: it begins with "${this.current.answer.slice(0, Math.max(1, Math.ceil(this.current.answer.length / 3)))}". Or use the hint button!`
    };
  },

  reveal() {
    this.hintUsed = true;
    return {
      className: "ok",
      text: `The answer is "${this.current.answer}" — this was: ${TenseRegistry.get(this.current.tenseId).name}. ${this.current.why}`
    };
  }
};
