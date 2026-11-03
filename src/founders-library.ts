import {nativeSkinScene} from '../public/founders-skin-theme.js';
/**
 * LE PACTE V2.3 — narrative catalogue domain, deliberately independent
 * from the legacy 33-territory edition/studio modules.
 * Pure functions, no network, storage, authentication or background imports.
 * Catalogue records are immutable by convention: APIs always return clones.
 */
import {createFoundersGame,FOUNDERS_DEFAULT_CALIBRATION,validateFoundersCalibration} from './founders.ts';

export const FOUNDERS_RESOURCE_IDS = Object.freeze([
  'economie','securite','satisfaction','bien_etre','developpement','stabilite'
]);
const OUTCOMES=['pour','contre'];
const STORY_RE=/^[a-z0-9][a-z0-9_-]{2,79}$/;
const DILEMMA_RE=/^[A-Z][A-Z0-9_-]{1,39}$/;
const VERSION_RE=/^[1-9]\d*\.\d+\.\d+$/;
const HEX_RE=/^#[0-9a-fA-F]{6}$/;
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const txt=(v,n=1,max=5000)=>typeof v==='string'&&v.trim().length>=n&&v.length<=max;
const keys=(obj,allowed)=>isObj(obj)&&Object.keys(obj).every(k=>allowed.includes(k));
const unique=a=>new Set(a).size===a.length;
const error=(condition,where,errors)=>{if(!condition)errors.push(where);};
const clone=x=>structuredClone(x);
const requireValid=(errors,label)=>{if(errors.length)throw new Error(label+': '+errors.slice(0,15).join(' ; '));};

export function validateFoundersStory(payload) {
 const errors=[];
 if(!keys(payload,['schema_version','scenario','dilemmas']))return ['Objet de scénario invalide'];
 error(payload.schema_version==='1.0.0','schema_version incompatible',errors);
 const s=payload.scenario;
 if(!keys(s,['id','title','universe','location','year','entry_dilemma','status']))errors.push('scenario : structure');
 else {
  error(STORY_RE.test(s.id),'scenario.id',errors);
  error(txt(s.title,1,200),'scenario.title',errors);
  error(txt(s.universe,1,80),'scenario.universe',errors);
  error(txt(s.location,1,100),'scenario.location',errors);
  error(Number.isInteger(s.year)&&s.year>=0&&s.year<=9999,'scenario.year',errors);
  error(DILEMMA_RE.test(s.entry_dilemma),'scenario.entry_dilemma',errors);
  error(['prototype','active','archived'].includes(s.status),'scenario.status',errors);
 }
 const ds=payload.dilemmas;
 if(!Array.isArray(ds)||ds.length<1||ds.length>500){errors.push('dilemmas : 1 à 500 requis');return errors;}
 const ids=new Set(),nexts=[];
 for(const [i,d] of ds.entries()){
  const where='dilemmas['+i+']';
  if(!keys(d,['id','chapter','title','public_text','vote_question','labels','outcomes','image','status','tags'])){errors.push(where+' : structure');continue;}
  error(DILEMMA_RE.test(d.id),where+'.id',errors);
  if(ids.has(d.id))errors.push(where+'.id dupliqué');
  ids.add(d.id);
  error(Number.isInteger(d.chapter)&&d.chapter>=1&&d.chapter<=100,where+'.chapter',errors);
  error(txt(d.title,1,200),where+'.title',errors);
  error(txt(d.public_text,10,5000),where+'.public_text',errors);
  error(txt(d.vote_question,5,1000),where+'.vote_question',errors);
  error(['prototype','active','archived'].includes(d.status),where+'.status',errors);
  error(keys(d.labels,OUTCOMES)&&OUTCOMES.every(v=>txt(d.labels[v],1,150)),where+'.labels',errors);
  if(!keys(d.image,['url','alt','credit','license']))errors.push(where+'.image : structure');
  else {
   const url=d.image.url;
   error(url===null||(typeof url==='string'&&url.length<=2048&&/^https:\/\/[^<>\s]+$/i.test(url)),where+'.image.url HTTPS',errors);
   error(typeof d.image.alt==='string'&&d.image.alt.length<=300,where+'.image.alt',errors);
   for(const f of ['credit','license'])error(d.image[f]===null||(typeof d.image[f]==='string'&&d.image[f].length<=300),where+'.image.'+f,errors);
  }
  error(Array.isArray(d.tags)&&d.tags.length<=30&&unique(d.tags)&&d.tags.every(t=>typeof t==='string'&&/^[a-z0-9_-]+$/.test(t)),where+'.tags',errors);
  if(!keys(d.outcomes,OUTCOMES)){errors.push(where+'.outcomes : structure');continue;}
  for(const outcome of OUTCOMES){
   const o=d.outcomes[outcome],path=where+'.outcomes.'+outcome;
   if(!keys(o,['narration','effects','next_id','chronicle'])){errors.push(path+' : structure');continue;}
   if(o.chronicle!==undefined){
    const c=o.chronicle;
    if(!keys(c,['title','summary','image']))errors.push(path+'.chronicle : structure');
    else {
     if(c.title!==undefined)error(txt(c.title,1,200),path+'.chronicle.title',errors);
     if(c.summary!==undefined)error(txt(c.summary,1,600),path+'.chronicle.summary',errors);
     if(c.image!==undefined){
      const i=c.image;
      error(keys(i,['url','alt','credit','license'])&&typeof i.url==='string'&&i.url.length<=2048&&/^https:\/\/[^<>\s]+$/i.test(i.url)&&txt(i.alt,1,300)&&[i.credit,i.license].every(v=>v===null||(typeof v==='string'&&v.length<=300)),path+'.chronicle.image',errors);
     }
    }
   }
   error(txt(o.narration,1,3000),path+'.narration',errors);
   error(o.next_id===null||DILEMMA_RE.test(o.next_id),path+'.next_id',errors);
   if(o.next_id!==null)nexts.push([path+'.next_id',o.next_id]);
   if(!Array.isArray(o.effects)||o.effects.length>20){errors.push(path+'.effects');continue;}
   for(const [j,e] of o.effects.entries()){
    const ep=path+'.effects['+j+']';
    if(!keys(e,['indicator','operation','value'])){errors.push(ep+' : structure');continue;}
    error(FOUNDERS_RESOURCE_IDS.includes(e.indicator),ep+'.indicator',errors);
    error(['delta','toward_center','away_from_center'].includes(e.operation),ep+'.operation',errors);
    if(e.operation==='delta')error(Number.isInteger(e.value)&&e.value>=-10&&e.value<=10,ep+'.value',errors);
    else {error(e.indicator==='stabilite',ep+'.stabilite only',errors);error(!Object.hasOwn(e,'value'),ep+'.value interdit',errors);}
   }
  }
 }
 if(s&&DILEMMA_RE.test(s.entry_dilemma))error(ids.has(s.entry_dilemma),'scenario.entry_dilemma absent',errors);
 for(const [path,id] of nexts)error(ids.has(id),path+' référence manquante '+id,errors);
 const graph=new Map(ds.filter(d=>isObj(d)&&DILEMMA_RE.test(d.id)&&isObj(d.outcomes)).map(d=>[d.id,OUTCOMES.map(x=>d.outcomes[x]?.next_id)]));
 const visited=new Set(),todo=[s?.entry_dilemma];
 while(todo.length){
  const id=todo.shift();if(!id||visited.has(id)||!graph.has(id))continue;
  visited.add(id);for(const x of graph.get(id))if(x!==null)todo.push(x);
 }
 for(const d of ds)if(d&&d.id&&!visited.has(d.id))errors.push('Dilemme inaccessible depuis le début : '+d.id);
 if(!ds.some(d=>isObj(d)&&isObj(d.outcomes)&&OUTCOMES.some(o=>d.outcomes[o]?.next_id===null)))errors.push('Aucune sortie FIN');
 return [...new Set(errors)];
}

export function validateFoundersSkin(skin) {
 const errors=[];
 if(!keys(skin,['id','version','title','universe','status','description','labels','theme','publicScene']))return ['Skin : structure'];
 error(STORY_RE.test(skin.id),'skin.id',errors);
 error(VERSION_RE.test(skin.version),'skin.version',errors);
 error(txt(skin.title,1,120),'skin.title',errors);
 error(txt(skin.universe,1,80),'skin.universe',errors);
 error(['prototype','ready','archived'].includes(skin.status),'skin.status',errors);
 error(txt(skin.description,1,500),'skin.description',errors);
 if(!keys(skin.labels,['currency','influence','resources']))errors.push('skin.labels : structure');
 else {
  error(txt(skin.labels.currency,1,60),'skin.labels.currency',errors);
  error(txt(skin.labels.influence,1,60),'skin.labels.influence',errors);
  error(keys(skin.labels.resources,FOUNDERS_RESOURCE_IDS)&&FOUNDERS_RESOURCE_IDS.every(k=>txt(skin.labels.resources[k],1,70)),'skin.labels.resources',errors);
 }
 if(!keys(skin.theme,['background','foreground','accent']))errors.push('skin.theme : structure');
 else for(const key of ['background','foreground','accent'])error(HEX_RE.test(skin.theme[key]),'skin.theme.'+key,errors);
 if(!keys(skin.publicScene,['type','baseImageUrl','variants']))errors.push('skin.publicScene : structure');
 else {
  error(['city','organization','landscape','abstract'].includes(skin.publicScene.type),'skin.publicScene.type',errors);
  const url=skin.publicScene.baseImageUrl;
  error(url===null||(typeof url==='string'&&url.length<=2048&&/^https:\/\/[^<>\s]+$/i.test(url)),'skin.publicScene.baseImageUrl',errors);
  error(Array.isArray(skin.publicScene.variants)&&skin.publicScene.variants.length===0,'skin.publicScene.variants (réservé V2.3)',errors);
 }
 return errors;
}

export function createFoundersLibrary(){
 return {kind:'founders-library-v2.3',skins:{},scenarios:{}};
}
export function registerFoundersSkin(input,skin){
 if(input.kind!=='founders-library-v2.3')throw new Error('Catalogue invalide');
 requireValid(validateFoundersSkin(skin),'Skin invalide');
 const library=clone(input),prior=Object.hasOwn(library.skins,skin.id)?library.skins[skin.id]:undefined;
 if(prior)throw new Error('Skin déjà enregistrée : '+skin.id+' (version '+prior.version+')');
 library.skins[skin.id]=clone(skin);return library;
}
export function publishFoundersScenario(input,{payload,source,version}){
 if(input.kind!=='founders-library-v2.3')throw new Error('Catalogue invalide');
 requireValid(validateFoundersStory(payload),'Scénario invalide');
 if(!VERSION_RE.test(version))throw new Error('Numéro de version sémantique requis');
 const sheetSource=keys(source,['type','spreadsheetId','label'])&&source.type==='google_sheets'&&
    typeof source.spreadsheetId==='string'&&/^[A-Za-z0-9_-]{15,160}$/.test(source.spreadsheetId);
 const demoSource=keys(source,['type','label'])&&source.type==='bundled_fixture';
 if(!(sheetSource||demoSource)||!txt(source.label,1,160))throw new Error('Source de scénario invalide');
 const library=clone(input),id=payload.scenario.id;
 const record=Object.hasOwn(library.scenarios,id)?library.scenarios[id]:{id,releases:{}};
 if(Object.hasOwn(record.releases,version))throw new Error('Version de scénario déjà publiée : '+id+'@'+version);
 record.releases[version]={version,source:clone(source),payload:clone(payload)};
 library.scenarios[id]=record;return library;
}
const cmpSemver=(a,b)=>{const aa=a.split('.').map(Number),bb=b.split('.').map(Number);return aa[0]-bb[0]||aa[1]-bb[1]||aa[2]-bb[2];};
export function listFoundersLibrary(input){
 if(input.kind!=='founders-library-v2.3')throw new Error('Catalogue invalide');
 return {
  scenarios:Object.values(input.scenarios).map(s=>{
   const versions=Object.keys(s.releases).sort(cmpSemver);
   const latest=s.releases[versions.at(-1)];
   return {id:s.id,title:latest.payload.scenario.title,universe:latest.payload.scenario.universe,
     status:latest.payload.scenario.status,version:latest.version,
     releases:versions,sourceType:latest.source.type,dilemmas:latest.payload.dilemmas.length};
  }).sort((a,b)=>a.title.localeCompare(b.title,'fr')),
  skins:Object.values(input.skins).map(s=>({
   id:s.id,title:s.title,universe:s.universe,status:s.status,version:s.version,
   sceneReady:!!s.publicScene.baseImageUrl||nativeSkinScene(s.id)
  })).sort((a,b)=>a.title.localeCompare(b.title,'fr'))
 };
}
export function prepareFoundersSession(input,{scenarioId,scenarioVersion,skinId,members=[5,5,5,5,5,5],calibration=FOUNDERS_DEFAULT_CALIBRATION}){
 if(input.kind!=='founders-library-v2.3')throw new Error('Catalogue invalide');
 const record=Object.hasOwn(input.scenarios,scenarioId)?input.scenarios[scenarioId]:undefined;
 if(!record)throw new Error('Scénario inconnu');
 const versions=Object.keys(record.releases).sort(cmpSemver);
 const selectedVersion=scenarioVersion??versions.at(-1);
 const release=Object.hasOwn(record.releases,selectedVersion)?record.releases[selectedVersion]:undefined;
 if(!release)throw new Error('Version du scénario inconnue');
 if(release.payload.scenario.status==='archived')throw new Error('Scénario archivé');
 const skin=Object.hasOwn(input.skins,skinId)?input.skins[skinId]:undefined;
 if(!skin||skin.status==='archived')throw new Error('Skin inconnue ou archivée');
 // This is only a preview. The running session persistence layer is not wired.
 const calibrationErrors=validateFoundersCalibration(calibration);
 if(calibrationErrors.length)throw new Error(calibrationErrors.join(' ; '));
 const game=createFoundersGame({members,calibration});
 const warnings=[];
 if(skin.universe!==release.payload.scenario.universe)warnings.push('Univers différent : le visuel ne traduit pas automatiquement le texte narratif.');
 if(skin.status==='prototype')warnings.push('Skin en cours de conception, affichage non final.');
 if(!skin.publicScene.baseImageUrl&&!nativeSkinScene(skin.id))warnings.push('Décor public à créer : aucune image de ville disponible.');
 if(release.payload.scenario.status==='prototype')warnings.push('Scénario de test non validé.');
 return {
  kind:'founders-session-preview-v2.3',
  previewOnly:true,
  selection:{scenarioId,scenarioVersion:release.version,skinId,skinVersion:skin.version},
  settings:{members:clone(members),calibration:clone(calibration),spokespersonVotingAccessPerFamily:1},
  scenario:clone(release.payload),
  source:clone(release.source),
  skin:clone(skin),
  game,
  warnings
 };
}
