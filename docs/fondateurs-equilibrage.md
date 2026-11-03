# Hot Spring — candidat d’équilibrage du 3 novembre 2026

## Diagnostic et décision

Le signal utilisateur « E a seulement deux victoires » ne précise pas le nombre d'essais, la graine, les réglages et le mode. Cette valeur exacte n'est donc pas reproduite ici. Sur une comparaison indépendante avec les réglages initiaux par défaut, E est néanmoins la famille qui gagne le moins souvent dans chacun des trois modes.

Un premier balayage compare E à 8/10, 7/9, 8/9, 7/8 et 6/8, sur les graines 20261103, 34567 et 91234 (120 essais par graine et mode). Le modèle favorise aussi fortement F. Plusieurs ajustements conjoints sont donc comparés sur ces mêmes graines. Le candidat retenu est ensuite évalué avec cinq autres graines, fixées dans le script, sans les utiliser pour choisir ses seuils.

## Nouveaux objectifs par défaut

| Famille | Ancien palier 1 / 2 | Candidat palier 1 / 2 |
| --- | --- | --- |
| A — Économie haute | ≥6 / ≥8 | ≥6 / ≥7 |
| B — Sécurité haute | ≥5 / ≥7 | inchangé |
| C — Satisfaction haute | ≥4 / ≥6 | ≥4 / ≥7 |
| D — Bien-être haut | ≥6 / ≥8 | inchangé |
| E — Développement haut | ≥8 / ≥10 | ≥7 / ≥9 |
| F — Stabilité basse | ≤4 / ≤3 | ≤4 / ≤2 |

E peut obtenir le second palier sans atteindre le maximum absolu de la jauge. A est légèrement facilitée ; C et F ont un second palier plus exigeant. Les thèmes, les points (3 puis 5 supplémentaires), les stocks initiaux et le départage restent identiques. Le classement utilise toujours la formule V2.6.

Les objectifs enregistrés dans les sessions existantes restent figés. Ces valeurs s'appliquent par défaut aux nouvelles configurations ; elles restent des hypothèses propres au scénario de démonstration Hot Spring. Elles ne garantissent pas l'équilibre d'un scénario importé ou de stocks initiaux personnalisés.

## Vérification sur graines distinctes

Pour chaque configuration : 5 graines × 120 parties × 3 modes = **1 800 parties**. Ancien et candidat sont comparés sur les mêmes graines, avec le même moteur et les mêmes ressources. Soit **3 600 parties**, toutes terminées, aucune interrompue.

Victoires en mode **mixte**, sur 600 parties par colonne :

| Famille | Ancien | Candidat |
| --- | ---: | ---: |
| A | 73 | 94 |
| B | 97 | 112 |
| C | 99 | 99 |
| D | 70 | 97 |
| E | 63 | 113 |
| F | 198 | 85 |

E : prudent 40 → 78 ; ambitieux 70 → 120 ; mixte 63 → 113 (600 parties par configuration et mode). L'écart entre le maximum et le minimum de victoires passe de 174 à 40 en prudent, de 92 à 60 en ambitieux et de 135 à 29 en mixte.

**Conclusion limitée au modèle :** le candidat réduit les écarts observés et corrige la faiblesse de E. F reste moins victorieuse avec le profil ambitieux (60/600). Les résultats ne sont ni des probabilités de victoire humaine ni une preuve d'équité.

## Limites et suite

Les agents choisissent d'après l'effet immédiat sur leur jauge ; ils ne tiennent pas compte de la distance aux paliers. Changer les seuils modifie donc leur score final, pas leur stratégie. Ils ne représentent pas les coalitions, le bluff ou la planification humaine. Le Meneur et le Modérateur initiaux restent ceux du moteur (A et F) ; seul l'ordre de départage final est mélangé par le laboratoire. Le diagnostic concerne cet ensemble précis d'hypothèses, pas une causalité isolée des seuils.

Ce réglage reste un **candidat au test humain**, pas un preset validé commercialement. Vérifier en priorité l'intérêt de l'objectif de F, les coalitions, les choix de mise et la perception d'équité. L'analyse de branches reste disponible et ses fréquences ne sont pas forcées à être identiques.

Reproduction hors production :

```sh
node scripts/founders-balance-report.mjs > /tmp/founders-balance-report.json
node --test test/founders-scoring.test.mjs test/founders-scoring-http.test.mjs test/founders-policy-lab.test.mjs test/founders-policy-http.test.mjs
```

Sources : moteur `src/founders-policy-lab.ts`, objectifs et classement `src/founders-scoring.ts`, scénario `content/fondateurs-sheet-sample-v1.json`, protocole `scripts/founders-balance-report.mjs`, résultats complets `docs/fondateurs-equilibrage-resultats.json`. Comparaison exécutée le 3 novembre 2026. Les moyennes du rapport agrègent des moyennes par graine arrondies par le laboratoire.

État : code et rapport préparés dans la branche V2.7 ; cette modification des objectifs n'a pas été déployée sur Firebase.
