# Aktientool V3.19

Automatisches EOD-Kursupdate ueber GitHub Actions.

V3.19 verbessert den Kursimport:
- Yahoo Finance als primaere Quelle fuer Symbole wie ADS.DE, BMW.DE, ALV.DE usw.
- Stooq bleibt als Fallback erhalten.
- `prices.json` wird automatisch durch den Workflow `Update EOD prices` erzeugt.

Nach dem Upload in GitHub unter **Actions → Update EOD prices → Run workflow** starten.


V3.19 ergänzt im Depot eine Verkaufsfunktion: Stückzahl eingeben, Verkauf zum aktuellen Tageskurs, Gutschrift auf Cash. Die Depot-Stückzahl ist nicht mehr frei editierbar.
