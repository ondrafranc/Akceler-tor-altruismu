/**
 * Canonical Centralized LocalStorage / SessionStorage Keys & Prefixes.
 * All storage operations across the application must reference these constants.
 */

export const AA_COMPLETED_STEPS_KEY = 'aa_completed_steps_v2' as const;
export const AA_SANCTUARY_WISHES_KEY = 'aa_sanctuary_wishes_v1' as const;
export const AA_MOLLY_COMPANION_KEY = 'aa_molly_companion_v1' as const;
export const AA_MOLLY_FOLLOW_MOUSE_KEY = 'aa_molly_follow_mouse' as const;
export const AA_STARTED_ACTIONS_KEY = 'aa_started_actions_v1' as const;
export const AA_FUNNEL_COUNTS_KEY = 'aa_funnel_counts_v1' as const;
export const AA_USER_TOPICS_KEY = 'aa_values' as const;
export const AA_VALUES_KEY = 'aa_values' as const;
export const AA_GUIDED_VALUES_KEY = 'aa_guided_values_v2' as const;
export const AA_PREFS_NEAR_KEY = 'aa_prefs_near' as const;
export const AA_MY_PENDING_SUBMISSIONS_KEY = 'aa_my_pending_submissions_v1' as const;
export const AA_SUBMIT_DRAFT_KEY = 'aa_submit_draft_v1' as const;
export const AA_SOUND_MUTED_KEY = 'aa_sound_muted' as const;
export const AA_PARTNER_RETURN_KEY = 'aa_pending_return_v1' as const;
export const AA_DONE_FOR_TODAY_PREFIX = 'aa_done_for_today_' as const;
export const AA_MOLLY_HINT_PREFIX = 'aa_molly_hint_' as const;
export const AA_MOLLY_HINTS_KEY = 'aa_molly_hints_v1' as const;
export const AA_MOLLY_NUDGES_KEY = 'aa_molly_nudges_v1' as const;

export type StorageKey =
  | typeof AA_COMPLETED_STEPS_KEY
  | typeof AA_SANCTUARY_WISHES_KEY
  | typeof AA_MOLLY_COMPANION_KEY
  | typeof AA_MOLLY_FOLLOW_MOUSE_KEY
  | typeof AA_STARTED_ACTIONS_KEY
  | typeof AA_FUNNEL_COUNTS_KEY
  | typeof AA_USER_TOPICS_KEY
  | typeof AA_VALUES_KEY
  | typeof AA_GUIDED_VALUES_KEY
  | typeof AA_PREFS_NEAR_KEY
  | typeof AA_MY_PENDING_SUBMISSIONS_KEY
  | typeof AA_SUBMIT_DRAFT_KEY
  | typeof AA_SOUND_MUTED_KEY
  | typeof AA_PARTNER_RETURN_KEY
  | typeof AA_MOLLY_HINTS_KEY
  | typeof AA_MOLLY_NUDGES_KEY
  | `${typeof AA_DONE_FOR_TODAY_PREFIX}${string}`
  | `${typeof AA_MOLLY_HINT_PREFIX}${string}`;
