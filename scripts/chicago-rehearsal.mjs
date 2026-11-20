// SQLite preproduction launcher shared by the Windows kit and source checkout.
// Run from the repository with: node scripts/chicago-rehearsal.mjs <private-campaign.json>
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {networkInterfaces,homedir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {execFile} from 'node:child_process';
import {createServer} from 'node:http';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';
import {prepareCosaNostra} from '../server/cosa-nostra-preparation.ts';

const flags=process.argv.slice(2);
const source=flags.find(arg=>!arg.startsWith('--'))??'content/campagne-v3.json';
const prepared=prepareCosaNostra(JSON.parse(readFileSync(source,'utf8')));
const data=process.env.CHICAGO_REHEARSAL_DIR??resolve(process.env.LOCALAPPDATA??homedir(),'CosaNostra-Recette');
mkdirSync(data,{recursive:true});
const store=new GameStore(resolve(data,'chicago.sqlite'));
const old=store.narrative.getCosaNostraPreparation('local-organizer');
if(!old)store.narrative.saveCosaNostraPreparation('local-organizer',prepared,0);
const key=randomBytes(32).toString('base64url');
const lan=flags.includes('--lan');
const addresses=Object.values(networkInterfaces()).flat().filter(a=>a&&!a.internal&&a.family==='IPv4').map(a=>a.address);
if(lan&&!addresses.length)throw new Error('Aucune adresse IPv4 de réseau local disponible.');
const host=lan?addresses[0]:'127.0.0.1';
const port=Number(process.env.PORT??4242);
const origin='http://'+host+':'+port;
const transport=createGameServer(store,key,Date.now,{publicOrigin:origin});
const server=createServer((req,res)=>{
 if(req.url==='/entrer'||req.url==='/entree.js'){
  const script=req.url.endsWith('.js');
  res.writeHead(200,{'Content-Type':script?'text/javascript; charset=utf-8':'text/html; charset=utf-8',
   'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'});
  res.end(script?"const key=location.hash.slice(1); if(key)sessionStorage.setItem('pacte-founder-organizer-key',key); location.replace('/cosa-nostra');":
   '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Ouverture de la régie</title><script src="/entree.js" defer></script></html>');
 }else transport.emit('request',req,res);
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Le port est déjà utilisé. Fermez la répétition précédente.':error.message);store.close();process.exitCode=1;});
server.listen(port,lan?'0.0.0.0':'127.0.0.1',()=>{
 const url=origin+'/entrer#'+key;
 console.log('Cosa Nostra · Régie de recette\n'+url+'\nGardez cette fenêtre ouverte pendant la partie. Ctrl+C pour la fermer.\n');
 if(process.platform==='win32'&&!flags.includes('--no-browser'))execFile('rundll32.exe',['url.dll,FileProtocolHandler',url],error=>{if(error)console.log('Ouvrez le lien de régie affiché ci-dessus.');});
});
