<script>
  import { onMount } from "svelte";
  import {
    trackEvent,
    trackFunnel,
    startedActionIds,
    markActionStarted,
    openBrokenLinkReport,
  } from "../../../lib/analytics.js";
  import {
    MICRO_ACTIONS,
    EVIDENCE_TIERS,
    EVIDENCE_METHODOLOGY,
  } from "../../../lib/data/czech-actions.js";
  import { recordSmallWin, completedSteps } from "../../../lib/progress.js";
  import {
    isSoundMuted,
    toggleSoundMuted,
  } from "../../../lib/audio/audioContext.js";
  import { playPayoffAsmr } from "../../../lib/audio/presets.js";
  import {
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    getPendingPartnerReturnRemainingMs,
  } from "../../../lib/features/actions/services/partnerReturnService.js";
  import { getActionEffectMeta } from "../../../lib/sensory/catalog/catalogResolver.js";
  import { impactCanvas } from "../../../lib/sensory/canvas/impactCanvasAction.js";
  import { cleanTitle } from "../../../lib/utils.js";
  import {
    safeGetItem,
    AA_USER_TOPICS_KEY,
    AA_GUIDED_VALUES_KEY,
  } from "../../../lib/storage/index.js";
  import ActionCard from "$lib/features/actions/components/ActionCard.svelte";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";

  /** @typedef {import('$lib/types').MicroAction} MicroAction */

  let activeFilter = $state("all");
  let searchQuery = $state("");
  /** @type {string[]} */
  let savedValues = $state([]);
  let copiedId = $state("");
  let spotlightId = $state("");
  let visibleLimit = $state(3);
  let soundMuted = $state(false);
  let returnPromptAction = $state(/** @type {MicroAction | null} */ (null));
  let returnMetric = $state(0);
  /** @type {MicroAction | null} */
  let awaitingReturnAction = null;
  let leaveTimestamp = 0;

  /** @type {Array<{ id: string, label: string, icon: string }>} */
  const FILTERS = [
    { id: "all", label: "Doporučené", icon: "sparkles" },
    { id: "free", label: "Zdarma", icon: "heart" },
    { id: "fast", label: "Do 5 min", icon: "clock" },
    { id: "writing", label: "Z gauče", icon: "armchair" },
    { id: "outdoor", label: "Venku", icon: "trees" },
    { id: "tutoring", label: "U počítače", icon: "laptop" },
    { id: "donation", label: "Drobný dar", icon: "gift" },
    { id: "evidenceA", label: "Přímý měřitelný účinek", icon: "shield-check" },
  ];

  onMount(() => {
    /** @type {ReturnType<typeof setTimeout> | null} */
    let onlineReturnTimer = null;
    soundMuted = isSoundMuted();
    try {
      const sp = new URLSearchParams(window.location.search);
      const fParam = sp.get("filter");
      if (fParam && FILTERS.some((f) => f.id === fParam)) {
        activeFilter = fParam;
        visibleLimit = 6;
      }
      const actionParam =
        sp.get("action") || window.location.hash.replace(/^#(?:action=)?/, "");
      if (actionParam) {
        const matched = MICRO_ACTIONS.find(
          (a) =>
            a.id === actionParam || a.id.replace(/_/g, "-") === actionParam,
        );
        if (matched) {
          spotlightId = matched.id;
          visibleLimit = MICRO_ACTIONS.length;
        }
      }
      const s = JSON.parse(
        safeGetItem(AA_USER_TOPICS_KEY, "local") ||
          safeGetItem(AA_GUIDED_VALUES_KEY, "local") ||
          "[]",
      );
      if (Array.isArray(s)) savedValues = s;
    } catch {}

    const checkPartnerReturn = () => {
      if (returnPromptAction) return;
      if (onlineReturnTimer) {
        clearTimeout(onlineReturnTimer);
        onlineReturnTimer = null;
      }
      const elapsedMem = awaitingReturnAction ? Date.now() - leaveTimestamp : 0;
      const persisted = consumePendingPartnerReturn(3000, {
        surfacePrefix: "online",
        allowEmptySurface: true,
      });
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingReturnAction && !persisted) {
          consumePendingPartnerReturn(0, {
            surfacePrefix: "online",
            allowEmptySurface: true,
          });
        }
        const targetId = persisted?.id || awaitingReturnAction?.id;
        const matched =
          (targetId ? MICRO_ACTIONS.find((a) => a.id === targetId) : null) ||
          awaitingReturnAction;
        if (matched) {
          returnPromptAction = matched;
          returnMetric = 0;
          awaitingReturnAction = null;
          playPayoffAsmr(matched);
          trackEvent("aa_partner_return_prompt", {
            surface: "online",
            id: matched.id,
          });
        }
      } else {
        const remPersisted = getPendingPartnerReturnRemainingMs(3000, {
          surfacePrefix: "online",
          allowEmptySurface: true,
        });
        const remMem =
          awaitingReturnAction && elapsedMem > 0
            ? Math.max(0, 3000 - elapsedMem)
            : 0;
        const rem = Math.max(remPersisted, remMem);
        if (rem > 0) {
          onlineReturnTimer = setTimeout(checkPartnerReturn, rem + 30);
        }
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") checkPartnerReturn();
    };
    checkPartnerReturn();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", checkPartnerReturn);
    window.addEventListener("pageshow", checkPartnerReturn);

    return () => {
      if (onlineReturnTimer) clearTimeout(onlineReturnTimer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", checkPartnerReturn);
      window.removeEventListener("pageshow", checkPartnerReturn);
    };
  });

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent("aa_sound_toggle", { surface: "online", muted: soundMuted });
  }

  /** @param {MicroAction} action */
  function handleStartOnlineAction(action) {
    awaitingReturnAction = action;
    leaveTimestamp = Date.now();
    returnPromptAction = null;
    savePendingPartnerReturn(action, "online");
    markActionStarted(action.id, "online");
    trackEvent("aa_clickout", { surface: "online", id: action.id });
  }

  /** @param {MicroAction} action */
  async function shareAction(action) {
    const directUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/?action=${encodeURIComponent(action.id)}`
        : action.url;
    const shareText = `Tip na drobný dobrý skutek (${cleanTitle(action.title)} – ${action.org}): ${directUrl}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(directUrl);
        copiedId = action.id;
        setTimeout(() => {
          if (copiedId === action.id) copiedId = "";
        }, 2500);
      } else if (navigator.share) {
        await navigator.share({
          title: cleanTitle(action.title),
          text: shareText,
          url: directUrl,
        });
      }
      trackEvent("aa_online_share", { id: action.id });
    } catch {}
  }

  /** @param {MicroAction} action */
  function matchesSavedValues(action) {
    if (!savedValues.length) return false;
    return action.values.some((v) => savedValues.includes(v));
  }

  /** @param {string} id */
  function isCompleted(id) {
    return ($completedSteps || []).some((s) => s.id === id);
  }

  function pickRandomSpark() {
    const pool = filteredActions.length ? filteredActions : MICRO_ACTIONS;
    const chosenIdx = Math.floor(Math.random() * pool.length);
    const chosen = pool[chosenIdx];
    if (!chosen) return;
    if (chosenIdx >= visibleLimit) {
      visibleLimit = chosenIdx + 3;
    }
    spotlightId = chosen.id;
    trackEvent("aa_online_random_spark", { id: chosen.id });
    setTimeout(() => {
      const el = document.getElementById(`online-card-${chosen.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    setTimeout(() => {
      if (spotlightId === chosen.id) spotlightId = "";
    }, 3200);
  }

  const filteredActions = $derived.by(() =>
    MICRO_ACTIONS.filter((a) => {
      if (activeFilter === "free" && a.cost !== "free") return false;
      if (activeFilter === "fast" && a.timeBucket !== "5") return false;
      if (
        activeFilter === "writing" &&
        !(a.categoryTag === "writing" || a.mode === "home")
      )
        return false;
      if (activeFilter === "outdoor" && a.mode !== "local") return false;
      if (
        activeFilter === "tutoring" &&
        !(a.categoryTag === "tutoring" || a.categoryTag === "tech")
      )
        return false;
      if (activeFilter === "donation" && a.cost !== "donation") return false;
      if (activeFilter === "evidenceA" && a.impactEvidence !== "A")
        return false;

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const hay =
          `${a.title} ${a.org} ${a.desc} ${a.reassurance || ""} ${a.metaLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (activeFilter !== "outdoor") {
        const aRemote = a.mode !== "local" ? 1 : 0;
        const bRemote = b.mode !== "local" ? 1 : 0;
        if (aRemote !== bRemote) return bRemote - aRemote;
      }
      if (!searchQuery.trim()) {
        const aMatch = matchesSavedValues(a) ? 1 : 0;
        const bMatch = matchesSavedValues(b) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      return a.timeMinutes - b.timeMinutes;
    }),
  );

  const effectiveLimit = $derived(
    searchQuery.trim() ? Math.max(visibleLimit, 9) : visibleLimit,
  );
  const visibleActions = $derived(filteredActions.slice(0, effectiveLimit));
  const remainingCount = $derived(
    Math.max(0, filteredActions.length - visibleActions.length),
  );
</script>

<svelte:head>
  <title>Drobné skutky na pár minut — Akcelerátor altruismu</title>
</svelte:head>

<div class="page">
  <PageHeader
    class="online-page-header"
    kicker={`Drobné skutky na dálku i venku · ${MICRO_ACTIONS.length} ověřených projektů`}
    title="Drobné skutky, které zvládneš "
    titleAccent="během pár minut"
    subtitle="Začínáme třemi lehkými tipy — další si kdykoliv rozbalíš nebo vyhledáš podle nálady."
  >
    <div class="hero-tools-row">
      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">
          <AppIcon name="search" size={16} strokeWidth={2} />
        </span>
        <input
          type="search"
          id="online-search"
          name="q"
          autocomplete="off"
          bind:value={searchQuery}
          placeholder="Hledat (útulek, ptáci…)"
          aria-label="Hledat v drobných skutcích (např. útulek, mapování, ptáci, senioři, studánky)"
        />
      </div>
      <button type="button" class="btn-random-spark" onclick={pickRandomSpark}>
        <AppIcon name="sparkles" size={15} strokeWidth={2} />
        <span>Náhodný tip</span>
      </button>
    </div>
  </PageHeader>

  {#if returnPromptAction}
    <div
      class="return-dopamine-strip"
      role="status"
      aria-live="polite"
      data-scene={getActionEffectMeta(returnPromptAction, returnMetric).scene}
    >
      <div class="return-dopamine-head">
        <span class="return-dopamine-title">
          <AppIcon name="sparkles" size={16} strokeWidth={2} />
          <span>
            Vítej zpět z projektu {cleanTitle(returnPromptAction.title)}! Povedlo se?
          </span>
        </span>
        <span class="impact-payoff-badge">
          {getActionEffectMeta(returnPromptAction, returnMetric, {
            isReturnStrip: true,
          }).badge}
        </span>
      </div>
      <canvas
        class="impact-payoff-canvas"
        width="320"
        height="118"
        aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        use:impactCanvas={{
          action: returnPromptAction,
          climax: true,
          onProgress: (/** @type {number} */ v) => {
            returnMetric = v;
          },
        }}
      ></canvas>
      <div class="return-dopamine-actions">
        <button
          type="button"
          class="btn-return-complete"
          onclick={() => {
            const doneAction = /** @type {MicroAction} */ (returnPromptAction);
            returnPromptAction = null;
            recordSmallWin({
              id: doneAction.id,
              title: doneAction.title,
              surface: "online",
            });
          }}
        >
          <AppIcon name="check" size={15} strokeWidth={2.2} />
          <span>Hotovo – rozsvítit stopu</span>
        </button>
        <button
          type="button"
          class="btn-return-dismiss"
          onclick={() => (returnPromptAction = null)}
        >
          Později
        </button>
      </div>
    </div>
  {/if}

  <div
    class="filters-bar filter-toolbar"
    role="group"
    aria-label="Filtrovat drobné skutky"
  >
    {#each FILTERS as f}
      <button
        type="button"
        class="filter-chip"
        class:active={activeFilter === f.id}
        aria-pressed={activeFilter === f.id}
        onclick={() => {
          activeFilter = f.id;
          visibleLimit = 3;
          trackEvent("aa_online_filter", { filter: f.id });
          trackFunnel("intent_selected", { surface: "online", filter: f.id });
        }}
      >
        <AppIcon name={f.icon} size={14} strokeWidth={2} />
        <span>{f.label}</span>
      </button>
    {/each}
  </div>

  {#if filteredActions.length === 0}
    <div class="empty-box">
      <p>Pro hledání „{searchQuery}“ v tomhle filtru nic nesedí.</p>
      <button
        type="button"
        class="cta primary"
        onclick={() => {
          searchQuery = "";
          activeFilter = "all";
          visibleLimit = 3;
        }}
      >
        Zobrazit doporučený výběr
      </button>
    </div>
  {:else}
    <div class="grid">
      {#each visibleActions as o (o.id)}
        <ActionCard
          action={o}
          variant="directory"
          spotlight={spotlightId === o.id}
          isStarted={Array.isArray($startedActionIds) &&
            $startedActionIds.includes(o.id)}
          isCompleted={isCompleted(o.id)}
          {soundMuted}
          copiedDirectLink={copiedId === o.id}
          onStart={(action) => handleStartOnlineAction(action)}
          onComplete={(action) =>
            recordSmallWin({
              id: action.id,
              title: action.title,
              surface: "online",
            })}
          onShare={(action) => shareAction(action)}
          onReportBroken={(action) =>
            openBrokenLinkReport({
              id: action.id,
              title: cleanTitle(action.title),
              org: action.org,
              url: action.url,
            })}
          onToggleSound={handleToggleSound}
        />
      {/each}
    </div>

    {#if remainingCount > 0}
      <div class="calm-more-wrap">
        <button
          type="button"
          class="calm-more-btn"
          onclick={() => (visibleLimit += 6)}
        >
          <span>Ukázat dalších {Math.min(6, remainingCount)} tipů</span>
        </button>
        <span class="calm-more-hint">
          Zobrazeno {visibleActions.length} z {filteredActions.length} ověřených
          možností.
          {#if remainingCount > 6}
            <button
              type="button"
              class="link-show-all"
              onclick={() => (visibleLimit = filteredActions.length)}
            >
              Zobrazit všechny ({filteredActions.length})
            </button>
          {/if}
        </span>
      </div>
    {/if}
  {/if}

  <details class="calm-drawer online-methodology-drawer">
    <summary>
      <span class="summary-label">
        <AppIcon name="scale" size={16} strokeWidth={1.9} />
        <span>Jak poznáme, že skutek skutečně pomohl?</span>
      </span>
    </summary>
    <div class="om-body">
      <p>{EVIDENCE_METHODOLOGY.intro}</p>
      <div class="om-tiers">
        {#each Object.values(EVIDENCE_TIERS) as t}
          <div>
            <strong>{t.label}:</strong>
            {t.desc}
          </div>
        {/each}
      </div>
      <div class="om-links">
        {#each EVIDENCE_METHODOLOGY.sources as s}
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            <span>{s.label}</span>
            <AppIcon name="arrow-up-right" size={13} strokeWidth={2} />
          </a>
        {/each}
      </div>
    </div>
  </details>
</div>

<style>
  .page {
    width: 100%;
    max-width: 1140px;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 0.5rem 1.25rem 3rem;
  }

  .hero-tools-row {
    margin: 0;
    max-width: 640px;
    display: flex;
    gap: 0.55rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .search-wrap {
    position: relative;
    flex: 1;
    min-width: 240px;
  }

  .search-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    color: var(--ink-secondary, #3f574a);
    pointer-events: none;
  }

  .search-wrap input {
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0.62rem 1rem 0.62rem 2.35rem;
    border-radius: 999px;
    border: 1px solid var(--border-forest, #c5d9cd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-size: 1rem;
  }

  .search-wrap input::placeholder {
    color: var(--ink-secondary, #3f574a);
  }

  .btn-random-spark {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    padding: 0.62rem 1.1rem;
    border-radius: 999px;
    border: 1px solid var(--border-forest, #c5d9cd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.86rem;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease;
  }

  .btn-random-spark:hover {
    background: var(--bohemian-sage, #eef5f0);
    border-color: var(--border-forest-strong, #a7c4b3);
  }

  .return-dopamine-title {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
  }

  .btn-return-complete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }

  .filters-bar {
    display: flex;
    gap: 0.45rem;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0.25rem 0 0.85rem;
  }

  .filter-chip {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.36rem;
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: 1px solid var(--border-forest, #c5d9cd);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .filter-chip:hover {
    border-color: var(--border-forest-strong, #a7c4b3);
    background: var(--bohemian-sage, #eef5f0);
  }

  .filter-chip.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  .empty-box {
    text-align: center;
    padding: 2.2rem 1.5rem;
    background: var(--bg-surface, #ffffff);
    border-radius: 18px;
    border: 1px solid var(--border-subtle, #dce3dd);
    box-shadow: var(--shadow-sm);
  }

  .empty-box p {
    margin: 0 0 1rem;
    color: var(--ink-secondary, #3f574a);
    font-weight: 600;
  }

  .empty-box .cta.primary {
    padding: 0.72rem 1.35rem;
    border-radius: 999px;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .empty-box .cta.primary:hover {
    background: var(--accent-primary-hover, #144732);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
  }

  .online-methodology-drawer {
    margin-top: 1.25rem;
  }

  .summary-label {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
    flex: 1;
    text-align: left;
  }

  .om-body {
    margin-top: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    font-size: 0.85rem;
    color: var(--ink-secondary, #3f574a);
    line-height: 1.55;
  }

  .om-body p {
    margin: 0;
  }

  .om-tiers {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .om-links {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .om-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.65rem;
    box-sizing: border-box;
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    text-decoration: none;
    border-radius: 10px;
  }

  .om-links a:hover {
    text-decoration: underline;
    background: var(--bg-subtle, #edf2ee);
  }

  .calm-more-hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .link-show-all {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--accent-primary, #1b5e42);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
    text-decoration: underline;
    padding: 0.35rem 0.65rem;
  }

  :global(.grid .card .cta),
  :global(.grid .card .btn-studio-done),
  :global(.grid .card .btn-studio-primary),
  .cta {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  @media (max-width: 980px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.15rem;
    }
  }

  @media (max-width: 680px) {
    .page {
      padding: 0.25rem 0.75rem 2rem;
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    :global(.online-page-header.page-header) {
      padding: 0.25rem 0 0.35rem;
      margin-bottom: 0.38rem;
    }

    :global(.online-page-header .page-header-subtitle) {
      display: none;
    }

    :global(.online-page-header .page-header-tools) {
      margin-top: 0.4rem;
    }

    .hero-tools-row {
      margin-top: 0;
      gap: 0.38rem;
      flex-wrap: wrap;
    }

    .search-wrap {
      flex: 1 1 200px;
      min-width: 0;
    }

    .search-icon {
      left: 0.72rem;
    }

    .search-wrap input {
      min-height: 44px;
      padding: 0.45rem 0.75rem 0.45rem 2.25rem;
      font-size: 1rem;
      border-radius: 12px;
      box-sizing: border-box;
    }

    .btn-random-spark {
      min-height: 44px;
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.45rem 0.78rem;
      font-size: 0.8rem;
      border-radius: 12px;
      white-space: nowrap;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .filters-bar,
    .filter-toolbar {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      justify-content: flex-start;
      gap: 0.38rem;
      margin: 0.35rem 0 0.6rem;
      padding: 0.15rem 1.25rem 0.35rem 0.15rem;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
      scroll-padding: 0 0.5rem;
      mask-image: linear-gradient(
        to right,
        black 0%,
        black calc(100% - 32px),
        transparent 100%
      );
      -webkit-mask-image: linear-gradient(
        to right,
        black 0%,
        black calc(100% - 32px),
        transparent 100%
      );
    }

    .filters-bar::-webkit-scrollbar,
    .filter-toolbar::-webkit-scrollbar {
      display: none;
    }

    .filter-chip {
      flex: 0 0 auto;
      white-space: nowrap;
      padding: 0.44rem 0.85rem;
      font-size: 0.8rem;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      scroll-snap-align: start;
      box-sizing: border-box;
    }

    .grid {
      grid-template-columns: 1fr;
      gap: 0.85rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .online-methodology-drawer {
      max-width: 100%;
      box-sizing: border-box;
    }

    :global(.grid .card .cta),
    :global(.grid .card .btn-studio-done),
    :global(.grid .card .btn-studio-primary),
    .cta {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
  }
</style>
