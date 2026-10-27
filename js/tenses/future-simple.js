// Future Simple: will + basisvorm
var TENSE = {
  id: "future-simple",
  name: "Future Simple",
  color: "#2ecc71",
  conjugate: (subj, v) => `will ${v.base}`,
  hint: () => "will + werkwoord (basisvorm)."
};
TenseRegistry.register(TENSE);
