# Atelier des univers — prototypes visuels du 3 novembre 2026

État actualisé : publié sur Firebase le 3 novembre 2026 ; voir le [compte rendu de mise en ligne](deploiement-skins-2026-11-03.md). Les mentions de non-publication ci-dessous décrivent la tranche avant ce déploiement.

## Livraison

Les cinq habillages existants ont maintenant une direction d’interface et un décor vectoriel natif. Leurs métadonnées passent en version 1.1.0 ; leur statut reste `prototype`.

| Skin | Direction | Décor |
| --- | --- | --- |
| Western | Bois patiné, cuivre, titres à empattements | Hot Spring, saloon et gare |
| Mafia / Prohibition | Nuit urbaine, laiton, cadres Art déco | Quartier de commerces, club, commissariat et station |
| Médiéval | Pierre, vert profond, cadres de maisons | Halle, porte gardée, hospice, ateliers et moulin |
| Futuriste | Cyan, verre, angles de panneaux | Colonie de modules, agora, soins et recherche |
| Corporate | Surfaces claires, bleu encre, campus | Pavillons de commerce, conformité, santé et innovation |

Les thèmes sont appliqués à la projection, à la régie de partie et à l’espace porte-parole. La couleur d’équipe constitue une couche indépendante : une équipe violette reste violette dans chacun des univers. Les variantes Corporate emploient une teinte sombre de chaque couleur pour les textes et boutons sur fond clair. La palette d’identité publique n’est pas modifiée dans les sessions.

Les libellés de monnaie issus de la skin sont également utilisés dans les propositions, ressources et décomptes des interfaces concernées. Les noms, objectifs, textes des dilemmes et règles enregistrés restent ceux du scénario ; le choix d’un univers ne réécrit pas l’histoire. L’avertissement de discordance scénario/univers est conservé.

## Galerie

`/founders-skins.html` est une galerie publique sans connexion. Elle lit uniquement les métadonnées d’habillage publiques, sans scénario, session ou accès porte-parole.

Elle permet de :

- comparer les cinq directions et les six couleurs d’équipe ;
- faire varier individuellement les six jauges ;
- positionner toutes les jauges à 2, 5 ou 8 ;
- examiner un exemple de panneau d’équipe avec des données fictives.

Aucune action de la galerie ne crée une partie, n’effectue un vote ou n’enregistre une configuration d’exploitation. Le lien vers l’atelier est ajouté à l’écran de préparation. La prévisualisation de préparation montre désormais le décor à la place d’une simple bande de couleur.

## Décors et compatibilité

Chaque décor expose trois états indépendants pour chaque jauge (0–3, 4–6, 7–10). Les couches sont activées d’après les jauges publiques déjà révélées. Les descriptions sont propres à l’univers : les habillages non Western n’emploient plus le shérif, le saloon ou Hot Spring. Les assemblées autonomes représentent la Stabilité basse sans incendie ni destruction.

La bibliothèque reconnaît les cinq rendus natifs comme disponibles, même sans image externe. Un identifiant d’habillage personnalisé reste signalé comme nécessitant son propre décor. Les versions des skins sont figées dans les nouvelles sessions ; les anciens états restent lisibles. Le rendu frontal est partagé : une session existante portant l’un des cinq identifiants profite du nouveau style lors d’une future publication, sans modification de ses scores ni de ses textes.

## Vérifications

25 tests ciblés réussis : cinq univers avec moteur/récit identiques, couches des décors, contrastes des boutons d’équipe (seuil interne 4,5:1 sur les fonds vérifiés), endpoints de galerie, confidentialité des métadonnées, bibliothèque, catalogue, identités et syntaxe des dix modules d’interface.

Le test de contraste ne constitue pas un audit complet d’accessibilité. Les captures de navigateur ont permis d’examiner les cinq univers et de manipuler les jauges et couleurs. Les écrans complets de régie et porte-parole avec chaque skin n’ont pas tous été parcourus en navigateur ; l’atelier utilise les mêmes fonctions de thème et de décor. L’usage sur téléphone réel et les parcours Firebase Auth ne sont pas validés par ces contrôles.

Build Firebase et contrôle des bundles réussis. Pas de nouveau lancement de l’émulateur Firestore pour cette tranche. Aucun déploiement, changement de droits ou écriture de données de production.

```sh
node --test test/founders-skins.test.mjs test/founders-library.test.mjs test/founders-ui-syntax.test.mjs test/founders-identity.test.mjs test/founders-catalog-http.test.mjs
npm run build:firebase
node scripts/verify-cloud-build.mjs
```

Sources : `content/founders-skins-v1.json`, modules `public/founders-skin-*.js`, scène et galerie, tests et observation navigateur du 3 novembre 2026. La suite graphique pourra enrichir les bâtiments, les enseignes et les animations après choix des directions à approfondir.
