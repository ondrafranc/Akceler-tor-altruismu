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
    VALUES,
    CZECH_CITIES,
    CURATED_FALLBACK_PLACES,
    EVIDENCE_TIERS,
    EVIDENCE_METHODOLOGY,
    MICRO_ACTIONS,
    recommendActions,
    buildFirstContactTemplate,
  } from "../../../lib/data/czech-actions.js";
  import { recordSmallWin, completedSteps } from "../../../lib/progress.js";
  import {
    isSoundMuted,
    toggleSoundMuted
  } from "../../../lib/audio/audioContext.js";
  import { playPayoffAsmr } from "../../../lib/audio/presets.js";
  import {
    savePendingPartnerReturn,
    consumePendingPartnerReturn,
    getPendingPartnerReturnRemainingMs
  } from "../../../lib/features/actions/services/partnerReturnService.js";
  import { getActionEffectMeta } from "../../../lib/sensory/catalog/catalogResolver.js";
  import { impactCanvas } from "../../../lib/sensory/canvas/impactCanvasAction.js";
  import { holdSpark } from "../../../lib/sensory/interaction/holdSpark.js";
  import { haversineKm } from "../../../lib/validation.js";
  import {
    cleanTitle,
    cleanMeta
  } from "../../../lib/utils.js";
  import {
    safeGetItem,
    safeSetItem,
    AA_USER_TOPICS_KEY,
    AA_GUIDED_VALUES_KEY,
    AA_PREFS_NEAR_KEY
  } from "../../../lib/storage/index.js";
  import ActionCard from "$lib/features/actions/components/ActionCard.svelte";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";

  /** @typedef {import('$lib/types').MicroAction} MicroAction */
  /** @typedef {(typeof CURATED_FALLBACK_PLACES)[number]} CuratedPlace */
  /**
   * @typedef {object} GuidedTarget
   * @property {string} id
   * @property {string} [title]
   * @property {string} [name]
   * @property {string} [category]
   * @property {string} [kind]
   * @property {string} [subcategory]
   * @property {string[]} [values]
   */

  const SITUATIONS = [
    {
      id: "couch",
      icon: "armchair",
      title: "2 minuty z domova",
      sub: "Rychlý skutek z mobilu",
      timeBucket: "5",
      mode: "online",
      social: "solo",
      cost: "free",
    },
    {
      id: "focus",
      icon: "laptop",
      title: "15 minut u počítače",
      sub: "Mapování nebo věda z domova",
      timeBucket: "15",
      mode: "online",
      social: "solo",
      cost: "free",
    },
    {
      id: "walk",
      icon: "leaf",
      title: "Při procházce venku",
      sub: "Užitečná věc cestou v okolí",
      timeBucket: "15",
      mode: "local",
      social: "solo",
      cost: "free",
    },
    {
      id: "people",
      icon: "handshake",
      title: "Mezi lidmi v partě",
      sub: "Společná akce ve městě či přírodě",
      timeBucket: "45",
      mode: "local",
      social: "group",
      cost: "free",
    },
    {
      id: "donate",
      icon: "heart",
      title: "Poslat drobný dar",
      sub: "Od 50 Kč přímo na pomoc",
      timeBucket: "5",
      mode: "online",
      social: "solo",
      cost: "donation",
    },
  ];

  let activeSituationId = $state("couch");
  /** @type {string[]} */
  let selectedTopics = $state([]);
  let cityId = $state("praha");
  let rotationSeed = $state(0);
  let lastShownActionId = "";
  let excludePrevId = $state("");
  let openTemplateId = $state(/** @type {string | null} */ (null));
  let copiedTemplateId = $state(/** @type {string | null} */ (null));
  let planFlash = $state(false);
  let localDrawerOpen = $state(false);
  let soundMuted = $state(false);
  let guidedReturnAction = $state(/** @type {GuidedTarget | null} */ (null));
  let guidedReturnMetric = $state(0);
  /** @type {GuidedTarget | null} */
  let awaitingGuidedAction = null;
  let guidedLeaveTimestamp = 0;
  let copiedDirectLink = $state(false);

  // Adaptivní parametry průvodce (sekce 4.2 + 5.2)
  /** @type {'any' | 'one_off' | 'long_term'} */
  let commitment = $state("any");
  /** @type {'any' | 'anonymous' | 'contact_ok'} */
  let contactLevel = $state("any");
  /** @type {'any' | 'people' | 'animals' | 'nature'} */
  let recipientMacro = $state("any");
  /** @type {'any' | 'solo' | 'group'} */
  let socialOverride = $state("any");
  /** @type {'any' | 'online' | 'local'} */
  let modeOverride = $state("any");
  /** @type {'any' | 'free' | 'donation'} */
  let costOverride = $state("any");
  /** @type {'any' | 'A' | 'B' | 'C'} */
  let evidenceTier = $state("any");

  /** @param {string | undefined} tier */
  function evidenceTierLabel(tier) {
    if (tier === "A") return "Přímý měřitelný účinek";
    if (tier === "C") return "Komunitní smysl";
    return "Doložený přínos";
  }

  const activeSituation = $derived(
    SITUATIONS.find((s) => s.id === activeSituationId) || SITUATIONS[0],
  );
  $effect(() => {
    localDrawerOpen =
      activeSituationId === "walk" || activeSituationId === "people";
  });
  const completedIds = $derived(($completedSteps || []).map((s) => s.id));

  const effectiveCost = $derived(
    costOverride !== "any" ? costOverride : activeSituation.cost,
  );
  const effectiveMode = $derived(
    modeOverride !== "any" ? modeOverride : activeSituation.mode,
  );
  const effectiveSocial = $derived(
    socialOverride !== "any" ? socialOverride : activeSituation.social,
  );

  const recommendations = $derived(
    recommendActions({
      values: selectedTopics,
      timeBucket: activeSituation.timeBucket,
      cost: effectiveCost,
      mode: effectiveMode,
      social: effectiveSocial,
      commitment,
      contactLevel,
      recipientMacro,
      evidenceTier,
      completedIds,
      excludeIds: excludePrevId ? [excludePrevId] : [],
      seed: `${activeSituationId}:${selectedTopics.join(",")}:${commitment}:${contactLevel}:${recipientMacro}:${evidenceTier}:${rotationSeed}`,
    }),
  );

  const bestAction = $derived(recommendations[0] || null);
  $effect(() => {
    if (bestAction?.id) {
      lastShownActionId = bestAction.id;
    }
  });
  const isBestStarted = $derived(
    Boolean(
      bestAction?.id &&
        Array.isArray($startedActionIds) &&
        $startedActionIds.includes(bestAction.id),
    ),
  );

  const sideAlternatives = $derived(recommendations.slice(1, 4));
  const activeCity = $derived(
    CZECH_CITIES.find((c) => c.id === cityId) || CZECH_CITIES[0],
  );

  const targetMapKinds = $derived.by(() => {
    const s = new Set();
    for (const vKey of selectedTopics) {
      const found = VALUES.find((v) => v.key === vKey);
      if (found?.mapKinds) {
        for (const mk of found.mapKinds) s.add(mk);
      }
    }
    return s.size ? Array.from(s) : ["animals", "food", "community", "ngo"];
  });

  const localMatches = $derived.by(() => {
    const withDist = CURATED_FALLBACK_PLACES.map((p) => ({
      ...p,
      distKm:
        Math.round(
          haversineKm(activeCity.lat, activeCity.lon, p.lat, p.lon) * 10,
        ) / 10,
      kindMatch: targetMapKinds.includes(p.kind) ? 1 : 0,
    }));

    const nearby = withDist.filter((p) => p.distKm <= 32);
    const pool = nearby.length >= 2 ? nearby : withDist;

    return pool
      .sort((a, b) => {
        if (b.kindMatch !== a.kindMatch) return b.kindMatch - a.kindMatch;
        return a.distKm - b.distKm;
      })
      .slice(0, 3);
  });

  const nearUrl = $derived(
    `/near?lat=${activeCity.lat}&lon=${activeCity.lon}&r=10&kinds=${encodeURIComponent(targetMapKinds.join(","))}`,
  );

  /** @param {string} id */
  function selectSituation(id) {
    if (activeSituationId === id) {
      cycleRecommendation();
      return;
    }
    excludePrevId = lastShownActionId;
    activeSituationId = id;
    rotationSeed = 0;
    triggerPlanPulse();
    persistPrefs();
    trackEvent("aa_guided_situation", { situation: id });
    trackFunnel("intent_selected", { surface: "guided", situation: id });
    trackFunnel("recommendation_shown", { surface: "guided", situation: id });
  }

  /** @param {string} key */
  function toggleTopic(key) {
    excludePrevId = lastShownActionId;
    if (key === "all") {
      selectedTopics = [];
    } else if (selectedTopics.includes(key)) {
      selectedTopics = selectedTopics.filter((x) => x !== key);
    } else {
      selectedTopics = [...selectedTopics, key].slice(-2);
    }
    rotationSeed = 0;
    triggerPlanPulse();
    persistPrefs();
    trackEvent("aa_guided_topic_toggle", { topics: selectedTopics.join(",") });
    trackFunnel("intent_selected", {
      surface: "guided_topic",
      topics: selectedTopics.join(","),
    });
  }

  /**
   * @param {() => void} updateFn
   * @param {string} [filterName]
   */
  function applyAdaptiveFilter(updateFn, filterName = "param") {
    excludePrevId = "";
    rotationSeed = 0;
    updateFn();
    triggerPlanPulse();
    trackFunnel("intent_selected", { surface: "guided_adaptive", filterName });
    trackFunnel("recommendation_shown", {
      surface: "guided_adaptive",
      filterName,
    });
  }

  function cycleRecommendation() {
    excludePrevId = lastShownActionId;
    rotationSeed += 1;
    triggerPlanPulse();
    trackEvent("aa_guided_cycle_tip", {
      seed: rotationSeed,
      situation: activeSituationId,
    });
    trackFunnel("recommendation_shown", {
      surface: "guided",
      situation: activeSituationId,
      seed: rotationSeed,
    });
  }

  /** @param {MicroAction} altAction */
  function promoteAlternative(altAction) {
    excludePrevId = "";
    const idx = recommendations.findIndex((r) => r.id === altAction.id);
    if (idx > 0) {
      rotationSeed += idx;
    } else {
      rotationSeed += 1;
    }
    triggerPlanPulse();
    const el = document.getElementById("personal-plan");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function triggerPlanPulse() {
    planFlash = true;
    setTimeout(() => {
      planFlash = false;
    }, 500);
  }

  function persistPrefs() {
    try {
      safeSetItem(AA_USER_TOPICS_KEY, JSON.stringify(selectedTopics), "local");
      safeSetItem(
        AA_GUIDED_VALUES_KEY,
        JSON.stringify(selectedTopics),
        "local",
      );
      safeSetItem(
        AA_PREFS_NEAR_KEY,
        JSON.stringify({ situation: activeSituationId, cityId }),
        "local",
      );
    } catch {}
  }

  /** @param {CuratedPlace} place */
  async function copyTemplate(place) {
    try {
      const tpl = buildFirstContactTemplate(place);
      await navigator.clipboard.writeText(tpl.body);
      copiedTemplateId = place.id;
      setTimeout(() => {
        if (copiedTemplateId === place.id) copiedTemplateId = null;
      }, 2500);
    } catch {}
  }

  /** @param {string} id */
  function isDone(id) {
    return ($completedSteps || []).some((s) => s.id === id);
  }

  onMount(() => {
    /** @type {ReturnType<typeof setTimeout> | null} */
    let guidedReturnTimer = null;
    soundMuted = isSoundMuted();
    try {
      const sp = new URLSearchParams(window.location.search);
      const topicParam = sp.get("topic");
      if (topicParam && VALUES.some((v) => v.key === topicParam)) {
        selectedTopics = [topicParam];
        safeSetItem(AA_USER_TOPICS_KEY, JSON.stringify(selectedTopics), "local");
      } else {
        const s = JSON.parse(
          safeGetItem(AA_USER_TOPICS_KEY, "local") ||
            safeGetItem(AA_GUIDED_VALUES_KEY, "local") ||
            "[]",
        );
        if (Array.isArray(s) && s.length) {
          selectedTopics = s
            .filter((k) => VALUES.some((v) => v.key === k))
            .slice(0, 2);
        }
      }
      const nearSaved = JSON.parse(
        safeGetItem(AA_PREFS_NEAR_KEY, "local") || "{}",
      );
      if (
        nearSaved?.cityId &&
        CZECH_CITIES.some((c) => c.id === nearSaved.cityId)
      ) {
        cityId = nearSaved.cityId;
      }
    } catch {}

    const checkGuidedReturn = () => {
      if (guidedReturnAction) return;
      if (guidedReturnTimer) {
        clearTimeout(guidedReturnTimer);
        guidedReturnTimer = null;
      }
      const elapsedMem = awaitingGuidedAction
        ? Date.now() - guidedLeaveTimestamp
        : 0;
      const persisted = consumePendingPartnerReturn(3000, {
        surfacePrefix: "guided",
        allowEmptySurface: true,
      });
      if (elapsedMem >= 3000 || persisted) {
        if (awaitingGuidedAction && !persisted) {
          consumePendingPartnerReturn(0, {
            surfacePrefix: "guided",
            allowEmptySurface: true,
          });
        }
        const targetId = persisted?.id || awaitingGuidedAction?.id;
        const matched =
          (targetId ? MICRO_ACTIONS.find((a) => a.id === targetId) : null) ||
          (targetId
            ? CURATED_FALLBACK_PLACES.find((p) => p.id === targetId)
            : null) ||
          awaitingGuidedAction ||
          (persisted?.id && persisted?.title
            ? {
                id: persisted.id,
                title: persisted.title,
                category: persisted.category,
                values: persisted.values,
              }
            : null);
        if (matched) {
          guidedReturnAction = matched;
          guidedReturnMetric = 0;
          awaitingGuidedAction = null;
          playPayoffAsmr(matched);
          trackEvent("aa_partner_return_prompt", {
            surface: "guided",
            id: matched.id,
          });
        }
      } else {
        const remPersisted = getPendingPartnerReturnRemainingMs(3000, {
          surfacePrefix: "guided",
          allowEmptySurface: true,
        });
        const remMem =
          awaitingGuidedAction && elapsedMem > 0
            ? Math.max(0, 3000 - elapsedMem)
            : 0;
        const rem = Math.max(remPersisted, remMem);
        if (rem > 0) {
          guidedReturnTimer = setTimeout(checkGuidedReturn, rem + 30);
        }
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") checkGuidedReturn();
    };
    checkGuidedReturn();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", checkGuidedReturn);
    window.addEventListener("pageshow", checkGuidedReturn);

    return () => {
      if (guidedReturnTimer) clearTimeout(guidedReturnTimer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", checkGuidedReturn);
      window.removeEventListener("pageshow", checkGuidedReturn);
    };
  });

  function handleToggleSound() {
    soundMuted = toggleSoundMuted();
    trackEvent("aa_sound_toggle", { surface: "guided", muted: soundMuted });
  }

  /**
   * @param {GuidedTarget | null | undefined} action
   * @param {string} [surfaceLabel]
   */
  function handleStartGuidedAction(action, surfaceLabel = "guided_best") {
    if (!action) return;
    awaitingGuidedAction = action;
    guidedLeaveTimestamp = Date.now();
    guidedReturnAction = null;
    savePendingPartnerReturn(action, surfaceLabel);
    markActionStarted(action.id, surfaceLabel);
    trackEvent("aa_clickout", {
      surface: surfaceLabel,
      id: action.id,
    });
  }

  /** @param {MicroAction | null | undefined} action */
  async function shareGuidedDirectLink(action) {
    if (!action || typeof window === "undefined") return;
    const directUrl = `${window.location.origin}/?action=${encodeURIComponent(action.id)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(directUrl);
        copiedDirectLink = true;
        setTimeout(() => (copiedDirectLink = false), 2500);
      } else if (navigator.share) {
        await navigator.share({
          title: cleanTitle(action.title),
          url: directUrl,
        });
      }
      trackEvent("aa_share_direct_action", { surface: "guided", id: action.id });
    } catch {}
  }
</script>

<svelte:head>
  <title>Průvodce dobrými skutky — Akcelerátor altruismu</title>
</svelte:head>

<div class="page">
  <PageHeader
    kicker="Průvodce na míru"
    title="Jak chceš dneska "
    titleAccent="pomoct"
    titleSuffix="?"
    subtitle="Zvol si, kolik máš zrovna času a jaké téma ti je blízké — hned uvidíš jeden konkrétní, ověřený skutek."
  />

  <div class="guided-workspace">
    <!-- PERSONAL RECOMMENDATION FIRST IN DOM (WCAG 2.4.3, RIGHT COLUMN ON DESKTOP, TOP ON MOBILE) -->
    <section
      id="personal-plan"
      class="plan-section recommendation-section"
      class:flash={planFlash}
    >
      <div class="sr-only" aria-live="polite">
        {#if bestAction}
          Doporučený skutek: {cleanTitle(bestAction.title)}
        {/if}
      </div>

      {#if guidedReturnAction && (!bestAction || guidedReturnAction.id !== bestAction.id)}
        {@const returnTitle = cleanTitle(guidedReturnAction.title || guidedReturnAction.name)}
        {@const returnMeta = getActionEffectMeta(guidedReturnAction, guidedReturnMetric, { isReturnStrip: true })}
        <div
          class="return-dopamine-strip"
          role="status"
          aria-live="polite"
          data-scene={returnMeta?.scene || "default"}
        >
          <div class="return-dopamine-head">
            <span class="return-dopamine-title">
              Vítej zpět! Povedlo se ti dokončit: {returnTitle}?
            </span>
            {#if returnMeta?.badge}
              <span class="impact-payoff-badge">{returnMeta.badge}</span>
            {/if}
          </div>
          <canvas
            class="impact-payoff-canvas"
            width="320"
            height="118"
            aria-label="Fyzikální vizualizace dopadu dobrého skutku"
            use:impactCanvas={{
              action: guidedReturnAction,
              climax: true,
              onWeightUpdate: (/** @type {number} */ v) => (guidedReturnMetric = v),
            }}
          ></canvas>
          <div class="return-dopamine-actions">
            <button
              type="button"
              class="btn-return-complete"
              onclick={() => {
                const done = guidedReturnAction;
                const doneTitle = done
                  ? cleanTitle(done.title || done.name || "")
                  : "";
                guidedReturnAction = null;
                if (done) {
                  recordSmallWin({
                    id: done.id,
                    title: doneTitle,
                    surface: "guided",
                  });
                }
              }}
            >
              Ano, mám hotovo
            </button>
            <button
              type="button"
              class="btn-return-dismiss"
              onclick={() => (guidedReturnAction = null)}
            >
              Později
            </button>
          </div>
        </div>
      {/if}

      {#if bestAction}
        <div class="card highlight-card">
          <div class="rec-top-actions">
            <button
              type="button"
              class="btn-cycle-inline"
              onclick={cycleRecommendation}
            >
              <AppIcon name="refresh-cw" size={14} strokeWidth={2} />
              <span>Jiný nápad</span>
            </button>
            <button
              type="button"
              class="btn-edit-filters-jump"
              onclick={() => {
                const el = document.querySelector(".compass-foundations");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <AppIcon name="sliders-horizontal" size={14} strokeWidth={2} />
              <span>Upravit výběr</span>
            </button>
          </div>

          <ActionCard
            action={bestAction}
            variant="instant"
            isStarted={isBestStarted}
            isCompleted={isDone(bestAction.id)}
            partnerReturnPromptVisible={Boolean(
              guidedReturnAction &&
                bestAction &&
                guidedReturnAction.id === bestAction.id,
            )}
            soundMuted={soundMuted}
            copiedDirectLink={copiedDirectLink}
            onStart={() => handleStartGuidedAction(bestAction, "guided_best")}
            onComplete={(action) => {
              const done = action || bestAction;
              if (guidedReturnAction?.id === done?.id) {
                guidedReturnAction = null;
              }
              recordSmallWin({
                id: done.id,
                title: done.title,
                surface: "guided",
              });
            }}
            onDismissReturn={() => (guidedReturnAction = null)}
            onShare={() => shareGuidedDirectLink(bestAction)}
            onReportBroken={() =>
              openBrokenLinkReport({
                id: bestAction.id,
                title: cleanTitle(bestAction.title),
                org: bestAction.org,
                url: bestAction.url,
              })}
            onToggleSound={handleToggleSound}
          />
        </div>
      {/if}

      {#if sideAlternatives.length}
        <details class="calm-drawer alts-drawer">
          <summary>
            <span class="summary-label">
              Další {sideAlternatives.length} nápady pro tohle nastavení
            </span>
          </summary>
          <div class="alts-grid">
            {#each sideAlternatives as alt (alt.id)}
              <article class="alt-card">
                <div class="alt-meta">
                  {alt.quickTagsLabel || cleanMeta(alt.metaLabel)} · {evidenceTierLabel(alt.impactEvidence)} · Ověřeno: {alt.verifiedLabel}
                </div>
                <h3>{cleanTitle(alt.title)}</h3>
                <p>{alt.desc}</p>
                <div class="alt-impact-note">
                  <strong>Co to přinese:</strong>
                  {alt.concreteImpact}
                </div>
                <div class="alt-actions">
                  <a
                    href={alt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="alt-open"
                    use:holdSpark={{ id: alt.id, surface: "guided_alt" }}
                    onclick={() => handleStartGuidedAction(alt, "guided_alt")}
                  >
                    <span>Začít pomáhat</span>
                    <AppIcon name="arrow-up-right" size={14} strokeWidth={2} />
                  </a>
                  <button
                    type="button"
                    class="alt-detail"
                    onclick={() => promoteAlternative(alt)}
                  >
                    <span>Detail</span>
                    <AppIcon name="arrow-up" size={14} strokeWidth={2} />
                  </button>
                </div>
              </article>
            {/each}
          </div>
        </details>
      {/if}

      <!-- 5.1 & 5.2 ÚČINNOST A METODIKA DOPADU -->
      <details class="calm-drawer methodology-drawer">
        <summary>
          <span class="summary-label">
            <AppIcon name="scale" size={16} strokeWidth={1.9} />
            <span>Jak poznáme, že pomoc skutečně pomohla?</span>
          </span>
        </summary>
        <div class="methodology-body">
          <p class="meth-intro">{EVIDENCE_METHODOLOGY.intro}</p>

          <div class="meth-tiers">
            {#each Object.values(EVIDENCE_TIERS) as tier}
              <div class="meth-tier-item">
                <strong>{tier.label}:</strong>
                <span>{tier.desc}</span>
              </div>
            {/each}
          </div>

          <div class="meth-table-wrap">
            <table class="meth-table">
              <thead>
                <tr>
                  <th>Aktivita</th>
                  <th>Možný přínos</th>
                  <th>Co u dopadu rozlišujeme</th>
                </tr>
              </thead>
              <tbody>
                {#each EVIDENCE_METHODOLOGY.comparisonRows as row}
                  <tr>
                    <td><strong>{row.activity}</strong></td>
                    <td>{row.benefit}</td>
                    <td>{row.distinction}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="meth-links">
            <span>Další zdroje k efektivnímu altruismu a evaluaci dopadu:</span>
            {#each EVIDENCE_METHODOLOGY.sources as src}
              <a href={src.url} target="_blank" rel="noopener noreferrer">
                <span>{src.label}</span>
                <AppIcon name="arrow-up-right" size={13} strokeWidth={2} />
              </a>
            {/each}
          </div>
        </div>
      </details>
    </section>

    <!-- UNIFIED COMPASS CARD (LEFT COLUMN ON DESKTOP, SECOND ON MOBILE) -->
    <section class="compass-shell compass-foundations" aria-label="Nastavení průvodce">
      <div class="step-block">
        <div class="block-label">1. Kolik máš zrovna času?</div>

        <div
          class="situation-grid"
          role="group"
          aria-label="Dnešní situace a kapacita"
        >
          {#each SITUATIONS as s}
            <button
              type="button"
              class="situation-card"
              class:active={activeSituationId === s.id}
              aria-pressed={activeSituationId === s.id}
              onclick={() => selectSituation(s.id)}
            >
              <span class="sit-icon" aria-hidden="true">
                <AppIcon name={s.icon} size={18} strokeWidth={1.9} />
              </span>
              <div class="sit-copy">
                <span class="sit-title">{s.title}</span>
                <span class="sit-sub">{s.sub}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <div class="divider"></div>

      <div class="step-block">
        <div class="block-label">
          2. Blízké téma <span class="opt-tag">(volitelné)</span>
        </div>

        <div class="topic-pills" role="group" aria-label="Výběr tématu pomoci">
          <button
            type="button"
            class="topic-pill"
            class:selected={selectedTopics.length === 0}
            aria-pressed={selectedTopics.length === 0}
            onclick={() => toggleTopic("all")}
          >
            <AppIcon name="sparkles" size={14} strokeWidth={1.9} />
            <span>Cokoliv</span>
          </button>
          {#each VALUES as v}
            <button
              type="button"
              class="topic-pill"
              class:selected={selectedTopics.includes(v.key)}
              aria-pressed={selectedTopics.includes(v.key)}
              onclick={() => toggleTopic(v.key)}
            >
              <AppIcon name={v.icon} size={14} strokeWidth={1.9} />
              <span>{v.shortLabel || v.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="divider"></div>

      <!-- STEP 3 & CONSOLIDATED PARAMETERS DRAWER -->
      <div class="step-block adaptive-step-block" aria-label="Upřesňující volby">
        {#if activeSituationId === "couch" || activeSituationId === "focus"}
          <div class="block-label">
            3. Chceš zůstat úplně anonymní? <span class="opt-tag"
              >(volitelné)</span
            >
          </div>
          <div class="topic-pills" role="group" aria-label="Anonymita pomoci">
            <button
              type="button"
              class="topic-pill"
              class:selected={contactLevel === "any"}
              aria-pressed={contactLevel === "any"}
              onclick={() =>
                applyAdaptiveFilter(() => (contactLevel = "any"), "contact")}
            >
              Nezáleží
            </button>
            <button
              type="button"
              class="topic-pill"
              class:selected={contactLevel === "anonymous"}
              aria-pressed={contactLevel === "anonymous"}
              onclick={() =>
                applyAdaptiveFilter(
                  () => (contactLevel = "anonymous"),
                  "contact",
                )}
            >
              <AppIcon name="lock" size={14} strokeWidth={1.9} />
              <span>Zcela anonymně</span>
            </button>
            <button
              type="button"
              class="topic-pill"
              class:selected={contactLevel === "contact_ok"}
              aria-pressed={contactLevel === "contact_ok"}
              onclick={() =>
                applyAdaptiveFilter(
                  () => (contactLevel = "contact_ok"),
                  "contact",
                )}
            >
              <AppIcon name="message-circle" size={14} strokeWidth={1.9} />
              <span>Nevadí mi kontakt</span>
            </button>
          </div>
        {:else}
          <div class="block-label">
            3. Jednorázově, nebo dlouhodobě? <span class="opt-tag"
              >(volitelné)</span
            >
          </div>
          <div class="topic-pills" role="group" aria-label="Závazek pomoci">
            <button
              type="button"
              class="topic-pill"
              class:selected={commitment === "any"}
              aria-pressed={commitment === "any"}
              onclick={() =>
                applyAdaptiveFilter(() => (commitment = "any"), "commitment")}
            >
              Nezáleží
            </button>
            <button
              type="button"
              class="topic-pill"
              class:selected={commitment === "one_off"}
              aria-pressed={commitment === "one_off"}
              onclick={() =>
                applyAdaptiveFilter(
                  () => (commitment = "one_off"),
                  "commitment",
                )}
            >
              <AppIcon name="zap" size={14} strokeWidth={1.9} />
              <span>Jednorázově</span>
            </button>
            <button
              type="button"
              class="topic-pill"
              class:selected={commitment === "long_term"}
              aria-pressed={commitment === "long_term"}
              onclick={() =>
                applyAdaptiveFilter(
                  () => (commitment = "long_term"),
                  "commitment",
                )}
            >
              <AppIcon name="sprout" size={14} strokeWidth={1.9} />
              <span>Dlouhodobě</span>
            </button>
          </div>
        {/if}

        <details class="adaptive-params-drawer">
          <summary>
            <span class="summary-label">
              <AppIcon name="sliders-horizontal" size={15} strokeWidth={2} />
              <span>Upřesnit další volby (prostředí, rozpočet, míra účinku)</span>
            </span>
            <span class="drawer-chevron-wrap" aria-hidden="true">
              <AppIcon name="chevron-down" size={16} />
            </span>
          </summary>
          <div class="adaptive-params-grid">
            {#if activeSituationId === "couch" || activeSituationId === "focus"}
              <div class="ap-group">
                <span class="ap-label">Závazek:</span>
                <div class="ap-pills">
                  <button
                    type="button"
                    class:active={commitment === "any"}
                    aria-pressed={commitment === "any"}
                    onclick={() =>
                      applyAdaptiveFilter(() => (commitment = "any"), "commitment")}
                    >Vše</button
                  >
                  <button
                    type="button"
                    class:active={commitment === "one_off"}
                    aria-pressed={commitment === "one_off"}
                    onclick={() =>
                      applyAdaptiveFilter(
                        () => (commitment = "one_off"),
                        "commitment",
                      )}>Jednorázově</button
                  >
                  <button
                    type="button"
                    class:active={commitment === "long_term"}
                    aria-pressed={commitment === "long_term"}
                    onclick={() =>
                      applyAdaptiveFilter(
                        () => (commitment = "long_term"),
                        "commitment",
                      )}>Dlouhodobě</button
                  >
                </div>
              </div>
            {:else}
              <div class="ap-group">
                <span class="ap-label">Anonymita:</span>
                <div class="ap-pills">
                  <button
                    type="button"
                    class:active={contactLevel === "any"}
                    aria-pressed={contactLevel === "any"}
                    onclick={() =>
                      applyAdaptiveFilter(() => (contactLevel = "any"), "contact")}
                    >Vše</button
                  >
                  <button
                    type="button"
                    class:active={contactLevel === "anonymous"}
                    aria-pressed={contactLevel === "anonymous"}
                    onclick={() =>
                      applyAdaptiveFilter(
                        () => (contactLevel = "anonymous"),
                        "contact",
                      )}>Anonymně</button
                  >
                  <button
                    type="button"
                    class:active={contactLevel === "contact_ok"}
                    aria-pressed={contactLevel === "contact_ok"}
                    onclick={() =>
                      applyAdaptiveFilter(
                        () => (contactLevel = "contact_ok"),
                        "contact",
                      )}
                    >Nevadí kontakt</button
                  >
                </div>
              </div>
            {/if}

            <div class="ap-group">
              <span class="ap-label">Komu pomoci:</span>
              <div class="ap-pills">
                <button
                  type="button"
                  class:active={recipientMacro === "any"}
                  aria-pressed={recipientMacro === "any"}
                  onclick={() =>
                    applyAdaptiveFilter(
                      () => (recipientMacro = "any"),
                      "recipient",
                    )}>Všem</button
                >
                <button
                  type="button"
                  class:active={recipientMacro === "people"}
                  aria-pressed={recipientMacro === "people"}
                  onclick={() =>
                    applyAdaptiveFilter(
                      () => (recipientMacro = "people"),
                      "recipient",
                    )}>Lidem</button
                >
                <button
                  type="button"
                  class:active={recipientMacro === "animals"}
                  aria-pressed={recipientMacro === "animals"}
                  onclick={() =>
                    applyAdaptiveFilter(
                      () => (recipientMacro = "animals"),
                      "recipient",
                    )}>Zvířatům</button
                >
                <button
                  type="button"
                  class:active={recipientMacro === "nature"}
                  aria-pressed={recipientMacro === "nature"}
                  onclick={() =>
                    applyAdaptiveFilter(
                      () => (recipientMacro = "nature"),
                      "recipient",
                    )}>Přírodě</button
                >
              </div>
            </div>

            <div class="ap-group">
              <span class="ap-label">Sám / s lidmi:</span>
              <div class="ap-pills">
                <button
                  type="button"
                  class:active={socialOverride === "any"}
                  aria-pressed={socialOverride === "any"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (socialOverride = "any"), "social")}
                  >Podle situace</button
                >
                <button
                  type="button"
                  class:active={socialOverride === "solo"}
                  aria-pressed={socialOverride === "solo"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (socialOverride = "solo"), "social")}
                  >Sám</button
                >
                <button
                  type="button"
                  class:active={socialOverride === "group"}
                  aria-pressed={socialOverride === "group"}
                  onclick={() =>
                    applyAdaptiveFilter(
                      () => (socialOverride = "group"),
                      "social",
                    )}
                  >S ostatními</button
                >
              </div>
            </div>

            <div class="ap-group">
              <span class="ap-label">Prostředí:</span>
              <div class="ap-pills">
                <button
                  type="button"
                  class:active={modeOverride === "any"}
                  aria-pressed={modeOverride === "any"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (modeOverride = "any"), "mode")}
                  >Podle situace</button
                >
                <button
                  type="button"
                  class:active={modeOverride === "online"}
                  aria-pressed={modeOverride === "online"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (modeOverride = "online"), "mode")}
                  >Z domova</button
                >
                <button
                  type="button"
                  class:active={modeOverride === "local"}
                  aria-pressed={modeOverride === "local"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (modeOverride = "local"), "mode")}
                  >Venku</button
                >
              </div>
            </div>

            <div class="ap-group">
              <span class="ap-label">Finanční náročnost:</span>
              <div class="ap-pills">
                <button
                  type="button"
                  class:active={costOverride === "any"}
                  aria-pressed={costOverride === "any"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (costOverride = "any"), "cost")}
                  >Podle situace</button
                >
                <button
                  type="button"
                  class:active={costOverride === "free"}
                  aria-pressed={costOverride === "free"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (costOverride = "free"), "cost")}
                  >Bez peněz (0 Kč)</button
                >
                <button
                  type="button"
                  class:active={costOverride === "donation"}
                  aria-pressed={costOverride === "donation"}
                  onclick={() =>
                    applyAdaptiveFilter(
                      () => (costOverride = "donation"),
                      "cost",
                    )}
                  >Mohu darovat</button
                >
              </div>
            </div>

            <div class="ap-group">
              <span class="ap-label">Míra doložení účinku:</span>
              <div class="ap-pills">
                <button
                  type="button"
                  class:active={evidenceTier === "any"}
                  aria-pressed={evidenceTier === "any"}
                  onclick={() =>
                    applyAdaptiveFilter(
                      () => (evidenceTier = "any"),
                      "evidence",
                    )}>Vše</button
                >
                <button
                  type="button"
                  class:active={evidenceTier === "A"}
                  aria-pressed={evidenceTier === "A"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (evidenceTier = "A"), "evidence")}
                  >Přímý měřitelný účinek</button
                >
                <button
                  type="button"
                  class:active={evidenceTier === "B"}
                  aria-pressed={evidenceTier === "B"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (evidenceTier = "B"), "evidence")}
                  >Doložený přínos</button
                >
                <button
                  type="button"
                  class:active={evidenceTier === "C"}
                  aria-pressed={evidenceTier === "C"}
                  onclick={() =>
                    applyAdaptiveFilter(() => (evidenceTier = "C"), "evidence")}
                  >Komunitní smysl</button
                >
              </div>
            </div>
          </div>
        </details>
      </div>
    </section>
  </div>

  <!-- LOCAL PLACES IN YOUR CITY — AUTO-OPENED ONLY FOR WALK / PEOPLE -->
  <details class="calm-drawer local-drawer" bind:open={localDrawerOpen}>
    <summary>
      <span class="summary-label">
        <AppIcon name="map-pin" size={16} strokeWidth={2} />
        <span>Místa pro osobní zapojení v okolí města {activeCity.name}</span>
      </span>
    </summary>

    <section class="local-section" aria-label="Místa v okolí">
      <div class="local-head">
        <h2>Kam se ozvat nebo zajít poblíž města</h2>

        <div class="city-picker-wrap">
          <label for="guided-city-select">Město:</label>
          <select
            id="guided-city-select"
            name="city"
            autocomplete="off"
            bind:value={cityId}
            onchange={persistPrefs}
            class="city-select"
          >
            {#each CZECH_CITIES as c}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
          <a href={nearUrl} class="map-jump-link">
            <span>Celá mapa</span>
            <AppIcon name="arrow-right" size={14} strokeWidth={2} />
          </a>
        </div>
      </div>

      <div class="local-grid">
        {#each localMatches as place (place.id)}
          {@const tpl = buildFirstContactTemplate(place)}
          <article class="local-card">
            <div class="lc-top">
              <span>{place.subcategory || "Místo pomoci"}</span>
              <span class="lc-dist">~{place.distKm} km ({activeCity.name})</span
              >
            </div>
            <h3>{place.name}</h3>
            <p class="lc-desc">{place.quickMission || place.description}</p>
            {#if place.address}
              <div class="lc-addr">
                <AppIcon name="map-pin" size={13} strokeWidth={2} />
                <span>{place.address}</span>
              </div>
            {/if}

            <div class="lc-actions">
              {#if place.website}
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="lc-btn primary"
                  use:holdSpark={{ id: place.id, surface: "guided_local" }}
                  onclick={() =>
                    handleStartGuidedAction(
                      {
                        id: place.id,
                        title: place.name,
                        category: place.kind,
                        subcategory: place.subcategory,
                      },
                      "guided_local",
                    )}
                >
                  <span>Web</span>
                  <AppIcon name="arrow-up-right" size={14} strokeWidth={2} />
                </a>
              {/if}
              <button
                type="button"
                class="lc-btn ghost"
                onclick={() =>
                  (openTemplateId =
                    openTemplateId === place.id ? null : place.id)}
              >
                <AppIcon name="message-circle" size={14} strokeWidth={2} />
                <span>Vzor zprávy</span>
              </button>
            </div>

            {#if openTemplateId === place.id}
              <div class="tpl-drawer">
                <pre>{tpl.body}</pre>
                <div class="tpl-btns">
                  <button type="button" onclick={() => copyTemplate(place)}>
                    {#if copiedTemplateId === place.id}
                      <AppIcon name="check" size={14} strokeWidth={2.2} />
                      <span>Zkopírováno</span>
                    {:else}
                      <AppIcon name="copy" size={14} strokeWidth={2} />
                      <span>Zkopírovat</span>
                    {/if}
                  </button>
                  {#if tpl.mailtoUrl}
                    <a href={tpl.mailtoUrl}>
                      <AppIcon name="mail" size={14} strokeWidth={2} />
                      <span>E-mail</span>
                    </a>
                  {/if}
                </div>
              </div>
            {/if}
          </article>
        {/each}
      </div>
    </section>
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

  .guided-workspace {
    display: grid;
    grid-template-columns: 0.88fr 1.12fr;
    gap: 1.5rem;
    align-items: start;
  }

  /* COMPASS SHELL */
  .compass-shell {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 20px;
    padding: 1.2rem 1.25rem;
    box-shadow: var(--shadow-sm);
  }

  .compass-shell.compass-foundations {
    grid-column: 1;
    grid-row: 1;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .block-label {
    font-size: 0.84rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
    margin-bottom: 0.5rem;
  }

  .opt-tag {
    font-weight: 600;
    color: var(--ink-secondary, #3f574a);
  }

  .situation-grid {
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
  }

  .situation-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    min-height: 44px;
    box-sizing: border-box;
    text-align: left;
    padding: 0.55rem 0.8rem;
    border-radius: 13px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-primary, #14281d);
    cursor: pointer;
    font-family: var(--font-sans);
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease;
  }

  .situation-card:hover {
    background: var(--bg-subtle, #edf2ee);
    border-color: var(--accent-primary, #1b5e42);
  }

  .situation-card.active {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  .sit-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sit-copy {
    display: flex;
    flex-direction: column;
    gap: 0.06rem;
    min-width: 0;
  }

  .sit-title {
    font-weight: 700;
    font-size: 0.88rem;
    color: inherit;
  }

  .sit-sub {
    font-size: 0.76rem;
    color: var(--ink-secondary, #3f574a);
  }

  .situation-card.active .sit-sub {
    color: rgba(255, 255, 255, 0.88);
  }

  .divider {
    height: 1px;
    background: var(--border-subtle, #dce3dd);
    margin: 0.85rem 0;
  }

  .topic-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .topic-pill {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.36rem;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.81rem;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease;
  }

  .topic-pill:hover {
    border-color: var(--accent-primary, #1b5e42);
    background: var(--bg-surface, #ffffff);
  }

  .topic-pill.selected {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .summary-label {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
    flex: 1;
    text-align: left;
  }

  .adaptive-params-drawer {
    margin-top: 0.85rem;
    font-size: 0.81rem;
  }

  .adaptive-params-drawer summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0.48rem 0.75rem;
    border-radius: 12px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .adaptive-params-drawer summary:hover {
    background: var(--bg-surface, #ffffff);
    border-color: var(--accent-primary, #1b5e42);
  }

  .adaptive-params-drawer summary::-webkit-details-marker {
    display: none;
  }

  .drawer-chevron-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--accent-primary, #1b5e42);
    transition: transform 0.2s ease;
  }

  .adaptive-params-drawer[open] .drawer-chevron-wrap {
    transform: rotate(180deg);
  }

  .adaptive-params-grid {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .ap-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .ap-label {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--ink-secondary, #3f574a);
  }

  .ap-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .ap-pills button {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.4rem 0.78rem;
    border-radius: 999px;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .ap-pills button:hover {
    border-color: var(--accent-primary, #1b5e42);
    background: var(--bg-surface, #ffffff);
  }

  .ap-pills button.active {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .rec-top-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 0.55rem;
  }

  .btn-edit-filters-jump {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.4rem 0.78rem;
    border-radius: 999px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    box-sizing: border-box;
  }

  .alt-impact-note {
    font-size: 0.79rem;
    color: var(--ink-secondary, #3f574a);
    margin: 0 0 0.65rem;
  }

  .methodology-drawer {
    margin-top: 0.5rem;
  }

  .methodology-body {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    font-size: 0.85rem;
    color: var(--ink-secondary, #3f574a);
    line-height: 1.55;
  }

  .meth-intro {
    margin: 0;
  }

  .meth-tiers {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .meth-tier-item strong {
    color: var(--ink-primary, #14281d);
  }

  .meth-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
    margin: 0.5rem 0;
    border-radius: 12px;
    border: 1px solid var(--border-subtle, #dce3dd);
  }

  .meth-table {
    width: 100%;
    min-width: 460px;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  .meth-table th,
  .meth-table td {
    text-align: left;
    padding: 0.5rem 0.65rem;
    border-bottom: 1px solid var(--border-subtle, #dce3dd);
  }

  .meth-table th {
    font-weight: 800;
    color: var(--ink-primary, #14281d);
    background: var(--bg-subtle, #edf2ee);
  }

  .meth-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.81rem;
  }

  .meth-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    padding: 0.35rem 0.65rem;
    border-radius: 10px;
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    text-decoration: none;
  }

  .meth-links a:hover {
    text-decoration: underline;
    background: var(--bg-subtle, #edf2ee);
  }

  /* CLEAN PERSONAL RECOMMENDATION CARD */
  .plan-section {
    grid-column: 2;
    grid-row: 1;
    position: sticky;
    top: 5.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .plan-section.flash .highlight-card {
    box-shadow:
      var(--shadow-md),
      0 0 0 2px rgba(27, 94, 66, 0.36);
  }

  .highlight-card {
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    border-radius: 20px;
    padding: 1.5rem 1.75rem;
    border: 1px solid var(--border-subtle, #dce3dd);
    box-shadow: var(--shadow-md);
    transition: box-shadow 0.25s ease;
  }

  .btn-cycle-inline {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.38rem;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.83rem;
    cursor: pointer;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .btn-cycle-inline:hover {
    background: var(--bg-surface, #ffffff);
    border-color: var(--accent-primary, #1b5e42);
    color: var(--accent-primary-hover, #144732);
  }

  /* ALTERNATIVES */
  .alts-drawer {
    margin-top: 0.25rem;
  }

  .alts-drawer .alts-grid {
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .alt-card {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .alt-meta {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    margin-bottom: 0.28rem;
  }

  .alt-card h3 {
    margin: 0 0 0.35rem;
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
  }

  .alt-card p {
    margin: 0 0 0.75rem;
    font-size: 0.82rem;
    color: var(--ink-secondary, #3f574a);
    line-height: 1.48;
    flex: 1;
  }

  .alt-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .alt-open {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.45rem 0.75rem;
    border-radius: 10px;
    background: var(--bg-subtle, #edf2ee);
    font-size: 0.81rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    text-decoration: none;
  }

  .alt-open:hover {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .alt-detail {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    padding: 0.45rem 0.7rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    font-family: var(--font-sans);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--ink-secondary, #3f574a);
    cursor: pointer;
  }

  .alt-detail:hover {
    color: var(--ink-primary, #14281d);
    border-color: var(--border-strong, #c2cec5);
  }

  /* LOCAL PLACES */
  .local-drawer {
    margin-top: 1.35rem;
  }

  .local-section {
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
  }

  .local-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .local-head h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
  }

  .city-picker-wrap {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .city-picker-wrap label {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--ink-secondary, #3f574a);
  }

  .city-select {
    min-height: 44px;
    box-sizing: border-box;
    padding: 0.45rem 0.8rem;
    border-radius: 10px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-surface, #ffffff);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 1rem;
    color: var(--ink-primary, #14281d);
    cursor: pointer;
  }

  .map-jump-link {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.34rem;
    padding: 0.45rem 0.78rem;
    border-radius: 10px;
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    text-decoration: none;
  }

  .map-jump-link:hover {
    background: var(--bg-subtle, #edf2ee);
    text-decoration: underline;
  }

  .local-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .local-card {
    padding: 1.15rem;
    border-radius: 18px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    display: flex;
    flex-direction: column;
  }

  .lc-top {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    margin-bottom: 0.3rem;
  }

  .lc-dist {
    color: var(--ink-secondary, #3f574a);
  }

  .local-card h3 {
    margin: 0 0 0.35rem;
    font-size: 0.98rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
  }

  .lc-desc {
    margin: 0 0 0.55rem;
    font-size: 0.83rem;
    color: var(--ink-secondary, #3f574a);
    line-height: 1.48;
    flex: 1;
  }

  .lc-addr {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    font-size: 0.78rem;
    color: var(--ink-secondary, #3f574a);
    margin-bottom: 0.7rem;
  }

  .lc-actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .lc-btn {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.36rem;
    padding: 0.5rem 0.88rem;
    border-radius: 10px;
    font-size: 0.81rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    font-family: var(--font-sans);
  }

  .lc-btn.primary {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border: 1px solid var(--accent-primary, #1b5e42);
  }

  .lc-btn.primary:hover {
    background: var(--accent-primary-hover, #144732);
  }

  .lc-btn.ghost {
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-primary, #14281d);
  }

  .lc-btn.ghost:hover {
    border-color: var(--accent-primary, #1b5e42);
  }

  .tpl-drawer {
    margin-top: 0.7rem;
    padding-top: 0.7rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
  }

  .tpl-drawer pre {
    white-space: pre-wrap;
    font-family: var(--font-sans);
    font-size: 0.78rem;
    color: var(--ink-secondary, #3f574a);
    margin: 0 0 0.55rem;
    line-height: 1.44;
  }

  .tpl-btns {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .tpl-btns button,
  .tpl-btns a {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.36rem;
    padding: 0.48rem 0.85rem;
    border-radius: 10px;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: var(--font-sans);
    font-size: 0.79rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }

  .tpl-btns button:hover,
  .tpl-btns a:hover {
    background: var(--accent-primary-hover, #144732);
  }

  @media (max-width: 980px) {
    .guided-workspace {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .plan-section {
      position: static;
      width: 100%;
      box-sizing: border-box;
    }
    .compass-shell.compass-foundations {
      width: 100%;
      box-sizing: border-box;
    }
    .btn-edit-filters-jump {
      display: inline-flex;
    }
    .alts-drawer .alts-grid,
    .local-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .page {
      padding: 0.25rem 0.75rem 2rem;
    }

    .guided-workspace {
      gap: 0.6rem;
    }

    .compass-shell,
    .plan-section {
      min-width: 0;
      max-width: 100%;
    }

    .compass-shell,
    .highlight-card {
      padding: 0.85rem 0.9rem;
      border-radius: 18px;
    }

    .block-label {
      font-size: 0.8rem;
      margin-bottom: 0.42rem;
    }

    .situation-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.38rem;
    }

    .situation-card {
      min-height: 44px;
      padding: 0.42rem 0.55rem;
      border-radius: 12px;
      gap: 0.4rem;
      box-sizing: border-box;
    }

    .situation-card:last-child {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }

    .sit-sub {
      display: none !important;
    }

    .sit-title {
      font-size: 0.77rem;
      line-height: 1.2;
    }

    .divider {
      margin: 0.55rem 0;
    }

    .compass-foundations .topic-pills,
    .adaptive-step-block .topic-pills {
      display: flex;
      flex-wrap: wrap;
      overflow-x: visible;
      gap: 0.32rem;
      padding: 0;
      mask-image: none;
      -webkit-mask-image: none;
    }

    .topic-pills {
      gap: 0.32rem;
    }

    .topic-pill {
      flex: 0 0 auto;
      white-space: nowrap;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.38rem 0.68rem;
      font-size: 0.77rem;
      box-sizing: border-box;
    }

    .city-select {
      font-size: 1rem;
      min-height: 44px;
    }
  }
</style>
