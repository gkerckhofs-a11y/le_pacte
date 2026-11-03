# Le Pacte — Catalogue narratif et skins (V2.3)

## Réalisation
**Prototype intégré au serveur local, sans publication Firebase, ni création de session réelle.**

Cette tranche introduit une bibliothèque NARRATIVE indépendante de `src/editions.ts` (éditions territoriales V1).
Les anciens parcours, moteurs `src/engine.ts` et `src/session.ts`, et cartes 33 territoires ne sont pas modifiés.

### Modules
- `src/founders-library.ts` : validation du JSON narratif, validation des skins, stockage logique de releases, catalogue et création d'un **aperçu** de session versionné.
- `server/founders-catalog.ts` : exemple Western embarqué et cinq skins prototypes chargées sans lien direct avec un Google Sheets privé.
- `content/founders-skins-v1.json` : éléments cosmétique, labels affichés, couleurs, référence de décor.
- `public/founders-setup.html` et `public/founders-setup.js` : sélecteur régie (scénario, skin, effectifs A–F).
- `test/founders-library.test.mjs` et `test/founders-catalog-http.test.mjs` : tests ciblés.

### API locale (clé régie / jeton éditeur)
- `GET /api/founders/catalog` liste les versions courantes, les skins et leur disponibilité.
- `POST /api/founders/preview` avec `{"scenarioId":"fondateurs-hot-spring-demo","skinId":"western","members":[5,5,5,5,5,5]}` vérifie la sélection et renvoie un snapshot d'aperçu. Aucune partie n'est créée.
- `POST /api/founders/stories/check` accepte un JSON du contrat `schemas/founders-story-v1.schema.json` et renvoie `{valid,errors}`. **Ce n'est ni un import ni une publication**.
- `GET /founders-setup.html` affiche le sélecteur. Le jeton n'est ni persisté ni envoyé hors des endpoints authentifiés du serveur.

### Bibliothèques
Scénarios : une publication par `scenarioId@version`, source `google_sheets` (ID conservé côté service sécurisé) ou `bundled_fixture` (démonstration locale). Le catalogue peut contenir plusieurs scénarios provenant de Google Sheets différents et plusieurs versions du même scénario, sans écraser les précédentes. La publication refuse les références manquantes, les images non HTTPS, les effets inconnus, les doublons, et les structures inattendues.

Skins : cinq habillages prototypes indépendants (Western, Mafia, Corporate, Médiéval, Futuriste). Les noms de monnaie, les libellés des indicateurs, les couleurs et les décors sont propres à chaque skin. Pour l'instant, les images de décor sont absentes : elles sont à créer et à intégrer. Choisir une skin différente de l'univers du scénario produit un **avertissement**, sans réécrire les textes.

Parties : un aperçu capture **une copie** du scénario, sa version, la skin et sa version, les effectifs des six familles et l'état initial de jeu. Les six équipes conservent une seule connexion de vote chacune. La fonction `prepareFoundersSession` n'écrit pas en base et ne délivre aucun accès.

### À développer dans les tranches suivantes
1. **Import Google Sheets en une opération** : authentification à la source, lecture des onglets, validation des graphes/effets, prévisualisation des erreurs, stockage durable, publication versionnée atomique.
2. **Parties réelles** : persistance, authentification d'un porte-parole par famille, transactions confirmées par deux équipes, invitations et sauvegarde de progression.
3. **Paramétrage en ligne** : budgets dollars, Influence, jauges initiales, objectifs, durée et règles de victoire ; l'aperçu V2.3 conserve encore le preset du prototype.
4. **Écran public et écran équipe** : ville évolutive, cinq indicateurs et stabilité, images par dilemme, informations privées selon droits.
5. **Actifs visuels** : aucune illustration du décor Western ne doit être considérée comme livrée du seul fait qu'une skin existe dans le catalogue.

### Démarrer localement
Sous Node 24+ (prérequis du dépôt) :
```sh
npm ci
npm start
```
Aller sur `http://127.0.0.1:3000/founders-setup.html` et saisir la clé régie temporaire affichée dans le terminal.

### Tests ciblés
```sh
node --test test/founders.test.mjs test/founders-library.test.mjs test/founders-catalog-http.test.mjs
```

### Protection des informations
Ne jamais ajouter l'ID d'un Google Sheets privé dans le dépôt public. Le JSON embarqué n'est qu'un **exemple** et ne synchronise pas le Google Sheets maître. Les données narratives peuvent contenir des objectifs ou des événements non publiés ; l'API de régie exige l'authentification, et les futurs endpoints publics ne devront exposer que les textes du dilemme courant et les résultats autorisés.

Toutes les données importées sont du texte et des effets déclaratifs. Aucun code, formule ou URL d'image non sécurisée ne doit être exécuté par le moteur.
