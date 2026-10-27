// Naslagmodule: toont een vervoegingstabel per tijd en onderwerp.
const ConjugationTable = {
  build(tenseId) {
    const tense = TenseRegistry.get(tenseId);
    if (!tense) return null;
    return SUBJECTS.map(subj => ({
      subject: subj,
      form: tense.conjugate(subj, verbInfo("walk"))
    }));
  }
};
