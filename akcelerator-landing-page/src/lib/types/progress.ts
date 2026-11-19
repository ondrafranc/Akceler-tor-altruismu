/**
 * Canonical User Progress and Sanctuary Type Definitions.
 */

import type { SanctuaryElement } from './deed.js';

export type LightType = 'lantern' | 'star' | 'wave';

export interface PlantedPosition {
  x: number;
  y: number;
  zone: 'sky' | 'water';
  lightType: LightType;
}

export interface CompletedStep {
  uid: string;
  id: string;
  title: string;
  surface?: string;
  category?: string;
  element: SanctuaryElement | string;
  concreteImpact?: string;
  lightType?: LightType;
  verifiedInitiation?: boolean;
  awaitingPlant?: boolean;
  plantedPos?: PlantedPosition | null;
  note?: string;
  timestamp: string;
  values?: string[];
}

export interface SanctuaryWish {
  uid: string;
  kind: 'deed' | 'gratitude' | 'release' | 'wave' | 'lantern' | 'star' | string;
  lightType: LightType;
  title: string;
  concreteImpact?: string;
  element: SanctuaryElement | string;
  x: number;
  y: number;
  zone: 'sky' | 'water';
  timestamp: string;
}

export interface ActiveCelebration {
  open: boolean;
  id?: string;
  category?: string;
  title: string;
  message: string;
  surface: string;
  element: SanctuaryElement | string;
  concreteImpact?: string;
  [key: string]: unknown;
}
