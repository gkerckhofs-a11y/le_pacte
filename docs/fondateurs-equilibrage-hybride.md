# Hot Spring hybride — calibration 1.2.0

Travail du 3 novembre 2026. Version candidate, à éprouver en partie humaine.

La simulation suit désormais la véritable réserve hybride (déblocages, conditions, priorités et finale), avec le moteur existant de votes, dollars, Influence et scores. Les règles et objectifs des six familles restent identiques. Les anciennes versions et les sessions déjà enregistrées conservent leurs données.

## Modifications

- D01 reprend le compromis demandé : POUR Économie +2, Développement +2, Satisfaction −2, Sécurité −1 ; CONTRE Économie −1, Satisfaction +1, Sécurité +1, Développement inchangé.
- D03 CONTRE finance une fourniture privée : Économie +1, Bien-être −1, Satisfaction −1. Le refus dispose désormais d'un bénéfice économique explicite.
- D08 : publication, Sécurité −1 (menaces entre factions) ; suspension, Sécurité +2 (réorganisation des patrouilles). Les effets précédents sur Satisfaction et Stabilité restent présents.
- D10 : adoption, Développement +1 au lieu de +2 et Sécurité +2 (coordination de la justice et des patrouilles) ; refus, Sécurité −1. Les autres effets restent présents.
- Les récits de résolution décrivent les effets modifiés.

La Sécurité intervient ainsi dans trois chapitres obligatoires. Auparavant, des parcours complets pouvaient n'offrir aucune décision portant sur cet indicateur. Chaque ambition dispose maintenant d'au moins deux chapitres obligatoires ou finaux proposant des effets différents entre POUR et CONTRE.

## Vérification indépendante des graines d'exploration

Commande : `node scripts/founders-hybrid-balance-report.mjs`.

Trois comportements artificiels × cinq graines × 120 parties = **1 800 parties par version**, soit 3 600 comparées. Aucun échec de simulation dans les deux versions. Les graines exploratoires sont distinctes de celles de cette vérification. Les fichiers JSON voisins conservent les paramètres et les résultats par comportement.

| Famille | Victoires simulées 1.1.0 | Victoires simulées 1.2.0 |
|---|---:|---:|
| A — Économie | 16,39 % | 17,50 % |
| B — Sécurité | 10,00 % | 19,78 % |
| C — Satisfaction | 14,72 % | 15,17 % |
| D — Bien-être | 19,56 % | 17,44 % |
| E — Développement | 23,00 % | 18,67 % |
| F — Stabilité basse | 16,33 % | 11,44 % |

L'écart global entre la famille la plus et la moins victorieuse passe de 13 à 8,33 points de pourcentage. Ce chiffre est descriptif : il ne prouve pas l'équité. F reste en retrait, surtout avec les agents ambitieux (8,33 %), tandis que B y atteint 23 %. Ne pas chercher à masquer cette limite par une moyenne globale.

Les agents privilégient les effets immédiats sur leur indicateur. Ils ne planifient pas les déblocages, ne modélisent pas les négociations humaines et leurs préférences ne dépendent pas des seuils d'objectif. Trois politiques ne couvrent pas toutes les stratégies. La prochaine validation utile est une partie humaine avec rotation des ambitions entre équipes, relevé des occasions d'intervenir et des décisions de passage.

## Illustrations

Inventaire : dix scènes spécifiques D11–D20 et quarante issues POUR/CONTRE manquantes, soit cinquante créations. Consignes exactes dans `content/founders-illustration-production-v1.json`. Les sources chaudes ne sont pas un décor systématique : elles doivent rester discrètes, à l'extérieur de la ville lorsqu'elles sont nécessaires. Ces cinquante scènes n'en nécessitent aucune.

Aucun déploiement Firebase n'est attesté par ce travail local.
