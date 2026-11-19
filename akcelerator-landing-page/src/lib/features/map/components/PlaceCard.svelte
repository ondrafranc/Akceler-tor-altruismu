<script>
  import { buildFirstContactTemplate } from "../../../data/czech-actions.js";
  import {
    isSelfServicePoint,
    getPlaceActionHint,
  } from "../services/contactTemplates.js";
  import {
    sanitizeHttpUrl as normalizeUrl,
    sanitizePhone,
  } from "../../../validation.js";
  import { getActionEffectMeta } from "../../../sensory/catalog/catalogResolver.js";
  import { impactCanvas } from "../../../sensory/canvas/impactCanvasAction.js";
  import { holdSpark } from "../../../sensory/interaction/holdSpark.js";
  import AppIcon from "$lib/components/AppIcon.svelte";

  /**
   * @typedef {import('$lib/server/nearbyService.js').NearbyPlace & Record<string, unknown>} PlaceItem
   */

  /**
   * @type {{
   *   p: PlaceItem,
   *   idx?: number,
   *   isActive?: boolean,
   *   isTopPick?: boolean,
   *   isStarted?: boolean,
   *   soundMuted?: boolean,
   *   activeEffectPlaceId?: string | null,
   *   openTemplateId?: string | null,
   *   copiedTemplateId?: string | null,
   *   copiedPlaceLinkId?: string | null,
   *   placeMetric?: number,
   *   onMouseEnter?: ((...args: unknown[]) => void) | null,
   *   onMouseLeave?: ((...args: unknown[]) => void) | null,
   *   onStart?: ((place: PlaceItem) => void) | null,
   *   onDone?: ((place: PlaceItem) => void) | null,
   *   onToggleEffect?: ((place: PlaceItem, event?: Event) => void) | null,
   *   onToggleSound?: (() => void) | null,
   *   onFocusMap?: ((place: PlaceItem) => void) | null,
   *   onShare?: ((place: PlaceItem) => void) | null,
   *   onToggleTemplate?: ((place: PlaceItem) => void) | null,
   *   onCopyTemplate?: ((place: PlaceItem) => void) | null
   * }}
   */
  let {
    p,
    idx = 0,
    isActive = false,
    isTopPick = false,
    isStarted = false,
    soundMuted = false,
    activeEffectPlaceId = null,
    openTemplateId = null,
    copiedTemplateId = null,
    copiedPlaceLinkId = null,
    placeMetric = 0,
    onMouseEnter = null,
    onMouseLeave = null,
    onStart = null,
    onDone = null,
    onToggleEffect = null,
    onToggleSound = null,
    onFocusMap = null,
    onShare = null,
    onToggleTemplate = null,
    onCopyTemplate = null,
  } = $props();

  let localPlaceMetric = $state(0);

  const KIND_META = {
    ngo: { icon: "building", label: "Neziskovka / spolek", color: "#1b5e42" },
    community: {
      icon: "handshake",
      label: "Komunita / knihobudka",
      color: "#0f766e",
    },
    food: { icon: "utensils", label: "Potraviny a šatník", color: "#8f4b0e" },
    animals: { icon: "paw", label: "Zvířata a útulek", color: "#2c5282" },
  };

  const HELP_WAY_META = {
    food_donation: { icon: "utensils", label: "Darovat potraviny" },
    material_dropoff: { icon: "package", label: "Přinést věci / knihy" },
    one_off_help: { icon: "zap", label: "Jednorázová výpomoc" },
    regular_volunteering: { icon: "handshake", label: "Dobrovolnictví" },
  };

  const VISIT_MODE_META = {
    drop_in: { icon: "circle-check", label: "Volně přístupné bez domlouvání" },
    opening_hours: { icon: "clock", label: "Otevírací doba" },
    by_agreement: { icon: "calendar", label: "Po domluvě" },
  };

  function formatDist(km) {
    if (!Number.isFinite(km)) return "";
    if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
    return `${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} km`;
  }

  function getPlaceVisitMode(place) {
    if (place?.visitMode) return place.visitMode;
    if (isSelfServicePoint(place)) return "drop_in";
    if (place?.openingHours) return "opening_hours";
    return "by_agreement";
  }

  function getPlaceHelpWays(place) {
    if (Array.isArray(place?.helpWays) && place.helpWays.length > 0)
      return place.helpWays;
    const ways = [];
    if (place?.kind === "food") ways.push("food_donation");
    if (place?.kind === "community") ways.push("material_dropoff");
    if (place?.kind === "ngo" || place?.kind === "animals") {
      ways.push("one_off_help", "regular_volunteering");
    }
    return ways.length ? ways : ["one_off_help"];
  }

  const meta = $derived(KIND_META[p?.kind] || KIND_META.ngo);
  const webUrl = $derived(p?.website ? normalizeUrl(p.website) : "");
  const selfService = $derived(isSelfServicePoint(p));
  const visitMode = $derived(
    VISIT_MODE_META[getPlaceVisitMode(p)] || VISIT_MODE_META.by_agreement,
  );
  const helpWays = $derived(getPlaceHelpWays(p));
  const placeAction = $derived({
    id: p?.id,
    title: p?.name || "Místo pomoci",
    category: p?.kind || "ngo",
    subcategory: p?.subcategory || "",
  });
  const cardId = $derived(
    `place-card-${String(p?.id || "").replace(/[^a-zA-Z0-9_-]/g, "-")}`,
  );
  const tpl = $derived(p ? buildFirstContactTemplate(p) : null);
  const safePhone = $derived(sanitizePhone(p?.phone));
  const mapyPlaceUrl = $derived(
    `https://mapy.cz/zakladni?x=${p?.lon}&y=${p?.lat}&z=17&q=${encodeURIComponent(p?.name || "")}`,
  );
  const showMapyQuick = $derived(Boolean(webUrl || !selfService));
  const showTemplateQuick = $derived(Boolean(webUrl && !selfService && tpl));
  const hasQuickContacts = $derived(
    Boolean(safePhone || tpl?.mailtoUrl || showMapyQuick || showTemplateQuick),
  );
  const effectiveMetric = $derived(localPlaceMetric || placeMetric || 0);
  const effectMeta = $derived(getActionEffectMeta(placeAction, effectiveMetric));
</script>

{#if p}
  <article
    id={cardId}
    class="place-card"
    data-molly-guide={idx === 0 ? "true" : undefined}
    class:active={isActive}
    class:top-pick={isTopPick}
    onmouseenter={onMouseEnter}
    onmouseleave={onMouseLeave}
  >
    <div class="pc-meta-top">
      <span class="pc-cat">
        <AppIcon name={meta.icon} size={13} />
        <span>{p.subcategory || meta.label}</span>
      </span>
      <span class="pc-sep" aria-hidden="true">·</span>
      <span class="pc-dist">{formatDist(p.distanceKm)}</span>
      <span class="pc-sep" aria-hidden="true">·</span>
      {#if p.curated || p.sourceType === "verified_org"}
        <span class="pc-verified" title="Ručně ověřená organizace v ČR">
          <AppIcon name="shield-check" size={13} />
          <span>Ověřená organizace · Ověřeno {p.verifiedAt || "11/2026"}</span>
        </span>
      {:else if p.sourceType === "community"}
        <span class="pc-community-badge" title="Sousedský komunitní tip">
          <AppIcon name="sprout" size={13} />
          <span>Komunitní tip</span>
        </span>
        {#if p.pendingModeration}
          <span class="pc-sep" aria-hidden="true">·</span>
          <span
            class="pc-pending-badge"
            title="Tvůj tip čeká na schválení moderátorem"
          >
            <AppIcon name="hourglass" size={13} />
            <span>Čeká na schválení</span>
          </span>
        {/if}
      {:else}
        <span
          class="pc-osm-badge"
          title="Orientační bod z veřejné mapy OpenStreetMap"
        >
          <AppIcon name="map" size={13} />
          <span>Orientační bod OSM</span>
        </span>
      {/if}
    </div>

    <h2 class="pc-title">{p.name}</h2>

    {#if p.address}
      <div class="pc-addr">
        <AppIcon name="map-pin" size={13} />
        <span>{p.address}</span>
      </div>
    {/if}

    {#if p.description}
      <p class="pc-desc">{p.description}</p>
    {/if}

    <!-- STRUCTURED DECISION CONTEXT: JAK TU MŮŽEŠ POMOCT -->
    <div class="pc-decision-box">
      <div class="pcd-chips">
        <span class="pcd-visit-badge">
          <AppIcon name={visitMode.icon} size={12} />
          <span>{visitMode.label}</span>
        </span>
        {#each helpWays as hw}
          {#if HELP_WAY_META[hw]}
            <span class="pcd-way-chip">
              <AppIcon name={HELP_WAY_META[hw].icon} size={12} />
              <span>{HELP_WAY_META[hw].label}</span>
            </span>
          {/if}
        {/each}
      </div>
      <p class="pcd-mission">
        <strong>Jak tu můžeš pomoct:</strong>
        {getPlaceActionHint(p)}
      </p>
    </div>

    <div class="pc-actions">
      {#if webUrl}
        <a
          href={webUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="pc-btn primary"
          use:holdSpark={{ id: p.id, surface: "near_place" }}
          onclick={() => onStart?.(p)}
        >
          <span>Web</span>
          <AppIcon name="arrow-up-right" size={14} />
        </a>
      {:else if selfService}
        <a
          href={mapyPlaceUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="pc-btn primary"
          use:holdSpark={{ id: p.id, surface: "near_place" }}
          onclick={() => onStart?.(p)}
        >
          <AppIcon name="compass" size={14} />
          <span>Navigovat (Mapy.cz)</span>
          <AppIcon name="arrow-up-right" size={14} />
        </a>
      {:else}
        <button
          type="button"
          class="pc-btn msg"
          aria-expanded={openTemplateId === p.id}
          onclick={() => onToggleTemplate?.(p)}
        >
          <AppIcon name="message-circle" size={14} />
          <span>{openTemplateId === p.id ? "Skrýt zprávu" : "Co napsat"}</span>
        </button>
      {/if}

      {#if isStarted}
        <button
          type="button"
          class="pc-btn done"
          class:initiated={isStarted}
          onclick={() => onDone?.(p)}
        >
          <AppIcon name="check" size={14} />
          <span>Mám hotovo</span>
        </button>
      {/if}
    </div>

    {#if hasQuickContacts}
      <div class="pc-quick-contacts" role="group" aria-label="Rychlý kontakt a mapa">
        {#if safePhone}
          <a
            href={`tel:${safePhone.replace(/[^\d+]/g, "")}`}
            class="pc-quick-btn"
            onclick={() => onStart?.(p)}
          >
            <AppIcon name="phone" size={14} />
            <span>Zavolat</span>
          </a>
        {/if}
        {#if tpl?.mailtoUrl}
          <a
            href={tpl.mailtoUrl}
            class="pc-quick-btn"
            onclick={() => onStart?.(p)}
          >
            <AppIcon name="mail" size={14} />
            <span>E-mail</span>
          </a>
        {/if}
        {#if showMapyQuick}
          <a
            href={mapyPlaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="pc-quick-btn"
            onclick={() => onStart?.(p)}
          >
            <AppIcon name="compass" size={14} />
            <span>Mapy.cz</span>
            <AppIcon name="arrow-up-right" size={13} />
          </a>
        {/if}
        {#if showTemplateQuick}
          <button
            type="button"
            class="pc-quick-btn"
            aria-expanded={openTemplateId === p.id}
            onclick={() => onToggleTemplate?.(p)}
          >
            <AppIcon name="message-circle" size={14} />
            <span>{openTemplateId === p.id ? "Skrýt zprávu" : "Co napsat"}</span>
          </button>
        {/if}
      </div>
    {/if}

    {#if isStarted}
      <div
        class="card-effect-stage"
        data-scene={effectMeta?.scene || "default"}
      >
        <div class="card-effect-head">
          <span class="impact-payoff-badge">
            {#if effectMeta?.icon}
              <AppIcon name={effectMeta.icon} size={13} />
            {/if}
            <span>{effectMeta?.badge || ""}</span>
          </span>
          <div class="card-effect-controls">
            <button
              type="button"
              class="effect-spark-btn"
              class:active={activeEffectPlaceId === p.id}
              aria-pressed={activeEffectPlaceId === p.id}
              aria-label="Vyzkoušet interaktivní fyzikální a zvukový efekt místa"
              title="Spustit vlnu dopadu na plátně"
              onclick={(e) => onToggleEffect?.(p, e)}
            >
              <AppIcon name="sparkles" size={13} />
              <span>Přehrát</span>
            </button>
            {#if onToggleSound}
              <button
                type="button"
                class="sound-mute-btn"
                onclick={() => onToggleSound?.()}
                aria-pressed={soundMuted}
                aria-label={soundMuted
                  ? "Zapnout jemné zvuky"
                  : "Ztlumit zvuky"}
                title={soundMuted ? "Zapnout jemné zvuky" : "Ztlumit zvuky"}
              >
                <AppIcon
                  name={soundMuted ? "volume-x" : "volume-2"}
                  size={14}
                />
              </button>
            {/if}
          </div>
        </div>
        <canvas
          class="impact-payoff-canvas"
          width="320"
          height="68"
          aria-label="Fyzikální vizualizace dopadu dobrého skutku"
          use:impactCanvas={{
            action: placeAction,
            climax: false,
            onProgress: (v) => {
              localPlaceMetric = v;
            },
          }}
        ></canvas>
      </div>
    {/if}

    {#if openTemplateId === p.id && !selfService && tpl}
      <div class="template-drawer">
        <div class="td-head">
          <strong>Vzor krátké zprávy:</strong>
          {#if safePhone}
            <span class="td-phone">
              <AppIcon name="phone" size={13} />
              <a
                href={`tel:${safePhone.replace(/[^\d+]/g, "")}`}
                onclick={() => onStart?.(p)}>{safePhone}</a
              >
            </span>
          {/if}
        </div>
        <pre class="td-body">{tpl.body}</pre>
        <div class="td-btns">
          <button
            type="button"
            class="pc-btn primary"
            onclick={() => onCopyTemplate?.(p)}
          >
            <AppIcon
              name={copiedTemplateId === p.id ? "check" : "copy"}
              size={14}
            />
            <span
              >{copiedTemplateId === p.id
                ? "Zkopírováno"
                : "Zkopírovat text"}</span
            >
          </button>
          {#if tpl.mailtoUrl}
            <a
              href={tpl.mailtoUrl}
              class="pc-btn ghost"
              onclick={() => onStart?.(p)}
            >
              <AppIcon name="mail" size={14} />
              <span>E-mail</span>
            </a>
          {/if}
          <a
            href={mapyPlaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="pc-btn ghost"
            onclick={() => onStart?.(p)}
          >
            <AppIcon name="compass" size={14} />
            <span>Mapy.cz</span>
            <AppIcon name="arrow-up-right" size={14} />
          </a>
        </div>
      </div>
    {/if}

    <div class="pc-verify-footer">
      <span>
        {#if p.curated || p.sourceType === "verified_org"}
          Zdroj: Ověřený katalog ({p.verifiedAt || "11/2026"})
        {:else if p.sourceType === "community"}
          Zdroj: Komunitní tip v okolí
        {:else}
          Zdroj: OpenStreetMap ČR — před návštěvou doporučujeme ověřit otevírací
          dobu
        {/if}
      </span>
      <span class="pc-footer-links">
        {#if onFocusMap}
          <button
            type="button"
            class="pc-report-btn"
            onclick={() => onFocusMap(p)}
          >
            <AppIcon name="map-pin" size={13} />
            <span>Na mapě</span>
          </button>
        {/if}
        {#if onShare}
          <button
            type="button"
            class="pc-report-btn pc-share-btn"
            onclick={() => onShare(p)}
          >
            <AppIcon
              name={copiedPlaceLinkId === p.id ? "check" : "share-2"}
              size={13}
            />
            <span
              >{copiedPlaceLinkId === p.id
                ? "Odkaz zkopírován"
                : "Sdílet místo"}</span
            >
          </button>
        {/if}
      </span>
    </div>
  </article>
{/if}

<style>
  .place-card {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 16px;
    padding: 1.1rem 1.2rem;
    box-shadow: var(--shadow-sm);
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease;
    display: flex;
    flex-direction: column;
    max-width: 100%;
    box-sizing: border-box;
    overflow-wrap: break-word;
  }

  .place-card:hover,
  .place-card.active {
    border-color: var(--accent-primary, #1b5e42);
    box-shadow: var(--shadow-md);
  }

  .place-card.top-pick {
    border-color: var(--accent-primary, #1b5e42);
    box-shadow: var(--shadow-md);
  }

  .pc-meta-top {
    display: flex;
    align-items: center;
    gap: 0.25rem 0.35rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: var(--ink-muted, #61786b);
    margin-bottom: 0.4rem;
  }

  .pc-cat,
  .pc-dist,
  .pc-verified,
  .pc-community-badge,
  .pc-pending-badge,
  .pc-osm-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    max-width: 100%;
  }

  .pc-sep {
    color: var(--ink-muted, #61786b);
  }

  .pc-cat {
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
  }

  .pc-dist {
    font-weight: 700;
    color: var(--ink-primary, #14281d);
  }

  .pc-verified {
    color: var(--accent-primary, #1b5e42);
    font-weight: 600;
  }

  .pc-community-badge {
    color: #0f766e;
    font-weight: 600;
  }

  .pc-pending-badge {
    color: #8f4b0e;
    font-weight: 600;
  }

  .pc-osm-badge {
    color: var(--ink-secondary, #3f574a);
    font-weight: 600;
  }

  .pc-title {
    margin: 0 0 0.35rem 0;
    font-size: 1.12rem;
    font-weight: 700;
    color: var(--ink-primary, #14281d);
  }

  .pc-addr {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: var(--ink-muted, #61786b);
    margin-bottom: 0.55rem;
  }

  .pc-desc {
    font-size: 0.88rem;
    line-height: 1.5;
    color: var(--ink-secondary, #3f574a);
    margin: 0 0 0.75rem 0;
  }

  .pc-decision-box {
    background: var(--bg-subtle, #edf2ee);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    margin-bottom: 0.85rem;
  }

  .pcd-chips {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }

  .pcd-visit-badge,
  .pcd-way-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.52rem;
    border-radius: 999px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    color: var(--ink-primary, #14281d);
  }

  .pcd-mission {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.42;
    color: var(--ink-primary, #14281d);
  }

  .pcd-mission strong {
    color: var(--accent-primary, #1b5e42);
  }

  .pc-actions {
    display: flex;
    gap: 0.55rem;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .pc-quick-contacts {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }

  .pc-quick-btn {
    appearance: none;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    min-height: 44px;
    min-width: 44px;
    padding: 0.42rem 0.78rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-surface, #ffffff);
    color: var(--accent-primary, #1b5e42);
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    box-sizing: border-box;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .pc-quick-btn:hover {
    background: var(--bg-subtle, #edf2ee);
    border-color: var(--accent-primary, #1b5e42);
  }

  .pc-btn {
    appearance: none;
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 700;
    min-height: 44px;
    min-width: 44px;
    padding: 0.5rem 0.95rem;
    border-radius: 12px;
    border: 1px solid var(--border-subtle, #dce3dd);
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-sizing: border-box;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .pc-btn.primary {
    background: var(--accent-primary, #1b5e42);
    border-color: var(--accent-primary, #1b5e42);
    color: #ffffff;
  }

  .pc-btn.primary:hover {
    background: var(--accent-primary-hover, #144732);
    border-color: var(--accent-primary-hover, #144732);
  }

  .pc-btn.msg {
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    border-color: var(--border-strong, #c2cec5);
  }

  .pc-btn.msg:hover {
    border-color: var(--accent-primary, #1b5e42);
  }

  .pc-btn.done {
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    border-color: var(--border-strong, #c2cec5);
  }

  .pc-btn.done.initiated {
    background: var(--bg-subtle, #edf2ee);
    border-color: var(--accent-primary, #1b5e42);
    color: var(--accent-primary, #1b5e42);
  }

  .pc-btn.ghost {
    background: var(--bg-surface, #ffffff);
    color: var(--ink-secondary, #3f574a);
    border-color: var(--border-subtle, #dce3dd);
  }

  .pc-btn.ghost:hover {
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
  }

  .effect-spark-btn,
  .sound-mute-btn {
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
  }

  .template-drawer {
    margin-top: 0.55rem;
    padding: 0.75rem;
    background: var(--bg-subtle, #edf2ee);
    border-radius: 12px;
    border: 1px solid var(--border-subtle, #dce3dd);
  }

  .td-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.78rem;
    margin-bottom: 0.35rem;
  }

  .td-phone {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .td-phone a {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    color: var(--accent-primary, #1b5e42);
    font-weight: 700;
  }

  .td-body {
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #dce3dd);
    border-radius: 8px;
    padding: 0.65rem;
    font-family: inherit;
    font-size: 0.78rem;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0 0 0.55rem 0;
  }

  .td-btns {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .pc-verify-footer {
    margin-top: auto;
    padding-top: 0.55rem;
    border-top: 1px solid var(--border-subtle, #dce3dd);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    font-size: 0.72rem;
    color: var(--ink-muted, #61786b);
    flex-wrap: wrap;
  }

  .pc-footer-links {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .pc-report-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.7rem;
    border-radius: 10px;
    border: 1px solid var(--border-subtle, #dce3dd);
    background: var(--bg-subtle, #edf2ee);
    font-family: inherit;
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--accent-primary, #1b5e42);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    text-decoration: none;
    box-sizing: border-box;
  }

  .pc-report-btn:hover {
    border-color: var(--accent-primary, #1b5e42);
    background: var(--bg-surface, #ffffff);
  }

  @media (max-width: 680px) {
    .place-card {
      padding: 0.78rem 0.85rem;
      border-radius: 14px;
    }

    .pc-meta-top {
      font-size: 0.72rem;
      margin-bottom: 0.25rem;
      flex-wrap: wrap;
    }

    .pc-title {
      font-size: 0.98rem;
      margin: 0 0 0.2rem;
    }

    .pc-addr {
      font-size: 0.74rem;
      margin-bottom: 0.25rem;
    }

    .pc-desc {
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 0.78rem;
      line-height: 1.35;
      margin-bottom: 0.38rem;
    }

    .pc-decision-box {
      padding: 0.42rem 0.58rem;
      margin-bottom: 0.42rem;
    }

    .pcd-chips {
      gap: 0.25rem;
      margin-bottom: 0.2rem;
    }

    .pcd-mission {
      font-size: 0.75rem;
      line-height: 1.32;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .pc-verify-footer {
      margin-top: 0.35rem;
      padding-top: 0.35rem;
      font-size: 0.68rem;
    }
  }
</style>
