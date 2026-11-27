# Les sept tableaux d’épilogue de Hotspring

Ces vues montrent des trajectoires de ville arrivée à maturité. La sélection dépend de la partie jouée. Une finale anticipée reprend un tableau du stade atteint. Une ville mature dont l’état ne correspond à aucun des sept profils garde le tableau de repli du dernier chapitre. La proclamation du vainqueur vient ensuite sur son propre écran.

## Plans et contrôle éditorial

| Fichier dans `public/assets/hotspring/v1/cinema/` | Profil | Ce qu’on voit à la projection |
| --- | --- | --- |
| `fin-equilibre.webp` | Ville florissante et équilibrée | Depuis une fenêtre, on aperçoit des familles discutant et un artisan au travail au coude de Main Street. La vie quotidienne est le sujet du plan. |
| `fin-industrie.webp` | Puissance industrielle, scierie intensive votée | Des ouvriers chargent du bois devant la scierie fumante, au bord de la rivière trouble encombrée de grumes. La rive se trouve sur le site d’exploitation. Quelques toits restent visibles derrière. |
| `fin-commerce.webp` | Ville commerçante | Dans une rue marchande animée, un chariot décharge des sacs pendant que des clients examinent des étoffes. Le transport des marchandises se fait par attelage. |
| `fin-ressources.webp` | Communauté préservant ses ressources | Entre les maisons habitées, des habitants récoltent des légumes dans des jardins ombragés. Les arbres, les légumes et les sols cultivés occupent le premier plan. |
| `fin-tensions.webp` | Ville prospère sous tension | Au crépuscule, des marchands rentrent leurs caisses tandis que deux groupes se font face de part et d’autre de la rue. Marchandises et gestes de repli racontent simultanément la prospérité et l’insécurité. |
| `fin-declin.webp` | Ville en déclin | Sous un ciel gris, une famille charge une charrette devant une longue rangée de boutiques aux volets clos. Les maisons et quelques habitants subsistent. |
| `fin-civique.webp` | Ville sûre, dense et solidaire ayant financé un service | Dans une rue habitée, une femme sert un bol chaud à une voisine tandis que deux habitants réparent un perron. Les maisons modestes rendent visible la densité du quartier. |

Le septième plan, civique, distingue un parcours de services publics à forte population d’une trajectoire axée sur la préservation des ressources.

Le relief reste indéterminé depuis les six scènes de rue et de jardins. Le plan de la scierie cadre son quai sur la rivière et requiert `SCIERIE_INTENSIVE`. La relecture des sept scènes a porté sur les sujets, les équipements identifiables, la compatibilité des deux sites de fondation et la présence éventuelle d’un sinistre particulier. Le test du cadrage et de la lisibilité des éléments de l’écran figure dans la recette de projection du projet.

## Audit des images antérieures

Les sept images de `public/assets/hotspring/v1/final/` ont été examinées. `opening_final.webp` introduit l’étape finale et les six `charter_*.webp` illustrent les chartes. Les sept nouvelles trajectoires correspondent aux jauges et aux choix de la partie, indépendamment de la charte gagnante. Les anciennes illustrations restent disponibles pour leur usage narratif d’origine. La géographie et la gamme des bois, tissus et terres proviennent de la [bible visuelle](bible-visuelle.md).

## Origine et fichiers de production

Sept scènes originales générées avec OpenAI ImageGen le 27 novembre 2026 pour *Games of Influence — Les Colons de Hotspring*. Chaque génération utilise une description textuelle propre et les mêmes consignes de continuité. Aucun fichier photographique ou illustré de tiers n’a été importé dans les générations. Le lot ne revendique aucune licence documentaire ou d’archives tierce. Les [prompts de production](prompts-epilogue.json) contiennent les consignes exactes, en anglais, avec la convention d’assemblage qui permet de reconstituer chaque requête.

Les originaux délivrés par le générateur sont sept PNG RVB de **1 672 × 941**. Chaque image a été ajustée de manière centrée au ratio 16:9 puis rééchantillonnée avec Lanczos en **1 920 × 1 080**. Les images projetées sont des fichiers WebP statiques. Le format 4K à l’écran repose sur la mise à l’échelle. Le contrôle automatisé a ouvert et décodé les sept fichiers exportés, puis vérifié pour chacun le format et les deux dimensions.

| Identifiant | WebP en octets | Qualité WebP | SHA-256, 16 premiers caractères |
| --- | ---: | ---: | --- |
| `fin-equilibre` | 408 806 | 78 | `da5f468e505f4344` |
| `fin-industrie` | 421 568 | 76 | `47bfff23f15ec001` |
| `fin-commerce` | 429 418 | 82 | `716ac2ada58710ad` |
| `fin-ressources` | 428 590 | 76 | `31a0c3a1daab45cf` |
| `fin-tensions` | 285 422 | 82 | `77f2c5a6e25cdccb` |
| `fin-declin` | 396 964 | 82 | `a2f485de5f5c172f` |
| `fin-civique` | 418 912 | 78 | `38757b5c9dbfbdee` |

Les sept fichiers totalisent 2 789 680 octets. Un épilogue affiche une seule de ces images. Chaque scène du tableau est livrée et prête pour la revue artistique de l’organisateur dans la PR.
