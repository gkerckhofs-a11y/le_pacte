export function checkedFacilitatorEmail(value){
 if(value===null)return null;
 const email=typeof value==='string'?value.trim().toLowerCase():'';
 if(email.length>254||!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email)){
  throw new Error('Saisissez l’adresse du compte Google de l’animateur.');
 }
 return email;
}

export function resolveNarrativeOperator(ownerId,actor,facilitatorEmail){
 if(actor.organizer&&actor.id===ownerId)return {role:'organizer',id:actor.id};
 if(facilitatorEmail&&actor.email===facilitatorEmail)return {role:'facilitator',id:actor.id};
 throw new Error('Accès à la régie refusé pour ce compte');
}

export function narrativeStaffView(actor,facilitatorEmail){
 if(actor.role==='organizer')return {sessionRole:'organizer',facilitatorEmail:facilitatorEmail??null};
 if(actor.role==='facilitator')return {sessionRole:'facilitator'};
 return {};
}
