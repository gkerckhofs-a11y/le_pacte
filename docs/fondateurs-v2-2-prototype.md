# Le Pacte des Fondateurs — prototype narratif V2.2
Date : 3 novembre 2026. Statut : **expérimental, non validé humainement**.

## Décision de conception
Le Pacte reste le nom du produit multivers ; le Western s'appelle **Le Pacte des Fondateurs**. Six familles fondent et gouvernent Hot Spring. Le gameplay est un Conseil politique narratif, et non une conquête territoriale.

Chaque famille peut comprendre autant de participants que nécessaire. **Un seul porte-parole par famille dispose du droit de vote sur l'interface web** ; les autres membres portent des cartes de rôle librement distribuées. Plusieurs membres peuvent être Diplomates. Les dimensions d'une famille ne changent jamais son budget politique.

## Paramètres du mini-test
- Six familles A–F ; effectifs variables, typiquement 5 à 12 et plus.
- Influence familiale initiale : 8 ; dollars initiaux : 10 ; réserve centrale : 3.
- Meneur initial : A ; Modérateur initial : F.
- Dilemmes dans l'ordre : D1 Monopole du chemin de fer, D2 Gardes privés, D3 Nouveau puits.
- Jauges publiques initiales à 5/10 : économie, sécurité, satisfaction, bien-être, développement, stabilité. Le centre 5 représente l'équilibre de la **stabilité** ; ce n'est pas une jauge à maximiser.
- Durée de test observée : objectif 65–75 minutes, sans arrêt artificiel du vote. Durée de l'expérience finale envisagée : 150 minutes.

## Procédure de vote
1. Discussion ouverte et négociation (également permises pendant la phase de vote).
2. Le Meneur vote le premier ; puis les familles passent successivement dans l'ordre circulaire.
3. Première intervention : POUR/CONTRE avec une mise d'au moins un point d'Influence ; ou PASSER pour récupérer du Pouvoir / devenir Modérateur. Les deux variantes de PASSER donnent 1 dollar.
4. Une famille qui a déjà voté ne peut pas changer de camp, mais peut augmenter sa mise ou rester. Une famille qui a passé ne fait plus rien lors de ses prochains tours.
5. Le Meneur change dès qu'une famille a une mise **individuelle strictement supérieure** aux autres. La phase se termine à la fin du tour de la famille située juste avant le Meneur.
6. Le camp qui engage le plus d'Influence gagne. En cas d'égalité, le Modérateur tranche. Si tout le monde passe, le Modérateur choisit et devient Meneur.
7. Les abstentionnistes ayant choisi de récupérer du Pouvoir se partagent le **stock central existant avant les dépôts gagnants**, en parts entières égales ; le reste demeure en réserve.
8. Les perdants récupèrent leur mise ; les gagnants déposent la leur au centre.
9. Si le Meneur est perdant, la plus forte mise **individuelle gagnante** reçoit la fonction. Le Modérateur tranche une égalité entre prétendants.
10. L'application doit vérifier **conservation de l'Influence** : 6×8+3 = 51 au total, y compris les mises en cours.

## Dollars
Les dollars peuvent être transférés entre familles en échange de services politiques, sans créer d'Influence. Un accord rémunéré devient contraignant, une promesse purement orale non. Dans le futur produit, la régie n'exécutera une transaction qu'après **confirmation des deux porte-parole** ; l'état métier seul n'assure pas l'authentification.

## Architecture
Conserver intacts `src/engine.ts`, `src/session.ts`, le mode territorial et leurs tests.
Un **nouveau module isolé** `src/founders.ts` porte le calcul narratif : création des familles, votes ordonnés, Meneur, Modérateur, réserve, dollars, effets de jauges. Aucun raccordement HTTP/Firebase, aucune interface et aucune migration de la version territoriale dans ce prototype. Cette frontière est volontaire.

Prochaine tranche à décider **après test humain** : session Founders, contrôle d'accès de l'unique porte-parole par famille, API de confirmation bilatérale, projections anonymisées, narration administrable et interface de régie.

## Conditions de test
Observer le nombre de joueurs ayant contribué réellement à la stratégie, aux négociations et au choix final (pas seulement ceux qui ont reçu un rôle), ainsi que la durée des tours et la compréhension de l'Influence/dollars. Le premier simulateur déterministe ne constitue pas une preuve d'équilibrage humain.

## Référence des règles de vote
Hjalmar Hach et Lorenzo Silva, *The King's Dilemma*, Horrible Guild, livret de règles, pp. 18–21, https://cdn.1j1ju.com/medias/7e/3e/83-the-kings-dilemma-rulebook.pdf

Les familles, Hot Spring et les trois dilemmes sont du contenu original pour Le Pacte.
