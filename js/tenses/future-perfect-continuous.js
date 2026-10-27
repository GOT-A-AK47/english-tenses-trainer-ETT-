// Future Perfect Continuous: will have been + ing
var TENSE = {
  id: "future-perfect-continuous",
  name: "Future Perfect Continuous",
  color: "#f39c12",
  conjugate: (subj, v) => `will have been ${v.ing}`,
  hint: () => "will have been + werkwoord + ing."
};
TenseRegistry.register(TENSE);
