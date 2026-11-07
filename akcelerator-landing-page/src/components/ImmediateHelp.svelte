<script>
  let isExpanded = false;

  const resources = [
    {
      name: 'Linka bezpečí (děti a studenti do 26 let)',
      phone: '116 111',
      phoneRaw: '116111',
      url: 'https://www.linkabezpeci.cz',
      available: '24/7 zdarma, anonymně (i chat)'
    },
    {
      name: 'Linka první psychické pomoci (dospělí)',
      phone: '116 123',
      phoneRaw: '116123',
      url: 'https://cesta-z-krize.cz',
      available: '24/7 zdarma, anonymně'
    },
    {
      name: 'Opatruj.se & Nevypusť duši',
      phone: '',
      phoneRaw: '',
      url: 'https://opatruj.se',
      available: 'Praktická první pomoc pro duševní zdraví'
    },
    {
      name: 'Centrum krizové intervence Bohnice',
      phone: '284 016 666',
      phoneRaw: '+420284016666',
      url: 'https://bohnice.cz/krizova-pomoc/',
      available: '24/7 (Praha i celá ČR)'
    }
  ];

  function toggleHelp() {
    isExpanded = !isExpanded;
  }
</script>

<div class="crisis-widget" class:expanded={isExpanded}>
  {#if isExpanded}
    <div class="crisis-panel" role="dialog" aria-label="Krizová podpora a linky důvěry">
      <div class="panel-head">
        <div>
          <strong>🆘 Potřebuješ teď sám/sama oporu?</strong>
          <div class="panel-sub">Nemusíš na to být sám/sama. Tyto služby jsou tu pro tebe zdarma a anonymně:</div>
        </div>
        <button type="button" class="close-btn" on:click={toggleHelp} aria-label="Skrýt krizové kontakty">
          ✕
        </button>
      </div>

      <div class="resource-list">
        {#each resources as r}
          <div class="resource-item">
            <div class="res-top">
              <span class="res-name">{r.name}</span>
              <span class="res-avail">{r.available}</span>
            </div>
            <div class="res-links">
              {#if r.phone}
                <a href={`tel:${r.phoneRaw}`} class="res-phone">📞 {r.phone}</a>
              {/if}
              {#if r.url}
                <a href={r.url} target="_blank" rel="noopener noreferrer" class="res-web">Web / chat →</a>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="emergency-foot">
        ⚠️ V akutním ohrožení života volej <strong>155</strong> (záchranka) nebo <strong>112</strong>.
      </div>
    </div>
  {/if}

  <button
    type="button"
    class="crisis-pill"
    on:click={toggleHelp}
    aria-expanded={isExpanded}
  >
    <span class="pill-dot" aria-hidden="true"></span>
    <span class="pill-label">Potřebuješ oporu? (116 111 / 116 123)</span>
  </button>
</div>

<style>
  .crisis-widget {
    position: fixed;
    bottom: 14px;
    right: 14px;
    z-index: 95;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.55rem;
  }

  .crisis-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.48rem;
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(217, 119, 6, 0.28);
    background: rgba(254, 255, 253, 0.95);
    color: #143324;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    box-shadow: 0 10px 24px -8px rgba(12, 38, 26, 0.18);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    transition: all 0.18s ease;
  }

  .pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #f59e0b;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.65);
    flex-shrink: 0;
  }

  .crisis-pill:hover {
    background: #ffffff;
    border-color: #d97706;
    transform: translateY(-1px);
  }

  .crisis-panel {
    width: min(390px, calc(100vw - 28px));
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid rgba(46, 93, 49, 0.22);
    border-radius: 18px;
    padding: 1rem;
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    color: var(--czech-forest);
    font-size: 0.95rem;
  }

  .panel-sub {
    color: var(--text-secondary);
    font-size: 0.84rem;
    margin-top: 0.2rem;
    line-height: 1.4;
  }

  .close-btn {
    border: none;
    background: rgba(242, 247, 242, 0.8);
    color: var(--text-secondary);
    width: 28px;
    height: 28px;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 800;
    flex-shrink: 0;
  }

  .resource-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .resource-item {
    padding: 0.6rem 0.75rem;
    border-radius: 12px;
    background: rgba(242, 247, 242, 0.7);
    border: 1px solid rgba(44, 62, 45, 0.1);
  }

  .res-top {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    margin-bottom: 0.35rem;
  }

  .res-name {
    font-weight: 800;
    color: var(--czech-forest);
    font-size: 0.88rem;
  }

  .res-avail {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .res-links {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .res-phone {
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--czech-forest);
    text-decoration: none;
  }
  .res-phone:hover {
    text-decoration: underline;
  }

  .res-web {
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--text-secondary);
    text-decoration: none;
  }
  .res-web:hover {
    color: var(--czech-forest);
    text-decoration: underline;
  }

  .emergency-foot {
    margin-top: 0.7rem;
    padding-top: 0.55rem;
    border-top: 1px solid rgba(44, 62, 45, 0.1);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  @media (max-width: 520px) {
    .crisis-widget {
      right: 10px;
      bottom: 12px;
    }
    .crisis-pill {
      padding: 0.46rem 0.72rem;
      max-width: calc(100vw - 68px);
    }
    .pill-label {
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>
