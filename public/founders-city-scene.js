const METRICS=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
const DETAILS={
 economie:['Les étals sont fermés ; les échanges se font rares.','Quelques marchands approvisionnent la rue principale.','Le marché se remplit de marchandises et de chariots.'],
 securite:['Le bureau du shérif manque de moyens ; ses abords restent déserts.','Le bureau du shérif est entretenu et une patrouille veille.','Les lanternes éclairent les abords du bureau et la patrouille se renforce.'],
 satisfaction:['Des habitants se rassemblent avec des pancartes pour être entendus.','Les habitants se croisent et discutent dans la rue.','La terrasse et la place accueillent une fête des habitants.'],
 bien_etre:['Le dispensaire est peu équipé et le point d’eau attend des réparations.','Le dispensaire reçoit les habitants ; le puits est en service.','Le dispensaire est agrandi ; le puits et un jardin améliorent le quotidien.'],
 developpement:['La parcelle de la gare attend ses premiers travaux.','La gare est en chantier ; les charpentiers ont dressé une ossature.','La gare est achevée et le télégraphe relie la ville à l’extérieur.'],
 stabilite:['Des assemblées locales autonomes occupent la place du Conseil.','Les familles se réunissent autour d’un Conseil commun.','La mairie et les affichages municipaux structurent la vie publique.']
};
const LABELS={economie:'Économie',securite:'Sécurité',satisfaction:'Satisfaction',bien_etre:'Bien-être',developpement:'Développement',stabilite:'Stabilité'};
export function cityVisualState(city){
 return Object.fromEntries(METRICS.map(key=>{
  const value=city[key];if(!Number.isInteger(value)||value<0||value>10)throw new Error('Jauge de ville invalide : '+key);
  const level=value<=3?0:value<=6?1:2;
  return [key,{level,value,label:LABELS[key],description:DETAILS[key][level]}];
 }));
}
const windows=(x,y,n)=>Array.from({length:n},(_,i)=>`<g transform="translate(${x+i*38} ${y})"><rect width="23" height="31" fill="#93b3b5" stroke="#493829" stroke-width="4"/><path d="M11 0v31M0 15h23" stroke="#d6c3a0" stroke-width="2"/></g>`).join('');
const person=(x,y,color='#544e57')=>`<g transform="translate(${x} ${y})"><ellipse cy="15" rx="11" ry="3" fill="#674c3a" opacity=".2"/><path d="M-5 0l-2 15m12-15 2 15M-7-14H7L9 2H-9Z" fill="${color}" stroke="#493b35" stroke-width="2"/><circle cy="-22" r="6" fill="#d0a77c"/><path d="M-10-26h20m-15-1v-5h10v5" stroke="#5a4031" stroke-width="3"/></g>`;
const layer=(metric,level,content)=>`<g data-city-metric="${metric}" data-city-level="${level}" class="city-layer">${content}</g>`;
export function mountCity(root){
 // Template contains fixed artwork only. User/scenario strings use textContent below.
 root.innerHTML=`<svg viewBox="0 0 1440 650" role="img" aria-labelledby="townTitle townDesc">
 <title id="townTitle">Hot Spring, une ville qui évolue avec le Conseil</title><desc id="townDesc"></desc>
 <defs>
  <linearGradient id="townSky" x2="0" y2="1"><stop stop-color="#91aeb4"/><stop offset="1" stop-color="#f2d3a1"/></linearGradient>
  <linearGradient id="townGround" x2="0" y2="1"><stop stop-color="#c89d67"/><stop offset="1" stop-color="#e7c38b"/></linearGradient>
  <pattern id="townWood" width="35" height="13" patternUnits="userSpaceOnUse"><rect width="35" height="13" fill="#9a6c47"/><path d="M0 1h35M1 0v13" stroke="#744d34" stroke-width="1" opacity=".7"/></pattern>
  <pattern id="townRoof" width="20" height="12" patternUnits="userSpaceOnUse"><rect width="20" height="12" fill="#715447"/><path d="M0 1h20M1 0v12" stroke="#4a3e35" opacity=".4"/></pattern>
  <g id="townBarrel"><ellipse rx="11" ry="5" fill="#b28a53"/><path d="M-11 0l1 23q10 5 20 0L11 0" fill="#977046"/><path d="M-10 6h20m-20 12h20" stroke="#514c41" stroke-width="3"/><ellipse rx="11" ry="4" fill="#b89660"/></g>
 </defs>
 <rect width="1440" height="650" fill="url(#townSky)"/>
 <circle cx="1190" cy="90" r="47" fill="#ffe7b2" opacity=".85"/>
 <path d="M0 270 50 183 147 183 195 245 287 136 368 136 413 244 501 200 578 276 690 150 748 150 822 257 943 183 998 183 1060 274 1190 149 1280 149 1382 260 1440 224V410H0Z" fill="#b4957b"/>
 <path d="M0 303 165 238 298 292 430 248 560 310 741 241 913 305 1050 252 1190 309 1330 249 1440 290V410H0" fill="#bd9d79"/>
 <path d="M0 340Q650 286 1440 340V650H0Z" fill="url(#townGround)"/>
 <path d="M-50 572Q670 419 1490 540" fill="none" stroke="#bd945f" stroke-width="95" opacity=".45"/>
 <path d="M-50 580Q670 427 1490 548" fill="none" stroke="#f3d5a1" stroke-width="2" opacity=".6"/>
 <g fill="#8a976e" opacity=".8"><path d="M30 336v-70m0 38q-21 0-21-27m21 42q20 0 20-21" fill="none" stroke="#7c8966" stroke-width="9"/><path d="M1376 346v-75m0 40q-21 0-21-30m21 48q20 0 20-22" fill="none" stroke="#7c8966" stroke-width="9"/></g>
 <!-- Ground shadows and fixed buildings: positions never jump between stages. -->
 <g fill="#624c39" opacity=".15"><ellipse cx="203" cy="441" rx="160" ry="22"/><ellipse cx="483" cy="431" rx="119" ry="18"/><ellipse cx="755" cy="433" rx="126" ry="20"/><ellipse cx="1010" cy="436" rx="110" ry="20"/><ellipse cx="1258" cy="434" rx="105" ry="17"/></g>
 <!-- Saloon, with porch, balcony and carved false front. -->
 <g><rect x="73" y="276" width="244" height="153" fill="url(#townWood)" stroke="#62432f" stroke-width="3"/>
 <path d="M62 275h266v-14H62Z" fill="#503c2e"/><path d="M83 261v-38h224v38" fill="#a5784b" stroke="#60412e" stroke-width="4"/>
 <rect x="105" y="232" width="180" height="28" rx="2" fill="#dfc28e"/><text x="195" y="252" text-anchor="middle" class="building-sign">WILD GOAT SALOON</text>
 ${windows(100,289,5)}<rect x="169" y="361" width="54" height="67" fill="#493b30"/><path d="M170 378q12-10 25 0v32h-25m27-32q12-10 25 0v32h-25" fill="#ac8050"/>
 <path d="M60 345h270l-13 17H73Z" fill="url(#townRoof)" stroke="#574334" stroke-width="2"/>
 <path d="M77 360v76m237-76v76M77 425h237m-230 11h220" stroke="#5c4431" stroke-width="5"/>
 <path d="M80 337h230m-210-10v17m30-17v17m30-17v17m30-17v17m30-17v17m30-17v17m30-17v17" stroke="#ddbd87" stroke-width="3"/>
 </g>
 <!-- Sheriff office. -->
 <g><rect x="375" y="311" width="185" height="116" fill="#b99668" stroke="#796044" stroke-width="3"/><path d="M363 310h209v-17H363Z" fill="#674b34"/><rect x="392" y="272" width="152" height="34" fill="#d7bb87" stroke="#7c5a3c" stroke-width="3"/><text x="468" y="295" text-anchor="middle" class="building-sign">SHERIFF</text>
 ${windows(390,333,1)}<path d="M396 333v31m8-31v31" stroke="#454b47" stroke-width="3"/><rect x="475" y="350" width="45" height="77" fill="#574536"/><circle cx="509" cy="391" r="3" fill="#d5b678"/></g>
 <!-- Council hall, not inherently more beautiful at high Stability. -->
 <g><rect x="641" y="294" width="210" height="134" fill="#cfb88e" stroke="#8b7153" stroke-width="3"/><path d="M626 294l120-73 120 73Z" fill="url(#townRoof)"/><path d="M643 294l103-58 103 58Z" fill="#baa17a"/><circle cx="746" cy="266" r="14" fill="#e7d3a7" stroke="#6c5e47" stroke-width="3"/><path d="M746 255v11l8 3" fill="none" stroke="#665641" stroke-width="2"/>
 ${windows(660,321,1)}${windows(798,321,1)}<rect x="720" y="340" width="50" height="88" fill="#675543"/><path d="M710 431h70m-77 8h85" stroke="#9e805a" stroke-width="7"/>
 <rect x="684" y="299" width="126" height="24" fill="#e2ce9f"/><text x="747" y="316" text-anchor="middle" class="building-sign">CONSEIL</text></g>
 <!-- Dispensary. -->
 <g><rect x="923" y="324" width="170" height="105" fill="#c8b592" stroke="#897255" stroke-width="3"/><path d="M909 325l98-66 100 66Z" fill="url(#townRoof)"/>
 <rect x="953" y="314" width="115" height="24" fill="#e9d4a5"/><text x="1010" y="331" text-anchor="middle" class="building-sign">DISPENSAIRE</text>
 ${windows(938,353,1)}<rect x="1027" y="354" width="37" height="75" fill="#5c5141"/></g>
 <!-- Economy: shutters, modest trade, busy market. -->
 ${layer('economie',0,`<path d="M86 367h58v44H86m157-44h58v44h-58" fill="#775b43"/><path d="M89 370l52 37m105-37 52 37" stroke="#b59767" stroke-width="4"/><rect x="95" y="461" width="77" height="28" fill="#9a7d55"/><text x="133" y="480" text-anchor="middle" class="scene-note">MARCHÉ FERMÉ</text>`)}
 ${layer('economie',1,`<path d="M100 460v-53h111v53" fill="none" stroke="#795531" stroke-width="5"/><path d="M90 411h131l-12-18H102Z" fill="#a65b47"/><path d="M100 455h112" stroke="#755333" stroke-width="8"/><use href="#townBarrel" x="223" y="442"/>${person(130,448,'#796544')}`)}
 ${layer('economie',2,`<path d="M91 460v-59h140v59" fill="none" stroke="#795531" stroke-width="5"/><path d="M80 407h162l-15-23H97Z" fill="#a65b47"/><path d="M114 385l-7 22m37-22-3 22m36-22 1 22m35-22 6 22" stroke="#ead3a1" stroke-width="16"/><path d="M92 454h138" stroke="#765434" stroke-width="9"/><g fill="#cfab53"><circle cx="120" cy="445" r="8"/><circle cx="137" cy="445" r="8"/><circle cx="155" cy="445" r="8"/></g><use href="#townBarrel" x="246" y="439"/><use href="#townBarrel" x="270" y="446"/>${person(105,447,'#74604e')}${person(200,464,'#66796a')}<path d="M269 486h88v-32h-88Z" fill="#8e6039" stroke="#5e4934" stroke-width="3"/><circle cx="283" cy="491" r="13" fill="#5a4a39" stroke="#ba9561" stroke-width="4"/><circle cx="344" cy="491" r="13" fill="#5a4a39" stroke="#ba9561" stroke-width="4"/>`)}
 ${layer('securite',0,`<path d="M365 435l25-8m145 2 28 8" stroke="#8d7252" stroke-width="4"/><rect x="530" y="360" width="16" height="23" fill="#9a825b"/>`)}
 ${layer('securite',1,`${person(546,440,'#5e7080')}<path d="M365 430v-51h20" fill="none" stroke="#604b34" stroke-width="4"/><rect x="378" y="378" width="13" height="21" fill="#d1b272" stroke="#66513a" stroke-width="2"/>`)}
 ${layer('securite',2,`${person(544,442,'#5e7080')}${person(405,446,'#5e7080')}<g stroke="#614a33" stroke-width="4"><path d="M365 431v-61h19m186 61v-61h-17" fill="none"/></g><g fill="#f9d68e" stroke="#826641" stroke-width="2"><rect x="378" y="371" width="13" height="23"/><rect x="546" y="371" width="13" height="23"/></g><circle cx="385" cy="385" r="28" fill="#ffdc8e" opacity=".12"/><circle cx="551" cy="385" r="28" fill="#ffdc8e" opacity=".12"/>`)}
 ${layer('satisfaction',0,`${person(511,530,'#8b6351')}${person(548,539,'#62766e')}${person(584,528,'#7d6f91')}<path d="M513 516v-48m68 48v-48" stroke="#695137" stroke-width="3"/><rect x="495" y="463" width="38" height="23" fill="#e1cca1"/><rect x="563" y="463" width="43" height="23" fill="#e1cca1"/><text x="514" y="479" text-anchor="middle" class="scene-note">ÉCOUTEZ</text><text x="584" y="479" text-anchor="middle" class="scene-note">LE PEUPLE</text>`)}
 ${layer('satisfaction',1,`${person(500,515,'#8b6351')}${person(527,520,'#62766e')}${person(612,544,'#7d6f91')}`)}
 ${layer('satisfaction',2,`<path d="M340 355q170 77 290 0" stroke="#987049" stroke-width="2" fill="none"/><path d="M373 368l17 31 12-23m30 10 18 29 13-24m33 5 15 27 15-28m31-8 21 25 9-33" fill="#b9684d"/><path d="M405 378l17 30 12-22m30 6 16 30 12-27m35-1 19 28 10-34m30-11 20 25 9-34" fill="#e5c36f"/>${person(489,515,'#8b6351')}${person(518,527,'#62766e')}${person(562,515,'#7d6f91')}${person(600,540,'#b98d55')}<ellipse cx="355" cy="465" rx="24" ry="9" fill="#8b613e"/><path d="M355 466v27" stroke="#785333" stroke-width="5"/>`)}
 ${layer('bien_etre',0,`<path d="M1110 478h45m-41-1v-25h33v25m-37-27 22-14 23 14" fill="none" stroke="#8f7755" stroke-width="4"/><path d="M1119 453l24 21m-24-1 24-20" stroke="#a18b64" stroke-width="3"/>`)}
 ${layer('bien_etre',1,`<ellipse cx="1134" cy="478" rx="24" ry="9" fill="#b49d77"/><path d="M1111 476v-30h44v30" fill="#b49d77" stroke="#7b6a51" stroke-width="3"/><path d="M1104 445l30-23 30 23Z" fill="#786045"/><path d="M1134 446v21" stroke="#5d665e" stroke-width="3"/>${person(987,446,'#d7cbaa')}`)}
 ${layer('bien_etre',2,`<rect x="1093" y="363" width="53" height="66" fill="#d4c39e" stroke="#897255" stroke-width="3"/><path d="M1088 361h62v-8h-62" fill="#7e634b"/>${windows(1107,378,1)}<ellipse cx="1160" cy="489" rx="27" ry="9" fill="#b49d77"/><path d="M1134 487v-32h52v32" fill="#c4ad82" stroke="#7b6a51" stroke-width="3"/><path d="M1128 455l33-26 33 26Z" fill="#786045"/><path d="M1160 455v20" stroke="#5d665e" stroke-width="3"/>${person(989,448,'#d7cbaa')}${person(1056,454,'#75877a')}<g fill="#71875e"><ellipse cx="980" cy="487" rx="25" ry="8"/><ellipse cx="1041" cy="498" rx="31" ry="9"/></g><g fill="#ddbd70"><circle cx="968" cy="485" r="3"/><circle cx="985" cy="480" r="3"/><circle cx="1035" cy="493" r="3"/></g>`)}
 ${layer('developpement',0,`<path d="M1174 427h156m-144-3v-19m132 19v-19" stroke="#ac8961" stroke-width="3"/><path d="M1248 420v-53" stroke="#7c6649" stroke-width="3"/><rect x="1216" y="361" width="67" height="25" fill="#d8bd88"/><text x="1250" y="378" text-anchor="middle" class="scene-note">FUTURE GARE</text>`)}
 ${layer('developpement',1,`<g fill="none" stroke="#a67b4c" stroke-width="6"><path d="M1176 427V326h151v101m-151-101 76-54 75 54m-151 36h151m-151 30h151m-101-66v100m51-100v100m-95 0 143-101"/></g><path d="M1162 435h175m-160 9h130" stroke="#8d6841" stroke-width="7"/>${person(1211,445,'#7c6b53')}`)}
 ${layer('developpement',2,`<rect x="1176" y="326" width="151" height="101" fill="#a67e50" stroke="#73553a" stroke-width="3"/><path d="M1163 326l89-58 89 58Z" fill="url(#townRoof)"/><rect x="1216" y="358" width="40" height="69" fill="#564536"/>${windows(1280,351,1)}<rect x="1200" y="325" width="107" height="22" fill="#dfc38d"/><text x="1254" y="342" text-anchor="middle" class="building-sign">HOT SPRING</text><path d="M1360 427V214m-22 20h44m-44 16h44M0 217q500 72 1360 17" stroke="#5e5344" stroke-width="3" fill="none"/>${person(1309,445,'#6f7a77')}`)}
 ${layer('stabilite',0,`<g fill="#b19064" stroke="#806243" stroke-width="2"><ellipse cx="738" cy="507" rx="38" ry="12"/><path d="M738 509v26"/></g>${person(690,520,'#78684e')}${person(787,520,'#826854')}${person(739,552,'#667a72')}<rect x="697" y="466" width="83" height="20" fill="#e4d1a4"/><text x="738" y="480" text-anchor="middle" class="scene-note">ASSEMBLÉES LOCALES</text>`)}
 ${layer('stabilite',1,`${person(696,465,'#78684e')}${person(785,471,'#826854')}<rect x="812" y="373" width="31" height="35" fill="#c3a571" stroke="#7d6748" stroke-width="2"/><path d="M818 382h19m-19 7h19m-19 7h15" stroke="#806d51" stroke-width="2"/>`)}
 ${layer('stabilite',2,`<path d="M873 433V245" stroke="#76604a" stroke-width="4"/><path d="M875 247h58l-10 15 10 15h-58" fill="#6f8e98"/><rect x="805" y="362" width="39" height="51" fill="#be9e67" stroke="#7d6748" stroke-width="3"/><path d="M812 374h25m-25 9h25m-25 9h25m-25 9h18" stroke="#776548" stroke-width="2"/>${person(849,461,'#6d7583')}`)}
 <g fill="none" stroke="#ab895c" stroke-width="2" opacity=".65"><path d="M20 602q40-9 80 0m230-23q36-8 57-2m689 33q38-9 73-1m109-68q38-9 73-1"/><path d="M28 530l4-12 5 11m888 44 5-14 4 12m466-35 3-15 5 12" stroke="#7c8962"/></g>
 </svg>`;
}
export function updateCity(root,city){
 const states=cityVisualState(city);
 for(const node of root.querySelectorAll('[data-city-metric]'))node.hidden=Number(node.dataset.cityLevel)!==states[node.dataset.cityMetric].level;
 // SVG does not consistently honor HTMLElement.hidden, so set its display too.
 for(const node of root.querySelectorAll('[data-city-metric]'))node.style.display=Number(node.dataset.cityLevel)===states[node.dataset.cityMetric].level?'':'none';
 root.querySelector('#townDesc').textContent=Object.values(states).map(s=>s.label+' : '+s.value+'/10. '+s.description).join(' ');
 return states;
}
