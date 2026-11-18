<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { EVIDENCE_TIERS } from '../../../data/czech-actions.js';

  export let tier = 'B';
  export let className = '';
  export let variant = 'pill'; // 'pill' | 'card' | 'rec'

  const DAYLIGHT_TIER_LABELS = {
    A: 'Přímý měřitelný účinek',
    B: 'Doložený přínos',
    C: 'Komunitní smysl'
  };

  $: safeTier = tier && EVIDENCE_TIERS[tier] ? tier : 'B';
  $: tierMeta = EVIDENCE_TIERS[safeTier] || { desc: '' };
  $: tierLabel = DAYLIGHT_TIER_LABELS[safeTier] || 'Doložený přínos';
  $: baseClass = variant === 'card'
    ? 'card-evidence-badge'
    : variant === 'rec'
      ? 'rec-evidence-pill'
      : 'evidence-pill';
  $: fullClass = `${baseClass} tier-${safeTier} ${className}`.trim();
</script>

<span
  class={fullClass}
  title={tierMeta.desc || `Ověřený dopad (${safeTier})`}
>
  <AppIcon name="shield-check" size={12} strokeWidth={2.2} />
  <span>Ověřený dopad ({safeTier}) · {tierLabel}</span>
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
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .tier-C {
    background: var(--accent-warm-tint, #fef6e8);
    color: #8f4b0e;
    border: 1px solid rgba(184, 101, 27, 0.3);
  }
</style>
