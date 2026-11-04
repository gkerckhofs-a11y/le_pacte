import {renderVoteProgress} from './founders-vote-progress.js';
import {teamLabel,teamCaption,colorize} from './founders-identity.js';
const choices={pour:'POUR',contre:'CONTRE',passe_pouvoir:'Passe · récupération',passe_moderateur:'Passe · Shérif'};
export function councilMonitor(s){
 const active=s.game.vote;
 const closed=s.phase!=='READY'&&s.phase!=='COUNCIL'?s.game.history.at(-1):null;
 const vote=active??closed;
 const bids=vote?.bids??{},positions=vote?.choices??{};
 const total=side=>s.families.reduce((n,f)=>n+(positions[f.id]===side?(bids[f.id]??0):0),0);
 const yes=total('pour'),no=total('contre');
 const turn=active?.phase==='voting'?active.turn:null;
 const arbitration=active?.phase==='await_moderator'||active?.phase==='await_leader';
 const actor=turn??(arbitration?s.moderator:null);
 const action=turn?(positions[turn]?'Maintenir ou surenchérir dans le même camp ; une abstention reste définitive.':'Choisir POUR, CONTRE ou passer sur son écran d’équipe.'):
 active?.phase==='await_moderator'?'Le Shérif doit départager POUR et CONTRE.':
 active?.phase==='await_leader'?'Le Shérif doit désigner le Maire parmi : '+active.pendingLeaderChoices.map(id=>teamLabel(s,id)).join(', '):
 s.phase==='READY'?'La régie peut lancer le premier Conseil.':s.phase==='AWAITING_REVEAL'?'Vote clos : la régie doit révéler les conséquences.':s.phase==='FINISHED'?'Partie terminée.':'Résolution affichée : poursuivre vers le prochain chapitre.';
 return {yes,no,actor,action,closed:Boolean(closed),pool:s.game.pool,
 balance:closed?'Résultat : '+closed.winner.toUpperCase():!vote?'Vote non ouvert':yes===no?'Égalité provisoire':(yes>no?'POUR':'CONTRE')+' en tête de '+Math.abs(yes-no)+' Influence',
 rows:s.families.map(f=>({family:f,roles:[f.id===s.leader?'Maire':null,f.id===s.moderator?'Shérif':null].filter(Boolean).join(' · '),
 current:f.id===actor,choice:choices[positions[f.id]]??'Pas encore voté',bid:bids[f.id]??0,power:s.familyResources[f.id].power,dollars:s.familyResources[f.id].dollars})),
 steps:vote?.steps??[],settlement:closed?`Réserve : ${closed.poolBefore} → ${closed.poolAfter}. Chaque famille ayant passé pour récupérer reçoit ${closed.recapturedPerPassingTeam} Influence.`:null};
}
export function renderCouncilMonitor(root,s){
 const m=councilMonitor(s),el=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text??'';if(cls)n.className=cls;return n;};
 root.replaceChildren();
 root.append(el('h2','Le Conseil en direct'));
 const roles=el('div',null,'council-roles');
 for(const [label,id] of [['Maire',s.leader],['Shérif',s.moderator],['À la parole',m.actor]]){
  const card=el('div',null,'card');card.append(el('span',label,'eyeline'),el('strong',id?teamLabel(s,id):'Régie'));roles.append(card);
 }
 root.append(roles,el('p',m.action,'council-prompt'));
 const progress=el('div',null,'vote-progress');renderVoteProgress(progress,s);root.append(progress);
 const totals=el('div',null,'council-totals');
 for(const t of [`POUR : ${m.yes}`,`CONTRE : ${m.no}`,`Réserve : ${m.pool}`])totals.append(el('strong',t));
 root.append(totals,el('p',m.balance+(m.closed?' · Mises du vote terminé':' · Mises cumulées, résultat encore provisoire'),'small'));
 const scroll=el('div',null,'council-table-scroll'),table=el('table',null,'council-table');
 const head=el('thead'),hr=el('tr');
 for(const label of ['Famille / rôle','Position','Mise','Disponible','Dollars']){const th=el('th',label);th.scope='col';hr.append(th);}head.append(hr);table.append(head);
 const body=el('tbody');
 for(const r of m.rows){
  const tr=el('tr');if(r.current)tr.className='council-current';
  const name=el('th');name.scope='row';const title=el('span',teamCaption(r.family));colorize(title,r.family);
  name.append(title,el('small',[r.roles,r.current?'À la parole':''].filter(Boolean).join(' · ')));
  tr.append(name,el('td',r.choice),el('td',r.bid),el('td',r.power),el('td',r.dollars));body.append(tr);
 }
 table.append(body);scroll.append(table);root.append(scroll);
 root.append(el('p',m.settlement??'Disponible = Influence encore en main, hors mises engagées. Les mises gagnantes rejoignent la réserve ; les mises perdantes sont rendues. Passer rapporte 1 dollar.','small muted'));
 const log=el('details');log.open=true;log.append(el('summary','Actions de ce Conseil · '+m.steps.length));
 const list=el('ol',null,'council-log');
 for(const step of [...m.steps].reverse()){
  const wording=step.kind==='augmenter'?'ajoute '+step.amount+' Influence':step.kind==='maintien'?'maintient sa position':(choices[step.kind]??step.kind)+(step.amount?' · '+step.amount+' Influence':'');
  list.append(el('li',teamLabel(s,step.family)+' — '+wording));
 }
 if(!m.steps.length)log.append(el('p','Aucune action pour ce Conseil.','small muted'));else log.append(list);
 root.append(log);
}
