<script>
  import { onDestroy } from "svelte";
  import { getActionEffectMeta } from "../../../../lib/sensory/catalog/catalogResolver.js";
  import { impactCanvas } from "../../../../lib/sensory/canvas/impactCanvasAction.js";
  import { triggerCanvasBurst } from "../../../../lib/sensory/canvas/controllerRegistry.js";
  import {
    playPayoffAsmr,
    playCelebrationChord,
  } from "../../../../lib/audio/presets.js";
  import { safeVibrate } from "../../../../lib/core/device.js";
  import { startHoldSpark } from "../../../../lib/sensory/interaction/holdSpark.js";
  import {
    trackEvent,
    openBrokenLinkReport,
  } from "../../../../lib/analytics.js";
  import { notifyMollySpark } from "../../../../lib/mollyStore.js";
  import { cleanTitle, stripLeadingEmoji } from "../../../../lib/utils.js";
  import { VALUES } from "../../../data/values.js";
  import EvidenceBadge from "./EvidenceBadge.svelte";

  /** @type {(import('$lib/types').MicroAction & Record<string, unknown>) | null} */
  export let action = null;
  export let isStarted = false;
  export let isCompleted = false;
  export let justCompleted = false;
  export let partnerReturnPromptVisible = false;
  export let soundMuted = false;
  export let showEffectPreview = false;
  export let copiedDirectLink = false;
  /** @type {string[]} */
  export let savedValues = [];
  export let usePersonalValues = false;
  export let variant = "instant"; // 'instant' | 'directory' | 'compact'
  export let spotlight = false;
  export let className = "";

  /** @type {((action?: import('$lib/types').MicroAction) => void) | null} */
  export let onStart = null;
  /** @type {((action?: import('$lib/types').MicroAction) => void) | null} */
  export let onComplete = null;
  /** @type {((action?: import('$lib/types').MicroAction) => void) | null} */
  export let onShare = null;
  /** @type {((action?: import('$lib/types').MicroAction) => void) | null} */
  export let onReportBroken = null;
  /** @type {(() => void) | null} */
  export let onToggleSound = null;
  /** @type {(() => void) | null} */
  export let onTogglePersonalValues = null;
  /** @type {(() => void) | null} */
  export let onNextIdea = null;
  /** @type {(() => void) | null} */
  export let onDismissReturn = null;
  /** @type {(() => void) | null} */
  export let onCloseSession = null;

  let kibbleGrams = 0;
  let sparkBoosted = false;
  let cardCanvasNode = null;
  let primaryBtnNode = null;
  let stopHoldSpark = null;
  let lastHoldActionId = null;
  let lastCelebratedActionId = null;

  // Interactive anticipation diorama state (zero-reflow cached bounds)
  /** @type {DOMRect | null} */
  let previewBounds = null;
  let previewHovered = false;
  let ctaHovered = false;
  let previewNudged = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let previewNudgeTimer = null;
  let spotX = 50;
  let spotY = 34;

  function endHoldSpark(released = false) {
    if (stopHoldSpark) {
      stopHoldSpark(released);
      stopHoldSpark = null;
    } else if (primaryBtnNode) {
      primaryBtnNode.style.setProperty("--spark-charge", "0");
      primaryBtnNode.classList.remove("spark-ready");
    }
  }

  function handlePrimaryPointerDown(e) {
    if (e.button && e.button !== 0) return;
    endHoldSpark(false);
    stopHoldSpark = startHoldSpark(e.currentTarget, () => {
      trackEvent("aa_hold_spark_ready", { id: action?.id, surface: variant });
    });
  }

  function handlePreviewPointerEnter(e) {
    previewBounds = e.currentTarget.getBoundingClientRect();
    previewHovered = true;
  }

  function handlePreviewPointerMove(e) {
    if (!previewBounds) return;
    const nx = Math.max(
      0,
      Math.min(
        1,
        (e.clientX - previewBounds.left) / Math.max(1, previewBounds.width),
      ),
    );
    const ny = Math.max(
      0,
      Math.min(
        1,
        (e.clientY - previewBounds.top) / Math.max(1, previewBounds.height),
      ),
    );
    spotX = Math.round(nx * 100);
    spotY = Math.round(ny * 100);
  }

  function handlePreviewPointerLeave() {
    previewHovered = false;
    previewBounds = null;
    spotX = 50;
    spotY = 34;
  }

  function handlePreviewNudge() {
    previewNudged = false;
    if (previewNudgeTimer) clearTimeout(previewNudgeTimer);
    // Re-trigger nudge pulse cleanly even on repeated taps
    requestAnimationFrame(() => {
      previewNudged = true;
    });
    previewNudgeTimer = setTimeout(() => {
      previewNudged = false;
    }, 1050);
  }

  $: if (action?.id !== lastHoldActionId) {
    lastHoldActionId = action?.id || null;
    endHoldSpark(false);
    previewNudged = false;
    ctaHovered = false;
  }

  onDestroy(() => {
    endHoldSpark(false);
    if (previewNudgeTimer) clearTimeout(previewNudgeTimer);
  });

  $: if (justCompleted && action && action.id !== lastCelebratedActionId) {
    lastCelebratedActionId = action.id;
    try {
      safeVibrate(40);
      playCelebrationChord();
    } catch {}
  }

  function handleWeightUpdate(g) {
    kibbleGrams = g;
  }

  function getSavedValueLabels(ids) {
    if (!ids || !ids.length) return "";
    return VALUES.filter((v) => ids.includes(v.key || v.id))
      .map((v) => stripLeadingEmoji(v.label))
      .slice(0, 2)
      .join(", ");
  }

  function triggerEffectSpark() {
    if (!action) return;
    showEffectPreview = true;
    sparkBoosted = true;
    notifyMollySpark(action, { surface: variant });
    if (cardCanvasNode) {
      triggerCanvasBurst(cardCanvasNode, true);
    } else {
      playPayoffAsmr(action);
    }
    trackEvent("aa_effect_preview_toggle", {
      id: action.id,
      open: true,
      surface: variant,
    });
  }

  function getCategoryAura(act, scene = "") {
    if (!act) return null;
    const element = act.element || "";
    const id = act.id || "";
    const values = act.values || [];

    // 1. Přesné určení podle scény a primárního elementu (před fallbackem na sekundární values,
    // aby se např. občanská věda Zooniverse neoznačovala jako „Útulek“)
    if (
      scene === "kibble" ||
      scene === "shelter_care" ||
      id.includes("utulek") ||
      id.includes("utulky") ||
      id.includes("feed")
    ) {
      return {
        label: "Útulek a zvířata",
        shortLabel: "Útulek",
        theme: "animals",
      };
    }
    if (
      scene === "wildlife_rescue" ||
      scene === "birds_glass" ||
      scene === "birds_song" ||
      scene === "butterfly_lens" ||
      element === "animals"
    ) {
      return {
        label: "Ptáci a volná příroda",
        shortLabel: "Volná příroda",
        theme: "wildlife",
      };
    }
    if (element === "knowledge" || element === "science") {
      return {
        label: "Věda a poznání",
        shortLabel: "Poznání",
        theme: "science",
      };
    }
    if (element === "nature") {
      return {
        label: "Příroda a krajina",
        shortLabel: "Příroda",
        theme: "nature",
      };
    }
    if (element === "community") {
      return {
        label: "Blízkost a komunita",
        shortLabel: "Komunita",
        theme: "community",
      };
    }
    if (element === "care") {
      return {
        label: "Zdraví a přímá opora",
        shortLabel: "Péče a opora",
        theme: "care",
      };
    }

    // 2. Fallback pro vlastní nebo minimální záznamy bez elementu
    if (values.includes("animals") || id.includes("zvirata")) {
      return {
        label: "Pomoc zvířatům",
        shortLabel: "Zvířata",
        theme: "animals",
      };
    }
    if (
      values.includes("environment") ||
      values.includes("nature") ||
      values.includes("climate") ||
      id.includes("strom") ||
      id.includes("priroda") ||
      id.includes("ptaci") ||
      id.includes("studank") ||
      id.includes("uklid")
    ) {
      return {
        label: "Příroda a krajina",
        shortLabel: "Příroda",
        theme: "nature",
      };
    }
    if (
      values.includes("science") ||
      values.includes("education") ||
      id.includes("maps") ||
      id.includes("veda") ||
      id.includes("wiki") ||
      id.includes("digital")
    ) {
      return {
        label: "Věda a poznání",
        shortLabel: "Poznání",
        theme: "science",
      };
    }
    if (
      values.includes("community") ||
      values.includes("elderly") ||
      id.includes("knihobudka") ||
      id.includes("senior") ||
      id.includes("soused")
    ) {
      return {
        label: "Blízkost a komunita",
        shortLabel: "Komunita",
        theme: "community",
      };
    }
    if (
      values.includes("health") ||
      values.includes("poverty") ||
      id.includes("zachranka") ||
      id.includes("jidlo") ||
      id.includes("ryze")
    ) {
      return {
        label: "Zdraví a přímá opora",
        shortLabel: "Péče a opora",
        theme: "care",
      };
    }
    return { label: "Dobrý skutek", shortLabel: "Skutek", theme: "default" };
  }

  const PREVIEW_CUE_BY_ID = {
    zvirata_utulek_online: {
      promise: "1 klik zdarma = ~25 g granulí do misky",
      status: "Miska čeká prázdná",
    },
    donio_utulky: {
      promise: "Plná miska a přímá péče v útulku",
      status: "Miska čeká prázdná",
    },
    birdlife_ptaci_pasti: {
      promise: "Bezpečné sklo pro ptáky v tvém okolí",
      status: "Čiré sklo čeká",
    },
    strnadi_nareci: {
      promise: "15 s zpěvu strnada pro české vědce",
      status: "Větev zatím tichá",
    },
    zvire_v_nouzi: {
      promise: "774 155 155 · 34 záchranných stanic v ČR",
      status: "Pohotovost v kapse",
    },
    aplikace_zachranka: {
      promise: "Přesná GPS a mapa AED v kapse",
      status: "Maják připraven",
    },
    darovani_krve: {
      promise: "1 odběr krve pomůže až 3 životům",
      status: "3 srdce čekají",
    },
    kostni_dren: {
      promise: "Zápis do registru dárců kostní dřeně",
      status: "Hledá se shoda",
    },
    daruj_vlasy: {
      promise: "Pramen vlasů na paruku pro pacienty",
      status: "Pramen připraven",
    },
    nevypusť_dusi: {
      promise: "5 kroků první psychické opory",
      status: "Klubko k rozpletení",
    },
    opatruj_se_nudz: {
      promise: "5 min vědecky ověřeného zklidnění mysli",
      status: "Poupě na hladině",
    },
    s_barvou_ven: {
      promise: "Bezpečná opora a přijetí bez předsudků",
      status: "Paprsek před hranolem",
    },
    wikipedie_cz: {
      promise: "1 zpřesněný článek pro tisíce čtenářů",
      status: "Chybí ověřený fakt",
    },
    amnesty_apel: {
      promise: "1 podpis na obranu nespravedlivě vězněných",
      status: "Hlas za svobodu",
    },
    cesko_digital_micro: {
      promise: "Zapojení dovedností do otevřených projektů",
      status: "Uzly před spojením",
    },
    missing_maps: {
      promise: "10 zmapovaných střech pro záchranáře",
      status: "Nezmapované území",
    },
    freerice_ryze: {
      promise: "10 zrnek rýže OSN za každou odpověď",
      status: "Miska OSN čeká",
    },
    zooniverse_veda: {
      promise: "5 snímků z fotopastí a vesmíru pro vědu",
      status: "Hledáček před ostřením",
    },
    ucime_online: {
      promise: "Doučování školáka online z domova",
      status: "Žárovka čeká na jiskru",
    },
    doucujte_cvt: {
      promise: "Pravidelná opora dítěti ve vzdělávání",
      status: "Sešit čeká na tah",
    },
    letters_seniors: {
      promise: "Dopis či rozhovor proti samotě seniorů",
      status: "Zapečetěná obálka",
    },
    moudra_sovicka_mobil: {
      promise: "Trpělivá digitální rada pro seniora",
      status: "Displej bez štítu",
    },
    pamet_naroda_vzpominka: {
      promise: "Příběhy pamětníků, na které se nezapomene",
      status: "Tichý archivní pás",
    },
    knihobudka_kniha: {
      promise: "1 přečtená kniha poslaná dál sousedům",
      status: "Police čeká na knihu",
    },
    nevyhazujto_sousedum: {
      promise: "Druhý život funkční věci zdarma v okolí",
      status: "Balíček u dveří",
    },
    trash_hero_uklid: {
      promise: "5 sebraných odpadků na procházce venku",
      status: "Stezka před úklidem",
    },
    remobil_telefon: {
      promise: "Starý mobil = suroviny + 10 Kč charitě",
      status: "Mobil v šuplíku",
    },
    mapko_kompost: {
      promise: "Slupky z kuchyně zpět do živé půdy",
      status: "Půda čeká na živiny",
    },
    sazime_budoucnost: {
      promise: "Výsadba a péče o stromy v české krajině",
      status: "Sazenička na holině",
    },
    na_ovoce_strom: {
      promise: "Volně rostoucí ovocné stromy bez plýtvání",
      status: "Sad čeká na záznam",
    },
    inaturalist_priroda: {
      promise: "Záznam druhu do mapy české biodiverzity",
      status: "Lupa před ostřením",
    },
    brontosaurus_vikend: {
      promise: "Víkendovka pro přírodu a památky v ČR",
      status: "Ohniště před jiskrou",
    },
    inex_workcamp_cr: {
      promise: "Mezinárodní dobrovolnický miniprojekt v ČR",
      status: "Břehy před spojením",
    },
    estudanky_pramen: {
      promise: "Péče o lesní studánku v národním registru",
      status: "Pramen pod listím",
    },
    potravinova_banka: {
      promise: "Zachráněné porce jídla pro rodiny v nouzi",
      status: "Regál čeká na zásoby",
    },
    nadeje_jidlo: {
      promise: "Teplá polévka a noc v teple pro lidi v nouzi",
      status: "Chladná ulička",
    },
    zachran_jidlo_recept: {
      promise: "Chutná večeře ze surovin bez plýtvání",
      status: "Suroviny na lince",
    },
    nesnezeno_porce: {
      promise: "Zachráněná porce z pekárny či bistra v okolí",
      status: "Před zavíračkou",
    },
    kola_pro_afriku: {
      promise: "Darované kolo zkrátí dětem cestu do školy",
      status: "Kolo čeká ve stínu",
    },
    chodci_sobe: {
      promise: "Nahlášení nebezpečného přechodu či bariéry",
      status: "Bariéra na chodníku",
    },
    epp_pohybem: {
      promise: "Chůze a běh proměněné v body pro projekty",
      status: "Dráha čeká na krok",
    },
    krabice_od_bot: {
      promise: "Vánoční dárek v krabici pro dítě v nouzi",
      status: "Zavázaná krabice",
    },
    dobry_andel: {
      promise: "100 % daru do posledního haléře rodinám",
      status: "Váhy před vyrovnáním",
    },
    charita_dar: {
      promise: "Podpora domácí hospicové a terénní péče",
      status: "Zhasnuté okénko",
    },
    znesnaze21_pribeh: {
      promise: "100 % daru na ověřený příběh člověka",
      status: "Most před spojením",
    },
  };

  function buildPreviewCue(act, meta) {
    if (!act) return { promise: "", status: "" };
    const id = act.id || "";
    const custom = PREVIEW_CUE_BY_ID[id];
    if (custom) return custom;

    const promise = meta?.label || "Ověřený dobrý skutek";
    let status = "Ověřeno · bez účtu";
    if (act.mode === "online" && act.cost === "free") {
      status = "Připraveno · 0 Kč";
    } else if (act.mode === "local") {
      status = "Ověřeno · v okolí";
    }
    return { promise, status };
  }

  function cleanPayoffBadge(raw) {
    return raw
      ? String(raw)
          .replace(/\s*🐾\s*/g, "")
          .trim()
      : "";
  }

  function hasPawInBadge(raw) {
    return Boolean(raw && String(raw).includes("🐾"));
  }

  $: effectMeta = action
    ? getActionEffectMeta(action, kibbleGrams, {
        isReturnStrip: partnerReturnPromptVisible,
      })
    : null;
  $: categoryAura = getCategoryAura(action, effectMeta?.scene);
  $: previewCue = buildPreviewCue(action, effectMeta);
  $: showIdleDiorama =
    variant === "instant" &&
    !isStarted &&
    !justCompleted &&
    !partnerReturnPromptVisible;
  $: actionTitle = action ? cleanTitle(action.title) : "";
</script>

{#if action}
  <article
    id={action ? `online-card-${action.id}` : undefined}
    class="action-card card instant-body {className}"
    class:directory-card={variant === "directory"}
    class:has-preview-stage={showIdleDiorama}
    class:spotlight
    class:done-card={isCompleted}
    class:is-done={isCompleted}
  >
    <!-- 0. Živá scéna očekávání (unikátní Before p = 0 ilustrace každého skutku před spuštěním) -->
    {#if showIdleDiorama}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="deed-preview-stage"
        class:is-primed={previewHovered || ctaHovered || previewNudged}
        class:is-nudged={previewNudged}
        data-scene={effectMeta?.scene || "default"}
        style="--spot-x: {spotX}%; --spot-y: {spotY}%;"
        on:pointerenter={handlePreviewPointerEnter}
        on:pointermove={handlePreviewPointerMove}
        on:pointerleave={handlePreviewPointerLeave}
        on:click={handlePreviewNudge}
      >
        <div class="preview-hud">
          <span class="preview-promise-pill">
            <span class="preview-promise-spark" aria-hidden="true">✦</span>
            <span>{previewCue.promise}</span>
          </span>
          <span class="preview-status-pill" class:nudged={previewNudged}>
            <span class="preview-status-dot" aria-hidden="true"></span>
            <span
              >{previewNudged
                ? "↓ Spusť tlačítkem níže"
                : previewCue.status}</span
            >
          </span>
        </div>

        <canvas
          class="preview-diorama-canvas"
          width="380"
          height="86"
          use:impactCanvas={{
            action,
            preview: true,
            primed: previewHovered || ctaHovered || previewNudged,
            silent: true,
          }}
          aria-hidden="true"
        ></canvas>
      </div>
    {/if}

    <!-- 1. Standardizovaná hlavička: Kategorie · Čas · Cena · Režim -->
    <div class="action-meta-line card-meta-top">
      {#if categoryAura}
        <span
          class="category-aura-chip category-aura-{categoryAura.theme}"
          aria-label="Kategorie: {categoryAura.label}"
        >
          <span class="category-aura-icon" aria-hidden="true">
            {#if categoryAura.theme === "animals"}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="7.5" cy="9.5" r="2.3" />
                <circle cx="12" cy="7" r="2.3" />
                <circle cx="16.5" cy="9.5" r="2.3" />
                <path
                  d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z"
                />
              </svg>
            {:else if categoryAura.theme === "wildlife"}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 14c3.5-4.5 7-4.5 9-1 2-3.5 5.5-3.5 9 1" />
                <path d="M12 13v5" />
              </svg>
            {:else if categoryAura.theme === "science"}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <polygon
                  points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            {:else if categoryAura.theme === "community"}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            {:else if categoryAura.theme === "care"}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 20.5s-7.5-4.6-9.3-9C1.4 8.2 3.6 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.6 1.1-1.5 2.7-2.6 4.7-2.6 3.7 0 5.9 3.7 4.6 7-1.8 4.4-9.3 9-9.3 9Z"
                />
              </svg>
            {:else}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            {/if}
          </span>
          <span class="category-aura-label">{categoryAura.shortLabel}</span>
        </span>
      {/if}
      <span class="quick-tags-pill quick-tags-inline">
        {action.quickTagsLabel || "2 min · Zdarma · Online"}
      </span>
      {#if isCompleted}
        <span class="done-dot done-inline">· ✓ Splněno</span>
      {/if}
      {#if savedValues && savedValues.length > 0 && onTogglePersonalValues}
        <button
          type="button"
          class="personal-values-pill"
          class:active={usePersonalValues}
          on:click={onTogglePersonalValues}
          title="Přizpůsobit podle témat vybraných v průvodci"
        >
          {usePersonalValues
            ? `✦ Tvoje témata (${getSavedValueLabels(savedValues)})`
            : "🎯 Moje témata"}
        </button>
      {/if}
    </div>

    <!-- 2. Název příležitosti -->
    <h2 class="action-title card-title rec-title">{actionTitle}</h2>

    <!-- 3. Jasné vysvětlení jednoho konkrétního skutku -->
    <p class="action-desc card-desc rec-desc">{action.desc}</p>

    <!-- 4. Přínos (v katalogu viditelný přímo; na instant kartě výhradně v detailu bez duplicity) -->
    {#if variant === "directory"}
      <div class="action-impact-summary card-impact-box rec-impact-block">
        <div class="impact-benefit-line card-benefit-line rec-impact-line">
          <strong>Přínos ({action.impactBasis || "doložený"}):</strong>
          <span>{action.concreteImpact || action.selfBenefit}</span>
        </div>
      </div>
    {/if}

    <!-- 5. Sekundární metadata výhradně v rozbalovacím detailu -->
    <details class="how-toggle steps-inline">
      <summary
        >ℹ️ Jak to funguje ({action.steps?.length
          ? `${action.steps.length} ${action.steps.length === 1 ? "krok" : action.steps.length < 5 ? "kroky" : "kroků"}`
          : "důkazy a partner"})</summary
      >
      <div class="how-details-content">
        <div class="detail-evidence-line">
          <EvidenceBadge
            tier={action.impactEvidence || "B"}
            variant={variant === "directory" ? "card" : "pill"}
            className="card-evidence-badge rec-evidence-pill evidence-pill"
          />
        </div>
        <div class="partner-trust-line card-partner-line rec-partner-line">
          <span>
            {action.registrationRequired
              ? "Krátká registrace u partnera"
              : "Bez registrace na našem webu"}
          </span>
          <span>·</span>
          <span>Aktivita probíhá u <strong>{action.org}</strong></span>
        </div>
        {#if variant !== "directory"}
          <div class="impact-benefit-line detail-impact-line">
            <strong>Přínos ({action.impactBasis || "doložený"}):</strong>
            <span>{action.concreteImpact || action.selfBenefit}</span>
          </div>
        {/if}
        {#if action.steps?.length}
          <ol class="how-steps clean-steps">
            {#each action.steps as step}
              <li>{step}</li>
            {/each}
          </ol>
        {/if}
        {#if action.impactChain}
          <div class="impact-chain-row rec-impact-chain card-chain-line">
            <span><strong>Aktivita:</strong> {action.impactChain.activity}</span
            >
            <span class="chain-arrow chain-sep">→</span>
            <span
              ><strong>Výsledek:</strong>
              {action.impactChain.immediateOutput}</span
            >
            <span class="chain-arrow chain-sep">→</span>
            <span
              ><strong>Skutečný dopad:</strong>
              {action.impactChain.realImpact}</span
            >
          </div>
        {/if}
        <div
          class="action-verify-footer card-verify-footer rec-verify-footer mobile-details-extra"
        >
          <span class="verify-meta mde-verify">
            Ověřeno: <strong>{action.verifiedLabel}</strong> · Zdroj:
            <a
              href={action.sourceUrl || action.url}
              target="_blank"
              rel="noopener noreferrer"
              class="verify-source-link card-source-link rec-source-link"
            >
              {action.org} ↗
            </a>
          </span>
          <div
            class="verify-footer-actions card-footer-actions rec-footer-btns mde-row"
          >
            {#if onShare}
              <button
                type="button"
                class="direct-link-share-btn mde-share-btn card-broken-btn rec-broken-btn"
                on:click={() => onShare(action)}
                title="Zkopírovat přímý odkaz na tento skutek pro sdílení v diskuzi nebo zprávě"
              >
                {copiedDirectLink ? "✓ Odkaz zkopírován" : "🔗 Sdílet odkaz"}
              </button>
            {/if}
            <button
              type="button"
              class="broken-link-btn mde-broken-btn card-broken-btn rec-broken-btn"
              on:click={() => {
                if (onReportBroken) onReportBroken(action);
                else
                  openBrokenLinkReport({
                    id: action.id,
                    title: actionTitle,
                    org: action.org,
                    url: action.url,
                  });
              }}
            >
              Nahlásit chybu
            </button>
          </div>
        </div>
      </div>
    </details>

    <!-- 6. In-situ oslava a odměna po dokončení nebo návratu od partnera -->
    {#if justCompleted}
      <div
        class="celebration-card inline-celebration-card in-situ-celebration"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || "default"}
      >
        <div class="inline-celebration-head">
          <span class="kicker celebration-kicker"
            >🎉 Skvělá práce! Dobrý skutek je hotový</span
          >
          {#if effectMeta?.badge}
            <span class="impact-payoff-badge">
              <span>{cleanPayoffBadge(effectMeta.badge)}</span>
              {#if hasPawInBadge(effectMeta.badge)}
                <svg
                  class="badge-paw-svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="7.5" cy="9.5" r="2.3" />
                  <circle cx="12" cy="7" r="2.3" />
                  <circle cx="16.5" cy="9.5" r="2.3" />
                  <path
                    d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z"
                  />
                </svg>
              {/if}
            </span>
          {/if}
        </div>
        <h3 class="win-title">{actionTitle}</h3>
        <canvas
          class="impact-payoff-canvas"
          width="320"
          height="118"
          use:impactCanvas={{
            action,
            climax: true,
            onWeightUpdate: handleWeightUpdate,
          }}
          aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        ></canvas>
        <div class="in-situ-affirmation">
          ✨ <strong>Dnes už tvůj dobrý skutek pomáhá.</strong> Můžeš pokračovat
          dalším drobným skutkem, nebo dnešní seanci s klidem uzavřít.
        </div>
        <div class="molly-celebration-note">
          <svg
            class="badge-paw-svg molly-note-paw-svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="7.5" cy="9.5" r="2.3" />
            <circle cx="12" cy="7" r="2.3" />
            <circle cx="16.5" cy="9.5" r="2.3" />
            <path
              d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z"
            />
          </svg>
          <strong>Molly děkuje a má radost!</strong> V
          <a href="/svet" class="molly-svet-inline-link">Krajině dobra</a> na ni
          za tvůj skutek čeká zasloužený pamlsek.
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          {#if onCloseSession}
            <button
              type="button"
              class="return-dopamine-btn btn-session-close"
              on:click={onCloseSession}
              aria-label="Uzavřít dnešní seanci"
            >
              🌿 Pro dnešek hotovo
            </button>
          {/if}
          {#if onNextIdea}
            <button
              type="button"
              class="return-dopamine-btn btn-next-deed inline-celebration-next"
              on:click={onNextIdea}
              aria-label="Ukázat další doporučený skutek"
            >
              Další dobrý skutek →
            </button>
          {/if}
        </div>
      </div>
    {:else if partnerReturnPromptVisible}
      <div
        class="return-dopamine-strip in-situ-strip"
        role="status"
        aria-live="polite"
        data-scene={effectMeta?.scene || "default"}
      >
        <div class="inline-celebration-head return-dopamine-head">
          <div class="return-dopamine-text return-dopamine-title">
            ✨ <strong>Vítej zpět!</strong> Povedlo se ti dokončit skutek u partnera?
          </div>
          {#if effectMeta?.returnBadge || effectMeta?.badge}
            <span class="impact-payoff-badge">
              <span
                >{cleanPayoffBadge(
                  effectMeta.returnBadge || effectMeta.badge,
                )}</span
              >
              {#if hasPawInBadge(effectMeta.returnBadge || effectMeta.badge)}
                <svg
                  class="badge-paw-svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="7.5" cy="9.5" r="2.3" />
                  <circle cx="12" cy="7" r="2.3" />
                  <circle cx="16.5" cy="9.5" r="2.3" />
                  <path
                    d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z"
                  />
                </svg>
              {/if}
            </span>
          {/if}
        </div>
        <canvas
          class="impact-payoff-canvas"
          width="320"
          height="118"
          use:impactCanvas={{
            action,
            climax: true,
            onWeightUpdate: handleWeightUpdate,
          }}
          aria-label="Fyzikální vizualizace dopadu dobrého skutku"
        ></canvas>
        <div class="in-situ-affirmation">
          🌿 Každý drobný krok má skutečný význam.
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          <button
            type="button"
            class="return-dopamine-btn btn-return-complete"
            on:click={() => onComplete && onComplete(action)}
          >
            ✓ Ano, mám hotovo
          </button>
          {#if onCloseSession}
            <button
              type="button"
              class="btn-session-close return-dopamine-svet-link"
              on:click={onCloseSession}
            >
              🌿 Pro dnešek hotovo
            </button>
          {:else if onDismissReturn}
            <button
              type="button"
              class="btn-return-dismiss return-dopamine-svet-link"
              on:click={onDismissReturn}
            >
              Později
            </button>
          {/if}
        </div>
      </div>
    {/if}

    {#if !justCompleted}
      <div class="instant-actions actions-row cta-row">
        <a
          bind:this={primaryBtnNode}
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          class="btn-studio-primary btn-gold-action cta primary"
          class:cta-nudged={previewNudged}
          data-hold-spark="true"
          data-molly-guide="true"
          on:pointerenter={() => (ctaHovered = true)}
          on:pointerdown={handlePrimaryPointerDown}
          on:pointerup={() => endHoldSpark(true)}
          on:pointerleave={() => {
            ctaHovered = false;
            endHoldSpark(false);
          }}
          on:pointercancel={() => {
            ctaHovered = false;
            endHoldSpark(false);
          }}
          on:click={() => {
            endHoldSpark(true);
            if (onStart) onStart(action);
          }}
        >
          <!-- Vysoce kontrastní zlatavá vektorová ikona místo tmavě fialového OS emoji -->
          {#if categoryAura?.theme === "animals"}
            <svg
              class="cta-lead-icon"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="7.5" cy="9.5" r="2.2" />
              <circle cx="12" cy="7" r="2.2" />
              <circle cx="16.5" cy="9.5" r="2.2" />
              <path
                d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z"
              />
            </svg>
          {:else if categoryAura?.theme === "wildlife"}
            <svg
              class="cta-lead-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.3"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 14c3.5-4.5 7-4.5 9-1 2-3.5 5.5-3.5 9 1" />
              <path d="M12 13v5" />
            </svg>
          {:else if categoryAura?.theme === "nature"}
            <svg
              class="cta-lead-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.3"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
              />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          {:else if categoryAura?.theme === "care"}
            <svg
              class="cta-lead-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 20.5s-7.5-4.6-9.3-9C1.4 8.2 3.6 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.6 1.1-1.5 2.7-2.6 4.7-2.6 3.7 0 5.9 3.7 4.6 7-1.8 4.4-9.3 9-9.3 9Z"
              />
            </svg>
          {:else}
            <svg
              class="cta-lead-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"
              />
            </svg>
          {/if}
          <span
            >{action.id === "zvirata_utulek_online"
              ? "Nakrmit útulek teď"
              : action.cta || "Začít pomáhat"}</span
          >
          <svg
            class="cta-arrow-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>

        {#if isStarted && !partnerReturnPromptVisible}
          <button
            type="button"
            class="btn-studio-done btn-done-action cta secondary done-btn"
            class:initiated={isStarted}
            on:click={() => onComplete && onComplete(action)}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{action.doneCta || "Dokončeno"}</span>
          </button>
        {/if}
      </div>

      {#if isStarted && !partnerReturnPromptVisible}
        <div
          class="card-effect-stage"
          data-scene={effectMeta?.scene || "default"}
        >
          <div class="card-effect-head">
            {#if effectMeta?.badge}
              <span class="impact-payoff-badge">
                <span>{cleanPayoffBadge(effectMeta.badge)}</span>
                {#if hasPawInBadge(effectMeta.badge)}
                  <svg
                    class="badge-paw-svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="7.5" cy="9.5" r="2.3" />
                    <circle cx="12" cy="7" r="2.3" />
                    <circle cx="16.5" cy="9.5" r="2.3" />
                    <path
                      d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z"
                    />
                  </svg>
                {/if}
              </span>
            {/if}
            <div class="card-effect-controls">
              <button
                type="button"
                class="effect-spark-btn"
                class:active={sparkBoosted}
                on:click={triggerEffectSpark}
                aria-pressed={sparkBoosted}
                aria-label="Jemná vizualizace proměny dopadu"
                title="Přehrát vizualizaci proměny"
              >
                ✨ Impuls
              </button>
              {#if onToggleSound}
                <button
                  type="button"
                  class="sound-mute-btn"
                  on:click={onToggleSound}
                  aria-pressed={soundMuted}
                  aria-label={soundMuted
                    ? "Zapnout jemné zvuky"
                    : "Ztlumit zvuky"}
                  title={soundMuted ? "Zapnout jemné zvuky" : "Ztlumit zvuky"}
                >
                  {soundMuted ? "🔇" : "🔊"}
                </button>
              {/if}
            </div>
          </div>
          <canvas
            bind:this={cardCanvasNode}
            class="impact-payoff-canvas"
            width="320"
            height="118"
            use:impactCanvas={{
              action,
              climax: false,
              onWeightUpdate: handleWeightUpdate,
            }}
            aria-label="Fyzikální vizualizace dopadu dobrého skutku"
          ></canvas>
        </div>
      {/if}
    {/if}
  </article>
{/if}

<style>
  .instant-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 100%;
  }

  /* =========================================================================
     ŽIVÁ SCÉNA OČEKÁVÁNÍ (IDLE ANTICIPATION DIORAMA)
     ========================================================================= */
  .deed-preview-stage {
    --spot-x: 50%;
    --spot-y: 34%;
    position: relative;
    width: 100%;
    height: 86px;
    margin: 0 0 0.65rem 0;
    border-radius: 16px;
    overflow: hidden;
    cursor: default;
    user-select: none;
    background: linear-gradient(180deg, #113e2b 0%, #072016 58%, #03100b 100%);
    border: 1px solid rgba(52, 211, 153, 0.34);
    box-shadow:
      0 12px 26px -12px rgba(4, 20, 13, 0.52),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
    transition:
      border-color 0.24s ease,
      box-shadow 0.24s ease,
      transform 0.22s ease;
  }

  .deed-preview-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: radial-gradient(
      140px 92px at var(--spot-x) var(--spot-y),
      rgba(253, 230, 138, 0.18) 0%,
      rgba(52, 211, 153, 0.1) 52%,
      transparent 100%
    );
    opacity: 0.7;
    transition: opacity 0.24s ease;
  }

  .deed-preview-stage.is-primed {
    border-color: rgba(251, 191, 36, 0.58);
    box-shadow:
      0 14px 30px -10px rgba(6, 28, 19, 0.6),
      0 0 0 2px rgba(251, 191, 36, 0.2),
      inset 0 1px 0 rgba(254, 243, 199, 0.25);
  }

  .deed-preview-stage.is-primed::after {
    opacity: 1;
  }

  .deed-preview-stage.is-nudged {
    transform: scale(0.992);
  }

  .preview-hud {
    position: absolute;
    top: 8px;
    left: 9px;
    right: 9px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    pointer-events: none;
  }

  .preview-promise-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    max-width: 68%;
    padding: 0.2rem 0.56rem;
    border-radius: 999px;
    background: rgba(4, 19, 13, 0.72);
    border: 1px solid rgba(253, 230, 138, 0.38);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #fef3c7;
    font-size: 0.71rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-promise-spark {
    color: #fbbf24;
    flex-shrink: 0;
  }

  .preview-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(110, 231, 183, 0.3);
    color: #a7f3d0;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .preview-status-pill.nudged {
    background: rgba(251, 191, 36, 0.24);
    border-color: rgba(253, 230, 138, 0.65);
    color: #fef3c7;
  }

  .preview-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
    flex-shrink: 0;
  }

  .preview-status-pill.nudged .preview-status-dot {
    background: #fbbf24;
    box-shadow: 0 0 8px #fbbf24;
  }

  .preview-diorama-canvas {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* =========================================================================
     HLAVIČKA KARTY A OBSAH
     ========================================================================= */
  .action-meta-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-size: 0.78rem;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.42rem;
  }

  .quick-tags-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.62rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.24);
    color: #065f46;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .category-aura-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.26rem;
    padding: 0.2rem 0.58rem;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    line-height: 1.2;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .category-aura-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    flex-shrink: 0;
  }

  .category-aura-animals {
    background: rgba(251, 191, 36, 0.16);
    border: 1px solid rgba(245, 158, 11, 0.36);
    color: #92400e;
  }

  .category-aura-wildlife {
    background: rgba(20, 184, 166, 0.13);
    border: 1px solid rgba(45, 212, 191, 0.36);
    color: #0f766e;
  }

  .category-aura-nature {
    background: rgba(16, 185, 129, 0.13);
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: #065f46;
  }

  .category-aura-science {
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(96, 165, 250, 0.35);
    color: #1e40af;
  }

  .category-aura-community {
    background: rgba(139, 92, 246, 0.11);
    border: 1px solid rgba(167, 139, 250, 0.34);
    color: #5b21b6;
  }

  .category-aura-care {
    background: rgba(245, 158, 11, 0.13);
    border: 1px solid rgba(251, 191, 36, 0.38);
    color: #9a3412;
  }

  .category-aura-default {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.3);
    color: #065f46;
  }

  .personal-values-pill {
    margin-left: auto;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid rgba(16, 185, 129, 0.25);
    background: rgba(236, 253, 245, 0.8);
    color: #065f46;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
    min-height: 44px;
    padding: 0.35rem 0.65rem;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .personal-values-pill.active {
    background: #065f46;
    color: #ffffff;
    border-color: #065f46;
  }

  .action-title {
    font-weight: 800;
    font-size: 1.32rem;
    line-height: 1.23;
    letter-spacing: -0.022em;
    color: #071d14;
    margin: 0 0 0.42rem 0;
  }

  .action-desc {
    color: var(--text-secondary, #374151);
    font-size: 0.93rem;
    line-height: 1.56;
    margin: 0 0 0.55rem 0;
  }

  .action-impact-summary {
    margin: 0 0 0.75rem 0;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(22, 66, 48, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.84rem;
    line-height: 1.48;
  }

  .impact-benefit-line {
    color: #091d14;
  }

  .impact-benefit-line strong {
    color: #047857;
    margin-right: 0.25rem;
  }

  .detail-evidence-line {
    margin-bottom: 0.15rem;
  }

  .detail-impact-line {
    font-size: 0.79rem;
    line-height: 1.42;
    padding: 0.38rem 0.55rem;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.14);
  }

  .partner-trust-line {
    display: block;
    font-size: 0.78rem;
    line-height: 1.44;
    color: var(--text-muted, #6b7280);
  }

  .partner-trust-line > span + span {
    margin-left: 0.25rem;
  }

  .partner-trust-line strong {
    color: var(--text-secondary, #374151);
    font-weight: 700;
  }

  .how-toggle {
    margin: 0 0 0.45rem 0;
    font-size: 0.83rem;
    color: var(--text-secondary, #374151);
  }

  .how-toggle summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--forest-800, #064e3b);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    padding: 0.35rem 0.2rem;
    box-sizing: border-box;
    border-radius: 8px;
    transition: color 0.16s ease;
  }

  .how-toggle summary:hover {
    color: #047857;
  }

  .how-toggle summary::-webkit-details-marker {
    display: none;
  }

  .how-toggle summary::before {
    content: "▸";
    display: inline-block;
    color: var(--emerald-600, #059669);
    transition: transform 0.18s ease;
  }

  .how-toggle[open] summary::before {
    transform: rotate(90deg);
  }

  .how-steps {
    margin: 0.35rem 0 0 1.2rem;
    padding: 0;
    line-height: 1.5;
    color: var(--text-secondary, #374151);
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
  }

  .impact-chain-row {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
    border-top: 1px dashed rgba(22, 66, 48, 0.14);
    display: block;
    font-size: 0.78rem;
    line-height: 1.48;
    color: var(--text-secondary, #374151);
  }

  .chain-arrow {
    display: inline-block;
    margin: 0 0.24rem;
    color: var(--emerald-600, #059669);
    font-weight: 800;
  }

  .how-details-content {
    display: flex;
    flex-direction: column;
    gap: 0.48rem;
    margin-top: 0.35rem;
    padding: 0.65rem 0.75rem;
    border-radius: 14px;
    background: rgba(238, 246, 241, 0.6);
    border: 1px solid rgba(22, 82, 56, 0.1);
    font-size: 0.8rem;
    line-height: 1.42;
  }

  /* =========================================================================
     PRIMÁRNÍ AKČNÍ TLAČÍTKO A HOLD-TO-SPARK ODEZVA
     ========================================================================= */
  .instant-actions {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    padding-top: 0.15rem;
  }

  .btn-studio-primary {
    --spark-charge: 0;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 50px;
    padding: 0.86rem 1.2rem;
    box-sizing: border-box;
    border-radius: 15px;
    background: linear-gradient(135deg, #0b2c1e 0%, #145338 52%, #0d3524 100%);
    color: #ffffff;
    font-weight: 800;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
    text-decoration: none;
    box-shadow:
      0 12px 26px -6px rgba(10, 44, 30, 0.46),
      0 0 0 1px rgba(52, 211, 153, 0.32),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    transition:
      transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1),
      box-shadow 0.2s ease;
  }

  .btn-studio-primary::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
      90deg,
      rgba(16, 185, 129, 0.42),
      rgba(251, 191, 36, 0.48)
    );
    transform-origin: left center;
    transform: scaleX(var(--spark-charge, 0));
    transition: transform 0.06s linear;
    pointer-events: none;
  }

  .btn-studio-primary::after {
    content: "";
    position: absolute;
    top: -50%;
    bottom: -50%;
    left: -60%;
    width: 34%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.22),
      transparent
    );
    transform: rotate(25deg);
    pointer-events: none;
    transition: transform 0.65s ease;
  }

  .btn-studio-primary:hover {
    transform: translateY(-2px);
    box-shadow:
      0 16px 32px -6px rgba(10, 44, 30, 0.56),
      0 0 0 1.5px rgba(251, 191, 36, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
  }

  .btn-studio-primary:hover::after {
    transform: rotate(25deg) translate(390%, 0);
  }

  .btn-studio-primary:active {
    transform: scale(0.985);
  }

  .btn-studio-primary.cta-nudged,
  :global(.btn-studio-primary.spark-ready) {
    box-shadow:
      0 14px 30px -4px rgba(16, 185, 129, 0.5),
      0 0 0 3px rgba(251, 191, 36, 0.68);
  }

  .cta-lead-icon {
    color: #fde68a;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }

  .cta-arrow-icon {
    color: #a7f3d0;
    flex-shrink: 0;
    transition: transform 0.18s ease;
  }

  .btn-studio-primary:hover .cta-arrow-icon {
    transform: translate(2px, -2px);
    color: #fde68a;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn-studio-primary::after {
      display: none;
    }
  }

  .btn-studio-done {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    min-height: 50px;
    padding: 0.84rem 1rem;
    box-sizing: border-box;
    border-radius: 15px;
    border: 1px solid rgba(5, 150, 105, 0.28);
    background: #eef7f1;
    color: #065f46;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .btn-studio-done:hover {
    background: #059669;
    color: #ffffff;
  }

  .btn-studio-done.initiated {
    background: #059669;
    color: #ffffff;
    border-color: #059669;
  }

  /* =========================================================================
     FYZIKÁLNÍ SCÉNA DOPADU A IN-SITU OSLAVA (PO SPUŠTĚNÍ AKCE)
     ========================================================================= */
  .card-effect-stage {
    position: relative;
    margin: 0.5rem 0 0.55rem;
    padding: 0;
    border-radius: 18px;
    overflow: hidden;
    background: linear-gradient(
      180deg,
      #113e2b 0%,
      #113e2b 48px,
      #072016 76%,
      #03100b 100%
    );
    border: 1px solid rgba(52, 211, 153, 0.38);
    color: #ecfdf5;
    box-shadow:
      0 14px 30px -12px rgba(4, 18, 12, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .card-effect-head {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.38rem 0.58rem 0.1rem;
  }

  .card-effect-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .card-effect-stage .impact-payoff-badge {
    background: rgba(5, 20, 14, 0.76);
    color: #fde68a;
    border: 1px solid rgba(251, 191, 36, 0.44);
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .effect-spark-btn,
  .sound-mute-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.24rem;
    padding: 0.45rem 0.8rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid rgba(52, 211, 153, 0.38);
    background: rgba(5, 20, 14, 0.74);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #ecfdf5;
    font-family: var(--font-sans);
    font-size: 0.71rem;
    font-weight: 800;
    line-height: 1.2;
    cursor: pointer;
    transition: all 0.16s ease;
    white-space: nowrap;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.24);
  }

  .effect-spark-btn:hover,
  .effect-spark-btn.active,
  .sound-mute-btn:hover {
    background: linear-gradient(135deg, #0d2e20 0%, #174933 100%);
    color: #fde68a;
    border-color: rgba(251, 191, 36, 0.55);
  }

  .impact-payoff-canvas {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 118px;
    border: none;
    border-radius: 0;
    cursor: pointer;
    touch-action: manipulation;
  }

  .card-effect-stage,
  .celebration-card,
  .return-dopamine-strip {
    animation: payoffSlideDown 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.15);
  }

  @keyframes payoffSlideDown {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-effect-stage,
    .celebration-card,
    .return-dopamine-strip {
      animation: none;
    }
  }

  .celebration-card,
  .return-dopamine-strip {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 0.55rem;
    padding: 0.72rem 0.88rem;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 16px;
    background: linear-gradient(
      145deg,
      rgba(8, 30, 21, 0.96),
      rgba(16, 54, 38, 0.95)
    );
    border: 1px solid rgba(52, 211, 153, 0.38);
    color: #ecfdf5;
    font-size: 0.84rem;
    line-height: 1.38;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
  }

  .inline-celebration-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .inline-celebration-card .kicker {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6ee7b7;
  }

  .inline-celebration-card .win-title {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 800;
    color: #ffffff;
  }

  .impact-payoff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.26rem;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.2);
    color: #a7f3d0;
  }

  .badge-paw-svg {
    color: #fde68a;
    flex-shrink: 0;
  }

  .molly-note-paw-svg {
    display: inline-block;
    vertical-align: -2px;
    margin-right: 0.18rem;
  }

  .in-situ-affirmation,
  .molly-celebration-note {
    font-size: 0.82rem;
    color: #e6f5ec;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.28);
    border-radius: 10px;
    padding: 0.45rem 0.75rem;
    margin: 0.45rem 0;
    line-height: 1.4;
  }

  .molly-svet-inline-link {
    color: #fde68a;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .return-dopamine-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .return-dopamine-btn {
    appearance: none;
    border: 1px solid rgba(251, 191, 36, 0.5);
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #062015;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 800;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
  }

  .btn-session-close {
    border: 1px solid rgba(52, 211, 153, 0.38);
    background: rgba(6, 78, 59, 0.45);
    color: #a7f3d0;
    box-shadow: 0 2px 8px rgba(6, 78, 59, 0.25);
  }

  .btn-session-close:hover {
    background: rgba(6, 78, 59, 0.7);
    border-color: rgba(52, 211, 153, 0.6);
  }

  .btn-next-deed {
    border: 1px solid rgba(251, 191, 36, 0.5);
  }

  .return-dopamine-svet-link {
    color: #fde68a;
    font-size: 0.82rem;
    font-weight: 800;
    text-decoration: underline;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0.4rem 0.6rem;
  }

  .inline-celebration-next {
    border: 1px solid rgba(251, 191, 36, 0.65);
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #062015;
    padding: 0.5rem 1rem;
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  /* =========================================================================
     OVĚŘOVACÍ PATIČKA (V DETAILU „JAK TO FUNGUJE“)
     ========================================================================= */
  .how-details-content .action-verify-footer,
  .action-verify-footer,
  .mobile-details-extra {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
    border-top: 1px dashed rgba(22, 66, 48, 0.16);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.2rem 0.48rem;
    flex-wrap: wrap;
    font-size: 0.73rem;
    line-height: 1.4;
    color: var(--text-muted, #6b7280);
    text-align: left;
  }

  .verify-meta,
  .mde-verify {
    display: inline-block;
    min-width: 0;
    max-width: 100%;
    font-size: 0.73rem;
    line-height: 1.4;
    color: var(--text-muted, #6b7280);
    text-align: left;
    overflow-wrap: anywhere;
  }

  .verify-meta strong,
  .mde-verify strong {
    color: var(--text-secondary, #374151);
    font-weight: 700;
  }

  .verify-source-link {
    color: var(--forest-800, #064e3b);
    font-weight: 700;
    text-decoration: none;
  }

  .verify-source-link:hover {
    color: var(--emerald-600, #059669);
    text-decoration: underline;
  }

  .verify-footer-actions,
  .mde-row {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .direct-link-share-btn,
  .mde-share-btn {
    appearance: none;
    background: none;
    border: none;
    padding: 0.12rem 0;
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    color: #047857;
    font-family: var(--font-sans);
    font-size: 0.73rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .broken-link-btn,
  .mde-broken-btn {
    appearance: none;
    border: none;
    background: transparent;
    padding: 0.12rem 0;
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    color: var(--text-muted, #6b7280);
    font-family: var(--font-sans);
    font-size: 0.72rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .broken-link-btn:hover {
    color: #b45309;
  }

  @media (min-width: 681px) {
    .instant-body > .instant-actions {
      order: 4;
      margin-bottom: 0.25rem;
    }
    .instant-body > .card-effect-stage,
    .instant-body > :global(.card-effect-stage) {
      order: 5;
      margin: 0.2rem 0 0.45rem;
    }
  }

  .card {
    background: linear-gradient(180deg, #ffffff 0%, #f9fcfa 100%);
    border: 1px solid rgba(16, 72, 48, 0.11);
    border-radius: 22px;
    box-shadow:
      0 10px 26px -10px rgba(13, 46, 32, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.03);
    padding: 0.92rem 1.08rem;
    display: flex;
    flex-direction: column;
    transition:
      transform 0.24s var(--ease-gentle, ease),
      box-shadow 0.24s var(--ease-gentle, ease);
  }

  /* Instant varianta žije uvnitř vnější skořápky (.instant-card na / nebo .highlight-card na /app/guided) — žádný vnořený dvojitý rámeček */
  .instant-body:not(.directory-card) {
    padding: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }

  .directory-card:hover {
    transform: translateY(-3px);
    box-shadow:
      0 14px 32px -8px rgba(13, 46, 32, 0.12),
      0 3px 6px rgba(0, 0, 0, 0.06);
  }

  .card.spotlight {
    border: 1.5px solid #f59e0b;
    box-shadow:
      0 0 0 4px rgba(253, 230, 138, 0.4),
      var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  }

  @media (max-width: 680px) {
    .mde-share-btn,
    .mde-broken-btn {
      min-height: 44px;
      min-width: 44px;
      padding: 0.25rem 0.2rem;
    }
    .card.directory-card {
      padding: 0.58rem 0.78rem;
      border-radius: 18px;
    }

    .instant-body {
      gap: 0.22rem;
    }

    .deed-preview-stage {
      height: 58px;
      margin: 0 0 0.2rem 0;
      border-radius: 13px;
    }

    .preview-hud {
      top: 5px;
      left: 6px;
      right: 6px;
      gap: 0.25rem;
    }

    .preview-promise-pill {
      max-width: 100%;
      padding: 0.13rem 0.44rem;
      font-size: 0.64rem;
    }

    .preview-status-pill {
      display: none;
    }

    .preview-status-pill.nudged {
      display: inline-flex;
      padding: 0.12rem 0.38rem;
      font-size: 0.61rem;
    }

    .action-meta-line {
      font-size: 0.68rem;
      gap: 0.24rem;
      margin-bottom: 0.08rem;
      flex-wrap: wrap;
    }

    .category-aura-chip {
      padding: 0.12rem 0.42rem;
      font-size: 0.66rem;
      gap: 0.18rem;
    }

    .category-aura-icon {
      font-size: 0.72rem;
    }

    .quick-tags-pill {
      padding: 0.11rem 0.4rem;
      font-size: 0.65rem;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.1);
      color: #065f46;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .personal-values-pill {
      min-height: 44px;
      padding: 0.3rem 0.6rem;
      font-size: 0.71rem;
      flex-shrink: 0;
      margin-left: auto;
      box-sizing: border-box;
    }

    .action-title {
      font-size: 1.03rem;
      line-height: 1.18;
      margin: 0.02rem 0 0.1rem 0;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-desc {
      font-size: 0.79rem;
      line-height: 1.3;
      margin: 0 0 0.08rem 0;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-impact-summary {
      margin: 0 0 0.14rem 0;
      padding-top: 0.28rem;
      gap: 0.14rem;
      font-size: 0.77rem;
      line-height: 1.32;
    }

    .partner-trust-line {
      font-size: 0.73rem;
    }

    .how-toggle {
      margin: 0;
      padding: 0 0.1rem;
      border-radius: 10px;
    }

    .how-toggle summary {
      font-size: 0.77rem;
      min-height: 44px;
      padding: 0.3rem 0.15rem;
      box-sizing: border-box;
    }

    .card-effect-stage {
      margin: 0.28rem 0 0.32rem;
      border-radius: 14px;
    }

    .celebration-card,
    .return-dopamine-strip {
      padding: 0.55rem 0.75rem;
      gap: 0.35rem;
    }

    .in-situ-affirmation,
    .molly-celebration-note {
      padding: 0.35rem 0.6rem;
      margin: 0.25rem 0;
      font-size: 0.76rem;
      line-height: 1.32;
    }

    .return-dopamine-actions {
      margin-top: 0.35rem;
      gap: 0.45rem;
    }

    .return-dopamine-btn {
      font-size: 0.82rem;
      padding: 0.45rem 0.85rem;
    }

    .card-effect-stage .impact-payoff-canvas,
    .impact-payoff-canvas {
      height: 82px;
    }

    .card-effect-head {
      padding: 0.26rem 0.45rem 0.06rem;
    }

    .card-effect-stage .impact-payoff-badge {
      font-size: 0.66rem;
      padding: 0.14rem 0.44rem;
    }

    .effect-spark-btn,
    .sound-mute-btn {
      font-size: 0.68rem;
      min-height: 44px;
      min-width: 44px;
      padding: 0.25rem 0.55rem;
    }

    .instant-actions {
      flex-direction: column;
      align-items: stretch;
      padding-top: 0.06rem;
      gap: 0.35rem;
    }

    .btn-studio-primary {
      width: 100%;
      box-sizing: border-box;
      min-height: 48px;
      padding: 0.68rem 0.95rem;
      font-size: 0.93rem;
      border-radius: 14px;
    }

    .btn-studio-done {
      width: 100%;
      box-sizing: border-box;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.44rem 0.68rem;
      font-size: 0.78rem;
      border-radius: 12px;
      background: rgba(238, 247, 241, 0.75);
    }
  }

  @media (max-width: 680px) and (max-height: 700px) {
    .deed-preview-stage {
      height: 52px;
      margin-bottom: 0.14rem;
    }

    .preview-hud {
      top: 4px;
    }

    .preview-promise-pill {
      padding: 0.09rem 0.4rem;
      font-size: 0.62rem;
    }
  }
</style>
