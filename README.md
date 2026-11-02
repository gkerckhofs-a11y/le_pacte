# Le Pacte — version locale 0.2.0

Jeu de stratégie et de diplomatie du Ludificateur : six équipes, 33 territoires, 60 connexions, cinq manches et un seul vainqueur. Développement fondé sur le règlement neutre V1.1 et le cahier des charges multivers V1.0 du 2 novembre 2026.

Cette version ajoute **trois interfaces web reliées à un serveur local et à une base SQLite persistante**. Elle sert aux répétitions techniques. Le déploiement Firebase, le studio des univers et la validation humaine ne sont pas encore réalisés.

## Démarrage

Node.js 24 minimum. Aucun paquet externe à installer.

```sh
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
| `PACTE_ORGANIZER_TOKEN` | Générée au démarrage | Clé locale de régie, 32 à 128 caractères `A-Z a-z 0-9 _ -` |

Une clé générée change après redémarrage ; reconnecter la régie avec la nouvelle clé. Les parties et accès d'équipe déjà enregistrés restent dans la base. Pour conserver une même clé, la fournir par environnement ; ne jamais l'ajouter au dépôt. La base et les fichiers d'environnement sont ignorés par Git.

## Les trois interfaces

- **Régie** : création de session et code personnalisé, sélection d'univers, six accès révocables, suivi des connexions, ressources et décisions privées, avance manuelle, pause/reprise, export JSON et ouverture de projection.
- **Équipe** : ressources, pouvoir, objectif privé, renseignement, deux ordres avec coût et validation serveur, confirmation de verrouillage, échanges à double consentement, alliances et votes Conseil/Sommet.
- **Projection** : carte SVG avec formes et numéros de factions, minuteur, propriétaires, alliances, scores, Stabilité, décisions du Conseil, rapports et résultats finaux. Aucun ordre, vote ou objectif non révélé n'est transmis à cette vue.

Les accès d'équipe sont des clés aléatoires de 32 octets limitées à une seule session et une seule faction, valables 24 heures. Leur empreinte SHA-256 est stockée dans SQLite. Renouveler un accès invalide immédiatement son prédécesseur. Les clés brutes sont remises seulement à leur création et conservées dans l'onglet de régie (`sessionStorage`). Après fermeture de cet onglet, renouveler les liens si nécessaire.

Le jeton entre par le fragment du lien, est retiré de l'adresse affichée et sert aux requêtes via l'en-tête Authorization. La projection n'utilise aucun jeton d'équipe ou de régie. L'accès régie local est unique : il ne remplace pas les comptes Firebase Auth prévus pour la production.

## Sauvegarde et autorité

Toutes les mutations passent par `applyCommand`, depuis un serveur qui détermine l'identité et l'heure. Le serveur HTTP ne fournit jamais les sources du moteur, la base, les jetons bruts ou un état privé à la projection. Les transactions `BEGIN IMMEDIATE` sérialisent lecture, validation et écriture SQLite. Un refus laisse l'état inchangé. Un même reçu de commande ne produit pas deux dépenses ; les deux acceptations d'une même offre ne peuvent pas être exécutées toutes les deux.

Le scheduler conserve les échéances dans l'état et rattrape les phases écoulées après reprise du processus ; une partie suspendue reste suspendue. Les nouvelles parties tirent les objectifs sans doublon et la priorité finale avec `crypto.randomInt`.

En cas d'interruption réseau, l'interface affiche un état non synchronisé. Une commande dont la réception n'est pas confirmée reste disponible pour une nouvelle tentative avec **le même identifiant**. Les brouillons d'ordres sont privés à l'onglet et à la manche. Un envoi confirmé reste enregistré après rechargement ou réouverture du serveur.

Pour sauvegarder la base pendant que le serveur tourne, employer une sauvegarde SQLite cohérente ; pour une copie simple des fichiers, arrêter d'abord le serveur. L'export de régie contient les secrets de la partie et doit rester réservé à l'organisateur.

## Vérification

```sh
npm test
npm run test:integration
npm run demo
```

`npm test` exécute les 62 tests de règles, de session, d'intégration HTTP/SQLite et de génération des écrans. La commande ciblée `test:integration` exécute seulement les 15 tests HTTP et persistance. Les tests d'interface utilisent une frontière DOM minimale : ils vérifient le HTML généré et l'échappement des textes, **pas le rendu visuel ni des interactions navigateur réelles**.

Le navigateur disponible dans l'environnement de préparation n'a pas pu joindre le serveur local. La QA visuelle, le clavier dans un navigateur réel, les résolutions 360 px/1080p/4K, les téléphones et le réseau en salle restent à vérifier. Aucun résultat de test humain ni conformité commerciale n'est revendiqué.

Node exécute les sources TypeScript par effacement des annotations. Le contrôle statique TypeScript reste à installer ; l'exécution des tests ne le remplace pas. La CI GitHub exécute la suite, la vérification de syntaxe des fichiers web et la démonstration.

## Structure

| Chemin | Fonction |
|---|---|
| `src/` | Règles pures, topologie, contenus et contrat de session |
| `server/store.ts` | Transactions, sessions, accès et scheduler |
| `server/http.ts` | Autorisations, API et fichiers web autorisés |
| `server/start.mjs` | Démarrage local et arrêt propre |
| `public/` | Interfaces, styles et carte SVG |
| `content/editions.json` | Cinq exemples fournis, toujours en brouillon |
| `test/` | Tests de règles, session, HTTP, persistance et génération HTML |
| `docs/` | Cahier des charges et état du développement |

Le frontend est en JavaScript natif, sans étape de compilation ni CDN. Le cahier recommande React/TypeScript sans l'imposer ; ce choix permet de vérifier cette tranche locale sans installer de dépendances. Le moteur reste en TypeScript, indépendant du frontend et du stockage.

## Prochaines étapes

1. Attribuer le projet Firebase à Le Pacte, vérifier l'instance et raccorder Auth, stockage transactionnel et projections privées/publiques, avec tests Emulator Suite. Aucun projet Firebase existant n'a été modifié.
2. Studio de duplication, édition et publication immuable ; compléter les textes, introductions et médias originaux des univers. Les exemples JSON ne sont pas des éditions publiées.
3. QR imprimables des accès, tour d'initiation jouable, corrections d'arbitrage motivées, replay de révélation et amélioration des bilans.
4. Validation visuelle et multiappareils, tests en salle avec six équipes, puis décision de déploiement.

## Sources

- Ludificateur, *Le Pacte — Livre de règles neutre V1.1*, 2 novembre 2026. Source de la topologie et des règles, consultée lors du premier lot.
- Ludificateur, *Cahier des charges multivers V1.0*, 2 novembre 2026, copie dans `docs/cahier-des-charges-v1.md`.
- Ludificateur, *5 Univers — Exemples V1.0*, JSON fourni dans `content/editions.json`.
- Node.js, documentation officielle SQLite v24, consultée le 2 novembre 2026 : https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- Node.js, documentation officielle Crypto v24, consultée le 2 novembre 2026 : https://nodejs.org/download/release/v24.21.0/docs/api/crypto.html
