import {renderPanoramaSvg} from './hotspring-panorama.js';
import {mountWorkspace,rememberAccess} from './founders-workspace.js';
import {mountCity,updateCity} from './founders-city-scene.js';
import {TEAM_COLORS,DEFAULT_TEAM_NAMES,DEFAULT_TEAM_COLORS,teamCaption} from './founders-identity.js';
"use strict";
const $=id=>document.getElementById(id);
let catalog=null,authSDK=null,selectedPreview=null;
const state=(message,type="info")=>{$("status").textContent=message;$("status").dataset.type=type;};
async function api(path,method="GET",payload){
 const key=authSDK?await authSDK.currentToken():$("token").value.trim();
 if(!key)throw new Error("Connexion régie requise.");
 const opts={method,headers:{Authorization:"Bearer "+key}};
 if(payload!==undefined){opts.headers["Content-Type"]="application/json";opts.body=JSON.stringify(payload);}
 const response=await fetch(path,opts);
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||"Requête refusée");
 return data;
}
function fill(select,items,title){
 select.replaceChildren();
 for(const item of items){
  const option=document.createElement("option");
  option.value=item.id;
  option.textContent=item.title+" · "+item.version+(item.status==="prototype"?" (prototype)":"");
  select.append(option);
 }
 if(!items.length){const option=document.createElement("option");option.textContent=title;option.value="";select.append(option);}
}
$("load").addEventListener("click",async()=>{
 $("load").disabled=true;state("Chargement des catalogues…");
 try{
  catalog=await api("/api/founders/catalog");
  loadGoalPresets(catalog.goalCardPresets,catalog.scoreRulesPreset,catalog.calibrationPreset);
  fill($("scenario"),catalog.scenarios,"Aucun scénario");
  fill($("skin"),catalog.skins,"Aucune skin");
  $("config").hidden=!(catalog.scenarios.length&&catalog.skins.length);
  $("preview").hidden=true;$("empty").hidden=false;
  selectedPreview=null;
  state(catalog.scenarios.length+" scénario(s), "+catalog.skins.length+" skin(s).","success");
  const requested=new URLSearchParams(location.search).get('scenario');
  if(catalog.scenarios.some(s=>s.id===requested))$('scenario').value=requested;
  else if(catalog.scenarios.some(s=>s.id==='hot-spring-reserve-hybride'))$('scenario').value='hot-spring-reserve-hybride';
  autoSkin();
  $('load').textContent='Actualiser mon espace';
  await workspace.refresh();
 }catch(e){state(e.message,"error");}
 finally{$("load").disabled=false;}
});
function versionsForSelectedStory(){
 const story=catalog?.scenarios?.find(s=>s.id===$('scenario').value);
 const select=$('scenarioVersion');select.replaceChildren();
 for(const version of story?.releases??[]){
  const opt=document.createElement('option');opt.value=version;opt.textContent='Version '+version;select.append(opt);
 }
 if(story?.version)select.value=story.version;
}
function autoSkin(){
 versionsForSelectedStory();
 if(!catalog)return;
 const story=catalog.scenarios.find(s=>s.id===$("scenario").value);
 const matching=catalog.skins.find(s=>s.universe===story?.universe);
 if(matching)$("skin").value=matching.id;
 syncV2Setup();
}
$("scenario").addEventListener("change",autoSkin);
$("config").addEventListener("submit",async event=>{
 event.preventDefault();
 const members=$("members").value.split(",").map(n=>Number(n.trim()));
 if(members.length!==Number($("familyCount").value)||members.some(n=>!Number.isInteger(n)||n<1||n>300)){
  state("Indiquer un effectif entier par famille active (1 à 300).","error");return;
 }
 const payload={scenarioId:$("scenario").value,scenarioVersion:$("scenarioVersion").value,skinId:$("skin").value,members,calibration:collectCalibration()};
 state("Vérification de la configuration…");
 try{
  const p=await api("/api/founders/preview","POST",payload);
  selectedPreview=payload;
  $('createNarrative').disabled=false;
  $('createdGame').hidden=true;
  $("empty").hidden=true;$("preview").hidden=false;
  $("storyTitle").textContent=p.scenario.scenario.title;
  $("storyInfo").textContent=p.scenario.scenario.location+" · "+p.scenario.scenario.year+" · version "+p.selection.scenarioVersion;
  $("skinTitle").textContent=p.skin.title;
  $("skinInfo").textContent=p.skin.description+" · version "+p.selection.skinVersion;
  const scene=$('skinPreview');
  if(p.scenario.campaign){
   scene.innerHTML=renderPanoramaSvg({layers:[],scars:[],river:'claire',vegetation:'abondante',townX:44,townY:64});
  }else{
   scene.removeAttribute('data-skin');scene.replaceChildren();
   mountCity(scene,p.skin.id);updateCity(scene,p.game.city,p.skin.id,p.skin.labels.resources);
  }
  const previewSvg=$('skinPreview').querySelector('svg');if(previewSvg)previewSvg.style.cssText='width:100%;height:100%;object-fit:contain';
  $("countDilemmas").textContent=String(p.scenario.dilemmas.length);
  $("countMembers").textContent=String(p.settings.members.reduce((a,b)=>a+b,0));
  $("warnings").replaceChildren();
  for(const warning of p.warnings){const div=document.createElement("div");div.className="warn";div.textContent=warning;$("warnings").append(div);}
  state("Aperçu calculé. Aucune partie créée ou modifiée.","success");
 }catch(e){state(e.message,"error");}
});

async function initFirebaseAuth(){
 try{
  const r=await fetch('/api/catalog',{cache:'no-store'});
  if(!r.ok)throw new Error('Configuration indisponible');
  const settings=await r.json();
  if(settings.authMode==='firebase'){
   authSDK=await import('/firebase-auth.js');
   await authSDK.configure(settings.firebaseConfig,settings.authEmulatorUrl);
   $('token').hidden=true;$('tokenLabel').hidden=true;$('googleLogin').hidden=false;
  }
 }catch(e){state('Connexion : '+e.message,'error');}
}
$('googleLogin').addEventListener('click',async()=>{
 try{
  await authSDK.login();
  $('load').click();
 }catch(e){state(e.message,'error');}
});
initFirebaseAuth();


const FAMILY_IDS=[...'ABCDEF'];
const activeFamilyIds=()=>FAMILY_IDS.slice(0,Number($('familyCount').value));
const INDICATORS=[
 ['economie','Économie'],['securite','Sécurité'],['satisfaction','Satisfaction populaire'],
 ['bien_etre','Bien-être'],['developpement','Développement'],['stabilite','Stabilité']
];
function field(section,id,label,type='text',max=0){
 const lbl=document.createElement('label');lbl.htmlFor=id;lbl.textContent=label;
 const input=document.createElement(type==='textarea'?'textarea':'input');
 input.id=id;
 if(type!=='textarea')input.type=type;
 if(type==='number'){input.min='0';input.max='10';}
 else input.maxLength=max||500;
 section.append(lbl,input);
 return input;
}
for(const id of FAMILY_IDS){
 const section=document.createElement('details');section.dataset.family=id;section.className='metric';section.style.marginTop='10px';
 const head=document.createElement('summary');head.textContent='Équipe '+TEAM_COLORS[FAMILY_IDS.indexOf(id)].label;section.append(head);
 const name=field(section,'name-'+id,'Nom de la famille','text',60);name.value=DEFAULT_TEAM_NAMES[TEAM_COLORS[FAMILY_IDS.indexOf(id)].id];name.placeholder='Choisi par les joueurs, ex. Blackwood';
 const colorLabel=document.createElement('label');colorLabel.htmlFor='color-'+id;colorLabel.textContent='Couleur de l’équipe';
 const color=document.createElement('select');color.id='color-'+id;
 for(const c of TEAM_COLORS){const option=document.createElement('option');option.value=c.id;option.textContent=c.symbol+' '+c.label;color.append(option);}
 color.value=DEFAULT_TEAM_COLORS[FAMILY_IDS.indexOf(id)];section.append(colorLabel,color);
 color.addEventListener('change',()=>{head.textContent='Équipe '+TEAM_COLORS.find(c=>c.id===color.value).label;section.style.borderLeft='4px solid '+TEAM_COLORS.find(c=>c.id===color.value).hex;});
 section.style.borderLeft='4px solid '+TEAM_COLORS[FAMILY_IDS.indexOf(id)].hex;
 const updateHeading=()=>{head.textContent=(name.value.trim()||'Famille '+id)+' · '+TEAM_COLORS.find(c=>c.id===color.value).label;};
 name.addEventListener('input',updateHeading);color.addEventListener('change',updateHeading);updateHeading();
 const countLabel=document.createElement('label');countLabel.htmlFor='memberCount-'+id;countLabel.textContent=DEFAULT_TEAM_NAMES[TEAM_COLORS[FAMILY_IDS.indexOf(id)].id];
 const count=document.createElement('input');count.id='memberCount-'+id;count.type='number';count.min='1';count.max='300';count.required=true;count.value='5';countLabel.append(count);$('memberCounts').append(countLabel);
 count.addEventListener('input',()=>{$('members').value=activeFamilyIds().map(f=>$('memberCount-'+f).value).join(',');$('members').dispatchEvent(new Event('change'));});
 field(section,'goalTitle-'+id,'Titre de l’ambition secrète','text',120);
 field(section,'goal-'+id,'Contexte secret de la famille','textarea',500);
 const metricLabel=document.createElement('label');metricLabel.htmlFor='goalIndicator-'+id;metricLabel.textContent='Indicateur à influencer';
 const metric=document.createElement('select');metric.id='goalIndicator-'+id;
 for(const [value,title] of INDICATORS){const o=document.createElement('option');o.value=value;o.textContent=title;metric.append(o);}
 section.append(metricLabel,metric);
 const directionLabel=document.createElement('label');directionLabel.htmlFor='goalDirection-'+id;directionLabel.textContent='Orientation de l’objectif';
 const direction=document.createElement('select');direction.id='goalDirection-'+id;
 for(const [value,title] of [['at_least','Faire monter cet indicateur'],['at_most','Faire baisser cet indicateur']]){
  const o=document.createElement('option');o.value=value;o.textContent=title;direction.append(o);
 }
 section.append(directionLabel,direction);
 field(section,'firstTarget-'+id,'Seuil du palier 1 (0 à 10)','number');
 field(section,'secondTarget-'+id,'Seuil du palier 2, plus exigeant (0 à 10)','number');
 $('familySettings').append(section);
}

function syncFamilyCount(){
 const ids=activeFamilyIds();
 for(const id of FAMILY_IDS){
  const active=ids.includes(id),count=$('memberCount-'+id);
  count.parentElement.hidden=!active;count.disabled=!active;
  const section=$('familySettings').querySelector('[data-family="'+id+'"]');section.hidden=!active;
  for(const input of section.querySelectorAll('input,select,textarea'))input.disabled=!active;
 }
 $('members').value=ids.map(id=>$('memberCount-'+id).value).join(',');
 selectedPreview=null;$('preview').hidden=true;$('empty').hidden=false;$('createdGame').hidden=true;
 $('createNarrative').disabled=false;
}
$('familyCount').addEventListener('change',syncFamilyCount);
syncFamilyCount();
function loadGoalPresets(cards,rules,calibration){
 if(!cards||!rules)return;
 for(const id of FAMILY_IDS){
  const card=cards[id];if(!card)continue;
  $('goalTitle-'+id).value=card.title;
  $('goal-'+id).value=card.description;
  $('goalIndicator-'+id).value=card.indicator;
  $('goalDirection-'+id).value=card.direction;
  $('firstTarget-'+id).value=card.firstTarget;
  $('secondTarget-'+id).value=card.secondTarget;
 }
 const settings={secretFirst:rules.secretFirst,secretSecond:rules.secretSecond,
  councilEvery:rules.councilVotesPerPoint,councilMax:rules.councilPointsMax,
  money1:rules.wealthTiers[0][0],money2:rules.wealthTiers[1][0],money3:rules.wealthTiers[2][0],
  power1:rules.influenceTiers[0][0],power2:rules.influenceTiers[1][0]};
 for(const [id,value] of Object.entries(settings))$(id).value=value;
 if(calibration){$('initPower').value=calibration.initialPower;$('initDollars').value=calibration.initialDollars;$('initPool').value=calibration.initialPool;
  for(const [k,value] of Object.entries(calibration.city))$('city_'+k).value=value;
 }
}
function collectCalibration(){
 const city={};
 for(const k of (isV2Setup()?['economie','ecologie','securite','demographie']:['economie','securite','satisfaction','bien_etre','developpement','stabilite']))city[k]=Number($('city_'+k).value);
 return {initialPower:Number($('initPower').value),
  initialDollars:Number($('initDollars').value),
  initialPool:Number($('initPool').value),city};
}
function collectGoalCards(){
 return Object.fromEntries(FAMILY_IDS.map(id=>[id,{
  id:'F_'+id,
  title:$('goalTitle-'+id).value.trim(),
  description:$('goal-'+id).value.trim(),
  indicator:$('goalIndicator-'+id).value,
  direction:$('goalDirection-'+id).value,
  firstTarget:Number($('firstTarget-'+id).value),
  secondTarget:Number($('secondTarget-'+id).value)
 }]));
}
function collectScoreRules(){
 return {version:'founders-score-v2.6',
  secretFirst:Number($('secretFirst').value),secretSecond:Number($('secretSecond').value),
  councilVotesPerPoint:Number($('councilEvery').value),councilPointsMax:Number($('councilMax').value),
  wealthTiers:[[Number($('money1').value),1],[Number($('money2').value),2],[Number($('money3').value),3]],
  influenceTiers:[[Number($('power1').value),1],[Number($('power2').value),2]]
 };
}

for(const el of ['scenario','scenarioVersion','skin','members','initPower','initDollars','initPool',
 ...['economie','securite','satisfaction','bien_etre','developpement','stabilite'].map(k=>'city_'+k)]){
 $(el).addEventListener('change',()=>{
  selectedPreview=null;$('preview').hidden=true;$('empty').hidden=false;
 });
}
$('createNarrative').addEventListener('click',async()=>{
 if(!selectedPreview){state('Prévisualisez la sélection avant de créer la partie.','error');return;}
 const names=activeFamilyIds().map(id=>$('name-'+id).value.trim());
 const colors=activeFamilyIds().map(id=>$('color-'+id).value);
 if(new Set(colors).size!==activeFamilyIds().length){state('Choisissez une couleur différente pour chaque équipe.','error');return;}
 const objectives=activeFamilyIds().map(id=>$('goal-'+id).value.trim());
 const goalCards=collectGoalCards(),scoreRules=collectScoreRules();
 const code=$('gameCode').value.trim(),title=$('gameTitle').value.trim();
 const button=$('createNarrative');button.disabled=true;state('Création de la session…');
 try{
  const result=await api('/api/founders/sessions','POST',{...selectedPreview,code,title,names,colors,objectives,goalCards,scoreRules,...(campaignSetup()?{crisisMode:$('crisisMode').value}:{})});
  rememberAccess(result);
  if(!authSDK)sessionStorage.setItem('pacte-founder-organizer-key',$('token').value.trim());
  const links=$('createdLinks');links.replaceChildren();
  const append=(label,path)=>{
   const url=new URL(path,location.origin);
   const el=document.createElement('div');el.className='card';el.style.padding='9px';
   const a=document.createElement('a');a.href=url.href;a.textContent=label;a.target=path.startsWith('/founders-regie.html')?'_self':'_blank';a.rel='noopener';
   el.append(a);links.append(el);
  };
  append('Ouvrir la régie de la partie','/founders-regie.html?session='+result.id);
  append('Ouvrir la projection publique','/founders-city.html?session='+result.id);
  for(const a of result.access){
   const path='/founders-family.html?session='+result.id+'&family='+a.family+'#token='+encodeURIComponent(a.token);
   const i=FAMILY_IDS.indexOf(a.family);append('Accès privé porte-parole : '+teamCaption({name:names[i],color:TEAM_COLORS.find(c=>c.id===colors[i])}),path);
  }
  $('createdGame').hidden=false;
  $('createdGame').scrollIntoView({behavior:'smooth',block:'center'});
  await workspace.refresh();
  button.disabled=true;
  state('Session '+result.code+' créée : '+result.access.length+' liens privés prêts à être distribués.','success');
 }catch(e){state(e.message,'error');button.disabled=false;}
});


$('simulatePolicies').addEventListener('click',async()=>{
 if(!selectedPreview){state('Prévisualisez le scénario avant de lancer le laboratoire.','error');return;}
 const button=$('simulatePolicies');button.disabled=true;
 state('Simulation des décisions, des mises et des transactions financières…');
 try{
  const data=await api('/api/founders/scoring/simulate','POST',{
   ...selectedPreview,goalCards:collectGoalCards(),scoreRules:collectScoreRules(),
   runs:Number($('labRuns').value),mode:$('labMode').value,seed:20261103
  });
  const panel=$('labRows');panel.replaceChildren();
  for(const id of activeFamilyIds()){
   const f=data.families[id];
   const row=document.createElement('div');row.className='metric';row.style.marginTop='7px';
   const title=document.createElement('strong');title.textContent='Famille '+id;
   const body=document.createElement('p');body.className='note';
   body.textContent=f.wins+' victoire(s) sur '+data.completed+' parties terminées · '+
     'score moyen '+f.meanPoints+' pts · objectifs '+f.meanGoalPoints+
     ' pts · dollars finaux '+f.meanFinalDollars+' · Influence finale '+f.meanFinalInfluence;
   row.append(title,body);panel.append(row);
  }
  $('labSummary').textContent='Répétitions : '+data.attempts+' ; terminées : '+data.completed+
    ' ; bloquées/incomplètes : '+data.failed+'. Moyenne : '+data.meanCouncils+
    ' dilemmes, '+data.meanVoteActionsPerCouncil+' actions par vote, '+data.meanOffersAcceptedPerGame+
    ' transactions simulées. Résultats de stratégies artificielles uniquement — aucun pronostic humain.';
  $('labResults').hidden=false;
  state('Simulation terminée. Résultats exploratoires à comparer aux tests humains.','success');
 }catch(e){state('Laboratoire : '+e.message,'error');}
 finally{button.disabled=false;}
});

$('analyzeGoals').addEventListener('click',async()=>{
 if(!selectedPreview){state('Prévisualisez d’abord le scénario et la skin.','error');return;}
 const button=$('analyzeGoals');button.disabled=true;
 state('Analyse des embranchements du scénario…');
 try{
  const result=await api('/api/founders/scoring/analyze','POST',{
   ...selectedPreview,goalCards:collectGoalCards()
  });
  const area=$('goalAnalysisRows');area.replaceChildren();
  for(const id of activeFamilyIds()){
   const g=result.goals[id];
   const row=document.createElement('div');row.className='metric';row.style.marginTop='8px';
   const title=document.createElement('strong');title.textContent=id+' · '+g.title;
   const detail=document.createElement('p');detail.className='note';
   const percent=x=>x===null?'—':(x*100).toFixed(1)+' %';
   detail.textContent='Palier 1 : '+g.first+'/'+result.endings+' fins ('+percent(g.firstShare)+
    ') · Palier 2 : '+g.second+'/'+result.endings+' fins ('+percent(g.secondShare)+')';
   row.append(title,detail);area.append(row);
  }
  $('analysisSummary').textContent=result.endings+' fins explorées'+
   (result.truncated?' · Limite d’exploration atteinte':'')+
   (result.invalidPaths?' · '+result.invalidPaths+' chemins invalides':'')+
   '. Résultats combinatoires : pas des probabilités humaines.';
  $('goalAnalysis').hidden=false;
  state('Analyse terminée. Modifie les seuils puis relance si nécessaire.','success');
 }catch(e){state(e.message,'error');}
 finally{button.disabled=false;}
});

const workspace=mountWorkspace({api,getCatalog:()=>catalog,
 collect:()=>({scenarioId:$('scenario').value,scenarioVersion:$('scenarioVersion').value,skinId:$('skin').value,
 members:$('members').value.split(',').map(Number),calibration:collectCalibration(),
 names:activeFamilyIds().map(id=>$('name-'+id).value.trim()),colors:activeFamilyIds().map(id=>$('color-'+id).value),
 objectives:activeFamilyIds().map(id=>$('goal-'+id).value.trim()),goalCards:collectGoalCards(),scoreRules:collectScoreRules(),...(campaignSetup()?{crisisMode:$('crisisMode').value}:{})}),
 apply:config=>{
  $('scenario').value=config.scenarioId;autoSkin();$('scenarioVersion').value=config.scenarioVersion;syncV2Setup();$('skin').value=config.skinId;
  $('familyCount').value=String(config.members.length);syncFamilyCount();$('members').value=config.members.join(',');activeFamilyIds().forEach((id,i)=>$('memberCount-'+id).value=config.members[i]);loadGoalPresets(config.goalCards,config.scoreRules,config.calibration);
  if(campaignSetup())$('crisisMode').value=config.crisisMode??'standard';
  activeFamilyIds().forEach((id,i)=>{$('name-'+id).value=config.names[i];$('color-'+id).value=config.colors[i];$('color-'+id).dispatchEvent(new Event('change'));$('goal-'+id).value=config.objectives[i];});
  selectedPreview=null;$('preview').hidden=true;$('empty').hidden=false;$('gameCode').value='P'+crypto.randomUUID().replaceAll('-','').slice(0,7).toUpperCase();
  $('createNarrative').disabled=false;$('config').requestSubmit();
 }});
$('gameCode').value='P'+crypto.randomUUID().replaceAll('-','').slice(0,7).toUpperCase();

const campaignSetup=()=>$('scenario').value==='les-colons-de-hotspring';
const legacyNote=$('familySetupNote').textContent;
let usedCampaignNames=false;
function isV2Setup(){return campaignSetup()|| $('scenario').value==='hot-spring-reserve-hybride'&&$('scenarioVersion').value==='2.0.0';}
function syncV2Setup(){
 if(!catalog)return;const v2=isV2Setup(),campaign=campaignSetup(),changingCampaign=usedCampaignNames!==campaign;
 const count=$('familyCount');
 if(campaign)count.value='5';
 count.disabled=campaign;
 $('legacyScoring').hidden=campaign;$('crisisModeField').hidden=!campaign;
 $('familySetupNote').textContent=campaign?'Cinq familles, ressources égales et objectifs confidentiels. Score maximal de 15 points.':legacyNote;
 syncFamilyCount();
 const familyNames=catalog.scenarios.find(s=>s.id===$('scenario').value)?.familyNames;
 for(const [i,id] of FAMILY_IDS.entries()){
  if(changingCampaign){
   $('name-'+id).value=familyNames?.[i]??DEFAULT_TEAM_NAMES[DEFAULT_TEAM_COLORS[i]];
   $('name-'+id).dispatchEvent(new Event('input'));
  }
  const settings=$('name-'+id).closest('details');
  const keep=['name-'+id,'color-'+id];
  for(const control of settings.querySelectorAll('input,textarea,select')){
   if(keep.includes(control.id))continue;
   control.hidden=campaign;
   const label=settings.querySelector('label[for="'+control.id+'"]');if(label)label.hidden=campaign;
  }
  const countLabel=$('memberCount-'+id).parentElement;
  countLabel.firstChild.textContent=campaign?familyNames?.[i]??'Famille '+id:DEFAULT_TEAM_NAMES[DEFAULT_TEAM_COLORS[i]];
 }
 if(changingCampaign)$('gameTitle').value=campaign?'Les Colons de Hotspring — Campagne':'Le Pacte des Fondateurs — Répétition';
 usedCampaignNames=campaign;
 for(const k of ['economie','ecologie','securite','demographie','satisfaction','bien_etre','developpement','stabilite']){const input=$('city_'+k);if(input){const visible=v2?['economie','ecologie','securite','demographie'].includes(k):!['ecologie','demographie'].includes(k);input.parentElement.hidden=!visible;input.disabled=!visible;}}
 for(const id of FAMILY_IDS)for(const o of $('goalIndicator-'+id).options){const valid=v2?['economie','ecologie','securite','demographie'].includes(o.value):!['ecologie','demographie'].includes(o.value);o.hidden=!valid;o.disabled=!valid;}
 loadGoalPresets(v2?catalog.goalCardPresetsV2:catalog.goalCardPresets,catalog.scoreRulesPreset,v2?catalog.calibrationPresetV2:catalog.calibrationPreset);
 selectedPreview=null;$('preview').hidden=true;$('empty').hidden=false;
}
for(const [key,label] of [['ecologie','Écologie'],['demographie','Démographie']]){
 const original=$('city_economie').parentElement;
 // Calibration labels are plain labels with an input; build a clean replacement.
 const wrapper=document.createElement('label');wrapper.textContent=label;const number=document.createElement('input');number.id='city_'+key;number.type='number';number.min='0';number.max='10';number.value='5';wrapper.append(number);original.parentElement.append(wrapper);wrapper.hidden=true;
 for(const id of FAMILY_IDS){const option=document.createElement('option');option.value=key;option.textContent=label;$('goalIndicator-'+id).append(option);}
}
$('scenarioVersion').addEventListener('change',syncV2Setup);
