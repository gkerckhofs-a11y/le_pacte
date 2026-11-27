import {formatGaugeNumber} from './founders-live-ui.js';

// The organizer can inspect the server's selection. This panel has no session command.
export function mountCinemaPreview(root){
 const doc=root.ownerDocument,byId=id=>doc.getElementById(id);
 const path=byId('cinemaPath'),stage=byId('cinemaStage'),frame=byId('cinemaImage');
 const problem=byId('cinemaProblem'),report=byId('cinemaIssueReport');
 let cinema=null,phase='',selectedImageKey='',code='';

 function choices(select,options){
  if(options.length===select.options.length&&options.every(([id,name],i)=>
   select.options[i].value===id&&select.options[i].textContent===name))return;
  const previous=select.value;
  select.replaceChildren(...options.map(([id,name])=>{
   const option=doc.createElement('option');option.value=id;option.textContent=name;return option;
  }));
  if(options.some(([id])=>id===previous))select.value=previous;
 }
 function list(container,lines){
  container.replaceChildren(...lines.map(line=>{
   const entry=doc.createElement('li');entry.textContent=line;return entry;
  }));
 }
 function chapterName(selection){
  return selection.stage>=1&&selection.stage<=6?'Chapitre '+selection.stage+' · '+selection.chapterTitle:selection.chapterTitle;
 }
 function previewImage(selection,context){
  const key=JSON.stringify([context,selection.view.url,selection.fallback?.url]);
  if(key===selectedImageKey)return;
  selectedImageKey=key;
  frame.replaceChildren();problem.hidden=true;report.value='';byId('cinemaCopied').textContent='';
  const manual=byId('cinemaReport'),retry=byId('cinemaRetry');
  manual.hidden=false;
  function showReport(message,subject,files){
   byId('cinemaProblemText').textContent=message;
   report.value=[subject,context,selection.view.title,...files].join('\n');
   manual.hidden=true;problem.hidden=false;
  }
  manual.onclick=()=>{
   retry.hidden=true;
   showReport('Décrivez la vue qui manque pour cette partie.','Hotspring · Illustration à prévoir',[selection.view.url,'']);
   report.focus();report.setSelectionRange?.(report.value.length,report.value.length);
  };
  const missing=[];
  function show(view){
   const img=doc.createElement('img');img.alt=view.alt;img.decoding='async';
   frame.replaceChildren(img);
   img.addEventListener('error',()=>{
    if(!frame.contains(img))return;
    missing.push(view.url);
    const fallback=selection.fallback;
    const canRecover=fallback&&fallback.url!==view.url&&missing.length===1;
    const message=canRecover?'Illustration indisponible. Chargement de la vue de secours.':'Illustration indisponible à cette étape.';
    retry.hidden=false;
    showReport(message,'Hotspring · Illustration indisponible',missing);
    if(canRecover)show(fallback);else img.remove();
   });
   img.addEventListener('load',()=>{
    if(frame.contains(img)&&missing.length)byId('cinemaProblemText').textContent='Illustration sélectionnée indisponible. La vue de secours est affichée.';
   });
   img.src=view.url;
  }
  show(selection.view);
 }

 function draw(){
  if(!cinema||!root.open)return;
  const simulations=cinema.simulations??[];
  choices(path,[['live','Partie en cours'],...simulations.map(sim=>[sim.id,sim.title])]);
  const sim=simulations.find(item=>item.id===path.value);
  const steps=sim?.chapters??[];
  byId('cinemaStageField').hidden=!steps.length;
  choices(stage,steps.map(step=>[String(step.stage),chapterName(step)]));
  const selection=steps.find(step=>String(step.stage)===stage.value)??cinema;
  const scope=sim?'Essai de trajectoire · '+sim.title:
   ['EPILOGUE','FINISHED'].includes(phase)?'Épilogue de cette partie':
   'Prochain bilan · prévision avec les décisions déjà prises';
  byId('cinemaPreviewScope').textContent=scope;
  const chapter=chapterName(selection);
  byId('cinemaChapter').textContent=chapter;
  byId('cinemaTitle').textContent=selection.view.title;
  byId('cinemaProfile').textContent=selection.profile?'Ambiance '+selection.profile.id+' · '+selection.profile.title:'';
  byId('cinemaSummary').textContent=selection.summary??'';
  const names={economie:'Économie',ecologie:'Écologie',securite:'Sécurité',bien_etre:'Bien-être',demographie:'Démographie'};
  const values=Object.entries(names).filter(([id])=>Number.isFinite(selection.city?.[id]))
   .map(([id,name])=>name+' '+selection.city[id]+'/10');
  if(Number.isFinite(selection.city?.stabilite))values.push('Stabilité '+formatGaugeNumber(selection.city.stabilite,true)+'/10');
  if(selection.stabilityLabel)values.push(selection.stabilityLabel);
  byId('cinemaGauges').textContent=values.join(' · ');
  list(byId('cinemaReasons'),selection.reasons??[]);
  const others=(selection.profiles??[]).filter(p=>p.id!==selection.view.id);
  byId('cinemaAlternatives').hidden=!others.length;
  list(byId('cinemaCandidates'),others.map(p=>p.title+' — '+(p.eligible?'Compatible':'Écartée')+(p.reason?' · '+p.reason:'')));
  previewImage(selection,[sim?scope:'Partie '+code,chapter].join(' · '));
 }

 root.addEventListener('toggle',draw);
 path.addEventListener('change',draw);stage.addEventListener('change',draw);
 byId('cinemaRetry').addEventListener('click',()=>{selectedImageKey='';draw();});
 byId('cinemaCopy').addEventListener('click',async()=>{
  try{
   await navigator.clipboard.writeText(report.value);
   byId('cinemaCopied').textContent='Signalement copié.';
  }catch{
   report.focus();report.select();
   byId('cinemaCopied').textContent='Copiez le texte sélectionné pour le transmettre.';
  }
 });
 return s=>{
  cinema=s.campaignAdmin?.cinema??null;phase=s.phase;code=s.code;
  root.hidden=!cinema;
  if(cinema)draw();
  else{selectedImageKey='';frame.replaceChildren();problem.hidden=true;report.value='';}
 };
}
