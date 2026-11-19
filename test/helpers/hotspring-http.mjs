import assert from 'node:assert/strict';
import {once} from 'node:events';
import {GameStore} from '../../server/store.ts';
import {createGameServer} from '../../server/http.ts';
import {hotspringSelection,trajectories} from './hotspring.mjs';

export const hotspringTestKey='hotspring-rehearsal-organizer-test-only';

export async function serveHotspringTest({file=':memory:',clock=()=>Date.now(),port=0}={}){
 const store=new GameStore(file);
 const server=createGameServer(store,hotspringTestKey,clock);
 try{
  server.listen(port,'127.0.0.1');
  await once(server,'listening');
 }catch(error){store.close();throw error;}
 const origin='http://127.0.0.1:'+server.address().port;
 const request=async(path,{body,token,status=200}={})=>{
  const res=await fetch(origin+path,{method:body?'POST':'GET',headers:{connection:'close',
   ...(token?{authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json'}:{})},
   body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000)});
  const data=await res.json();
  assert.equal(res.status,status,path+(res.status!==status?' · '+(data.error??res.statusText):''));
  return data;
 };
 const close=async()=>{
  if(!server.listening)return;
  const stopped=once(server,'close');
  server.close();
  server.closeAllConnections();
  await stopped;
  store.close();
 };
 return {origin,port:server.address().port,request,close};
}

export async function createHotspringTestGame(server,{code='HOTQA',...options}={}){
 return server.request('/api/founders/sessions',{token:hotspringTestKey,status:201,body:{
  ...hotspringSelection,members:[1,1,1,1,1],code,title:'Répétition Hotspring',
  timing:{negotiationSeconds:60,voteSeconds:60,resolutionSeconds:20,autoAdvance:false},...options
 }});
}

export function hotspringClient(server,session){
 const path='/api/founders/sessions/'+session.id;
 const tokens=Object.fromEntries(session.access.map(a=>[a.family,a.token]));
 return {
  projection:()=>server.request(path),
  regie:()=>server.request(path,{token:hotspringTestKey}),
  family:id=>server.request(path,{token:tokens[id]}),
  command:(s,kind,data={},family=null)=>server.request(path+'/commands',{
   token:family?tokens[family]:hotspringTestKey,body:{kind,data,expectedRevision:s.revision}
  })
 };
}

export async function playHotspringTo(client,phase,policy=trajectories.commerce){
 let s=await client.projection();
 for(let step=0;step<450&&s.phase!==phase;step++){
  const id=s.dilemma?.id;
  if(s.phase==='INTRO'||s.phase==='PRESENTATION'||s.phase==='REVEALED'||s.phase==='CHECKPOINT'){
   await client.command(s,'next');
  }else if(s.phase==='NEGOTIATION'){
   await client.command(s,'beginVote');
  }else if(s.phase==='COUNCIL'){
   const winner=id==='D30'?'pour':(policy.approve?policy.approve.includes(id):!policy.reject?.includes(id))?'pour':'contre';
   const v=s.council;
   if(v.phase==='await_moderator')await client.command(s,'resolveTie',{winner},s.moderator);
   else if(v.phase==='await_leader')await client.command(s,'chooseLeader',{family:v.pendingLeaderChoices[0]},s.moderator);
   else{
    const who=await client.family(v.turn);
    const vote=Object.hasOwn(v.choices,v.turn)?{kind:'maintien'}:who.self.power>0?{kind:winner,amount:1}:{kind:'passe_pouvoir'};
    await client.command(s,'vote',vote,v.turn);
   }
  }else if(s.phase==='CHARTER_SUPPORT'){
   const q=s.campaign.qualification,remaining=s.families.filter(f=>!Object.hasOwn(q.supports,f.id));
   const other=q.candidates.find(c=>c.id!==policy.charter)?.id;
   const first=s.families.findIndex(f=>f.id===remaining[0].id)<3;
   await client.command(s,'supportCharter',{charter:first?policy.charter:other},remaining[0].id);
  }else if(s.phase==='EPILOGUE'){
   await client.command(s,'showResults');
  }else throw new Error('Phase inattendue pendant la répétition : '+s.phase);
  s=await client.projection();
 }
 assert.equal(s.phase,phase,'La répétition atteint la phase demandée');
 return s;
}
