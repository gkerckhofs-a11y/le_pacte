# Hotspring V1.1 · simulation du recalibrage

Reproduire avec Node 24 et `node scripts/simulate-hotspring-v1-1.mjs 120`. La simulation exécute les commandes du moteur, résout les votes, sélectionne les crises et qualifie une charte disponible. Les cinq parcours scénarisés ci-dessous sont complétés par 120 parcours issus d’un tirage à graine fixe (1213419602). Dans ces 120 parties, chaque fiche reçoit à l’avance un choix POUR ou CONTRE à probabilité égale et la charte visée est choisie parmi les chartes disponibles.

Ces fréquences décrivent ce tirage technique. Le vote humain, les promesses d’argent et les coalitions peuvent produire d’autres distributions. Les bornes sont des valeurs effectivement atteintes par au moins une partie simulée. La recherche des bornes de Stabilité sur l’ensemble des branches possibles reste ouverte.

## Cinq parcours canoniques

| Parcours | Charte | Économie | Écologie | Sécurité | Bien-être | Démographie | Stabilité | Trajectoire ciblée |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Commerce | A · Entreprise | 8 | 0 | 10 | 0 | 8 | 5,2 | Mercer, +2 |
| Civique | B · Civique | 2 | 6 | 9 | 10 | 10 | 7,4 | Doyle, +2 |
| Institutions | D · Ville moderne | 1 | 8 | 10 | 10 | 10 | 7,8 | Vance, +2 |
| Autonomie locale | C · Frontière libre | 6 | 6 | 3 | 2 | 6 | 4,6 | Caldwell, +2 |
| Vallée | E · Pacte de la vallée | 0 | 10 | 10 | 10 | 3 | 6,6 | Whitmore, +2 |

Le parcours d’autonomie locale inclut désormais la scierie, l’école et le médecin. Combinés au financement par la banque locale, ces choix soutiennent l’installation permanente. Le parcours gagne avec la charte de la Frontière libre. Dans les mêmes simulations, chaque famille a également au moins un parcours qui lui rapporte 0 en trajectoire.

## 120 parcours techniques reproductibles

| Indicateur | Min.–max. rencontrés | Min.–max. à la fin | Moyenne finale | Au-dessus de 5 | Sous 5 | À 5 | Réussite de trajectoire |
|---|---:|---:|---:|---:|---:|---:|---:|
| Économie | 0–10 | 0–10 | 5,53 | 63 | 39 | 18 | 52,5 % |
| Écologie | 0–10 | 0–10 | 4,13 | 37 | 74 | 9 | 30,8 % |
| Sécurité | 0–10 | 0–10 | 6,20 | 71 | 40 | 9 | 59,2 % |
| Bien-être | 0–10 | 0–10 | 4,77 | 54 | 57 | 9 | 45,0 % |
| Démographie | 0–10 | 0–10 | 7,13 | 91 | 14 | 15 | 75,8 % |
| Stabilité | 3,0–9,4 | 3,0–8,0 | 5,55 | 78 | 37 | 5 | Sans objectif |

Le moteur attribue +2 lorsque l’indicateur final dépasse le départ à 5. La fréquence vaut donc le nombre de finales au-dessus de 5 divisé par 120. Les cinq trajectoires réussissent dans 30,8 % à 75,8 % des tirages. La Démographie reste l’indicateur le plus souvent favorable, l’Écologie le plus difficile à faire progresser dans ce tirage.

| Effets de base sur les décisions | Positifs | Négatifs | Neutres |
|---|---:|---:|---:|
| Économie | 32 | 33 | 3 |
| Écologie | 14 | 12 | 42 |
| Sécurité | 17 | 14 | 37 |
| Bien-être | 20 | 26 | 22 |
| Démographie | 14 | 12 | 42 |

Ce comptage porte sur 62 résultats fixes et six chartes. D30 sélectionne une charte et ses effets sont comptés une seule fois. Les variantes de contexte et le plafonnement sont intégrés aux 120 parcours, avec leurs effets détaillés dans la [matrice d’audit](matrice-indicateurs-v1.1.md).

## Arbitrages éditoriaux

- D01, D04, D15 et D16 distinguent l’arrivée de passage, les logements disponibles et l’installation durable. Dans le même tirage, la Démographie est passée de 111 à 91 finales au-dessus de 5 après ces révisions.
- D03, D07, D20, D23 et D29 distinguent la qualité des services et des conditions de vie de la croissance de la population. Le maintien des services au bilan du chapitre V ajoute un point de Bien-être.
- Les crises distinguent dommages humains, départs durables et capacité de secours. D26A limite la perte de Démographie à trois points. D26B reporte le bénéfice du partage de l’eau sur le Bien-être.
- L’indice d’autonomie garde son rôle d’information pour la régie et reste dans le score V1.0. En V1.1, Caldwell marque sa trajectoire sur la Démographie. Les 25 objectifs de chapitre, les gouvernements hérités et le classement des fortunes sur 3, 2, 1, 0, 0 sont conservés.

## À vérifier en salle

- La marge de décision de Caldwell et Whitmore sur plusieurs groupes, en suivant notamment D01, D04 et D15–D17. La diversité des parcours dépendra des choix et alliances réellement joués.
- La compréhension des effets différés et des coûts en Bien-être autour de l’incendie, de la fièvre, des deux crises d’eau et de la banque, avec au moins deux configurations d’équipement.
- La lisibilité et le rythme des révélations sur le vidéoprojecteur de la salle, en particulier pendant l’affichage des valeurs avant/après. Vérifier la compréhension de la part d’Influence estimée par les joueurs.

Captures d’une partie locale de démonstration avec lecture, vote, révélation et plafonnement vérifiés par HTTP. [Projection 1080p](captures/v11-projection.jpg) · [Panneau des indicateurs en Régie](captures/v11-regie.jpg) · [Panneau des indicateurs au Terminal Doyle](captures/v11-terminal.jpg).
