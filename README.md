# Le Pacte — version locale 0.4.0

Jeu de stratégie et de diplomatie du Ludificateur : six équipes, 33 territoires, 60 connexions, cinq manches et un seul vainqueur. Développement fondé sur le règlement neutre V1.1 et le cahier des charges multivers V1.0 du 2 novembre 2026.

Cette version ajoute **trois interfaces web reliées à un serveur local et à une base SQLite persistante**. Elle sert aux répétitions techniques. Le studio de contenus est disponible depuis la régie. Un projet Firebase dédié et une application web sont créés ; le backend distant, le déploiement et la validation humaine ne sont pas encore réalisés.

## Démarrage

Node.js 24 minimum. Installer les dépendances verrouillées, puis lancer le serveur :

```sh
npm ci
npm start
```

Ouvrir `http://127.0.0.1:3000` sur le même ordinateur. Le terminal affiche une clé régie temporaire ; la saisir dans l'écran de connexion. Créer une répétition, choisir un des cinq univers et ouvrir les six accès d'équipe dans des onglets distincts. Le lien de projection est accessible depuis la régie.

Les contrôles de régie permettent d'avancer les phases pour un essai accéléré. Les phases chronométrées avancent aussi automatiquement à leur échéance. Après l'initiation, le bouton « Lancer la manche 1 » démarre le jeu. L'initiation interactive n'est pas encore implémentée : cette fenêtre sert au briefing pratique de l'animateur.

Le serveur écoute uniquement sur `127.0.0.1` par défaut. Les smartphones ne peuvent donc pas rejoindre cette adresse depuis un autre appareil. L'accès en réseau local nécessite une configuration réseau et une vérification des appareils, hors validation de cette tranche. **Cette version n'est pas un service Internet de production.**

## Paramètres du serveur

| Variable | Valeur par défaut | Fonction |
|---|---|---|
| `PORT` | `3000` | Port HTTP |
| `PACTE_HOST` | `127.0.0.1` | Interface d'écoute |
| `PACTE_DATABASE` | `.data/le-pacte.sqlite` | Sauvegarde SQLite |
| `PACTE_PUBLIC_ORIGIN` | Origine HTTP de la requête | Adresse publique à encoder dans les QR, par exemple une adresse réseau joignable ; origine HTTP(S) seule, sans chemin |
| `PACTE_ORGANIZER_TOKEN` | Générée au démarrage | Clé locale de régie, 32 à 128 caractères `A-Z a-z 0-9 _ -` |

Une clé générée change après redémarrage ; reconnecter la régie avec la nouvelle clé. Les parties et accès d'équipe déjà enregistrés restent dans la base. Pour conserver une même clé, la fournir par environnement ; ne jamais l'ajouter au dépôt. La base et les fichiers d'environnement sont ignorés par Git.

## Les interfaces de jeu

- **Régie** : cartons QR imprimables, rejeu visuel des résolutions, création de session et code personnalisé, sélection d'univers, six accès révocables, suivi des connexions, ressources et décisions privées, avance manuelle, pause/reprise, export JSON et ouverture de projection.
- **Équipe** : ressources, pouvoir, objectif privé, renseignement, deux ordres avec coût et validation serveur, confirmation de verrouillage, échanges à double consentement, alliances et votes Conseil/Sommet.
- **Projection** : carte SVG avec formes et numéros de factions, minuteur, propriétaires, alliances, scores, Stabilité, décisions du Conseil, rapports et résultats finaux. Aucun ordre, vote ou objectif non révélé n'est transmis à cette vue.

Les accès d'équipe sont des clés aléatoires de 32 octets limitées à une seule session et une seule faction, valables 24 heures. Leur empreinte SHA-256 est stockée dans SQLite. Renouveler un accès invalide immédiatement son prédécesseur. Les clés brutes sont remises seulement à leur création et conservées dans l'onglet de régie (`sessionStorage`). Après fermeture de cet onglet, renouveler les liens si nécessaire.

Le jeton entre par le fragment du lien, est retiré de l'adresse affichée et sert aux requêtes via l'en-tête Authorization. La projection n'utilise aucun jeton d'équipe ou de régie. L'accès régie local est unique : il ne remplace pas les comptes Firebase Auth prévus pour la production.

## Studio des univers — 0.3

Depuis l’accueil de régie, ouvrir **Studio des univers**. Dupliquer un des cinq exemples, modifier les contenus, enregistrer le brouillon puis utiliser « Vérifier avant publication ». Le studio édite le titre, l’accroche, l’introduction, l’épilogue, les libellés des ressources, les six factions et leurs couleurs, les 33 lieux, les cinq Conseils et les six intitulés d’objectifs. Les règles des pouvoirs, effets des votes et conditions d’objectifs restent fixes et affichées séparément des récits.

Les trois prévisualisations (projection, équipe, régie) utilisent des données fictives et ne créent pas de partie. Les références médias de cette tranche se limitent aux éléments intégrés : carte SVG, titre typographique et palettes. Cocher l’habillage intégré avant publication. Les illustrations et sons personnalisés ne peuvent pas encore être importés.

Un brouillon incomplet peut être enregistré. La publication exige tous les textes narratifs requis et les références intégrées. Une version publiée est figée, identifiée et munie d’une empreinte SHA-256. Pour la modifier, choisir **Nouvelle version** ; une duplication indépendante crée une autre famille d’univers. La création d’une partie propose les versions publiées avant les exemples de répétition.

Chaque session conserve son propre snapshot de contenu et la référence de version : une publication ultérieure ne modifie ni ses noms, ni ses textes, ni ses règles. Les brouillons portent une révision ; un onglet périmé ne peut pas écraser les changements d’un autre onglet. Les exports JSON du studio peuvent être réimportés, toujours sous forme d’un nouveau brouillon. L’import refuse les identifiants mécaniques modifiés, les nouveaux champs de règles et les médias distants.

Dans le serveur local, le studio et la régie partagent la même clé d’organisateur. La séparation des rôles éditeur/organisateur et les comptes Firebase restent à raccorder avant un service hébergé.

## QR et cartons d’équipe — 0.4

Depuis une session en régie : **Afficher le QR** pour un accès individuel, ou **Préparer les six cartons QR**, puis **Imprimer les cartons**. La feuille est prévue en A4 portrait avec six cartes. Le navigateur gère l’impression et l’enregistrement PDF. Le rendu papier et la lecture par les téléphones réels restent à vérifier.

Les QR sont calculés par le serveur du jeu, sans service externe. Leur décodage est testé avec un lecteur indépendant. Ils contiennent le lien privé complet et sa clé dans le fragment. Le serveur vérifie la session, l’équipe et la validité de la clé avant de produire un QR ; cette opération ne marque pas l’équipe comme connectée.

**Renouveler** invalide immédiatement le lien et les cartons précédents d’une équipe. Si les clés ne sont plus disponibles dans l’onglet de régie, la préparation demande confirmation avant de renouveler les seuls accès manquants. Une clé expirée doit également être renouvelée ; les QR ne prolongent jamais la validité d’une clé.

L’adresse encodée doit être joignable depuis le téléphone. `localhost` et `127.0.0.1` désignent l’appareil qui scanne, pas l’ordinateur de régie. Ouvrir la régie sur une adresse réseau adéquate, ou configurer `PACTE_PUBLIC_ORIGIN`. Derrière un proxy HTTPS, définir explicitement cette variable. Modifier l’adresse ne déploie pas le serveur et ne configure pas le réseau.

## Relecture des résolutions — 0.4

La régie peut choisir une manche déjà résolue, puis afficher : décisions scellées, attaques, soutiens décisifs, résultats. La projection reconstruit la carte historique à partir des changements de propriétaire archivés. Les étapes avant le résultat montrent la situation précédant cette résolution. Les territoires attaqués sont signalés ; aucune origine d’attaque n’est inventée.

Ce sont des lectures des résultats existants : aucun combat, revenu, vote ou Prestige n’est recalculé. Les comptes, le chronomètre et les ordres restent inchangés. Le classement affiché reste le classement actuel. Les équipes gardent leur carte actuelle. Avancer une phase quitte la relecture ; une résolution normale affiche automatiquement son résultat.

## Préparation Firebase

Projet dédié : `le-pacte-ludificateur` ; application web : `1:48298108779:web:da8e882a62c0c8852dce2e`. Le fichier `.firebaserc` cible ce projet ; `firebase/web-config.json` contient la configuration client fournie par Firebase, sans clé serveur, et n’est pas encore chargé par le frontend local.

À la vérification du 2 novembre 2026, la liste des bases Firestore a renvoyé une erreur 403 indiquant que l’API Firestore n’avait pas été activée dans ce projet. Aucune base, région, règle d’accès, Function ou application hébergée n’a été déployée par cette tranche. Les autres projets n’ont pas été modifiés. Les étapes suivantes sont l’activation/configuration de la base après choix d’édition et de région, l’authentification, le stockage transactionnel distant, puis les tests et la validation du déploiement.

## Sauvegarde et autorité

Toutes les mutations passent par `applyCommand`, depuis un serveur qui détermine l'identité et l'heure. Le serveur HTTP ne fournit jamais les sources du moteur, la base, les jetons bruts ou un état privé à la projection. Les transactions `BEGIN IMMEDIATE` sérialisent lecture, validation et écriture SQLite. Un refus laisse l'état inchangé. Un même reçu de commande ne produit pas deux dépenses ; les deux acceptations d'une même offre ne peuvent pas être exécutées toutes les deux.

Le scheduler conserve les échéances dans l'état et rattrape les phases écoulées après reprise du processus ; une partie suspendue reste suspendue. Les nouvelles parties tirent les objectifs sans doublon et la priorité finale avec `crypto.randomInt`.

En cas d'interruption réseau, l'interface affiche un état non synchronisé. Une commande dont la réception n'est pas confirmée reste disponible pour une nouvelle tentative avec **le même identifiant**. Les brouillons d'ordres sont privés à l'onglet et à la manche. Un envoi confirmé reste enregistré après rechargement ou réouverture du serveur.

Pour sauvegarder la base pendant que le serveur tourne, employer une sauvegarde SQLite cohérente ; pour une copie simple des fichiers, arrêter d'abord le serveur. L'export de régie contient les secrets de la partie et doit rester réservé à l'organisateur.

## Vérification

```sh
npm test
npm run test:integration
npm run test:studio
npm run test:animation
npm run demo
```

`npm test` exécute les 89 tests de règles, de session, d'intégration HTTP/SQLite et de génération des écrans. La commande ciblée `test:integration` exécute seulement les 15 tests HTTP et persistance. `test:studio` couvre 15 cas de contenus, versions, HTTP et génération du studio. `test:animation` cible les 11 tests QR/relecture et les 6 tests de génération des écrans. Les tests d'interface utilisent une frontière DOM minimale : ils vérifient le HTML généré et l'échappement des textes, **pas le rendu visuel ni des interactions navigateur réelles**.

Le navigateur disponible dans l'environnement de préparation n'a pas pu joindre le serveur local. La QA visuelle, le clavier dans un navigateur réel, les résolutions 360 px/1080p/4K, les téléphones et le réseau en salle restent à vérifier. Aucun résultat de test humain ni conformité commerciale n'est revendiqué.

Node exécute les sources TypeScript par effacement des annotations. Le contrôle statique TypeScript reste à installer ; l'exécution des tests ne le remplace pas. La CI GitHub exécute la suite, la vérification de syntaxe des fichiers web et la démonstration.

## Structure

| Chemin | Fonction |
|---|---|
| `src/` | Règles pures, topologie, contenus et contrat de session |
| `server/store.ts` | Transactions, sessions, accès et scheduler |
| `server/http.ts` | Autorisations, API et fichiers web autorisés |
| `server/studio.ts` | Brouillons, révisions, publications et versions immuables |
| `server/qr.ts` | Génération locale des QR SVG et validation de leur origine |
| `src/replay.ts` | Cartes historiques dérivées des résultats archivés |
| `server/start.mjs` | Démarrage local et arrêt propre |
| `public/` | Interfaces de jeu, studio, cartons QR, relecture, styles et carte SVG |
| `content/editions.json` | Cinq exemples fournis, toujours en brouillon |
| `test/` | Tests de règles, session, HTTP, persistance et génération HTML |
| `docs/` | Cahier des charges et état du développement |

Le frontend est en JavaScript natif, sans étape de compilation ni CDN. Le runtime utilise `qrcode-generator` pour les QR ; `jsqr` est uniquement une dépendance de test. Le verrouillage est dans `package-lock.json`. Le cahier recommande React/TypeScript sans l'imposer ; ce choix permet de vérifier cette tranche locale sans installer de dépendances. Le moteur reste en TypeScript, indépendant du frontend et du stockage.

## Prochaines étapes

1. Configurer la base et raccorder Auth, stockage transactionnel et projections privées/publiques au projet Firebase dédié, avec tests Emulator Suite. Le serveur de jeu reste local pour le moment.
2. Compléter les cinq univers avec leurs textes éditoriaux définitifs, illustrations et sons originaux ; ajouter la gestion des médias, des droits, des contrastes et les rôles distincts du studio. Les exemples JSON fournis ne sont pas publiés automatiquement.
3. Tour d’initiation jouable, corrections d’arbitrage motivées, enrichissement des séquences de révélation et amélioration des bilans.
4. Validation visuelle et multiappareils, tests en salle avec six équipes, puis décision de déploiement.

## Sources

- Ludificateur, *Le Pacte — Livre de règles neutre V1.1*, 2 novembre 2026. Source de la topologie et des règles, consultée lors du premier lot.
- Ludificateur, *Cahier des charges multivers V1.0*, 2 novembre 2026, copie dans `docs/cahier-des-charges-v1.md`.
- Ludificateur, *5 Univers — Exemples V1.0*, JSON fourni dans `content/editions.json`.
- Node.js, documentation officielle SQLite v24, consultée le 2 novembre 2026 : https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- Node.js, documentation officielle Crypto v24, consultée le 2 novembre 2026 : https://nodejs.org/download/release/v24.21.0/docs/api/crypto.html
