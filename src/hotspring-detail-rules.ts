// Display recipes for circumstances the city has already encountered.
export const hotspringRiverSites = {corridor:[25.5,59.2], crossing:[33,55]} as const;

export const HOTSPRING_DETAIL_RULES = [
 {dilemma:'D10', marker:'ACCORD_RIVIERE', kind:'boundary', anchor:'corridor', label:'Tracé du corridor riverain'},
 {dilemma:'D12', marker:'ACCORD_RIVIERE', kind:'boundary', anchor:'corridor', label:'Limite du passage négocié'},
 {dilemma:'D15', marker:'AUTONOMIE_LOCALE', kind:'signpost', anchor:'territory', label:'Piste des fondateurs'},
 {dilemma:'D15', marker:'POSTE_TERRITORIAL', kind:'pennant', anchor:'territory', label:'Relais de la route territoriale'},
 {dilemma:'D16', marker:'CHEMIN_DE_FER', kind:'freight', anchor:'depot', label:'Fret ferroviaire de Black Ridge'},
 {dilemma:'D19', marker:'ACCORD_RIVIERE', kind:'boundary', anchor:'corridor', label:'Emprise du corridor riverain'},
 {dilemma:'D20', marker:'GRANDE_MINE', kind:'ledger', anchor:'mine', label:'Registre de la compagnie minière'},
 {dilemma:'D21', marker:'GRAND_SALOON', kind:'lamplight', anchor:'saloon', label:'Lampes et attroupement devant le saloon'},
 {dilemma:'D21', marker:'POSTE_TERRITORIAL', kind:'pennant', anchor:'territory', label:'Relais territorial et son fanion'},
 {dilemma:'D22', marker:'ABATTOIR_CENTRAL', kind:'stock-runoff', anchor:'stockyard', label:'Fossé des parcs à bétail'},
 {dilemma:'D22', marker:'GRANDE_MINE', kind:'mine-runoff', anchor:'mine', label:'Canal des eaux de la mine'},
 {dilemma:'D22', marker:'QUARTIER_PROVISOIRE', kind:'ditch', anchor:'housing', label:'Fossés des logements provisoires'},
 {dilemma:'D23', marker:'BANQUE_CREDIT', kind:'ledger', anchor:'bank', label:'Registres d’investissement de la banque'},
 {dilemma:'D24', marker:'CONSTRUCTION_SERREE', kind:'chimney-smoke', anchor:'surveyed', label:'Fumée entre les toits serrés'},
 {dilemma:'D24', marker:'GRAND_SALOON', kind:'chimney-smoke', anchor:'saloon', label:'Fumée à l’arrière du saloon'},
 {dilemma:'D24', marker:'QUARTIER_PROVISOIRE', kind:'chimney-smoke', anchor:'housing', label:'Fumée dans le quartier provisoire'},
 {dilemma:'D24', marker:'SCIERIE_INTENSIVE', kind:'chimney-smoke', anchor:'sawmill', label:'Fumée au-dessus des piles de bois'},
 {dilemma:'D25', marker:'DECHETS_LIBRES', kind:'standing-water', anchor:'sanitation', label:'Eau stagnante près des dépôts'},
 {dilemma:'D25', marker:'QUARTIER_PROVISOIRE', kind:'notice', anchor:'housing', label:'Habitations signalées pour les soins'},
 {dilemma:'D26A', marker:'ALLIANCE_VALLEE', kind:'relief', anchor:'corridor', label:'Guides de la vallée au passage de la crue', fixed:hotspringRiverSites.corridor},
 {dilemma:'D26B', marker:'EAU_COMMUNALE', kind:'ledger', anchor:'well', label:'Registre de distribution au puits communal'},
 {dilemma:'D26B', marker:'EAU_PRIVEE', kind:'signpost', anchor:'well', label:'Panneau de la concession d’eau'},
 {dilemma:'D26B', marker:'ALLIANCE_VALLEE', kind:'relief', anchor:'crossing', label:'Ravitaillement proposé par les partenaires de la vallée', fixed:hotspringRiverSites.crossing},
 {dilemma:'D28', marker:'CENTRE_BRULE', kind:'embers', anchor:'bank', label:'Décombres du centre près de la banque'},
 {dilemma:'D28', marker:'SECURITE_MINIERE', kind:'inspection', anchor:'mine', label:'Barrière d’inspection de la mine'}
] as const;

const scarcityPhases = new Set(['PRESENTATION', 'NEGOTIATION', 'COUNCIL', 'REVEALED']);

export function visibleDilemma(phase, dilemma){
 return scarcityPhases.has(phase) ? dilemma : null;
}
