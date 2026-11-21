/**
 * Canonical Sensory Engine and Canvas Type Definitions.
 */

/** One entry of the action effect catalog: scene mode, sound profile and reward metric. */
export interface ActionEffectSpec {
  mode: string;
  asmr: string;
  icon: string;
  target: number;
  label: string;
  colors: string[];
  format: (value: number) => string;
  /** The metric is a fixed fact (for example a percentage), not a value that grows with progress. */
  staticMetric?: boolean;
}

/** Effect specs keyed by micro-action id (`ACTION_EFFECT_CATALOG`) or by scene mode (`MODE_LOOKUP`). */
export type ActionEffectCatalog = Record<string, ActionEffectSpec>;

/**
 * The fields the effect resolver reads from a deed, a map place, a celebration or a canvas element.
 * Every field is optional; whatever is missing falls through to the next matching rule.
 */
export type EffectActionLike = {
  id?: string | number | null;
  title?: string | null;
  name?: string | null;
  category?: string | null;
  kind?: string | null;
  subcategory?: string | null;
  mode?: string | null;
  element?: string | null;
  values?: readonly string[] | null;
};

/**
 * Anything `resolveActionEffectSpec` accepts: an action-like object, a micro-action id or scene mode
 * given as a plain string, or nothing. A string that matches no id or mode is read through the same
 * optional fields as an object (all of them undefined), hence the intersection.
 */
export type EffectActionInput = EffectActionLike | (string & EffectActionLike) | null | undefined;

/** Result of `getActionEffectMeta`: the resolved spec plus the values a card renders. */
export interface ResolvedActionEffectMeta extends ActionEffectSpec {
  scene: string;
  value: number;
  badge: string;
  returnBadge: string;
}

/** Reports the reward metric: raw value, formatted badge text and the spec it belongs to. */
export type ImpactMetricCallback = (value: number, formatted: string, spec: ActionEffectSpec) => void;

/**
 * Replays the payoff from a point given in scene units. Anything that is not a finite number
 * (including the boolean flag forwarded by `triggerCanvasBurst`) means the centre of the canvas.
 */
export type CanvasBurstTrigger = (rx?: number | boolean, ry?: number) => void;

/** A canvas with a mounted payoff scene exposes its burst trigger directly on the element. */
export interface ImpactCanvasElement extends HTMLCanvasElement {
  __triggerBurst?: CanvasBurstTrigger;
}

/** Registry record of one mounted payoff canvas (`activeControllers`). */
export interface ImpactCanvasController {
  cv: ImpactCanvasElement;
  spec: ActionEffectSpec;
  triggerBurst: CanvasBurstTrigger;
  getActive: () => boolean;
}

/** Target of `triggerCanvasBurst`: a payoff canvas element or an action whose scene should replay. */
export type CanvasBurstTarget = EffectActionLike & { __triggerBurst?: CanvasBurstTrigger };

export interface MountImpactCanvasOptions {
  action?: EffectActionInput;
  mode?: string;
  preview?: boolean;
  primed?: boolean;
  teased?: boolean;
  climax?: boolean;
  /** Not read by the engine; sound is decided by the `impactCanvas` action. */
  silent?: boolean;
  onWeightUpdate?: ImpactMetricCallback;
}

/** Cleanup function returned by `mountImpactCanvas`, with in-place preview state setters. */
export interface ImpactCanvasHandle {
  (): void;
  setPrimed: (val: boolean) => void;
  setTeased: (val: boolean) => void;
}

/**
 * Parameter of the `impactCanvas` Svelte action. Without `action` the parameter object itself is
 * resolved as the action, which is why it also carries the action-like fields.
 */
export type ImpactCanvasParams = EffectActionLike & {
  action?: EffectActionInput;
  preview?: boolean;
  primed?: boolean;
  teased?: boolean;
  climax?: boolean;
  silent?: boolean;
  onMetric?: ImpactMetricCallback | null;
  onProgress?: ImpactMetricCallback | null;
  onWeightUpdate?: ImpactMetricCallback | null;
};

/**
 * The second argument of every scene renderer, built once per frame by `drawPoeticDeedScene`.
 * All members are always present. Coordinates are in scene units (the scene is `h` units tall).
 */
export interface SceneRenderContext {
  /** Main transformation progress 0..1; stays 0 through the anticipation phase. */
  p: number;
  /** Anticipation progress 0..1, complete early in `rawP`. */
  prep: number;
  /** Animation clock; 0 under reduced motion. */
  wt: number;
  /** Horizontal centre of the scene. */
  cx: number;
  /** Vertical centre of the scene. */
  cy: number;
  /** Baseline (ground level) of the scene. */
  by: number;
  w: number;
  h: number;
  /** Palette of the resolved effect spec. */
  cs: string[];
  /** Reduced motion is requested. */
  red: boolean;
  frame: number;
  /** Horizontal tilt from device orientation, a small signed factor around 0. */
  gx: number;
  py: number;
  /** Half-width available to the composition around `cx`. */
  spanX: number;
  /** Unprocessed scene progress 0..1. */
  rawP: number;
  /** The animation clock exactly as the engine passed it. */
  t: number;
}

/** Signature of every scene draw function (`renderXxx` in `src/lib/sensory/scenes/`). */
export type SceneRenderer = (c: CanvasRenderingContext2D, scene: SceneRenderContext) => void;

/** Dispatch table from scene mode to its renderer. */
export type SceneRendererRegistry = Record<string, SceneRenderer>;
