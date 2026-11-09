# Skill: Code-Optimalisatie & Refactoring

## Wanneer gebruiken
Na meerdere feature-rondes, wanneer de bundel groeit, of wanneer dezelfde code op veel plekken gekopieerd lijkt. Ook preventief: 1× per paar versies.

## Doel
De hele codebase nalopen op: duplicatie, dode code, omhaal-constructies en "250 regels die in 30 kunnen". Gedrag MAG niet veranderen — alleen de vorm.

## Stap 1 — Meten (eerst feiten, dan menen)
```bash
# Grootste bestanden
wc -l js/**/*.js server/*.js index.html css/style.css | sort -rn | head -15

# Bundelgrootte
ls -la english-tenses-trainer.html

# Meest voorkomende patronen (kandidaat-hervatting)
grep -c "addEventListener" js/app.js
grep -c "async function load" server/teacher.html
grep -c "JSON.parse" js/ -r
grep -c "style.display" js/app.js
```
Noteer de getallen vóór en ná — dat is het bewijs van de optimalisatie.

## Stap 2 — Duplicatie zoeken (hoogste prioriteit)
1. Herhaalde blokken >5 regels: zelfde DOM-mock in tests, zelfde fetch-then-catch, zelfde innerHTML-render
2. Bijna-dubbele functies: `checkVocab`/`checkDetective`/`checkAnswer` delen 80% structuur → kandidaat voor één generieke `runCheck(ctx)`
3. Copy-paste tussen views: view-switch, focus+scrollIntoView-patroon, hint-escalatie
4. Herhaalde serverpatronen: `if (req.method === ...)`-routes met dezelfde auth+validatie-preamble → overweeg een kleine route-helper

## Stap 3 — Per bestand de "250→30"-vraag
Stel bij elk bestand >150 regels:
- **Kan data dit vervangen?** Lijstjes/kaarten die als code geschreven zijn (if/else-ketens, geneste ternaries) zijn vaak een tabel die 10× kleiner is
- **Kan één generieke functie N specialisaties vervangen?** (bv. 4 check-functies → 1 met een config-object)
- **Is er dode code?** Ongebruikte functies, never-reached branches, legacy-fallbacks die niets meer vangen (`grep -n "functienaam"` — 1 hit = alleen definitie = dood)
- **Kunnen herhaalde CSS-selectors samengevat worden?** (dubbele @media-blokken!)

## Stap 4 — Veilig refactoren (de regels)
1. **Eén refactor per commit** — nooit mengen met features
2. **Vóór:** draai alle bestaande tests; noteer groen
3. **Tijdens:** gedrag identiek houden — zelfde teksten, zelfde endpoints, zelfde data-layout
4. **Na:** alle tests opnieuw groen + build + bundel-check (bevat de bundel de refactored code?)
5. **Test de UI-paden die geen unittest hebben** handmatig: login, oefenen, Whiskers-menu, dashboard
6. Bij twijfel: NIET refactoren. Werkende lelijke code > mooie kapotte code

## Stap 5 — Rapport
| Bestand | Vóór | Na | Wat veranderde | Teststatus |
|---|---|---|---|---|
Plus: bundelgrootte vóór/na, aantal verwijderde duplicaten, dode code weggehaald.

## Anti-patronen om te herkennen
- **Mock-duplicatie in tests**: elke testfile herhaalt de DOM-mock → één gedeelde `test/helpers.js`
- **String-gebaseerde route-matching met 20 if's**: overweeg een routetabel `{"/api/x": handler}`
- **innerHTML met lange template-strings**: prima, maar esc() nooit vergeten
- **Commentaren die leugens vertellen**: na refactors comments meenemen
- **Te voorzichtige fallbacks**: code die een fallback heeft voor een situatie die nooit meer kan (legacy-formaat migraties die al lang uitgerold zijn)

## Golden rules
- Meet eerst: geen refactor zonder getal vóór en ná
- Kleinere bundel en minder regels zijn bijproducten; het doel is leesbaarheid en minder plekken waar bugs kunnen zitten
- Optimisatie van hot paths (oefen-flow) alleen met bewijs (meetbaar traag), niet op gevoel
