<script>
  import { trackEvent } from "$lib/analytics.js";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
</script>

<svelte:head>
  <title>Stránka nenalezena — Akcelerátor altruismu</title>
</svelte:head>

<div class="error-wrap">
  <div class="error-card">
    <PageHeader
      kicker="Tichá odbočka"
      title="Tady zrovna nic není, ale "
      titleAccent="naděje nekončí"
      titleSuffix="."
      subtitle="Možná šlo o starší odkaz. Pojďme tě rovnou vrátit tam, kde během minuty najdeš jeden lehký, skutečný krok v Česku."
      align="center"
    />

    <div class="error-actions">
      <a
        href="/"
        class="error-btn-primary"
        onclick={() => trackEvent("aa_launch", { from: "error_page" })}
      >
        <AppIcon name="zap" size={16} strokeWidth={2} />
        <span>Zpět na Rychlý start</span>
        <AppIcon name="arrow-right" size={16} strokeWidth={2} />
      </a>
      <a href="/near" class="error-btn-secondary">
        <AppIcon name="map-pin" size={16} strokeWidth={2} />
        <span>Otevřít mapu v okolí</span>
      </a>
    </div>
  </div>
</div>

<style>
  .error-wrap {
    width: 100%;
    max-width: 760px;
    box-sizing: border-box;
    margin: 2rem auto 4rem;
    padding: 0 1.25rem;
  }

  .error-card {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 20px;
    padding: 2rem 1.75rem 2.35rem;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    text-align: center;
  }

  .error-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }

  .error-btn-primary,
  .error-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.75rem 1.3rem;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.94rem;
    text-decoration: none;
    box-sizing: border-box;
    transition: background-color 0.18s ease, border-color 0.18s ease;
  }

  .error-btn-primary {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border: 1px solid var(--accent-primary, #1b5e42);
  }

  .error-btn-primary:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  .error-btn-secondary {
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--ink-primary, #14281d);
  }

  .error-btn-secondary:hover {
    background: var(--bg-canvas, #f6f7f3);
  }

  @media (max-width: 680px) {
    .error-wrap {
      padding: 0 0.75rem;
      margin: 1.25rem auto 2.5rem;
    }

    .error-card {
      padding: 1.35rem 1rem 1.65rem;
      border-radius: 16px;
    }
  }
</style>
