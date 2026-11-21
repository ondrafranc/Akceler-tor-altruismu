/**
 * Canonical Molly Companion Type Definitions.
 */

import type { MicroAction } from './deed.js';

export type MollyMode = 'roaming' | 'docked';
export type MollyMood = 'curious' | 'purring' | 'eating' | 'playful' | 'sleeping' | 'breathing';
export type MollyFoodType = 'salmon' | 'milk' | 'tuna' | 'catnip' | 'cream' | 'star_treat';

export interface MollyTreat {
  icon: string;
  name: string;
  nameAcc?: string;
  shortLabel: string;
  color: string;
  foodType: MollyFoodType;
  actionId?: string;
  ts?: number;
}

/** A whisper bubble as the store emits it; the optional flags say where it came from. */
export interface MollyWhisper {
  text: string;
  icon: string;
  ts: number;
  /** Key of the gift (`MollyMilestone.key`) this whisper announces. */
  milestone?: string;
  guide?: boolean;
  routePath?: string | null;
  fromDock?: boolean;
  fromAutoPark?: boolean;
  fromPet?: boolean;
  fromToggle?: boolean;
  fromUnlock?: boolean;
  fromCelebration?: boolean;
}

/** One entry of `MOLLY_MILESTONES`: a gift unlocked once `at` real deeds are reached. */
export interface MollyMilestone {
  at: number;
  key: string;
  icon: string;
  name: string;
}

/** What the store accepts as the deed behind a treat, a feeding or a spark. */
export type MollyActionLike =
  | MicroAction
  | { id?: string; title?: string; category?: string; mode?: string; [key: string]: unknown };

/** Payload of the `mollyEvents` store. */
export interface MollyEvent {
  type: 'unlock_treat' | 'feed' | 'spark' | 'pet' | 'wake';
  treat: MollyTreat | null;
  action: MollyActionLike | string | null | undefined;
  ts: number;
  source?: string;
  surface?: string;
  whisper?: string;
}

export interface MollyState {
  mode: MollyMode;
  mood: MollyMood;
  followMouse: boolean;
  treatsFedTotal: number;
  treatsFedToday: number;
  availableTreats: number;
  earnedTreatQueue: MollyTreat[];
  lastFedIso: string | null;
  lastTreat: MollyTreat | null;
  petCount: number;
  giftDeeds: number;
  whisper: MollyWhisper | null;
}
