/**
 * Canonical Storage Keys and Schema Type Definitions.
 */

import type { CompletedStep, SanctuaryWish } from './progress.js';
import type { MollyState } from './molly.js';
import type { SubmissionRequestBody } from './api.js';
import type { StorageKey } from '../storage/keys.js';

export type { StorageKey };

export interface PartnerReturnState {
  actionId?: string;
  title?: string;
  ts: number;
  consumed?: boolean | number;
  [key: string]: unknown;
}

export type HomeEnergyMode = 'couch' | 'focus' | 'walk' | 'people';

export interface HomeDeckState {
  energyMode: HomeEnergyMode;
  actionId: string;
  index?: number;
  excludeQuickId?: string;
  usePersonalValues?: boolean;
}

export interface StorageSchemaMap {
  'aa_completed_steps_v2': CompletedStep[];
  'aa_sanctuary_wishes_v1': SanctuaryWish[];
  'aa_molly_companion_v1': MollyState;
  'aa_molly_follow_mouse': boolean;
  'aa_started_actions_v1': string[];
  'aa_funnel_counts_v1': Record<string, number>;
  'aa_values': string[];
  'aa_guided_values_v2': string[];
  'aa_prefs_near': Record<string, unknown>;
  'aa_my_pending_submissions_v1': SubmissionRequestBody[];
  'aa_submit_draft_v1': Partial<SubmissionRequestBody>;
  'aa_sound_muted': '1' | '0';
  'aa_pending_return_v1': PartnerReturnState;
  'aa_molly_hints_v1': string[];
  'aa_molly_nudges_v1': string[];
  'aa_home_deck_state_v1': HomeDeckState;
  [key: `aa_done_for_today_${string}`]: '0' | '1';
  [key: `aa_molly_hint_${string}`]: string;
}
