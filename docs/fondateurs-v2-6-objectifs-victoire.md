# Le Pacte des Fondateurs — V2.6 : objectifs secrets et victoire finale

Date : 3 novembre 2026. **Barème de prototype, non validé humainement.** Cette tranche ne remplace pas la V1 territoriale et ne modifie pas les règles du Conseil V2.2.

## Problème identifié lors de la simulation

Les 10 dilemmes Western comportent des bifurcations mais un parcours complet en joue 8. L'exploration exhaustive à deux issues par vote produit **256 fins narratives** pour les données actuelles. Ce sont des dénombrements combinatoires, **pas des probabilités de comportement humain**.

Avec une cible uniforme de 7/10, les cinq ressources n'ont pas la même accessibilité :

| Indicateur | Fins à 7 ou plus |
| --- | ---: |
| Économie | 84/256 |
| Sécurité | 64/256 |
| Satisfaction | 32/256 |
| Bien-être | 100/256 |
| Développement | 176/256 |

La Stabilité part à 5 et reste entre 2 et 5 dans cette version de l'histoire ; elle ne peut pas être évaluée par un seuil identique à celui des cinq ressources.

## Barème proposé (V2.6 : test)

- **Objectif secret** : palier 1 = 3 points ; palier 2, plus exigeant = 5 points supplémentaires (**8 maximum**). Pour chaque famille, la régie choisit la ressource, son sens (augmenter ou diminuer), les deux seuils, le titre et le texte de contexte.
- **Fortune familiale** : 1 point dès 10 $, 2 dès 13 $, 3 dès 16 $ (3 maximum).
- **Participation au Conseil** : 1 point par **deux votes gagnants** où la famille a engagé au moins 1 Influence, dans la limite de 3 points.
- **Influence restante** : 1 point dès 6 points, 2 dès 10 points (2 maximum).
- **Plafond théorique** : **16 points** par famille.
- **Un seul vainqueur** : le classement départage les ex æquo par (1) score total, (2) points d'objectif secret, (3) nombre de votes gagnants, (4) dollars, (5) Influence disponible, (6) ordre de priorité **tiré aléatoirement au lancement**. Cet ordre doit être expliqué aux participants avant la partie.
- Le score n'augmente pas avec le nombre de joueurs par famille. Une famille garde un seul pouvoir de vote et un seul objectif.

Tous les coefficients ci-dessus sont éditables dans le formulaire de création, à l'exception des points de rang des paliers de dollars (1/2/3) et d'Influence (1/2), figés pour ce premier prototype.

## Objectifs secrets préconfigurés (modifiables)

| Famille | Orientation | Palier 1 | Palier 2 | Fins à chaque palier |
| --- | --- | ---: | ---: | --- |
| A | Économie haute | ≥6 | ≥8 | 108 / 56 |
| B | Sécurité haute | ≥5 | ≥7 | 192 / 64 |
| C | Satisfaction haute | ≥4 | ≥6 | 140 / 56 |
| D | Bien-être haut | ≥6 | ≥8 | 140 / 68 |
| E | Développement haut | ≥8 | ≥10 | 128 / 48 |
| F | Stabilité basse | ≤4 | ≤3 | 144 / 64 |

**Avertissement d'équilibrage** : ces fréquences diffèrent. L'objectif B est notablement plus accessible au premier palier que l'objectif A. Le thème de la famille F (résistance à la centralisation) crée volontairement une tension avec la prospérité collective ; il s'agit d'une **option narrative de test**, pas d'une décision scénaristique définitive. L'app ne doit pas prétendre calculer une victoire humainement équitable à partir de ces seuls parcours.

## Fonctionnement de l'application

1. Dans la configuration de partie, importer/choisir le scénario et la skin.
2. Après la prévisualisation, éditer les six ambitions secrètes, leurs ressources, les seuils, les textes et le barème.
3. Cliquer **Analyser les objectifs du scénario** pour dénombrer les fins où chaque palier serait atteint (maximum de 4 096 parcours, cycles signalés).
4. Créer la session : le scénario, les objectifs, le barème et le tirage final sont figés. Les utilisateurs ne peuvent pas modifier ces réglages en cours de partie.
5. Pendant la partie, le porte-parole voit **son seul objectif**, ses deux paliers et une estimation des points d'objectif d'après les jauges courantes. L'écran public n'affiche aucun objectif secret.
6. Après la dernière révélation et l'action finale de la régie, le score est calculé **une seule fois**, enregistré dans la session et publié au classement final, y compris les objectifs jusque-là secrets.
7. Les interfaces public, porte-parole et régie affichent la même famille gagnante et le détail des scores.

## Implémentation

- `src/founders-scoring.ts` : presets, validation, évaluation, classement, exploration des branches.
- `src/founders-live.ts` : archivage du classement au moment de FINISHED, projections confidentielles en cours de partie, résultats publics seulement après FINISHED.
- `server/founders-catalog.ts` et `server/http.ts` : presets côté régie et endpoint authentifié `POST /api/founders/scoring/analyze`.
- `public/founders-setup.html/js` : calibrage des six objectifs et barème ; bouton d'analyse.
- `public/founders-city.html/js`, `public/founders-family.html/js`, `public/founders-regie.html/js` : progression familiale et écran de palmarès.
- `server/founders-live-store.ts` et `cloud/founders-live-store.ts` : ordre de départ aléatoire persisté à la création.

### Tests ciblés

```sh
node --test test/founders-scoring.test.mjs test/founders-scoring-http.test.mjs
```

Les suites précédentes (votes, Firestore, écrans, versionnement, moteur territorial) continuent d'être lancées par la CI.

## Travaux encore nécessaires avant exploitation

- **Test humain à 30 participants ou plus** : durée des négociations, sentiment d'équité, participation de chaque membre d'équipe.
- Équilibrage par simulations intégrant les comportements et ressources (dollars et Influence) : une exploration des seules branches n'évalue pas la stratégie de chaque famille.
- Si l'on souhaite une autre façon de gagner (objectifs non territoriaux à conditions composites, prestige de campagne, victoire collective conditionnelle), elle devra être validée avant commercialisation.
- Décors finaux et skins autres que Western, expérience mobile et accès Firebase réel restent à vérifier.
- Aucun merge dans `main` ni déploiement Firebase n'est réalisé par cette tranche.
