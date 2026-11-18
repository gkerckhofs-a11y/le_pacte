const dilemmaEffects = {
 D01:{pour:{economie:1, demographie:1}, contre:{securite:1, ecologie:1, demographie:-1}},
 D02:{pour:{economie:2, demographie:1, bien_etre:-1}, contre:{economie:-1, ecologie:1, bien_etre:1}},
 D03:{pour:{economie:2}, contre:{economie:-1, bien_etre:1}},
 D04:{pour:{economie:2, demographie:1, ecologie:-2}, contre:{economie:-1, ecologie:2, demographie:-1}},
 D05:{pour:{economie:-1, bien_etre:2, demographie:1}, contre:{economie:1, bien_etre:-1, demographie:-1}},
 D06:{pour:{economie:2, demographie:1, securite:-1, bien_etre:-1}, contre:{economie:1, securite:1, bien_etre:1}},
 D07:{pour:{economie:-1, bien_etre:2, demographie:1}, contre:{economie:1, bien_etre:-1}},
 D08:{pour:{economie:-1, securite:2, bien_etre:1}, contre:{economie:1, securite:-1}},
 D09:{pour:{economie:-1, ecologie:2, securite:1}, contre:{economie:1, ecologie:-1}},
 D10:{pour:{economie:2, ecologie:-2, securite:-1}, contre:{economie:-1, ecologie:1, securite:1}},
 D11:{pour:{economie:1, securite:1, bien_etre:1}, contre:{economie:2, securite:-1, bien_etre:-1}},
 D12:{pour:{economie:2, securite:2, ecologie:-1}, contre:{economie:-1, securite:-1, ecologie:1}},
 D13:{pour:{economie:-1, demographie:-1, securite:1}, contre:{economie:1, demographie:2, securite:-1}},
 D14A:{pour:{economie:-1, securite:1, bien_etre:2}, contre:{economie:1, securite:-1}},
 D14B:{pour:{economie:-1, securite:1}, contre:{economie:1, securite:1, bien_etre:-1}},
 D15:{pour:{economie:3, demographie:1, ecologie:-1}, contre:{economie:-1, demographie:-1, ecologie:1}},
 D16:{pour:{economie:3, demographie:1, ecologie:-3, bien_etre:-1}, contre:{economie:1, ecologie:-1}},
 D17:{pour:{economie:2, demographie:2, ecologie:-1, bien_etre:-2}, contre:{economie:-1, ecologie:1, demographie:1, bien_etre:2}},
 D18:{pour:{economie:2, demographie:1}, contre:{economie:-1, demographie:-1}},
 D19:{pour:{economie:2, ecologie:-2, bien_etre:-1}, contre:{economie:1, ecologie:1, bien_etre:1}},
 D20:{pour:{economie:2, bien_etre:-2}, contre:{economie:-1, bien_etre:1}},
 D21:{pour:{economie:-1, securite:3, bien_etre:1}, contre:{economie:1, securite:-2}},
 D22:{pour:{economie:-1, ecologie:2, bien_etre:2}, contre:{economie:1, ecologie:-2, bien_etre:-1}},
 D23:{pour:{economie:-1, bien_etre:1}, contre:{economie:1, bien_etre:-1}},
 D24:{pour:{economie:-1, demographie:-2, securite:-1, bien_etre:-3}, contre:{economie:-3, securite:-1, bien_etre:-1}},
 D25:{pour:{economie:-2, demographie:-1, bien_etre:-1}, contre:{economie:-1, demographie:-3, bien_etre:-3}},
 D26A:{pour:{economie:-3, securite:1, bien_etre:-1}, contre:{economie:-1, demographie:-3, securite:-1, bien_etre:-3}},
 D26B:{pour:{economie:-3, ecologie:1, bien_etre:-1}, contre:{economie:1, ecologie:-2, demographie:-3, bien_etre:-3}},
 D27:{pour:{economie:-2, securite:2, bien_etre:1}, contre:{economie:2, securite:-2, bien_etre:-2}},
 D28:{pour:{economie:-2, bien_etre:-1}, contre:{economie:-3, demographie:-2, bien_etre:-3}},
 D29:{pour:{securite:-1, bien_etre:1}, contre:{securite:1, bien_etre:-1}},
};

const charterEffects = {
 A:{economie:2, demographie:1, ecologie:-1, bien_etre:-1},
 B:{economie:-1, bien_etre:2, demographie:1},
 C:{economie:1, securite:-1, bien_etre:-1},
 D:{economie:-2, ecologie:1, securite:2, bien_etre:2},
 E:{economie:-1, ecologie:2, securite:1, bien_etre:1},
 F:{economie:-2, ecologie:2, bien_etre:1},
};

const trajectories={mercer:'economie',doyle:'bien_etre',vance:'securite',caldwell:'demographie',whitmore:'ecologie'};

const labels={economie:'Économie',ecologie:'Écologie',securite:'Sécurité',bien_etre:'Bien-être',demographie:'Démographie'};
const toEffects=values=>Object.entries(values).map(([indicator,value])=>({indicator,operation:'delta',value}));
const settlementNotes={
 D01:{contre:' Sur les hauteurs, les chantiers avancent plus lentement et une partie des arrivants reporte son installation.'},
 D04:{contre:' Les familles dont le logement est retardé passent la saison ailleurs.'},
 D15:{pour:' Une partie des ouvriers s’installe à l’année près du dépôt.'},
 D16:{pour:' Une partie des équipes s’établit à Hotspring à mesure que les postes se stabilisent.'},
};
const isOldIndicator=/^(Économie|Écologie|Sécurité|Bien-être|Démographie)\s*[↑↓]/;
function updatedTendencies(original,values){
 const indicators=Object.entries(values).map(([key,value])=>labels[key]+' '+(value>0?'↑':'↓').repeat(Math.abs(value)));
 const notes=original.slice(1).map(line=>line.split(' · ').filter(part=>!isOldIndicator.test(part)).join(' · ')).filter(Boolean);
 return [original[0],indicators.join(' · '),...notes];
}

export function hotspringWithWellBeing(base){
 const story=structuredClone(base);
 const {campaign}=story;
 story.schema_version='1.1.0';
 campaign.version=2;
 for(const [id,trajectory] of Object.entries(trajectories))campaign.families[id].trajectory=trajectory;
 for(const d of story.dilemmas){
  if(d.id==='D30')continue;
  for(const side of ['pour','contre']){
   const values=dilemmaEffects[d.id][side];
   d.outcomes[side].effects=toEffects(values);
   const settlement=settlementNotes[d.id]?.[side];
   if(settlement)d.outcomes[side].narration+=settlement;
   const rule=campaign.rules[d.id];
   rule.tendencies[side]=updatedTendencies(rule.tendencies[side],values);
  }
 }
 for(const charter of campaign.charters){
  const values=charterEffects[charter.id];
  charter.effects=toEffects(values);
  charter.tendencies=updatedTendencies(charter.tendencies,values);
 }
 campaign.epilogue.bien_etre=[
  {label:'Détresse',text:'La maladie, la précarité ou l’abandon des services ont rendu la vie quotidienne particulièrement difficile.'},
  {label:'Vie rude',text:'Hotspring tient encore, mais une part importante de sa population vit dans des conditions éprouvantes.'},
  {label:'Conditions acceptables',text:'La ville offre l’essentiel, malgré des inégalités et des services encore fragiles.'},
  {label:'Ville accueillante',text:'Les habitants disposent de services solides et de conditions de vie favorables.'},
  {label:'Communauté exemplaire',text:'Hotspring est reconnue pour la qualité de ses services et l’attention portée à ses habitants.'}
 ];
 return story;
}
