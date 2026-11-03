# Réserve narrative hybride — prototype du 3 novembre 2026

## Ce qui est développé

Un scénario peut désormais utiliser une réserve plutôt qu’un lien direct vers
le chapitre suivant. Les scénarios et sessions sans `scenario.progression`
conservent leurs embranchements actuels. Le scénario distinct
`hot-spring-reserve-hybride` contient onze dilemmes, dont une finale, et prévoit
huit à dix Conseils par session, finale comprise. Ce prototype ne constitue pas
la bibliothèque de vingt à vingt-cinq dilemmes envisagée ; celle-ci reste à écrire.
La réécriture de contenu V2 proposée auparavant reste séparée.

Les choix ne sont plus uniquement des flèches vers un chapitre précis :

- Une issue peut débloquer plusieurs dilemmes (`unlocks`). Accepter le monopole
  débloque D02 (gardes privés) et D06 (banque). Le refuser débloque D03 (puits).
- Les événements disponibles restent dans la réserve jusqu’à être joués ou
  devenir inadmissibles. Aucun dilemme n’est joué deux fois dans une session.
- L’admissibilité peut dépendre d’une décision déjà révélée, d’une valeur de
  jauge ou du nombre de Conseils résolus. Toutes les conditions sont requises.
- La protestation D11 devient admissible après trois résolutions si la
  Satisfaction vaut au plus quatre. Elle n’apparaît pas forcément en partie.
- La régie peut choisir un chapitre parmi les admissibles. Le serveur vérifie
  ce choix ; le porte-parole ne peut pas sélectionner le prochain événement.
- En mode automatique, la priorité narrative la plus élevée passe d’abord.
  Entre candidats de même priorité, une sélection pseudoaléatoire reproductible
  dépend de l’identifiant de session et des décisions révélées. Elle ne dépend
  ni de l’heure ni du nombre de rafraîchissements. Ce n’est pas une nouvelle
  pioche aléatoire à chaque clic.

Les chapitres obligatoires déjà débloqués et non joués passent avant les
optionnels lorsque le budget l’exige. La finale ne devient admissible qu’après
le minimum prévu et après ces chapitres obligatoires. Elle peut être choisie
manuellement dès lors, ou automatiquement quand la réserve admissible s’épuise
ou que le budget maximum l’exige. Une réserve bloquée par des conditions
incompatibles renvoie un message explicite ; le moteur ne fabrique pas de
chapitre, n’ignore pas une condition et ne termine pas silencieusement la partie.

## Chroniques et finale

Chaque issue conserve sa chronique illustrée et ses valeurs avant/après. Les
chapitres sont numérotés dans l’ordre réel de la partie. Le dernier chapitre
reste en bas de la projection et tout l’historique est consultable.

Après le vote de la finale, l’action de fin calcule le classement habituel et
fige un épilogue narratif. Ses paragraphes sont des fragments rédigés dans le
scénario, sélectionnés d’après les décisions réellement prises et les jauges
finales. Aucun texte n’est généré automatiquement par IA pendant la partie.
Dans la démonstration, il rappelle le choix du rail, celui de la vallée et,
selon les valeurs finales, la Satisfaction et la Sécurité. Il ne modifie pas
les jauges ou le score.

Les réserves futures, conditions d’accès et textes d’épilogue restent côté
serveur. La liste des candidats est réservée à la régie après révélation.
La projection et les familles ne reçoivent pas cette liste. Les fragments de
fin ne sont exposés qu’une fois la partie terminée.

## Contrat JSON et Google Sheets

`scenario.progression` : `mode: "hybrid"`, `initial_dilemmas` (liste d’IDs),
`finale_id`, `min_councils`, `max_councils`, `ending_fragments` optionnels.

Chaque dilemme possède `access` : `category` (`required`, `optional`, `finale`),
`priority` (entier de 0 à 100) et `conditions` (liste, vide si aucune).
Les catégories obligatoires s’appliquent aux chapitres débloqués : un chapitre
obligatoire d’un arc jamais ouvert n’est pas imposé à la partie.
Chaque issue peut ajouter une liste `unlocks`. `next_id` est conservé dans le
format pour compatibilité mais ignoré en mode hybride ; utiliser `null`/`FIN`.

Conditions admises (sans code, formule ou `eval`) :

```json
[
  {"type":"decision","dilemma_id":"D01","winner":"pour"},
  {"type":"indicator","indicator":"satisfaction","operator":"lte","value":4},
  {"type":"resolved","minimum":3}
]
```

Opérateurs de jauge : `lte`, `gte`, `eq`. Les seuils valent 0 à 10. Les
références, types, listes, tailles et propriétés inconnues sont contrôlés.
Les conditions impossibles dans un scénario arbitraire ne sont pas prouvées
absentes par le validateur statique ; un blocage est signalé en régie et doit
être corrigé dans une nouvelle version du scénario.

Dans `Parametres`, ajouter les clés suivantes :

| Clé | Exemple |
| --- | --- |
| `mode_progression` | `hybride` (`direct` ou absent pour l’ancien mode) |
| `reserve_initiale` | `D01;D04;D05;D08;D09;D11` |
| `finale_id` | `D10` |
| `min_conseils` | `8` |
| `max_conseils` | `10` |
| `epilogue_fragments` | Tableau JSON de `{text, conditions}` ; facultatif |

Après les colonnes historiques et les six colonnes de chroniques, `Dilemmes`
peut ajouter les colonnes W–AA :

| Colonne | Valeur |
| --- | --- |
| `categorie_narrative` | `obligatoire`, `optionnel`, `finale` (anglais accepté) |
| `priorite_narrative` | Entier 0–100 ; défaut 50 |
| `conditions_acces` | Tableau JSON de conditions ; vide = aucune condition |
| `debloque_pour` | IDs séparés par `;` |
| `debloque_contre` | IDs séparés par `;` |

Les en-têtes sont repérés par leur nom, sans imposer cet ordre. L’import lit
jusqu’à AA. Les onglets `Effets` et `Branches` sont conservés ; inscrire `FIN`
dans `suivant_id` pour les issues du scénario hybride. Aucun Google Sheets
utilisateur n’a été modifié par cette tranche.

## Vérifications et limites

Les tests exécutent 120 sessions avec décisions artificielles : 82 ordres de
chapitres différents, de huit à dix Conseils, tous terminés. Chaque chapitre
obligatoire du prototype est joué ; aucun doublon ni finale prématurée. Un
contrôle distinct sur seize sessions qui choisissent toutes POUR confirme que
l’ordre peut aussi varier à décisions identiques. Ce sont des contrôles du
moteur, pas des probabilités de parcours ou une preuve d’intérêt humain.

Autres vérifications ciblées : confidentialité, choix manuel inadmissible,
rechargement JSON, conditions invalides, budget et blocage contrôlé, compatibilité
avec les scénarios directs, aller-retour Google Sheets, endpoints et construction
Firebase. Les anciens outils d’analyse de branches et de simulation de politiques
refusent explicitement le mode hybride pour ne pas fournir de chiffres trompeurs.
Ils restent utilisables pour les anciens scénarios. L’équilibrage des familles,
la durée de 150 minutes, la lisibilité réelle et l’intérêt humain restent à tester.

Le prototype reprend les illustrations existantes ; D11 réutilise l’illustration
de débat à l’imprimerie. Aucune image de catastrophe, aucun aléa de prévention et
aucun texte inédit d’image ne sont introduits. Aucune partie existante ni aucun
déploiement Firebase n’est modifié par cette tranche.

Reproduction : `node --test test/founders-progression.test.mjs`.
