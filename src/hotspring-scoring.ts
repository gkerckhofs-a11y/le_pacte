import {activeFounders} from './founders.ts';

const autonomyGains = [
 'EAU_PRIVEE','CENTRE_PRIVE','AUTONOMIE_LOCALE','CREDIT_LIMITE','POSSE',
 'FINANCEMENT_PONCTUEL','CONSEIL_FONDATEURS','CHARTE_FRONTIERE_LIBRE'
];
const autonomyLosses = [
 'POSTE_TERRITORIAL','BANQUE_CREDIT','MARSHAL','IMPOT_LOCAL','CONSEIL_ELU','CHARTE_VILLE_MODERNE'
];
const legacy = {
 mercer:{charters:['CHARTE_ENTREPRISE'],government:'CONSEIL_FONDATEURS'},
 doyle:{charters:['CHARTE_CIVIQUE'],government:'CONSEIL_ELU'},
 vance:{charters:['CHARTE_VILLE_MODERNE'],government:'CONSEIL_ELU'},
 caldwell:{charters:['CHARTE_FRONTIERE_LIBRE'],government:'CONSEIL_FONDATEURS'},
 whitmore:{charters:['PACTE_VALLEE_FINAL','CHARTE_RESSOURCES']}
};

export function autonomyIndex(markers){
 return autonomyGains.filter(m=>markers.has(m)).length-autonomyLosses.filter(m=>markers.has(m)).length;
}

export function chapterObjective(definition,markers){
 return definition.groups.filter(group=>group.some(m=>markers.has(m))).length>=definition.required?2:0;
}

export function hotspringScores(s,{final=false}={}){
 const campaign=s.campaign;
 const definitions=s.scenario.campaign.families;
 const markers=new Set(campaign.markers);
 const chapters=campaign.completedChapters;
 const hasLegacy=final&&Boolean(campaign.charter);
 const rows=activeFounders(s.game).map((family,i)=>{
  const key=Object.keys(definitions)[i],definition=definitions[key];
  const chapterPoints=chapters.map(chapter=>{
   const objective=definition.objectives[chapter-1];
   return {chapter,title:objective.title,points:chapterObjective(objective,markers),maximum:2};
  });
  const trajectory=(definition.trajectory==='autonomy'
   ?autonomyIndex(markers)>=2
   :s.game.city[definition.trajectory]>campaign.initialCity[definition.trajectory])?2:0;
  const charter=hasLegacy&&legacy[key].charters.some(m=>markers.has(m))?2:0;
  const governance=hasLegacy&&(
   key==='whitmore'?campaign.trust>=3||markers.has('ALLIANCE_VALLEE'):markers.has(legacy[key].government)
  )?1:0;
  return {family,name:s.names[family],chapterPoints,trajectory,charter,governance,
   total:chapterPoints.reduce((sum,c)=>sum+c.points,0)+trajectory+charter+governance,
   maximum:chapters.length*2+2+(hasLegacy?3:0)};
 });
 rows.sort((a,b)=>b.total-a.total);
 return {rows,winners:rows.filter(r=>r.total===rows[0].total).map(r=>r.family)};
}
