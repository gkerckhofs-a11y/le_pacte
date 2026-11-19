// The terminal and printed QR sheet use the same rule text.
export function createHotspringRules({print=false,manual=false}={}){
 const title=print?'h3':'h2',heading=print?'h4':'h3';
 const template=document.createElement('template');
 template.innerHTML=`
 <section class="${print?'print-reminder':'hotspring-rules'}">
  <header>
   <${title}>LES COLONS DE HOTSPRING</${title}>
  </header>
  <div class="${print?'print-reminder-columns':'hotspring-rules-columns'}">
   <div>
    <section>
     <${heading}>Votre but</${heading}>
     <p>Devenir <strong>la famille la plus influente de Hotspring</strong>.</p>
     <p>À la fin de la partie, chaque famille additionne ses <strong>points de victoire</strong> :</p>
     <ul>
      <li><strong>Objectifs de chapitre</strong> : jusqu’à <strong>10 points</strong> ;</li>
      <li><strong>Objectif de trajectoire</strong> : jusqu’à <strong>2 points</strong> ;</li>
      <li><strong>Héritage final</strong> : jusqu’à <strong>3 points</strong> ;</li>
      <li><strong>Fortune restante</strong> : jusqu’à <strong>3 points</strong>.</li>
     </ul>
     <p><strong>Maximum : 18 points</strong></p>
     <p>La famille qui totalise le plus de points remporte la partie.</p>
     <p>Vos objectifs sont secrets. Gardez-les confidentiels, mais utilisez-les pour orienter vos alliances, vos négociations et vos votes.</p>
     ${manual?'<p>Au bilan, votre famille gagne 2 points si sa jauge secrète figure parmi les deux jauges les plus élevées. Une égalité à la limite du classement compte pour toutes les jauges concernées.</p><p>La Stabilité est la moyenne des cinq jauges.</p>':''}
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
     <p>Les conséquences exactes sont révélées après le vote et transforment durablement Hotspring.</p>
     ${manual?'<p>Le MJ gère le temps. Il ouvre le vote et lance le dilemme suivant quand le groupe est prêt.</p>':''}
    </section>
    <section>
     <${heading}>L’Influence</${heading}>
     <p>L’Influence représente votre poids politique.</p>
     <ul>
      <li>POUR ou CONTRE : engagez au moins <strong>1 Influence</strong>.</li>
      <li>Votre camp devient définitif pour ce dilemme.</li>
      <li>Aux tours suivants : ajoutez de l’Influence ou passez.</li>
      <li>Un tour complet sans nouvelle mise termine le vote.</li>
      <li>L’Influence du camp perdant est rendue.</li>
      <li>L’Influence du camp gagnant rejoint la réserve commune.</li>
     </ul>
    </section>
   </div>
   <div>
    <section>
     <${heading}>L’abstention</${heading}>
     <p>En vous abstenant, vous quittez définitivement le vote.</p>
     <p>Vous êtes automatiquement passé lors des tours suivants.</p>
     <p>Selon l’option choisie, vous pouvez :</p>
     <ul>
      <li>tenter de récupérer de l’Influence ;</li>
      <li>ou revendiquer le rôle de <strong>Shérif</strong>.</li>
     </ul>
     ${manual?'<p>Seules les familles qui choisissent la récupération se partagent la réserve commune. La projection indique la part estimée puis la part versée.</p>':''}
    </section>
    <section>
     <${heading}>Les dollars</${heading}>
     <p>Les dollars servent à négocier.</p>
     ${manual?
      '<p>Proposez un don, ou des dollars en échange d’un vote POUR ou CONTRE. En acceptant un accord de vote, la famille reçoit les dollars et s’engage à voter dans le camp convenu en misant au moins 1 Influence. Elle ne peut pas s’abstenir.</p><p>Un don est sans engagement politique. Le solde de l’émetteur est vérifié au moment de l’acceptation.</p>':
      '<p>Vous pouvez proposer de l’argent à une autre famille, qui peut accepter ou refuser. Une promesse n’est jamais automatiquement contraignante.</p>'}
     <p>Les dollars conservés rapportent également des points en fin de partie :</p>
     <ul>
      <li>famille la plus riche : <strong>3 points</strong> ;</li>
      <li>deuxième famille la plus riche : <strong>2 points</strong> ;</li>
      <li>troisième famille la plus riche : <strong>1 point</strong> ;</li>
      <li>autres familles : <strong>0 point</strong>.</li>
     </ul>
     <p>En cas d’égalité, les familles concernées occupent le même rang et reçoivent les mêmes points. Le rang suivant est alors sauté.</p>
     <p><strong>Exemple :</strong> deux familles terminent deuxièmes. Elles gagnent chacune 2 points, et la famille suivante est classée quatrième.</p>
    </section>
    <section>
     <${heading}>Le Maire</${heading}>
     <p>Le Maire joue en premier.</p>
     <p>La famille ayant engagé la plus forte mise individuelle peut prendre la fonction de Maire.</p>
    </section>
    <section>
     <${heading}>Le Shérif</${heading}>
     <p>Le Shérif tranche :</p>
     <ul>
      <li>une égalité entre POUR et CONTRE ;</li>
      <li>une égalité pour désigner le nouveau Maire.</li>
     </ul>
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
 return template.content.firstElementChild;
}
