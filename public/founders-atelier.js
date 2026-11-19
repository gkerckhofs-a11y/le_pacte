import {organizerWorkspace} from './founders-workspace.js';

const $=id=>document.getElementById(id);
const fields=['title','situation','question','pour','contre'];
const root='/api/founders/hotspring/drafts';
let drafts=[],opened=null;
function status(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
const api=organizerWorkspace({onOpen:refresh,status,localAction:'Ouvrir l’atelier'});
const request=(path,method,body)=>api(root+path,method,body);
function open(draft){
 opened=draft?.id??null;
 for(const key of fields)$(key).value=draft?.[key]??'';
 $('drafts').value=opened??'';
 $('draftHeading').textContent=draft?'Modifier le brouillon':'Nouveau dilemme';
}
async function refresh(){
 ({drafts}=await request(''));
 const options=[['','Choisir un brouillon'],...drafts.map(d=>[d.id,d.title])];
 $('drafts').replaceChildren(...options.map(([id,title])=>new Option(title,id)));
 $('drafts').value=opened??'';
 $('loginPanel').hidden=true;$('workshop').hidden=false;
}
$('drafts').addEventListener('change',()=>open(drafts.find(d=>d.id===$('drafts').value)));
$('newDraft').addEventListener('click',()=>{open();$('title').focus();});
$('draftForm').addEventListener('submit',async event=>{
 event.preventDefault();
 $('saveDraft').disabled=true;
 try{
  const values=Object.fromEntries(fields.map(key=>[key,$(key).value]));
  const result=await request(opened?'/'+opened:'',opened?'PUT':'POST',values);
  opened=result.id;await refresh();open(result);status('Brouillon enregistré.');
 }catch(e){status(e.message,true);}
 finally{$('saveDraft').disabled=false;}
});
