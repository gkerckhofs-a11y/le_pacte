import {roleLabel} from './founders-role-badges.js';
import {teamLabel} from './founders-identity.js';

export function voteProgress(state){
 const order=state.families.map(f=>f.id);
 const c=state.council;
 if(state.phase==='NEGOTIATION')return {title:'NÉGOCIATIONS EN COURS',hint:'Préparez votre position et vos propositions financières avant l’ouverture du vote.'};
 if(state.phase!=='COUNCIL')return null;
 if(c.phase==='await_moderator')return {title:'Égalité : '+(state.chicago?roleLabel(state,'sheriff'):'le Shérif')+' doit départager',hint:teamLabel(state,state.moderator)+' doit choisir POUR ou CONTRE sur son terminal.'};
 if(c.phase==='await_leader')return {title:state.chicago?roleLabel(state,'sheriff')+' doit désigner '+roleLabel(state,'mayor'):'Le Shérif doit désigner le Maire',hint:'Familles à départager : '+c.pendingLeaderChoices.map(id=>teamLabel(state,id)).join(', ')+'.'};
 if(!c.turn)return null;
 const previous=c.choices[c.turn],repeat=previous!==undefined;
 const action=!repeat?'choisir POUR, CONTRE ou passer':previous==='pour'||previous==='contre'?'maintenir ou surenchérir dans le même camp':'maintenir son abstention';
 if((state.campaign?.version>=3||state.chicago)&&!repeat&&state.self?.id===c.turn&&state.voteCommitment){
  const {choice,minInfluence}=state.voteCommitment;
  return {title:'À LA PAROLE : '+teamLabel(state,c.turn),hint:'C’est à vous. Votre accord vous engage à voter '+choice.toUpperCase()+' avec au moins '+minInfluence+' Influence.'};
 }
 if(state.experienceVersion===2)return {title:'À LA PAROLE : '+teamLabel(state,c.turn),hint:(state.self?(state.self.id===c.turn?'C’est à vous. ':'En attente — '+teamLabel(state,c.turn)+' joue actuellement. '):'')+(repeat?'Ajoutez de l’Influence dans votre camp ou passez ce tour. Un circuit sans surenchère clôt le vote.':'Premier passage : choisissez POUR, CONTRE ou ABSTENTION. Les abstentions seront ensuite sautées.')};
 const closing=order[(order.indexOf(state.leader)+order.length-1)%order.length];
 return {title:(repeat?'Nouveau passage':'Premier passage')+' — à '+teamLabel(state,c.turn)+' de '+action+'.',
 hint:(c.turn===closing?'Dernière action avant la clôture. ':'')+'Le vote se terminera après '+teamLabel(state,closing)+' si le Maire ne change pas. La parole continue automatiquement.'};
}
export function renderVoteProgress(root,state){
 const progress=voteProgress(state);root.hidden=!progress;root.replaceChildren();if(!progress)return;
 const title=document.createElement('strong'),hint=document.createElement('p');title.textContent=progress.title;hint.textContent=progress.hint;hint.className='small';root.append(title,hint);
}
