# Hevor

Carnet de musculation installable sur iPhone et Android : séances enregistrées, chrono de repos automatique, records par exercice, niveaux, bilan de fin de séance et export PDF de la progression.

## Fichiers

- `index.html` : la page (structure et politique de sécurité du contenu).
- `app.js` / `app.css` : le code et le style de l'appli.
- `config.js` : identifiants Firebase et adresse de contact affichée dans les informations légales.
- `sw.js` : garde l'appli sur le téléphone pour l'ouvrir sans réseau.
- `vendor/` : bibliothèques Firebase et jsPDF, hébergées ici pour ne contacter aucun site tiers.
- `fonts/` : police Barlow (SIL Open Font License).
- `manifest.webmanifest`, `icons/` : nom, couleurs et icônes de l'écran d'accueil.
- `firestore.rules` : règles de sécurité à coller dans Firebase (chaque utilisateur n'accède qu'à ses données).

## Mettre en ligne une mise à jour

1. Modifier les fichiers et les envoyer sur la branche `main`.
2. Dans `sw.js`, augmenter `VERSION` (et `APP_VERSION` dans `app.js`) pour que les téléphones prennent la nouvelle version.
3. GitHub Pages republie le site en une minute environ.
