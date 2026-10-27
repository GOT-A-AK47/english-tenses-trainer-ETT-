// Present Simple: gewoontes en feiten
var TENSE = {
  id: "present-simple",
  name: "Present Simple",
  color: "#3498db",
  conjugate: (subj, v) => isThird(subj) ? v.third : v.base,
  hint: () => "He/she/it + werkwoord + s (of -es/-ies). Zie tabel."
};
TenseRegistry.register(TENSE);
