// V2.5: VocabTrainer — oefen NL -> EN invuloefeningen met herkansing.
// Zelfde feedback-flow als de tenses (V2.4): opnieuw tot goed of hint.
// Integreert met Whiskers/XP via Gamification.onAnswer.

const VocabTrainer = {
  current: null,   // actieve oefening { list, word, answer }
  attempts: 0,

  pickWord(listId) {
    const list = VOCAB_LISTS.find(l => l.id === listId);
    if (!list || !list.words.length) return null;
    return list.words[Math.floor(Math.random() * list.words.length)];
  },

  generate(listId) {
    const list = VOCAB_LISTS.find(l => l.id === listId);
    const word = this.pickWord(listId);
    if (!list || !word) return null;
    this.attempts = 0;
    this.current = {
      list,
      word,
      answer: word.en,
      check(input) {
        const norm = s => s.trim().toLowerCase().replace(/\s+/g, " ")
          .replace(/[.!?,;]+$/, "");
        return norm(input) === norm(this.answer);
      }
    };
    return this.current;
  },

  // True = goed beantwoord; anders false (hulp-escalatie zoals de tenses)
  submit(input, feedbackEl) {
    if (!this.current) return null;
    const ok = this.current.check(input);
    if (ok) {
      feedbackEl.textContent = `Correct! "${this.current.answer}"`;
      feedbackEl.className = "ok";
    } else {
      this.attempts++;
      if (this.attempts === 1) {
        feedbackEl.textContent = `Not right — try again! Check your spelling.`;
      } else if (this.attempts === 2) {
        feedbackEl.textContent = `Still not right. The answer starts with "${this.current.answer.slice(0, 1)}".`;
      } else {
        const third = Math.max(1, Math.ceil(this.current.answer.length / 3));
        feedbackEl.textContent = `Tip: it begins with "${this.current.answer.slice(0, third)}". Or use the hint!`;
      }
      feedbackEl.className = "nok";
    }
    return ok;
  },

  hint(feedbackEl) {
    if (!this.current) return;
    feedbackEl.textContent = `Het juiste antwoord is "${this.current.answer}".`;
    feedbackEl.className = "ok";
  }
};
