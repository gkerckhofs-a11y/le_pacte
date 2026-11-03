/** Hybrid narrative reserve. Pure, reproducible, and server-only. No eval or clock. */
const METRICS=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,ks)=>obj(x)&&Object.keys(x).every(k=>ks.includes(k));
const int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
export const isHybrid=story=>story?.scenario?.progression?.mode==='hybrid';
export function validateNarrativeConditions(list,ids){
 if(!Array.isArray(list)||list.length>20)return ['Conditions : liste de 0 à 20 requise'];
 const errors=[];
 for(const c of list){
  if(c?.type==='decision'){
   if(!keys(c,['type','dilemma_id','winner'])||!ids.has(c.dilemma_id)||!['pour','contre'].includes(c.winner))errors.push('Condition de décision invalide');
  }else if(c?.type==='indicator'){
   if(!keys(c,['type','indicator','operator','value'])||!METRICS.includes(c.indicator)||!['lte','gte','eq'].includes(c.operator)||!int(c.value,0,10))errors.push('Condition de jauge invalide');
  }else if(c?.type==='resolved'){
   if(!keys(c,['type','minimum'])||!int(c.minimum,0,50))errors.push('Condition de rythme invalide');
  }else errors.push('Type de condition inconnu');
 }
 return errors;
}
export function validateHybridStory(story){
 const p=story?.scenario?.progression,ds=story?.dilemmas??[],ids=new Set(ds.map(d=>d?.id));
 const errors=[],add=(ok,m)=>{if(!ok)errors.push(m);};
 if(p===undefined){
  if(ds.some(d=>d?.access!==undefined||Object.values(d?.outcomes??{}).some(o=>o?.unlocks!==undefined)))errors.push('Accès et déblocages réservés au mode hybride');
  return errors;
 }
 add(keys(p,['mode','initial_dilemmas','finale_id','min_councils','max_councils','ending_fragments'])&&p.mode==='hybrid','Progression hybride invalide');
 if(!obj(p))return errors;
 add(int(p.min_councils,2,50)&&int(p.max_councils,2,50)&&p.min_councils<=p.max_councils,'Budget de Conseils invalide (finale comprise)');
 add(Array.isArray(p.initial_dilemmas)&&p.initial_dilemmas.length<=500&&new Set(p.initial_dilemmas).size===p.initial_dilemmas.length&&p.initial_dilemmas.every(id=>ids.has(id)),'Réserve initiale invalide');
 add(p.initial_dilemmas?.includes(story.scenario.entry_dilemma),'Le premier dilemme doit être disponible au départ');
 add(ids.has(p.finale_id)&&p.finale_id!==story.scenario.entry_dilemma,'Finale introuvable');
 let required=0;
 for(const d of ds){
  if(!obj(d)){errors.push('Dilemme hybride invalide');continue;}
  const a=d.access;
  add(keys(a,['category','priority','conditions'])&&['required','optional','finale'].includes(a?.category)&&int(a?.priority,0,100),'Accès invalide : '+d.id);
  errors.push(...validateNarrativeConditions(a?.conditions,ids).map(e=>d.id+' : '+e));
  if(a?.category==='required')required++;
  add((d.id===p.finale_id)===(a?.category==='finale'),'Une seule finale désignée requise : '+d.id);
  if(a?.category==='finale')add(a.conditions?.length===0,'La finale ne doit pas dépendre d’une condition');
  if(d.id===story.scenario.entry_dilemma)add(a?.conditions?.length===0,'Le premier dilemme ne doit pas être conditionnel');
  for(const o of Object.values(d.outcomes??{}))if(o?.unlocks!==undefined)add(Array.isArray(o.unlocks)&&o.unlocks.length<=100&&new Set(o.unlocks).size===o.unlocks.length&&o.unlocks.every(id=>ids.has(id)),'Déblocages invalides : '+d.id);
 }
 add(ds.length>=p.min_councils,'Bibliothèque trop petite pour le minimum de Conseils');
 add(required+1<=p.max_councils,'Trop de dilemmes obligatoires pour le budget');
 if(p.ending_fragments!==undefined){
  add(Array.isArray(p.ending_fragments)&&p.ending_fragments.length<=20,'Fragments de finale invalides');
  if(Array.isArray(p.ending_fragments))for(const f of p.ending_fragments){
   add(keys(f,['text','conditions'])&&typeof f.text==='string'&&f.text.trim().length>0&&f.text.length<=1500,'Texte de finale invalide');
   errors.push(...validateNarrativeConditions(f?.conditions,ids));
  }
 }
 return errors;
}
export function conditionsMatch(conditions,s){
 return conditions.every(c=>{
  if(c.type==='decision')return s.revealedHistory.some(h=>h.id===c.dilemma_id&&h.winner===c.winner);
  if(c.type==='resolved')return s.revealedHistory.length>=c.minimum;
  const value=s.game.city[c.indicator];
  return c.operator==='lte'?value<=c.value:c.operator==='gte'?value>=c.value:value===c.value;
 });
}
export function narrativeReserve(s){
 if(!isHybrid(s.scenario))return null;
 const p=s.scenario.scenario.progression,played=new Set(s.revealedHistory.map(h=>h.id));
 const unlocked=new Set(p.initial_dilemmas);
 for(const h of s.revealedHistory){
  const d=s.scenario.dilemmas.find(d=>d.id===h.id);
  for(const id of d?.outcomes[h.winner]?.unlocks??[])unlocked.add(id);
 }
 if(played.has(p.finale_id))return {mode:'hybrid',terminal:true,candidates:[],blocked:null,resolved:played.size,min:p.min_councils,max:p.max_councils};
 const remaining=s.scenario.dilemmas.filter(d=>unlocked.has(d.id)&&!played.has(d.id)&&d.id!==p.finale_id);
 const required=remaining.filter(d=>d.access.category==='required');
 let eligible=remaining.filter(d=>conditionsMatch(d.access.conditions,s));
 const regularSlots=p.max_councils-1-played.size;
 // Reserve room for unlocked required chapters and one final council.
 if(regularSlots<=required.length)eligible=eligible.filter(d=>d.access.category==='required');
 if(regularSlots<=0)eligible=[];
 let candidates=eligible.map(d=>({id:d.id,title:d.title,category:d.access.category,priority:d.access.priority}));
 if(played.size>=p.min_councils-1&&required.length===0)candidates.push({id:p.finale_id,title:s.scenario.dilemmas.find(d=>d.id===p.finale_id).title,category:'finale',priority:0});
 candidates.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
 return {mode:'hybrid',terminal:false,candidates,blocked:candidates.length?null:'Aucun dilemme admissible : conditions ou budget incompatibles. Vérifier le scénario.',resolved:played.size,min:p.min_councils,max:p.max_councils};
}
function hash(str){let n=2166136261;for(const c of str)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;}
export function chooseNarrativeNext(s,requested){
 const reserve=narrativeReserve(s);
 if(reserve.terminal)return null;
 if(reserve.blocked)throw new Error(reserve.blocked);
 if(requested!==undefined){
  if(typeof requested!=='string'||!reserve.candidates.some(c=>c.id===requested))throw new Error('Ce dilemme n’est pas admissible');
  return requested;
 }
 // Prefer regular chapters; the finale is reached at the budget cap or when
 // the admissible reserve is exhausted after the configured minimum.
 const regular=reserve.candidates.filter(c=>c.category!=='finale');
 if(!regular.length)return reserve.candidates[0].id;
 const top=regular.filter(c=>c.priority===regular[0].priority);
 const seed=s.id+'|'+s.revealedHistory.map(h=>h.id+':'+h.winner).join('|');
 return top[hash(seed)%top.length].id;
}
export function narrativeEpilogue(s){
 if(!isHybrid(s.scenario))return null;
 const fragments=s.scenario.scenario.progression.ending_fragments??[];
 return {title:'La ville après le Conseil',paragraphs:fragments.filter(f=>conditionsMatch(f.conditions,s)).map(f=>f.text),
  decisions:s.revealedHistory.map(h=>({id:h.id,title:h.title,winner:h.winner})),city:structuredClone(s.game.city)};
}
