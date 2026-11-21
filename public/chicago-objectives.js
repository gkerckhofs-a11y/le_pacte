const statuses = {upcoming:'À venir',won:'Réussie ✓',missed:'Manquée',unplayed:'Non jouée'};

function add(root, tag, text, className) {
 const node=document.createElement(tag);
 node.textContent=text;
 if(className)node.className=className;
 root.append(node);
 return node;
}

function progressText(progress) {
 if(!progress.required)return 'Aucun point attribué à cet objectif.';
 const count=Math.min(progress.successes,progress.required);
 return count+' / '+progress.required+(progress.achieved?' — Objectif réussi':progress.required===1?' décision nécessaire':' décisions nécessaires');
}

function renderDecisions(root,objective) {
 const {progress}=objective;
 const list=document.createElement('ol');
 list.className='key-decisions';
 for(const decision of objective.pivots){
  const card=document.createElement('li');
  add(card,'strong',decision.title);
  add(card,'span',statuses[decision.status],'decision-status');
  add(card,'p','Votre position : '+decision.choice+' — '+decision.proposal);
  if(decision.excluded)add(card,'small','Jouée après les décisions retenues pour les 5 points.');
  list.append(card);
 }
 root.append(list);
 add(root,'h4','Progression');
 add(root,'strong',progressText(progress));
 if(progress.shortened){
  const n=progress.available;
  add(root,'p',n===0?'Finale anticipée : au moins une famille n’a pu jouer aucune décision-clé. Les 5 points sont retirés du décompte pour toutes les familles.':
   n===1?'Finale anticipée : seule la première décision-clé jouée de chaque famille compte. Il faut la réussir pour gagner les 5 points.':
   'Finale anticipée : seules les deux premières décisions-clés jouées de chaque famille comptent. Il faut les réussir toutes les deux pour gagner les 5 points.');
 }
}

export function renderChicagoAmbition(root,objective) {
 root.replaceChildren();
 root.hidden=!objective;
 if(!objective)return;
 if(!objective.progress){
  // Earlier Chicago editions keep their original scoring rules.
  for(const goal of objective.goals)add(root,'p',goal.points+' points · '+goal.condition);
  for(const decision of objective.pivots)add(root,'p',decision.title+' — '+decision.proposal);
  return;
 }
 add(root,'h3',objective.specialty);
 add(root,'p',objective.narrative);
 add(root,'h3','Votre priorité');
 add(root,'strong',objective.priority);
 for(const [index,title] of ['2 points — Faire avancer votre cause','3 points — Imposer votre vision','Vos 3 décisions-clés — 5 points'].entries()){
  add(root,'h3',title);
  if(index<2||!objective.progress.shortened)add(root,'p',objective.goals[index].condition);
 }
 renderDecisions(root,objective);
}

export function renderKeyDecisionBanner(root,decision) {
 root.hidden=!decision;
 root.replaceChildren();
 if(!decision)return;
 add(root,'strong','★ Décision-clé de votre famille');
 add(root,'p','Cette décision peut compter pour votre objectif à 5 points. Vous restez libre de votre vote, sauf accord de vote accepté.');
}

export function renderChicagoObjectivesAudit(root,s) {
 root.hidden=!s.chicagoFamilyObjectives;
 if(root.hidden)return;
 const list=root.querySelector('.objectives-audit-list');
 list.replaceChildren();
 for(const family of s.families){
  const objective=s.chicagoFamilyObjectives[family.id],points=objective.points;
  const section=document.createElement('section');
  add(section,'h3',family.name+' · '+objective.specialty);
  add(section,'p',objective.narrative);
  add(section,'strong','Jauge prioritaire · '+objective.priority);
  renderDecisions(section,objective);
  const scope=s.successionAudit?'Points des objectifs à la clôture':'Points des objectifs si les Conseils s’arrêtent ici';
  add(section,'p',scope+' : '+points.total+' / 10 (cause '+points.cause+', vision '+points.vision+', décisions-clés '+points.decisions+').');
  if(!s.successionAudit){
   const n=objective.requiredIfEnded;
   add(section,'small',n?'En cas de clôture immédiate, '+n+' décision'+(n>1?'s réussies sont nécessaires.':' réussie est nécessaire.'):'En cas de clôture immédiate, les 5 points ne sont attribués à personne.');
  }
  list.append(section);
 }
}
