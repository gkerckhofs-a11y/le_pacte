# Le Pacte — socle de développement 0.1.0

Jeu original du Ludificateur. Moteur neutre V1.1, six factions, 33 territoires et 60 connexions. Premier lot préparé le 2 novembre 2026 à partir du cahier des charges multivers V1.0 et du livre de règles neutre V1.1.

**Ce dépôt contient un moteur et des contrats de session exécutables. Il ne contient pas encore une application multijoueur utilisable en salle.** Aucun déploiement Firebase ni changement sur les autres projets n'a été effectué.

## Lancement

Node.js 24 minimum. Aucune dépendance externe à installer.

```sh
npm test
npm run demo
```

Node exécute les sources TypeScript par effacement des annotations. Les tests exécutent le code ; ils ne remplacent pas un contrôle statique TypeScript. Le compilateur TypeScript n'était pas disponible dans l'environnement de préparation. La CI fournie exécute les mêmes tests et la démonstration lors des push et pull requests ; elle n'a pas encore été exécutée sur GitHub.

## Implémenté

- Graphe de référence, propriétaires et revenus ; plafonds des deux ressources.
- Deux ordres, validation de l'ensemble avant dépenses et verrouillage unique.
- Combats simultanés, égalités conservatrices, Force et Diplomatie ; fortifications ; soutiens décisifs par recalcul sans chaque soutien.
- Industrie, Commerce, Renseignement ; accords d'alliance et échanges à double consentement dans le contrat de session.
- Conseils, dix effets fermés, Stabilité, Prestige, objectifs O1–O6, Sommet et classement avec départages.
- Projections explicites public/équipe/régie. Les objectifs sont publics seulement en fin de partie.
- Machine à états de 150 minutes, échéances et pause/reprise ; rôles et contrôles de phase dans les commandes ; reçus d'idempotence.
- Validation structurelle et snapshots indépendants des cinq exemples d'univers fournis, conservés en brouillon.
- 42 tests automatisés réussis dans l'environnement local ; démonstration d'une session complète scriptée.

## Organisation

| Chemin | Fonction |
|---|---|
| `src/map.ts` | Graphe et archétypes stables |
| `src/engine.ts` | Règles pures et projections |
| `src/diplomacy.ts` | Transferts, alliances, renseignement |
| `src/session.ts` | Commandes, rôles, phases et horloge |
| `src/editions.ts` | Validation des contenus importés |
| `content/editions.json` | Cinq exemples fournis, non publiés |
| `test/` | Tests des règles et contrats de session |
| `docs/cahier-des-charges-v1.md` | Source fonctionnelle fournie |

## Frontière serveur obligatoire

`applyCommand(session, actor, command, now)` est une transaction de domaine pure, pas un endpoint sécurisé. Le futur serveur doit authentifier l'acteur, fournir l'heure serveur et enregistrer atomiquement le nouvel état avec comparaison de `revision`. **Ne jamais prendre l'identité, l'heure, l'état canonique ou les droits depuis le navigateur.** Les fonctions pures de règles peuvent être invoquées hors phase par du code interne ; seul le contrat de session contrôle les phases.

Les doubles acceptations sont refusées dans un état déjà mis à jour. La concurrence entre deux processus ou deux transactions Firestore n'est pas encore couverte : aucun adaptateur persistant n'est livré. Le rejeu d'un reçu identique retourne l'état courant sans refaire l'opération. Un identifiant réutilisé avec une autre commande ou un autre acteur est refusé. Les reçus contiennent des données privées et restent réservés à la régie.

L'organisateur peut avancer manuellement une phase. L'horloge refuse les commandes d'équipe à l'échéance ; aucun scheduler automatique n'est encore branché. Le tutoriel occupe sa fenêtre de dix minutes, mais ses actions d'entraînement ne sont pas encore implémentées.

L'ordre des six objectifs et la priorité de départ doivent être tirés sans doublon par le futur serveur. Ils sont passés explicitement au moteur pour conserver le déterminisme et faciliter les tests. La démonstration utilise un ordre fixe, explicitement destiné au test.

## Suite nécessaire

1. Adaptateur Firebase : Auth, Firestore transactionnel, projections distinctes, règles d'accès, jetons d'équipe/QR révocables et tests Emulator Suite.
2. Interfaces React/TypeScript : régie, équipe mobile et projection ; plateau SVG, édition visuelle et chronomètre synchronisé.
3. Studio de publication immuable : introductions, textes complets, médias originaux et prévisualisations. Les packs fournis sont des exemples ; leurs assets restent `TO_CREATE`.
4. Tutoriel jouable, corrections d'arbitrage motivées, replay visuel, exports et reconnexion réseau.
5. Tests multiappareils, sécurité effective et partie humaine à six équipes avant exploitation commerciale.

## Sources

- Ludificateur, *Le Pacte — Livre de règles neutre V1.1*, 2 novembre 2026. Source consultée : `Le_Pacte_Livre_de_regles_neutre_V1_1.docx`, version 2. La table littérale de son annexe A fait autorité pour les voisins.
- Ludificateur, *Cahier des charges multivers V1.0*, 2 novembre 2026, copie intégrale dans `docs/`.
- Ludificateur, *5 Univers — Exemples V1.0*, JSON fourni, copié dans `content/` sans transformer les brouillons en éditions publiées.

Aucun résultat de test humain n'est revendiqué. Le titre de certains tests reprend les identifiants T du cahier : cette correspondance ne constitue pas la validation de l'intégration Firebase ou de l'expérience en salle.
