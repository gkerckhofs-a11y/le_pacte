export function commitmentLabel(commitment){
 if(!commitment||commitment.choice==='gift')return 'Transfert sans contrepartie contraignante';
 if(commitment.choice==='passe_pouvoir')return 'Passer pour récupérer de l’influence';
 return 'Voter '+commitment.choice.toUpperCase()+' avec au moins '+commitment.minInfluence+' Influence';
}
