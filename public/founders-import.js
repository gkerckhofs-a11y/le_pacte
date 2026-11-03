import {configure,currentToken,authorizeSheetsRead} from '/firebase-auth.js';
const $=id=>document.getElementById(id);
const NAMES=['Parametres','Dilemmes','Effets','Branches'];
const RANGES=['Parametres!A1:C50','Dilemmes!A1:P550','Effets!A1:F10500','Branches!A1:E1100'];
let runtime='local',googleAccess=null,current=null;
function status(msg,type=''){const e=$('state');e.textContent=msg;e.className=type;}
async function init(){
 const r=await fetch('/api/catalog',{cache:'no-store'});if(!r.ok)throw new Error('Configuration du moteur inaccessible');
 const data=await r.json();
 runtime=data.authMode;
 if(runtime==='firebase'){await configure(data.firebaseConfig,data.authEmulatorUrl);$('localAuth').hidden=true;}
 else $('localAuth').hidden=false;
}
async function bearer(){
 if(runtime==='firebase'){const token=await currentToken();if(!token)throw new Error('Connexion Google Firebase requise');return token;}
 const key=$('localToken').value.trim();if(!key)throw new Error('Clé régie locale requise');return key;
}
async function api(path,data){
 const token=await bearer();
 const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(data),cache:'no-store'});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error||result.errors?.join('\n')||'Requête refusée');
 return result;
}
function spreadsheetId(s){
 // Exact public docs.google.com Sheets URL form, not a Google Drive shortcut.
 const u=new URL(s.trim());
 if(u.protocol!=='https:'||u.hostname!=='docs.google.com')throw new Error('Lien Google Sheets HTTPS requis');
 const match=u.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]{15,160})(?:\/|$)/);
 if(!match)throw new Error('Lien Google Sheets invalide');
 return match[1];
}
async function readSheets(id,accessToken){
 if(!accessToken)throw new Error('Autoriser la lecture Google Sheets');
 const options={headers:{Authorization:'Bearer '+accessToken},cache:'no-store'};
 const titleUrl='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'?fields=properties(title)';
 const titleResponse=await fetch(titleUrl,options);
 if(!titleResponse.ok)throw new Error('Google Sheets : accès refusé ou API non activée ('+titleResponse.status+')');
 const meta=await titleResponse.json();
 const query=new URLSearchParams();
 query.set('valueRenderOption','UNFORMATTED_VALUE');
 for(const range of RANGES)query.append('ranges',range);
 const dataUrl='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values:batchGet?'+query;
 const response=await fetch(dataUrl,options);
 if(!response.ok)throw new Error('Impossible de lire les quatre onglets ('+response.status+')');
 const data=await response.json();
 if(!Array.isArray(data.valueRanges)||data.valueRanges.length!==NAMES.length)throw new Error('Le classeur ne contient pas toutes les plages');
 const tabs=Object.fromEntries(NAMES.map((name,i)=>[name,data.valueRanges[i]?.values||[]]));
 const label=String(meta.properties?.title||'Scénario importé').slice(0,160);
 return {source:{type:'google_sheets',spreadsheetId:id,label},tabs};
}
function appendList(id,values,empty){
 const list=$(id);list.replaceChildren();
 for(const value of values){const node=document.createElement('li');node.textContent=value;list.appendChild(node);}
 if(!values.length){const node=document.createElement('li');node.textContent=empty;list.appendChild(node);}
}
function render(result){
 $('empty').hidden=true;$('results').hidden=false;
 $('publishArea').hidden=!result.valid;
 $('storyTitle').textContent=result.story?.scenario.title||'Import à corriger';
 $('storyInfo').textContent=result.story?result.story.scenario.id+' · '+result.story.scenario.universe+' · SHA-256 '+result.checksum.slice(0,12):'Validation impossible';
 for(const k of ['dilemmas','effects','branches','missingImages'])$(k).textContent=String(result.counts?.[k]??'—');
 appendList('errors',result.errors,'Aucune erreur bloquante');
 appendList('warnings',result.warnings,'Aucun avertissement');
}
$('google').addEventListener('click',async()=>{
 $('google').disabled=true;status('Autorisation de lecture Google Sheets…');
 try{
  if(runtime==='firebase'){
   googleAccess=await authorizeSheetsRead();
  } else {
   // Local repeat: OAuth is not available without a Firebase config.
   throw new Error('La lecture Google Sheets nécessite l’application Firebase et sa connexion Google. L’import reste testable via l’API en local.');
  }
  status('Google Sheets autorisé en lecture seule.','ok');
 }catch(e){status(e.message,'error');}
 finally{$('google').disabled=false;}
});
$('read').addEventListener('click',async()=>{
 $('read').disabled=true;status('Lecture et validation du classeur…');
 try{
  const id=spreadsheetId($('sheetUrl').value);
  const input=await readSheets(id,googleAccess);
  const result=await api('/api/founders/import/preview',input);
  current={input,checksum:result.checksum,id};render(result);
  status(result.valid?'Scénario valide : prêt à publier.':'Scénario comportant des erreurs.',''+(result.valid?'ok':'error'));
 }catch(e){current=null;$('publishArea').hidden=true;status(e.message,'error');}
 finally{$('read').disabled=false;}
});
$('publish').addEventListener('click',async()=>{
 if(!current)return;
 $('publish').disabled=true;status('Relecture du Google Sheets et publication…');
 try{
  const latest=await readSheets(current.id,googleAccess);
  const result=await api('/api/founders/import/publish',{...latest,version:$('version').value.trim(),expectedChecksum:current.checksum});
  status('Version '+result.version+' publiée : '+result.dilemmas+' dilemmes. Retourne à la configuration pour la sélectionner.','ok');
  $('publishArea').hidden=true;
 }catch(e){status(e.message,'error');}
 finally{$('publish').disabled=false;}
});
init().then(()=>status('Prêt. Connecte Google puis renseigne ton fichier.')).catch(e=>status(e.message,'error'));
