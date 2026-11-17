import {createNarrativeSession} from '../src/founders-live.ts';
import {activeFounders} from '../src/founders.ts';
export function checkedConfiguration(preview, input, ownerId, now) {
  if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 100) throw new Error("Nom de configuration requis (100 caract\xE8res maximum)");
  const d = input.config;
  const s = createNarrativeSession(preview, { ...d, id: "000000000000000000000000", ownerId, code: "MODELE", title: "Configuration", now });
  return { name: input.name.trim(), config: {
    scenarioId: s.selection.scenarioId,
    scenarioVersion: s.selection.scenarioVersion,
    skinId: s.selection.skinId,
    skinVersion: s.selection.skinVersion,
    members: preview.settings.members,
    calibration: preview.settings.calibration,
    names: activeFounders(s.game).map((id) => s.names[id]),
    colors: activeFounders(s.game).map((id) => s.colors[id]),
    objectives: activeFounders(s.game).map((id) => s.goals[id]),
    goalCards: s.goalCards,
    scoreRules: s.scoreRules
  } };
}

