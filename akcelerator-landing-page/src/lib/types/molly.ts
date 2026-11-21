/**
 * Canonical Molly Companion Type Definitions.
 */

import type { MicroAction } from './deed.js';

export type MollyMode = 'roaming' | 'docked';
export type MollyMood = 'curious' | 'purring' | 'playful' | 'sleeping' | 'breathing';

/** A whisper bubble as the store emits it; the optional flags say where it came from. */
export interface MollyWhisper {
  text: string;
  icon: string;
  ts: number;
  guide?: boolean;
  routePath?: string | null;
  fromDock?: boolean;
  fromAutoPark?: boolean;
  fromPet?: boolean;
  fromToggle?: boolean;
  /** Thanks for a finished deed; it repeats what the in-card celebration already says. */
  fromThanks?: boolean;
}

/** What the store accepts as the deed behind a spark. */
export type MollyActionLike =
  | MicroAction
  | { id?: string; title?: string; category?: string; mode?: string; [key: string]: unknown };

/** The spark Molly catches after an effect preview or a tap on a scene. */
export interface MollySpark {
  icon: string;
  name: string;
  actionId: string;
  ts: number;
}

/** Payload of the `mollyEvents` store. */
export interface MollyEvent {
  type: 'thanks' | 'spark' | 'pet' | 'wake';
  action: MollyActionLike | string | null | undefined;
  ts: number;
  spark?: MollySpark;
  surface?: string;
  whisper?: string;
}

export interface MollyState {
  mode: MollyMode;
  mood: MollyMood;
  followMouse: boolean;
  petCount: number;
  whisper: MollyWhisper | null;
}
