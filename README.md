# English Tenses Trainer

Een web-app voor leerlingen om Engelse tijden en vervoegingen te oefenen.
Gebouwd als modulair systeem: tijden en oefentypes zijn losse modules die je makkelijk kunt uitbreiden.

## Gebruiken

**Als leerling (één bestand):** download `english-tenses-trainer.html` en dubbelklik erop. Dat ene bestand bevat de hele app.

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
english-tenses-trainer-ETT-/
├── english-tenses-trainer.html   # ← DIT BESTAND GEBRUIKEN: de hele app in één bestand
├── build-single-file.sh         # bouwt het losse bestand opnieuw
├── index.html                   # ontwikkelaars-versie (laadt de losse modules)
├── css/style.css
└── js/
    ├── core/
    │   ├── registry.js   # TenseRegistry: alle tijden registreren zich hier
    │   ├── engine.js     # ExerciseEngine: genereert invuloefeningen
    │   ├── irregular.js  # IrregularTrainer: module voor onregelmatige werkwoorden
    │   ├── table.js      # ConjugationTable: naslagtabellen
    │   └── store.js      # ProgressStore: voortgang bewaren (V1: vervang door server)
    ├── data/
    │   ├── groups.js     # indeling Present/Past/Future voor het startscherm
    │   ├── verbs.js      # werkwoordenlijsten + spelfuncties (third person, -ed, -ing)
    │   └── templates.js  # zinsjablonen met context per tijd
    ├── tenses/           # ELKE TIJD = ÉÉN BESTAND
    │   ├── _shared.js
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

## V1: server met centrale opslag (server/)

Naast de statische site draait er een kleine pure-Node server (`server/index.js`, geen dependencies):

- **`POST /api/progress`** — leerlingen (naam + klas, zie het identiteitsvenster bij eerste gebruik) sturen hun voortgang; de server bewaart die in `server/data/progress.json`
- **`GET /api/classes`** — voortgang per klas/leerling, gebruikt door het dashboard
- **`/teacher`** — leerkrachtdashboard (achter docentencode):
  - **Klassen maken/beheren** — leerlingen kunnen alleen kiezen uit klassen die de leerkracht aanmaakte (`GET /api/classes/list` levert de openbare namenlijst)
  - **Taken toewijzen** — titel + klas + tijden; leerlingen zien de taken op hun startscherm en oefenen die tijden door elkaar (`GET /api/tasks?klas=…`)
  - **Voortgang** — per klas: vragen, score, zwakste tijd, laatst gezien
- **Docenten-auth**: eerste login op `/teacher` stelt de code in; daarna geldt alleen die code (sessies in-memory)

De front-end valt automatisch terug op localStorage als de API niet beschikbaar is (bv. de statische versie op GitHub Pages of het single-file bestand). `ProgressStore` (`js/core/store.js`) blijft de enige plek die opslaat; `MistakeStore` (fouten herhalen) blijft bewust lokaal per toestel.

Starten op de server:

```bash
node server/index.js        # poort 3000, of via PORT=8080
```

