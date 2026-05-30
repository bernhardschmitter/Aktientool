# GitHub Pages Deployment-Checkliste

## Upload

- Repository öffnen
- Alle alten Dateien im Root-Verzeichnis entfernen oder überschreiben
- Diese Dateien hochladen:
  - index.html
  - style.css
  - app.js
  - data.js
  - version.txt
  - README.md
  - README.txt
  - DEPLOYMENT.md

## Kontrolle

Nach dem grünen Deployment diese URLs öffnen:

- https://bernhardschmitter.github.io/Aktientool/
- https://bernhardschmitter.github.io/Aktientool/version.txt

Bei Cache-Problemen:

- https://bernhardschmitter.github.io/Aktientool/?v=33

## Erwartetes Ergebnis

- Startseite zeigt Aktientool V3.3
- Aktienanzahl ist nicht 0
- Detailseite öffnet sich
- Depotseite funktioniert lokal je Browser
