# Équipes colorées et ville évolutive — 3 novembre 2026

État actualisé : publié sur Firebase le 3 novembre 2026 ; voir le [compte rendu de mise en ligne](deploiement-skins-2026-11-03.md). Les mentions de non-publication ci-dessous décrivent la tranche avant ce déploiement.

## Identité publique d’une équipe

Six couleurs distinctes sont choisies dans la préparation : Bleue ◆, Rouge ●, Verte ▲, Jaune ☀, Violette ✦, Orange ■. L’organisateur peut les permuter entre les six emplacements. L’API refuse une couleur inconnue et les doublons. Les lettres A–F restent des identifiants internes du moteur ; l’interface affiche les couleurs, symboles et noms de famille dans les votes, négociations et classements. Les couleurs n’accordent aucun bonus et ne changent pas les objectifs secrets des emplacements.

Le nom peut être renseigné pendant la préparation ou choisi collectivement puis enregistré par le porte-parole depuis son écran. Le porte-parole ne peut modifier que sa famille. Cette modification est autorisée uniquement en phase READY, avec la révision courante et la clé d’équipe existante. Après le lancement, l’identité est figée. Les noms restent du texte, jamais du HTML exécuté.

L’espace porte-parole reprend la couleur de son équipe dans l’en-tête, le fond, les bordures, les boutons principaux, les blocs de ressources et les jauges. Les libellés et symboles évitent de transmettre l’identité uniquement par la couleur. Un seul accès porte-parole par famille est conservé ; aucun compte joueur supplémentaire n’est créé.

Les couleurs sont enregistrées dans le même état de session que les noms, tant en SQLite qu’en Firestore. Les anciennes sessions sans champ `colors` reçoivent une palette d’affichage déterministe, sans migration et sans modification de leurs objectifs ou scores.

## Panorama de Hot Spring

Une nouvelle scène vectorielle garde les mêmes positions pour le saloon, le shérif, le Conseil, le dispensaire et la parcelle de la gare. Chaque dimension a trois états : 0–3, 4–6 et 7–10. Les six états sont indépendants ; il n’existe pas de note globale d’embellissement.

| Indicateur | Éléments visuels |
| --- | --- |
| Économie | Étal fermé, commerce modeste, marché approvisionné et chariot |
| Sécurité | Bureau peu équipé, patrouille, lanternes et patrouille renforcée |
| Satisfaction | Rassemblement avec pancartes, discussions, fête sur la place |
| Bien-être | Puits à réparer, point d’eau en service, dispensaire agrandi et jardin |
| Développement | Parcelle réservée, ossature en chantier, gare et télégraphe |
| Stabilité | Assemblées autonomes, Conseil commun, affichages et organisation municipale |

Une Stabilité basse ne déclenche ni incendie ni destruction. Le paysage de l’autonomie reste cohérent avec l’ambition de F. Les changements suivent les jauges publiques, donc les conséquences révélées : le script ne calcule pas les issues secrètes. Une légende décrit les six états ; les changements de niveau sont annoncés en texte. Les fondus respectent la préférence de mouvement réduit.

Cette première réalisation est vectorielle. Les états ne constituent pas une représentation complète des décisions : ils synthétisent les six jauges actuelles. Les autres univers nécessiteront leur propre illustration.

## Vérification et état

- 26 tests ciblés réussis : identité, permissions, doublons, conservation après sérialisation, compatibilité des sessions, API/SQLite, seuils des états de ville, sessions narratives, scoring et syntaxe des sept scripts navigateur.
- Build Firebase et vérification des bundles réussis.
- Aperçu navigateur avec données synthétiques : tableaux de bord bleu et orange, panorama aux jauges basses et hautes. La création et la modification d’identité sont vérifiées séparément par les tests HTTP réels ; les aperçus visuels utilisent des projections fictives et ne valident pas une connexion Firebase.
- Les tests de l’émulateur Firestore n’ont pas été relancés pour cette tranche ; l’usage mobile sur téléphone réel reste à vérifier.
- Aucun déploiement Firebase ni modification des règles, des rôles ou des données de production pendant cette tranche. Prévoir une publication conjointe Functions + Hosting pour servir les nouvelles projections d’identité et leurs interfaces compatibles.

Commande ciblée :

```sh
node --test test/founders-identity.test.mjs test/founders-live.test.mjs test/founders-live-http.test.mjs test/founders-scoring.test.mjs test/founders-ui-syntax.test.mjs
npm run build:firebase
node scripts/verify-cloud-build.mjs
```
