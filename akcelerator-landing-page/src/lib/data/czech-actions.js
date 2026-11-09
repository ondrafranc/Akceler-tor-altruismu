/**
 * Backward-compatible barrel re-exporter for Akcelerátor altruismu data and services.
 * All atomic datasets and domain services are decomposed into dedicated modules,
 * while this barrel preserves 100% backward compatibility for all existing imports.
 */

export { VALUES } from './values.js';
export { PORTALS } from './portals.js';
export { CZECH_CITIES } from './cities.js';
export { HOPE_FACTS } from './hope-facts.js';
export { EVIDENCE_TIERS, EVIDENCE_METHODOLOGY } from './evidence.js';
export { MICRO_ACTIONS, CATALOG_LINKS_CHECKED_AT } from './micro-actions.js';
export { REAL_STORIES } from './stories.js';
export { ENCOURAGEMENT_MESSAGES, getRandomEncouragement } from './encouragements.js';
export { CURATED_FALLBACK_PLACES } from './fallback-places.js';
export { LOCAL_COMMUNITY_ITEMS } from './community-items.js';
export {
  recommendActions,
  calculateMatchScore
} from '../features/actions/services/recommendationEngine.js';
export { buildFirstContactTemplate } from '../features/map/services/contactTemplates.js';
