# Cosa Nostra — Le Trône de Chicago · recette V3

Le 20 novembre 2026, la page publiée sur `/cosa-nostra` correspondait octet pour octet au fichier de la branche `deploy/firebase` au commit `1f45a94e0653906bb748a927c8b928f9db5b3e3a`. Empreinte SHA-256 de la page : `c1125164eec38dbe781db159588e289bc899ccd0b6a8c9e40ffac4edaaecc205`. [Publication vérifiée](https://github.com/gkerckhofs-a11y/le_pacte/actions/runs/44717612822).

## Les indicateurs et la projection

Les cinq jauges décrivent l’état de la Cosa Nostra. Chicago est le théâtre des conséquences de ses décisions. Chaque famille poursuit une ambition liée à l’une des jauges collectives. Chaque univers définit l’entité dont les indicateurs mesurent l’évolution.

La Stabilité de la Cosa Nostra est la moyenne arithmétique des cinq jauges sur 100. Le jeu la recalcule à partir des valeurs effectives après les effets et les corrections. La régie peut corriger une jauge fondamentale pendant une pause. La Stabilité se consulte en lecture seule.

| Stabilité | Qualificatif |
| --- | --- |
| Moins de 20 | Organisation en déroute |
| De 20 à moins de 40 | Guerre ouverte |
| De 40 à moins de 60 | Équilibre fragile |
| De 60 à moins de 80 | Ordre établi |
| De 80 à moins de 95 | Syndicat puissant |
| De 95 à 100 | Empire criminel |

Les cinq jauges affichent leur valeur actuelle sur 100 dès la présentation. Les décisions successives se cumulent. À partir du deuxième dilemme, « Dernier vote » identifie la décision dont les variations signées restent visibles à côté des valeurs actuelles. La chronique conserve les décisions antérieures. Sur grand écran, la colonne supérieure gauche regroupe le titre, les jauges, la Stabilité et les commandes de projection. À sa droite, la scène entière conserve le format 16:9. Le chapitre, le dilemme et le suivi du vote se lisent en dessous. [Aperçu de la projection](chicago-projection/panneau-et-dilemme.jpg)

Après le vote, projeter la scène entière de l’issue retenue, puis lire les variations sous « Conséquences pour la Cosa Nostra ». La Stabilité figure sous les cinq jauges, avec les valeurs avant et après le vote et le qualificatif du nouvel état. Le bouton Plein écran est directement accessible. Le bouton Chronique apparaît dès la première décision révélée.

## Contrats vérifiés et correspondance

| Source ou fonction | Version publiée | Version de recette |
| --- | --- | --- |
| Préparation privée | V2, trois issues avec correspondance configurable | Import V3 à deux choix étiquetés. Le remplacement d'une préparation V2 requiert sa révision. Les sessions V2 déjà créées gardent leur scénario figé. |
| Source V3 du 20 novembre | JSON de l’organisateur | Empreinte du fichier original `ab5d9fc66d00f623f6e99e1ad41619db9a855016abe452840e9f662a6331558c`. La préparation du propriétaire conserve les scènes et les positions-clés importées. Le serveur actualise les textes d’ambition et calcule l’empreinte sur le contenu ainsi enregistré. |
| `id, chapter, number, title, type` | Identifiant technique sans point | `01.02` reste l’ID éditorial ; `CN_01_02` est l’alias dans l’historique des votes. L’ordre est celui des chapitres et des scènes. 15 pivots obligatoires, 0 à 2 crises par chapitre. |
| `intro, tension` | Un bloc narratif | Lecture neutre identique à la V3. Les 30 introductions et les deux descriptions de chaque scène proviennent du fichier. |
| `choice, title, public_description, public_trends, public_compromise` | Deux libellés choisis en régie | Deux camps fixes, une carte par camp sur les écrans de jeu. Projection et terminaux reçoivent uniquement la description, les tendances et le compromis de chaque proposition. |
| `effects, after, city_visual_result` | Résolution du camp adopté | Valeurs entières sur 100, bornées après application. Récit et image de la seule issue adoptée après le vote. La chronique mémorise le résultat. Avant le vote, les valeurs acquises sont publiques. Les propositions annoncent leurs tendances et les variations exactes de l’issue retenue sont révélées à la résolution. |
| `visual_direction, city_visual_asset_suggestion` | Décor générique | Référence originale conservée dans la préparation. Fichier d'ouverture et résultat POUR/CONTRE identifiés par la scène. Les variantes sont servies par l’API après contrôle de la phase de cette session. |
| `family_objectives, major_slots, secret_success, gauge_mapping` | Cinq fiches privées | Le serveur vérifie 15 pivots uniques, trois par famille et les marqueurs. Il associe chaque participant votant à une seule famille. Les noms d’équipe affichés restent personnalisables. |
| `winner_epilogues` | Fin des Conseils | Le texte de la famille élue apparaît après proclamation. |
| Vote, accords et détenteurs | Mises publiques, surenchère, abstentions, dons et engagements | Mêmes fonctions de vote, de transfert et de résolution. Les deux appuis politiques portent les noms de Chicago. Les ressources et la réserve conservent les règles du moteur. |

Les deux documents de conception et le guide MJ datés du 20 novembre 2026 prescrivent la campagne binaire. Les règles Western remises aux joueurs le 17 novembre donnent le contexte. Pour la mécanique, voir [le moteur de vote de référence](https://github.com/gkerckhofs-a11y/le_pacte/blob/1f45a94e0653906bb748a927c8b928f9db5b3e3a/src/founders.ts) et [le traitement des commandes de référence](https://github.com/gkerckhofs-a11y/le_pacte/blob/1f45a94e0653906bb748a927c8b928f9db5b3e3a/src/founders-live.ts).

## Finale et arbitrages de recette

- La régie peut convoquer la Commission dès la préparation, après résolution, en négociation, pendant le vote ou en pause. Pendant un Conseil, elle peut attendre sa résolution ou annuler celui-ci. Une demande différée en pause reste conservée jusqu’à la reprise.
- L’instantané est pris au début de la négociation. Interrompre restaure les soldes, l’Influence, la réserve et les titulaires de cet instantané. Le journal conserve les mises, les transferts, les statuts des offres et les corrections annulés. Les Conseils précédents sont acquis. Ce choix de recette fixe la frontière transactionnelle.
- Les objectifs mineurs comptent deux soutiens gagnants ou plus avec Influence engagée et amélioration réellement observée de la jauge. À la borne 100, un effet théorique positif sans augmentation effective ne compte pas. Les trois points de la priorité reviennent aux familles dont la jauge termine parmi les deux plus élevées, égalités comprises.
- Pour chaque famille, la base commune est le minimum des nombres de pivots effectivement résolus. Seules ses premières occasions dans l’ordre réel sont retenues. À zéro occasion commune, la majeure et son critère de départage sont neutralisés pour tous. Aux bases 1, 2 et 3, les seuils sont respectivement 1/1, 2/2 et 2/3. Le détail reste consultable en régie.
- Négociations finales de durée libre, cinq bulletins, verrouillage par le MJ, résultat scellé, puis proclamation. Chaque porte-parole choisit une autre famille. Un tour numéroté et un bulletin immuable par identité permettent les votes simultanés et les reconnexions.
- Égalité de total, puis de voix, puis de pivots retenus : le dernier Homme du Maire neutre tranche, à défaut le dernier Homme du Commissaire neutre. Seuls les titulaires du dernier Conseil résolu sont éligibles. À défaut, nouveau scrutin secret entre ex æquo ; s’il reste plusieurs premiers, les deux premiers du tour sont sélectionnés, avec le tirage initial pour départager la qualification. Dernier tour puis priorité initiale si nécessaire. Les bulletins des tours supplémentaires ne rapportent aucun point électoral supplémentaire.
- Le serveur fige le résultat à la proclamation. L’historique et l’export JSON privé restent accessibles à la régie. La projection reçoit les points, le classement, le nombre de soutiens et l’épilogue. Les choix électoraux individuels restent confidentiels.

Le départ à 50/100, la politique des occasions communes et le départage exceptionnel sont des paramètres de recette. Les mécanismes de cette branche s’activent uniquement sur une nouvelle session Chicago V3.

## Ce que chaque famille peut lire

Le terminal affiche l’ambition, la jauge prioritaire et les trois façons de gagner 2, 3 et 5 points. Chaque décision-clé porte le titre du dilemme, le camp attendu et la proposition exacte. Sa réussite dépend de la proposition adoptée par le Conseil. La famille peut donc voter autrement. Un bandeau privé signale la décision pendant la lecture, la négociation et le vote.

Sur le parcours complet, deux décisions réussies rapportent cinq points. Si les Conseils se terminent plus tôt, le nombre de décisions retenues est le même pour toutes les familles. Seules les premières de chacune comptent. Avec une décision retenue, il faut la réussir. Avec deux ou trois décisions retenues, il faut en réussir deux. Avec zéro, les cinq points sont retirés pour tous. Le terminal distingue les décisions manquées, celles qui n’ont pas été jouées et celles jouées au-delà du nombre retenu. La régie authentifiée réunit les cinq fiches sous « Objectifs privés des cinq familles ».

## Vérification et démo

Avec Node.js 24 et les dépendances installées par `npm ci` :

```sh
npm test
COSA_NOSTRA_TEST_CAMPAIGN=/chemin/campagne-v3.json node --test test/cosa-nostra-preparation.test.mjs test/chicago-succession.test.mjs
node scripts/chicago-calibration.mjs /chemin/campagne-v3.json 100
npm run build:firebase
node scripts/verify-cloud-build.mjs
node scripts/chicago-rehearsal.mjs /chemin/campagne-v3.json
```

Le lanceur utilise une base SQLite distincte. En mode `--lan`, le PC et les cinq téléphones utilisent le même Wi-Fi. Le kit organisateur contient la campagne privée. Seuls les liens individuels sont destinés aux familles.

## Simulations du 20 novembre 2026

Deux séries de 100 campagnes sur le parcours standard, graine reproductible 20261120. Chaque campagne est évaluée aux cinq arrêts. Dans la stratégie individuelle, chaque famille soutient son pivot ou l’option la plus favorable à sa jauge, avec une mise d’un point. Quand les deux options se valent, le choix est tiré au sort. Une récupération d’Influence intervient si la famille a épuisé sa réserve ou avec une probabilité de 17 %. Les voix de succession sont réparties au hasard entre familles éligibles. Dans la seconde série, trois familles se coordonnent autour d’une famille dont l’identité tourne entre les répétitions. Ses deux alliés lui donnent leur voix quand elle est éligible. Les trois familles soutiennent sa préférence au Conseil.

| Stratégie | Conseils résolus | Pivots communs | Victoires Moretti | Bellini | Caruso | Vitale | Falcone |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| individuelle | 0 | 0 | 23 | 23 | 20 | 15 | 19 |
| individuelle | 3 | 0 | 49 | 13 | 14 | 11 | 13 |
| individuelle | 7 | 1 | 36 | 2 | 13 | 35 | 14 |
| individuelle | 15 | 1 | 27 | 5 | 12 | 40 | 16 |
| individuelle | 25 | 3 | 45 | 8 | 3 | 34 | 10 |
| coalition | 0 | 0 | 21 | 20 | 22 | 18 | 19 |
| coalition | 3 | 0 | 31 | 14 | 17 | 23 | 15 |
| coalition | 7 | 1 | 27 | 10 | 14 | 28 | 21 |
| coalition | 15 | 1 | 23 | 12 | 20 | 24 | 21 |
| coalition | 25 | 3 | 22 | 14 | 22 | 22 | 20 |

Après trois Conseils, Moretti atteint le seuil de jauge de 60 dans 43 répétitions individuelles et réussit son petit objectif dans 32. À cet arrêt, aucun des quatre autres clans n’atteint le seuil de 60. À 25 Conseils, les victoires de la série individuelle vont de 3 à 45 sur 100. Avec les coalitions tournantes, elles vont de 14 à 22 sur 100. La neutralisation des pivots corrige le nombre d’occasions, mais les chances observées restent sensibles aux enjeux du début de partie et aux alliances. Ces simulations historiques utilisaient le seuil fixe de l’époque. Le classement actuel des jauges a remplacé ce barème. Une validation avec des joueurs est encore nécessaire avant de fixer le barème.

## Changement et retour arrière

La PR cible la branche de publication. Sa fusion déclencherait le workflow de production. La recette utilise la branche de travail séparée. Pour revenir à la version publiée pendant la recette, arrêter le serveur local puis ouvrir la version habituelle du site. La répétition et sa base locale restent disponibles pour un nouvel essai. Pour un éventuel retour arrière après une publication ultérieure, revenir par un revert des commits de la PR et redéployer la révision vérifiée après autorisation. Préserver les préparations et états V3 : le code V2 ne sait pas reprendre une succession V3 en cours.

## Alignement sur Hotspring V1.2

Le Conseil de Chicago V3 suit le protocole commun. La régie présente le dilemme, ouvre la négociation, ouvre le vote, puis passe à la suite après la résolution. Les chronos restent désactivés. La séance peut être sauvegardée et reprise avec son vote, ses mises et ses accords. Le bilan intermédiaire est privé en régie.

Comme dans Hotspring V1.2, la part de récupération est calculée sur la réserve disponible avant la clôture. Les mises gagnantes alimentent ensuite la réserve du Conseil suivant. L’abstention de rôle est exclue du partage. Les fiches QR et leurs rappels emploient le même gabarit d’impression, avec les appellations et la finale de Chicago.

Le classement des deux meilleures jauges, avec égalités incluses, remplace le seuil de 60 de la recette initiale. Chicago conserve ses trois points de trajectoire. La fortune est classée par le même calcul que Hotspring (3, 2, 1, puis 0, avec rangs partagés et sautés). Les ambitions (10), la fortune (3) et le premier scrutin secret (8) donnent un maximum de 21. La Stabilité est la moyenne des cinq jauges. L’organisateur voit les calculs et chaque famille reçoit son propre détail final. La projection affiche le classement et les soutiens agrégés.

Les scores déjà figés au début d’une ancienne succession gardent leur barème d’origine. Les simulations ci-dessus décrivent la recette initiale au seuil de 60. Les visuels dédiés disponibles s’inscrivent dans la chronique de Chicago; les scènes qui n’ont pas encore d’illustration dédiée utilisent le panorama de repli.
