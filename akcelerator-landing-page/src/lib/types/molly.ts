/**
 * Canonical Molly Companion Type Definitions.
 */

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

export interface MollyWhisper {
  text: string;
  icon: string;
  ts: number;
}

export interface MollyMilestone {
  requiredDeeds: number;
  item: string;
  icon: string;
  title: string;
  description: string;
  dialogue: string;
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
