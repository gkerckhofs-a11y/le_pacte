"use strict";
const $=id=>document.getElementById(id),param=new URLSearchParams(location.search);
const sessionId=param.get('session');
const resources=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
let lastRevision=null;
const pretty={READY:'Préparation',COUNCIL:'Conseil en cours',AWAITING_REVEAL:'Vote clos',REVEALED:'Conséquences révélées',FINISHED:'Fin de partie'};
function text(id,value){$(id).textContent=String(value??'');}
function drawGauges(s){
 const root=$('gauges');root.replaceChildren();
 for(const key of resources){
  const g=document.createElement('div');g.className='gauge';
  const row=document.createElement('div');row.className='gauge-head';
  const label=document.createElement('span');label.textContent=s.skin.labels.resources[key]||key;
  const score=document.createElement('strong');score.textContent=s.city[key]+'/10';
  row.append(label,score);g.append(row);
  const track=document.createElement('div');track.className='track';
  const bar=document.createElement('div');bar.className='bar';
  bar.style.width=(s.city[key]*10)+'%';bar.style.background=key==='stabilite'?'#85b4a1':s.skin.theme.accent;
  track.append(bar);g.append(track);root.append(g);
 }
 $('station').style.opacity=s.city.developpement>=7?'1':'0';
 $('factory').style.opacity=s.city.economie>=7?'1':'0';
 $('crowd').style.opacity=String(Math.max(.15,s.city.satisfaction/10));
 $('disturbance').style.opacity=(s.city.securite<=3||s.city.satisfaction<=3)?'.85':'0';
}
function render(s){
 lastRevision=s.revision;
 text('pageTitle',s.story.location+' · '+s.story.year);text('phase',pretty[s.phase]||s.phase);
 text('chapter',s.dilemma?'Chapitre '+s.dilemma.chapter:'Le Conseil des Fondateurs');
 text('tiePriority','Départage final si égalité parfaite : '+s.finalTieOrder.join(' → '));
 text('turn',s.council.turn?'Tour de '+s.council.turn:'Meneur '+s.leader);
 text('dilemmaTitle',s.dilemma?.title||(s.phase==='FINISHED'?'La ville entre dans l’histoire':'Bienvenue au Conseil'));
 text('dilemmaText',s.dilemma?.public_text||(s.phase==='FINISHED'?'Les délibérations sont terminées.':'Le Conseil attend le signal de la régie.'));
 text('question',s.dilemma?.vote_question||'');
 drawGauges(s);
 const image=$('decisionImage'),src=s.dilemma?.image?.url;
 if(typeof src==='string'&&/^https:\/\/\S+$/.test(src)){image.src=src;image.alt=s.dilemma.image.alt||s.dilemma.title;image.hidden=false;}
 else {image.hidden=true;image.removeAttribute('src');}
 const out=$('outcome');out.hidden=!s.reveal;
 if(s.reveal){text('outcomeTitle',s.reveal.winner==='pour'?'PROPOSITION ADOPTÉE':'PROPOSITION REJETÉE');text('outcomeText',s.reveal.narration);}
 const ballots=$('ballots');ballots.replaceChildren();
 for(const f of s.families){
  const row=document.createElement('div');row.className='ballot';
  const n=document.createElement('span');n.textContent=f.name;
  const v=document.createElement('strong');
  const choice=s.council.choices[f.id];
  v.textContent=choice===undefined?'—':choice==='pour'?'POUR':choice==='contre'?'CONTRE':'ABSTENTION';
  const amount=document.createElement('span');amount.textContent=s.council.bids[f.id]??0;
  row.append(n,v,amount);ballots.append(row);
 }
 text('councilStatus',s.phase==='COUNCIL'?
  'Meneur : '+s.leader+' · Modérateur : '+s.moderator+' · '+(s.council.turn?'Au tour de '+s.council.turn:'Arbitrage en cours'):
  s.phase==='AWAITING_REVEAL'?'Résultat sous scellés : la régie doit le révéler.':
  s.phase==='REVEALED'?'Le Conseil attend le prochain dilemme.':
  s.phase==='FINISHED'?'Les décisions finales ont été proclamées.':'La séance n’a pas encore commencé.');
 const final=$('finalResults');final.hidden=!s.finalResults;
 if(s.finalResults){
  const ranking=s.finalResults.ranking;
  text('winnerTitle','Victoire de '+ranking[0].name+' · '+ranking[0].score.total+' points');
  const root=$('finalRanking');root.replaceChildren();
  for(const p of ranking){
   const line=document.createElement('div');line.className='ballot';
   const a=document.createElement('strong');a.textContent=p.rank+'. '+p.name+(p.rank===1?' ★':'');
   const b=document.createElement('span');b.textContent='Secret '+p.score.secret+' · $ '+p.score.wealth+' · Conseil '+p.score.council+' · Influence '+p.score.influence;
   const n=document.createElement('strong');n.textContent=p.score.total+' pts';
   line.append(a,b,n);root.append(line);
  }
 }
}
async function tick(){
 if(!sessionId||!/^[a-f0-9]{24}$/.test(sessionId)){text('notice','Lien de projection incomplet : session introuvable.');return;}
 try{
  const r=await fetch('/api/founders/sessions/'+sessionId,{cache:'no-store'});
  if(!r.ok)throw new Error('Session indisponible ('+r.status+')');
  const s=await r.json();
  if(s.revision!==lastRevision)render(s);
  text('connection','● Synchronisé');text('notice','');
 }catch(e){text('connection','○ Hors ligne');text('notice',e.message);}
}
tick();setInterval(tick,2500);
