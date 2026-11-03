"use strict";
const $=id=>document.getElementById(id);
let catalog=null,authSDK=null;
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
  state(catalog.scenarios.length+" scénario(s), "+catalog.skins.length+" skin(s).","success");
  autoSkin();
 }catch(e){state(e.message,"error");}
 finally{$("load").disabled=false;}
});
function autoSkin(){
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
 const payload={scenarioId:$("scenario").value,skinId:$("skin").value,members};
 state("Vérification de la configuration…");
 try{
  const p=await api("/api/founders/preview","POST",payload);
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
