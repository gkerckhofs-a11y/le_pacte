# Le Pacte des Fondateurs — V2.5 : première partie narrative jouable

**État : prototype de répétition, pas une édition commercialisable ni un déploiement Firebase.**

## Ce qui a été développé

### 1. Une session narrative indépendante
- Création depuis un scénario publié (Google Sheets/fixture) et une skin indépendante, avec leur version figée.
- Six familles à effectifs variables ; **une seule clé d'accès porte-parole par famille**.
- Réglage des six noms et **six objectifs secrets** depuis l'écran de configuration (les valeurs proposées par défaut sont des exemples non équilibrés).
- Sauvegarde de l'état : SQLite en répétition locale, Firestore dans le backend Firebase.
- Nouvelle session totalement séparée des parties territoriales V1.

### 2. Cycle d'une décision
1. La régie démarre la partie et ouvre le dilemme d'entrée.
2. Le porte-parole de chaque famille utilise son écran privé pour voter POUR, CONTRE ou passer, et éventuellement surenchérir.
3. Le Modérateur tranche les égalités ou départage des candidats à la fonction de Meneur lorsque nécessaire.
4. Après clôture, le résultat **n'est pas révélé avant action de la régie**.
5. La régie révèle l'issue ; les cinq jauges et la stabilité sont actualisées, l'événement est inscrit au journal.
6. La régie passe au dilemme suivant en suivant le branchement du scénario (ou termine si FIN).
7. Les transferts en dollars sont proposés par un porte-parole et confirmés par le destinataire ; les offres non conclues expirent après le vote.

### 3. Trois interfaces
- `/founders-setup.html` : sélectionner scénario, version, skin, effectifs, noms et objectifs ; créer une session et distribuer les six liens privés.
- `/founders-regie.html?session=ID` : démarrer, révéler, continuer, accéder au lien de projection et régénérer (révoquer) un jeton de famille.
- `/founders-family.html?session=ID#token=TOKEN` : informations privées, objectifs secrets, ressources, vote, arbitrage éventuel, négociations financières.
- `/founders-city.html?session=ID` : projection publique, récit du dilemme, illustration optionnelle, jauges, scène de ville vectorielle qui réagit à certains seuils, et choix politiques visibles.

Les clés des familles ne passent jamais en URL query ; elles sont remises **dans le fragment #token** puis retirées de la barre d'adresse après ouverture. Seul le porteur de la clé accède à ses informations, la clé est révocable et expire après 24 h. Les autres membres de chaque famille jouent physiquement sans connexion web.

### 4. Confidentialité
L'API de projection ne publie jamais les objectifs secrets, les futures issues, les embranchements ni l'identifiant privé Google Sheets.
La régie est authentifiée ; les commandes des familles nécessitent le jeton correspondant et une révision à jour.
Les nouveaux documents Firestore n'ont pas d'accès direct client : les règles globales refusent toutes les lectures/écritures, hors backend Admin.

### Tests
- `test/founders-live.test.mjs` : moteur, révélations, secrets, transferts et SQLite.
- `test/founders-live-http.test.mjs` : parcours HTTP réel, six familles, projections, révocation et accès.
- `test/cloud/founders-live.test.mjs` : transactions Firestore Emulator, accès privés et concurrence.
- La CI existante vérifie également la non-régression du moteur territorial.

### Limites et jalons avant commercialisation
1. **Les objectifs de test ne déterminent pas encore un vainqueur** : le barème et l'équilibrage doivent être conçus, testés et validés.
2. Pas de timer automatique des dilemmes ni de système de pause : la régie contrôle la progression.
3. Les valeurs initiales (8 Influence, 10 dollars, jauges à 5) restent le preset du prototype ; leur paramétrage en ligne complet est une prochaine tranche.
4. La scène évolutive Western est une maquette **vectorielle**, pas le décor artistique définitif. Les autres skins ne disposent pas encore de scène spécifique.
5. Les illustrations des dilemmes sont lues depuis les URL HTTPS fournies dans Sheets, sans téléversement automatique vers Firebase Storage.
6. Les jetons de famille sont temporaires : il faut distribuer les liens à la création ou les régénérer dans la régie.
7. Le test multiappareils (iPhone/Android) et le test humain avec trente joueurs ou plus restent à effectuer.

### Publication
Le dépôt définit le projet `le-pacte-ludificateur`, mais cette branche **n'est pas encore fusionnée ni déployée**. Préserver les PR empilées : #1 (V2.2), #2 (V2.3), #3 (V2.4), puis PR V2.5. Vérifier Auth Google, droits Firebase et CI sur le commit fusionné avant une publication.
