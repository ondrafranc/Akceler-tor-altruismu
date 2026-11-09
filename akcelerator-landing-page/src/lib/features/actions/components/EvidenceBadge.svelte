<script>
  import { EVIDENCE_TIERS } from '../../../data/czech-actions.js';

  export let tier = 'B';
  export let className = '';
  export let variant = 'pill'; // 'pill' | 'card' | 'rec'

  $: safeTier = tier && EVIDENCE_TIERS[tier] ? tier : 'B';
  $: tierMeta = EVIDENCE_TIERS[safeTier] || { shortLabel: 'Doložený výsledek', desc: '' };
  $: baseClass = variant === 'card'
    ? 'card-evidence-badge'
    : variant === 'rec'
      ? 'rec-evidence-pill'
      : 'evidence-pill';
  $: fullClass = `${baseClass} tier-${safeTier} ${className}`.trim();
</script>

<span
  class={fullClass}
  title={tierMeta.desc || `Třída důkazů ${safeTier}`}
>
  Důkazy {safeTier} · {tierMeta.shortLabel}
</span>

<style>
  .evidence-pill,
  .card-evidence-badge,
  .rec-evidence-pill {
    display: inline-flex;
    align-items: center;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    letter-spacing: 0.01em;
    cursor: help;
    transition: all 0.2s ease;
  }

  .tier-A {
    background: rgba(16, 185, 129, 0.14);
    color: #065f46;
    border: 1px solid rgba(16, 185, 129, 0.35);
  }

  .tier-B {
    background: rgba(59, 130, 246, 0.12);
    color: #1e40af;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .tier-C {
    background: rgba(245, 158, 11, 0.12);
    color: #92400e;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
</style>
