<script>
  import { onMount } from 'svelte';
  import { currentLanguage } from '../../../lib/stores.js';
  import { trackEvent } from '../../../lib/analytics.js';

  let language = 'czech';
  currentLanguage.subscribe((v) => (language = v));

  const UI = {
    czech: {
      back: '← Zpět',
      title: '🧭 Průvodce',
      subtitle: 'Bez testů. Bez pocitu viny. Jen najdeme nejlehčí další krok.',
      step1: 'Vyberte 1–2 oblasti',
      step1Hint: 'Když nevíte, vyberte jednu. Dá se to kdykoli změnit.',
      continue: 'Pokračovat →',
      skip: 'Přeskočit (ukázat tipy)',
      step2: 'Váš nejlehčí další krok',
      near: '🗺️ Otevřít mapu v okolí',
      online: '⚡ Raději online teď',
      portals: '✨ Skutečné příležitosti (portály)',
      reset: 'Změnit výběr'
    },
    english: {
      back: '← Back',
      title: '🧭 Guided',
      subtitle: 'No tests. No guilt. We’ll find the easiest next step.',
      step1: 'Pick 1–2 areas',
      step1Hint: 'If unsure, pick one. You can change it anytime.',
      continue: 'Continue →',
      skip: 'Skip (show tips)',
      step2: 'Your easiest next step',
      near: '🗺️ Open nearby map',
      online: '⚡ Prefer online now',
      portals: '✨ Real opportunities (portals)',
      reset: 'Change selection'
    }
  };

  const VALUES = [
    { key: 'community', label: { czech: '🏠 Komunita', english: '🏠 Community' } },
    { key: 'environment', label: { czech: '🌍 Příroda', english: '🌍 Environment' } },
    { key: 'education', label: { czech: '📚 Vzdělání', english: '📚 Education' } },
    { key: 'health', label: { czech: '❤️ Zdraví', english: '❤️ Health' } },
    { key: 'poverty', label: { czech: '🤝 Sociální pomoc', english: '🤝 Social support' } },
    { key: 'elderly', label: { czech: '👴 Senioři', english: '👴 Seniors' } },
    { key: 'children', label: { czech: '👶 Děti', english: '👶 Children' } },
    { key: 'animals', label: { czech: '🐾 Zvířata', english: '🐾 Animals' } }
  ];

  const OPPORTUNITY_SOURCES = [
    {
      url: 'https://dobrokruh.cz/en/dobrovolnictvi?utm_source=openai',
      czech: { title: 'Dobrokruh', desc: 'Ověřené dobrovolnické projekty napříč Českem.' },
      english: { title: 'Dobrokruh', desc: 'Verified volunteering projects across Czechia.' }
    },
    {
      url: 'https://www.inexsda.cz/en/activities/workcamps-in-cz/?utm_source=openai',
      czech: { title: 'INEX – workcampy', desc: 'Krátké workcampy v ČR (dobré pro restart).'},
      english: { title: 'INEX – workcamps', desc: 'Short workcamps in CZ (good reset).'}
    },
    {
      url: 'https://adra.cz/en/homepage/get-involved/become-a-volunteer/?utm_source=openai',
      czech: { title: 'ADRA – dobrovolnictví', desc: 'Programy: senioři, děti, nemocnice, sociální podpora.'},
      english: { title: 'ADRA – volunteering', desc: 'Programs: seniors, kids, hospitals, social support.'}
    }
  ];

  let selected = [];
  let stage = 'pick'; // pick | result

  function toggleValue(k) {
    if (selected.includes(k)) selected = selected.filter((x) => x !== k);
    else selected = [...selected, k].slice(0, 2);
  }

  function goResult(mode) {
    stage = 'result';
    trackEvent('aa_guided_to_result', {
      mode: mode || 'unknown',
      selected_count: Array.isArray(selected) ? selected.length : 0
    });
    try {
      localStorage.setItem('aa_values', JSON.stringify(selected));
    } catch {}
  }

  function reset() {
    stage = 'pick';
  }

  onMount(() => {
    try {
      const s = JSON.parse(localStorage.getItem('aa_values') || '[]');
      if (Array.isArray(s) && s.length) selected = s;
    } catch {}
  });
</script>

<div class="page">
  <div class="header">
    <a class="back" href="/app">{UI[language].back}</a>
    <div class="title">{UI[language].title}</div>
    <div class="subtitle">{UI[language].subtitle}</div>
  </div>

  {#if stage === 'pick'}
    <div class="card">
      <div class="section-title">{UI[language].step1}</div>
      <div class="muted">{UI[language].step1Hint}</div>
      <div class="chips">
        {#each VALUES as v}
          <button
            class:selected={selected.includes(v.key)}
            class="chip"
            type="button"
            on:click={() => toggleValue(v.key)}
          >
            {v.label[language]}
          </button>
        {/each}
      </div>
      <div class="cta-row">
        <button class="primary" type="button" on:click={() => goResult('continue')}>
          {UI[language].continue}
        </button>
        <button class="secondary" type="button" on:click={() => goResult('skip')}>
          {UI[language].skip}
        </button>
      </div>
    </div>
  {:else}
    <div class="card">
      <div class="section-title">{UI[language].step2}</div>
      <div class="muted">
        {language === 'czech'
          ? 'Vyberte si jen jednu věc. Až to bude moc, klidně přestaňte.'
          : 'Pick just one thing. If it’s too much, you can stop.'}
      </div>
      <div class="cta-row">
        <a class="primary linkbtn" href="/near" on:click={() => trackEvent('aa_guided_next', { next: 'near' })}>
          {UI[language].near}
        </a>
        <a class="secondary linkbtn" href="/app/online" on:click={() => trackEvent('aa_guided_next', { next: 'online' })}>
          {UI[language].online}
        </a>
      </div>
      <div style="height: 0.75rem;"></div>
      <button class="ghost" type="button" on:click={reset}>{UI[language].reset}</button>
    </div>

    <div class="card">
      <div class="section-title">{UI[language].portals}</div>
      <div class="grid">
        {#each OPPORTUNITY_SOURCES as s}
          <div class="portal">
            <div class="portal-title">{s[language].title}</div>
            <div class="portal-desc">{s[language].desc}</div>
            <a class="portal-link" href={s.url} target="_blank" rel="noopener">
              {language === 'czech' ? 'Otevřít →' : 'Open →'}
            </a>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .page { max-width: 1120px; margin: 0 auto; padding: 1rem 1rem 2rem 1rem; }
  .header { text-align: center; margin-bottom: 1rem; }
  .back { display:inline-block; margin-bottom:0.5rem; color: var(--text-secondary); text-decoration:none; }
  .back:hover { text-decoration: underline; }
  .title { font-family:'Inter',sans-serif; font-weight:900; color: var(--czech-forest); font-size: clamp(1.7rem, 3vw, 2.3rem); }
  .subtitle { color: var(--text-secondary); margin-top:0.35rem; }

  .card {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(44, 62, 45, 0.12);
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
    padding: 1.05rem;
    margin-top: 0.85rem;
  }
  .section-title { font-weight: 900; font-family:'Inter',sans-serif; color: var(--czech-forest); margin-bottom: 0.25rem; }
  .muted { color: var(--text-secondary); }

  .chips { display:flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .chip {
    border-radius: 999px;
    border: 1px solid rgba(44, 62, 45, 0.12);
    background: rgba(242, 247, 242, 0.8);
    padding: 0.55rem 0.75rem;
    cursor: pointer;
    font-weight: 800;
    color: var(--czech-forest);
  }
  .chip.selected {
    background: var(--czech-forest);
    color: white;
    border-color: rgba(44, 62, 45, 0.12);
  }

  .cta-row { display:flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.85rem; }
  .primary, .secondary, .ghost {
    border-radius: 12px;
    padding: 0.7rem 0.9rem;
    font-weight: 900;
    cursor: pointer;
    border: 1px solid rgba(44, 62, 45, 0.12);
  }
  .primary {
    background: var(--czech-forest);
    color: white;
  }
  .secondary {
    background: white;
    color: var(--czech-forest);
  }
  .ghost {
    background: transparent;
    color: var(--text-secondary);
  }
  .ghost:hover { text-decoration: underline; }

  .linkbtn { text-decoration:none; display:inline-flex; align-items:center; justify-content:center; }

  .grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; margin-top: 0.75rem; }
  .portal { padding: 0.9rem; border-radius: 16px; border: 1px solid rgba(44, 62, 45, 0.12); background: rgba(255,255,255,0.85); }
  .portal-title { font-weight: 900; color: var(--czech-forest); }
  .portal-desc { color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.55; }
  .portal-link { display:inline-block; margin-top: 0.6rem; color: var(--czech-forest); font-weight: 900; text-decoration:none; }
  .portal-link:hover { text-decoration: underline; }

  @media (max-width: 980px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
</style>


