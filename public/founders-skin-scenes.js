// Native vector illustrations. All SVG text comes from fixed artwork, never scenario input.
const metrics=['economie','securite','satisfaction','bien_etre','developpement','stabilite'];
export const UNIVERSE_DETAILS={
 mafia:{
 economie:['Les rideaux des commerces sont baissés.','Les boutiques du quartier accueillent leurs clients.','Les vitrines, livraisons et étals animent le quartier.'],
 securite:['Le commissariat manque de moyens.','Une patrouille surveille le carrefour.','Un poste éclairé et deux patrouilles couvrent le quartier.'],
 satisfaction:['Des habitants manifestent avec des pancartes.','Les habitants se croisent sur la place.','La place et le club accueillent une soirée de quartier.'],
 bien_etre:['Le dispensaire de quartier est peu équipé.','Le dispensaire assure les soins courants.','Un nouveau pavillon et un jardin complètent le dispensaire.'],
 developpement:['Le terrain de la nouvelle ligne est encore vide.','Une structure de transport est en chantier.','La station est ouverte et les lignes desservent le quartier.'],
 stabilite:['Les associations de quartier se réunissent librement.','Les représentants siègent à un Conseil commun.','La mairie centralise les services et les affichages publics.']},
 medieval:{
 economie:['La halle reste fermée et les charrettes se font rares.','Les marchands ouvrent quelques étals.','La halle accueille des étals et des livraisons de vivres.'],
 securite:['Le poste de garde manque de moyens.','Les gardes veillent à la porte de la cité.','Une tour équipée renforce la garde de la porte.'],
 satisfaction:['Les habitants portent leurs doléances sur la place.','Les habitants discutent près de la fontaine.','Des bannières et des tablées animent la place.'],
 bien_etre:['L’hospice est peu équipé.','L’hospice et le puits accueillent les habitants.','Un jardin de simples et une aile de soins agrandissent l’hospice.'],
 developpement:['Le terrain des ateliers attend les bâtisseurs.','Les charpentiers dressent les premiers ateliers.','Les ateliers sont achevés et un moulin est en service.'],
 stabilite:['Les assemblées des bourgs décident de façon autonome.','Les représentants des bourgs se réunissent au Conseil.','La maison du Conseil rassemble les services du royaume.']},
 corporate:{
 economie:['L’espace commercial fonctionne au ralenti.','Les équipes accueillent les clients dans le pavillon.','Le pavillon et ses espaces de rencontre sont très actifs.'],
 securite:['Le service de conformité manque de moyens.','Un point d’accueil et de contrôle fonctionne.','Le service de conformité dispose d’un pavillon renforcé.'],
 satisfaction:['Des délégations expriment leurs revendications sur le campus.','Les collaborateurs échangent sur l’esplanade.','Des rencontres et des activités animent l’esplanade.'],
 bien_etre:['L’espace de santé et de repos est peu équipé.','L’espace de santé accueille les collaborateurs.','Un jardin et un pavillon de repos complètent l’espace de santé.'],
 developpement:['La parcelle du laboratoire attend ses travaux.','Le nouveau laboratoire est en construction.','Le laboratoire et ses équipements d’innovation sont ouverts.'],
 stabilite:['Les équipes se réunissent en groupes autonomes.','Les délégations siègent dans un Conseil commun.','Le siège central rassemble les services et les décisions.']},
 futuriste:{
 economie:['Les comptoirs d’échange restent fermés.','Quelques comptoirs approvisionnent la colonie.','Les comptoirs et les navettes de fret sont très actifs.'],
 securite:['Le poste de surveillance manque d’équipements.','Une patrouille veille près du sas de la colonie.','Des balises et une patrouille renforcent la surveillance.'],
 satisfaction:['Des colons portent leurs revendications sur l’agora.','Les colons se rencontrent sur l’agora.','Des rencontres et des installations lumineuses animent l’agora.'],
 bien_etre:['Le module médical est peu équipé.','Le module médical est en service.','Une serre et un module de soins agrandissent le centre médical.'],
 developpement:['La parcelle du laboratoire attend ses premiers modules.','Une ossature de laboratoire est en construction.','Le laboratoire et son antenne de recherche sont en service.'],
 stabilite:['Les habitats organisent des assemblées autonomes.','Les délégués des habitats siègent au Conseil.','Le centre administratif coordonne les services de la colonie.']}
};
const settings={
 mafia:{sky:'#152538',ground:'#303a44',back:'#253746',wall:'#5c5351',trim:'#d3b57d',glass:'#dcb774',roof:'#303b46',sign:'#e5c98f',ink:'#241e1c',names:['HALLES','COMMISSARIAT','CLUB','DISPENSAIRE','STATION','CONSEIL']},
 medieval:{sky:'#a9c0b6',ground:'#a3a47b',back:'#718e7c',wall:'#b9ae8c',trim:'#6b5d45',glass:'#b7c8b1',roof:'#6d7156',sign:'#dfd0a4',ink:'#3b412f',names:['HALLE','GARDE','PLACE','HOSPICE','ATELIERS','CONSEIL']},
 corporate:{sky:'#d9e8ef',ground:'#c2d4c1',back:'#a5bec4',wall:'#edf2f4',trim:'#738c9d',glass:'#96bdce',roof:'#c4d5de',sign:'#edf4f7',ink:'#234459',names:['COMMERCE','CONFORMITÉ','ESPLANADE','SANTÉ','INNOVATION','CONSEIL']},
 futuriste:{sky:'#122239',ground:'#314c5c',back:'#27445c',wall:'#4b7285',trim:'#9ad9df',glass:'#b4e7e7',roof:'#2e546b',sign:'#233f54',ink:'#c3f0ee',names:['ÉCHANGES','SURVEILLANCE','AGORA','SOINS','RECHERCHE','CONSEIL']}
};
const figure=(x,y,c)=>`<g transform="translate(${x} ${y})"><ellipse cy="13" rx="10" ry="3" fill="#152c32" opacity=".18"/><circle cy="-17" r="5" fill="#c6ad8c"/><path d="M-5-9H5l2 13H-7Zm-4 13v10m8-10v10" stroke="${c}" stroke-width="3" fill="${c}"/></g>`;
const sign=(text,y,c)=>`<rect x="14" y="${y}" width="144" height="23" rx="2" fill="${c.sign}"/><text x="86" y="${y+16}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="${c.ink}">${text}</text>`;
function building(id,index,level){
 const c=settings[id],name=c.names[index],tall=index===1||index===5;
 const height=id==='mafia'?(tall?210:150):id==='corporate'?(tall?195:130):125;
 let body='';
 if(id==='mafia'){
  body=`<rect x="5" y="${-height}" width="163" height="${height}" fill="${c.wall}" stroke="#302b2b" stroke-width="3"/><path d="M0 ${-height}h173v-12H0Z" fill="${c.trim}"/>`;
  for(let y=-height+24;y<-44;y+=36)for(let x=21;x<150;x+=35)body+=`<rect x="${x}" y="${y}" width="16" height="22" fill="${c.glass}" opacity="${level===0&&index!==5?'.35':'.8'}"/><path d="M${x} ${y+10}h16" stroke="#535054" stroke-width="2"/>`;
  body+=`<path d="M10-8h150M10-49h150" stroke="${c.trim}" opacity=".35" stroke-width="2"/>`;
 }else if(id==='medieval'){
  body=`<rect x="8" y="-112" width="157" height="112" fill="${c.wall}" stroke="${c.trim}" stroke-width="3"/>`;
  if(index===1||index===5)body+=`<path d="M8-112v-39h20v14h20v-14h20v14h20v-14h20v14h20v-14h20v14h16v25Z" fill="${c.wall}" stroke="${c.trim}" stroke-width="3"/>`;
  else body+=`<path d="M-3-112 86-183 176-112Z" fill="${c.roof}" stroke="${c.trim}" stroke-width="4"/><path d="M22-108v106m129-106v106M20-65h133M24-108l125 105" stroke="${c.trim}" stroke-width="5"/>`;
  body+=`<path d="M28-90h22v30H28Zm95 0h22v30h-22Z" fill="${c.glass}" stroke="${c.trim}" stroke-width="4"/>`;
 }else if(id==='corporate'){
  body=`<rect x="4" y="${-height}" width="165" height="${height}" rx="3" fill="${c.wall}" stroke="${c.trim}" stroke-width="2"/><rect x="15" y="${-height+15}" width="142" height="${height-62}" fill="${c.glass}"/>`;
  for(let y=-height+16;y<-49;y+=30)body+=`<path d="M15 ${y}h142" stroke="${c.wall}" stroke-width="4"/>`;
  body+=`<path d="M51 ${-height+15}v${height-62}m37 ${-height+62}v-${height-62}m35 0v${height-62}" stroke="${c.wall}" stroke-width="4"/><path d="M-3 ${-height}h178" stroke="${c.trim}" stroke-width="5"/>`;
 }else{
  body=`<path d="M4 0v-77q0-86 82-86t82 86V0Z" fill="${c.wall}" stroke="${c.trim}" stroke-width="3"/><path d="M17-65q69-77 137 0v26H17Z" fill="${c.glass}" opacity=".65"/><path d="M8-15h157M86-160v30" stroke="${c.trim}" stroke-width="3"/>`;
  if(tall)body+=`<path d="M58-160v-60h56v60M86-220v-42m-20 18h40" stroke="${c.trim}" fill="${c.roof}" stroke-width="3"/>`;
 }
 const signY=id==='medieval'?-45:-38;
 body+=`<rect x="71" y="-40" width="30" height="40" rx="${id==='medieval'?14:2}" fill="${c.roof}"/>`+sign(name,signY,c);
 return body;
}
function feature(id,metric,level){
 const c=settings[id];
 if(metric==='economie')return level===0?`<path d="M20 0v-65h130V0M23-61l123 56m-123 0 123-56" stroke="${c.trim}" fill="${c.roof}" stroke-width="4"/>`:
 `<path d="M5 30v-60h144v60M0-28h154" stroke="${c.trim}" stroke-width="5" fill="none"/><path d="M-3-25l18-25h125l19 25Z" fill="${id==='mafia'?'#a56b57':id==='futuriste'?'#68bfc8':'#d7ba79'}"/><path d="M10 21h131" stroke="${c.trim}" stroke-width="9"/>${figure(75,30,c.trim)}`+(level===2?`${figure(170,45,c.trim)}<rect x="154" y="12" width="50" height="23" rx="3" fill="${c.roof}" stroke="${c.trim}" stroke-width="2"/><circle cx="163" cy="40" r="8" fill="${c.trim}"/><circle cx="198" cy="40" r="8" fill="${c.trim}"/>`:'');
 if(metric==='securite')return level===0?`<rect x="142" y="-40" width="17" height="22" fill="${c.roof}"/>`:
 `${figure(164,30,c.trim)}<path d="M0 5v-85h17" stroke="${c.trim}" stroke-width="4" fill="none"/><circle cx="17" cy="-80" r="7" fill="${c.glass}"/>`+(level===2?`${figure(20,40,c.trim)}<path d="M175 5v-85h-17" stroke="${c.trim}" stroke-width="4" fill="none"/><circle cx="159" cy="-80" r="7" fill="${c.glass}"/>`:'');
 if(metric==='satisfaction')return `${figure(34,45,c.trim)}${figure(80,55,c.trim)}`+(level===0?`<path d="M35 25v-55m43 66v-55" stroke="${c.trim}" stroke-width="3"/><path d="M17-32h40v22H17Zm45 12h39V2H62Z" fill="${c.sign}"/><text x="37" y="-17" text-anchor="middle" font-size="6" fill="${c.ink}">ÉCOUTEZ</text><text x="81" y="-5" text-anchor="middle" font-size="6" fill="${c.ink}">NOS VOIX</text>`:level===2?`${figure(126,42,c.trim)}${figure(159,61,c.trim)}<path d="M-12-50Q90 5 190-50" fill="none" stroke="${c.trim}" stroke-width="2"/><path d="M10-38l14 20 10-12m26 9 12 19 12-14m30-3 14 18 10-27m25-7 15 17 9-25" stroke="${c.glass}" stroke-width="8"/>`:'');
 if(metric==='bien_etre')return level===0?`<path d="M8-20h35v30H8Zm0 0 35 30M8 10l35-30" fill="none" stroke="${c.trim}" stroke-width="3"/>`:
 `${figure(165,28,c.trim)}<path d="M12-38h20m-10-10v20" stroke="${c.glass}" stroke-width="5"/><ellipse cx="26" cy="35" rx="26" ry="9" fill="${id==='futuriste'?'#6ab2a7':'#799b68'}"/>`+(level===2?`<rect x="-30" y="-75" width="48" height="76" rx="${id==='futuriste'?24:2}" fill="${c.wall}" stroke="${c.trim}" stroke-width="3"/><ellipse cx="95" cy="44" rx="36" ry="10" fill="${id==='futuriste'?'#6ab2a7':'#799b68'}"/><path d="M80 46v-14m15 17v-19m14 16V34" stroke="#cbd39b" stroke-width="3"/>`:'');
 if(metric==='developpement')return level===0?`<path d="M-7 0h185M0 0v-23m170 23v-23" stroke="${c.trim}" stroke-width="3"/><rect x="21" y="-70" width="130" height="26" fill="${c.sign}"/><text x="86" y="-52" text-anchor="middle" font-size="9" fill="${c.ink}">PROJET À VENIR</text>`:
 level===1?`<g stroke="${c.trim}" stroke-width="5" fill="none"><path d="M0 0v-147h170V0M0-95h170M0-44h170M0 0l170-147m-115 0V0m59 0v-147"/></g>`:
 id==='medieval'?`<path d="M173 0v-125m-38 0h76m-38-38v76m-27-65 54 54m0-54-54 54" stroke="${c.trim}" stroke-width="6"/>`:
 id==='futuriste'?`<path d="M174 0v-185m-25 14q25 30 50 0m-62-17q37 45 74 0" fill="none" stroke="${c.trim}" stroke-width="4"/>`:
 id==='corporate'?`<path d="M11-136h145l-10-21H21Z" fill="#496f85"/><path d="M43-155v18m37-18v18m37-18v18" stroke="#b4d5e3" stroke-width="2"/>`:
 `<path d="M-25 40h220m-220 12h220M10 30v35m50-35v35m50-35v35m50-35v35" stroke="${c.trim}" stroke-width="3"/>`;
 // Stability describes autonomy/coordination, not decay or prosperity.
 return level===0?`<ellipse cx="84" cy="38" rx="37" ry="12" fill="${c.trim}"/>${figure(30,51,c.trim)}${figure(137,52,c.trim)}${figure(84,79,c.trim)}<text x="84" y="17" text-anchor="middle" font-size="9" fill="${c.ink==='\u0023241e1c'?c.sign:c.trim}">ASSEMBLÉES LOCALES</text>`:
 level===1?`${figure(36,27,c.trim)}${figure(133,32,c.trim)}<rect x="126" y="-68" width="34" height="29" fill="${c.sign}" stroke="${c.trim}"/>`:
 `<path d="M179 0v-180" stroke="${c.trim}" stroke-width="3"/><path d="M181-180h47l-9 15 9 15h-47" fill="${c.glass}"/><rect x="115" y="-72" width="42" height="36" fill="${c.sign}" stroke="${c.trim}"/><path d="M121-63h30m-30 7h30m-30 7h24" stroke="${c.ink}" stroke-width="2"/>${figure(174,32,c.trim)}`;
}
export function universeSceneMarkup(id){
 if(!Object.hasOwn(settings,id))return '<svg viewBox="0 0 1440 650" role="img" aria-labelledby="townTitle townDesc"><title id="townTitle">Décor non disponible</title><desc id="townDesc"></desc><rect width="1440" height="650" fill="#26343e"/><text x="720" y="325" text-anchor="middle" fill="#e3e9ed" font-size="28">Décor spécifique à créer pour cet habillage</text></svg>';
 const c=settings[id];
 let backdrop='';
 if(id==='mafia'){
  backdrop='<circle cx="1200" cy="100" r="36" fill="#e9d8aa"/>';
  for(let i=0;i<14;i++){const x=i*112,h=125+(i*47)%150;backdrop+=`<path d="M${x} 330V${330-h}h68V330Z" fill="${c.back}"/><path d="M${x+12} ${345-h}v${h-40}m20 0v-${h-40}m20 0v${h-40}" stroke="#cbb77d" stroke-width="4" opacity=".18"/>`;}
 }else if(id==='medieval')backdrop=`<path d="M0 310 230 140 460 310 660 160 900 310 1150 130 1440 310V650H0" fill="#899f86"/><path d="M0 350Q280 230 580 350t860 0V650H0" fill="${c.back}"/><path d="M0 336h1440" stroke="#b6b393" stroke-width="28"/><path d="M0 316h1440" stroke="#9b9f7e" stroke-width="15" stroke-dasharray="22 13"/>`;
 else if(id==='corporate')backdrop=`<circle cx="1230" cy="100" r="42" fill="#fff2cf"/><path d="M0 320Q360 220 720 320t720 0V650H0" fill="${c.back}"/><path d="M0 520Q720 350 1440 520" stroke="#edf0e9" stroke-width="60" fill="none"/>`;
 else{backdrop=`<circle cx="1190" cy="100" r="67" fill="#7fa6af" opacity=".6"/><ellipse cx="1190" cy="100" rx="113" ry="20" fill="none" stroke="#a3c9cd" stroke-width="5" transform="rotate(-20 1190 100)"/>`;
  for(let i=0;i<48;i++)backdrop+=`<circle cx="${(i*173)%1440}" cy="${25+(i*47)%240}" r="${i%3?1:2}" fill="#d2e8eb" opacity=".6"/>`;
  backdrop+=`<path d="M0 350 220 233 410 335 650 220 850 350 1120 245 1440 340V650H0" fill="${c.back}"/>`;
 }
 let groups='';
 for(const [i,metric] of metrics.entries())for(let level=0;level<3;level++){
  const base=metric==='developpement'&&level<2?'':building(id,i,level);
  groups+=`<g data-city-metric="${metric}" data-city-level="${level}" class="city-layer" transform="translate(${38+i*230} 435)"><ellipse cx="85" cy="15" rx="96" ry="16" fill="#142a30" opacity=".12"/>${base}${feature(id,metric,level)}</g>`;
 }
 return `<svg viewBox="0 0 1440 650" role="img" aria-labelledby="townTitle townDesc"><title id="townTitle">${id==='mafia'?'La cité de la Prohibition':id==='medieval'?'La cité médiévale':id==='corporate'?'Le campus contemporain':'La colonie futuriste'}</title><desc id="townDesc"></desc><rect width="1440" height="650" fill="${c.sky}"/>${backdrop}<path d="M0 365Q720 315 1440 365V650H0Z" fill="${c.ground}"/><path d="M0 586Q720 440 1440 586" stroke="${id==='corporate'?'#edf0e9':c.trim}" stroke-width="${id==='corporate'?45:2}" opacity=".5" fill="none"/>${groups}</svg>`;
}
