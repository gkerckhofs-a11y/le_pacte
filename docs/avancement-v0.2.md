# État du développement — 0.2.0 — 2 novembre 2026

Cette tranche livre une répétition locale connectée au moteur V1.1. Elle ne constitue pas le lancement commercial ni un déploiement Firebase.

| Exigence | État de cette tranche |
|---|---|
| Sessions et six équipes | Création locale, code unique, liens privés révocables ; QR à produire |
| Topologie et simultanéité | Moteur existant réutilisé, carte SVG à 33 zones et 60 liens |
| Ordres | Formulaires mobiles, contrôle de coût côté serveur et verrouillage irréversible |
| Échanges et alliances | Propositions et acceptations authentifiées, transactions SQLite et expiration en fin de manche |
| Conseil et Sommet | Votes privés confirmés et calcul serveur |
| Projection | Chrono, carte, scores, lois, alliances, rapport de manche et finale ; secrets filtrés à la source |
| Pause et reprise | Échéances persistantes, pause et rattrapage serveur |
| Cinq univers | Exemples sélectionnables, palettes et labels ; médias et textes complets non réalisés |
| Studio | Non développé |
| Firebase | Non raccordé ; aucun projet modifié |
| Réseau et performance | Polling à 1,5 seconde, non mesuré en salle ; aucun objectif p95 revendiqué |
| Vérification | 62 tests locaux : 42 existants + 15 intégration/persistance + 5 génération HTML |
| QA visuelle | Bloquée : navigateur distant incapable de joindre le serveur local |
| Test humain | À organiser avec six équipes |

Le serveur local et SQLite sont un service faisant autorité pour cette répétition. Ils offrent un banc de test concret pour les interfaces. Leur présence ne vaut pas validation de l'architecture Firebase cible ni de la sécurité d'un hébergement Internet.
