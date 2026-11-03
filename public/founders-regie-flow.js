import {teamLabel} from './founders-identity.js';
export const validNarrativeSession=id=>typeof id==='string'&&/^[a-f0-9]{24}$/.test(id);
export function councilGuidance(s){
 const name=id=>teamLabel(s,id);
 if(s.phase==='READY')return {step:2,title:'Votre partie est prête à être lancée',hint:'Distribuez les accès aux six porte-paroles et ouvrez l’écran à projeter. Cliquez ensuite sur « Lancer la partie » : le premier dilemme s’affichera et le Maire pourra voter.'};
 if(s.phase==='COUNCIL')return {step:3,title:'La partie est lancée',hint:s.council.turn?'Le vote se fait sur les écrans des équipes. C’est au tour de '+name(s.council.turn)+'.':s.council.phase==='await_moderator'?'Le Shérif doit départager le vote sur son écran d’équipe.':'Le Shérif doit choisir le nouveau Maire sur son écran d’équipe.'};
 if(s.phase==='AWAITING_REVEAL')return {step:3,title:'Le vote est terminé : révélez la décision',hint:'Cliquez sur « Révéler la décision ». Les conséquences et l’évolution des indicateurs seront affichées sur la projection.'};
 if(s.phase==='REVEALED')return {step:3,title:s.reveal?.nextId===null?'Le dernier résultat est affiché':'Le résultat est affiché',hint:s.reveal?.nextId===null?'Cliquez sur « Terminer la partie » pour afficher le classement final.':'Laissez les équipes découvrir les conséquences, puis cliquez sur « Dilemme suivant ».'};
 return {step:3,title:'La partie est terminée',hint:'Le classement final est affiché sur la projection. Retrouvez une autre partie avec « Mes parties ».'};
}
// Names may change while the organizer presses Start. Re-read state and retry
// exactly once for a revision conflict; never open a second council.
export async function startCouncil(request){
 let view=await request('');
 if(view.phase!=='READY')return {view,started:false};
 try{return {view:await request('/commands','POST',{kind:'start',data:{},expectedRevision:view.revision}),started:true};}
 catch(error){
  if(!/Révision périmée/.test(error.message))throw error;
  view=await request('');
  if(view.phase!=='READY')return {view,started:false};
  return {view:await request('/commands','POST',{kind:'start',data:{},expectedRevision:view.revision}),started:true};
 }
}
export function organizerError(error){
 const code=error.code||'',message=error.message||'Connexion impossible.';
 if(code==='auth/popup-blocked')return 'La fenêtre Google a été bloquée. Autorisez les fenêtres pour ce site, puis cliquez de nouveau sur « Se connecter avec Google ».';
 if(code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request')return 'La connexion Google n’a pas été terminée. Cliquez sur « Se connecter avec Google » pour réessayer.';
 if(code==='auth/unauthorized-domain')return 'Cette adresse n’est pas autorisée pour la connexion Google. Ouvrez la régie depuis le lien officiel de la partie.';
 if(/organisateur Google|Clé régie requise/.test(message))return 'Connectez-vous pour afficher les commandes de la partie.';
 if(error.status===403||/refusé|réservé|Accès régie|organisateur.*requis|organisateur.*autorisé/i.test(message))return 'Ce compte n’a pas accès à cette régie. Utilisez le compte organisateur qui a créé la partie, via « Changer de compte Google ».';
 return message;
}
