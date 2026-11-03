// A name edit can be retried after another team's update; game actions never auto-retry.
export async function saveFamilyName(snapshot,name,request){
 const data={name,color:snapshot.self.color.id};
 try{return await request('POST',{kind:'setIdentity',data,expectedRevision:snapshot.revision});}
 catch(error){
  if(!/Révision périmée/.test(error.message))throw error;
  const fresh=await request('GET');
  if(fresh.phase!=='READY')throw new Error('Le Conseil a démarré. Le nom ne peut plus être modifié.');
  if(fresh.self.id!==snapshot.self.id||fresh.self.color.id!==data.color)throw new Error('Votre identité a changé. Actualisez votre accès avant de réessayer.');
  if(fresh.self.name===name)return fresh;
  if(fresh.self.name!==snapshot.self.name)throw new Error('Le nom a été modifié depuis un autre écran. Votre saisie est conservée : vérifiez-la avant de réessayer.');
  return request('POST',{kind:'setIdentity',data,expectedRevision:fresh.revision});
 }
}
