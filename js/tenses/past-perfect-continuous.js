// Past Perfect Continuous: had been + ing
var TENSE = {
  id: "past-perfect-continuous",
  name: "Past Perfect Continuous",
  color: "#7f8c8d",
  conjugate: (subj, v) => `had been ${v.ing}`,
  hint: () => "had been + werkwoord + ing."
};
TenseRegistry.register(TENSE);
