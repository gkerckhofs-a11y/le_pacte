import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
import {GameStore,catalog,map,tokenHash} from './store.ts';
import type {Actor} from '../src/session.ts';
export function createGameServer(store:GameStore,organizerToken:string,clock=()=>Date.now()){
 if(!/^[A-Za-z0-9_-]{32,128}$/.test(organizerToken))throw new Error('Clé régie : au moins 32 caractères');
 const tokenDigest=Buffer.from(tokenHash(organizerToken),'hex');
 const staticFiles:Record<string,[string,string]>={ '/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
 const limiter=new Map<string,{until:number;count:number}>();
 function bearer(req:any){const h=req.headers.authorization;if(!h)return null;if(!/^Bearer [A-Za-z0-9_-]{32,128}$/.test(h))throw new Error('Accès invalide');return h.slice(7);}
 function isOrg(t:string|null){return t!==null&&timingSafeEqual(tokenDigest,Buffer.from(tokenHash(t),'hex'));}
 function requireOrg(req:any):Actor{if(!isOrg(bearer(req)))throw new Error('Accès régie requis');return{role:'organizer',id:'local-organizer'};}
 function actorFor(req:any,id:string):Actor|{role:'public'} {const t=bearer(req);return isOrg(t)?{role:'organizer',id:'local-organizer'}:t?store.authenticateTeam(id,t,clock()):{role:'public'};}
 async function body(req:any){if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new Error('JSON requis');let data='',size=0;for await(const chunk of req){size+=chunk.length;if(size>24576)throw new Error('Requête trop volumineuse');data+=chunk;}try{return JSON.parse(data);}catch{throw new Error('JSON invalide');}}
 const server=createServer(async(req,res)=>{
  const json=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try {
   const url=new URL(req.url??'/','http://localhost');const path=url.pathname;
   if(req.method==='GET'&&staticFiles[path]){const [file,type]=staticFiles[path];res.writeHead(200,{'Content-Type':type});res.end(readFileSync(new URL(`../public/${file}`,import.meta.url)));return;}
   if(!path.startsWith('/api/')){json(404,{error:'Page introuvable'});return;}
   // No cookie authentication. Cross-origin requests and DNS-rebinding writes are refused.
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){json(403,{error:'Origine refusée'});return;}
   const bucketKey=req.socket.remoteAddress??'unknown',now=clock();let bucket=limiter.get(bucketKey);
   if(!bucket||bucket.until<now){bucket={until:now+60000,count:0};limiter.set(bucketKey,bucket);}
   if(++bucket.count>1200){json(429,{error:'Trop de requêtes, réessayez dans une minute'});return;}
   if(limiter.size>1000)for(const [k,b] of limiter)if(b.until<now)limiter.delete(k);
   if(path==='/api/catalog'&&req.method==='GET'){json(200,{editions:catalog,map,serverNow:now});return;}
   if(path==='/api/sessions'){
    requireOrg(req);
    if(req.method==='GET'){json(200,{sessions:store.list(),serverNow:now});return;}
    if(req.method==='POST'){const d=await body(req);json(201,store.create(d.code,d.title,d.themeId,now));return;}
   }
   const match=path.match(/^\/api\/sessions\/([a-f0-9]{24})(?:\/(commands|check|export|access)(?:\/([a-z]+))?)?$/);
   if(!match){json(404,{error:'Route introuvable'});return;}
   const [,id,action,team]=match;
   if(action==='access'&&req.method==='POST'){requireOrg(req);json(200,{team,token:store.rotate(id,team as any,now)});return;}
   const actor=actorFor(req,id);
   if(!action&&req.method==='GET'){json(200,store.view(id,actor,now));return;}
   if(action==='export'&&req.method==='GET'){requireOrg(req);json(200,store.get(id));return;}
   if(actor.role==='public'){json(403,{error:'Accès équipe ou régie requis'});return;}
   if(action==='check'&&req.method==='POST'){const data=await body(req);json(200,store.validate(id,actor,data,clock()));return;}
   if(action==='commands'&&req.method==='POST'){const data=await body(req);json(200,store.command(id,actor,data,clock()));return;}
   json(405,{error:'Méthode refusée'});
  }catch(e){
   const message=e instanceof Error?e.message:'Erreur serveur';
   const status=/Accès|régie requis/.test(message)?403:/introuvable/.test(message)?404:400;
   // Internal database details, stack traces and credentials stay off the wire.
   json(status,{error:/SQLITE|database|constraint|Cannot read|undefined|is not a function/i.test(message)?'Requête invalide ou conflit de données':message});
  }
 });
 return server;
}
