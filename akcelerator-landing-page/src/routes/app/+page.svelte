<script>
  import { trackEvent } from '../../lib/analytics.js';
</script>

<svelte:head>
  <title>Rozcestník pomoci — Akcelerátor altruismu</title>
</svelte:head>

<div class="app-page">
  <div class="subpage-hero header">
    <div class="hero-kicker">ROZCESTNÍK POMOCI • VYBER SI SVŮJ ZPŮSOB</div>
    <h1 class="title">Kudy se ti dnes <span class="serif-accent">chce vydat?</span></h1>
    <p class="subtitle">
      Ať máš zrovna minutu u telefonu, nebo volné odpoledne venku — vyber si cestu, která ti dnes sedí.
    </p>
  </div>

  <div class="grid">
    <a class="card featured-svet" href="/svet" on:click={() => trackEvent('aa_app_choice', { choice: 'svet' })}>
      <div class="card-accent gold"></div>
      <div class="card-badge">🌿 Živá krajina • Skutky a dech</div>
      <div class="card-title">Krajina dobra a klidný dech</div>
      <div class="card-desc">
        Prozkoumej českou krajinu plnou skutečných dobrých skutků, rozsviť v ní ten svůj nebo si dopřej minutu klidného dechu.
      </div>
      <div class="card-cta">Vstoupit do Krajiny dobra →</div>
    </a>

    <a class="card" href="/app/guided" on:click={() => trackEvent('aa_app_choice', { choice: 'guided' })}>
      <div class="card-accent forest"></div>
      <div class="card-badge">🧭 Když váháš, kde začít</div>
      <div class="card-title">Průvodce podle tvé situace</div>
      <div class="card-desc">
        Naklikneš si, kolik máš dnes času a jaký směr ti je blízký — průvodce ti hned doporučí konkrétní ověřený krok.
      </div>
      <div class="card-cta">Spustit průvodce →</div>
    </a>

    <a class="card" href="/near" on:click={() => trackEvent('aa_app_choice', { choice: 'near' })}>
      <div class="card-accent emerald"></div>
      <div class="card-badge">📍 Ve tvém městě a kraji</div>
      <div class="card-title">Mapa pomoci v okolí</div>
      <div class="card-desc">
        Útulky, veřejné knihobudky, šatníky, potravinové banky a sousedské spolky po celé ČR s připravenou zprávou na oslovení.
      </div>
      <div class="card-cta">Otevřít mapu v okolí →</div>
    </a>

    <a class="card" href="/app/online" on:click={() => trackEvent('aa_app_choice', { choice: 'online' })}>
      <div class="card-accent amber"></div>
      <div class="card-badge">🛋️ Z domova i cestou ven</div>
      <div class="card-title">Online mikro-kroky</div>
      <div class="card-desc">
        Ověřené české projekty přehledně na jednom místě — od naplnění misky v útulku jedním klikem až po mapování studánek.
      </div>
      <div class="card-cta">Prohlédnout online tipy →</div>
    </a>
  </div>
</div>

<style>
  .app-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 3.8rem;
  }

  .header {
    text-align: center;
  }

  .hero-kicker {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #047857;
    margin-bottom: 0.4rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #0e281c;
    font-size: clamp(2rem, 3.6vw, 2.8rem);
    line-height: 1.12;
    margin: 0;
    letter-spacing: -0.03em;
  }

  .title .serif-accent {
    color: #059669;
    font-weight: 400;
  }

  .subtitle {
    color: #365244;
    margin: 0.65rem auto 0;
    max-width: 52ch;
    font-size: 1rem;
    line-height: 1.6;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
    margin-top: 1.5rem;
  }

  .card {
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 26px;
    box-shadow: var(--shadow-sm);
    padding: 1.75rem;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    transition: transform 0.24s var(--ease-gentle), box-shadow 0.24s var(--ease-gentle);
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .card.featured-svet {
    background: linear-gradient(155deg, #ffffff 0%, #eef7f0 100%);
  }

  .card-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }
  .card-accent.emerald { background: linear-gradient(90deg, #10b981, #34d399); }
  .card-accent.amber { background: linear-gradient(90deg, #f59e0b, #fde68a); }
  .card-accent.forest { background: linear-gradient(90deg, #0f2d20, #10b981); }
  .card-accent.gold { background: linear-gradient(90deg, #34d399, #fde68a); }

  .card-badge {
    align-self: flex-start;
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--emerald-600);
    background: rgba(16, 185, 129, 0.09);
    padding: 0.28rem 0.7rem;
    border-radius: 999px;
  }

  .card-title {
    font-size: 1.28rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  .card-desc {
    font-size: 0.93rem;
    line-height: 1.6;
    color: var(--text-secondary);
    flex: 1;
  }

  .card-cta {
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--forest-800);
    margin-top: 0.35rem;
  }

  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
