# Hotspring V1.2 · Rapport de simulation et de recette

## Trajectoires relatives

Le deuxième rang fixe le seuil. Toutes les jauges à ce niveau ou au-dessus obtiennent les deux points. Si deux jauges ou davantage occupent déjà la tête, elles occupent les deux premières places. À 8/8/8/5/4 seules les trois jauges à 8 réussissent. À 8/7/7/5/4 les deux jauges à 7 partagent le deuxième rang. À 5/5/5/5/5 les cinq réussissent.

Les parties V1.0 et V1.1 gardent leur barème et leur chronomètre. Le catalogue utilise la V1.2 par défaut pour une nouvelle session Hotspring. La V1.2 démarre avec cinq jauges à 5, conserve les effets de la V1.1 et calcule la Stabilité après plafonnement. [Matrice des 64 résultats et des six chartes](matrice-indicateurs-v1.2.md).

## Simulation reproductible

Exécuter `node scripts/simulate-hotspring-v1-1.mjs 120 1.2.0` avec Node 24. Les cinq parcours canoniques emploient les mêmes choix que le rapport précédent. Puis 120 campagnes sont générées avec la graine 1213419602. Chaque fiche reçoit un vote POUR ou CONTRE avec une probabilité de moitié. La charte visée est tirée parmi les chartes éligibles. Les négociations et transferts sont couverts par les tests fonctionnels. Le tirage ne modélise pas les coalitions, les offres ou le comportement des joueurs.

| Parcours | Charte | Économie | Écologie | Sécurité | Bien-être | Démographie | Stabilité | Familles à +2 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Commerce | A | 8 | 0 | 10 | 0 | 8 | 5,2 | Mercer, Vance, Caldwell |
| Civique | B | 2 | 6 | 9 | 10 | 10 | 7,4 | Doyle, Caldwell |
| Institutions | D | 1 | 8 | 10 | 10 | 10 | 7,8 | Vance, Doyle, Caldwell |
| Autonomie locale | C | 6 | 6 | 3 | 2 | 6 | 4,6 | Mercer, Whitmore, Caldwell |
| Vallée | E | 0 | 10 | 10 | 10 | 3 | 6,6 | Whitmore, Vance, Doyle |

| Jauge | Famille | Valeur finale moyenne | Au-dessus de 5 | À 5 | Sous 5 | +2 en V1.2 · sur 120 | +2 en V1.1 · sur 120 |
|---|---|---:|---:|---:|---:|---:|---:|
| Économie | Mercer | 5,53 | 63 | 18 | 39 | 51 (42,5 %) | 63 (52,5 %) |
| Écologie | Whitmore | 4,13 | 37 | 9 | 74 | 29 (24,2 %) | 37 (30,8 %) |
| Sécurité | Vance | 6,20 | 71 | 9 | 40 | 61 (50,8 %) | 71 (59,2 %) |
| Bien-être | Doyle | 4,77 | 54 | 9 | 57 | 43 (35,8 %) | 54 (45,0 %) |
| Démographie | Caldwell | 7,13 | 91 | 15 | 14 | 81 (67,5 %) | 91 (75,8 %) |
| Stabilité | — | 5,55 | 78 | 5 | 37 | — | — |

Les cinq jauges fondamentales atteignent chacune 0 et 10 dans l’échantillon. La Stabilité va de 3,0 à 9,4 pendant la campagne et de 3,0 à 8,0 en fin de partie. Sur 120 finales, 98 qualifient deux familles, 19 en qualifient trois et 3 en qualifient quatre. Les cinq familles peuvent obtenir les points en cas d’égalité complète. Caldwell obtient le bonus le plus souvent dans ce tirage. Whitmore l’obtient le moins souvent.

## Vérifications

- Test du classement relatif aux frontières d’égalité, du calcul des fortunes et du total maximal de 18 points.
- Tableau public actualisé pendant le vote et la restitution de l’Influence. La part est arrondie à l’entier inférieur et le reliquat reste en réserve. La revendication du rôle de Shérif ne compte pas dans le partage.
- Ouverture manuelle en régie, aucun passage automatique à l’expiration du temps et reprise d’une négociation avec l’engagement conservé.
- Accords POUR ou CONTRE validés côté serveur, cumul des engagements compatibles, rejet des engagements contradictoires et des votes non conformes. Les fonds restent disponibles à l’émission et sont vérifiés à nouveau à l’acceptation. L’interface propose une mise minimale de 1 pour les nouvelles offres. Le serveur et le menu de vote prennent aussi en charge un minimum supérieur porté par un accord.
- Vérification en navigateur de la Projection à 1280 × 720, 1920 × 1080 et 3840 × 2160, des règles sur terminal mobile et de la concordance du texte des règles avec le verso. Cinq terminaux vérifiés et cinq paires recto verso A4.

## À valider au prochain essai humain

- Compréhension du classement avec une égalité au premier rang ou à la deuxième place. Observer l’impact sur les choix de Caldwell et Whitmore.
- Compréhension du bouton « Accepter et s’engager », surtout lorsqu’une famille reçoit plusieurs propositions ou qu’un donneur dépense ses dollars avant l’acceptation.
- Rythme d’une négociation menée par le MJ, fenêtre de lecture de la part versée et lisibilité de la Stabilité sur le vidéoprojecteur de la salle.
- Impression réelle sur le bord long et scan des QR de jeu sur les téléphones utilisés en salle.

[Projection](captures/v12-projection.jpg) · [Terminal](captures/v12-terminal.jpg) · [Proposition reçue](captures/v12-terminal-accord.jpg) · [Régie](captures/v12-regie.jpg) · [Fiche recto verso – spécimen](fiche-qr-v1.2-specimen.pdf). Le QR du spécimen pointe vers un domaine fictif. La régie génère les QR valides pour chaque partie.
