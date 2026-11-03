import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameStore} from '../server/store.ts';
import {createGameServer} from '../server/http.ts';

const KEY='test-import-00000000000000000000000000';
const source={type:'google_sheets',spreadsheetId:'SCENARIO_SHEET_123456789012345',label:'Mini-prototype'};
function mini(){
 return {
 Parametres:[['clé','valeur'],['schema_version','1.0.0'],['scenario_id','scenario-western-import'],['titre','Les familles du rail'],['univers','western'],['lieu','Hot Spring'],['annee',1876],['point_entree','D01'],['statut','prototype']],
 Dilemmes:[['id','chapitre','titre','contexte_public','question_vote','libelle_pour','libelle_contre','consequence_pour','consequence_contre','image_url','image_alt','credit_image','licence_image','statut','tags','notes_auteur'],
 ['D01',1,'Le puits commun','Les habitants demandent une nouvelle installation pour avoir accès à l’eau.','Le Conseil finance-t-il le puits ?','Oui, financer','Non, refuser','Le puits est financé.','Le puits est refusé.','','Puits Western','','','prototype','eau;politique','']],
 Effets:[['dilemme_id','issue','indicateur','operation','valeur','note_interne'],['D01','pour','bien_etre','delta',2,''],['D01','contre','bien_etre','delta',-1,'']],
 Branches:[['dilemme_id','issue','suivant_id','priorite','note_interne'],['D01','pour','FIN',1,''],['D01','contre','FIN',1,'']]
 };
}
test('HTTP V2.4 : importer, vérifier, publier, sélectionner, ne pas exposer la source',async t=>{
 const store=new GameStore(':memory:');
 const server=createGameServer(store,KEY);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const req=async(path,body,token=KEY)=>{
  const result=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  return {status:result.status,data:await result.json()};
 };
 const input={source,tabs:mini()};
 let r=await req('/api/founders/import/preview',input,null);
 assert.equal(r.status,403);
 r=await req('/api/founders/import/preview',input);
 assert.equal(r.status,200);assert.equal(r.data.valid,true);assert.equal(r.data.counts.dilemmas,1);
 const checksum=r.data.checksum;
 const wrong=await req('/api/founders/import/publish',{...input,expectedChecksum:'0'.repeat(64),version:'1.0.0'});
 assert.equal(wrong.status,400);
 const good=await req('/api/founders/import/publish',{...input,expectedChecksum:checksum,version:'1.0.0'});
 assert.equal(good.status,201);assert.equal(good.data.scenarioId,'scenario-western-import');
 const repeat=await req('/api/founders/import/publish',{...input,expectedChecksum:checksum,version:'1.0.0'});
 assert.equal(repeat.status,400);
 const catalogResponse=await fetch(base+'/api/founders/catalog',{headers:{Authorization:'Bearer '+KEY}});
 const catalog=await catalogResponse.json();
 assert.equal(catalogResponse.status,200);
 const imported=catalog.scenarios.find(s=>s.id==='scenario-western-import');
 assert.equal(imported.version,'1.0.0');assert.equal(imported.sourceType,'google_sheets');
 assert.equal(JSON.stringify(catalog).includes(source.spreadsheetId),false);
 const preview=await req('/api/founders/preview',{scenarioId:'scenario-western-import',skinId:'western',members:[5,5,5,8,5,6]});
 assert.equal(preview.status,200);assert.equal(preview.data.previewOnly,true);assert.equal(preview.data.scenario.dilemmas[0].id,'D01');
 const page=await fetch(base+'/founders-import.html');
 assert.equal(page.status,200);assert.match(await page.text(),/Importer un scénario/);
 const js=await fetch(base+'/founders-import.js');assert.equal(js.status,200);
});
test('HTTP V2.4 : import atomique, correction des colonnes et scénario absent',async t=>{
 const store=new GameStore(':memory:'),server=createGameServer(store,KEY);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const broken=mini();broken.Branches[1][2]='D99';
 const r=await fetch(base+'/api/founders/import/preview',{method:'POST',headers:{Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify({source,tabs:broken})});
 assert.equal(r.status,200);
 const result=await r.json();assert.equal(result.valid,false);
 assert.ok(result.errors.some(e=>e.includes('D99')));
 assert.equal(store.founders.list('local-organizer').length,0);
});
