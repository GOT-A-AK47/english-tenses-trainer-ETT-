// V2.5: vocabulaire-lijsten per eenheid/thema.
// Structuur: per unit een lijst woordenparen { nl, en }.
// Nieuwe lijsten toevoegen = hieronder een entry toevoegen; de UI en
// de trainer pikken alles automatisch op.
// Bron: Unit 1 "All's Well That Ends Well" (p. 40-43) — vocabulaire.

const VOCAB_LISTS = [
  {
    id: "unit1-film-genres",
    name: "Unit 1 — Film genres",
    desc: "Genres van films en series (p. 40)",
    words: [
      { nl: "een actiefilm", en: "an action film" },
      { nl: "een avonturenfilm", en: "an adventure film" },
      { nl: "een biopic", en: "a biopic" },
      { nl: "een musical", en: "a musical" },
      { nl: "een thriller", en: "a thriller" },
      { nl: "een fantasyfilm", en: "a fantasy film" },
      { nl: "een animatiefilm", en: "an animated film" },
      { nl: "een documentaire", en: "a documentary" },
      { nl: "een horrorfilm", en: "a horror film" },
      { nl: "een romantische komedie", en: "a romantic comedy" },
      { nl: "een romcom", en: "a romcom" },
      { nl: "een komedie", en: "a comedy" },
      { nl: "een romantisch drama", en: "a romantic drama" },
      { nl: "een sciencefictionfilm", en: "a science-fiction film" },
      { nl: "een sci-fifilm", en: "a sci-fi film" },
      { nl: "een western", en: "a western" },
      { nl: "een korte animatiefilm", en: "an animated short film" },
      { nl: "een dramaseries", en: "a drama series" },
      { nl: "een misdaadfilm", en: "a crime film" },
      { nl: "een kostuumdrama", en: "a costume drama" },
      { nl: "een misdaad-kostuumdrama", en: "a crime costume drama" }
    ]
  },
  {
    id: "unit1-film-words",
    name: "Unit 1 — Film words",
    desc: "Beschrijvende woorden en film-elementen (p. 40-41)",
    words: [
      { nl: "spannend", en: "exciting" },
      { nl: "saai", en: "boring" },
      { nl: "saai / vervelend", en: "dull" },
      { nl: "onderhoudend", en: "entertaining" },
      { nl: "(on)voorspelbaar", en: "(un)predictable" },
      { nl: "avontuurlijk", en: "adventurous" },
      { nl: "geweldig", en: "awesome" },
      { nl: "indrukwekkend", en: "impressive" },
      { nl: "sprookjesachtig", en: "glamorous" },
      { nl: "alledaags, gewoon", en: "ordinary" },
      { nl: "teleurgesteld", en: "disappointed" },
      { nl: "geweldig / verbazingwekkend", en: "amazing" },
      { nl: "spannend / opwindend", en: "thrilling" },
      { nl: "'feel good'", en: "feel-good" },
      { nl: "hartverwarmend", en: "heart-warming" },
      { nl: "kinderachtig", en: "childish" },
      { nl: "gruwelijk", en: "gruesome" },
      { nl: "choquerend", en: "shocking" },
      { nl: "verschrikkelijk", en: "horrible" },
      { nl: "ondertitels", en: "subtitles" },
      { nl: "nasynchroniseren", en: "to dub" },
      { nl: "verbieden", en: "to ban" },
      { nl: "een verhaal / plot", en: "a plot" },
      { nl: "een regisseur", en: "a director" },
      { nl: "een script", en: "a script" },
      { nl: "een scène", en: "a scene" },
      { nl: "een (hoofd)acteur", en: "a (lead) actor" },
      { nl: "de hoofdrol spelen in", en: "to star in" },
      { nl: "een vervolgfilm", en: "a sequel" }
    ]
  },
  {
    id: "unit1-fairy-characters",
    name: "Unit 1 — Fairy tale characters",
    desc: "Personages uit sprookjes (p. 42)",
    words: [
      { nl: "een droomprins", en: "Prince Charming" },
      { nl: "een dwerg", en: "a dwarf" },
      { nl: "een goede fee", en: "a fairy godmother" },
      { nl: "een ridder", en: "a knight" },
      { nl: "een held", en: "a hero" },
      { nl: "een tovenaar", en: "a sorcerer" },
      { nl: "een tovenares", en: "a sorceress" },
      { nl: "een reus", en: "a giant" },
      { nl: "een geest", en: "a genie" },
      { nl: "een heks", en: "a witch" },
      { nl: "een slechterik", en: "a villain" }
    ]
  },
  {
    id: "unit1-fairy-story",
    name: "Unit 1 — Fairy tale story elements",
    desc: "Verhaalelementen en vaste uitdrukkingen (p. 42-43)",
    words: [
      { nl: "een sprookjesbos", en: "an enchanted forest" },
      { nl: "in een land hier ver vandaan", en: "in a country far far away" },
      { nl: "een geheimzinnige grot", en: "a mysterious cave" },
      { nl: "een griezelig kasteel", en: "a creepy castle" },
      { nl: "een slechte stiefmoeder", en: "an evil stepmother" },
      { nl: "een giftige appel", en: "a poisonous apple" },
      { nl: "een toverspreuk uitspreken", en: "to cast a spell" },
      { nl: "een toverstokje", en: "a magic wand" },
      { nl: "een draak afslachten", en: "to slay a dragon" },
      { nl: "een zwaard", en: "a sword" },
      { nl: "de setting", en: "the setting" },
      { nl: "een hoofdpersonage", en: "a main character" },
      { nl: "een oplossing", en: "a solution" },
      { nl: "een keerpunt", en: "a twist" },
      { nl: "een keerpunt (moment)", en: "a turning point" },
      { nl: "jaloezie, afgunst", en: "envy" },
      { nl: "jaloezie", en: "jealousy" },
      { nl: "hebzucht", en: "greed" },
      { nl: "Er was eens", en: "Once upon a time there was" },
      { nl: "Eind goed, al goed", en: "All's well that ends well" },
      { nl: "nog lang en gelukkig leven", en: "to live happily ever after" },
      { nl: "een dappere ridder", en: "a brave knight" },
      { nl: "een beslissend gevecht", en: "a decisive fight" },
      { nl: "een lange queeste", en: "a long quest" },
      { nl: "gevangenschap", en: "captivity" },
      { nl: "de slang beet zijn slachtoffer", en: "the snake bit its victim" }
    ]
  }
];
