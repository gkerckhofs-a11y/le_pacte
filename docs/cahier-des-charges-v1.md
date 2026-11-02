---
title: "LE PACTE"
subtitle: "Cahier des charges fonctionnel, éditorial et technique — application multivers"
author: "Ludificateur — document de cadrage"
date: "2 novembre 2026"
lang: fr-BE
---

# Synthèse du projet

**Objectif.** Développer *Le Pacte*, un jeu de stratégie territoriale et de diplomatie en équipes, piloté via des interfaces web privées et un plateau collectif projeté. Chaque partie dure **150 minutes** et désigne **un seul vainqueur**. Les équipes négocient des alliances temporaires, échangent des ressources, choisissent deux ordres secrets par manche, votent des décisions politiques et découvrent simultanément le résultat de leurs choix.

**Principe produit.** Un **moteur de jeu neutre, unique et versionné**, auquel l'organisateur associe une **édition thématique**. Cinq éditions doivent être livrées : **Western**, **Mafia**, **Corporate contemporain**, **Moyen Âge** et **Futuriste**. Elles partagent les règles et les mêmes résultats de calcul : seuls les textes, noms, illustrations, sons, couleurs et mises en scène changent. L'organisateur doit ensuite pouvoir dupliquer une édition et en créer une nouvelle sans intervention sur le code des règles.

**Périmètre de référence.** Six factions, six équipes de trois à cinq personnes, une interface de commande par équipe, une régie, un écran public, **33 territoires / 60 connexions**, cinq manches de vingt minutes, deux ordres par équipe et par manche. Le moteur suit le **livre de règles neutre V1.1 du 2 novembre 2026**, qui fait autorité pour les nombres et les cas de jeu. Ce document transforme ces règles en exigences logicielles ; il ne les remplace pas.

**État du projet.** La mécanique et la carte ont été simulées automatiquement. La compréhension, les négociations réelles et l'intérêt du Sommet final restent à valider par un test humain. Les ajouts d'interface, d'édition et d'architecture indiqués ici sont des **propositions de réalisation**, pas des fonctionnalités déjà développées.

## Décisions figées et choix à valider

| Décisions de jeu reprises de V1.1 | Choix de produit proposés par ce cahier |
|---|---|
| Un seul vainqueur, jamais de victoire en coalition | Quatre espaces web distincts, avec accès par rôle |
| Six factions génériques aux pouvoirs uniques | Éditeur de scénarios basé sur des contenus, pas sur du code |
| 33 zones et 60 relations de voisinage | Cinq éditions prêtes à être configurées, présentées plus loin |
| Deux ressources : Moyens et Influence | Habillage cartographique vectoriel et animations de révélation |
| Deux ordres secrets, Conseil, Stabilité, Sommet | Firebase/TypeScript proposés comme stack technique |
| 150 minutes, briefing et débriefing inclus | Journal de partie, export et mode de répétition de test |

**Règle directrice UX :** « Un joueur comprend son prochain choix en quelques secondes ; le logiciel s'occupe des calculs. » La profondeur vient des choix, des négociations et des trahisons, non de menus complexes.

# 1. Vision, objectifs et critères de réussite

## 1.1 Expérience recherchée

- Un événement social animé, pas un jeu vidéo individuel : les joueurs se parlent et circulent entre les équipes pendant la diplomatie.
- Un grand plateau visible par tous, avec des territoires qui changent de contrôle, des alliances publiques et des révélations spectaculaires.
- Des ordres confidentiels, un vote secret et des échanges confirmés : les promesses verbales peuvent être trahies, sans punition artificielle.
- Une partie rythmée, sans élimination : la capitale de chaque faction reste imprenable et garantit un revenu minimal.
- Un produit exploitable dans différents lieux, avec un simple équipement réseau, six appareils d'équipe et un ordinateur relié à un écran.

## 1.2 Objectifs fonctionnels vérifiables

1. Une régie peut configurer, ouvrir et conclure une partie sans modifier de fichier source.
2. Six équipes jouent en parallèle, sans attendre le tour de chacune.
3. Le serveur valide les actions et calcule un résultat identique quel que soit le navigateur utilisé.
4. Un univers peut être remplacé sans modifier le résultat des mêmes actions sur la même carte.
5. Les informations cachées ne sont jamais consultables depuis l'écran public ou une autre équipe avant leur révélation autorisée.
6. Une partie peut être suspendue et reprise après un incident ; les actions validées restent enregistrées.
7. La régie dispose d'un historique compréhensible pour arbitrer et animer le débriefing.

## 1.3 Public cible et configuration standard

- **Cible initiale :** événements d'entreprise, team building, groupes privés et animations pédagogiques.
- **Joueurs :** 18 à 30 personnes, réparties en six équipes de trois à cinq.
- **Animateur :** une personne pour lancer les phases, commenter les événements et superviser l'expérience. Un assistant de salle est utile mais non requis par les règles.
- **Matériel :** un grand écran ou vidéoprojecteur, un poste de régie, six smartphones ou tablettes connectés (un par équipe), sonorisation facultative.
- **Accessibilité :** aucun compte personnel requis pour les participants ; une personne de chaque équipe pilote son appareil, mais les autres participent oralement.

# 2. Architecture fonctionnelle : quatre espaces

## 2.1 Espace A — Studio des univers et des scénarios

**Utilisateur :** administrateur ou concepteur autorisé. **But :** créer, personnaliser, tester et publier une édition sans intervenir sur le code.

Fonctions indispensables :

- Voir le catalogue d'éditions avec miniature, nom, version, statut (brouillon/publié/archivé) et date de modification.
- Créer une édition depuis le **modèle neutre** ou **dupliquer** une édition existante ; choisir un univers parmi les cinq packs livrés, ou « édition personnalisée ».
- Modifier le titre, le pitch, le texte d'introduction, le lexique, les noms des six factions, les descriptions des pouvoirs, les noms des 33 territoires, les trois sites stratégiques et les textes narratifs des cinq Conseils.
- Modifier les **assets** : fond cartographique, visuels des territoires et factions, logo, palette, typographies disponibles, sons d'ambiance et de révélation, visuels d'événement.
- Prévisualiser en temps réel les vues **grand écran**, **équipe** et **régie**, notamment dans des résolutions différentes.
- Contrôler les champs manquants, les images illisibles, les contrastes insuffisants, les identifiants dupliqués et l'intégrité du plateau avant publication.
- Publier une version immuable ; cloner la version publiée pour effectuer des modifications. Une session commencée conserve la version d'édition choisie, même si une nouvelle version est publiée ensuite.
- Exporter/importer le contenu de l'édition en **JSON versionné**, accompagné d'un manifeste des médias. Les fichiers médias restent des références d'objets accessibles via le stockage autorisé.

**Séparation capitale :** l'éditeur thématique peut modifier le **texte** d'une loi ou d'un objectif, mais pas sa **condition mathématique** ni son identifiant de règle. Les effets numériques sont appliqués par le moteur à partir d'un catalogue fermé (`councilEffectId`, `goalId`, `factionArchetypeId`), jamais en interprétant du texte libre ou du code édité par l'utilisateur.

## 2.2 Espace B — Régie / organisateur

**Utilisateur :** animateur ou organisateur authentifié.

Fonctions indispensables :

- Créer une session en sélectionnant l'édition publiée et en saisissant un titre interne ; la session reçoit un identifiant unique et un **code de salle** personnalisable lorsque disponible.
- Affecter les six factions aux six équipes, manuellement ou par tirage ; afficher des **QR codes / liens d'entrée** distincts par équipe et un lien « écran public » distinct.
- Vérifier la connexion et l'état de préparation des six équipes, avec un indicateur clair « prête / en attente / déconnectée ».
- Lancer le briefing, le tutoriel, remettre à zéro le tutoriel, démarrer les manches, suspendre/reprendre le compte à rebours, avancer dans les phases et clôturer la partie.
- Voir les ressources, actions, alliances, votes et objectifs de toutes les équipes **uniquement côté régie**, sans les divulguer au plateau public.
- Visualiser les erreurs de validation et les cas incomplets ; corriger un incident technique au moyen d'une action d'arbitrage journalisée (raison, auteur, avant/après).
- Régler le volume, les animations et la cadence de révélation ; afficher à la demande les règles rapides et la carte des connexions.
- Rejouer la **séquence visuelle de révélation** de la manche sans recalculer ni modifier les résultats ; exporter un résumé de la session.
- Réinitialiser une session de démonstration ; démarrer une nouvelle partie à partir de la même édition sans réutiliser les données secrètes de la précédente.

**Interdiction :** un changement de phase, une modification de score ou une reprise ne peut pas être déclenché par l'interface d'une équipe ou l'écran public.

## 2.3 Espace C — Interface privée d'équipe

**Utilisateur :** un appareil authentifié comme équipe d'une session. **Objectif :** décider vite, avec une interface tactile claire.

Écran principal, sans défilement superflu :

- Nom et couleur de faction, manche/phase actuelle, chronomètre commun, état de connexion.
- Ressources **Moyens** et **Influence**, Prestige public, territoires contrôlés, **pouvoir personnel** et état disponible/utilisé.
- Objectif secret et progression privée quand le moteur peut l'évaluer.
- Carte consultable avec propriétaires, valeurs et connexions ; légende toujours accessible.
- Bouton « Négocier / Échanges » (offres envoyées et reçues) et « Alliance officielle » durant la phase autorisée.
- Deux emplacements d'ordres : choisir parmi Conquérir, Soutenir, Fortifier, Investir, Stabiliser ou laisser vide ; afficher la cible, le coût et une simulation **locale indicative**, jamais le résultat secret d'autrui.
- Bouton **« Verrouiller mes deux ordres »** avec récapitulatif explicite et confirmation. Avant le verrouillage, les ordres restent modifiables ; après verrouillage, ils ne le sont plus.
- Pendant le Conseil : écran de vote A/B/abstention, Influence engagée et confirmation secrète.
- Après révélation : résumé clair « Vos actions / ce qui s'est passé / points gagnés », puis invitation à la phase suivante.

**Principe :** l'équipe ne voit pas les ordres, les votes non dépouillés, les objectifs et les échanges privés des autres factions. Elle peut voir le nom, la position territoriale, le score public et les alliances officielles en cours.

## 2.4 Espace D — Plateau collectif projeté

**Utilisateur :** tous les participants, sans action sur le jeu. **Usage :** plein écran 16:9, lisible à distance.

Pendant le jeu :

- Carte visuelle des 33 territoires, couleurs/propriétaires et lignes de liaison ; icônes différenciant provinces de valeur, passages, sites stratégiques et capitales.
- État de la manche et de la phase, minuteur, Stabilité, classements publics, alliances officielles.
- Bandeau d'événement et deux options du Conseil annoncées à tous ; aucune indication sur les votes individuels avant dépouillement.
- Pendant la préparation : compteur des équipes ayant verrouillé, sans afficher leurs choix.
- Pendant la résolution : animation séquencée des tentatives, soutiens, conquêtes, changements de propriétaire, loi adoptée et gains de points.
- Fin de partie : révélation des objectifs, score détaillé, vainqueur unique, historique marquant, écran de conclusion adapté à l'univers.

**Exigence graphique :** conserver les frontières et les identifiants de zones en vectoriel (SVG ou géométrie Canvas/WebGL équivalente). Le zoom ne doit pas transformer la carte en image pixelisée. Les noms, nombres, couleurs et effets doivent rester lisibles depuis le fond de la salle. Les animations peuvent être désactivées, accélérées ou rejouées par la régie.

# 3. Règles canoniques V1.1 à implémenter

## 3.1 Plateau et territoires

La topologie officielle comporte **33 zones** et **60 connexions bidirectionnelles**. Les identifiants techniques sont stables et indépendants des noms thématiques :

| Code | Quantité | Fonction de jeu |
|---|---:|---|
| `C1…C6` | 6 | Capitales imprenables ; +1 Moyen garanti à chaque manche |
| `P1…P6` | 6 | Provinces initiales contrôlées au départ ; valeur 1 Prestige |
| `N1…N6` | 6 | Provinces locales neutres au départ ; valeur 1 Prestige |
| `M1…M6` | 6 | Provinces intérieures neutres ; valeur 1 Prestige |
| `F1…F6` | 6 | Frontières/passages neutres ; 0 Prestige, aucun revenu |
| `S1…S3` | 3 | Sites stratégiques neutres ; valeur 2 Prestige, aucun revenu |

Le propriétaire d'un territoire peut le conserver même s'il n'est plus connecté à sa capitale. La proximité visuelle ne crée jamais de connexion. **La liste exhaustive des voisins figure en annexe A** et doit être intégrée dans les tests automatiques.

**Au départ :** faction de position `i` contrôle `Ci` et `Pi`, tous les autres territoires sont neutres. `Pi` donne accès à `Ni`, `Fi` et `F(i−1)` ; chaque équipe a donc trois options neutres immédiates.

## 3.2 Équipes et pouvoirs

| Archétype stable | Pouvoir automatique |
|---|---|
| **Force** | +1 puissance sur **son premier ordre Conquérir** de la manche seulement si cible contrôlée par un adversaire au début de la manche ou site `S` (même neutre). Jamais contre P/N/M/F neutre. |
| **Commerce** | +1 Moyen après le premier **échange bilatéral exécuté** de la manche (au moins une unité transférée dans chaque sens). Une donation ne déclenche pas ce bonus. |
| **Pouvoir** | +1 voix gratuite aux Conseils et au Sommet, dans la limite de **3 voix** au total. |
| **Diplomatie** | +1 puissance sur son premier ordre **Soutenir** de la manche. |
| **Industrie** | Son premier ordre **Investir en Moyens** de la manche rapporte **3 Moyens** au lieu de 2. |
| **Renseignement** | Au début de chaque manche, choisit un adversaire dont elle peut consulter secrètement l'objectif personnel. |

Les noms visibles et descriptions narratives sont personnalisables, **pas les six archétypes techniques**. Les pouvoirs sont publics et appliqués par le moteur ; un joueur ne doit pas calculer lui-même s'il peut en bénéficier.

## 3.3 Ressources, revenus et caps

- Début de partie : **3 Moyens**, **2 Influence**, **0 Prestige** par faction ; **Stabilité commune 4/6**.
- Début de chaque manche : Stabilité −1 (minimum 0) ; +1 Moyen garanti par capitale ; +1 Moyen par province P/N/M contrôlée, avec au plus **2 Moyens supplémentaires** par manche ; +1 Influence. La loi héritée peut ajouter un revenu.
- Plafonds de stock : **8 Moyens**, **5 Influence**. Tout gain au-delà du plafond est perdu. Une offre d'échange ne peut pas être exécutée si elle dépasse le stock disponible ou le plafond du destinataire.
- Les coûts des conquêtes et de Stabiliser sont engagés au verrouillage, même en cas d'échec. Les gains d'Investir et de Stabiliser sont différés à la résolution et ne financent pas un autre ordre de la même manche.
- Les transferts bilatéraux sont **atomiques**, enregistrés avec l'accord des deux parties et disponibles immédiatement dès leur exécution réussie pendant la diplomatie.

## 3.4 Cinq actions possibles et deux ordres simultanés

| Ordre | Coût | Règle d'exécution |
|---|---|---|
| **Conquérir** | 1 Moyen + 0 à 2 Moyens de renfort | Cible non possédée et non capitale, adjacente à une zone possédée **au début de manche** ; puissance = 2 + renfort + pouvoirs/soutiens/loi. Une même équipe ne vise pas deux fois la même cible par manche. |
| **Soutenir** | 0 | Choisir bénéficiaire, cible et attaque/défense ; la cible doit être adjacente à une zone possédée par le soutien au début de manche. +1 normalement, +2 si alliance officielle, et bonus éventuel de Diplomatie/loi. Soutien nul sans opération correspondante. |
| **Fortifier** | 0 | +2 résistance pour une zone contrôlée au début de la manche, sauf capitale. Une seule fortification du propriétaire par zone et manche. |
| **Investir** | 0 | +2 Moyens ou +1 Influence à la résolution ; pouvoir Industrie le cas échéant. |
| **Stabiliser** | 1 Moyen | +1 Stabilité commune à la résolution, maximum 6. |

Un ordre peut être vide. Deux ordres identiques sont autorisés lorsque les limites de cible le permettent. La première action **ne crée jamais** de nouveaux territoires ou ressources utilisables par la deuxième action du même tour.

## 3.5 Diplomatie, alliances et trahison

- Négociations orales sans restriction ; promesses **non contraignantes**.
- Échanges exécutés dans la phase « Diplomatie » seulement, avec confirmation des deux parties.
- Alliance officielle entre deux factions, visible publiquement ; **un seul partenaire officiel** par faction à un instant donné. Elle se termine automatiquement après la manche et peut être retirée avant le verrouillage des ordres.
- Bonus d'un Soutien : +1 sans alliance, +2 entre alliés officiels, avant éventuels autres bonus.
- Une alliance n'empêche ni d'attaquer ni de mentir et n'autorise pas de victoire partagée. **Aucune pénalité codée de trahison.**

## 3.6 Résistance, conquêtes simultanées, soutiens décisifs

| Cible | Résistance de base |
|---|---:|
| P/N/M/F **neutre** | 1 |
| P/N/M/F **contrôlée** | 3 |
| S neutre ou contrôlé | 5 |
| Capitale C | Imprenable |

La défense peut recevoir +2 de Fortifier, des soutiens défensifs et des lois. Une conquête réussit seulement si sa puissance est **strictement supérieure** à la résistance et à **toutes** les attaques concurrentes dirigées vers cette cible. Deux meilleures attaques à égalité n'emportent pas la zone.

La validité de toutes les attaques et soutiens est déterminée à partir de **l'état des propriétaires au début de manche**. Les propriétaires des zones ne changent qu'après tous les calculs. Une perte simultanée de territoire source n'annule donc pas une attaque déjà valide. Une zone prise durant la résolution n'ouvre pas de nouvelle attaque ce tour.

**Soutien décisif :** un soutien apporte **+1 Prestige à la faction qui soutient**, au plus une fois par manche, s'il est déterminant pour un changement de contrôle d'un territoire déjà possédé ou d'un site stratégique S. Le moteur recalcule l'issue de l'opération en retirant ce soutien : si le résultat du contrôle de cette zone diffère, il est décisif. Les soutiens sur une zone neutre ordinaire ne donnent aucun point.

**Cas de référence chiffré :** la Force conquiert S1 avec 2 Moyens de renfort et un soutien officiel. Puissance = 2 (base) + 2 (renfort) + 1 (Force sur S) + 2 (soutien officiel) = **7** ; résistance S1 = **5** ; conquête réussie. Sans soutien, puissance **5** : attaque échouée car il faut strictement dépasser 5. Ce calcul corrige une coquille de commentaire identifiée dans le livre V1.1 ; les valeurs du pouvoir et de la formule ne changent pas.

## 3.7 Conseil, lois et Stabilité

À chaque manche, les six factions votent secrètement entre deux résolutions A/B ou s'abstiennent. Une voix gratuite par faction ; +1 voix par Influence dépensée, **maximum 2 Influence** par vote et 3 voix au total ; le Pouvoir reçoit une voix gratuite supplémentaire, toujours sous le plafond de trois voix.

- Votes et Influence engagée restent secrets jusqu'au dépouillement.
- La résolution ayant le plus de voix passe. **Égalité : aucun effet**. Les Influence dépensées sont perdues, même en cas de défaite.
- Les lois des manches 1 à 4 s'appliquent **à la manche suivante uniquement**. Celle de M5 s'applique immédiatement **après les conquêtes, avant le Prestige territorial**.
- Stabilité : 4 au départ, −1 au début de chaque manche (minimum 0), +1 par ordre Stabiliser, plus effets politiques éventuels (maximum 6).
- **Si Stabilité finale = 0**, personne ne marque de Prestige territorial durant cette manche. Les autres sources de Prestige demeurent possibles.

Les **effets exacts des cinq cartes V1.1** sont reproduits en annexe B ; tous les univers doivent conserver ces effets, même lorsqu'ils changent le titre et le récit.

## 3.8 Prestige, objectifs secrets, Sommet et victoire

À la fin de chaque manche, chaque faction reçoit : 1 Prestige par province de valeur P/N/M, 2 par S, **maximum 4 points territoriaux par manche** si la Stabilité est supérieure à 0 ; et éventuellement +1 pour un soutien décisif (hors plafond territorial).

Au début de partie, chaque faction reçoit **un objectif secret unique, sans doublon**, choisi parmi les six suivants :

| ID | Condition | Bonus |
|---|---|---:|
| `O1` | Contrôler ≥1 site S en fin de M5 | +4 |
| `O2` | Contrôler ≥3 provinces P/N/M en fin de M5 | +4 |
| `O3` | Contrôler ≥2 passages F en fin de M5 | +4 |
| `O4` | Avoir fourni ≥2 soutiens décisifs sur M1–M5 | +4 |
| `O5` | Avoir soutenu le vote gagnant à **3 Conseils distincts**, avec ≥1 Influence dépensée à chaque fois | +4 |
| `O6` | Avoir conquis ≥3 zones possédées par une autre faction **au début de la manche** | +4 |

**Sommet final (10 minutes) :** après les cinq manches, chaque faction vote secrètement pour une faction candidate, elle-même comprise ; mêmes règles de voix et d'Influence. La faction qui reçoit le plus de voix obtient +2 Prestige. Égalité à la première place : aucun bonus.

**Victoire :** une seule faction, celle qui possède le plus de Prestige après objectifs secrets et Sommet. En cas d'égalité, départager successivement par (1) sites S contrôlés, (2) nombre de soutiens décisifs, (3) provinces de valeur contrôlées, (4) Influence restante, (5) Moyens restants, (6) priorité aléatoire attribuée au début. Plafond théorique : **31 Prestige**.

# 4. Chronologie et automatisation de la session

## 4.1 Déroulement strict : 150 minutes

| Séquence | Durée | Contrôle principal |
|---|---:|---|
| Présentation / immersion / règles | 15 min | Régie + écran public |
| Tour d'initiation sans effet permanent puis remise à zéro | 10 min | Régie + toutes équipes |
| Cinq manches de 20 minutes | 100 min | Serveur + équipe + écran public |
| Sommet final | 10 min | Équipes + régie |
| Révélation des secrets, victoire et débriefing | 15 min | Grand écran + régie |

Chaque manche comporte **2 min Situation**, **8 min Diplomatie**, **4 min Ordres**, **3 min Conseil**, **3 min Résolution**. Le chronomètre doit se synchroniser sur une heure d'échéance fournie par le serveur (pas sur les horloges individuelles). En cas d'incident collectif, la régie peut mettre la session en pause puis reprendre **sans raccourcir les phases**.

## 4.2 Machine à états imposée

`DRAFT → LOBBY → BRIEFING → TUTORIAL → RESET → M1.SITUATION → M1.DIPLOMACY → M1.ORDERS → M1.COUNCIL → M1.RESOLVE → M2…M5 → SUMMIT → RESULTS → ARCHIVED`

Pendant chacune des cinq manches :

1. **Situation :** prélever −1 Stabilité, attribuer revenus, appliquer éventuelle loi précédente, autoriser Renseignement, présenter événement et options du Conseil.
2. **Diplomatie :** échanges atomiques et alliances signées ; libre négociation physique.
3. **Ordres :** chaque équipe choisit au plus deux ordres, modifiables tant que le compte à rebours et l'état d'enregistrement le permettent ; verrouillage unique par équipe.
4. **Conseil :** vote A/B/abstention ; blocage à échéance, coût d'Influence confirmé.
5. **Résolution :** figer un instantané de départ, calculer sans ordre d'avantage entre équipes, appliquer conquêtes, Investir, Stabiliser et effet M5, attribuer Prestige et publier le résultat final de la manche.

**Gestion des échéances :** un ordre ou un vote non enregistré est absent/abstention. Un ordre validé et reçu par le serveur avant l'échéance reste enregistré après reconnexion. Les transitions sont déclenchées une seule fois côté serveur, avec une clé d'idempotence ; le client n'est jamais source d'autorité pour déclencher la résolution.

## 4.3 Révélation sur grand écran

La résolution doit avoir une **chorégraphie visuelle** paramétrable, tout en restant strictement une lecture du résultat calculé :

1. Fermeture des ordres, écran « toutes les décisions sont scellées ».
2. Apparition des tentatives de conquête et de leurs trajectoires, sans attribuer encore les propriétaires.
3. Apparition des soutiens effectifs, y compris les soutiens absents malgré les alliances ; surbrillance des soutiens décisifs.
4. Calcul rendu lisible : puissance, résistance, rivalités et résultat ; changement simultané des couleurs de contrôle.
5. Résultat du Conseil, Stabilité finale, points marqués, évolution du classement.

La régie peut avancer/reculer entre les étapes visuelles, rejouer la séquence **sans exécuter de nouveau les règles** ou afficher la résolution instantanément si la séance est en retard.

# 5. Les cinq éditions thématiques obligatoires

## 5.1 Principe de transposition

Une **édition** est un ensemble de contenus et médias, attaché à une version de moteur. Les mêmes identifiants `C/P/N/M/F/S`, `O1…O6`, pouvoirs, dépenses, forces et effets des lois restent actifs. Il n'existe **pas cinq jeux distincts à maintenir**.

Chaque édition doit comporter : titre, accroche, introduction orale courte, nom de la monnaie « Moyens », nom de « Influence », libellé de « Stabilité », six noms de factions, six descriptifs narratifs de pouvoir, 33 noms de territoires, trois noms de sites S, cinq cartes de Conseil narrativisées avec A/B, six intitulés d'objectifs secrets, identité visuelle, carte de fond vectorielle, éléments de décoration, écran de fin et ambiance sonore désactivable.

## 5.2 Tableau de direction artistique

| Univers | Intention / conflit | Style suggéré | Sites centraux S (exemples) |
|---|---|---|---|
| **Western** | Conquête de nouveaux territoires, villes minières et chemin de fer ; pouvoirs locaux rivaux | Papier cartographique, bois, fer, cuivre, affiches anciennes | Grand Dépôt, Mine Centrale, Maison du Conseil |
| **Mafia** | Organisations rivales dans une ville fictive de l'entre-deux-guerres ; trafic, contrôle d'infrastructures, influence locale | Art déco, nuits urbaines, contrastes noirs/or, affiches d'époque | Port Franc, Banque Centrale, Hôtel de Ville |
| **Corporate** | Six groupes concurrents cherchent à dominer un marché en pleine crise, au prix d'alliances commerciales et de votes de gouvernance | Design premium actuel, cartes de secteurs, infographie lisible | Hub Logistique, Centre de Données, Conseil Central |
| **Moyen Âge** | Grandes maisons, guildes et institutions se disputent un territoire fictif et les décisions du Conseil | Parchemin, gravure, enluminure sobre, blasons originaux | Citadelle, Grand Marché, Abbaye du Conseil |
| **Futuriste** | Puissances spatiales ou planétaires rivales confrontées à une crise systémique | Interface holo, constellations, néons mesurés, cartes de secteurs | Astroport, Réacteur Central, Station du Sénat |

Ce tableau est une **proposition créative** : le studio doit permettre de renommer ou remplacer les éléments. Les univers doivent rester fictifs ou utiliser des visuels dont les droits d'exploitation sont vérifiés. Aucune marque, personnage ou licence externe ne doit être nécessaire au fonctionnement.

## 5.3 Correspondance des six factions

| Archétype | Western | Mafia | Corporate | Moyen Âge | Futuriste |
|---|---|---|---|---|---|
| Force | La Milice | Les Hommes de main | Les Opérations | La Garde | La Flotte |
| Commerce | Les Négociants | Les Contrebandiers | Le Commerce | La Guilde marchande | La Ligue marchande |
| Pouvoir | Le Gouvernorat | Le Directoire | Le Conseil de direction | La Cour | Le Directoire stellaire |
| Diplomatie | Les Notables | Les Intermédiaires | Les Relations stratégiques | Les Émissaires | Le Corps diplomatique |
| Industrie | La Compagnie minière | Les Distilleries | Le Pôle industriel | Les Artisans | Les Constructeurs |
| Renseignement | Les Éclaireurs | Les Informateurs | La Veille stratégique | Les Espions | Les Renseignements |

Les libellés visibles sont distincts des identifiants logiques (`force`, `commerce`, `pouvoir`, `diplomatie`, `industrie`, `renseignement`). La couleur d'une faction doit conserver son identité **à l'intérieur d'une même partie** et rester reconnaissable en daltonisme grâce à des pictogrammes ou motifs.

## 5.4 Vocabulaire adaptable

| Notion moteur | Western | Mafia | Corporate | Moyen Âge | Futuriste |
|---|---|---|---|---|---|
| Moyens | Dollars / approvisionnements | Liquidités | Budget | Écus | Crédits |
| Influence | Réputation | Relations | Influence | Autorité | Influence |
| Stabilité | Ordre territorial | Paix des quartiers | Confiance du marché | Paix du royaume | Équilibre du système |
| Conseil | Assemblée du territoire | Commission des familles | Conseil stratégique | Conseil du royaume | Sénat sectoriel |
| Prestige | Renommée | Ascendant | Réussite | Gloire | Prestige |

**Note :** les ressources ne deviennent pas de nouvelles monnaies mécaniques : seule leur étiquette change. Le texte d'aide au survol peut rappeler « Moyens » ou « Influence » pour faciliter l'apprentissage quel que soit l'univers.

## 5.5 Éléments éditoriaux à livrer pour chaque édition

1. **Écran d'accueil :** titre, signature, introduction en moins de 90 secondes à lire par l'animateur.
2. **Carte :** 33 noms de lieux tous renseignés et sans confusion, correspondances techniques conservées, trois sites S clairement identifiables et 60 liaisons visibles en mode analyse.
3. **Factions :** six cartes originales avec illustration, pitch de 2–3 lignes, pouvoir lisible en une phrase, couleur et pictogramme.
4. **Conseil :** cinq situations narratives propres à l'univers, chacune avec les deux options A/B et une explication immédiatement compréhensible de leurs conséquences **mathématiques identiques à V1.1**.
5. **Objectifs :** six intitulés thématiques mais exactement les mêmes conditions `O1…O6` ; aucun objectif ne révèle le contenu d'un autre.
6. **Ambiance :** musique / nappes facultatives et effets courts de décision ou de conquête ; réglage indépendant du volume ou coupure totale.
7. **Finale :** écran de victoire et débriefing avec les mêmes mesures quel que soit l'univers.

## 5.6 Autorité des versions et garde-fous de l'éditeur

- Une **édition publiée** est immuable. Ses libellés, médias et paramétrages sont figés dans chaque session lancée.
- Un concepteur peut modifier librement les noms et illustrations, mais **pas** le nombre de factions, la structure de la carte, les formules ni les pouvoirs en mode édition standard.
- Un éventuel **mode expérimental avancé** modifiant ces paramètres devra créer un **ruleset distinct**, marqué non équilibré ; il est hors du périmètre initial.
- Une traduction doit toujours conserver les effets exacts ; l'édition ne peut pas « masquer » un coût ou une sanction sous une formulation ambiguë.
- Le studio vérifie les six factions, 33 territoires, trois sites, cinq Conseils et six objectifs, et bloque la publication si un élément obligatoire manque.

# 6. Parcours utilisateurs et écrans attendus

## 6.1 Parcours de l'organisateur

`Se connecter → sélectionner ou cloner une édition publiée → créer une session → afficher six QR d'équipe → attribuer les équipes → test réseau / écran → briefing → tutoriel → lancer M1 → superviser M1…M5 → Sommet → résultats → exporter / archiver`.

La régie doit toujours montrer la phase courante, la prochaine phase, le temps restant, le nombre d'équipes ayant verrouillé et les exceptions à traiter. Les commandes pouvant modifier l'état demandent confirmation et sont historisées.

## 6.2 Parcours d'une équipe

`Scanner son QR → voir son nom, sa faction et son statut → lire sa fiche et son objectif secret → tutoriel → Situation → négocier physiquement → confirmer échanges/alliances → programmer deux ordres → verrouiller → voter → suivre la révélation → consulter son bilan`.

Pour chaque ordre, l'interface demande uniquement les champs nécessaires. Exemples : Conquérir → cible sur carte + renfort 0/1/2 ; Soutenir → partenaire + cible + attaque/défense ; Investir → Moyens/Influence. Les coûts totaux et la légalité s'affichent avant validation.

## 6.3 Parcours d'un spectateur

Aucune authentification : accès à l'URL de projection en lecture seule ou ouverture depuis la régie. En mode public, ni les objectifs, ni les ressources privées si elles ne sont pas déclarées publiques, ni les ordres avant révélation, ni les détails des échanges ne peuvent être obtenus.

## 6.4 Composants UX communs

- Compte à rebours synchronisé, états explicites « ouvert », « enregistré », « verrouillé », « résolu ».
- Aide intégrée en langage naturel, règles en deux minutes, légende des territoires et des icônes.
- Un retour clair pour chaque action : « échange confirmé », « ordre enregistré », « alliance annulée », « délai dépassé ».
- Pas de dépendance exclusive à une couleur ; formes, icônes et textes visibles sur fond clair et sombre.
- Possibilité de couper les animations, réduire les mouvements, régler le son, utiliser l'interface sur écran tactile sans interactions au survol uniquement.

# 7. Modèle de données et séparation des responsabilités

## 7.1 Entités principales

| Entité | Champs essentiels | Rôle |
|---|---|---|
| `rulesets` | `id`, `version`, `checksum`, paramètres immuables, carte | Détermine les lois mathématiques ; V1.1 au départ |
| `scenarioEditions` | `id`, `status`, `editionVersion`, `rulesetId`, `themeId`, textes, médias, zones, factions, Conseils | Contenus d'un univers |
| `sessions` | `id`, `code`, `rulesetVersion`, `editionSnapshot`, `phase`, `round`, horloge/état | Partie en cours ou terminée |
| `teams` | `teamId`, archétype, position, alias, jeton d'accès, ressources, Prestige, état | Équipe participante |
| `territories` | `zoneId`, propriétaire, type, valeur, voisinage, version d'état | État du plateau |
| `offers` | auteur, destinataire, transferts A/B, expirations, signatures | Échanges atomiques |
| `alliances` | paire, statut, manche, horodatage | Alliances publiques, une par faction |
| `orders` | équipe, manche, deux ordres, état verrouillé, horodatage | Intentions secrètes |
| `votes` | équipe, manche/Sommet, option/candidat, Influence payée | Votes secrets |
| `events` | séquence, type, instant, avant/après, visibilité, corrélation | Historique et replay |
| `results` | captures, soutiens décisifs, loi, Stabilité, Prestige et classement | Snapshot de résolution |

**Recommandation de stockage :** séparer les vues publiques, les vues privées par équipe et l'espace régie plutôt que conserver un grand document unique susceptible d'être lu par toutes les interfaces. Une même session peut exposer plusieurs **projections** calculées du même état serveur canonique.

## 7.2 Exemple de configuration d'édition (illustratif)

```json
{
  "scenarioId": "western-01",
  "editionVersion": "1.0.0",
  "rulesetId": "pacte-neutral-1.1",
  "mapId": "pacte-map-33-v1",
  "status": "published",
  "themeId": "western",
  "title": "Le Pacte — Western",
  "resourceLabels": {
    "means": "Approvisionnements",
    "influence": "Réputation",
    "stability": "Ordre territorial"
  },
  "factionLabels": {
    "force": "La Milice",
    "commerce": "Les Négociants"
  },
  "territoryLabels": {
    "C1": "Fort des Collines",
    "S1": "Grand Dépôt"
  },
  "councils": [
    {
      "round": 1,
      "effectAId": "M1_LOGISTICS",
      "effectBId": "M1_LOCAL_DEFENSE",
      "title": "Le conseil du territoire"
    }
  ]
}
```

Cet extrait n'est pas une édition complète : **33 libellés, six factions et cinq cartes** sont obligatoires à la publication. L'exemple illustre surtout que les identifiants des effets ne changent jamais avec le thème.

## 7.3 Versionnement et sauvegardes

- `rulesetVersion` et `editionVersion` sont toujours inscrits sur la session. Les règles changées ultérieurement ne modifient pas les parties en cours.
- Chaque transition importante produit une **photographie d'état** ou un événement rejouable, horodaté, avec numéro de séquence monotone.
- Le replay doit utiliser les résultats archivés, pas recalculer une ancienne partie avec une nouvelle version du moteur.
- Export de session au format JSON (audit technique) et CSV ou PDF récapitulatif (débriefing). Les objectifs secrets ne sont exportés publiquement qu'après clôture.

# 8. Architecture technique recommandée

## 8.1 Proposition de stack

- **Frontend web :** React + TypeScript, architecture de composants partagés ; interface responsive des équipes et mode grand écran.
- **Hébergement :** Firebase Hosting ; déploiements de prévisualisation et de production séparés.
- **Identités :** Firebase Authentication pour la régie et l'éditeur ; liaison d'un appareil d'équipe à un rôle limité par session, sans exposer une authentification globale de l'organisateur.
- **Synchronisation :** Cloud Firestore avec vues temps réel et règles de sécurité explicites.
- **Commandes faisant autorité :** Cloud Functions (ou service serveur équivalent) pour valider les actions, les échanges, les transitions, les votes et la résolution.
- **Médias :** Cloud Storage avec droits d'écriture réservés aux concepteurs et versions publiées identifiables.
- **Qualité :** environnement de test isolé, Firebase Emulator Suite pour les fonctions et règles, tests unitaires et end-to-end.

Cette stack est **recommandée**, et non imposée : le besoin indispensable est un **serveur faisant autorité**, des canaux de lecture correctement séparés et un protocole de synchronisation fiable. La documentation officielle de Firebase sur les transactions, Hosting et App Check figure en annexe D.

## 8.2 Règles de sécurité et anti-triche

- Aucune mise à jour directe des ressources, du propriétaire d'un territoire, du Prestige ou de la phase depuis le navigateur d'une équipe.
- Un joueur ne peut émettre une commande que pour **sa propre équipe**, dans **sa session**, **sa phase** et **avant l'échéance serveur**.
- Chaque commande possède `commandId`, `sessionId`, `teamId`, `expectedPhase`, `expectedRound` et `clientIssuedAt` (indicatif) ; le serveur vérifie puis écrit avec **idempotence**.
- Les transferts d'échange s'appliquent **dans une transaction unique** : en cas d'échec d'une condition, aucun joueur ne reçoit ni ne perd de ressource.
- Les objectifs secrets, les ordres et les votes en attente demeurent dans des documents privés non accessibles par d'autres équipes. L'interface publique lit uniquement des documents publics.
- Les secrets de régie et les jetons d'équipe sont à durée et portée limitées ; ne jamais les afficher dans les journaux clients, et permettre la **révocation d'un QR perdu**.
- Séparer le rôle « éditeur », « organisateur », « équipe » et « public ». Journaliser les corrections d'admin sans permettre une modification discrète après révélation.
- Protéger les endpoints par les mécanismes appropriés (authentification, contrôles d'autorisation serveur, limitation des requêtes et, lorsque compatible, App Check). **App Check ne remplace pas l'authentification ni les règles d'accès.**

## 8.3 Connexion et continuité

- À l'ouverture, l'app recharge l'état actuel à partir du serveur ; l'horloge affichée tient compte de l'heure de référence serveur.
- Si le réseau coupe, l'équipe voit « Connexion perdue — ordres non transmis » tant qu'un accusé de réception serveur n'est pas obtenu. Aucune action non confirmée n'est présentée comme validée.
- Les décisions déjà validées subsistent ; un `commandId` identique ne provoque pas une double dépense après reconnexion.
- Si la coupure affecte plusieurs équipes ou la régie, l'animateur peut **suspendre la partie**. Une véritable continuation hors ligne n'est pas promise en V1.
- Le grand écran doit retrouver son état exact après rafraîchissement, sans rejouer automatiquement les animations ni révéler à nouveau des secrets.

## 8.4 Qualité de service et accessibilité (cibles d'acceptation)

- Consultation et saisie testées sur smartphones **360 px** de large minimum, tablettes et ordinateurs ; projection **1920×1080**, avec prise en charge du **3840×2160**.
- Sur le réseau de test du lieu, un changement public normal doit apparaître au grand écran en **≤ 2 secondes au 95e percentile** ; cible indicative à mesurer, dépendante du réseau réel.
- La régie affiche un indicateur de fraîcheur des données et sait si une équipe a effectivement confirmé ses deux ordres.
- Les textes essentiels restent lisibles depuis la salle ; ne pas coder l'information par la couleur seule. Clavier, focus et commandes tactiles fonctionnent ; mode mouvement réduit.
- Prévoir sauvegarde/export des sessions, séparation test/production, surveillance des erreurs, alertes de coût Firebase et contrôle des ressources consommées.

# 9. Moteur de résolution : contrat de développement

## 9.1 Principes de calcul

Le moteur doit être **pur et déterministe** : pour un même état initial, les mêmes ordres, alliances, votes et version de règles, il produit exactement le même état final et le même journal, quel que soit le thème et indépendamment de l'ordre d'arrivée des messages réseau.

**Ordre canonique de calcul :**

1. Valider les coûts et capturer l'état des propriétaires **au début de la manche** (avant actions).
2. Geler les alliances actives au verrouillage des ordres ; valider adjacences, soutiens et fortifications.
3. Calculer toutes les résistances et puissances d'attaque à partir du même état figé.
4. Déterminer les conquêtes : puissance strictement supérieure à défense et rivaux ; égalités conservatrices.
5. Appliquer **ensemble** toutes les conquêtes gagnantes.
6. Identifier les soutiens décisifs en recalculant les issues **sans chaque soutien** ; appliquer un maximum de 1 Prestige par équipe et manche.
7. Ajouter Investir et Stabiliser, puis l'effet de Conseil de M5 s'il existe.
8. Marquer le Prestige territorial si Stabilité > 0, avec plafond 4.
9. Produire événements de révélation, snapshots et projections publiques/privées ; préparer la loi de la manche suivante.

**Cas à figer avant programmation de l'UI :** lorsqu'une faction a déjà deux ordres valides qui nécessitent plus de Moyens que son stock, **le serveur refuse l'ensemble du verrouillage** et affiche la dépense à corriger ; il ne supprime pas silencieusement le second ordre. Un soutien illégal ne doit ni coûter de ressources ni bénéficier à la cible ; le refus est expliqué avant validation.

## 9.2 Catalogue fermé des effets politiques V1.1

Les cartes thématiques portent les identifiants d'effet suivants :

| Conseil | Résolution A | Résolution B | Application |
|---|---|---|---|
| M1 | `M1_LOGISTICS` : +1 Moyen à chaque équipe en début M2 | `M1_LOCAL_DEFENSE` : +1 défense P/N/M/F contrôlés en M2 | M2 |
| M2 | `M2_NEUTRAL_EXPANSION` : +1 attaque contre P/N/M/F neutres en M3 | `M2_SITE_DEFENSE` : +1 défense de tous les S en M3 | M3 |
| M3 | `M3_SUPPORT_BOOST` : +1 puissance à chaque ordre Soutenir valide en M4 | `M3_RESERVE` : +1 Moyen par équipe en début M4 | M4 |
| M4 | `M4_SITE_OFFENSE` : +1 attaque contre S en M5 | `M4_SITE_FORTRESS` : +1 défense de tous les S en M5 | M5 |
| M5 | `M5_REPAIR` : +2 Stabilité avant Prestige M5 | `M5_MOBILIZATION` : +1 Influence utilisable au Sommet (stocks plafonnés) | Immédiat après opérations M5 |

**Point de vigilance :** l'identification des propriétaires « contrôlés » ou « neutres » pour les bonus de loi doit être basée sur l'instant adéquat défini par V1.1 (l'état de début de manche pour les opérations). Le Conseil M5 n'agit jamais rétroactivement sur les combats déjà résolus.

## 9.3 Opérations serveur attendues

| Opération logique | Préconditions | Résultat |
|---|---|---|
| `createSession` | éditeur publié, organisateur autorisé | Session DRAFT + snapshot d'édition |
| `joinTeam` | code valide, faction attribuée, jeton non révoqué | Session d'équipe limitée |
| `proposeTrade` / `acceptTrade` | phase diplomatie, stocks et limites | Échange atomique, reçu privé et historique |
| `proposeAlliance` / `acceptAlliance` / `endAlliance` | diplomatie, un allié maximum | Alliance publique à durée de manche |
| `saveOrders` / `lockOrders` | phase Ordres, équipe propriétaire | Deux ordres valides, engagement des coûts |
| `castCouncilVote` | phase Conseil, Influence et plafond | Vote privé et Influence engagée |
| `castSummitVote` | phase Sommet | Vote privé final |
| `advancePhase` / `pause` / `resume` | rôle régie | Horloge et états cohérents |
| `resolveRound` | tous les seuils de phase respectés | Résultat idempotent, projections et journal |
| `adjudicate` | rôle régie, justification obligatoire | Correction versionnée et audit |
| `exportSession` | autorisations valides | Export selon la visibilité autorisée |

Le nom des fonctions reste indicatif ; la **sémantique**, les préconditions et les droits sont les exigences à respecter.

# 10. Exigences et critères d'acceptation

## 10.1 Fonctionnalités prioritaires

| ID | Priorité | Besoin | Critère d'acceptation |
|---|---|---|---|
| `F-01` | P0 | Session / QR | Une régie crée une session et connecte six équipes séparées |
| `F-02` | P0 | Plateau 33 zones | Les 33 codes, 60 connexions, valeurs et types sont exacts |
| `F-03` | P0 | Deux ordres | Une équipe peut configurer, corriger et verrouiller deux ordres valides |
| `F-04` | P0 | Conquêtes simultanées | Même résultat pour les mêmes ordres, quel que soit l'ordre réseau |
| `F-05` | P0 | Soutiens / alliances | +1/+2 et pouvoir Diplomatie appliqués seulement si support valide |
| `F-06` | P0 | Ressources / échanges | Aucune dépense double ni transfert partiel ; plafonds respectés |
| `F-07` | P0 | Conseil / lois | Vote secret, Influence payée et loi appliquée à la bonne manche |
| `F-08` | P0 | Prestige / objectifs | Totaux exacts, secrets révélés seulement à la clôture |
| `F-09` | P0 | Stabilité / Sommet | Effets et points conformes à V1.1 |
| `F-10` | P0 | Autorisations | Aucun accès d'une équipe à l'état privé d'une autre |
| `F-11` | P0 | Grand écran | Carte, minuteur, alliance, classement, résolution sans fuite |
| `F-12` | P0 | Chronométrage / pause | Cinq manches de 20 minutes, horloge serveur, pause/reprise sûre |
| `F-13` | P0 | Cinq éditions | Les cinq univers se lancent avec le même ruleset |
| `F-14` | P0 | Studio de contenus | Dupliquer, éditer, prévisualiser et publier une édition |
| `F-15` | P1 | Replay | Réafficher une résolution sans recalcul ni double attribution |
| `F-16` | P1 | Exports / bilans | Exporter résultat, scores, journal et statistiques de partie |
| `F-17` | P1 | Raccourcis d'animation | Révélation accélérée, volume, règles rapides, connexion des équipes |
| `F-18` | P2 | Multilingue FR/EN | Préparer les clés de traduction ; traduction anglaise en phase 2 |
| `F-19` | P2 | Variantes de 4–8 équipes | Hors version initiale ; demande nouvelle carte et équilibrage |

**Définition :** P0 = nécessaire au premier lancement utilisable ; P1 = amélioration rapidement utile ; P2 = évolution ultérieure. Un P0 absent signifie que le premier produit n'est pas prêt à animer une partie commerciale complète.

## 10.2 Matrice de tests du moteur

| ID test | Scénario | Résultat attendu |
|---|---|---|
| `T-01` | Départ six équipes | Chacune possède Ci/Pi, 3 Moyens, 2 Influence, 0 Prestige ; Stabilité 4 |
| `T-02` | Conquête Ni neutre sans renfort | Base 2 > résistance 1 : conquête valide |
| `T-03` | Force contre Ni neutre | Pas de bonus de Force |
| `T-04` | Force contre S neutre, premier Conquérir | Bonus +1 appliqué |
| `T-05` | Même cible attaquée par deux équipes à puissance égale | Aucun changement de propriétaire |
| `T-06` | Zone source perdue pendant résolution | Attaque/soutien initialement légal toujours résolu |
| `T-07` | Investir + Conquérir en même manche, fonds insuffisants | Verrouillage refusé ; gains d'Investir indisponibles |
| `T-08` | Commerce : donation puis échange bilatéral | Bonus +1 seulement après échange bilatéral |
| `T-09` | Diplomatie soutient un allié officiel | Valeur = +2 officielle +1 pouvoir, puis éventuelle loi |
| `T-10` | Soutien promis mais non programmé | Aucun soutien ni pénalité de trahison |
| `T-11` | Soutien décisif sur S | +1 Prestige au soutien, max une fois / manche |
| `T-12` | Soutien sur Ni neutre ordinaire | Aucun Prestige de soutien décisif |
| `T-13` | Conseil à égalité | Aucune loi adoptée ; Influence payée consommée |
| `T-14` | Pouvoir : 1 voix gratuite + bonus + Influence | Maximum trois voix, jamais quatre |
| `T-15` | Stabilité finale = 0 | 0 Prestige territorial ; autres sources préservées |
| `T-16` | Deux ordres même territoire cible | Verrouillage impossible |
| `T-17` | Sommet à égalité en tête | Aucun bonus de +2 |
| `T-18` | Objectif O2/O5/O6 à 2 occurrences puis 3 | Échec à 2, réussite à 3 |
| `T-19` | Partie identique Western/Mafia/Corporate/Moyen Âge/Futuriste | Même résultat, seuls les contenus affichés diffèrent |
| `T-20` | Actualisation de l'écran public avant révélation | Pas d'accès à ordres, votes, objectifs |
| `T-21` | Deux validations simultanées d'un échange | Une seule transaction, jamais de transfert partiel |
| `T-22` | Résolution lancée deux fois à cause d'une reconnexion | Un seul calcul et un seul score attribué |
| `T-23` | Session créée sur édition v1 puis édition v2 publiée | Partie active inchangée |
| `T-24` | Déconnexion d'une équipe puis reconnexion | États et décisions confirmés restaurés |
| `T-25` | Arbitre corrige une ressource avec motif | Journal avant/après visible à la régie, pas de modification cachée |

## 10.3 Tests humains obligatoires avant exploitation commerciale

Organiser au minimum une partie avec **six équipes**, idéalement 18 à 30 personnes représentatives du public cible, et un observateur séparé de l'animateur. Évaluer : temps réel des phases, nombre de demandes d'aide, erreurs d'ordres, négociations spontanées, diversité des choix d'expansion, trahisons compréhensibles, position des retardataires et intérêt du Sommet.

Le produit ne doit pas être considéré comme équilibré uniquement parce que les simulations automatisées réussissent. Les critères de succès du test humain seront définis avant le test et consignés dans un rapport ; aucun résultat humain n'est supposé dans ce cahier.

# 11. Mise en œuvre par lots et livrables

## Lot 0 — Reprise et préparation

- Lire intégralement le règlement V1.1 et le présent cahier ; vérifier les versions et les sources dans le dépôt de code existant avant toute modification.
- Mettre sous contrôle de version le moteur neutre, la carte (33 nœuds / 60 arêtes), les cinq cartes de Conseil, six objectifs et la suite de tests existante si elle est exploitable.
- Établir l'environnement de développement, les rôles d'accès, le schéma de données, les conventions de commande, un jeu de données de démonstration.

**Livrable :** dépôt exécutable, migrations/schémas, tests de référence reproductibles, documentation de lancement local.

## Lot 1 — Moteur neutre complet

- État des manches, ressources, deux ordres, conflits, soutiens, alliances, échanges, Conseil, Stabilité, Prestige, objectifs, Sommet.
- Contrôles de sécurité serveur, transitions atomiques, idempotence, tests T-01 à T-18.

**Livrable :** moteur testable indépendamment des vues et de tout thème.

## Lot 2 — Trois interfaces de jeu

- Équipe mobile, régie, projection ; connexion QR, temps réel, gestion des phases et compte à rebours.
- Carte vectorielle à 33 zones, validation visuelle des ordres, animations de révélation, écran de résultats.

**Livrable :** une partie entière réalisable dans l'édition neutre.

## Lot 3 — Studio des éditions et cinq packs

- Éditeur et validation des contenus, gestion version brouillon/publiée, prévisualisations et uploads médias.
- Livrer **Western, Mafia, Corporate, Moyen Âge, Futuriste** avec 33 labels, six factions, cinq Conseils, six objectifs thématiques, habillage cartographique et introduction propres à chacun.
- Tester parité mécanique T-19 et publication/versionnement T-23.

**Livrable :** cinq éditions réellement jouables et éditables sans modifier le moteur.

## Lot 4 — Durcissement, tests en salle et déploiement

- Tests multiappareils/réseau, sécurité et confidentialité, pauses et reprises, export, accessibilité, projection 1080p/4K.
- Session test avec six équipes ; corrections ciblées ; documentation animateur.
- Déploiement de production **uniquement après validation** avec le propriétaire du projet.

**Livrable :** version candidate pour utilisation événementielle, journal des tests, guide d'exploitation et plan de retour arrière.

# 12. Hors périmètre et décisions ouvertes

## 12.1 Hors version initiale

- Application native iOS/Android ; une web app responsive suffit.
- IA qui négocie à la place des factions ; les négociations restent humaines et physiques.
- Création de nouveaux pouvoirs ou nouvelles règles mathématiques depuis l'éditeur standard.
- Paiement en ligne, réservation de prestations, CRM, classement global multi-événements.
- Changement libre du nombre d'équipes ou de la topologie de carte pendant une session.
- Support hors ligne complet ; seul le maintien des états déjà validés et la reprise réseau sont exigés.

## 12.2 Arbitrages à conserver visibles

1. **Sommet final :** maintenu conformément à V1.1, mais son intérêt réel doit être étudié au premier test humain.
2. **Stabilité :** règle maintenue ; vérifier si les joueurs perçoivent les conséquences et si elle ne bloque pas trop souvent les scores.
3. **Médias :** créer des illustrations originales ou utiliser des éléments dont les droits sont établis ; arrêter la liste exacte des fichiers avant production graphique.
4. **Temps réel :** mesurer les performances dans la salle et avec les appareils réels avant de fixer un objectif de service contractuel.
5. **Décisions d'administration :** déterminer les personnes autorisées à créer des éditions et à lancer des sessions ; cette affectation n'est pas déductible du seul cahier.

# Annexe A — Graphe officiel des 33 territoires

![Plateau neutre de référence. Les codes font autorité pour les connexions.](Le_Pacte_carte_neutre_33.png){width=5.6in}

**Règle :** les relations sont bidirectionnelles et **60 connexions au total** doivent être retrouvées par calcul automatique. Le générateur d'édition modifie les noms et le dessin, pas cette liste d'arêtes.

| Groupe | Voisinage exact |
|---|---|
| C1–C6 | `Ci` est lié à `Pi` |
| P1–P6 | `Pi` est lié à `Ci`, `Ni`, `Fi` et `F(i−1)` avec `F0=F6` |
| N1–N6 | `Ni` est lié à `Pi` et `Mi` |
| M1–M6 | `Mi` est lié à `Ni`, `Fi`, `F(i−1)` et `S(⌊(i−1)/2⌋+1)` |
| F1–F6 | `Fi` est lié à `Pi`, `P(i+1)` (modulo 6), `Mi`, `M(i+1)` (modulo 6) et au site S associé ; `F2`, `F4` et `F6` disposent chacun d'un accès supplémentaire au site S suivant |
| S1–S3 | Tous les sites S sont reliés deux à deux ; leurs autres voisins découlent des liens M/F ci-dessus |

Pour éviter toute ambiguïté d'indice, **la liste littérale exacte** est également fournie dans le jeu de données technique `map33-v1` livré au dépôt, avec un test automatique vérifiant les 33 identifiants, les 60 arêtes et les trois options neutres accessibles depuis chaque `Pi`. Les développeurs doivent dériver la liste d'arêtes à partir de la définition de référence du moteur V1.1 ; les raccourcis ci-dessus ne sont pas une seconde version de la topologie.

# Annexe B — Cartes de Conseil à habiller

| Manche | Sujet neutre | Choix A | Choix B |
|---|---|---|---|
| M1 | Ressources ou protection | +1 Moyen à tous au début M2 | +1 résistance sur P/N/M/F contrôlés en M2 |
| M2 | Ouverture du territoire | +1 puissance contre P/N/M/F neutres en M3 | +1 résistance sur tous les S en M3 |
| M3 | Coopération ou réserves | +1 puissance sur soutiens valides en M4 | +1 Moyen à tous au début M4 |
| M4 | Combat pour les sites | +1 puissance contre S en M5 | +1 résistance sur tous les S en M5 |
| M5 | Sortie de crise | +2 Stabilité avant Prestige M5 | +1 Influence à chacun pour le Sommet |

Toutes les versions thématiques remplacent l'histoire et les titres, **jamais ces effets**.

# Annexe C — Glossaire de référence

- **Archétype :** capacité mécanique stable (Force, Commerce, Pouvoir, Diplomatie, Industrie, Renseignement).
- **Édition / univers :** couche visuelle et narrative appliquée au moteur, versionnée indépendamment.
- **Faction :** équipe représentée sur la carte et liée à un archétype.
- **Moyens :** ressource dépensée pour conquérir et Stabiliser.
- **Influence :** ressource dépensée pour acheter des voix.
- **Prestige :** score permettant de désigner le vainqueur unique.
- **Échange bilatéral :** transferts d'au moins une unité dans chaque sens, validés atomiquement.
- **Soutien décisif :** soutien qui change le résultat effectif du contrôle d'une cible éligible.
- **État serveur canonique :** seule source reconnue pour calculer les actions et les scores.
- **Projection publique :** données expurgées des secrets, destinées au grand écran.

# Annexe D — Sources et documents de référence

**Sources internes, autorité fonctionnelle :**

1. *Le Pacte — Livre de règles neutre V1.1*, 2 novembre 2026. Base canonique des mécanismes, de la carte et des cinq Conseils.
2. *Le Pacte — Kit de test humain V1.1*, 2 novembre 2026. Fiches de factions, objectifs et supports de séance.
3. *Le Pacte — Rapport de tests V1*, 2 novembre 2026. Résultats de simulations d'agents ; aucune validation humaine revendiquée.

**Documentation technique publique consultée le 2 novembre 2026 :**

- Google Firebase, *Transactions and batched writes* — https://firebase.google.com/docs/firestore/manage-data/transactions (propriétés atomiques et reprise des transactions).
- Google Firebase, *Get started with Firebase Hosting* — https://firebase.google.com/docs/hosting/quickstart (déploiement d'une web app et hébergement HTTPS).
- Google Firebase, *App Check for web apps* — https://firebase.google.com/docs/app-check/web/recaptcha-provider (attestation complémentaire, qui ne remplace pas les autorisations applicatives).

---

**Statut de ce document :** cahier des charges de développement, **V1.0**, fondé sur les règles de jeu **V1.1**. Les propositions d'interface, d'architecture et d'univers restent soumises à validation de conception et de tests. Le document autorise le développement préparatoire ; il ne constitue pas une instruction de déploiement en production.
