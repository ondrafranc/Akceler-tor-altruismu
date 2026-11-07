<script>
  import { trackEvent } from '../../lib/analytics.js';
</script>

<svelte:head>
  <title>Akcelerátor altruismu — Pomáháme lidem pomáhat</title>
</svelte:head>

<div class="app-page">
  <div class="subpage-hero header">
    <div class="hero-kicker">AKCELERÁTOR ALTRUISMU · POMÁHÁME LIDEM POMÁHAT</div>
    <h1 class="title">Kudy se ti dnes <span class="serif-accent">chce pomoci?</span></h1>
    <p class="subtitle">
      Ať máš 2 minuty u telefonu, nebo volné odpoledne venku — vyber si přímou cestu ke skutečnému dobrému skutku.
    </p>
  </div>

  <div class="grid">
    <a class="card featured-svet" href="/svet" on:click={() => trackEvent('aa_app_choice', { choice: 'svet' })}>
      <span class="card-overline">🌿 ŽIVÁ KRAJINA A KLIDNÝ DECH</span>
      <div class="card-title">Krajina dobra</div>
      <div class="card-desc">
        Prozkoumej malovanou krajinu plnou skutečných dobrých skutků, rozsviť v ní ten svůj nebo si dopřej minutu klidného dechu.
      </div>
      <div class="card-cta">Vstoupit do Krajiny dobra →</div>
    </a>

    <a class="card" href="/app/guided" on:click={() => trackEvent('aa_app_choice', { choice: 'guided' })}>
      <span class="card-overline">🧭 VÝBĚR NA MÍRU</span>
      <div class="card-title">Průvodce podle tvé situace</div>
      <div class="card-desc">
        Zvolíš si čas a blízké téma — průvodce ti hned doporučí jeden konkrétní ověřený krok.
      </div>
      <div class="card-cta">Spustit průvodce →</div>
    </a>

    <a class="card" href="/near" on:click={() => trackEvent('aa_app_choice', { choice: 'near' })}>
      <span class="card-overline">📍 VE TVÉM MĚSTĚ A KRAJI</span>
      <div class="card-title">Mapa pomoci v okolí</div>
      <div class="card-desc">
        Útulky, veřejné knihobudky, šatníky, potravinové banky a spolky po celé ČR s připravenou zprávou na oslovení.
      </div>
      <div class="card-cta">Otevřít mapu v okolí →</div>
    </a>

    <a class="card" href="/app/online" on:click={() => trackEvent('aa_app_choice', { choice: 'online' })}>
      <span class="card-overline">⚡ Z DOMOVA I CESTOU VEN</span>
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
    max-width: 1100px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem 3.8rem;
  }

  .header {
    text-align: center;
  }

  .hero-kicker {
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #fde68a;
    margin-bottom: 0.35rem;
  }

  .title {
    font-family: var(--font-sans);
    font-weight: 800;
    color: #ffffff;
    font-size: clamp(2rem, 3.6vw, 2.75rem);
    line-height: 1.12;
    margin: 0;
    letter-spacing: -0.03em;
  }

  .title .serif-accent {
    color: #fde68a;
    font-weight: 400;
  }

  .subtitle {
    color: rgba(236, 248, 241, 0.9);
    margin: 0.55rem auto 0;
    max-width: 50ch;
    font-size: 0.98rem;
    line-height: 1.6;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.2rem;
    margin-top: 1.4rem;
  }

  .card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(22, 66, 48, 0.09);
    border-radius: 24px;
    box-shadow: var(--shadow-sm);
    padding: 1.8rem;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    transition: transform 0.24s var(--ease-gentle), box-shadow 0.24s var(--ease-gentle);
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .card.featured-svet {
    background: linear-gradient(155deg, #ffffff 0%, #f1f8f3 100%);
  }

  .card-overline {
    font-size: 0.73rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--emerald-600);
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
    margin-top: 0.4rem;
  }

  .card:hover .card-cta {
    color: var(--emerald-600);
  }

  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
