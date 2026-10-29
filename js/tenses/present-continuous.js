// Present Continuous: nu bezig
var TENSE = {
  id: "present-continuous",
  name: "Present Continuous",
  color: "#e67e22",
  conjugate: (subj, v) => `${subj === "I" ? "am" : isThird(subj) ? "is" : "are"} ${v.ing}`,
  explain: "Onthoud: am/is/are + werkwoord+ing.",
  hint: () => "am/is/are + werkwoord + ing."
};
TenseRegistry.register(TENSE);
