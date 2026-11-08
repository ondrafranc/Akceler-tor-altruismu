/**
 * Pure data module for Molly's treat catalog and mode mappings.
 * Extracted to eliminate circular dependency between mollyStore.js and sensoryEngine.js (M13 / AUDIT #3).
 */

export const MOLLY_TREAT_BY_FOOD = {
  salmon: {
    icon: '🐟',
    name: 'lososová granulka pro Molly',
    shortLabel: '+1 rybka pro Molly',
    color: '#f59e0b',
    foodType: 'salmon'
  },
  milk: {
    icon: '🥛',
    name: 'teplé kočičí mlíčko v misce',
    shortLabel: '+1 mlíčko pro Molly',
    color: '#fde68a',
    foodType: 'milk'
  },
  tuna: {
    icon: '🍣',
    name: 'rýžový polštářek s tuňákem',
    shortLabel: '+1 sousto pro Molly',
    color: '#fbbf24',
    foodType: 'tuna'
  },
  catnip: {
    icon: '🌿',
    name: 'čerstvý lístek šanty kočičí',
    shortLabel: '+1 šanta pro Molly',
    color: '#4ade80',
    foodType: 'catnip'
  },
  cream: {
    icon: '🧶',
    name: 'smetanový pamlsek a klubíčko',
    shortLabel: '+1 pamlsek pro Molly',
    color: '#f472b6',
    foodType: 'cream'
  },
  star_treat: {
    icon: '✨',
    name: 'křupavá hvězdička pro Molly',
    shortLabel: '+1 hvězdička pro Molly',
    color: '#a78bfa',
    foodType: 'star_treat'
  }
};

export const MODE_TO_MOLLY_FOOD = {
  // Animals
  kibble: 'salmon',
  shelter_care: 'salmon',
  // Birds & wildlife
  birds_glass: 'milk',
  birds_song: 'milk',
  wildlife_rescue: 'milk',
  // Food & solidarity
  rice: 'tuna',
  food_bank: 'tuna',
  soup_lantern: 'tuna',
  zero_waste_pot: 'tuna',
  bakery_save: 'tuna',
  shoebox_gift: 'tuna',
  // Nature & ecology
  forest_bloom: 'catnip',
  fruit_tree: 'catnip',
  water_spring: 'catnip',
  eco_cleanup: 'catnip',
  compost_sprout: 'catnip',
  butterfly_lens: 'catnip',
  campfire_group: 'catnip',
  globe_bridge: 'catnip',
  // Care, seniors, health
  blood_drop: 'cream',
  dna_helix: 'cream',
  ecg_rescue: 'cream',
  hair_silk: 'cream',
  breath_lotus: 'cream',
  mind_wave: 'cream',
  prism_support: 'cream',
  senior_letter: 'cream',
  owl_shield: 'cream',
  angel_wings: 'cream',
  charity_care: 'cream',
  solidarity_bridge: 'cream',
  // Knowledge, science & civic
  satellite_map: 'star_treat',
  cosmos_science: 'star_treat',
  wiki_ink: 'star_treat',
  code_nodes: 'star_treat',
  dove_appeal: 'star_treat',
  book_booth: 'star_treat',
  parcel_share: 'star_treat',
  phone_recycle: 'star_treat',
  tutoring_spark: 'star_treat',
  school_pencil: 'star_treat',
  memory_wave: 'star_treat',
  wheels_motion: 'star_treat',
  safe_crosswalk: 'star_treat',
  kinetic_steps: 'star_treat'
};

export function resolveMollyTreat(specOrMode) {
  const mode =
    typeof specOrMode === 'string'
      ? specOrMode
      : specOrMode?.mode || 'kibble';
  const foodKey = MODE_TO_MOLLY_FOOD[mode] || 'salmon';
  return MOLLY_TREAT_BY_FOOD[foodKey] || MOLLY_TREAT_BY_FOOD.salmon;
}

