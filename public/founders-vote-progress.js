import {teamLabel} from './founders-identity.js';
const order=['A','B','C','D','E','F'];
export function voteProgress(state){
 const c=state.council;
 if(state.phase!=='COUNCIL')return null;
 if(c.phase==='await_moderator')return {title:'Égalité : le Shérif doit départager',hint:teamLabel(state,state.moderator)+' doit choisir POUR ou CONTRE sur son terminal.'};
 if(c.phase==='await_leader')return {title:'Le Shérif doit désigner le Maire',hint:'Familles à départager : '+c.pendingLeaderChoices.map(id=>teamLabel(state,id)).join(', ')+'.'};
 if(!c.turn)return null;
 const previous=c.choices[c.turn],repeat=previous!==undefined;
 const action=!repeat?'choisir POUR, CONTRE ou passer':previous==='pour'||previous==='contre'?'maintenir ou surenchérir dans le même camp':'maintenir son abstention';
 const closing=order[(order.indexOf(state.leader)+order.length-1)%order.length];
 return {title:(repeat?'Nouveau passage':'Premier passage')+' — à '+teamLabel(state,c.turn)+' de '+action+'.',
 hint:(c.turn===closing?'Dernière action avant la clôture. ':'')+'Le vote se terminera après '+teamLabel(state,closing)+' si le Maire ne change pas. La parole continue automatiquement.'};
}
export function renderVoteProgress(root,state){
 const progress=voteProgress(state);root.hidden=!progress;root.replaceChildren();if(!progress)return;
 const title=document.createElement('strong'),hint=document.createElement('p');title.textContent=progress.title;hint.textContent=progress.hint;hint.className='small';root.append(title,hint);
}
