import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ui=['founders-name-save.js','founders-setup.js','founders-import.js','founders-family.js','founders-city.js','founders-regie.js','founders-identity.js','founders-city-scene.js','founders-skin-theme.js','founders-skin-scenes.js','founders-skins.js','founders-painted-western.js'];
for(const name of ui){
 test('Syntaxe interface narrative : '+name,()=>{
  const file=fileURLToPath(new URL('../public/'+name,import.meta.url));
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(result.status,0,(result.stderr||result.stdout).slice(0,2000));
 });
}
