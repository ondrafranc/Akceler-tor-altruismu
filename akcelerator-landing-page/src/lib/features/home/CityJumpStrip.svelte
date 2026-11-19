<script>
  import AppIcon from '$lib/components/AppIcon.svelte';
  import { CZECH_CITIES } from '../../data/czech-actions.js';
  import { trackEvent } from '../../analytics.js';

  /**
   * @typedef {{ id: string, name: string, lat: number, lon: number, radius: number }} CzechCity
   */
  /** @type {{ cities?: CzechCity[] }} */
  let { cities = CZECH_CITIES.slice(0, 8) } = $props();
</script>

<div class="city-strip" aria-label="Rychlý skok do města na mapě">
  <span class="city-strip-lbl">
    <AppIcon name="map-pin" size={15} strokeWidth={2.1} />
    <span>Rychle na mapu:</span>
  </span>
  <div class="city-strip-links">
    {#each cities as city (city.id)}
      <a
        href={`/near?lat=${city.lat}&lon=${city.lon}&r=${Math.round(city.radius / 1000)}`}
        onclick={() => trackEvent("aa_home_city_jump", { city: city.id })}
      >
        {city.name}
      </a>
    {/each}
    <a href="/near" class="all-cities-link">
      <span>Všechny obce</span>
      <AppIcon name="arrow-right" size={14} strokeWidth={2.2} />
    </a>
  </div>
</div>

<style>
  .city-strip {
    margin-top: 1.15rem;
    padding: 0.85rem 1.1rem;
    border-radius: 14px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }

  .city-strip-lbl {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 700;
    color: var(--ink-primary, #14281d);
    white-space: nowrap;
  }

  .city-strip-links {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .city-strip-links a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.4rem 0.78rem;
    border-radius: 999px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--accent-primary, #1b5e42);
    text-decoration: none;
    font-weight: 600;
    box-sizing: border-box;
    transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  }

  .city-strip-links a:hover {
    background: var(--bohemian-mist, #e6f0ea);
    border-color: var(--accent-primary, #1b5e42);
    color: var(--accent-primary-hover, #144732);
  }

  .all-cities-link {
    background: var(--bg-surface, #ffffff) !important;
    border-color: var(--border-strong, #c2cec5) !important;
    font-weight: 700 !important;
  }
</style>
