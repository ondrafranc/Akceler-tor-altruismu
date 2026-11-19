<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { EVIDENCE_TIERS } from '../../../data/czech-actions.js';

  /**
   * @type {{
   *   tier?: string,
   *   className?: string,
   *   variant?: 'pill' | 'card' | 'rec'
   * }}
   */
  let { tier = 'B', className = '', variant = 'pill' } = $props();

  /** @type {Record<string, string>} */
  const DAYLIGHT_TIER_LABELS = {
    A: 'Přímý měřitelný účinek',
    B: 'Doložený přínos',
    C: 'Komunitní smysl'
  };

  /** @type {Record<string, { desc?: string }>} */
  const TIER_MAP = EVIDENCE_TIERS;

  const safeTier = $derived(tier && TIER_MAP[tier] ? tier : 'B');
  const tierMeta = $derived(TIER_MAP[safeTier] || { desc: '' });
  const tierLabel = $derived(DAYLIGHT_TIER_LABELS[safeTier] || 'Doložený přínos');
  const baseClass = $derived(
    variant === 'card'
      ? 'card-evidence-badge'
      : variant === 'rec'
        ? 'rec-evidence-pill'
        : 'evidence-pill'
  );
  const fullClass = $derived(`${baseClass} tier-${safeTier} ${className}`.trim());
</script>

<span
  class={fullClass}
  title={tierMeta.desc || tierLabel}
>
  <AppIcon name="shield-check" size={12} strokeWidth={2.2} />
  <span>{tierLabel}</span>
</span>

<style>
  .evidence-pill,
  .card-evidence-badge,
  .rec-evidence-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    letter-spacing: 0.01em;
    cursor: help;
    line-height: 1.25;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .tier-A {
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    border: 1px solid var(--border-strong, #c2cec5);
  }

  .tier-B {
    background: var(--forest-brook-tint, #eaf2f4);
    color: var(--forest-brook-ink, #1d4f5f);
    border: 1px solid var(--forest-brook-border, #b8cfd6);
  }

  .tier-C {
    background: var(--accent-warm-tint, #fef6e8);
    color: var(--accent-warm-ink, #8f4b0e);
    border: 1px solid rgba(184, 101, 27, 0.3);
  }
</style>
