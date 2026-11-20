import {activeFounders, createFoundersGame} from '../src/founders.ts';
import {CHICAGO_SCENARIO_ID} from '../src/founders-chicago.ts';
import mafiaSkins from '../content/founders-skins-v1.json' with {type:'json'};

const mafia = mafiaSkins.skins.find(skin => skin.id === 'mafia');
const alias = id => 'CN_' + id.replace('.', '_');

export function chicagoSessionPreview(preparation, members) {
 const {campaign, crisisIds, checksum} = preparation;
 const {metadata} = campaign;
 const ordered = [...campaign.dilemmas].sort((a,b) => a.chapter - b.chapter || a.number - b.number);
 const selected = ordered.filter(scene => scene.type === 'Pivot' || crisisIds.includes(scene.id));
 const byId = new Map(ordered.map(scene => [scene.id, scene]));
 const game = createFoundersGame({members});
 if (activeFounders(game).length !== 5) throw new Error('Cinq familles sont requises pour Chicago.');
 game.auctionMode = 'continuous';
 game.cityMaximum = 100;
 game.city = Object.fromEntries(Object.keys(metadata.gauges).map(code => [code, 50]));
 const names = metadata.family_objectives.map(objective => objective.family);
 const ambitions = Object.fromEntries(activeFounders(game).map((family, index) => {
  const ambition = metadata.family_objectives[index];
  return [family, {
   ...ambition, indicator: metadata.gauge_mapping[ambition.family],
   pivots: ambition.major_slots.map(([id, choice]) => {
    const scene = byId.get(id);
    return {id, title: scene.title, proposal: scene.options.find(option => option.choice === choice).title};
   })
  }];
 }));
 const dilemmas = selected.map((scene, index) => {
  const media = (suffix, alt) => ({url:'/assets/chicago/v3/' + scene.id.replace('.', '') + '-' + suffix + '.webp', alt});
  const options = Object.fromEntries(['pour', 'contre'].map(side => [side, scene.options.find(option => option.choice === side.toUpperCase())]));
  const next = selected[index + 1];
  const outcomes = Object.fromEntries(Object.entries(options).map(([side, option]) => [side, {
   narration: option.after,
   effects: Object.entries(option.effects).map(([indicator, value]) => ({indicator, operation:'delta', value})),
   next_id: next ? alias(next.id) : null,
   chronicle:{title:option.title, image:media(side, option.city_visual_result)}
  }]));
  return {
   id: alias(scene.id), sourceId: scene.id, chapter: scene.chapter, title: scene.title,
   public_text: scene.intro + '\n\n' + scene.tension,
   vote_question: 'Quelle proposition la Commission adopte-t-elle ?',
   publicOptions: Object.fromEntries(Object.entries(options).map(([side,o]) => [side,{description:o.public_description,
    trends:o.public_trends.map(t=>({name:t.name,direction:t.direction})),compromise:o.public_compromise}])),
   labels:{pour:options.pour.title, contre:options.contre.title}, image:media('intro', scene.visual_direction.opening_scene), outcomes
  };
 });
 const selection = {scenarioId:CHICAGO_SCENARIO_ID,scenarioVersion:'3.0.0',skinId:'mafia',skinVersion:mafia.version};
 return {
  names, preview:{
   kind:'founders-session-preview-v2.3', previewOnly:true, selection, game,
   source:{type:'private_campaign',checksum},
   skin:{...mafia,title:'Cosa Nostra — Le Trône de Chicago',
    labels:{currency:'Dollars',influence:'Influence',resources:metadata.gauges}},
   scenario:{schema_version:'2.0.0',scenario:{id:CHICAGO_SCENARIO_ID,title:metadata.universe,
    location:'Chicago',year:1931,entry_dilemma:dilemmas[0].id},dilemmas,chicago:{version:3,ambitions,epilogues:metadata.winner_epilogues}}
  }
 };
}
