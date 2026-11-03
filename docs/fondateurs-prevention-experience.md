# Événements et prévention : essai mécanique hors production

Date : 3 novembre 2026. Statut : expérience de conception, non intégrée à l’application.

## Question et protocole

La prévention apporte-t-elle des conséquences mesurables et un arbitrage financier, sans déséquilibrer les familles ? Le plaisir, le nombre de négociations réelles, la durée et l’engagement humain ne sont pas mesurables par ce protocole.

Le script `scripts/founders-prevention-experiment.mjs` utilise les vrais moteurs de vote, effets de ville et classement, le scénario Hot Spring et les objectifs recalibrés. Il conserve huit Conseils. Les financements sont des décisions supplémentaires simulées, sans nouveau vote politique. Aucune donnée Firebase n’est lue ou écrite.

- 120 graines par condition, départ 551001, incrément 97.
- 120 parties de référence sans aléas.
- Risque par événement : 25 %, 50 % ou 75 % ; coût par projet : 3, 6 ou 9 dollars.
- Trois traitements pour chaque combinaison : aléas sans protection ; paiement collectif réparti imposé (contrôle) ; contributions volontaires artificielles.
- Total exécuté : 120 + 9 × 3 × 120 = **3 360 parties**, toutes terminées.
- Complément : coûts 4 et 5 au risque 50 %, trois traitements × 120, plus répétition des 120 références = 840 exécutions supplémentaires. Total effectivement exécuté : **4 200 parties**, toutes terminées ; les références répétées ne sont pas des observations indépendantes.
- Mêmes graines et tirages d’aléas entre traitements. Le coût n’influence pas le traitement sans protection ; ses résultats identiques dans les trois groupes de coût ne constituent pas des réplications indépendantes.

Les opportunités de financer les pompiers et le dispensaire précèdent respectivement les Conseils 2 et 5. Le départ de feu peut survenir après le Conseil 4, la maladie après le Conseil 7. Les risques sont connus des agents, mais ils ne consultent pas le tirage à venir. Il peut survenir zéro, un ou deux événements.

## Règles hypothétiques testées

| Événement | Sans protection | Avec protection |
| --- | --- | --- |
| Incendie | Économie −2, Développement −2, Bien-être −1, Satisfaction −1 | Économie −1 |
| Épidémie | Bien-être −3, Satisfaction −2, Économie −1 | Bien-être −1 |

Ces valeurs sont des choix expérimentaux, pas des règles déjà validées. Les bornes 0–10 sont appliquées par le moteur. Les impacts effectifs tiennent compte des jauges déjà basses.

Les coûts sont déduits des dollars familiaux ; un projet insuffisamment financé ne coûte rien. Le paiement réparti est imposé, pas un résultat de négociation. Le coût de 3 dollars répartit mécaniquement le paiement entre trois familles en faisant tourner la priorité ; il ne peut pas représenter six parts entières égales.

Le traitement volontaire attribue des profils de solidarité, prudence et intérêt privé, tournants entre familles. Ils évaluent une approximation du gain attendu pour leur objectif, un intérêt collectif pondéré et le coût sur leur fortune. Ils ne négocient pas, ne promettent pas d’échanges futurs et ne cherchent pas un compromis sur les montants. Le faible financement à certains coûts peut donc venir de ces règles d’agents, pas du comportement des joueurs.

## Résultats centraux : deux risques de 50 %, projet à 6 dollars

120 parties par ligne, mêmes graines et tirages.

| Condition | Perte immédiate moyenne cumulée dans les jauges, par partie | Bien-être final moyen /10 | Satisfaction finale moyenne /10 | Vainqueur différent de la référence |
| --- | ---: | ---: | ---: | ---: |
| Référence sans aléas | 0 | 5,54 | 4,41 | — |
| Aléas sans protection | 5,43 | 3,75 | 3,03 | 31/120 |
| Deux protections financées à coût réparti | 0,96 | 5,04 | 4,41 | 19/120 |
| Prévention par contributions volontaires | 5,31 | 3,80 | 3,07 | 32/120 |

Le coût collectif des deux protections à 6 dollars est de 12 dollars, soit deux dollars par famille dans ce contrôle. Les protections réduisent les pertes immédiates moyennes d’environ 82 % dans cette comparaison (1 − 0,958/5,425). Ce pourcentage ne mesure pas une amélioration équivalente des scores finaux, ni un effet réel sur le plaisir.

Au même risque de 50 %, la version volontaire finance 219 projets sur 240 à coût 3 (91,25 %), mais seulement 4 sur 240 à coût 6 (1,67 %). Le signal est une forte sensibilité du financement à sa règle et au coût. Ces pourcentages ne sont pas des probabilités de coopération humaine. Le complément aux coûts intermédiaires donne 138/240 projets à coût 4 (57,5 %) et 50/240 à coût 5 (20,83 %), avec les mêmes graines et profils. À coût 4, les pertes immédiates moyennes sont de 2,98 points de jauges par partie et le Bien-être final moyen de 4,50/10. Ce point constitue un candidat de prototype, pas un coût validé pour des joueurs.

### Équilibre des familles

Victoires au risque 50 %, coût 6 :

| Famille | Référence | Sans protection | Protections à coût réparti |
| --- | ---: | ---: | ---: |
| A | 22 | 16 | 20 |
| B | 22 | 36 | 24 |
| C | 14 | 11 | 14 |
| D | 17 | 6 | 13 |
| E | 30 | 25 | 29 |
| F | 15 | 26 | 20 |

Les règles d’événements testées ne touchent directement ni la Sécurité ni la Stabilité. Le signal favorisant B/F et défavorisant D est donc cohérent avec la construction du modèle, mais ne prouve pas à lui seul une causalité isolée en jeu humain. Les financements changent également les points de fortune, même si aucun aléa ne survient.

## Ce que l’essai permet de conclure

- La prévention a une utilité mécanique concrète dans les hypothèses testées : elle réduit les dégâts et protège une partie des objectifs.
- Le financement crée un arbitrage entre fortune familiale et protection collective. La possibilité de ne rien payer pour bénéficier du projet existe ; elle n’est pas une mesure de trahison ou d’égoïsme réel.
- Ajouter seulement des catastrophes dégrade l’équilibre observé. Les objectifs et l’exposition aux risques doivent être recalibrés avant une activation normale.
- Le modèle ne montre pas de hausse des actions de vote : leur moyenne est identique dans les conditions centrales. Les deux fenêtres de financement sont ajoutées par construction. Il serait faux d’en déduire davantage de discussions ou d’intérêt chez les joueurs.

## Recommandation de conception

Conserver un prototype optionnel avec deux alertes lisibles, deux projets et au maximum deux aléas sur les huit dilemmes. Faire connaître l’effet de la protection et laisser une occasion de financer avant le tirage. Conserver un coût résiduel lorsque l’incident est contenu, afin de distinguer incident et catastrophe. Prévoir une décision de secours après un échec ; cette reconstruction n’est pas simulée ici.

Avant intégration générale, utiliser le coût intermédiaire de 4 dollars comme hypothèse de départ, tester surtout un financement négocié plus riche et comparer à nouveau l’équilibre des six familles. Même au coût 4, B gagne 37 fois et D seulement 8 fois sur 120 dans ce modèle ; cette valeur ne résout donc pas à elle seule l’équilibrage. Ne pas fixer les valeurs commerciales à partir de ces agents seuls. En test humain, comparer deux groupes/parties comparables avec et sans la mécanique, en notant les discussions sur le financement, la compréhension des risques, l’impression de subir le hasard, le temps ajouté et le sentiment d’équité. Aucun groupe humain n’a été testé dans cette expérience.

## Reproduction et contrôles

```sh
node scripts/founders-prevention-experiment.mjs > /tmp/prevention-results.json
# Complément : importer reportPreventionExperiment et appeler
# reportPreventionExperiment(120, [4, 5], [.5])
```

Chaque simulation contrôle la conservation de l’Influence, le bilan dollars + dépenses = dollars initiaux + revenus d’abstention, l’absence de trésorerie négative, la terminaison des huit Conseils et la validité du classement. Le script contrôle aussi la reproductibilité d’un cas et l’absence d’événements à risque nul. Les résultats complets et hypothèses sont dans `docs/fondateurs-prevention-resultats.json` et `docs/fondateurs-prevention-intermediaire.json`.

Aucune règle, interface ou partie de production modifiée. Source des chiffres : exécution locale du script avec les moteurs du dépôt le 3 novembre 2026.
