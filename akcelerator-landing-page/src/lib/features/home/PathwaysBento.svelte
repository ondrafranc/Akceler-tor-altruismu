<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
</script>

<section class="content-wrap paths-section" aria-label="Tři cesty k pomoci">
  <div class="section-header">
    <span class="section-overline">JAK SE ZAPOJIT</span>
    <h2>
      Vyber si cestu, která ti <span class="serif-accent">dneska sedí</span>
    </h2>
  </div>

  <div class="bento-paths">
    <a href="/near" class="bento-card">
      <div class="bento-icon-wrap pine">
        <AppIcon name="map-pin" size={22} strokeWidth={2} />
      </div>
      <h3>Pomoc kousek od tebe</h3>
      <p class="bento-desc">
        Útulky, potravinové banky, knihobudky a sousedská místa na mapě ČR — i
        s připravenou zprávou na oslovení.
      </p>
      <span class="bento-cta">
        <span>Otevřít mapu v&nbsp;okolí</span>
        <AppIcon name="arrow-right" size={15} strokeWidth={2.2} />
      </span>
    </a>

    <a href="/app/guided" class="bento-card">
      <div class="bento-icon-wrap warm">
        <AppIcon name="compass" size={22} strokeWidth={2} />
      </div>
      <h3>Průvodce podle situace</h3>
      <p class="bento-desc">
        Nevíš, kde začít? Zvol si čas a blízké téma — ukážeme ti jeden
        konkrétní skutek na míru.
      </p>
      <span class="bento-cta">
        <span>Spustit průvodce</span>
        <AppIcon name="arrow-right" size={15} strokeWidth={2.2} />
      </span>
    </a>

    <a href="/app/online" class="bento-card">
      <div class="bento-icon-wrap forest">
        <AppIcon name="zap" size={22} strokeWidth={2} />
      </div>
      <h3>Drobné skutky na pár minut</h3>
      <p class="bento-desc">
        Rychlá pomoc z mobilu či počítače: naplnění misky v útulku, mapování
        pro Lékaře bez hranic nebo dopis seniorovi.
      </p>
      <span class="bento-cta">
        <span>Prohlédnout online tipy</span>
        <AppIcon name="arrow-right" size={15} strokeWidth={2.2} />
      </span>
    </a>
  </div>

  <slot />
</section>

<style>
  .paths-section {
    margin-top: 2.5rem;
    margin-bottom: 2.5rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 1.85rem;
  }

  .section-overline {
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #047857;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.45rem;
  }

  .section-header h2 {
    font-family: var(--font-sans);
    font-size: clamp(1.7rem, 3.2vw, 2.4rem);
    font-weight: 800;
    line-height: 1.18;
    color: var(--ink-primary, #14281d);
    margin: 0;
  }

  .serif-accent {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    color: var(--czech-forest, #1d5c40);
  }

  .bento-paths {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .bento-card {
    display: flex;
    flex-direction: column;
    padding: 1.55rem 1.45rem;
    border-radius: 18px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .bento-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    border-color: var(--czech-linden, #256f4e);
  }

  .bento-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.05rem;
  }

  .bento-icon-wrap.pine {
    background: #dff0e6;
    color: #1b5e42;
    border: 1px solid #bed9c9;
  }

  .bento-icon-wrap.forest {
    background: var(--bohemian-sage, #eef5f0);
    color: var(--czech-linden, #256f4e);
    border: 1px solid var(--border-forest, #c5d9cd);
  }

  .bento-icon-wrap.warm {
    background: var(--accent-warm-tint, #fef6e8);
    color: #944f12;
    border: 1px solid rgba(184, 101, 27, 0.26);
  }

  .bento-card h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.45rem 0;
    color: var(--ink-primary, #14281d);
  }

  .bento-desc {
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--ink-secondary, #3f574a);
    margin: 0 0 1.15rem 0;
    flex-grow: 1;
  }

  .bento-cta {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--czech-forest, #1d5c40);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  @media (min-width: 960px) {
    .bento-card {
      border-color: var(--border-forest, #c5d9cd);
    }

    .bento-card:hover {
      border-color: var(--czech-linden, #256f4e);
    }

    .bento-cta {
      color: var(--czech-forest, #1d5c40);
    }
  }

  @media (max-width: 860px) {
    .bento-paths {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.9rem;
    }
  }
</style>
