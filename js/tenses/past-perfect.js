// Past Perfect: had + voltooid deelwoord, vóór iets anders in verleden
var TENSE = {
  id: "past-perfect",
  name: "Past Perfect",
  color: "#34495e",
  conjugate: (subj, v) => `had ${v.pastParticiple}`,
  hint: () => "had + voltooid deelwoord."
};
TenseRegistry.register(TENSE);
