export function commitmentLabel(commitment){
 if(!commitment||commitment.choice==='gift')return 'Transfert sans contrepartie contraignante';
 if(commitment.choice==='passe_pouvoir')return 'Passer pour récupérer de l’influence';
 return 'Voter '+commitment.choice.toUpperCase()+' avec au moins '+commitment.minInfluence+' Influence';
}

export function offerStatusText(offer){
 if(offer.status==='rejected'){
  if(offer.closedBy===offer.to)return 'Proposition refusée';
  if(offer.closedBy===offer.from)return 'Proposition retirée';
  return 'Proposition clôturée';
 }
 return {pending:'En attente de réponse',accepted:'Proposition acceptée',expired:'Proposition expirée',cancelled:'Conseil interrompu · proposition annulée'}[offer.status];
}

// Acknowledging a pending offer does not dismiss the recipient’s later answer.
export function createSentOfferNotices(storage,key){
 let entries;
 try{entries=new Map(JSON.parse(storage.getItem(key)||'[]'));}catch{entries=new Map();}
 const save=()=>{try{storage.setItem(key,JSON.stringify([...entries]));}catch{/* In-memory notices still work. */}};
 return {
  unread(data){
   const council=data.history.length;
   const ownOffers=new Map(data.offers.filter(o=>o.from===data.self.id).map(o=>[o.id,o]));
   let changed=false;
   for(const offer of ownOffers.values()){
    const last=entries.get(offer.id);
    if(last?.status===offer.status)continue;
    const recent=offer.councilNumber===council||(data.phase==='REVEALED'&&offer.councilNumber===council-1);
    if(!last&&offer.status!=='pending'&&!recent)continue;
    entries.delete(offer.id);
    entries.set(offer.id,{status:offer.status,unread:true});changed=true;
   }
   if(changed)save();
   return [...entries].reverse().filter(([id,event])=>event.unread&&ownOffers.has(id)).map(([id])=>ownOffers.get(id));
  },
  dismiss(offer){entries.set(offer.id,{status:offer.status,unread:false});save();}
 };
}
