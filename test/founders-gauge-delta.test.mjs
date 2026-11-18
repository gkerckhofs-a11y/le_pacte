import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {gaugeDelta,appendGaugeDelta} from '../public/founders-live-ui.js';
test('Jauges : hausse verte, baisse rouge, zéro neutre et variation effective aux bornes',()=>{
 const s={reveal:{cityBefore:{economie:3,ecologie:6,securite:10,demographie:0},cityAfter:{economie:8,ecologie:4,securite:10,demographie:1}}};
 assert.deepEqual(gaugeDelta(s,'economie'),{value:5,text:'+5',kind:'positive',description:'Effet du dilemme : 3 → 8/10'});
 assert.equal(gaugeDelta(s,'ecologie').text,'−2');assert.equal(gaugeDelta(s,'ecologie').kind,'negative');assert.equal(gaugeDelta(s,'securite').kind,'neutral');assert.equal(gaugeDelta(s,'demographie').text,'+1');
 assert.equal(gaugeDelta({city:s.reveal.cityAfter},'economie'),null);
 const {document}=parseHTML('<strong id="score">8/10</strong>');globalThis.document=document;appendGaugeDelta(document.getElementById('score'),s,'economie');
 const badge=document.querySelector('.gauge-delta-positive');assert.equal(badge.textContent,'+5');assert.equal(badge.getAttribute('aria-label'),'Effet du dilemme : 3 → 8/10');
});
