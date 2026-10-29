// Present Perfect: hebben + voltooid deelwoord
var TENSE = {
  id: "present-perfect",
  name: "Present Perfect",
  color: "#1abc9c",
  conjugate: (subj, v) => `${isThird(subj) ? "has" : "have"} ${v.pastParticiple}`,
  explain: "Onthoud: have/has + 3e kolom (voltooid deelwoord).",
  hint: () => "have/has + voltooid deelwoord (3e kolom)."
};
TenseRegistry.register(TENSE);
