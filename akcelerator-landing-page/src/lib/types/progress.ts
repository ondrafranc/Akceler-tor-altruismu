/**
 * Canonical User Progress and Sanctuary Type Definitions.
 */

import type { MicroAction, SanctuaryElement } from './deed.js';

export type LightType = 'lantern' | 'star' | 'wave';

/** One light on the `/svet` scene: a seeded catalog deed or the visitor's own record. */
export interface SanctuaryLight {
  uid: string;
  actionId: string;
  action: MicroAction | null;
  title: string;
  note: string;
  concreteImpact: string;
  orgName: string;
  minutes: number;
  url: string;
  element: string;
  x: number;
  y: number;
  zone: 'sky' | 'water';
  lightType: LightType;
  isMine: boolean;
}

/** A one-tap offline deed offered by the `RitualBar`. */
export interface QuickDeed {
  icon?: string;
  label: string;
  title: string;
  element: string;
  lightType: LightType;
}

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
