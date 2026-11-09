# Skill: Red-Team Security Audit (websites)

## Wanneer gebruiken
Na grote feature-drops, vóór productie-gebruik met echte leerlingen, of periodiek (bv. maandelijks). Ook bij verdachte logs of gemelde misbruik.

## Doel
Systematisch gaten vinden in de beveiliging van de webapp + server. Reproduceerbaar: elke run doorloopt dezelfde stappen, zodat regressies opvallen.

## Stap 1 — Aanvalsoppervlak inventariseren
1. Lijst alle endpoints: `grep -n 'url === "/api' server/index.js`
2. Noteer per endpoint: methode, auth (publiek / teacher / admin), welke input het aanneemt
3. Lijst alle plaatsen waar gebruikersinput in opslag gaat (progress, feedback, friends, duels, names, classes, tasks)
4. Lijst alle plekken waar opslag-data naar HTML gaat (`innerHTML`, `esc()`-gebruik) in `js/app.js`, `index.html`, `server/teacher.html`

## Stap 2 — Geautomatiseerde checks (snelle greps)
```bash
# Onbeschermd JSON-parse (crash-gevoelig)
grep -n "JSON.parse(await readBody" server/index.js   # moet 0 hits zijn (readJson gebruiken)

# Ongeëscapede gebruikersdata in innerHTML
grep -n 'innerHTML' js/app.js server/teacher.html     # controleer elke hit op esc()

# Plaintext secrets op disk
ls server/data/ 2>/dev/null; grep -rn "password\|secret" server/ --include="*.js"

# Body-limiet en rate-limits aanwezig
grep -n "MAX_BODY\|RATE_LIMITS" server/index.js

# Session-TTL aanwezig
grep -n "SESSION_TTL\|expires" server/index.js
```

## Stap 3 — Handmatige audit per categorie
| Categorie | Vraag | Test |
|---|---|---|
| **Auth** | Kan elke endpoint zonder token? Zijn teacher/admin-rollen afgedwongen? | HTTP-call zonder/verlopen token → verwacht 401 |
| **Injection (XSS)** | Komt gebruikersinput ongeëscaped in HTML? Namen, feedback, labels? | Stuur `<img src=x onerror=alert(1)>` als naam/bericht → moet onschadelijk opgeslagen/gerenderd worden |
| **Crash/DoS** | Kan kapotte input de server platleggen? Grote bodies? | POST met `{kapot`, 200KB body, onbekende routes → 400/413, server blijft leven |
| **Rate limiting** | Zijn brute-force en spam afgekapt? Per IP en per gevoelige route? | 12× snel login → verwacht 429; check dat legitiem gebruik (dashboard-refresh-bursts) NIET afkapt |
| **CORS** | Kunnen andere sites de API aanroepen vanuit een leerlingen-browser? | Request met `Origin: https://evil.example` → verwacht 403; same-origin → 200 |
| **IDOR/spoofing** | Kan leerling A data van leerling B lezen/schrijven door namen te raden? | Kalender/voortgang/vriendschaps-endpoints met andermans naam → documenteer risico of voeg auth toe |
| **Data-lekken** |komen er gevoelige velden mee in publieke responses? | Vergelijk `/api/*`-responses met wat de UI nodig heeft |
| **Formule-injectie** | CSV/exports met `=`, `+`, `@`, `-` startende cellen? | Naam `=HYPERLINK(evil)` → export moet geprefixt zijn |
| **Opslag op client** | Wat zit er in localStorage/sessionStorage? Geen tokens/wachtwoorden op slechte plek? | `grep -rn "localStorage\|sessionStorage" js/` — docent-token hoort in sessionStorage |
| **Afhankelijkheden** | Externe libs/CDN's? Versies? | `grep -rn "cdn\|http" index.html` — alles moet lokaal of bewust gekozen zijn |

## Stap 4 — Exploits werkelijk proberen (testserver!)
Draai een aparte server-instantie met tijdelijke DATA_DIR:
```bash
DATA_DIR=/tmp/tenses-audit PORT=3799 node server/index.js &
```
Voer per bevinding een concrete PoC uit en noteer: request, verwachting, werkelijkheid. **Nooit op de productie-data.**

## Stap 5 — Rapport
| # | Ernst (🔴/🟠/🟡) | Bevinding | Reproductie | Voorgestelde fix |
|---|---|---|---|---|
Sorteer op ernst. Geef per bevinding: eindstatus (fixed / geaccepteerd risico / later), en welke test de fix bewaakt.

## Golden rules
- Elke fix krijgt een regressietest die hem bewaakt
- "Werkt op mijn machine" telt niet: test tegen een verse server-instantie
- Rapporteer ook wat er GOED zit (beveiligde routes, sanitizing) — dat is de baseline voor de volgende audit
- Scan na elke fix de volledige lijst opnieuw: fixes kunnen nieuwe gaten openen
