import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {parseFoundersSheets} from '../src/founders-sheet-import.ts';
import {LocalFoundersReleases} from '../server/founders-release-store.ts';
import {prepareFoundersSheetsImport} from '../server/founders-catalog.ts';

const fixture=()=>JSON.parse(readFileSync(new URL('../content/fondateurs-sheet-sample-v1.json',import.meta.url),'utf8'));
export function makeSheetsTabs(story=fixture()){
 const meta=story.scenario;
 const params=[
 ['clé','valeur','utilisation'],
 ['schema_version',story.schema_version,''],
 ['scenario_id',meta.id,''],['titre',meta.title,''],['univers',meta.universe,''],
 ['lieu',meta.location,''],['annee',meta.year,''],['point_entree',meta.entry_dilemma,''],
 ['statut',meta.status==='active'?'actif':meta.status==='archived'?'archive':'prototype','']
 ];
 const dilemmas=[['id','chapitre','titre','contexte_public','question_vote','libelle_pour','libelle_contre','consequence_pour','consequence_contre','image_url','image_alt','credit_image','licence_image','statut','tags','notes_auteur']];
 const effects=[['dilemme_id','issue','indicateur','operation','valeur','note_interne']];
 const branches=[['dilemme_id','issue','suivant_id','priorite','note_interne']];
 for(const d of story.dilemmas){
  dilemmas.push([d.id,d.chapter,d.title,d.public_text,d.vote_question,d.labels.pour,d.labels.contre,
   d.outcomes.pour.narration,d.outcomes.contre.narration,d.image.url||'',d.image.alt||'',
   d.image.credit||'',d.image.license||'',d.status==='active'?'actif':d.status==='archived'?'archive':'prototype',
   d.tags.join(';'),'']);
  for(const side of ['pour','contre']){
   for(const e of d.outcomes[side].effects)effects.push([d.id,side,e.indicator,e.operation,e.value??'','']);
   branches.push([d.id,side,d.outcomes[side].next_id??'FIN',1,'']);
  }
 }
 return {Parametres:params,Dilemmes:dilemmas,Effets:effects,Branches:branches};
}
const source={type:'google_sheets',spreadsheetId:'SAMPLE_SHEETS_123456789012345',label:'Scénario test'};
test('Sheets : 10 dilemmes, 46 effets et 20 branches exportés à l’identique',()=>{
 const r=parseFoundersSheets(makeSheetsTabs());
 assert.deepEqual(r.errors,[]);
 assert.equal(r.valid,true);
 assert.deepEqual(r.story,fixture());
 assert.deepEqual(r.counts,{dilemmas:10,effects:46,branches:20,missingImages:10});
 const p=prepareFoundersSheetsImport({source,tabs:makeSheetsTabs()});
 assert.equal(p.checksum,createHash('sha256').update(JSON.stringify(p.story)).digest('hex'));
});
test('Sheets : erreur de référence, lignes et colonnes localisées',()=>{
 const broken=makeSheetsTabs();
 broken.Branches[1][2]='D99';
 broken.Effets[1][4]='pas un nombre';
 broken.Dilemmes[2][0]='D01';
 const p=parseFoundersSheets(broken);
 assert.equal(p.valid,false);assert.equal(p.story,null);
 assert.ok(p.errors.some(x=>x.includes('D99')));
 assert.ok(p.errors.some(x=>x.includes('Effets!2')));
 assert.ok(p.errors.some(x=>x.includes('Dilemmes!3')));
 const noTab=makeSheetsTabs();delete noTab.Effets;
 assert.ok(parseFoundersSheets(noTab).errors.some(x=>x.includes('Effets')));
});
test('Sheets : cellules additionnelles, formule exécutable et URL javascript refusées',()=>{
 const broken=makeSheetsTabs();
 broken.Dilemmes[1][9]='javascript:alert(1)';
 assert.equal(parseFoundersSheets(broken).valid,false);
 const bad=makeSheetsTabs();bad.Effets[2][3]='execute';
 assert.equal(parseFoundersSheets(bad).valid,false);
 const noScript=makeSheetsTabs();noScript.Dilemmes[1][3]='<script>alert(1)</script> Un contrat';
 const parsed=parseFoundersSheets(noScript);
 // Data is preserved as untrusted text: never executed. Rendering must use textContent.
 assert.equal(parsed.valid,true);
 assert.equal(parsed.story.dilemmas[0].public_text,noScript.Dilemmes[1][3]);
});
test('SQLite : versions immuables, sources séparées, persistance après redémarrage',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pacte-founders-v24-'));
 const path=join(dir,'releases.sqlite');
 let db;
 try{
  db=new DatabaseSync(path);let studio=new LocalFoundersReleases(db);
  const parsed=prepareFoundersSheetsImport({source,tabs:makeSheetsTabs()});
  const args={ownerId:'local-organizer',source,payload:parsed.story,version:'1.0.0',checksum:parsed.checksum,now:123456};
  const release=studio.publish(args);
  assert.equal(release.dilemmas,10);
  assert.throws(()=>studio.publish(args),/Version déjà publiée/);
  assert.equal(studio.list('other-owner').length,0);
  db.close();db=new DatabaseSync(path);studio=new LocalFoundersReleases(db);
  assert.equal(studio.list('local-organizer').length,1);
  const second={...args,version:'1.1.0',now:123457};
  studio.publish(second);
  assert.deepEqual(studio.list('local-organizer').map(v=>v.version),['1.0.0','1.1.0']);
  assert.equal(studio.list('local-organizer')[0].source.spreadsheetId,source.spreadsheetId);
 }finally{db?.close();rmSync(dir,{recursive:true,force:true});}
});
