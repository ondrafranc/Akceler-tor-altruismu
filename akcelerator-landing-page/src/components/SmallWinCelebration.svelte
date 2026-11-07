<script>
  import {
    activeCelebration,
    closeCelebration,
    SANCTUARY_ELEMENTS
  } from '../lib/progress.js';
  import { trackEvent } from '../lib/analytics.js';

  let restingMode = false;
  let sharedCopied = false;

  $: if ($activeCelebration) {
    restingMode = false;
    sharedCopied = false;
  }

  $: activeElementMeta = $activeCelebration
    ? SANCTUARY_ELEMENTS.find((e) => e.key === $activeCelebration.element) || SANCTUARY_ELEMENTS[0]
    : SANCTUARY_ELEMENTS[0];

  function handleStopHere() {
    restingMode = true;
    trackEvent('aa_after_done_choice', { choice: 'stop_here' });
  }

  function handleContinue() {
    trackEvent('aa_after_done_choice', { choice: 'one_more' });
    closeCelebration();
  }

  function handleGoToWorld() {
    trackEvent('aa_after_done_choice', { choice: 'enter_world' });
    closeCelebration();
  }

  async function handleShareWithFriend() {
    if (!$activeCelebration) return;
    const shareTitle = $activeCelebration.title || 'Malý dobrý skutek';
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://akcelerator-altruismu.cz';
    const shareText = `Tip na jednoduchou pomoc, která zabere jen chvilku („${shareTitle}“): ${shareUrl}`;

    trackEvent('aa_after_done_choice', { choice: 'share_friend' });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Akcelerátor altruismu',
          text: shareText,
          url: shareUrl
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        sharedCopied = true;
        setTimeout(() => (sharedCopied = false), 2500);
      } catch {}
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && $activeCelebration) {
      closeCelebration();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $activeCelebration}
  <div
    class="celebration-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="win-title"
  >
    <div class="celebration-card">
      <div class="celebration-glow" aria-hidden="true"></div>
      {#if !restingMode}
        <div class="win-overline">{activeElementMeta.icon} Klidné poděkování</div>
        <h3 id="win-title" class="win-title">{$activeCelebration.title}</h3>
        <p class="win-message">
          {$activeCelebration.concreteImpact || $activeCelebration.message}
        </p>

        <div class="win-actions">
          <a href="/svet?just_lit=1" class="btn-world" on:click={handleGoToWorld}>
            ✨ Rozsvítit tenhle skutek v Krajině dobra →
          </a>
          <button type="button" class="btn-stop" on:click={handleStopHere}>
            ☕ Pro dnešek mám splněno — dopřát si klid
          </button>
          <div class="win-secondary-row">
            <button type="button" class="btn-share" on:click={handleShareWithFriend}>
              {sharedCopied ? '✓ Odkaz zkopírován' : '↗ Poslat tip blízkému'}
            </button>
            <button type="button" class="btn-more" on:click={handleContinue}>
              Zavřít
            </button>
          </div>
        </div>
      {:else}
        <div class="rest-icon" aria-hidden="true">🌿</div>
        <h3 id="win-title" class="win-title">Děkujeme, pro dnešek je hotovo</h3>
        <p class="win-message">
          Udělal/a jsi konkrétní dobrou věc pro druhé. Klidně teď odlož telefon a dopřej si chvíli ticha.
        </p>
        <div class="win-actions">
          <a href="/svet#dech" class="btn-world" on:click={handleGoToWorld}>
            🌊 Minuta klidného dechu v Krajině dobra
          </a>
          <button type="button" class="btn-stop" on:click={closeCelebration}>
            Zavřít okno
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .celebration-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: rgba(6, 20, 14, 0.56);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    animation: fadeIn 0.22s ease-out;
  }

  .celebration-card {
    position: relative;
    overflow: hidden;
    width: 100%;
    max-width: 450px;
    background: #ffffff;
    border-radius: 28px;
    padding: 2.1rem 1.9rem;
    box-shadow: 0 32px 64px -16px rgba(4, 15, 10, 0.45);
    border: 1px solid rgba(16, 185, 129, 0.2);
    text-align: center;
  }

  .celebration-glow {
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    width: 260px;
    height: 140px;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%);
    pointer-events: none;
  }

  .win-overline {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #059669;
    margin-bottom: 0.55rem;
  }

  .rest-icon {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
  }

  .win-title {
    margin: 0 0 0.55rem 0;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0b2419;
    line-height: 1.25;
  }

  .win-message {
    margin: 0 0 1.4rem 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #3d5247;
  }

  .win-actions {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .btn-world {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.92rem 1.25rem;
    border-radius: 15px;
    background: linear-gradient(135deg, #0d2e20 0%, #174933 100%);
    color: #fde68a;
    font-weight: 700;
    font-size: 0.93rem;
    text-decoration: none;
    box-shadow: 0 12px 24px -8px rgba(9, 29, 20, 0.32);
    transition: transform 0.2s ease;
  }

  .btn-world:hover {
    transform: translateY(-2px);
  }

  .btn-stop {
    padding: 0.84rem 1.15rem;
    border-radius: 15px;
    border: 1px solid rgba(22, 66, 48, 0.14);
    background: #f6faf7;
    color: #0d291d;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: background 0.18s ease;
  }

  .btn-stop:hover {
    background: #eaf3ed;
  }

  .win-secondary-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.15rem;
  }

  .btn-share,
  .btn-more {
    flex: 1;
    padding: 0.55rem 0.65rem;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #5b7367;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn-share:hover,
  .btn-more:hover {
    color: #0d2118;
    background: rgba(22, 66, 48, 0.05);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
