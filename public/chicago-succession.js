const name = (s,id) => s.families.find(f=>f.id===id)?.name ?? id;
const words = {requested:'La succession suivra ce Conseil.', negotiations:'La Commission est réunie. Les familles peuvent négocier leurs derniers soutiens.',
 ballot:'Le scrutin secret est ouvert.',arbitration:'La Commission attend un arbitrage.',sealed:'Les bulletins sont scellés. La proclamation appartient à la régie.'};

function add(root, tag, message) {
 const node=document.createElement(tag);node.textContent=message;root.append(node);return node;
}
function button(root, label, action) {
 const b=add(root,'button',label);b.type='button';b.addEventListener('click',action);return b;
}
export function chicagoImage(img, art) {
 img.hidden=!art?.url;
 if(!art?.url){img.removeAttribute('src');return;}
 img.alt=art.alt||'Chicago, 1931';
 img.onerror=()=>{img.hidden=true;};
 if(img.getAttribute('src')!==art.url)img.src=art.url;
}
export const chicagoPhase = s => s.phase==='SUCCESSION'?'Succession du Parrain':null;
export function renderSuccession(root,s,role,command) {
 const f=s.succession;
 const available=f?.stage==='available',done=f?.stage==='revealed';
 root.hidden=!f||s.phase==='SUSPENDED'||(available&&role!=='organizer')||(done&&role!=='organizer');
 root.replaceChildren();
 if(root.hidden)return;
 if(role==='organizer'&&['available','requested'].includes(f.stage)){
  const request = mode => {
   const interrupt=mode==='interrupt';
   const question=interrupt?'Annuler ce Conseil, ses mises et ses transferts, puis ouvrir la succession ?':
    mode==='finish'?'Convoquer la Commission dès que ce Conseil aura été résolu ?':'Figer les décisions acquises et convoquer la Commission ?';
   if(confirm(question))command('requestChicagoFinale',{mode,confirm:true});
  };
  if(['NEGOTIATION','COUNCIL'].includes(s.phase)){
   add(root,'h3','Déclencher la finale');
   if(!available)add(root,'p',words.requested);
   else button(root,'Terminer ce Conseil, puis lancer la finale',()=>request('finish'));
   button(root,'Interrompre ce Conseil et lancer la finale',()=>request('interrupt'));
  }else button(root,'Déclencher la finale',()=>request('immediate'));
  return;
 }
 if(!done){
  add(root,'h2','La succession du Parrain');
  add(root,'p',words[f.stage]??'');
 }
 if(f.stage==='negotiations'&&role==='organizer'){
  add(root,'p','Durée indicative des négociations finales · 5 minutes.');
  button(root,'Ouvrir le scrutin secret',()=>command('openChicagoBallot'));
 }
 if(f.stage==='ballot'){
  add(root,'p',(f.round===1?'Élection du Parrain':'Départage · tour '+f.round)+' · '+f.received+' / 5 bulletins reçus');
  if(role==='organizer')button(root,'Verrouiller le scrutin',()=>command('closeChicagoBallot')).disabled=f.received!==5;
  if(f.hasVoted)add(root,'strong','Votre bulletin a été enregistré.');
  for(const id of f.candidates??[])button(root,name(s,id),()=>{
   if(confirm('Confirmer votre vote secret pour '+name(s,id)+' ?'))command('castChicagoBallot',{round:f.round,candidate:id});
  });
 }
 for(const id of f.arbitrate??[])button(root,'Désigner '+name(s,id),()=>{
  if(confirm('Confirmer l’arbitrage en faveur de '+name(s,id)+' ?'))command('arbitrateChicago',{candidate:id});
 });
 if(f.stage==='sealed'&&role==='organizer')button(root,'Proclamer le Parrain',()=>command('revealChicago'));
 if(role==='organizer'&&s.successionAudit){
  const a=s.successionAudit;
  const details=add(root,'details','');add(details,'summary','Calcul privé des ambitions');
  const n=a.frozen.scores[0].common;
  add(details,'p',n?'Base commune · '+n+' première(s) occasion(s) par famille.':'Ambition majeure neutralisée pour les cinq familles. Une famille au moins n’a joué aucun pivot.');
  for(const r of a.frozen.scores)add(details,'p',name(s,r.family)+' · soutiens '+r.supports.length+' ('+r.small+' pts) · jauge '+r.value+'/100 ('+r.medium+' pts) · pivots favorables '+r.favorable+'/'+n+' ('+r.major+' pts) · fortune '+(r.wealth??0)+' pts.');
  if(done)button(details,'Exporter le journal privé',()=>{
   const blob=new Blob([JSON.stringify({session:s.code,audit:a,history:s.history,results:s.finalResults},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=s.code+'-commission.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
 }
}
export function showChicagoRanking(root,s){
 root.replaceChildren();
 for(const [i,row] of s.finalResults.rows.entries()){
  const line=add(root,'div','');line.className='card';
  add(line,'strong',(i+1)+'. '+name(s,row.family)+' · '+row.total+' points');
  add(line,'p',row.ambition?row.ambition+' · '+row.indicator+' · objectifs '+row.small+' + '+row.medium+' + '+row.major+
   ' · fortune '+(row.wealth??0)+' pts · '+row.support+' soutien(s) × 2':row.support+' soutien(s) au premier tour');
 }
 add(root,'p',s.finalResults.reason);
}
