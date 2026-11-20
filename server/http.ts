import {chicagoSessionPreview} from './cosa-nostra-session.ts';
import {prepareCosaNostra} from './cosa-nostra-preparation.ts';
import qrcode from 'qrcode-generator';
import {checkedDilemmaDraft} from './hotspring-dilemma-drafts.ts';
import {checkedConfiguration} from './founders-configurations.ts';
import {checkedFacilitatorEmail} from './founders-facilitator.ts';
import {createServer} from 'node:http';
import {existsSync,readFileSync} from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
import {catalog,map} from './catalog.ts';
import {tokenHash} from './security.ts';
import type {StorePort,Operator} from './ports.ts';
import {accessQr,normalizeOrigin} from './qr.ts';
import {BUILTIN_ASSETS,GOAL_RULES} from '../src/studio.ts';
import {foundersCatalogFor,foundersPreviewFor,foundersStoryCheck,prepareFoundersSheetsImport} from './founders-catalog.ts';
import {DEFAULT_GOAL_CARDS,analyzeFoundersGoalReachability} from '../src/founders-scoring.ts';
import {simulateFoundersPolicies} from '../src/founders-policy-lab.ts';
import type {Actor} from '../src/session.ts';
export function createGameServer(store:StorePort,organizerToken:string,clock=()=>Date.now(),options:{clientAuth?:any;authEmulatorUrl?:string;apiOnly?:boolean;publicOrigin?:string;publicOrigins?:string[];verifyOperator?:(token:string)=>Promise<Operator|null>}={}){
 const publicOrigin=options.publicOrigin?normalizeOrigin(options.publicOrigin):null;
 const publicOrigins=new Set([publicOrigin,...(options.publicOrigins??[]).map(normalizeOrigin)]);
 const requestOrigin=(req:any)=>req.headers.origin??('https://'+req.headers.host);
 const publishedOrigin=(req:any)=>publicOrigins.has(requestOrigin(req))?requestOrigin(req):publicOrigin;
 if(!/^[A-Za-z0-9_-]{32,128}$/.test(organizerToken))throw new Error('Clé régie : au moins 32 caractères');
 const tokenDigest=Buffer.from(tokenHash(organizerToken),'hex');
 const staticFiles:Record<string,[string,string]>={ '/founders-regie-flow.js':['founders-regie-flow.js','text/javascript; charset=utf-8'], '/founders-name-save.js':['founders-name-save.js','text/javascript; charset=utf-8'], '/founders-painted-western.js':['founders-painted-western.js','text/javascript; charset=utf-8'], '/founders-skins.json':['../content/founders-skins-v1.json','application/json; charset=utf-8'], '/founders-skins.html':['founders-skins.html','text/html; charset=utf-8'], '/founders-skins.js':['founders-skins.js','text/javascript; charset=utf-8'], '/founders-skin-theme.js':['founders-skin-theme.js','text/javascript; charset=utf-8'], '/founders-skin-scenes.js':['founders-skin-scenes.js','text/javascript; charset=utf-8'], '/founders-identity.js':['founders-identity.js','text/javascript; charset=utf-8'], '/founders-city-scene.js':['founders-city-scene.js','text/javascript; charset=utf-8'], '/founders-live.css':['founders-live.css','text/css; charset=utf-8'], '/founders-city.html':['founders-city.html','text/html; charset=utf-8'], '/founders-city.js':['founders-city.js','text/javascript; charset=utf-8'], '/founders-family.html':['founders-family.html','text/html; charset=utf-8'], '/founders-family.js':['founders-family.js','text/javascript; charset=utf-8'], '/founders-regie.html':['founders-regie.html','text/html; charset=utf-8'], '/founders-regie.js':['founders-regie.js','text/javascript; charset=utf-8'], '/founders-import.html':['founders-import.html','text/html; charset=utf-8'], '/founders-import.js':['founders-import.js','text/javascript; charset=utf-8'], '/founders-setup.html':['founders-setup.html','text/html; charset=utf-8'], '/founders-setup.js':['founders-setup.js','text/javascript; charset=utf-8'], '/western-board.js':['western-board.js','text/javascript; charset=utf-8'],'/western-territories.js':['western-territories.js','text/javascript; charset=utf-8'],'/far-west.html':['far-west.html','text/html; charset=utf-8'],'/western-preview.js':['western-preview.js','text/javascript; charset=utf-8'],'/assets/western/frontier-terrain-v1.webp':['assets/western/frontier-terrain-v1.webp','image/webp'], '/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/studio.js':['studio.js','text/javascript; charset=utf-8'],'/animation.js':['animation.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
 for(const name of ['pacte-entry','founders-workspace','founders-live-ui','founders-print','founders-council-monitor','founders-vote-progress','founders-role-badges','founders-chronicle','founders-agreements','founders-fullscreen','founders-hotspring','hotspring-panorama','hotspring-rules','founders-univers','founders-atelier','founders-rehearsal','chicago-succession'])staticFiles['/'+name+'.js']=[name+'.js','text/javascript; charset=utf-8'];
 staticFiles['/hotspring.css']=['hotspring.css','text/css; charset=utf-8'];
 staticFiles['/territorial.html']=['territorial.html','text/html; charset=utf-8'];
 staticFiles['/regie']=staticFiles['/hotspring']=staticFiles['/founders-regie.html'];
 staticFiles['/hotspring/nouvelle-partie']=staticFiles['/founders-setup.html'];
 staticFiles['/hotspring/atelier']=['founders-atelier.html','text/html; charset=utf-8'];
 staticFiles['/cosa-nostra']=staticFiles['/cosa-nostra.html']=['cosa-nostra.html','text/html; charset=utf-8'];
 staticFiles['/cosa-nostra.js']=['cosa-nostra.js','text/javascript; charset=utf-8'];
 staticFiles['/regie-test']=staticFiles['/regie-test.html']=['regie-test.html','text/html; charset=utf-8'];
 staticFiles['/regie-test.js']=['regie-test.js','text/javascript; charset=utf-8'];
 staticFiles['/univers.css']=['univers.css','text/css; charset=utf-8'];
 for(let i=1;i<=10;i++){const path='/assets/western/dilemmas/d'+String(i).padStart(2,'0')+'.jpg';staticFiles[path]=[path.slice(1),'image/jpeg'];}
 for(const name of ['reference',...['economie','securite','satisfaction','bien_etre','developpement','stabilite'].flatMap(k=>[k+'-low',k+'-high'])]){
  const path='/assets/western/painted/'+name+'.jpg';staticFiles[path]=[path.slice(1),'image/jpeg'];
 }
 const limiter=new Map<string,{until:number;count:number}>();
 function bearer(req:any){const h=req.headers.authorization;if(!h)return null;if(!/^Bearer [A-Za-z0-9_.-]{32,8192}$/.test(h))throw new Error('Accès invalide');return h.slice(7);}
 function isOrg(t:string|null){return t!==null&&timingSafeEqual(tokenDigest,Buffer.from(tokenHash(t),'hex'));}
 async function requireOrg(req:any,studio=false):Promise<Actor>{
  const t=bearer(req);
  if(options.verifyOperator){const p=t?await options.verifyOperator(t):null;if(!p||!(studio?p.editor:p.organizer))throw new Error('Accès régie ou éditeur requis');return{role:'organizer',id:p.uid,editor:p.editor};}
  if(!isOrg(t))throw new Error('Accès régie requis');return{role:'organizer',id:'local-organizer',editor:true};
 }
 async function narrativeOperator(req:any){
  if(!options.verifyOperator)return requireOrg(req);
  const token=bearer(req);
  const person=token?await options.verifyOperator(token):null;
  if(!person)throw new Error('Accès régie requis');
  return {role:'operator',id:person.uid,organizer:person.organizer,email:person.email};
 }
 async function actorFor(req:any,id:string):Promise<Actor|{role:'public'}> {
  const t=bearer(req);if(!t)return{role:'public'};
  if(options.verifyOperator&&t.includes('.'))return requireOrg(req);
  if(!options.verifyOperator&&isOrg(t))return{role:'organizer',id:'local-organizer',editor:true};
  return await store.authenticateTeam(id,t,clock());
 }
 async function body(req:any,limit=24576){if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new Error('JSON requis');let data='',size=0;if(Buffer.isBuffer(req.rawBody)){if(req.rawBody.length>limit)throw new Error('Requête trop volumineuse');data=req.rawBody.toString('utf8');}else{for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Requête trop volumineuse');data+=chunk;}}try{return JSON.parse(data);}catch{throw new Error('JSON invalide');}}
 const server=createServer(async(req,res)=>{
  const json=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://sheets.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com; img-src 'self' data: https:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try {
   const url=new URL(req.url??'/','http://localhost');const path=url.pathname;
   if(!options.apiOnly&&req.method==='GET'&&staticFiles[path]){const [file,type]=staticFiles[path];res.writeHead(200,{'Content-Type':type});res.end(readFileSync(new URL(`../public/${file}`,import.meta.url)));return;}
   if(!options.apiOnly&&req.method==='GET'&&(/^\/assets\/chicago\/v3\/[a-z0-9-]+\.webp$/.test(path)||/^\/assets\/hotspring\/v1\/\w+\/[\w-]+\.webp$/.test(path))){
    const file=new URL('../public'+path,import.meta.url);
    if(existsSync(file)){res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400'});res.end(readFileSync(file));return;}
   }
   if(!path.startsWith('/api/')){json(404,{error:'Page introuvable'});return;}
   // No cookie authentication. Cross-origin requests and DNS-rebinding writes are refused.
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host&&!publicOrigins.has(new URL(req.headers.origin).origin)){json(403,{error:'Origine refusée'});return;}
   const bucketKey=req.socket.remoteAddress??'unknown',now=clock();let bucket=limiter.get(bucketKey);
   if(!bucket||bucket.until<now){bucket={until:now+60000,count:0};limiter.set(bucketKey,bucket);}
   if(++bucket.count>1200){json(429,{error:'Trop de requêtes, réessayez dans une minute'});return;}
   if(limiter.size>1000)for(const [k,b] of limiter)if(b.until<now)limiter.delete(k);
   // Narrative studio : authenticated organizer only. Does not mutate territorial sessions.
      if (path === "/api/founders/configurations") {
        const actor = await requireOrg(req);
        if (req.method === "GET") {
          json(200, { configurations: await store.narrative.listConfigurations(actor.id) });
          return;
        }
        if (req.method === "POST") {
          const d = await body(req, 24e3), preview = await foundersPreviewFor(store, actor.id, d.config);
          const config = checkedConfiguration(preview, d, actor.id, now);
          json(201, await store.narrative.saveConfiguration(actor.id, config, now));
          return;
        }
        json(405, { error: "M\xE9thode refus\xE9e" });
        return;
      }
      if (path === "/api/founders/access-qr" && req.method === "POST") {
        const actor=await narrativeOperator(req), d=await body(req,1e3);
        const sessionView=await store.narrative.view(d.session, actor, now);
        const team3 = await store.narrative.authenticate(d.session, d.token, now);
        const familyView=await store.narrative.view(d.session,team3,now);
        if(d.family!==undefined&&d.family!==team3.family)throw new Error('Famille du QR incohérente');
        if(familyView.self.id!==team3.family)throw new Error('Terminal du QR incohérent');
        const origin=publicOrigin?(publicOrigins.has(d.origin)?d.origin:publishedOrigin(req)):normalizeOrigin(d.origin);
        const link2 = origin + "/founders-family.html?session=" + d.session + "&family=" + team3.family + "#token=" + encodeURIComponent(d.token);
        const qr2 = qrcode(0, "M");
        qr2.addData(link2, "Byte");
        qr2.make();
        json(200, { session:d.session,code:sessionView.code,name:familyView.self.name,revision:sessionView.revision,verifiedAt:now,family: team3.family, link: link2, svg: qr2.createSvgTag({ cellSize: 4, margin: 16, scalable: true }) });
        return;
      }
   if(path==='/api/founders/catalog'&&req.method==='GET'){
    const actor=await requireOrg(req);json(200,await foundersCatalogFor(store,actor.id));return;
   }
   if(path==='/api/founders/preview'&&req.method==='POST'){
    const actor=await requireOrg(req);json(200,await foundersPreviewFor(store,actor.id,await body(req,4096)));return;
   }
   if(path==='/api/founders/scoring/analyze'&&req.method==='POST'){
    const actor=await requireOrg(req);
    const d=await body(req,12000);
    const p=await foundersPreviewFor(store,actor.id,{
      scenarioId:d.scenarioId,scenarioVersion:d.scenarioVersion,skinId:d.skinId,members:d.members,
      calibration:d.calibration
    });
    if(p.scenario.campaign)throw new Error('La campagne Hotspring utilise son propre barème sur 18 points.');
    json(200,analyzeFoundersGoalReachability(p.scenario,d.goalCards??DEFAULT_GOAL_CARDS,
      {initialCity:p.game.city}));return;
   }
   if(path==='/api/founders/scoring/simulate'&&req.method==='POST'){
    const actor=await requireOrg(req);
    const d=await body(req,12000);
    const p=await foundersPreviewFor(store,actor.id,{
      scenarioId:d.scenarioId,scenarioVersion:d.scenarioVersion,skinId:d.skinId,members:d.members,
      calibration:d.calibration
    });
    if(p.scenario.campaign)throw new Error('La campagne Hotspring utilise son propre barème sur 18 points.');
    json(200,simulateFoundersPolicies(p.scenario,{
      cards:d.goalCards,rule:d.scoreRules,calibration:p.settings.calibration,members:p.settings.members,
      runs:d.runs,mode:d.mode,seed:d.seed
    }));return;
   }
   if(path==='/api/founders/stories/check'&&req.method==='POST'){
    await requireOrg(req);json(200,foundersStoryCheck(await body(req,700000)));return;
   }
   if(path==='/api/founders/import/preview'&&req.method==='POST'){
    await requireOrg(req);
    const parsed=prepareFoundersSheetsImport(await body(req,950000));
    json(200,parsed);return;
   }
   if(path==='/api/founders/import/publish'&&req.method==='POST'){
    const actor=await requireOrg(req);
    if(!store.founders)throw new Error('Studio narratif indisponible');
    const d=await body(req,950000),parsed=prepareFoundersSheetsImport(d);
    if(!parsed.valid){json(400,{errors:parsed.errors});return;}
    if(typeof d.expectedChecksum!=='string'||parsed.checksum!==d.expectedChecksum)
      throw new Error('Le contenu a changé depuis la prévisualisation : recommencer');
    if(typeof d.version!=='string'||!/^[1-9]\d*\.\d+\.\d+$/.test(d.version))
      throw new Error('Version semver requise (exemple : 1.0.0)');
    const published=await store.founders.publish({
      ownerId:actor.id,source:d.source,payload:parsed.story,version:d.version,
      checksum:parsed.checksum,now
    });
    json(201,{...published,warnings:parsed.warnings});return;
   }

   if(path==='/api/founders/cosa-nostra/preparation'){
    const actor=await requireOrg(req);
    const previous=await store.narrative.getCosaNostraPreparation(actor.id);
    if(req.method==='GET'){
     const preparation=previous?.campaign?.metadata?.vote_format==='POUR_CONTRE'?previous:null;
     if(previous&&!preparation){json(200,{preparation:null,legacyRevision:previous.revision});return;}
     json(200,{preparation});return;
    }
    if(req.method==='PUT'){
     const input=await body(req,200_000);
     if(input?.revision!==(previous?.revision??0)){
      json(409,{error:'La préparation a changé. Rechargez la page.'});return;
     }
     const importing=Object.hasOwn(input,'campaign');
     if(!importing&&!previous)throw new Error('Importez la campagne V3 avant de préparer le parcours.');
     if(!importing&&!Array.isArray(input.crisisIds))throw new Error('Sélection de crises requise.');
     if(Object.hasOwn(input,'ballots'))throw new Error('Les issues POUR/CONTRE sont fixées dans la campagne V3.');
     const prepared=importing?prepareCosaNostra(input.campaign):prepareCosaNostra(previous.campaign,input.crisisIds);
     try{
      json(200,{preparation:await store.narrative.saveCosaNostraPreparation(actor.id,prepared,input.revision)});
     }catch(error){
      if(error.message!=='La préparation a changé. Rechargez la page.')throw error;
      json(409,{error:error.message});
     }
     return;
    }
    json(405,{error:'Méthode refusée'});return;
   }

   if(path==='/api/founders/cosa-nostra/sessions'&&req.method==='POST'){
    const actor=await requireOrg(req), input=await body(req,4000);
    const stored=await store.narrative.getCosaNostraPreparation(actor.id);
    if(!stored)throw new Error('Importez la campagne avant de créer une répétition.');
    if(input?.revision!==stored.revision){json(409,{error:'La préparation a changé. Rechargez la page.'});return;}
    const preparation=prepareCosaNostra(stored.campaign,stored.crisisIds);
    const {preview,names}=chicagoSessionPreview(preparation,input.members);
    const created=await store.narrative.create({ownerId:actor.id,preview,names,code:input.code,title:input.title,rehearsal:input.rehearsal===true,now,
     timing:{negotiationSeconds:480,voteSeconds:180,resolutionSeconds:20,autoAdvance:false}});
    json(201,created);return;
   }

   const draftMatch=path.match(/^\/api\/founders\/hotspring\/drafts(?:\/([a-f0-9]{24}))?$/);
   if(draftMatch){
    const actor=await requireOrg(req),draftId=draftMatch[1];
    if(!draftId&&req.method==='GET'){json(200,{drafts:await store.narrative.listDilemmaDrafts(actor.id)});return;}
    if(draftId?req.method==='PUT':req.method==='POST'){
     const draft=checkedDilemmaDraft(await body(req,48000));
     json(draftId?200:201,await store.narrative.saveDilemmaDraft(actor.id,draftId,draft,now));return;
    }
    json(405,{error:'Méthode refusée'});return;
   }
   // Narrative sessions use separate Firestore / SQLite collections from
   // legacy territorial sessions. Never treat team access as organizer access.
   if(path==='/api/founders/sessions'){
    const actor=await requireOrg(req);
    if(!store.narrative)throw new Error('Parties narratives non disponibles');
    if(req.method==='GET'){json(200,{sessions:await store.narrative.list(actor.id)});return;}
    if(req.method==='POST'){
     const d=await body(req,16000);
     const preview=await foundersPreviewFor(store,actor.id,d);
     const created=await store.narrative.create({
      ownerId:actor.id,preview,code:d.code,title:d.title,rehearsal:d.rehearsal===true,
      objectives:d.objectives,names:d.names,colors:d.colors,goalCards:d.goalCards,scoreRules:d.scoreRules,timing:d.timing,gaugeThresholds:d.gaugeThresholds,crisisMode:d.crisisMode,presentationSeconds:d.presentationSeconds,now
     });
     json(201,created);return;
    }
   }
   if(path==='/api/founders/sessions/archive'&&req.method==='POST'){
    const actor=await requireOrg(req);
    if(!store.narrative)throw new Error('Parties narratives non disponibles');
    json(200,{archived:await store.narrative.archiveAll(actor.id,now)});return;
   }
   const artMatch=path.match(/^\/api\/founders\/sessions\/([a-f0-9]{24})\/illustrations\/(0[1-5]0[1-6]-(?:intro|pour|contre)\.webp)$/);
   if(artMatch && req.method==='GET'){
    const view=await store.narrative.view(artMatch[1],{role:'public'},now);
    const visible=view.dilemma?.image?.url===path || view.history.some(h=>h.image?.url===path);
    const file=new URL('../content/chicago-media/'+artMatch[2],import.meta.url);
    if(!view.succession || !visible || !existsSync(file)){json(404,{error:'Illustration indisponible'});return;}
    res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'private, max-age=86400'});
    res.end(readFileSync(file));return;
   }
   const narrativeMatch=path.match(/^\/api\/founders\/sessions\/([a-f0-9]{24})(?:\/(commands|access|variant|facilitator)(?:\/([A-F]))?)?$/);
   if(narrativeMatch){
    if(!store.narrative)throw new Error('Parties narratives non disponibles');
    const [,sessionId,verb,family]=narrativeMatch;
    if(verb==='variant'&&!family&&req.method==='POST'){
     const actor=await requireOrg(req);
     json(201,await store.narrative.duplicate(sessionId,actor.id,now));return;
    }
    if(verb==='facilitator'&&!family&&req.method==='PUT'){
     const owner=await requireOrg(req);
     if(!options.verifyOperator)throw new Error('Les invitations nécessitent la connexion Google.');
     const d=await body(req,1000);
     const email=checkedFacilitatorEmail(d?.email);
     json(200,{facilitatorEmail:await store.narrative.setFacilitator(sessionId,owner.id,email)});return;
    }
    if(verb==='access'&&family&&req.method==='POST'){
     const actor=await narrativeOperator(req);
     json(200,await store.narrative.rotate(sessionId,family,actor,now));return;
    }
    const token=bearer(req);
    let actor;
    if(!token)actor={role:'public'};
    else if(options.verifyOperator&&token.includes('.'))actor=await narrativeOperator(req);
    else if(!options.verifyOperator&&isOrg(token))actor={role:'organizer',id:'local-organizer'};
    else actor=await store.narrative.authenticate(sessionId,token,now);
    if(!verb&&req.method==='GET'){json(200,await store.narrative.view(sessionId,actor,now));return;}
    if(verb==='commands'&&req.method==='POST'){
     if(actor.role==='public'){json(403,{error:'Accès porte-parole ou régie requis'});return;}
     const command=await body(req,16000);
     json(200,await store.narrative.command(sessionId,actor,command,now));return;
    }
    json(405,{error:'Méthode refusée'});return;
   }
   if(path==='/api/catalog'&&req.method==='GET'){json(200,{editions:catalog,map,goalRules:GOAL_RULES,authMode:options.verifyOperator?'firebase':'local',...(options.clientAuth?{firebaseConfig:options.clientAuth}:{}),...(options.authEmulatorUrl?{authEmulatorUrl:options.authEmulatorUrl}:{}),serverNow:now});return;}
   if(path==='/api/editions'&&req.method==='GET'){const actor=await requireOrg(req);const list=await store.studio.list((actor as {id:string}).id);json(200,{releases:list.releases,canEdit:(actor as {editor?:boolean}).editor===true});return;}
   if(path.startsWith('/api/studio')){
    const actor=await requireOrg(req,true);const ownerId=(actor as {id:string}).id;
    if(path==='/api/studio'&&req.method==='GET'){json(200,{...await store.studio.list(ownerId),builtinAssets:BUILTIN_ASSETS,goalRules:GOAL_RULES});return;}
    if(path==='/api/studio/drafts'&&req.method==='POST'){json(201,await store.studio.create(await body(req,131072),catalog,clock(),ownerId));return;}
    const route=path.match(/^\/api\/studio\/(drafts|releases)\/([a-f0-9]{24}(?:-v[1-9][0-9]*)?)(?:\/(check|publish|export))?$/);
    if(!route){json(404,{error:'Route studio introuvable'});return;}
    const [,collection,id,action]=route;
    if(req.method==='GET'&&!action){json(200,collection==='drafts'?await store.studio.draft(id,ownerId):await store.studio.release(id,ownerId));return;}
    if(req.method==='GET'&&action==='export'){json(200,await store.studio.export(collection as any,id,ownerId));return;}
    if(collection==='drafts'&&req.method==='PUT'&&!action){const d=await body(req,131072);json(200,await store.studio.save(id,d.revision,d.edition,clock(),ownerId));return;}
    if(collection==='drafts'&&req.method==='POST'&&action==='check'){json(200,await store.studio.check(id,ownerId));return;}
    if(collection==='drafts'&&req.method==='POST'&&action==='publish'){const d=await body(req);json(201,await store.studio.publish(id,d.revision,clock(),ownerId));return;}
    json(405,{error:'Une version publiée est en lecture seule'});return;
   }
   if(path==='/api/sessions'){
    const actor=await requireOrg(req);const ownerId=(actor as {id:string}).id;
    if(req.method==='GET'){json(200,{sessions:await store.list(ownerId),serverNow:now});return;}
    if(req.method==='POST'){const d=await body(req);json(201,await store.create(d.code,d.title,d.themeId,clock(),d.releaseId,ownerId));return;}
   }
   const match=path.match(/^\/api\/sessions\/([a-f0-9]{24})(?:\/(commands|check|export|access)(?:\/([a-z]+))?(?:\/(qr))?)?$/);
   if(!match){json(404,{error:'Route introuvable'});return;}
   const [,id,action,team,qr]=match;
   const accessOrigin=publishedOrigin(req)??normalizeOrigin('http://'+req.headers.host);
   if(qr&&action!=='access'){json(404,{error:'Route introuvable'});return;}
   if(qr&&req.method==='POST'){const operator=await requireOrg(req);if(store.assertOwner)await store.assertOwner(id,(operator as {id:string}).id);const d=await body(req);if(typeof d.teamToken!=='string')throw new Error('Clé équipe requise');const actor=await store.authenticateTeam(id,d.teamToken,clock(),false);if(actor.role!=='team'||actor.team!==team)throw new Error('Accès QR invalide');json(200,accessQr(accessOrigin,id,d.teamToken));return;}
   if(action==='access'&&req.method==='POST'){const operator=await requireOrg(req);json(200,{team,token:await store.rotate(id,team as any,now,(operator as {id:string}).id)});return;}
   const actor=await actorFor(req,id);
   if(!action&&req.method==='GET'){json(200,{...await store.view(id,actor,now),accessOrigin});return;}
   if(action==='export'&&req.method==='GET'){const operator=await requireOrg(req);json(200,await store.get(id,(operator as {id:string}).id));return;}
   if(actor.role==='public'){json(403,{error:'Accès équipe ou régie requis'});return;}
   if(action==='check'&&req.method==='POST'){const data=await body(req);json(200,await store.validate(id,actor,data,clock()));return;}
   if(action==='commands'&&req.method==='POST'){const data=await body(req);json(200,await store.command(id,actor,data,clock()));return;}
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
