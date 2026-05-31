# Deployment V3.21

1. ZIP entpacken.
2. Alle Dateien inklusive `.github/workflows/update-prices.yml` hochladen.
3. In GitHub auf **Actions** gehen und Workflows erlauben, falls GitHub danach fragt.
4. Workflow **Update EOD prices** öffnen und **Run workflow** starten.
5. Warten, bis ein neuer Commit `Update EOD prices` erscheint.
6. Danach die Seite mit `?v=316` öffnen.

Die Action läuft zusätzlich werktags automatisch um 21:15 UTC.
