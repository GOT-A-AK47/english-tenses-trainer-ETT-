// Present Perfect Continuous: have/has been + ing
var TENSE = {
  id: "present-perfect-continuous",
  name: "Present Perfect Continuous",
  color: "#d35400",
  conjugate: (subj, v) => `${isThird(subj) ? "has" : "have"} been ${v.ing}`,
  explain: "Onthoud: have/has been + werkwoord+ing.",
  hint: () => "have/has been + werkwoord + ing."
};
TenseRegistry.register(TENSE);
