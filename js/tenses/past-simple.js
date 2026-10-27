// Past Simple: afgeronde handelingen in het verleden
var TENSE = {
  id: "past-simple",
  name: "Past Simple",
  color: "#9b59b6",
  conjugate: (subj, v) => v.past,
  hint: () => "Werkwoord + ed, of de onregelmatige vorm (2e kolom)."
};
TenseRegistry.register(TENSE);
