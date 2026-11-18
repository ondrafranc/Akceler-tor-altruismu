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
  import AppIcon from "$lib/components/AppIcon.svelte";
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

  function invalidatePreviewBounds() {
    previewBounds = null;
  }

  function handlePreviewPointerEnter(e) {
    previewBounds = e.currentTarget.getBoundingClientRect();
    previewHovered = true;
  }

  function handlePreviewPointerMove(e) {
    if (e.pointerType !== "touch") {
      previewHovered = true;
    }
    if (!previewBounds) {
      previewBounds = e.currentTarget.getBoundingClientRect();
    }
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
    previewHovered = false;
    previewBounds = null;
    spotX = 50;
    spotY = 34;
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
      promise: "Linka 774 155 155 · 34 stanic v ČR",
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

  function getCategoryIcon(theme) {
    switch (theme) {
      case "animals":
        return "paw";
      case "wildlife":
        return "bird";
      case "science":
        return "compass";
      case "community":
        return "users";
      case "care":
        return "heart";
      default:
        return "leaf";
    }
  }

  function getCtaIcon(theme) {
    switch (theme) {
      case "animals":
        return "paw";
      case "wildlife":
        return "bird";
      case "nature":
        return "leaf";
      case "care":
        return "heart";
      default:
        return "sparkles";
    }
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

<svelte:window
  on:scroll|passive={invalidatePreviewBounds}
  on:resize|passive={invalidatePreviewBounds}
/>

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
        on:pointercancel={handlePreviewPointerLeave}
        on:click={handlePreviewNudge}
      >
        <div class="preview-hud">
          <span class="preview-promise-pill">
            <AppIcon
              name={effectMeta?.icon || "sparkles"}
              size={13}
              strokeWidth={2.1}
              class="preview-promise-spark"
            />
            <span>{previewCue.promise}</span>
          </span>
          <span class="preview-status-pill" class:nudged={previewNudged}>
            <span class="preview-status-dot" aria-hidden="true"></span>
            {#if previewNudged}
              <AppIcon name="arrow-down" size={12} strokeWidth={2.2} />
              <span>Spusť tlačítkem níže</span>
            {:else}
              <span>{previewCue.status}</span>
            {/if}
          </span>
        </div>

        <canvas
          class="preview-diorama-canvas"
          width="380"
          height="92"
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
            <AppIcon
              name={getCategoryIcon(categoryAura.theme)}
              size={12}
              strokeWidth={2.1}
            />
          </span>
          <span class="category-aura-label">{categoryAura.shortLabel}</span>
        </span>
      {/if}
      <span class="quick-tags-pill quick-tags-inline">
        {action.quickTagsLabel || "2 min · Zdarma · Online"}
      </span>
      {#if isCompleted}
        <span class="done-dot done-inline">
          <AppIcon name="check" size={12} strokeWidth={2.4} />
          <span>Splněno</span>
        </span>
      {/if}
    </div>

    {#if savedValues && savedValues.length > 0 && onTogglePersonalValues}
      <div class="card-personal-row">
        <button
          type="button"
          class="personal-values-pill"
          class:active={usePersonalValues}
          on:click={onTogglePersonalValues}
          title="Přizpůsobit podle témat vybraných v průvodci"
        >
          <AppIcon
            name={usePersonalValues ? "sparkles" : "target"}
            size={13}
            strokeWidth={2}
          />
          <span>
            {usePersonalValues
              ? `Tvoje témata (${getSavedValueLabels(savedValues)})`
              : "Moje témata"}
          </span>
        </button>
      </div>
    {/if}

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
      <summary>
        <AppIcon
          name="chevron-right"
          size={14}
          strokeWidth={2.3}
          class="how-toggle-chevron"
        />
        <AppIcon name="info" size={14} strokeWidth={2.1} />
        <span
          >Jak to funguje ({action.steps?.length
            ? `${action.steps.length} ${action.steps.length === 1 ? "krok" : action.steps.length < 5 ? "kroky" : "kroků"}`
            : "důkazy a partner"})</span
        >
      </summary>
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
            <span class="chain-arrow chain-sep" aria-hidden="true">
              <AppIcon name="arrow-right" size={12} strokeWidth={2.2} />
            </span>
            <span
              ><strong>Výsledek:</strong>
              {action.impactChain.immediateOutput}</span
            >
            <span class="chain-arrow chain-sep" aria-hidden="true">
              <AppIcon name="arrow-right" size={12} strokeWidth={2.2} />
            </span>
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
              <span>{action.org}</span>
              <AppIcon name="arrow-up-right" size={12} strokeWidth={2.2} />
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
                <AppIcon
                  name={copiedDirectLink ? "check" : "share-2"}
                  size={13}
                  strokeWidth={2.1}
                />
                <span
                  >{copiedDirectLink
                    ? "Odkaz zkopírován"
                    : "Sdílet odkaz"}</span
                >
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
          <span class="kicker celebration-kicker">
            <AppIcon name="sparkles" size={14} strokeWidth={2.1} />
            <span>Skvělá práce! Dobrý skutek je hotový</span>
          </span>
          {#if effectMeta?.badge}
            <span class="impact-payoff-badge">
              <AppIcon
                name={effectMeta?.icon || "sparkles"}
                size={13}
                strokeWidth={2.1}
              />
              <span>{effectMeta.badge}</span>
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
          <AppIcon
            name="sparkles"
            size={14}
            strokeWidth={2.1}
            class="affirmation-icon"
          />
          <span>
            <strong>Dnes už tvůj dobrý skutek pomáhá.</strong> Můžeš pokračovat
            dalším drobným skutkem, nebo dnešní seanci s klidem uzavřít.
          </span>
        </div>
        <div class="molly-celebration-note">
          <AppIcon
            name="paw"
            size={13}
            class="badge-paw-svg molly-note-paw-svg"
          />
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
              <AppIcon name="leaf" size={14} strokeWidth={2.1} />
              <span>Pro dnešek hotovo</span>
            </button>
          {/if}
          {#if onNextIdea}
            <button
              type="button"
              class="return-dopamine-btn btn-next-deed inline-celebration-next"
              on:click={onNextIdea}
              aria-label="Ukázat další doporučený skutek"
            >
              <span>Další dobrý skutek</span>
              <AppIcon name="arrow-right" size={14} strokeWidth={2.2} />
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
            <AppIcon
              name="sparkles"
              size={14}
              strokeWidth={2.1}
              class="return-title-icon"
            />
            <span
              ><strong>Vítej zpět!</strong> Povedlo se ti dokončit skutek u partnera?</span
            >
          </div>
          {#if effectMeta?.returnBadge || effectMeta?.badge}
            <span class="impact-payoff-badge">
              <AppIcon
                name={effectMeta?.icon || "sparkles"}
                size={13}
                strokeWidth={2.1}
              />
              <span>{effectMeta.returnBadge || effectMeta.badge}</span>
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
          <AppIcon
            name="leaf"
            size={14}
            strokeWidth={2.1}
            class="affirmation-icon"
          />
          <span>Každý drobný krok má skutečný význam.</span>
        </div>
        <div class="return-dopamine-actions in-situ-actions">
          <button
            type="button"
            class="return-dopamine-btn btn-return-complete"
            on:click={() => onComplete && onComplete(action)}
          >
            <AppIcon name="check" size={14} strokeWidth={2.4} />
            <span>Ano, mám hotovo</span>
          </button>
          {#if onCloseSession}
            <button
              type="button"
              class="btn-session-close return-dopamine-svet-link"
              on:click={onCloseSession}
            >
              <AppIcon name="leaf" size={14} strokeWidth={2.1} />
              <span>Pro dnešek hotovo</span>
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
          target={action.url?.startsWith("tel:") ||
          action.url?.startsWith("mailto:")
            ? undefined
            : "_blank"}
          rel={action.url?.startsWith("tel:") ||
          action.url?.startsWith("mailto:")
            ? undefined
            : "noopener noreferrer"}
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
          <AppIcon
            name={getCtaIcon(categoryAura?.theme)}
            size={16}
            strokeWidth={2.1}
            class="cta-lead-icon"
          />
          <span
            >{action.id === "zvirata_utulek_online"
              ? "Nakrmit útulek teď"
              : action.cta || "Začít pomáhat"}</span
          >
          <AppIcon
            name="arrow-up-right"
            size={15}
            strokeWidth={2.3}
            class="cta-arrow-icon"
          />
        </a>

        {#if isStarted && !partnerReturnPromptVisible}
          <button
            type="button"
            class="btn-studio-done btn-done-action cta secondary done-btn"
            class:initiated={isStarted}
            on:click={() => onComplete && onComplete(action)}
          >
            <AppIcon name="check" size={15} strokeWidth={2.5} />
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
                <AppIcon
                  name={effectMeta?.icon || "sparkles"}
                  size={13}
                  strokeWidth={2.1}
                />
                <span>{effectMeta.badge}</span>
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
                <AppIcon name="sparkles" size={13} strokeWidth={2.1} />
                <span>Impuls</span>
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
                  <AppIcon
                    name={soundMuted ? "volume-x" : "volume-2"}
                    size={15}
                    strokeWidth={2.1}
                  />
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
     ŽIVÁ SCÉNA OČEKÁVÁNÍ (UNIFIED RADIANT SANCTUARY DIORAMA + NON-OVERLAPPING HUD)
     ========================================================================= */
  .deed-preview-stage {
    --spot-x: 50%;
    --spot-y: 34%;
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    margin: 0 0 0.65rem 0;
    border-radius: 16px;
    overflow: hidden;
    cursor: default;
    user-select: none;
    background:
      radial-gradient(
        88% 92% at 50% 24%,
        rgba(52, 211, 153, 0.28) 0%,
        rgba(251, 191, 36, 0.1) 44%,
        transparent 74%
      ),
      linear-gradient(180deg, #175239 0%, #103c29 48%, #082217 82%, #04130d 100%);
    border: 1px solid rgba(52, 211, 153, 0.42);
    box-shadow:
      0 12px 26px -12px rgba(4, 20, 13, 0.44),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    transition:
      border-color 0.24s ease,
      box-shadow 0.24s ease,
      transform 0.22s ease;
  }

  .deed-preview-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: radial-gradient(
      165px 110px at var(--spot-x) var(--spot-y),
      rgba(253, 230, 138, 0.38) 0%,
      rgba(251, 191, 36, 0.18) 48%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity 0.24s ease;
  }

  .deed-preview-stage.is-primed {
    border-color: rgba(251, 191, 36, 0.76);
    box-shadow:
      0 14px 30px -8px rgba(180, 120, 16, 0.28),
      0 0 0 2px rgba(251, 191, 36, 0.3),
      inset 0 1px 0 rgba(254, 243, 199, 0.36);
  }

  .deed-preview-stage.is-primed::after {
    opacity: 1;
  }

  .deed-preview-stage.is-nudged {
    transform: scale(0.994);
  }

  .preview-hud {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.42rem 0.52rem 0.08rem;
    background: transparent;
    border-bottom: none;
    pointer-events: none;
  }

  .preview-promise-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
    max-width: 68%;
    padding: 0.2rem 0.58rem;
    border-radius: 999px;
    background: rgba(4, 20, 14, 0.84);
    border: 1px solid rgba(253, 230, 138, 0.46);
    color: #fef3c7;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-promise-pill > span:last-child,
  .preview-status-pill > span:last-child,
  .personal-values-pill > span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .deed-preview-stage :global(.preview-promise-spark) {
    color: #fbbf24;
    flex-shrink: 0;
  }

  .preview-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    padding: 0.18rem 0.52rem;
    border-radius: 999px;
    background: rgba(5, 26, 18, 0.8);
    border: 1px solid rgba(52, 211, 153, 0.44);
    color: #d1fae5;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  .preview-status-pill.nudged {
    background: rgba(22, 18, 6, 0.86);
    border-color: rgba(253, 230, 138, 0.74);
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
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: 92px;
    background: transparent;
    pointer-events: none;
  }

  /* =========================================================================
     HLAVIČKA KARTY A OBSAH
     ========================================================================= */
  .action-meta-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: nowrap;
    overflow: hidden;
    font-size: 0.78rem;
    color: var(--ink-muted, #61786b);
    margin-bottom: 0.38rem;
  }

  .card-personal-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 0.38rem;
  }

  .quick-tags-pill {
    display: block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.28);
    color: #065f46;
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.005em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .directory-card .action-meta-line {
    gap: 0.28rem;
  }

  .directory-card .category-aura-chip {
    padding: 0.16rem 0.44rem;
    font-size: 0.68rem;
    letter-spacing: 0;
  }

  .directory-card .quick-tags-pill {
    padding: 0.15rem 0.4rem;
    font-size: 0.66rem;
    letter-spacing: 0;
  }

  .done-dot {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
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
    flex-shrink: 0;
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
    background: rgba(251, 191, 36, 0.17);
    border: 1px solid rgba(245, 158, 11, 0.36);
    color: #92400e;
  }

  .category-aura-wildlife {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #0f766e;
  }

  .category-aura-nature {
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--accent-primary, #1b5e42);
  }

  .category-aura-science {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
  }

  .category-aura-community {
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    color: #5b21b6;
  }

  .category-aura-care {
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(184, 101, 27, 0.28);
    color: #9a3412;
  }

  .category-aura-default {
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--accent-primary, #1b5e42);
  }

  .personal-values-pill {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.76rem;
    font-weight: 700;
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.78rem;
    gap: 0.32rem;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  }

  .personal-values-pill.active {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  .action-title {
    font-weight: 800;
    font-size: 1.28rem;
    line-height: 1.24;
    letter-spacing: -0.022em;
    color: var(--ink-primary, #14281d);
    margin: 0 0 0.4rem 0;
  }

  .action-desc {
    color: var(--ink-secondary, #3f574a);
    font-size: 0.93rem;
    line-height: 1.54;
    margin: 0 0 0.5rem 0;
  }

  .action-impact-summary {
    margin: 0 0 0.75rem 0;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.84rem;
    line-height: 1.48;
  }

  .impact-benefit-line {
    color: var(--ink-primary, #14281d);
  }

  .impact-benefit-line strong {
    color: var(--accent-primary, #1b5e42);
    margin-right: 0.25rem;
  }

  .detail-evidence-line {
    margin-bottom: 0.15rem;
  }

  .detail-impact-line {
    font-size: 0.79rem;
    line-height: 1.42;
    padding: 0.42rem 0.6rem;
    border-radius: 10px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
  }

  .partner-trust-line {
    display: block;
    font-size: 0.78rem;
    line-height: 1.44;
    color: var(--ink-muted, #61786b);
  }

  .partner-trust-line > span + span {
    margin-left: 0.25rem;
  }

  .partner-trust-line strong {
    color: var(--ink-primary, #14281d);
    font-weight: 700;
  }

  .how-toggle {
    margin: 0 0 0.45rem 0;
    font-size: 0.83rem;
    color: var(--ink-secondary, #3f574a);
  }

  .how-toggle summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.25rem;
    box-sizing: border-box;
    border-radius: 8px;
    transition: color 0.16s ease;
  }

  .how-toggle summary:hover {
    color: var(--accent-primary-hover, #144732);
  }

  .how-toggle summary::-webkit-details-marker {
    display: none;
  }

  .how-toggle summary :global(.how-toggle-chevron) {
    color: var(--accent-primary, #1b5e42);
    transition: transform 0.18s ease;
  }

  .how-toggle[open] summary :global(.how-toggle-chevron) {
    transform: rotate(90deg);
  }

  .how-steps {
    margin: 0.35rem 0 0 1.2rem;
    padding: 0;
    line-height: 1.5;
    color: var(--ink-secondary, #3f574a);
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
  }

  .impact-chain-row {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
    border-top: 1px dashed var(--border-strong, #c2cec5);
    display: block;
    font-size: 0.78rem;
    line-height: 1.48;
    color: var(--ink-secondary, #3f574a);
  }

  .chain-arrow {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    margin: 0 0.22rem;
    color: var(--accent-primary, #1b5e42);
  }

  .how-details-content {
    display: flex;
    flex-direction: column;
    gap: 0.48rem;
    margin-top: 0.35rem;
    padding: 0.7rem 0.8rem;
    border-radius: 14px;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
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
    min-height: 48px;
    padding: 0.8rem 1.15rem;
    box-sizing: border-box;
    border-radius: 14px;
    background: linear-gradient(135deg, #155339 0%, #1d6b49 52%, #16553a 100%);
    border: 1px solid rgba(52, 211, 153, 0.34);
    color: #ffffff;
    font-weight: 800;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
    text-decoration: none;
    box-shadow:
      0 10px 24px -6px rgba(14, 56, 38, 0.38),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      transform 0.16s ease,
      box-shadow 0.18s ease;
  }

  .btn-studio-primary::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.42), rgba(251, 191, 36, 0.48));
    transform-origin: left center;
    transform: scaleX(var(--spark-charge, 0));
    transition: transform 0.06s linear;
    pointer-events: none;
  }

  .btn-studio-primary:hover {
    transform: translateY(-1.5px);
    border-color: rgba(251, 191, 36, 0.58);
    box-shadow:
      0 14px 30px -6px rgba(14, 56, 38, 0.48),
      0 0 0 1px rgba(251, 191, 36, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.24);
  }

  .btn-studio-primary:active {
    transform: scale(0.985);
  }

  .btn-studio-primary.cta-nudged,
  :global(.btn-studio-primary.spark-ready) {
    box-shadow:
      0 14px 28px -4px rgba(16, 185, 129, 0.45),
      0 0 0 3px rgba(251, 191, 36, 0.65);
  }

  .btn-studio-primary :global(.cta-lead-icon) {
    color: #fde68a;
    flex-shrink: 0;
  }

  .btn-studio-primary :global(.cta-arrow-icon) {
    color: #a7f3d0;
    flex-shrink: 0;
    transition: transform 0.18s ease, color 0.18s ease;
  }

  .btn-studio-primary:hover :global(.cta-arrow-icon) {
    transform: translate(2px, -2px);
    color: #fde68a;
  }

  .btn-studio-done {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.38rem;
    min-height: 48px;
    padding: 0.8rem 1rem;
    box-sizing: border-box;
    border-radius: 14px;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: background-color 0.18s ease, color 0.18s ease;
  }

  .btn-studio-done:hover,
  .btn-studio-done.initiated {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  /* =========================================================================
     FYZIKÁLNÍ SCÉNA DOPADU A IN-SITU OSLAVA (DAYLIGHT EDITORIAL)
     ========================================================================= */
  .card-effect-stage {
    position: relative;
    margin: 0.5rem 0 0.55rem;
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--ink-primary, #14281d);
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
  }

  .card-effect-head {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.36rem 0.58rem;
    background: var(--bg-subtle, #edf2ee);
    border-bottom: 1px solid var(--border-subtle, #dce3dd);
  }

  .card-effect-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
  }

  .card-effect-stage .impact-payoff-badge {
    background: var(--accent-warm-tint, #fef6e8);
    color: #8f4b0e;
    border: 1px solid rgba(184, 101, 27, 0.28);
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
    gap: 0.26rem;
    padding: 0.42rem 0.78rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-surface, #ffffff);
    color: var(--ink-primary, #14281d);
    font-family: var(--font-sans);
    font-size: 0.73rem;
    font-weight: 700;
    line-height: 1.2;
    cursor: pointer;
    transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
    white-space: nowrap;
  }

  .effect-spark-btn:hover,
  .effect-spark-btn.active,
  .sound-mute-btn:hover {
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    border-color: var(--accent-primary, #1b5e42);
  }

  .impact-payoff-canvas {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 118px;
    background: #14281d;
    border: none;
    border-radius: 0;
    cursor: pointer;
    touch-action: manipulation;
  }

  .card-effect-stage,
  .celebration-card,
  .return-dopamine-strip {
    animation: payoffSlideDown 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes payoffSlideDown {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
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
    padding: 0.85rem 0.95rem;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 16px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-strong, #c2cec5);
    color: var(--ink-primary, #14281d);
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    font-size: 0.84rem;
    line-height: 1.4;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
  }

  .celebration-card .impact-payoff-canvas,
  .return-dopamine-strip .impact-payoff-canvas {
    border-radius: 12px;
    border: 1px solid var(--border-subtle, #dce3dd);
  }

  .inline-celebration-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .inline-celebration-card .kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-primary, #1b5e42);
  }

  .inline-celebration-card .win-title {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 800;
    color: var(--ink-primary, #14281d);
  }

  .return-dopamine-title {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--ink-primary, #14281d);
  }

  .return-dopamine-title :global(.return-title-icon) {
    color: var(--accent-warm, #b8651b);
    flex-shrink: 0;
  }

  .impact-payoff-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.18rem 0.52rem;
    border-radius: 999px;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(184, 101, 27, 0.28);
    color: #8f4b0e;
  }

  .molly-celebration-note :global(.badge-paw-svg),
  .molly-celebration-note :global(.molly-note-paw-svg) {
    color: var(--accent-warm, #b8651b);
    display: inline-block;
    vertical-align: -2px;
    margin-right: 0.2rem;
  }

  .in-situ-affirmation,
  .molly-celebration-note {
    font-size: 0.82rem;
    color: var(--ink-primary, #14281d);
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
    margin: 0.25rem 0;
    line-height: 1.42;
  }

  .in-situ-affirmation {
    display: flex;
    align-items: flex-start;
    gap: 0.42rem;
  }

  .in-situ-affirmation :global(.affirmation-icon) {
    color: var(--accent-primary, #1b5e42);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .molly-svet-inline-link {
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .return-dopamine-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.45rem;
  }

  .return-dopamine-btn {
    appearance: none;
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    text-decoration: none;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.36rem;
    box-sizing: border-box;
    scroll-margin-top: 75px;
    scroll-margin-bottom: 75px;
    transition: background-color 0.16s ease, border-color 0.16s ease;
  }

  .return-dopamine-btn:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  .btn-session-close {
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
  }

  .btn-session-close:hover {
    background: #e1eae4;
    border-color: var(--accent-primary, #1b5e42);
  }

  .return-dopamine-svet-link {
    color: var(--ink-primary, #14281d);
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    box-sizing: border-box;
    cursor: pointer;
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-strong, #c2cec5);
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
  }

  .inline-celebration-next {
    border: 1px solid var(--accent-primary, #1b5e42);
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    padding: 0.5rem 1rem;
    font-family: inherit;
    font-weight: 700;
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
    border-top: 1px dashed var(--border-strong, #c2cec5);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem 0.5rem;
    flex-wrap: wrap;
    font-size: 0.73rem;
    line-height: 1.4;
    color: var(--ink-muted, #61786b);
    text-align: left;
  }

  .verify-meta,
  .mde-verify {
    display: inline-block;
    min-width: 0;
    max-width: 100%;
    font-size: 0.73rem;
    line-height: 1.4;
    color: var(--ink-muted, #61786b);
    text-align: left;
    overflow-wrap: anywhere;
  }

  .verify-meta strong,
  .mde-verify strong {
    color: var(--ink-primary, #14281d);
    font-weight: 700;
  }

  .verify-source-link {
    display: inline-flex;
    align-items: center;
    gap: 0.18rem;
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
    text-decoration: none;
  }

  .verify-source-link:hover {
    color: var(--accent-primary-hover, #144732);
    text-decoration: underline;
  }

  .verify-footer-actions,
  .mde-row {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .direct-link-share-btn,
  .mde-share-btn {
    appearance: none;
    background: none;
    border: none;
    padding: 0.2rem 0.25rem;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    box-sizing: border-box;
    color: var(--accent-primary, #1b5e42);
    font-family: var(--font-sans);
    font-size: 0.75rem;
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
    padding: 0.2rem 0.25rem;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    color: var(--ink-muted, #61786b);
    font-family: var(--font-sans);
    font-size: 0.74rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .broken-link-btn:hover {
    color: var(--accent-warm, #b8651b);
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
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 18px;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 42, 30, 0.05));
    padding: 0.95rem 1.1rem;
    display: flex;
    flex-direction: column;
    transition:
      transform 0.22s var(--ease-gentle, ease),
      box-shadow 0.22s var(--ease-gentle, ease),
      border-color 0.22s ease;
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
    transform: translateY(-2px);
    box-shadow: var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
    border-color: var(--accent-primary, #1b5e42);
  }

  .card.spotlight {
    border: 1.5px solid var(--accent-warm, #b8651b);
    box-shadow:
      0 0 0 3px var(--accent-warm-tint, #fef6e8),
      var(--shadow-md, 0 8px 20px -6px rgba(18, 42, 30, 0.08));
  }

  @media (max-width: 680px) {
    .mde-share-btn,
    .mde-broken-btn {
      min-height: 44px;
      min-width: 44px;
      padding: 0.25rem 0.35rem;
    }
    .card.directory-card {
      padding: 0.75rem 0.85rem;
      border-radius: 16px;
    }

    .instant-body {
      gap: 0.22rem;
    }

    .deed-preview-stage {
      height: auto;
      margin: 0 0 0.18rem 0;
      border-radius: 13px;
      box-shadow: none;
    }

    .preview-hud {
      padding: 0.2rem 0.34rem 0.04rem;
      gap: 0.25rem;
    }

    .preview-promise-pill {
      max-width: 100%;
      padding: 0.14rem 0.46rem;
      font-size: 0.66rem;
    }

    .preview-status-pill {
      display: none;
    }

    .preview-status-pill.nudged {
      display: inline-flex;
      padding: 0.12rem 0.4rem;
      font-size: 0.62rem;
    }

    .preview-diorama-canvas {
      height: 50px;
    }

    .action-meta-line {
      font-size: 0.69rem;
      gap: 0.28rem;
      margin-bottom: 0.08rem;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    .card-personal-row {
      margin-bottom: 0.14rem;
    }

    .category-aura-chip {
      padding: 0.13rem 0.44rem;
      font-size: 0.67rem;
      gap: 0.2rem;
    }

    .quick-tags-pill {
      padding: 0.12rem 0.44rem;
      font-size: 0.66rem;
    }

    .personal-values-pill {
      min-height: 44px;
      padding: 0.3rem 0.65rem;
      font-size: 0.72rem;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .action-title {
      font-size: 1.03rem;
      line-height: 1.2;
      margin: 0.04rem 0 0.1rem 0;
      overflow-wrap: break-word;
    }

    .action-desc {
      font-size: 0.81rem;
      line-height: 1.35;
      margin: 0 0 0.08rem 0;
      overflow-wrap: break-word;
    }

    .action-impact-summary {
      margin: 0 0 0.14rem 0;
      padding-top: 0.28rem;
      gap: 0.14rem;
      font-size: 0.78rem;
      line-height: 1.34;
    }

    .partner-trust-line {
      font-size: 0.73rem;
    }

    .how-toggle {
      margin: 0;
      padding: 0;
      border-radius: 10px;
    }

    .how-toggle summary {
      font-size: 0.78rem;
      min-height: 44px;
      padding: 0.3rem 0.2rem;
      box-sizing: border-box;
    }

    .card-effect-stage {
      margin: 0.28rem 0 0.32rem;
      border-radius: 14px;
    }

    .celebration-card,
    .return-dopamine-strip {
      padding: 0.65rem 0.78rem;
      gap: 0.35rem;
    }

    .in-situ-affirmation,
    .molly-celebration-note {
      padding: 0.4rem 0.6rem;
      margin: 0.22rem 0;
      font-size: 0.77rem;
      line-height: 1.34;
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
      padding: 0.28rem 0.45rem;
    }

    .card-effect-stage .impact-payoff-badge {
      font-size: 0.66rem;
      padding: 0.16rem 0.45rem;
    }

    .effect-spark-btn,
    .sound-mute-btn {
      font-size: 0.69rem;
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
      font-size: 0.82rem;
      border-radius: 12px;
    }
  }

  @media (max-width: 680px) and (max-height: 700px) {
    .deed-preview-stage {
      margin-bottom: 0.14rem;
    }

    .preview-hud {
      padding: 0.16rem 0.32rem 0.02rem;
    }

    .preview-promise-pill {
      padding: 0.12rem 0.42rem;
      font-size: 0.63rem;
    }

    .preview-diorama-canvas {
      height: 46px;
    }
  }
</style>
