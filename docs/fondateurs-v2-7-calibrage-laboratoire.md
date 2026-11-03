# Le Pacte V2.7 — Calibrage des ressources et laboratoire politique

Date : 3 novembre 2026 · Branche expérimentale `feat/fondateurs-v2-7-calibration-lab` · **Publiée sur Firebase le 3 novembre 2026** — voir [le compte rendu de publication](deploiement-v2-7.md).

## Objectif de cette tranche

Compléter le moteur narratif V2.6 sans modifier le moteur territorial : permettre à la régie de choisir les ressources initiales d'une partie et simuler des comportements politiques simplifiés avant un test humain à six familles.

## 1. Calibrage du début de partie

Les champs sont configurables **en ligne dans la régie**, pas dans les Google Sheets éditoriaux.

| Paramètre | Défaut V2.7 | Domaine accepté |
| --- | ---: | --- |
| Influence de chaque famille | 8 points | 1 à 30 |
| Dollars de chaque famille | 10 $ | 0 à 100 |
| Réserve d'Influence commune | 3 points | 0 à 100 |
| Économie, Sécurité, Satisfaction, Bien-être, Développement, Stabilité | 5 / 10 chacune | 0 à 10 |

Chaque famille dispose initialement du même stock, indépendamment du nombre de participants. Si l'organisateur souhaite des stocks asymétriques, il faudra définir et valider une autre règle ; ce n'est **pas implémenté**.

Le moteur remplace l'invariant fixe `51` par `powerSupply = 6 × initialPower + initialPool`, puis contrôle que la circulation du Pouvoir conserve exactement cette valeur (y compris les mises temporairement engagées). Les dollars sont créés seulement par les mécanismes prévus d'abstention ; les transferts bilatéraux ne créent pas d'argent.

Une partie en cours garde ses réglages et la version de son scénario : les modifications de la régie n'altèrent pas ses valeurs.

## 2. Laboratoire de politiques

`src/founders-policy-lab.ts` fait jouer des équipes **artificielles** avec le moteur réel :

- `prudent` : abstention fréquente, mise minimale, quelques rares surenchères ;
- `ambitieux` : vote plus fréquent, mises et surenchères plus élevées, propositions d'argent plus fréquentes ;
- `mixte` : plusieurs profils répartis entre familles.

Le modèle forme une préférence à partir de l'effet immédiat du dilemme sur l'indicateur secret de la famille. Il génère de vrais votes séquentiels, des abstentions, des relances, les arbitrages éventuels du Modérateur et des transferts de dollars hypothétiques. Le classement utilise exactement le même calcul que les parties V2.6.

Paramètres : 1–120 répétitions, graine aléatoire explicite et reproductible, limite 50 dilemmes par partie et 80 actions par vote. Les simulations interrompues sont **comptabilisées séparément**, jamais transformées en victoire.

Résultats : nombre d'essais et de parties terminées, victoires par famille, score moyen, points d'objectif moyen, dollars et Influence moyens en fin de partie, longueur moyenne des parties, actions de vote et transferts moyens.

**Ne jamais présenter les fréquences de victoire issues de ces simulations comme des probabilités de victoire réelles.** Ce sont des hypothèses codées, sans modèle validé des comportements, négociations et coalitions d'un groupe de 30 joueurs. Une famille peut aussi investir sa force politique dans le long terme plutôt que dans l'effet immédiat d'un seul dilemme, ce que le modèle reproduit imparfaitement.

## 3. Analyse des embranchements mise à jour

L'endpoint de dénombrement des fins `POST /api/founders/scoring/analyze` utilise maintenant les jauges **effectives de départ** choisies par l'organisateur, plutôt que 5/10 systématiquement. L'affichage reste un dénombrement des possibilités, pas une prévision humaine.

L'endpoint `POST /api/founders/scoring/simulate` exige le rôle organisateur, un scénario accessible et des paramètres validés. Il ne crée ni session ni enregistrement Firestore ; il calcule un résultat de diagnostic seulement.

## 4. Essais à effectuer avant exploitation

1. Vérifier la calibration des ressources avec les valeurs par défaut et avec des stocks augmentés/réduits.
2. Comparer les laboratoires prudent, ambitieux et mixte, à **nombre de répétitions et graine identiques**.
3. Effectuer le **test humain** : six équipes, au moins 30 personnes, noter qui a parlé, négocié et décidé, le rythme des votes, l'intérêt des dilemmes, la perception des objectifs secrets et du vainqueur.
4. Ajouter si besoin un outillage de simulation plus riche : stratégies de coalition, réputation, bluff, temporisation et informations incomplètes. Ne pas utiliser une simple moyenne de simulations artificielles comme référence commerciale d'équité.
5. Vérifier les interfaces mobiles et la gestion des reconnections Firebase avant une partie publique.

## Vérification ciblée

```sh
node --test test/founders-policy-lab.test.mjs test/founders-policy-http.test.mjs
npm run test:cloud
```

La CI du dépôt doit également continuer de vérifier le moteur territorial sans modification.

## État de publication

Cette version est publiée sur Firebase après confirmation explicite du propriétaire le 3 novembre 2026. Elle reste sur la branche V2.7, sans merge dans `main`. Les PR empilées sont V2.2 → V2.3 → V2.4 → V2.5 → V2.6 → V2.7. Les parcours applicatifs Google Auth / Sheets réels et la répétition humaine restent à valider. Voir [le compte rendu](deploiement-v2-7.md) pour les vérifications effectuées et leurs limites.
