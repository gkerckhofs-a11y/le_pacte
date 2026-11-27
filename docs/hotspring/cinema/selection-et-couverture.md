# Comment Hotspring choisit ses tableaux

Le moteur choisit une illustration à la fin de chacun des six chapitres. L’épilogue d’une partie complète a sa propre bibliothèque. Un arrêt anticipé reprend les vues du dernier chapitre où une décision a effectivement été résolue. Tant que les familles n’ont choisi ni la terrasse ni les terres basses, le convoi est encore dans le prologue.

## Ce qui peut apparaître

Le [manifeste](../../../content/hotspring-cinema-v1.json) décrit le stade autorisé, le site visible, les constructions représentées, les décisions obligatoires ou incompatibles et le profil des jauges pour chaque entrée. Les cinq valeurs de référence, comme les bornes, sont exprimées sur 10. Les décisions du scénario déterminent les possibilités suivantes.

| Élément reconnaissable | Fait vérifié dans la partie |
| --- | --- |
| Site bas ou en terrasse | Le résultat du vote fondateur doit désigner ce site. Les cadrages sans site identifiable conviennent aux deux implantations. |
| École, dispensaire, scierie, comptoir | Le Conseil a approuvé l’équipement représenté. |
| Couloir de la rivière | L’accord a été conclu et reste en vigueur. |
| Gare, grande mine | Seule l’infrastructure votée peut entrer dans le cadre. |
| Logements provisoires, quartier planifié | La décision concernant le quartier correspond au bâti représenté. |
| Quartier incendié | L’incendie D24 a été vécu et les habitations ont brûlé. Un incendie contenu ou un feu limité aux commerces produit un autre tableau. |
| Gouvernement élu, Conseil des Fondateurs | La décision de gouvernement a été prise. |
| Charte | Le vote final a été résolu. La qualification ou le soutien à une charte ne suffit pas. |

Chaque stade possède un cadrage de secours sans équipement conditionnel identifiable. Pour l’épilogue d’une ville mature, le secours réemploie le tableau neutre du chapitre VI. Les vues de la ville mature restent réservées aux parties qui ont atteint ce stade.

## Les quatre ambiances

Les valeurs ci-dessous sont des préférences artistiques du sélecteur. Elles n’interviennent ni dans le calcul des jauges ni dans le score d’une famille.

| Ambiance | Économie | Écologie | Sécurité | Bien-être | Démographie | Exemples de décisions prises en compte |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| A · Expansion prospère | 9 | 5 | 7 | 6 | 7 | Lots privés, scierie, banque, rail |
| B · Prospère mais brutale | 8 | 4 | 2 | 4 | 6 | Eau privée, grand saloon, posse, dettes ouvrières |
| C · Organisée et harmonieuse | 5 | 8 | 8 | 8 | 5 | Eau communale, école, dispensaire, protection incendie, assainissement |
| D · Désordonnée | 4 | 3 | 4 | 2 | 9 | Bâti serré, logement provisoire, absence de médecin, rejets libres |

Aux chapitres I à VI, le catalogue comprend les quatre ambiances pour chacun des six âges de la ville. Chaque version A à D est cadrée sans équipement optionnel identifiable. Une variante plus précise permet de montrer un équipement adopté dans un contexte compatible. Les vues d’entraide et de précarité du chapitre V servent également aux ambiances C et D de ce chapitre.

Le [sélecteur](../../../src/hotspring-cinema.ts) applique les étapes suivantes.

1. Il retient le stade atteint. Il compare les ambiances aux cinq jauges effectivement mesurées. A et B nécessitent au moins 5 en Économie, B au plus 5 en Sécurité. C nécessite au moins 5 en Écologie et en Sécurité.
2. Sa distance est la moyenne des carrés des écarts aux jauges de référence. Elle augmente de 0,2 fois le carré de l’écart de Stabilité. Une décision propre à une ambiance rapproche celle-ci de 0,4 unité, pour trois décisions au plus.
3. Il élimine les vues dont un marqueur requis manque, dont une incompatibilité est présente ou dont une jauge se trouve hors des bornes du tableau. Une crise représentée doit figurer dans l’historique des crises. L’ambiance retenue restreint les variantes du chapitre. Les sept tableaux spécialisés de l’épilogue disposent de leurs propres conditions.
4. Parmi les vues admissibles, il minimise la distance aux jauges de la ville. La présence d’une décision ou d’une crise précisément illustrée favorise la vue de 0,6 unité. Une charte effectivement adoptée peut départager des tableaux proches de 0,12 unité. L’identifiant départage les égalités restantes. Si aucune vue spécialisée ne convient, le cadre de secours conserve le bon stade.
5. Le checkpoint et l’épilogue conservent l’identifiant du tableau. Le checkpoint enregistre aussi les jauges, les marqueurs et les crises. Sa relecture utilise l’instantané, y compris si l’organisateur corrige ultérieurement une jauge. Les anciennes archives sans identifiant sont recalculées à partir de leur instantané. Le moteur respecte les quatre jauges réellement mesurées dans la version 1.0.

Les indicateurs détaillés empêchent une bonne moyenne de masquer une faiblesse majeure. Par exemple, la ville où l’Économie vaut 9 et la Sécurité 2 ne reçoit pas la même finale qu’une ville où elles valent 3 et 7, même si leur Stabilité est identique. Une ville peu peuplée et en déclin reçoit une vue neutre de son chapitre lorsque les figurants d’une vue d’ambiance seraient trop nombreux.

## Simulation et confidentialité

Les [cinq parcours de la régie](../../../content/hotspring-cinema-simulations-v1.json) sont les états publics de cinq campagnes V1.2 jouées du premier vote à la charte. La régie réévalue leurs images avec le même sélecteur que la projection. Chaque simulation reste indépendante de la partie de l’organisateur.

La projection reçoit l’image sélectionnée, le secours, les jauges, leur variation, les décisions résolues, le gouvernement et la charte lorsqu’ils ont été choisis. Le bilan collectif précède la révélation du classement et des objectifs. Les motifs de sélection, les profils non retenus et les simulations appartiennent à la régie.

La fondation date de 1872. L’introduction du dernier chapitre situe explicitement ce Conseil vingt et un ans après l’arrivée des convois, en 1893. Pour les chapitres intermédiaires, le serveur laisse l’année courante indéterminée. Le texte de référence est conservé dans le [scénario](../../../content/founders-hotspring-v1.json).

## Reproduire les vérifications

```sh
node --test test/hotspring-cinema-selection.test.mjs test/hotspring-cinema-routes.test.mjs
```

Le test du sélecteur vérifie les contraintes même lorsqu’on lui présente explicitement un identifiant incompatible. Il compare aussi les instantanés de démonstration aux cinq campagnes jouées avec le moteur de vote. Pour les recalculer après une modification volontaire des trajectoires, exécuter `node scripts/record-hotspring-cinema-simulations.mjs`.
