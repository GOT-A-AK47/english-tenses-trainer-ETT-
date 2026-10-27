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

## Nieuw oefentype toevoegen

Oefentypes zijn ook modules (zoals `IrregularTrainer` in `js/core/irregular.js`):
maak een nieuw bestand met een object met `init()` / `next()` / `check()`-achtige functies,
voeg een tab toe in `index.html` en hang er in `js/app.js` event listeners aan.

## Vanilla JavaScript vs. Node.js backend

**Vanilla JavaScript (deze app):**
- De app draait volledig **in de browser** van de gebruiker.
- Je hebt alleen HTML, CSS en JS-bestanden. Openen = werken.
- Geen server, geen installatie, geen kosten. Ideaal om te delen (USB, GitHub Pages, schoolnetwerk-schijf).
- Beperking: er is geen gedeeld geheugen. Scores staan op het toestel van de leerling (of verdwijnen na een refresh — deze versie bewaart ze nog niet eens).

**Node.js backend:**
- Een serverprogramma (bv. Node/Express) draait op een computer die altijd aanstaat.
- De browser praat er via HTTP mee. Hierdoor kun je:
  - scores en voortgang **opslaan in een database** en opvolgen;
  - leerlingen laten **inloggen**;
  - een **klassepaneel** maken voor je leekracht;
  - gedeelde oefenlijsten centraal beheren.
- Nadeel: iemand moet de server hosten en onderhouden. Voor een schoolproject zonder hosting-budget is dat vaak te veel van het goede.

**Vuistregel:** begin vanilla. Als scores opslaan later echt nodig is, kun je de app uitbreiden met een backend — de modulaire opbouw verandert daar niet van mee.

## Dev-paneel (verborgen)

Testgereedschap voor de ontwikkelaar, niet voor leerlingen:
- Openen: **Ctrl+Shift+D** (of URL-parameter `?dev=1`), sluiten met Escape
- **Toon antwoord**: vult het juiste antwoord in de actieve oefening
- **Injecteer fout**: zet een fout in de herhaalwachtrij om die flow te testen
- **Wis opslag / Toon opslag**: localStorage (voortgang + fouten) bekijken of resetten
- **Random seeded/normaal**: vervangt Math.random door een seed (42) voor reproduceerbare oefeningen
- **Zelftest**: controleert alle 12 vervoegingen + 120 gegenereerde oefeningen (hoofdletter, infinitief, check)

## Testen

De logica (niet de UI) kun je testen met Node:

```bash
node -e "..."   # laadt js/core + js/data + js/tenses en checkt vervoegingen
```

Alle 12 tijden, de spelfuncties (studies/watched/studied/stopping/making) en de engine zijn getest.

## V0 → V1: klaar voor de server

Dit is V0 (puur front-end, alles in de browser). De overstap naar V1 (met Node-backend) is bewust makkelijk gehouden:

- **Alle voortgang loopt via `ProgressStore`** (`js/core/store.js`). Dat is de enige plek die bewaart.
- De app gebruikt alleen `ProgressStore.record()`, `.get()` en `.all()` — nooit `localStorage` rechtstreeks.
- Vervang in `store.js` het `backend`-object door server-calls, bv.:

```js
backend: {
  load: () => fetch("/api/progress").then(r => r.json()),
  save: (data) => fetch("/api/progress", { method: "POST", body: JSON.stringify(data) })
}
```

- De rest van de app hoeft daarna niets te veranderen.
- Oefentypes en tijden zijn al losse modules; een backend voegt daar niets aan toe.

Vuistregel: begin vanilla (V0). Als scores opvolgen nodig is, voeg je alleen de server + het nieuwe `backend`-object toe.
