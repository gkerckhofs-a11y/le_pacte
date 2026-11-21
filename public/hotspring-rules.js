// Keep the compact print wording alongside the detailed terminal rules.
import {roleLabel} from './founders-role-badges.js';

export function createHotspringRules({print=false,manual=false,chicago=false}={}){
 const heading=print?'h4':'h3';
 const template=document.createElement('template');
 template.innerHTML=`
 <section class="${print?'print-reminder':'hotspring-rules'}">
  ${print?'':'<header><h2>LES COLONS DE HOTSPRING</h2></header>'}
  <div class="${print?'print-reminder-columns':'hotspring-rules-columns'}">
   <div>
    <section>
     <${heading}>Votre but</${heading}>
     ${print?'<p>La famille qui totalise le plus de points gagne. Le maximum est de <strong>18 points</strong>.</p>':
      '<p>Devenir <strong>la famille la plus influente de Hotspring</strong>.</p><p>À la fin de la partie, chaque famille additionne ses <strong>points de victoire</strong> :</p>'}
     <ul>
      <li><strong>Objectifs de chapitre</strong> : jusqu’à <strong>10 points</strong>${print?'':' ;'}</li>
      <li><strong>Objectif de trajectoire</strong> : jusqu’à <strong>2 points</strong>${print?'':' ;'}</li>
      <li><strong>Héritage final</strong> : jusqu’à <strong>3 points</strong>${print?'':' ;'}</li>
      <li><strong>Fortune restante</strong> : jusqu’à <strong>3 points</strong>${print?'':'.'}</li>
     </ul>
     ${print?'<p>Gardez vos objectifs secrets.</p>':
      '<p><strong>Maximum : 18 points</strong></p><p>La famille qui totalise le plus de points remporte la partie.</p><p>Vos objectifs sont secrets. Gardez-les confidentiels, mais utilisez-les pour orienter vos alliances, vos négociations et vos votes.</p>'}
     ${manual?(print?
      '<p>Votre famille gagne 2 points si sa jauge secrète figure parmi les deux plus élevées, ex æquo compris.</p>':
      '<p>Au bilan, votre famille gagne 2 points si sa jauge secrète figure parmi les deux jauges les plus élevées. Une égalité à la limite du classement compte pour toutes les jauges concernées.</p>')+
      '<p>La Stabilité est la moyenne des cinq jauges.</p>':''}
    </section>
    <section>
     <${heading}>Un dilemme en 5 étapes</${heading}>
     <ol>
      <li>Le MJ présente la situation.</li>
      <li>Les familles négocient librement.</li>
      <li>Chaque famille choisit <strong>POUR</strong>, <strong>CONTRE</strong> ou <strong>ABSTENTION</strong>.</li>
      <li>Les familles peuvent surenchérir avec de l’Influence.</li>
      <li>Le camp ayant engagé le plus d’Influence l’emporte.</li>
     </ol>
     ${chicago?'<p>Les conséquences sont révélées après le vote. La scène montre ce qui arrive à Chicago.</p>':print?'<p>Les conséquences sont révélées après le vote et transforment Hotspring.</p>':'<p>Les conséquences exactes sont révélées après le vote et transforment durablement Hotspring.</p>'}
     ${manual?(print?'<p>Le MJ ouvre le vote et lance le dilemme suivant.</p>':'<p>Le MJ gère le temps. Il ouvre le vote et lance le dilemme suivant quand le groupe est prêt.</p>'):''}
    </section>
    <section>
     <${heading}>L’Influence</${heading}>
     ${print?'':'<p>L’Influence représente votre poids politique.</p>'}
     <ul>
      <li>POUR ou CONTRE : engagez au moins <strong>1 Influence</strong>.</li>
      <li>${print?'Votre camp est fixé pour ce dilemme.':'Votre camp devient définitif pour ce dilemme.'}</li>
      <li>${print?'Ensuite, surenchérissez ou passez.':'Aux tours suivants : ajoutez de l’Influence ou passez.'}</li>
      <li>Un tour complet sans nouvelle mise termine le vote.</li>
      <li>L’Influence du camp perdant est rendue.</li>
      <li>${print?'Les mises gagnantes vont à la réserve.':'L’Influence du camp gagnant rejoint la réserve commune.'}</li>
     </ul>
    </section>
   </div>
   <div>
    <section>
     <${heading}>L’abstention</${heading}>
     ${print?'<p>Vous quittez le vote pour ce dilemme. Vous pouvez tenter de récupérer une part de la réserve ou de revendiquer le rôle de <strong>Shérif</strong>.</p>':`
      <p>En vous abstenant, vous quittez définitivement le vote.</p>
      <p>Vous êtes automatiquement passé lors des tours suivants.</p>
      <p>Selon l’option choisie, vous pouvez :</p>
      <ul>
       <li>tenter de récupérer de l’Influence ;</li>
       <li>ou revendiquer le rôle de <strong>Shérif</strong>.</li>
      </ul>`}
     ${manual?(print?'<p>Seules les familles qui choisissent la récupération se partagent la réserve. La projection indique la part estimée puis la part versée.</p>':
      '<p>Seules les familles qui choisissent la récupération se partagent la réserve commune. La projection indique la part estimée puis la part versée.</p>'):''}
    </section>
    <section>
     <${heading}>Les dollars</${heading}>
     ${print?'':'<p>Les dollars servent à négocier.</p>'}
     ${manual?
      (print?'<p>Proposez un don ou payez pour un vote POUR ou CONTRE. La famille qui accepte l’accord doit voter dans le camp convenu et miser au moins 1 Influence.</p><p>Un don n’engage pas le vote.</p>':
       '<p>Proposez un don, ou des dollars en échange d’un vote POUR ou CONTRE. En acceptant un accord de vote, la famille reçoit les dollars et s’engage à voter dans le camp convenu en misant au moins 1 Influence. Elle ne peut pas s’abstenir.</p><p>Un don est sans engagement politique. Le solde de l’émetteur est vérifié au moment de l’acceptation.</p>'):
      '<p>Vous pouvez proposer de l’argent à une autre famille, qui peut accepter ou refuser. Une promesse n’est jamais automatiquement contraignante.</p>'}
     ${print?`<p>Le classement des fortunes rapporte <strong>3 points à la première famille, 2 à la deuxième et 1 à la troisième</strong>. Les autres gagnent 0 point. Les ex æquo partagent le rang et les points.</p>
      <p>Si deux familles finissent deuxièmes, elles gagnent chacune 2 points et la suivante se classe quatrième.</p>`:`
      <p>Les dollars conservés rapportent également des points en fin de partie :</p>
      <ul>
       <li>famille la plus riche : <strong>3 points</strong> ;</li>
       <li>deuxième famille la plus riche : <strong>2 points</strong> ;</li>
       <li>troisième famille la plus riche : <strong>1 point</strong> ;</li>
       <li>autres familles : <strong>0 point</strong>.</li>
      </ul>
      <p>En cas d’égalité, les familles concernées occupent le même rang et reçoivent les mêmes points. Le rang suivant est alors sauté.</p>
      <p><strong>Exemple :</strong> deux familles terminent deuxièmes. Elles gagnent chacune 2 points, et la famille suivante est classée quatrième.</p>`}
    </section>
    <section>
     <${heading}>Le Maire</${heading}>
     <p>Le Maire joue en premier.</p>
     <p>La famille ayant engagé la plus forte mise individuelle peut prendre la fonction de Maire.</p>
    </section>
    <section>
     <${heading}>Le Shérif</${heading}>
     ${print?'<p>Le Shérif départage les camps à égalité et tranche les égalités pour désigner le nouveau Maire.</p>':`
      <p>Le Shérif tranche :</p>
      <ul>
       <li>une égalité entre POUR et CONTRE ;</li>
       <li>une égalité pour désigner le nouveau Maire.</li>
      </ul>`}
    </section>
   </div>
  </div>
  <section class="${print?'print-reminder-close':'hotspring-rules-close'}">
   <${heading}>Rappel express</${heading}>
   <div>
    <p><strong>Écoutez. Négociez. Votez. Surenchérissez.</strong> <strong>Accomplissez vos objectifs. Préservez votre fortune.</strong></p>
    <p><strong>Construisez Hotspring.</strong> <strong>Défendez votre famille.</strong></p>
   </div>
  </section>
 </section>
 `;
 const root=template.content.firstElementChild;
 if(chicago){
  const goal=root.querySelector('.print-reminder-columns section, .hotspring-rules-columns section');
  goal.innerHTML='<'+heading+'>Votre but</'+heading+'>'+
   '<p>Devenez le Parrain de Chicago. Gardez vos ambitions secrètes.</p>'+
   '<ul><li>2 points : engagez au moins 1 Influence dans deux votes gagnants qui améliorent votre jauge prioritaire.</li>'+
   '<li>Trajectoire : 3 points si votre jauge est parmi les deux plus élevées, ex æquo compris.</li>'+
   '<li>5 points : faites adopter au moins deux de vos trois décisions-clés. En finale anticipée, votre terminal indique combien de décisions comptent et combien doivent réussir.</li>'+
   '<li>Fortune : jusqu’à 3 points.</li>'+
   '<li>Scrutin secret : 2 points par voix reçue, jusqu’à 8 points. Chaque famille vote pour une autre famille.</li></ul>'+
   '<p>Maximum : 21 points.</p><p>Les cinq jauges décrivent l’état de la Cosa Nostra. Chicago est le théâtre des conséquences de ses décisions. La Stabilité de la Cosa Nostra est leur moyenne sur 100.</p>';
  const leader=roleLabel({chicago},'mayor'),arbitrator=roleLabel({chicago},'sheriff');
  const substitutions={'LES COLONS DE HOTSPRING':'COSA NOSTRA','Construisez Hotspring.':'Façonnez la Cosa Nostra.',
   Hotspring:'Chicago','Le Maire':leader,'Le Shérif':arbitrator,'nouveau Maire':'nouveau titulaire du rôle « '+leader+' »',
   'de Maire':'« '+leader+' »',Maire:leader,Shérif:arbitrator};
  const walker=document.createTreeWalker(root,4);
  while(walker.nextNode()){
   const node=walker.currentNode;
   node.textContent=node.textContent.replace(/LES COLONS DE HOTSPRING|Construisez Hotspring\.|Hotspring|Le Maire|Le Shérif|nouveau Maire|de Maire|Maire|Shérif/g,word=>substitutions[word]);
  }
 }
 return root;
}
