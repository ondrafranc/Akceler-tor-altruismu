<script>
  import { trackEvent } from '../lib/analytics.js';
</script>

<svelte:head>
  <title>Stránka nenalezena — Akcelerátor altruismu</title>
</svelte:head>

<div class="error-wrap">
  <div class="subpage-hero error-card">
    <div class="kicker">TICHÁ ODBOČKA</div>
    <h1>Tady zrovna nic není, ale <span class="serif-accent">naděje nekončí</span>.</h1>
    <p>
      Možná šlo o starší odkaz. Pojďme tě rovnou vrátit tam, kde během minuty najdeš jeden lehký, skutečný krok v Česku.
    </p>

    <div class="error-actions">
      <a
        href="/"
        class="btn-primary"
        on:click={() => trackEvent('aa_launch', { from: 'error_page' })}
      >
        Zpět na Rychlý start →
      </a>
      <a href="/near" class="btn-glass">
        Otevřít mapu v okolí
      </a>
    </div>
  </div>
</div>

<style>
  .error-wrap {
    max-width: 760px;
    margin: 2rem auto 4rem;
    padding: 0 1.25rem;
  }

  .error-card {
    text-align: center;
    padding: 3.5rem 2rem;
  }

  .kicker {
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #fde68a;
    margin-bottom: 0.5rem;
  }

  h1 {
    font-family: var(--font-sans);
    font-size: clamp(1.85rem, 3.4vw, 2.6rem);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 0.85rem;
    letter-spacing: -0.03em;
    line-height: 1.12;
  }

  h1 .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  p {
    color: rgba(236, 248, 241, 0.9);
    line-height: 1.6;
    max-width: 50ch;
    margin: 0 auto 1.8rem;
  }

  .error-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-primary {
    padding: 0.82rem 1.35rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #fde68a 0%, #6ee7b7 100%);
    color: #072116;
    font-weight: 800;
    text-decoration: none;
    transition: transform 0.18s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
  }

  .btn-glass {
    padding: 0.82rem 1.35rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #f4faf6;
    font-weight: 700;
    text-decoration: none;
    backdrop-filter: blur(8px);
    transition: background 0.18s ease;
  }

  .btn-glass:hover {
    background: rgba(255, 255, 255, 0.22);
  }
</style>
