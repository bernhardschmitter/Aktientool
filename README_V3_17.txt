Aktientool V3.17 - Workflow-Fix für automatisches Kursupdate

Dieses Paket ergänzt die fehlenden GitHub-Action-Dateien:

.github/workflows/update-prices.yml
.github/scripts/update-prices.js

Wichtig:
Diese Dateien müssen exakt mit diesem Pfad ins Repository hochgeladen werden.
Danach erscheint unter GitHub -> Actions ein neuer Workflow "Update Prices".
Diesen Workflow einmal manuell starten: Actions -> Update Prices -> Run workflow.

Danach sollte prices.json automatisch mit EOD-Kursdaten gefüllt werden.
