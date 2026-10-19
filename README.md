# Hevor

Carnet d'entraînement installable sur iPhone et Android, en trois espaces séparés :

- **Moi** : séances, chrono de repos, records, niveaux, export PDF. Totalement privé.
- **Club** : équipes aux couleurs du club, invitation par lien ou QR code, rôles (coach, joueur, spectateur), planning personnalisé, programmes du prépa, questionnaire du matin avec silhouette des douleurs, ressentis et tableau de l'effectif.
- **Coach** : coach indépendant et ses clients (programmes, séances, retours).

## Fichiers

- `index.html` : la page (structure et politique de sécurité du contenu).
- `app.js` / `app.css` : le code et le style de l'appli (espace Moi).
- `spaces.js` : espaces, bascule, thème aux couleurs du club, création et invitation, rôles.
- `team.js` : vues de l'équipe (coach, joueur, spectateur), planning, programmes, questionnaire, ressenti.
- `coachspace.js` : espace Coach (coach indépendant et clients).
- `config.js` : identifiants Firebase et adresse de contact affichée dans les informations légales.
- `sw.js` : garde l'appli sur le téléphone pour l'ouvrir sans réseau.
- `vendor/` : bibliothèques Firebase, jsPDF et QR Code Generator, hébergées ici pour ne contacter aucun site tiers.
- `fonts/` : police Barlow (SIL Open Font License).
- `manifest.webmanifest`, `icons/` : nom, couleurs et icônes de l'écran d'accueil.
- `firestore.rules` : règles de sécurité à coller dans Firebase (Moi privé ; dans une équipe, chacun ne voit que ce que son rôle permet).

## Mettre en ligne une mise à jour

1. Modifier les fichiers et les envoyer sur la branche `main`.
2. Dans `sw.js`, augmenter `VERSION` (et `APP_VERSION` dans `app.js`) pour que les téléphones prennent la nouvelle version.
3. Si `firestore.rules` a changé : le copier dans Firebase › Firestore Database › Règles, puis « Publier ».
4. GitHub Pages republie le site en une minute environ.
