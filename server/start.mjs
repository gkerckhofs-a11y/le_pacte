import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {GameStore} from './store.ts';
import {createGameServer} from './http.ts';
const path=resolve(process.env.PACTE_DATABASE??'.data/le-pacte.sqlite');mkdirSync(dirname(path),{recursive:true,mode:0o700});
const store=new GameStore(path),token=process.env.PACTE_ORGANIZER_TOKEN??randomBytes(32).toString('base64url');
const host=process.env.PACTE_HOST??'127.0.0.1',port=Number(process.env.PORT??3000);
const server=createGameServer(store,token);
const timer=setInterval(()=>{try{store.advanceDue(Date.now());}catch{console.error('Transition automatique interrompue : vérifier la session en régie.');}},1000);
server.listen(port,host,()=>{
 console.log(`Le Pacte — répétition locale : http://${host}:${port}`);
 // Local operator handoff only; never emitted by an HTTP endpoint or request log.
 if(!process.env.PACTE_ORGANIZER_TOKEN)console.log(`Clé régie temporaire : ${token}`);
});
function stop(){clearInterval(timer);server.close(()=>{store.close();process.exit(0);});}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
