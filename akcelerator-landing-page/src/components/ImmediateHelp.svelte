<script>
  import { onMount, tick } from "svelte";
  import { isCrisisOpen, toggleCrisisModal } from "../lib/utils.js";
  import AppIcon from "$lib/components/AppIcon.svelte";

  /** @type {HTMLDivElement | null} */
  let panelEl = $state(null);
  /** @type {HTMLButtonElement | null} */
  let closeBtnEl = $state(null);
  /** @type {HTMLElement | null} */
  let previousFocusedEl = null;
  let wasOpen = false;

  onMount(() => {
    const handleToggle = () => {
      toggleCrisisModal();
    };
    window.addEventListener("akcelerator:toggle-crisis", handleToggle);
    return () => {
      window.removeEventListener("akcelerator:toggle-crisis", handleToggle);
    };
  });

  $effect(() => {
    const open = Boolean($isCrisisOpen);
    if (open && !wasOpen) {
      const active = typeof document !== "undefined" ? document.activeElement : null;
      previousFocusedEl =
        active instanceof HTMLElement &&
        active !== document.body &&
        active !== document.documentElement
          ? active
          : null;
      tick().then(() => {
        if ($isCrisisOpen) {
          closeBtnEl?.focus();
        }
      });
    } else if (!open && wasOpen) {
      const targetToRestore = previousFocusedEl;
      previousFocusedEl = null;
      tick().then(() => {
        if (
          targetToRestore &&
          targetToRestore !== document.body &&
          targetToRestore !== document.documentElement &&
          targetToRestore.isConnected
        ) {
          targetToRestore.focus();
        } else if (typeof document !== "undefined") {
          for (const el of document.querySelectorAll(".mobile-nav-toggle, .crisis-trigger")) {
            if (!(el instanceof HTMLElement)) continue;
            const cs = getComputedStyle(el);
            if (
              cs.display !== "none" &&
              cs.visibility !== "hidden" &&
              el.getClientRects().length > 0
            ) {
              el.focus();
              break;
            }
          }
        }
      });
    }
    wasOpen = open;
  });

  const resources = [
    {
      name: "Linka bezpečí (děti a studenti do 26 let)",
      phone: "116 111",
      phoneRaw: "116111",
      url: "https://www.linkabezpeci.cz",
      available: "24/7 zdarma, anonymně (i chat)",
    },
    {
      name: "Linka první psychické pomoci (dospělí)",
      phone: "116 123",
      phoneRaw: "116123",
      url: "https://cesta-z-krize.cz",
      available: "24/7 zdarma, anonymně",
    },
    {
      name: "Opatruj.se & Nevypusť duši",
      phone: "",
      phoneRaw: "",
      url: "https://opatruj.se",
      available: "Praktická první pomoc pro duševní zdraví",
    },
    {
      name: "Centrum krizové intervence Bohnice",
      phone: "284 016 666",
      phoneRaw: "+420284016666",
      url: "https://bohnice.cz/krizova-pomoc/",
      available: "24/7 (Praha i celá ČR)",
    },
  ];

  function toggleHelp() {
    toggleCrisisModal();
  }

  /** @returns {HTMLElement[]} */
  function getFocusablePanelElements() {
    if (!panelEl) return [];
    const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    /** @type {HTMLElement[]} */
    const results = [];
    for (const el of panelEl.querySelectorAll(selector)) {
      if (el instanceof HTMLElement && el.offsetParent !== null) {
        results.push(el);
      }
    }
    return results;
  }

  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (!$isCrisisOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      toggleHelp();
      return;
    }
    if (e.key === "Tab" && panelEl) {
      const focusables = getFocusablePanelElements();
      if (focusables.length === 0) {
        e.preventDefault();
        panelEl.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (!panelEl.contains(active) || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!panelEl.contains(active) || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="crisis-widget" class:expanded={$isCrisisOpen}>
  {#if $isCrisisOpen}
    <div
      bind:this={panelEl}
      class="crisis-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Krizová podpora a linky důvěry"
      tabindex="-1"
    >
      <div class="panel-head">
        <div>
          <strong class="panel-title">
            <AppIcon name="life-buoy" size={18} strokeWidth={2} />
            <span>Potřebuješ teď oporu ty?</span>
          </strong>
          <div class="panel-sub">
            Na to, co prožíváš, nemusíš zůstat bez podpory. Tyto služby jsou tu
            pro tebe zdarma a anonymně:
          </div>
        </div>
        <button
          bind:this={closeBtnEl}
          type="button"
          class="close-btn"
          onclick={toggleHelp}
          aria-label="Skrýt krizové kontakty"
        >
          <AppIcon name="x" size={18} strokeWidth={2} />
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
                <a href={`tel:${r.phoneRaw}`} class="res-phone">
                  <AppIcon name="phone" size={15} strokeWidth={2} />
                  <span>{r.phone}</span>
                </a>
              {/if}
              {#if r.url}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="res-web"
                >
                  <span>Web / chat</span>
                  <AppIcon name="arrow-up-right" size={15} strokeWidth={2} />
                </a>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="emergency-foot">
        <div class="emergency-foot-text">
          <span class="foot-alert-icon" aria-hidden="true">
            <AppIcon name="alert-triangle" size={16} strokeWidth={2} />
          </span>
          <span>V akutním ohrožení života volej:</span>
        </div>
        <div class="emergency-links">
          <a href="tel:155" class="emergency-tel-link">
            <AppIcon name="phone" size={14} strokeWidth={2} />
            <span>155 (záchranka)</span>
          </a>
          <a href="tel:112" class="emergency-tel-link">
            <AppIcon name="phone" size={14} strokeWidth={2} />
            <span>112 (tísňová linka)</span>
          </a>
        </div>
      </div>
    </div>
  {/if}

  <button
    type="button"
    class="crisis-pill crisis-trigger"
    onclick={toggleHelp}
    aria-expanded={$isCrisisOpen}
  >
    <span class="pill-dot" aria-hidden="true"></span>
    <span class="pill-label">Potřebuješ oporu? (116 111 / 116 123)</span>
  </button>
</div>

<style>
  .crisis-widget {
    position: static;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.55rem;
    margin-top: 0.85rem;
  }

  .crisis-widget.expanded {
    z-index: 1020;
  }

  .crisis-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.48rem;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(143, 75, 14, 0.32);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease;
  }

  .pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #8f4b0e;
    flex-shrink: 0;
  }

  .crisis-pill:hover {
    background: var(--accent-warm-tint, #fef6e8);
    border-color: #8f4b0e;
  }

  .crisis-panel {
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 1020;
    width: min(390px, calc(100vw - 28px));
    max-height: calc(100dvh - 36px);
    overflow-y: auto;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    border-radius: 18px;
    padding: 1rem;
    box-sizing: border-box;
    box-shadow: var(--shadow-xl, 0 20px 44px -12px rgba(18, 42, 30, 0.16));
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    color: var(--ink-primary, #14281d);
    font-size: 0.95rem;
  }

  .panel-title {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--ink-primary, #14281d);
  }

  .panel-sub {
    color: var(--ink-secondary, #3f574a);
    font-size: 0.84rem;
    margin-top: 0.25rem;
    line-height: 1.45;
  }

  .close-btn {
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-secondary, #3f574a);
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.15s ease;
  }

  .close-btn:hover {
    background: var(--border-subtle, #dce3dd);
    color: var(--ink-primary, #14281d);
  }

  .resource-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .resource-item {
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
  }

  .res-top {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    margin-bottom: 0.4rem;
  }

  .res-name {
    font-weight: 800;
    color: var(--ink-primary, #14281d);
    font-size: 0.88rem;
  }

  .res-avail {
    font-size: 0.78rem;
    color: var(--ink-secondary, #3f574a);
  }

  .res-links {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .res-phone,
  .res-web {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    text-decoration: none;
    box-sizing: border-box;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  .res-phone {
    font-weight: 800;
    font-size: 0.86rem;
    color: var(--accent-primary, #1b5e42);
  }

  .res-phone:hover {
    border-color: var(--accent-primary, #1b5e42);
    text-decoration: underline;
  }

  .res-web {
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--ink-primary, #14281d);
  }

  .res-web:hover {
    border-color: var(--border-strong, #c2cec5);
    text-decoration: underline;
  }

  .emergency-foot {
    margin-top: 0.7rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
    font-size: 0.8rem;
    color: var(--ink-secondary, #3f574a);
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    line-height: 1.4;
  }

  .emergency-foot-text {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 600;
  }

  .emergency-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .emergency-tel-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(143, 75, 14, 0.3);
    color: #8f4b0e;
    font-weight: 800;
    font-size: 0.82rem;
    text-decoration: none;
    box-sizing: border-box;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .emergency-tel-link:hover {
    background: #fde68a;
    border-color: #8f4b0e;
    text-decoration: underline;
  }

  .foot-alert-icon {
    display: inline-flex;
    align-items: center;
    color: #8f4b0e;
    margin-top: 1px;
    flex-shrink: 0;
  }

  @media (max-width: 680px) {
    .crisis-pill,
    .crisis-trigger {
      display: none !important;
    }

    .crisis-widget {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: max(12px, env(safe-area-inset-bottom, 0px));
      margin-top: 0;
      align-items: flex-start;
      z-index: 942;
      pointer-events: none;
    }

    .crisis-widget.expanded {
      pointer-events: auto;
    }

    .crisis-panel {
      position: fixed;
      bottom: max(12px, env(safe-area-inset-bottom, 0px));
      left: 12px;
      right: 12px;
      width: auto;
      max-width: calc(100vw - 24px);
      z-index: 980;
      max-height: calc(100dvh - 84px);
      overflow-y: auto;
    }
  }
</style>
