# Aktientool PWA Version 2

## Neu in dieser Version

- Watchlist als Startseite
- Detailanalyse auf eigener Seite
- Zurück-Button von der Detailanalyse
- Depot auf eigener Seite
- Zurück-Button vom Depot
- Verkaufssignal direkt auf der Depotseite
- Aktien hinzufügen am Ende der Startseite
- Suchfeld, Signalfilter und Sortierung
- Aktienliste aus der vorhandenen Watchlist als Startbestand
- Kursdaten-Abruf über Stooq als erste Datenquelle
- Fallback: Wenn keine Daten geladen werden können, bleiben vorhandene lokale Daten erhalten

## GitHub Pages Update

Alle Dateien direkt in das Repository hochladen und bestehende Dateien ersetzen:

- index.html
- style.css
- data.js
- app.js
- manifest.json
- service-worker.js
- icon.svg
- README.md

Danach unter Actions/Pages kurz warten, bis GitHub die Seite neu veröffentlicht hat.

## Hinweis zur Datenquelle

Die App versucht Kursdaten von Stooq zu laden. Nicht jeder Ticker wird dort unter exakt demselben Symbol gefunden.
Wenn ein Ticker nicht geladen wird, bleibt die Aktie trotzdem erhalten. Dann können wir das Symbol später gezielt anpassen.

## Lokale Daten

Die App speichert Daten im lokalen Browser-Speicher des Geräts. Bei einem Update der GitHub-Dateien bleiben deine lokalen Depotdaten normalerweise erhalten.
