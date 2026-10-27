// Past Continuous: bezig in het verleden
var TENSE = {
  id: "past-continuous",
  name: "Past Continuous",
  color: "#e74c3c",
  conjugate: (subj, v) => `${subj === "I" ? "was" : isThird(subj) ? "was" : "were"} ${v.ing}`,
  hint: () => "was/were + werkwoord + ing."
};
TenseRegistry.register(TENSE);
