# Production des vues de fin de chapitre IV à VI

Les 24 illustrations représentent Hotspring depuis la fièvre de l’expansion jusqu’au choix de sa gouvernance. La sélection des 12 combinaisons chapitre et état utilise des scènes d’âge compatible. Au chapitre V, le repas de voisinage illustre la communauté organisée et l’impasse détrempée la croissance désordonnée. Ces deux compositions disposent chacune d’un seul fichier.

## Images historiques examinées

| Images existantes du projet | Sujet constaté | Usage retenu |
| --- | --- | --- |
| `headers/opening_4.webp`, `headers/opening_5.webp` | Légendes et titres imprimés dans l’illustration d’ouverture | Ouverture historique. |
| `results/d15_result_for_accorder_la_gare.webp`, `results/d16_result_for_accorder_la_grande_concession.webp` | Délégués devant la gare, puis exploitation minière au flanc de la montagne | Illustration de l’issue du vote. Les nouvelles vues du quai et du carreau minier montrent les activités après la décision. |
| `results/d17_result_for_autoriser_le_quartier_provisoire.webp`, `results/d17_result_against_planifier_le_quartier.webp` | Baraquements serrés ou implantation du quartier | Résolution du dilemme. Les vues de checkpoint reprennent le quartier habité. |
| `results/d24_result_for_sauver_main_street.webp`, `results/d24_result_against_sauver_les_quartiers.webp` | Ville en feu, habitants engagés dans la lutte contre le sinistre | Résolution du vote. La vue de checkpoint montre les maisons résidentielles après le feu. |
| `results/d29_result_against_conseil_des_fondateurs.webp`, `results/d29_result_for_conseil_elu.webp` | Scènes de salle et de conseil | Résolution du vote. Les nouvelles scènes de gouvernance relient la décision aux habitants et à leur rue. |
| `final/charter_a.webp` à `final/charter_f.webp` | Scènes propres aux six chartes | Narration de chaque charte. |

Les chemins de cet inventaire partent de `public/assets/hotspring/v1/`. La conception s’appuie sur la [bible visuelle](bible-visuelle.md) et les maquettes fournies par l’organisateur. Les repères géographiques et les infrastructures conditionnelles sont laissés hors champ dans les scènes communes aux deux emplacements de fondation.

## Provenance et format

Illustrations originales générées avec OpenAI ImageGen le 27 novembre 2026 pour *Games of Influence — Les Colons de Hotspring*. Chaque image provient d’une génération textuelle individuelle. Aucune image photographique tierce n’a été importée dans les générations. Les [prompts de production](prompts-expansion.json) permettent de reconstituer chaque requête.

Les dimensions natives indiquées ci-dessous sont celles des PNG produits. L’export ajuste de façon centrée le ratio à 16:9 et rééchantillonne chaque image à 1920 × 1080 avec Lanczos. Les WebP statiques ont été encodés en qualité 83. Les mesures de la table proviennent du décodage des fichiers livrés. Le 4K utilise la mise à l’échelle de ces fichiers.

## Contrôle des scènes livrées

| Identifiant | Éléments identifiables dans l’image | PNG source | WebP (octets) | SHA-256, 16 premiers caractères |
| --- | --- | ---: | ---: | --- |
| `c4-a` | Des habitants achètent des pommes à l’étal ; passants et chariots remplissent la rue aux façades neuves. | 1672 × 941 | 434378 | `6f0844c4f4b32a72` |
| `c4-b` | Un commerçant remet la paie devant deux gardes, revolvers au fourreau ; une passante les observe. | 1672 × 941 | 386380 | `421384193281c85b` |
| `c4-c` | Plusieurs voisins montent la traverse d’un porche ; d’autres préparent le repas du chantier. | 1672 × 941 | 544096 | `3e8bb94ed7d368d7` |
| `c4-d` | Des caisses d’emménagement encadrent une rue de baraques où adultes et enfants s’évitent dans les ornières. | 1672 × 941 | 355838 | `1dc7943de69dbcf0` |
| `c4-dispensaire` | Sur le porche du dispensaire, une soignante bande l’avant-bras d’un homme pendant que des voisins attendent. | 1672 × 941 | 486574 | `7e02c261c082f4b8` |
| `c4-expansion` | Un menuisier regarde la livraison de bois et les nouvelles façades depuis son atelier. | 1672 × 941 | 393816 | `4f83db8128f3710d` |
| `c4-jardins` | Des habitations modestes s’alignent de part et d’autre des potagers et de leurs clôtures. | 1672 × 941 | 564306 | `c43dbe93c2e34d75` |
| `c4-mine` | Des ouvriers et des mules se tiennent au pied d’un chevalement dans le carreau de la mine. | 1672 × 941 | 464348 | `c7b3dba5e1b7f10a` |
| `c4-ouvriers` | Les ménages occupent baraques et tentes de part et d’autre d’une ruelle boueuse. | 1672 × 941 | 450526 | `4508c9aa34214dc2` |
| `c4-rail` | Une locomotive à vapeur entre à quai ; des passagers attendent devant le petit dépôt. | 1672 × 941 | 371052 | `4048375fc4931084` |
| `c5-a` | Des chariots, ballots et rouleaux de tissu animent une rue bordée de galeries à deux étages. | 1672 × 941 | 504408 | `f9f3ec080cb4cc0c` |
| `c5-b` | Un commerçant vérifie son chargement sous la pluie devant des gardes au revolver rengainé. | 1672 × 941 | 397328 | `27e77d501e00f3f4` |
| `c5-entraide` | Des voisins de plusieurs générations se passent le pain à de longues tables de cour. | 1672 × 941 | 426408 | `3a59a556f62959f6` |
| `c5-incendie` | Une famille emporte une malle entre les montants noircis d’une habitation ; d’autres maisons restent debout. | 1672 × 941 | 427756 | `1c3190b03cc1f0bc` |
| `c5-precarite` | Des familles se serrent sous un porche et traversent une ruelle boueuse bordée de logements exigus. | 1672 × 941 | 425960 | `3824d2806eef77bd` |
| `c5-securite` | Une enfant et un aîné traversent parmi les passants, les charrettes et le marché. | 1672 × 941 | 479068 | `a44f11d808edac96` |
| `c5-ville` | Un chariot tourne au carrefour de façades en bois peint, vu depuis une galerie haute. | 1672 × 941 | 444864 | `cc2364c0097a09fc` |
| `c6-a` | Les véhicules chargés et les étals de fruits occupent les deux côtés d’un carrefour bordé de maisons à galerie. | 1672 × 941 | 504150 | `fea27811e97ef4bb` |
| `c6-b` | Deux porteurs de caisses baissent la tête devant des hommes bien vêtus aux revolvers dans leurs étuis. | 1672 × 941 | 304898 | `2fb9b46ef2e6ae42` |
| `c6-c` | Des voisins se passent les paniers de récolte depuis un chariot dans une cour ombragée. | 1672 × 941 | 499732 | `cf0b6524f9fd461f` |
| `c6-conseil` | Des habitants conversent sur un porche et traversent le carrefour, près d’un vieil homme qui lit. | 1672 × 941 | 422152 | `dfacbb1a2331c607` |
| `c6-d` | La foule s’entasse dans une impasse boueuse entre vieux appentis, passerelles et logements rapiécés. | 1672 × 941 | 451512 | `59b18ea0af9adf24` |
| `c6-elu` | Un homme lit les résultats sur le porche ; le voisinage s’est réuni autour de l’urne en bois. | 1672 × 941 | 319620 | `045dab72e89bbf6d` |
| `c6-fondateurs` | Autour d’un grand livre fermé, les fondateurs discutent à la lampe, la rue visible par les baies. | 1672 × 941 | 216578 | `b0e0e135a5260d4d` |
