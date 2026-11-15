/**
 * Poetic Deed Scene Dispatcher.
 * Maps 45 micro-action modes to procedural domain renderers with 1:1 visual fidelity.
 */

import { clamp01, subP } from '../graphics/math.js';

import {
  renderForestBloom,
  renderFruitTree,
  renderButterflyLens,
  renderWaterSpring,
  renderCompostSprout,
  renderEcoCleanup
} from './natureScenes.js';

import {
  renderKibble,
  renderShelterCare,
  renderWildlifeRescue,
  renderBirdsGlass,
  renderBirdsSong
} from './animalsScenes.js';

import {
  renderBloodDrop,
  renderDnaHelix,
  renderHairSilk,
  renderEcgRescue,
  renderMindWave,
  renderBreathLotus
} from './healthScenes.js';

import {
  renderWikiInk,
  renderCodeNodes,
  renderCosmosScience,
  renderTutoringSpark,
  renderSchoolPencil
} from './knowledgeScenes.js';

import {
  renderRice,
  renderFoodBank,
  renderSoupLantern,
  renderZeroWastePot,
  renderBakerySave
} from './foodScenes.js';

import {
  renderPrismSupport,
  renderSatelliteMap,
  renderDoveAppeal,
  renderSeniorLetter,
  renderOwlShield,
  renderMemoryWave,
  renderBookBooth,
  renderParcelShare,
  renderPhoneRecycle,
  renderCampfireGroup,
  renderGlobeBridge,
  renderWheelsMotion,
  renderSafeCrosswalk,
  renderKineticSteps,
  renderShoeboxGift,
  renderAngelWings,
  renderCharityCare,
  renderSolidarityBridge
} from './communityScenes.js';

const SCENE_RENDERERS = {
  forest_bloom: renderForestBloom,
  fruit_tree: renderFruitTree,
  butterfly_lens: renderButterflyLens,
  water_spring: renderWaterSpring,
  compost_sprout: renderCompostSprout,
  eco_cleanup: renderEcoCleanup,

  kibble: renderKibble,
  shelter_care: renderShelterCare,
  wildlife_rescue: renderWildlifeRescue,
  birds_glass: renderBirdsGlass,
  birds_song: renderBirdsSong,

  blood_drop: renderBloodDrop,
  dna_helix: renderDnaHelix,
  hair_silk: renderHairSilk,
  ecg_rescue: renderEcgRescue,
  mind_wave: renderMindWave,
  breath_lotus: renderBreathLotus,

  wiki_ink: renderWikiInk,
  code_nodes: renderCodeNodes,
  cosmos_science: renderCosmosScience,
  tutoring_spark: renderTutoringSpark,
  school_pencil: renderSchoolPencil,

  rice: renderRice,
  food_bank: renderFoodBank,
  soup_lantern: renderSoupLantern,
  zero_waste_pot: renderZeroWastePot,
  bakery_save: renderBakerySave,

  prism_support: renderPrismSupport,
  satellite_map: renderSatelliteMap,
  dove_appeal: renderDoveAppeal,
  senior_letter: renderSeniorLetter,
  owl_shield: renderOwlShield,
  memory_wave: renderMemoryWave,
  book_booth: renderBookBooth,
  parcel_share: renderParcelShare,
  phone_recycle: renderPhoneRecycle,
  campfire_group: renderCampfireGroup,
  globe_bridge: renderGlobeBridge,
  wheels_motion: renderWheelsMotion,
  safe_crosswalk: renderSafeCrosswalk,
  kinetic_steps: renderKineticSteps,
  shoebox_gift: renderShoeboxGift,
  angel_wings: renderAngelWings,
  charity_care: renderCharityCare,
  solidarity_bridge: renderSolidarityBridge
};

export function drawPoeticDeedScene(c, mode, rawP, t, cx, cy, by, w, h, cs, red, frame, gx, py) {
  c.save();
  const safeRawP = Number.isFinite(rawP) ? rawP : 0;
  const wt = red ? 0 : t;
  const spanX = Math.min(126, w * 0.43);
  const prep = clamp01(safeRawP / 0.25);
  const p = safeRawP <= 0.15 ? 0 : subP(safeRawP, 0.16, 1.0);
  const ctx = { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX, rawP: safeRawP, t };

  const renderer = SCENE_RENDERERS[mode] || renderSolidarityBridge;
  renderer(c, ctx);

  c.restore();
}
