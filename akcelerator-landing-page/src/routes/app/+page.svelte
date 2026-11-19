<script>
  import { trackEvent } from "../../lib/analytics.js";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
</script>

<svelte:head>
  <title>Akcelerátor altruismu — Pomáháme lidem pomáhat</title>
</svelte:head>

<div class="app-page">
  <PageHeader
    kicker="Akcelerátor altruismu · Pomáháme lidem pomáhat"
    title="Kudy se ti dnes "
    titleAccent="chce pomoct"
    titleSuffix="?"
    subtitle="Ať máš 2 minuty u telefonu, nebo volné odpoledne venku — vyber si přímou cestu ke skutečnému dobrému skutku."
  />

  <div class="grid">
    <a
      class="card featured-svet"
      href="/svet"
      on:click={() => trackEvent("aa_app_choice", { choice: "svet" })}
    >
      <span class="card-overline">
        <AppIcon name="trees" size={14} strokeWidth={2} />
        <span>ŽIVÁ KRAJINA A KLIDNÝ DECH</span>
      </span>
      <div class="card-title">Krajina dobra</div>
      <div class="card-desc">
        Zastav se u klidné české lesní tůně, rozsviť svůj dnešní dobrý skutek
        nebo si dopřej minutu klidného dechu.
      </div>
      <div class="card-cta">
        <span>Vstoupit do Krajiny dobra</span>
        <AppIcon name="arrow-right" size={15} strokeWidth={2} />
      </div>
    </a>

    <a
      class="card"
      href="/app/guided"
      data-molly-guide="true"
      on:click={() => trackEvent("aa_app_choice", { choice: "guided" })}
    >
      <span class="card-overline">
        <AppIcon name="compass" size={14} strokeWidth={2} />
        <span>VÝBĚR NA MÍRU</span>
      </span>
      <div class="card-title">Průvodce podle tvé situace</div>
      <div class="card-desc">
        Zvolíš si čas a blízké téma — průvodce ti hned doporučí jeden konkrétní
        ověřený krok.
      </div>
      <div class="card-cta">
        <span>Spustit průvodce</span>
        <AppIcon name="arrow-right" size={15} strokeWidth={2} />
      </div>
    </a>

    <a
      class="card"
      href="/near"
      on:click={() => trackEvent("aa_app_choice", { choice: "near" })}
    >
      <span class="card-overline">
        <AppIcon name="map-pin" size={14} strokeWidth={2} />
        <span>VE TVÉM MĚSTĚ A KRAJI</span>
      </span>
      <div class="card-title">Mapa pomoci v okolí</div>
      <div class="card-desc">
        Útulky, veřejné knihobudky, šatníky, potravinové banky a spolky po celé
        ČR s připravenou zprávou na oslovení.
      </div>
      <div class="card-cta">
        <span>Otevřít mapu v okolí</span>
        <AppIcon name="arrow-right" size={15} strokeWidth={2} />
      </div>
    </a>

    <a
      class="card"
      href="/app/online"
      on:click={() => trackEvent("aa_app_choice", { choice: "online" })}
    >
      <span class="card-overline">
        <AppIcon name="zap" size={14} strokeWidth={2} />
        <span>Z DOMOVA I CESTOU VEN</span>
      </span>
      <div class="card-title">Drobné skutky na pár minut</div>
      <div class="card-desc">
        Ověřené české projekty přehledně na jednom místě — od naplnění misky v
        útulku jedním klikem až po mapování studánek.
      </div>
      <div class="card-cta">
        <span>Prohlédnout online tipy</span>
        <AppIcon name="arrow-right" size={15} strokeWidth={2} />
      </div>
    </a>
  </div>
</div>

<style>
  .app-page {
    width: 100%;
    max-width: 1140px;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 0.5rem 1.25rem 3rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 0.75rem;
  }

  .card {
    min-height: 44px;
    box-sizing: border-box;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 18px;
    box-shadow: var(--shadow-sm);
    padding: 1.5rem;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    transition:
      transform 0.2s var(--ease-gentle),
      box-shadow 0.2s var(--ease-gentle),
      border-color 0.2s var(--ease-gentle);
  }

  .card:hover {
    transform: translateY(-2px);
    border-color: var(--border-strong, #c2cec5);
    box-shadow: var(--shadow-md);
  }

  .card.featured-svet {
    background: var(--bg-surface, #ffffff);
    border-color: var(--border-strong, #c2cec5);
  }

  .card-overline {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    font-size: 0.73rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent-primary, #1b5e42);
  }

  .card-title {
    font-size: 1.24rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--ink-primary, #14281d);
  }

  .card-desc {
    font-size: 0.93rem;
    line-height: 1.58;
    color: var(--ink-secondary, #3f574a);
    flex: 1;
  }

  .card-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    margin-top: 0.35rem;
  }

  .card:hover .card-cta {
    color: var(--accent-primary-hover, #144732);
  }

  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .app-page {
      padding: 0.25rem 0.75rem 2rem;
    }

    .grid {
      gap: 0.65rem;
      margin-top: 0.45rem;
    }

    .card {
      padding: 1rem 1.05rem;
      border-radius: 16px;
      gap: 0.35rem;
    }

    .card-overline {
      font-size: 0.68rem;
    }

    .card-title {
      font-size: 1.04rem;
      line-height: 1.22;
    }

    .card-desc {
      font-size: 0.86rem;
      line-height: 1.48;
    }

    .card-cta {
      font-size: 0.84rem;
      margin-top: 0.2rem;
    }
  }
</style>
