// Future Perfect: will have + voltooid deelwoord
var TENSE = {
  id: "future-perfect",
  name: "Future Perfect",
  color: "#27ae60",
  conjugate: (subj, v) => `will have ${v.pastParticiple}`,
  hint: () => "will have + voltooid deelwoord."
};
TenseRegistry.register(TENSE);
