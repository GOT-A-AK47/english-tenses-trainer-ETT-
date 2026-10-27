# English Tenses Trainer

Een web-app voor leerlingen om Engelse tijden en vervoegingen te oefenen.
Gebouwd als modulair systeem: tijden en oefentypes zijn losse modules die je makkelijk kunt uitbreiden.

## Gebruiken

**Als leerling (één bestand):** download `dist/english-tenses-trainer.html` en dubbelklik erop. Dat ene bestand bevat de hele app.

**Als ontwikkelaar:** open `index.html` in een browser, of bouw het losse bestand opnieuw met `./build-single-file.sh`. Dat is alles — geen installatie of server nodig.
Je kunt de map ook op een USB-stick zetten of via GitHub Pages delen met je klas.

## Wat kun je oefenen?

| Tab | Wat het doet |
|---|---|
| **Oefenen** | Invuloefening: je krijgt een zin met context (bv. "Yesterday, she ___ (go) to the park") en vult de juiste vervoeging in. Met hint-knop, score en deelbare taak-links. |
| **Onregelmatige werkwoorden** | Geef bij een base form de past simple én past participle. Met volledige naslaglijst. |
| **Tabel** | Naslagtabel met alle onderwerpen (I/you/he/she/it/we/they) per tijd. |
| **Voortgang** | Jouw score per tijd, met voortgangsbalken. |

## Mappenstructuur

```
english-tenses-trainer/
├── index.html            # pagina + laadt alle modules in de juiste volgorde
├── css/style.css
└── js/
    ├── core/
    │   ├── registry.js   # TenseRegistry: alle tijden registreren zich hier
    │   ├── engine.js     # ExerciseEngine: genereert invuloefeningen
    │   ├── irregular.js  # IrregularTrainer: module voor onregelmatige werkwoorden
    │   ├── table.js      # ConjugationTable: naslagtabellen
    │   └── store.js      # ProgressStore: voortgang bewaren (V1: vervang door server)
    ├── data/
    │   ├── verbs.js      # werkwoordenlijsten + spelfuncties (third person, -ed, -ing)
    │   └── templates.js  # zinsjablonen met context per tijd
    ├── tenses/           # ELKE TIJD = ÉÉN BESTAND
    │   ├── _shared.js
    │   ├── present-simple.js
    │   ├── past-simple.js
    │   └── ... (12 tijden)
    └── app.js            # koppelt UI aan de modules
```

## Nieuwe tijd toevoegen (modulair!)

1. Kopieer een bestaand bestand in `js/tenses/`, bv. `present-simple.js`.
2. Pas het `TENSE`-object aan:

```js
var TENSE = {
  id: "conditional",              // uniek, gebruikt in templates
  name: "Conditional",            // zichtbaar in de UI
  color: "#e91e63",               // (optioneel) voor toekomstige styling
  conjugate: (subj, v) => `would ${v.base}`,   // de vervoeging
  hint: () => "would + basisvorm."
};
TenseRegistry.register(TENSE);
```

3. Voeg zinsjablonen toe in `js/data/templates.js` onder dezelfde `id`:

```js
"conditional": [
  { nl: "Hypothetische situatie", en: (s, v) => `${s} __blank__ (${v}) that if ${s} won.` }
]
```

4. Voeg in `index.html` één `<script>`-regel toe voor je nieuwe bestand.

Dat is alles — de UI (dropdown, tab, tabel) pikt de nieuwe tijd automatisch op.

## V1 (later): opslag op de server

Dit is V0: alles draait in de browser en voortgang staat op het toestel van de leerling.
Alle voortgang loopt via `ProgressStore` (`js/core/store.js`) — de enige plek die bewaart.
Voor een server-backend hoef je daar alleen het `backend`-object te vervangen door `fetch()`-calls; de rest van de app blijft ongewijzigd.
