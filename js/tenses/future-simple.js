// Future Simple: will + basisvorm
var TENSE = {
  id: "future-simple",
  name: "Future Simple",
  color: "#2ecc71",
  conjugate: (subj, v) => `will ${v.base}`,
  explain: "Onthoud: will + basisvorm (zonder -s).",
  hint: () => "will + werkwoord (basisvorm)."
};
TenseRegistry.register(TENSE);
