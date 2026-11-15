/**
 * Canonical Deed and Action Catalog Type Definitions.
 */

export type EvidenceTier = 'A' | 'B' | 'C';
export type TimeBucket = '5' | '15' | '30' | '45' | '60' | '15m' | '30m' | '60m+';
export type DeedMode = 'online' | 'local' | 'home';
export type DeedCost = 'free' | 'donation';
export type DeedSocial = 'solo' | 'group';
export type CommitmentLevel = 'one_off' | 'long_term';
export type ContactLevel = 'anonymous' | 'contact_ok';
export type RecipientMacro = 'people' | 'animals' | 'nature';
export type SanctuaryElement = 'animals' | 'care' | 'nature' | 'solidarity' | 'civic' | 'community' | 'knowledge';

export interface ImpactChain {
  activity: string;
  immediateOutput: string;
  realImpact: string;
}

export interface MicroAction {
  id: string;
  title: string;
  org: string;
  desc: string;
  description?: string;
  whyItMatters: string;
  steps: string[];
  instructions?: string[];
  cta: string;
  ctaLabel?: string;
  doneCta?: string;
  url: string;
  sourceUrl?: string;
  externalUrl?: string;
  reassurance: string;
  selfBenefit: string;
  concreteImpact: string;
  element: SanctuaryElement | string;
  values: string[];
  timeMinutes: number;
  durationMinutes?: number;
  timeBucket: TimeBucket | string;
  cost: DeedCost | string;
  mode: DeedMode | string;
  locationType?: 'online' | 'local' | 'anywhere' | string;
  social: DeedSocial | string;
  categoryTag?: string;
  category?: string;
  recipientMacro?: RecipientMacro | string;
  commitment?: CommitmentLevel | string;
  contactLevel?: ContactLevel | string;
  registrationRequired?: boolean;
  isAvailable?: boolean;
  impactEvidence?: EvidenceTier | string;
  impactEvidenceBadge?: string;
  impactEvidenceShort?: string;
  impactBasis?: 'doložený' | 'odhadovaný' | string;
  impactChain?: ImpactChain;
  lastVerifiedAt?: string | null;
  verifiedLabel?: string;
  quickTagsLabel?: string;
  metaLabel?: string;
  score?: number;
  reasons?: string[];
  [key: string]: unknown;
}

export interface ActionEffectMeta {
  mode: string;
  asmr: string;
  icon: string;
  target: number;
  label: string;
  colors: string[];
  cue?: string;
}
