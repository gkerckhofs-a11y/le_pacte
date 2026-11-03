# Le Pacte V2.4 — Import Google Sheets & publications narratives

Date : 3 novembre 2026. **Statut : développement sur branche ; publication Firebase non réalisée dans cette tranche.**

## Fonctionnement implémenté
- Un Google Sheets distinct peut alimenter chaque scénario via ses quatre onglets `Parametres`, `Dilemmes`, `Effets`, `Branches`. Les images d'illustration sont facultatives mais leur URL doit être en HTTPS.
- L'organisateur accède à `/founders-import.html`, se connecte à son compte Google puis autorise **l'accès en lecture seule aux feuilles**. La page lit les quatre plages via Google Sheets API ; le jeton OAuth Google ne transite jamais vers l'API de Le Pacte.
- `POST /api/founders/import/preview` reconstruit le JSON de scénario, valide la structure, les références, les embranchements, les indicateurs et les opérations, puis renvoie le contenu et son empreinte SHA-256 avec erreurs et avertissements.
- `POST /api/founders/import/publish` **relit** le Sheets avant publication, compare l'empreinte à la prévisualisation et crée une version `major.minor.patch` immuable. Toute erreur bloque l'import en totalité.
- Un studio narratif SQLite (`founders_releases`) persiste les versions en répétition locale ; Firestore (`pacteNarrativeReleases`) les persiste par propriétaire en production. Pas de modification des sessions territoriales.
- `GET /api/founders/catalog` et `POST /api/founders/preview` prennent maintenant en compte les versions privées réellement publiées, en plus du scénario de démonstration. L'identifiant du Google Sheets n'est pas repris dans le catalogue public récapitulatif.
- La régie `/founders-setup.html` propose un lien d'import et l'authentification Firebase en mode cloud ; les écrans ne lancent toujours **aucune partie narrative réelle**.

## Parcours utilisateur
1. Préparer le fichier Google Sheets et ses contenus.
2. Depuis la régie, ouvrir **Importer un scénario**.
3. Autoriser la lecture du Sheets (connexion Google de l'organisateur).
4. Coller l'URL Google Sheets. Prévisualiser. Corriger les éventuelles erreurs dans la feuille.
5. Choisir une version nouvelle (par exemple 1.0.0, puis 1.1.0). Publier.
6. Revenir au sélecteur de scénarios : nouvelle version disponible. Choisir la skin indépendamment.

## Prérequis de publication sur Firebase
- Projet : `le-pacte-ludificateur`, région `europe-west1`, base Firestore nommée `le-pacte`.
- Firebase Auth Google actif ; compte organisateur doté du claim `pacteOrganizer === true`, avec adresse vérifiée.
- **Google Sheets API activée** dans Google Cloud pour le projet OAuth pertinent et demande du scope `https://www.googleapis.com/auth/spreadsheets.readonly` autorisée. **Non vérifié sur le vrai navigateur** dans cette tranche.
- `firebase.json` autorise `sheets.googleapis.com` dans `connect-src`.
- Ne pas intégrer de clé privée ni identifiant privé de Google Sheets au dépôt public.
- Déploiement Hosting/Functions nécessite une connexion Firebase CLI ou un compte Work/CI disposant des autorisations adaptées. Ces autorisations ne sont pas confirmées depuis le chat courant.
- Commande de référence après vérification d'accès, tests et validation : `npx firebase-tools deploy --project le-pacte-ludificateur --only functions,hosting`. Elle **n'a pas été exécutée** ici.

## Limites
- La lecture OAuth Sheets depuis un navigateur Google réel n'a pas encore été exercée sur le site Firebase déployé. L'activation des scopes/API ou la connexion de l'organisateur peut nécessiter un réglage.
- L'import du Sheets **n'est pas une synchronisation permanente** : chaque publication est un snapshot immuable. Toute mise à jour nécessite un nouvel import et un nouveau numéro de version.
- Une skin graphique ne transforme pas les textes narratifs et son décor n'est pas encore développé.
- Le moteur des parties narratives, les écrans des six familles, l'écran public évolutif et les objectifs secrets ne sont pas encore branchés à ces publications.
- Les images sous URL HTTPS ne sont pas téléversées dans Firebase Storage automatiquement ; prévoir un stockage contrôlé / proxy sécurisé lors de l'implémentation de leur affichage.

## Tests ciblés
```sh
node --test test/founders-sheet-import.test.mjs test/founders-sheet-http.test.mjs
npm run build:firebase
npm run test:cloud
```
La CI existante exécute aussi les tests de non-régression du moteur territorial. La suite Firestore inclut un test ciblé de concurrence et d'immuabilité des publications.

## Ordre des branches
- PR #1 : V2.2, base `main`
- PR #2 : V2.3, base V2.2
- V2.4 : base V2.3
Ne pas fusionner V2.4 directement dans `main` avant ses dépendances et une revue de sécurité.
