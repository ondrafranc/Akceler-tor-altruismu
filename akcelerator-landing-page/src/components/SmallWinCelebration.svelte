<script>
  import {
    activeCelebration,
    closeCelebration,
    SANCTUARY_ELEMENTS,
  } from "../lib/progress.js";
  import { trackEvent } from "../lib/analytics.js";
  import { impactCanvas } from "../lib/sensory/canvas/impactCanvasAction.js";
  import { getActionEffectMeta } from "../lib/sensory/catalog/catalogResolver.js";
  import { playPayoffAsmr } from "../lib/audio/presets.js";
  import { feedMolly, mollyState } from "../lib/mollyStore.js";
  import { cleanTitle } from "../lib/utils.js";
  import AppIcon from "$lib/components/AppIcon.svelte";

  let restingMode = false;
  let sharedCopied = false;
  let impactMetricValue = 0;
  let lastCelebratedKey = "";
  let fedThisCelebration = false;

  $: if ($activeCelebration) {
    restingMode = false;
    sharedCopied = false;
    const key = `${$activeCelebration.id || ""}:${$activeCelebration.title || ""}`;
    if (key !== lastCelebratedKey) {
      lastCelebratedKey = key;
      impactMetricValue = 0;
      fedThisCelebration = false;
      playPayoffAsmr($activeCelebration);
    }
  } else {
    lastCelebratedKey = "";
    fedThisCelebration = false;
  }

  $: activeElementMeta = $activeCelebration
    ? SANCTUARY_ELEMENTS.find((e) => e.key === $activeCelebration.element) ||
      SANCTUARY_ELEMENTS[0]
    : SANCTUARY_ELEMENTS[0];

  $: effectMeta = $activeCelebration
    ? getActionEffectMeta($activeCelebration, impactMetricValue)
    : null;

  function handleStopHere() {
    restingMode = true;
    trackEvent("aa_after_done_choice", { choice: "stop_here" });
  }

  function handleContinue() {
    trackEvent("aa_after_done_choice", { choice: "one_more" });
    closeCelebration();
  }

  function handleFeedMolly() {
    if (!$activeCelebration || fedThisCelebration) return;
    const res = feedMolly("celebration", {
      action: $activeCelebration,
      silent: false,
    });
    if (res?.success) {
      fedThisCelebration = true;
      trackEvent("aa_molly_celebration_fed", {
        actionId: $activeCelebration.id,
      });
    }
  }

  function handleGoToWorld() {
    trackEvent("aa_after_done_choice", { choice: "enter_world" });
    closeCelebration();
  }

  async function handleShareWithFriend() {
    if (!$activeCelebration) return;
    const shareTitle = cleanTitle(
      $activeCelebration.title || "Malý dobrý skutek",
    );
    const baseOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://akcelerator-altruismu.cz";
    const actionId =
      $activeCelebration.id && $activeCelebration.id !== "step"
        ? $activeCelebration.id
        : "";
    const shareUrl = actionId
      ? `${baseOrigin}/?action=${encodeURIComponent(actionId)}`
      : baseOrigin;
    const shareText = `Tip na jednoduchou pomoc, která zabere jen chvilku („${shareTitle}“): ${shareUrl}`;

    trackEvent("aa_after_done_choice", { choice: "share_friend" });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Akcelerátor altruismu",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {}
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        sharedCopied = true;
        setTimeout(() => (sharedCopied = false), 2500);
      } catch {}
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && $activeCelebration) {
      closeCelebration();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $activeCelebration}
  <div
    class="celebration-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="win-title"
  >
    <div class="celebration-card">
      {#if !restingMode}
        <div class="win-overline">
          <AppIcon name={activeElementMeta.icon} size={14} strokeWidth={2} />
          <span>Klidné poděkování</span>
        </div>
        <h3 id="win-title" class="win-title">
          {cleanTitle($activeCelebration.title)}
        </h3>
        <div
          class="win-sensory-stage card-effect-stage"
          data-scene={effectMeta?.scene || "light"}
        >
          <div class="win-sensory-head card-effect-head">
            <span class="impact-payoff-badge">
              <AppIcon
                name={effectMeta?.icon || "sparkles"}
                size={14}
                strokeWidth={2}
              />
              <span>{effectMeta?.badge || "Světelná stopa"}</span>
            </span>
            <span class="win-sensory-hint card-effect-hint"
              >Dotkni se pro jiskru</span
            >
          </div>
          <canvas
            class="impact-payoff-canvas"
            width="320"
            height="124"
            aria-hidden="true"
            use:impactCanvas={{
              action: $activeCelebration,
              climax: true,
              onProgress: (v) => {
                impactMetricValue = v;
              },
            }}
          ></canvas>
        </div>
        {#if effectMeta?.mollyTreat}
          <div class="molly-celebration-note">
            <span class="molly-treat-icon" aria-hidden="true">
              <AppIcon
                name={effectMeta.mollyTreat.icon}
                size={18}
                strokeWidth={1.9}
              />
            </span>
            <span>
              Patronka <strong>Molly</strong> ti s láskou děkuje za dobrotu (<strong
                >{effectMeta.mollyTreat.name}</strong
              >) a spokojeně na tebe čeká u jezera v Krajině dobra.
            </span>
          </div>
          {#if !fedThisCelebration && $mollyState.availableTreats > 0}
            <button
              type="button"
              class="btn-celebration-feed"
              on:click={handleFeedMolly}
            >
              <AppIcon name="paw" size={16} />
              <span>Dát Molly zasloužený pamlsek</span>
              <AppIcon
                name={effectMeta.mollyTreat.icon}
                size={16}
                strokeWidth={1.9}
              />
            </button>
          {:else if fedThisCelebration}
            <div class="molly-fed-badge" role="status">
              <AppIcon name="sparkles" size={16} strokeWidth={2} />
              <span>
                Molly spokojeně chroupe svůj zasloužený pamlsek a přede radostí!
              </span>
            </div>
          {/if}
        {/if}
        <p class="win-rest-reassurance">
          Dnes se ti povedlo něco dobrého. Nemusíš dělat nic dalšího. Můžeš si
          chvíli odpočinout.
        </p>
        <p class="win-message">
          {$activeCelebration.concreteImpact || $activeCelebration.message}
        </p>

        <div class="win-actions">
          <a
            href="/svet?just_lit=1"
            class="btn-world"
            on:click={handleGoToWorld}
          >
            <AppIcon name="sparkles" size={16} strokeWidth={2} />
            <span>Rozsvítit tenhle skutek v Krajině dobra</span>
            <AppIcon name="arrow-right" size={16} strokeWidth={2} />
          </a>
          <button type="button" class="btn-stop" on:click={handleStopHere}>
            <AppIcon name="coffee" size={16} strokeWidth={2} />
            <span>Pro dnešek mám splněno — dopřát si klid</span>
          </button>
          <div class="win-secondary-row">
            <button
              type="button"
              class="btn-share"
              on:click={handleShareWithFriend}
            >
              {#if sharedCopied}
                <AppIcon name="check" size={15} strokeWidth={2.2} />
                <span>Odkaz zkopírován</span>
              {:else}
                <AppIcon name="share-2" size={15} strokeWidth={2} />
                <span>Poslat tip blízkému</span>
              {/if}
            </button>
            <button type="button" class="btn-more" on:click={handleContinue}>
              Zavřít
            </button>
          </div>
        </div>
      {:else}
        <div class="rest-icon" aria-hidden="true">
          <AppIcon name="leaf" size={28} strokeWidth={1.85} />
        </div>
        <h3 id="win-title" class="win-title">
          Dnes se ti povedlo něco dobrého
        </h3>
        <p class="win-message">
          Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout, odložit telefon
          a dopřát si ticho.
        </p>
        <div class="win-actions">
          <a href="/svet#dech" class="btn-world" on:click={handleGoToWorld}>
            <AppIcon name="waves" size={16} strokeWidth={2} />
            <span>Minuta klidného dechu v Krajině dobra</span>
          </a>
          <button type="button" class="btn-stop" on:click={closeCelebration}>
            Zavřít okno
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .celebration-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: rgba(20, 40, 29, 0.52);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    animation: fadeIn 0.22s ease-out;
  }

  .celebration-card {
    position: relative;
    width: 100%;
    max-width: 450px;
    max-height: calc(100dvh - 1.5rem);
    overflow-y: auto;
    box-sizing: border-box;
    background: var(--bg-surface, #ffffff);
    border-radius: 22px;
    padding: 1.85rem 1.65rem;
    box-shadow: var(--shadow-xl, 0 20px 44px -12px rgba(18, 42, 30, 0.16));
    border: 1px solid var(--border-subtle, #dce3dd);
    text-align: center;
  }

  .win-overline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent-primary, #1b5e42);
    margin-bottom: 0.55rem;
  }

  .rest-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 999px;
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    margin-bottom: 0.65rem;
  }

  .win-title {
    margin: 0 0 0.55rem 0;
    font-size: 1.32rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--ink-primary, #14281d);
    line-height: 1.25;
  }

  .win-sensory-stage {
    margin: 0 0 0.85rem 0;
    text-align: left;
  }

  .win-sensory-stage .impact-payoff-canvas {
    height: 124px;
  }

  .molly-celebration-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 0 0 0.7rem 0;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
    background: var(--accent-warm-tint, #fef6e8);
    border: 1px solid rgba(143, 75, 14, 0.28);
    color: var(--ink-primary, #14281d);
    font-size: 0.82rem;
    line-height: 1.42;
    text-align: left;
  }

  .molly-treat-icon {
    display: inline-flex;
    align-items: center;
    color: #8f4b0e;
    flex-shrink: 0;
  }

  .btn-celebration-feed {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    margin: 0 0 0.85rem 0;
    padding: 0.7rem 1.1rem;
    border-radius: 14px;
    border: 1px solid rgba(143, 75, 14, 0.35);
    background: var(--accent-warm-tint, #fef6e8);
    color: #8f4b0e;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .btn-celebration-feed:hover {
    background: #fdead1;
    border-color: #8f4b0e;
  }

  .molly-fed-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    box-sizing: border-box;
    margin: 0 0 0.85rem 0;
    padding: 0.55rem 0.85rem;
    border-radius: 12px;
    background: var(--bg-subtle, #edf2ee);
    color: var(--accent-primary, #1b5e42);
    font-size: 0.84rem;
    font-weight: 700;
  }

  .win-rest-reassurance {
    margin: 0 0 0.5rem 0;
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.5;
    color: var(--accent-primary, #1b5e42);
  }

  .win-message {
    margin: 0 0 1.35rem 0;
    font-size: 0.92rem;
    line-height: 1.6;
    color: var(--ink-secondary, #3f574a);
  }

  .win-actions {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .btn-world {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    padding: 0.82rem 1.2rem;
    border-radius: 14px;
    background: var(--accent-primary, #1b5e42);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.93rem;
    text-decoration: none;
    transition: background-color 0.18s ease;
  }

  .btn-world:hover {
    background: var(--accent-primary-hover, #144732);
  }

  .btn-stop {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    padding: 0.78rem 1.15rem;
    border-radius: 14px;
    border: 1px solid var(--border-strong, #c2cec5);
    background: var(--bg-subtle, #edf2ee);
    color: var(--ink-primary, #14281d);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: background-color 0.18s ease;
  }

  .btn-stop:hover {
    background: var(--border-subtle, #dce3dd);
  }

  .win-secondary-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.15rem;
  }

  .btn-share,
  .btn-more {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 44px;
    min-width: 44px;
    box-sizing: border-box;
    padding: 0.55rem 0.75rem;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--ink-secondary, #3f574a);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .btn-share:hover,
  .btn-more:hover {
    color: var(--ink-primary, #14281d);
    background: var(--bg-subtle, #edf2ee);
  }

  @media (max-width: 680px) {
    .celebration-backdrop {
      padding: 0.75rem;
    }

    .celebration-card {
      padding: 1.25rem 1rem;
      border-radius: 18px;
    }

    .win-secondary-row {
      flex-wrap: wrap;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
