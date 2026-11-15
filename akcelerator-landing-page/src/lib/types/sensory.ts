/**
 * Canonical Sensory Engine and Canvas Type Definitions.
 */

import type { MicroAction } from './deed.js';

export interface ActionEffectSpec {
  mode: string;
  asmr: string;
  icon: string;
  target: number;
  label: string;
  colors: string[];
  format: (value: number) => string;
  cue?: string;
}

export interface MountImpactCanvasOptions {
  action?: MicroAction | { id: string; title?: string; category?: string; mode?: string } | null;
  mode?: string;
  preview?: boolean;
  primed?: boolean;
  silent?: boolean;
  celebrate?: boolean;
  onWeightUpdate?: (val: number) => void;
  onCelebrated?: (actionId: string) => void;
  sparkBoost?: boolean;
}

export interface SceneRenderContext {
  c?: CanvasRenderingContext2D;
  ctx?: CanvasRenderingContext2D;
  mode?: string;
  rawP: number;
  t: number;
  cx: number;
  cy: number;
  by: number;
  w: number;
  h: number;
  cs: string[];
  red: boolean;
  frame: number;
  gx: number;
  py: number;
  p: number;
  prep: number;
  wt: number;
  spanX: number;
}
