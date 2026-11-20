import {teamLabel} from './founders-identity.js';
import {roleLabel} from './founders-role-badges.js';

function add(parent,tag,text){
 const element=document.createElement(tag);
 element.textContent=text;
 parent.append(element);
 return element;
}
function button(parent,text,onClick,disabled=false){
 const control=add(parent,'button',text);
 control.type='button';
 control.disabled=disabled;
 control.addEventListener('click',onClick);
 return control;
}

export function renderRehearsal(s,command){
 const panel=document.getElementById('rehearsalPanel');
 panel.hidden=!s.rehearsal;
 const root=document.getElementById('rehearsalDecision');
 root.replaceChildren();
 if(panel.hidden)return;
 const turn=s.rehearsalTurn;
 if(!turn){
  const done=['EPILOGUE','FINISHED'].includes(s.phase);
  add(root,'p',done?'Le résultat de votre test est disponible dans la régie.':
   s.clock?.paused||s.phase==='SUSPENDED'?'Reprenez la partie pour poursuivre le test.':
   'Vous jouez les cinq familles. Utilisez les commandes d’animation pour poursuivre.');
  return;
 }
 const {family,kind}=turn;
 const name=id=>teamLabel(s,id);
 const decide=payload=>command('rehearsalAction',{family,action:kind,payload});
 add(root,'h4',name(family));
 const choices=add(root,'div','');
 choices.className='row';
 if(kind==='vote'){
  const prior=s.council.choices[family],power=s.familyResources[family].power;
  const minimum=prior?1:(turn.commitment?.minInfluence||1);
  const label=add(choices,'label','Influence à engager ('+power+' disponible'+(power>1?'s':'')+')');
  const input=add(label,'input','');
  input.type='number'; input.min=String(minimum); input.max=String(power); input.value=String(minimum);
  input.step='1';input.required=true;label.hidden=power<minimum;
  const vote=(action,withAmount=false)=>{
   if(withAmount&&!input.reportValidity())return;
   decide(withAmount?{kind:action,amount:input.valueAsNumber}:{kind:action});
  };
  if(prior){
   add(root,'p','Position de cette famille · '+prior.toUpperCase()+' · Mise actuelle '+s.council.bids[family]+'.');
   button(choices,'Surenchérir',()=>vote('augmenter',true),!power);
   button(choices,'Passer ce tour',()=>vote('maintien'));
  }else{
   const locked=choice=>!!turn.commitment&&turn.commitment.choice!==choice;
   for(const side of ['pour','contre']){
    button(choices,side.toUpperCase()+' · '+s.dilemma.labels[side],()=>vote(side,true),power<minimum||locked(side));
   }
   button(choices,'Abstention · récupérer de l’Influence',()=>vote('passe_pouvoir'),locked('passe_pouvoir'));
   button(choices,'Abstention · revendiquer le rôle de '+roleLabel(s,'sheriff'),()=>vote('passe_moderateur'),
    s.game.vote.moderatorClaimed||locked('passe_moderateur'));
  }
  const quick=button(root,'Terminer les mises de ce Conseil',()=>command('rehearsalPass'));
  quick.className='secondary';
  add(root,'p','Les familles restantes s’abstiennent ou respectent leur accord. Les familles déjà engagées passent. Vous tranchez toute égalité.').className='small';
 }else if(kind==='resolveTie'){
  for(const side of ['pour','contre'])button(choices,'Départager en faveur de '+side.toUpperCase(),()=>decide({winner:side}));
 }else if(kind==='supportCharter'){
  for(const charter of s.campaign.qualification.candidates){
   button(choices,'Soutenir « '+charter.title+' »',()=>decide({charter:charter.id}));
  }
 }else{
  for(const id of turn.candidates){
   if(kind==='chooseLeader')button(choices,'Désigner '+name(id)+' · '+roleLabel(s,'mayor'),()=>decide({family:id}));
   if(kind==='castChicagoBallot')button(choices,'Voter pour '+name(id),()=>decide({round:turn.round,candidate:id}));
   if(kind==='arbitrateChicago')button(choices,'Départager en faveur de '+name(id),()=>decide({candidate:id}));
  }
 }
}
