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
  fill($("scenario"),catalog.scenarios,"Aucun scénario");
  fill($("skin"),catalog.skins,"Aucune skin");
  $("config").hidden=!(catalog.scenarios.length&&catalog.skins.length);
  $("preview").hidden=true;$("empty").hidden=false;
  selectedPreview=null;
  state(catalog.scenarios.length+" scénario(s), "+catalog.skins.length+" skin(s).","success");
  autoSkin();
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
}
$("scenario").addEventListener("change",autoSkin);
$("config").addEventListener("submit",async event=>{
 event.preventDefault();
 const members=$("members").value.split(",").map(n=>Number(n.trim()));
 if(members.length!==6||members.some(n=>!Number.isInteger(n)||n<1||n>300)){
  state("Indiquer exactement six effectifs entiers (1 à 300).","error");return;
 }
 const payload={scenarioId:$("scenario").value,scenarioVersion:$("scenarioVersion").value,skinId:$("skin").value,members};
 state("Vérification de la configuration…");
 try{
  const p=await api("/api/founders/preview","POST",payload);
  selectedPreview=payload;
  $('createdGame').hidden=true;
  $("empty").hidden=true;$("preview").hidden=false;
  $("storyTitle").textContent=p.scenario.scenario.title;
  $("storyInfo").textContent=p.scenario.scenario.location+" · "+p.scenario.scenario.year+" · version "+p.selection.scenarioVersion;
  $("skinTitle").textContent=p.skin.title;
  $("skinInfo").textContent=p.skin.description+" · version "+p.selection.skinVersion;
  $("skinPreview").style.background=p.skin.theme.accent;
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


const DEFAULT_GOALS=[
 'Objectif de test : faire atteindre au moins 7/10 à l’Économie.',
 'Objectif de test : conserver au moins 15 dollars en fin de partie.',
 'Objectif de test : faire atteindre au moins 7/10 à la Sécurité.',
 'Objectif de test : faire atteindre au moins 7/10 à la Satisfaction.',
 'Objectif de test : faire atteindre au moins 7/10 au Bien-être.',
 'Objectif de test : faire atteindre au moins 7/10 au Développement.'
];
for(let i=0;i<6;i++){
 const id='ABCDEF'[i],section=document.createElement('div');
 section.className='metric';section.style.marginTop='10px';
 const head=document.createElement('strong');head.textContent='Famille '+id;section.append(head);
 const nameLabel=document.createElement('label');nameLabel.htmlFor='name-'+id;nameLabel.textContent='Nom de la famille';
 const name=document.createElement('input');name.id='name-'+id;name.maxLength=60;name.value='Famille '+id;
 const goalLabel=document.createElement('label');goalLabel.htmlFor='goal-'+id;goalLabel.textContent='Objectif secret (prototype)';
 const goal=document.createElement('textarea');goal.id='goal-'+id;goal.maxLength=500;goal.value=DEFAULT_GOALS[i];
 goal.style.width='100%';goal.style.minHeight='55px';
 section.append(nameLabel,name,goalLabel,goal);
 $('familySettings').append(section);
}
for(const el of ['scenario','scenarioVersion','skin','members']){
 $(el).addEventListener('change',()=>{
  selectedPreview=null;$('preview').hidden=true;$('empty').hidden=false;
 });
}
$('createNarrative').addEventListener('click',async()=>{
 if(!selectedPreview){state('Prévisualisez la sélection avant de créer la partie.','error');return;}
 const names=[...'ABCDEF'].map(id=>$('name-'+id).value.trim());
 const objectives=[...'ABCDEF'].map(id=>$('goal-'+id).value.trim());
 const code=$('gameCode').value.trim(),title=$('gameTitle').value.trim();
 const button=$('createNarrative');button.disabled=true;state('Création de la session…');
 try{
  const result=await api('/api/founders/sessions','POST',{...selectedPreview,code,title,names,objectives});
  if(!authSDK)sessionStorage.setItem('pacte-founder-organizer-key',$('token').value.trim());
  const links=$('createdLinks');links.replaceChildren();
  const append=(label,path)=>{
   const url=new URL(path,location.origin);
   const el=document.createElement('div');el.className='card';el.style.padding='9px';
   const a=document.createElement('a');a.href=url.href;a.textContent=label;a.target='_blank';a.rel='noopener';
   el.append(a);links.append(el);
  };
  append('Ouvrir la régie de la partie','/founders-regie.html?session='+result.id);
  append('Ouvrir la projection publique','/founders-city.html?session='+result.id);
  for(const a of result.access){
   const path='/founders-family.html?session='+result.id+'#token='+encodeURIComponent(a.token);
   append('Accès privé porte-parole : Famille '+a.family,path);
  }
  $('createdGame').hidden=false;
  button.disabled=true;
  state('Session '+result.code+' créée : six liens privés prêts à être distribués.','success');
 }catch(e){state(e.message,'error');button.disabled=false;}
});
