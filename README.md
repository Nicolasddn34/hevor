# Hevor

Carnet de musculation installable sur iPhone et Android : séances enregistrées, chrono de repos automatique, records par exercice, bilan de fin de séance et export PDF de la progression.

## Comment c'est construit

- `index.html` : toute l'appli (interface, bibliothèque de 148 exercices, pictogrammes, statistiques).
- `config.js` : les identifiants du projet Firebase (comptes et sauvegarde).
- `sw.js` : garde l'appli sur le téléphone pour l'ouvrir sans réseau.
- `manifest.webmanifest` et `icons/` : nom, couleurs et icône sur l'écran d'accueil.
- `firestore.rules` : règles de sécurité à coller dans Firebase. Chaque utilisateur ne voit que ses données.

## Mettre en ligne une mise à jour

1. Modifier les fichiers et les envoyer sur la branche `main`.
2. Dans `sw.js`, augmenter `VERSION` (ex. `hevor-1.0.1`) pour que les téléphones prennent la nouvelle version.
3. GitHub Pages republie le site en une minute environ.
