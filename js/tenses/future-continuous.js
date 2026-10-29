// Future Continuous: will be + ing
var TENSE = {
  id: "future-continuous",
  name: "Future Continuous",
  color: "#16a085",
  conjugate: (subj, v) => `will be ${v.ing}`,
  explain: "Onthoud: will be + werkwoord+ing.",
  hint: () => "will be + werkwoord + ing."
};
TenseRegistry.register(TENSE);
