/**
 * Canonical Storage Keys and Schema Type Definitions.
 */

import type { CompletedStep, SanctuaryWish } from './progress.js';
import type { MollyState } from './molly.js';
import type { StorageKey } from '../storage/keys.js';

export type { StorageKey };

export interface SubmitDraftState {
  kind?: 'org' | 'event' | string;
  name?: string;
  category?: string;
  website?: string;
  email?: string;
  description?: string;
  locationQuery?: string;
  lat?: number | null;
  lon?: number | null;
  addressLabel?: string;
  eventUrl?: string;
}

export interface PendingSubmissionItem {
  id: string;
  kind: 'org' | 'event' | string;
  name: string;
  category?: string | null;
  description?: string | null;
  city?: string | null;
  address_label?: string | null;
  website?: string | null;
  event_url?: string | null;
  event_start?: string | null;
  event_end?: string | null;
  email?: string | null;
  phone?: string | null;
  lat: number;
  lon: number;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
  pendingModeration?: boolean;
}

export interface PartnerReturnState {
  id?: string;
  title?: string;
  category?: string;
  values?: string[];
  surface?: string;
  ts: number;
  consumed?: number | boolean;
  elapsedMs?: number;
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
  'aa_my_pending_submissions_v1': PendingSubmissionItem[];
  'aa_submit_draft_v1': SubmitDraftState;
  'aa_sound_muted': '1' | '0';
  'aa_pending_return_v1': PartnerReturnState;
  'aa_molly_hints_v1': string[];
  'aa_molly_nudges_v1': string[];
  'aa_home_deck_state_v1': HomeDeckState;
  [key: `aa_done_for_today_${string}`]: '0' | '1';
  [key: `aa_molly_hint_${string}`]: string;
}
