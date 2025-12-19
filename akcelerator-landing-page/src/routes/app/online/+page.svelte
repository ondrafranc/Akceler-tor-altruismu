<script>
  import { currentLanguage } from '../../../lib/stores.js';
  import { trackEvent } from '../../../lib/analytics.js';

  let language = 'czech';
  currentLanguage.subscribe((v) => (language = v));

  const ORGS = [
    {
      id: 'tree',
      title: { czech: '🌳 Sázejme budoucnost', english: '🌳 Plant trees (Sázejme budoucnost)' },
      desc: {
        czech: 'Darujte na výsadbu stromů. Jedna z nejjednodušších věcí, co se dá udělat hned.',
        english: 'Donate to tree planting. One of the simplest “do it now” steps.'
      },
      url: 'https://www.sazimebudoucnost.cz/daruj',
      meta: { czech: '⏱️ 2–5 min • 💰 dobrovolné', english: '⏱️ 2–5 min • 💰 optional' }
    },
    {
      id: 'letters',
      title: { czech: '✉️ Dopisy seniorům', english: '✉️ Letters to seniors' },
      desc: {
        czech: 'Napište dopis. Je to jednoduché, ale pro někoho to může být nejhezčí část týdne.',
        english: 'Write a letter. Simple, but it can become someone’s best moment of the week.'
      },
      url: 'https://www.dopisy-seniorum.cz',
      meta: { czech: '⏱️ 10–20 min • 💰 zdarma', english: '⏱️ 10–20 min • 💰 free' }
    },
    {
      id: 'homeless',
      title: { czech: '🍞 Naděje – daruj jídlo', english: '🍞 Naděje – donate food' },
      desc: {
        czech: 'Rychlá praktická pomoc lidem bez domova.',
        english: 'Fast practical help for people experiencing homelessness.'
      },
      url: 'https://www.nadeje.cz/daruj-jidlo',
      meta: { czech: '⏱️ 2–5 min • 💰 dobrovolné', english: '⏱️ 2–5 min • 💰 optional' }
    },
    {
      id: 'tutoring',
      title: { czech: '🧑‍🏫 Učíme online', english: '🧑‍🏫 Online tutoring' },
      desc: {
        czech: 'Dobrovolnictví online. Skvělé, když nechcete být venku mezi lidmi.',
        english: 'Volunteer online. Great if you don’t want to go out right now.'
      },
      url: 'https://www.ucimeonline.cz/dobrovolnik',
      meta: { czech: '⏱️ registrace • 💰 zdarma', english: '⏱️ signup • 💰 free' }
    },
    {
      id: 'shelter',
      title: { czech: '🐾 Útulek Praha', english: '🐾 Animal shelter (Prague)' },
      desc: {
        czech: 'Pomoc zvířatům – podpora útulků (můžete i z domova).',
        english: 'Help animals — support shelters (can be done from home).'
      },
      url: 'https://www.utulekpraha.cz/pomoc',
      meta: { czech: '⏱️ 2–5 min • 💰 dobrovolné', english: '⏱️ 2–5 min • 💰 optional' }
    }
  ];

  const UI = {
    czech: {
      title: '⚡ Online teď',
      subtitle: 'Bez cestování. Bez velkých rozhodnutí. Jen jeden krok.',
      back: '← Zpět'
    },
    english: {
      title: '⚡ Online now',
      subtitle: 'No travel. No big decisions. Just one step.',
      back: '← Back'
    }
  };
</script>

<div class="page">
  <div class="header">
    <a class="back" href="/app">{UI[language].back}</a>
    <div class="title">{UI[language].title}</div>
    <div class="subtitle">{UI[language].subtitle}</div>
  </div>

  <div class="grid">
    {#each ORGS as o}
      <div class="card">
        <div class="card-title">{o.title[language]}</div>
        <div class="card-desc">{o.desc[language]}</div>
        <div class="meta">{o.meta[language]}</div>
        <a
          class="cta"
          href={o.url}
          target="_blank"
          rel="noopener"
          on:click={() => trackEvent('aa_clickout', { surface: 'online', id: o.id })}
        >
          {language === 'czech' ? 'Otevřít →' : 'Open →'}
        </a>
      </div>
    {/each}
  </div>
</div>

<style>
  .page { max-width: 1120px; margin: 0 auto; padding: 1rem 1rem 2rem 1rem; }
  .header { text-align: center; margin-bottom: 1rem; }
  .back { display:inline-block; margin-bottom:0.5rem; color: var(--text-secondary); text-decoration:none; }
  .back:hover { text-decoration: underline; }
  .title { font-family:'Inter',sans-serif; font-weight:900; color: var(--czech-forest); font-size: clamp(1.7rem, 3vw, 2.3rem); }
  .subtitle { color: var(--text-secondary); margin-top:0.35rem; }

  .grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.85rem; margin-top: 1.25rem; }
  .card {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(44, 62, 45, 0.12);
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
    padding: 1.05rem;
    display:flex;
    flex-direction:column;
    gap: 0.5rem;
  }
  .card-title { font-weight: 900; font-family:'Inter',sans-serif; color: var(--czech-forest); }
  .card-desc { color: var(--text-secondary); line-height: 1.55; flex: 1; }
  .meta { color: var(--text-secondary); font-size: 0.9rem; }
  .cta { color: var(--czech-forest); font-weight: 900; text-decoration:none; }
  .cta:hover { text-decoration: underline; }

  @media (max-width: 980px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
</style>


