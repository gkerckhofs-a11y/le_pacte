# Production du prologue et des trois premiers chapitres

## Images livrées

Le prologue reprend le plan d’arrivée existant. Les 23 vues de fin de chapitre sont des peintures entièrement nouvelles produites pour cette refonte avec OpenAI ImageGen. Chaque image part d’un prompt individuel et fournit un décor, ses habitants et leur activité dans une seule composition opaque. Le dossier `public/assets/hotspring/v1/cinema/` contient les fichiers prêts pour la projection. Le manifeste `content/hotspring-cinema-v1.json` porte la logique de sélection.

Les 12 profils A–D couvrent chacun les trois périodes. Les 11 autres vues permettent de montrer un site, un bâtiment adopté ou un aspect particulier du chapitre. Les études de référence existantes et les maquettes de l’organisateur ont orienté la géographie et l’éclairage. Ces dernières n’ont pas été incorporées aux images.

## Provenance et format

- Les prompts exacts des 23 créations et la consigne historique du prologue figurent dans `prompts-debuts.json`. La provenance de la peinture d’ouverture est enregistrée dans `../manifeste-entetes.json`, entrée `opening_1`, attribuée à OpenAI ImageGen pour Games of Influence. Ce manifeste ne précise pas de licence de redistribution.
- Les nouveaux originaux mesurent 1 672 × 941 pixels. L’export WebP RGB opaque est de **1 920 × 1 080**, avec agrandissement Lanczos uniforme et ajustement vertical de moins d’un pixel par bord au 16:9. L’original du prologue mesure 1 440 × 810. La version projetée n’est donc pas une capture native 1080p ou 4K.
- Le lot pèse **10.48 Mio**. Les mises en situation illustrées ne constituent pas une reconstitution documentaire d’une communauté réelle. Le jeu et les images sont des créations pour la campagne.

## Audit des plans

Le contrôle des planches a été effectué par chapitre, en vérifiant site de fondation, taille de la ville, activité, bâtiments conditionnels et lisibilité des personnages. Les plans communs s’appuient sur une rue, une cour ou des abris qui laissent hors champ le choix rive ou terrasse. Les vues de la scierie et du corridor montrent la vallée sans localiser les maisons de Hotspring. Les deux camps spécialisés montrent explicitement le site voté. Aucun bâtiment institutionnel conditionnel n’est identifiable dans les douze profils A–D.

| Identifiant | Ce que montre réellement la scène | Octets WebP |
| --- | --- | ---: |
| `prologue` | Des chariots bâchés descendent la piste vers une vallée où serpente une rivière. | 316054 |
| `c1-foyers` | Des familles montent la charpente de leur première maison entre des tentes et un chariot bâché. | 361842 |
| `c1-plaine` | Les premières maisons et les tentes se serrent sur la plaine près de la rivière, au pied de la terrasse encore vide. | 472816 |
| `c1-terrasse` | Sur la terrasse en surplomb, une famille tend un cordeau devant la première charpente. La rivière coule loin en contrebas. | 392388 |
| `c2-rue` | Une charrette emprunte la première rue, entre deux rangées de maisons de bois dont un auvent en chantier. | 382774 |
| `c2-ecole` | Des enfants montent vers la porte ouverte de la petite école en bois, auprès de leurs parents. | 455082 |
| `c2-scie` | Au bord de l’eau, une rampe relie la scierie aux grumes, sous la cheminée de la machine à vapeur. | 498248 |
| `c2-marche` | Un marchand a ouvert son chariot de toile au milieu des maisons. Les familles viennent acheter les produits déballés. | 470312 |
| `c3-pistes` | Des chevaux chargés s’arrêtent entre les boutiques et la charrette d’un artisan qui répare une roue. | 526222 |
| `c3-comptoir` | Sous la galerie du comptoir commun, des marchands examinent les étoffes et pèsent des marchandises près de la rue. | 411158 |
| `c3-corridor` | Des voyageurs et leurs bêtes de somme empruntent un chemin libre le long de la rivière, tandis que des habitants l’entretiennent. | 545880 |
| `c3-tensions` | Devant un chariot qui barre une partie de la rue, deux hommes se disputent et des habitants gardent leurs enfants près d’eux. | 437280 |
| `c1-a` | Un rouleau d’étoffe change de mains parmi les caisses et les sacs déballés. Des tentes et des chariots occupent ce premier camp. | 484484 |
| `c1-b` | Les marchandises s’entassent près du convoi. Une garde armée surveille les réserves, à distance des ouvriers. | 436658 |
| `c1-c` | Dans le camp, des voisins partagent les provisions sur un tréteau pendant que d’autres montent un abri. | 520828 |
| `c1-d` | Une charrette s’enfonce dans la boue entre des tentes et un abri serrés les uns contre les autres. | 361152 |
| `c2-a` | Les clients examinent une étoffe pendant que les porteurs déchargent les caisses devant les boutiques de la jeune rue. | 521642 |
| `c2-b` | Des hommes armés surveillent un chargement de valeur devant une boutique, tandis que les ouvriers attendent à distance. | 426036 |
| `c2-c` | Des voisins posent un trottoir en planches et aident une personne âgée à passer. Un enfant et une femme apportent des provisions. | 514570 |
| `c2-d` | Des charrettes peinent à se croiser dans un passage boueux, encombré d’habitants et de baraques de bois. | 449140 |
| `c3-a` | Autour des chariots de fruits et légumes, les passants vont et viennent devant de longues rangées de commerces en bois. | 507106 |
| `c3-b` | Un marchand et son escorte armée traversent une artère commerçante bien fournie. Des habitants se tiennent en file le long des bâtiments. | 445896 |
| `c3-c` | Entre des maisons entretenues, les voisins et les voyageurs s’entraident pour décharger les provisions et réparer une charrette. | 534082 |
| `c3-d` | Des habitants et des chariots s’entassent dans une rue boueuse, entre les maisons et des abris improvisés. | 515038 |
