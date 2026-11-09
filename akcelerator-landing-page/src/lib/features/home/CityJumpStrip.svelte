<script>
  import { CZECH_CITIES } from '../../data/czech-actions.js';
  import { trackEvent } from '../../analytics.js';

  export let cities = CZECH_CITIES.slice(0, 8);
</script>

<div class="city-strip" aria-label="Rychlý skok do města na mapě">
  <span class="city-strip-lbl">📍 Rychle na mapu:</span>
  <div class="city-strip-links">
    {#each cities as city}
      <a
        href={`/near?lat=${city.lat}&lon=${city.lon}&r=${Math.round(city.radius / 1000)}`}
        on:click={() => trackEvent("aa_home_city_jump", { city: city.id })}
      >
        {city.name}
      </a>
    {/each}
    <a href="/near" class="all-cities-link">Všechny obce →</a>
  </div>
</div>

<style>
  .city-strip {
    margin-top: 1.25rem;
    padding: 0.85rem 1.15rem;
    border-radius: 0.85rem;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(16, 185, 129, 0.15);
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }

  .city-strip-lbl {
    font-weight: 600;
    color: var(--text-heading, #1f2937);
    white-space: nowrap;
  }

  .city-strip-links {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .city-strip-links a {
    color: #059669;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s ease;
  }

  .city-strip-links a:hover {
    color: #047857;
    text-decoration: underline;
  }

  .all-cities-link {
    font-weight: 600 !important;
    margin-left: 0.25rem;
  }
</style>

