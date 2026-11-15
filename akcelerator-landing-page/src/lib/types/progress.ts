/**
 * Canonical User Progress and Sanctuary Type Definitions.
 */

import type { MicroAction, SanctuaryElement } from './deed.js';
import type { MollyTreat } from './molly.js';

export type LightType = 'lantern' | 'star' | 'wave';

export interface CompletedStep {
  id: string;
  uid?: string;
  title: string;
  completedAt: string;
  element?: SanctuaryElement;
  values?: string[];
  category?: string;
  planted?: boolean;
  pos?: { x: number; y: number };
  reflection?: string;
  lightType?: LightType;
}

export interface SanctuaryWish {
  id: string;
  text: string;
  createdAt: string;
  lightType: LightType;
  element: SanctuaryElement;
  x: number;
  y: number;
}

export interface ActiveCelebration {
  action: MicroAction;
  source: string;
  treat?: MollyTreat;
}
