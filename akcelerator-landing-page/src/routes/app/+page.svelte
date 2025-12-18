<script>
  import { currentLanguage } from '../../lib/stores.js';

  let language = 'czech';
  currentLanguage.subscribe((v) => (language = v));

  const UI = {
    czech: {
      title: 'Akcelerátor altruismu',
      subtitle: 'Jeden malý krok stačí. Vyberte si cestu, která je teď nejlehčí.',
      near: { title: '🗺️ V okolí (mapa)', desc: 'Najděte místa a organizace poblíž vás – klik a hotovo.', href: '/near' },
      online: { title: '⚡ Online teď', desc: 'Rychlé kroky bez cestování: registrace, dar, napsat dopis.', href: '/app/online' },
      guided: { title: '🧭 Průvodce (1–2 min)', desc: 'Vyberete 1–2 oblasti a my doporučíme nejjednodušší další krok.', href: '/app/guided' },
      back: '← Zpět na úvod'
    },
    english: {
      title: 'Altruism Accelerator',
      subtitle: 'One small step is enough. Pick the easiest path for right now.',
      near: { title: '🗺️ Near you (map)', desc: 'Find nearby places and organizations — click and go.', href: '/near' },
      online: { title: '⚡ Online now', desc: 'Fast steps without travel: signup, donate, write a letter.', href: '/app/online' },
      guided: { title: '🧭 Guided (1–2 min)', desc: 'Pick 1–2 areas and we’ll recommend the easiest next step.', href: '/app/guided' },
      back: '← Back to home'
    }
  };
</script>

<div class="app-page">
  <div class="header">
    <a class="back" href="/">{UI[language].back}</a>
    <div class="title">{UI[language].title}</div>
    <div class="subtitle">{UI[language].subtitle}</div>
  </div>

  <div class="grid">
    <a class="card" href={UI[language].near.href}>
      <div class="card-title">{UI[language].near.title}</div>
      <div class="card-desc">{UI[language].near.desc}</div>
      <div class="card-cta">{language === 'czech' ? 'Otevřít →' : 'Open →'}</div>
    </a>

    <a class="card" href={UI[language].online.href}>
      <div class="card-title">{UI[language].online.title}</div>
      <div class="card-desc">{UI[language].online.desc}</div>
      <div class="card-cta">{language === 'czech' ? 'Otevřít →' : 'Open →'}</div>
    </a>

    <a class="card" href={UI[language].guided.href}>
      <div class="card-title">{UI[language].guided.title}</div>
      <div class="card-desc">{UI[language].guided.desc}</div>
      <div class="card-cta">{language === 'czech' ? 'Začít →' : 'Start →'}</div>
    </a>
  </div>
</div>

<style>
  .app-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1rem 1rem 2rem 1rem;
  }

  .header {
    text-align: center;
    margin-bottom: 1rem;
  }
  .back {
    display: inline-block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
    text-decoration: none;
  }
  .back:hover { text-decoration: underline; }
  .title {
    font-family: 'Inter', sans-serif;
    font-weight: 900;
    color: var(--czech-forest);
    font-size: clamp(1.9rem, 3vw, 2.6rem);
    line-height: 1.1;
  }
  .subtitle {
    color: var(--text-secondary);
    margin-top: 0.35rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
    margin-top: 1.25rem;
  }

  .card {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(44, 62, 45, 0.12);
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
    padding: 1.1rem 1.1rem 1rem 1.1rem;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: transform 0.15s ease, box-shadow 0.2s ease;
  }
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 34px rgba(0,0,0,0.10);
  }
  .card-title {
    font-weight: 900;
    font-family: 'Inter', sans-serif;
    color: var(--czech-forest);
    font-size: 1.1rem;
  }
  .card-desc {
    color: var(--text-secondary);
    line-height: 1.55;
    flex: 1;
  }
  .card-cta {
    color: var(--czech-forest);
    font-weight: 800;
    margin-top: 0.2rem;
  }

  @media (max-width: 980px) {
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .grid { grid-template-columns: 1fr; }
  }
</style>


