/**
 * Le Pacte V2.4: strict, dependency-free conversion from four Google Sheets
 * value ranges into the Founders story JSON contract. No eval/formulas/network.
 * Inputs are value matrices read with UNFORMATTED_VALUE by an organizer client.
 */
import {validateFoundersStory} from './founders-library.ts';

const HEADER={
 Parametres:['clé','valeur'],
 Dilemmes:['id','chapitre','titre','contexte_public','question_vote','libelle_pour','libelle_contre','consequence_pour','consequence_contre','image_url','image_alt','credit_image','licence_image','statut','tags','notes_auteur'],
 Effets:['dilemme_id','issue','indicateur','operation','valeur','note_interne'],
 Branches:['dilemme_id','issue','suivant_id','priorite','note_interne']
};
const sizes={Parametres:50,Dilemmes:501,Effets:10001,Branches:1001};
const CHRONICLE_COLUMNS=['image_resolution_pour','image_resolution_contre','titre_chronique_pour','titre_chronique_contre','resume_chronique_pour','resume_chronique_contre'];
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const blank=x=>x===undefined||x===null||x==='';
const value=x=>blank(x)?'':String(x).trim();
const issue=x=>['pour','contre'].includes(x);
const statuses={prototype:'prototype',actif:'active',archive:'archived'};
const stringSafe=(x,max)=>typeof x==='string'&&x.length<=max;
export function parseFoundersSheets(tabs){
 const errors=[],warnings=[];
 if(!isObject(tabs))return {valid:false,errors:['Onglets : objet requis'],warnings,story:null,counts:null};
 const rows={};
 for(const [name,headers] of Object.entries(HEADER)){
  const all=tabs[name];
  if(!Array.isArray(all)||all.length<1||all.length>sizes[name]||all.some(r=>!Array.isArray(r)||r.length>headers.length+(name==='Dilemmes'?CHRONICLE_COLUMNS.length:0)+3||r.some(c=>typeof c!=='string'&&typeof c!=='number'&&typeof c!=='boolean'&&c!==null))){
   errors.push(name+': plage absente, trop grande ou valeur invalide');continue;
  }
  const first=all[0].map(value);
  for(const h of headers)if(!first.includes(h))errors.push(name+': colonne manquante '+h);
  if(new Set(first.filter(Boolean)).size!==first.filter(Boolean).length)errors.push(name+': colonnes dupliquées');
  const readable=name==='Dilemmes'?[...headers,...CHRONICLE_COLUMNS]:headers;
  const positions=Object.fromEntries(readable.map(h=>[h,first.indexOf(h)]));
  rows[name]=all.slice(1).map((r,i)=>{
   const obj={_row:i+2};
   for(const h of readable)obj[h]=positions[h]===-1?'':r[positions[h]]??'';
   return obj;
  }).filter(o=>headers.some(h=>!blank(o[h])&&value(o[h])!==''));
 }
 if(errors.length)return {valid:false,errors,warnings,story:null,counts:null};
 const params={};
 for(const r of rows.Parametres){
  const key=value(r['clé']);
  if(!key)continue;
  if(Object.hasOwn(params,key))errors.push('Parametres!A'+r._row+': clé répétée '+key);
  params[key]=r['valeur'];
 }
 const requiredParams=['schema_version','scenario_id','titre','univers','lieu','annee','point_entree','statut'];
 for(const p of requiredParams)if(blank(params[p]))errors.push('Parametres: valeur manquante '+p);
 const effects=new Map(),branches=new Map();
 for(const r of rows.Effets){
  const id=value(r.dilemme_id),side=value(r.issue),k=id+'|'+side,row='Effets!'+r._row;
  if(!issue(side))errors.push(row+': issue POUR/CONTRE invalide');
  const indicator=value(r.indicateur),op=value(r.operation);
  const effect={indicator,operation:op};
  if(op==='delta'){
   const raw=value(r.valeur);
   if(!/^-?\d+$/.test(raw))errors.push(row+': valeur entière requise');
   else effect.value=Number(raw);
  }else if(!blank(r.valeur))errors.push(row+': valeur interdite pour '+op);
  if(!effects.has(k))effects.set(k,[]);
  effects.get(k).push(effect);
 }
 for(const r of rows.Branches){
  const id=value(r.dilemme_id),side=value(r.issue),k=id+'|'+side,row='Branches!'+r._row;
  if(!issue(side))errors.push(row+': issue invalide');
  if(branches.has(k))errors.push(row+': issue déjà définie '+k);
  if(!value(r.suivant_id))errors.push(row+': destination requise (ou FIN)');
  branches.set(k,value(r.suivant_id));
 }
 const dilemmas=[],ids=new Set(),validRef=new Set();
 for(const r of rows.Dilemmes){
  const id=value(r.id),row='Dilemmes!'+r._row;
  if(!id){errors.push(row+': identifiant requis');continue}
  if(ids.has(id))errors.push(row+': identifiant dupliqué '+id);
  ids.add(id);validRef.add(id);
  const chapter=Number(value(r.chapitre));
  if(!Number.isInteger(chapter)||chapter<1||chapter>100)errors.push(row+': chapitre entier entre 1 et 100');
  const status=statuses[value(r.statut)];
  if(!status)errors.push(row+': statut prototype/actif/archive requis');
  const u=value(r.image_url);
  if(!u)warnings.push(row+': aucune image associée au dilemme '+id);
  if(u&&(!/^https:\/\/[^\s<>]+$/i.test(u)||u.length>2048))errors.push(row+': image_url HTTPS invalide');
  const notes=[];
  for(const side of ['pour','contre']){
   const k=id+'|'+side;
   if(!branches.has(k))errors.push(row+': branche '+side+' manquante dans Branches');
   const next=branches.get(k);
   notes.push([side,{
     narration:value(r['consequence_'+side]),
     effects:effects.get(k)||[],
     next_id:next==='FIN'?null:next
   }]);
   const title=value(r['titre_chronique_'+side]),summary=value(r['resume_chronique_'+side]),imageUrl=value(r['image_resolution_'+side]);
   if(title||summary||imageUrl){
    const c={};if(title)c.title=title;if(summary)c.summary=summary;
    if(imageUrl)c.image={url:imageUrl,alt:title||value(r.titre),credit:value(r.credit_image)||null,license:value(r.licence_image)||null};
    notes.at(-1)[1].chronicle=c;
   }
  }
  const statusTags=value(r.tags).split(';').map(s=>s.trim()).filter(Boolean);
  const d={
   id,chapter,title:value(r.titre),public_text:value(r.contexte_public),vote_question:value(r.question_vote),
   labels:{pour:value(r.libelle_pour),contre:value(r.libelle_contre)},
   outcomes:Object.fromEntries(notes),
   image:{url:u||null,alt:value(r.image_alt),credit:value(r.credit_image)||null,license:value(r.licence_image)||null},
   status,tags:statusTags
  };
  for(const [k,limit] of [['title',200],['public_text',5000],['vote_question',1000]])
   if(!stringSafe(d[k],limit))errors.push(row+': '+k+' dépasse '+limit+' caractères');
  dilemmas.push(d);
 }
 for(const [k] of effects)if(!['pour','contre'].includes(k.split('|').at(-1))||!validRef.has(k.split('|').slice(0,-1).join('|')))errors.push('Effets: référence orpheline '+k);
 for(const [k,next] of branches)if(!['pour','contre'].includes(k.split('|').at(-1))||!validRef.has(k.split('|').slice(0,-1).join('|')))errors.push('Branches: référence orpheline '+k);
 for(const [k,next] of branches)if(next!=='FIN'&&!validRef.has(next))errors.push('Branches: destination inexistante '+k+' → '+next);
 const story={
  schema_version:value(params.schema_version),
  scenario:{
   id:value(params.scenario_id),title:value(params.titre),universe:value(params.univers),
   location:value(params.lieu),year:Number(value(params.annee)),
   entry_dilemma:value(params.point_entree),status:statuses[value(params.statut)]||value(params.statut)
  },
  dilemmas
 };
 for(const problem of validateFoundersStory(story))errors.push('Scénario: '+problem);
 const uniqueErrors=[...new Set(errors)];
 return {valid:uniqueErrors.length===0,errors:uniqueErrors,warnings,story:uniqueErrors.length?null:story,
  counts:{dilemmas:dilemmas.length,effects:rows.Effets.length,branches:rows.Branches.length,missingImages:warnings.length}};
}
export const FOUNDERS_SHEETS_TABS=Object.freeze(Object.keys(HEADER));
export const FOUNDERS_SHEETS_HEADERS=Object.freeze(HEADER);
export const FOUNDERS_CHRONICLE_COLUMNS=Object.freeze(CHRONICLE_COLUMNS);
