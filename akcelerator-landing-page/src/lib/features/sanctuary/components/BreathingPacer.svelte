<script>
  import { onDestroy } from "svelte";
  import { playMollyPurr, playSanctuaryChime } from "../../../audio/presets.js";
  import { isSoundMuted } from "../../../audio/audioContext.js";
  import { setMollyMood, thankForDeed } from "../../../mollyStore.js";
  import { trackEvent } from "../../../analytics.js";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import { resolveIconKey } from "$lib/icons/iconRegistry.js";

  /**
   * @type {{
   *   onBreathWave?: ((isInhale: boolean) => void) | null,
   *   selectedBreathId?: string,
   *   breathingDurationSec?: number,
   *   breathingActive?: boolean
   * }}
   */
  let {
    onBreathWave = null,
    selectedBreathId = $bindable("calm46"),
    breathingDurationSec = $bindable(60),
    breathingActive = $bindable(false),
  } = $props();

  export const BREATH_PATTERNS = [
    {
      id: "calm46",
      icon: "leaf",
      label: "Klidný dech (4-6)",
      short: "Klid (4-6)",
      desc: "Prodloužený výdech aktivuje parasympatikus a přirozeně zpomaluje tep.",
      inhale: 4,
      hold: 0,
      exhale: 6,
    },
    {
      id: "box4444",
      icon: "package",
      label: "Krabicový dech (4-4-4-4)",
      short: "Krabicový (4-4-4)",
      desc: "Rovnoměrný rytmus používaný pro rychlé znovunabytí soustředění a stability.",
      inhale: 4,
      hold: 4,
      exhale: 4,
    },
    {
      id: "sleep478",
      icon: "moon",
      label: "Hluboké uvolnění (4-7-8)",
      short: "Uvolnění (4-7-8)",
      desc: "Dlouhý výdech pro hluboké zklidnění nervové soustavy.",
      inhale: 4,
      hold: 7,
      exhale: 8,
    },
  ];

  const activePattern = $derived(
    BREATH_PATTERNS.find((p) => p.id === selectedBreathId) ||
      BREATH_PATTERNS[0],
  );

  let breathPhase = $state("idle"); // 'idle' | 'inhale' | 'hold' | 'exhale' | 'done'
  let breathPhaseSecLeft = $state(0);
  let breathSecondsLeft = $state(60);
  /** @type {ReturnType<typeof setInterval> | null} */
  let breathInterval = null;

  /**
   * @param {'breath_in' | 'breath_out'} type
   */
  function playChime(type) {
    if (isSoundMuted()) return;
    if (type === "breath_in" || type === "breath_out") {
      const freqs = type === "breath_in" ? [261.63, 392.0] : [220.0, 329.63];
      playSanctuaryChime(freqs, 0.45);
    }
  }

  export function startBreathing() {
    stopBreathing(false);
    breathingActive = true;
    setMollyMood("breathing");
    breathSecondsLeft = breathingDurationSec;

    breathPhase = "inhale";
    breathPhaseSecLeft = activePattern.inhale;
    playChime("breath_in");
    playMollyPurr(Math.min(2.2, activePattern.inhale * 0.55), 0.65);
    if (onBreathWave) onBreathWave(true);
    trackEvent("aa_world_breathing_start", {
      pattern: activePattern.id,
      duration: breathingDurationSec,
    });

    let phaseElapsed = 0;
    breathInterval = setInterval(() => {
      breathSecondsLeft -= 1;
      if (breathSecondsLeft <= 0) {
        stopBreathing(true);
        return;
      }

      phaseElapsed += 1;
      if (breathPhase === "inhale" && phaseElapsed >= activePattern.inhale) {
        phaseElapsed = 0;
        if (activePattern.hold > 0) {
          breathPhase = "hold";
          breathPhaseSecLeft = activePattern.hold;
        } else {
          breathPhase = "exhale";
          breathPhaseSecLeft = activePattern.exhale;
          playChime("breath_out");
          if (onBreathWave) onBreathWave(false);
        }
      } else if (breathPhase === "hold" && phaseElapsed >= activePattern.hold) {
        phaseElapsed = 0;
        breathPhase = "exhale";
        breathPhaseSecLeft = activePattern.exhale;
        playChime("breath_out");
        if (onBreathWave) onBreathWave(false);
      } else if (
        breathPhase === "exhale" &&
        phaseElapsed >= activePattern.exhale
      ) {
        phaseElapsed = 0;
        breathPhase = "inhale";
        breathPhaseSecLeft = activePattern.inhale;
        playChime("breath_in");
        playMollyPurr(Math.min(2.2, activePattern.inhale * 0.55), 0.65);
        if (onBreathWave) onBreathWave(true);
      } else {
        const targetLen =
          breathPhase === "inhale"
            ? activePattern.inhale
            : breathPhase === "hold"
              ? activePattern.hold
              : activePattern.exhale;
        breathPhaseSecLeft = Math.max(1, targetLen - phaseElapsed);
      }
    }, 1000);
  }

  export function stopBreathing(completed = false) {
    if (breathInterval) clearInterval(breathInterval);
    breathInterval = null;
    breathingActive = false;
    setMollyMood("curious");
    breathPhase = completed ? "done" : "idle";
    if (completed) {
      thankForDeed({ silent: true });
      playSanctuaryChime([329.63, 440.0, 659.25], 0.6);
      trackEvent("aa_world_breathing_complete", {
        pattern: activePattern.id,
        duration: breathingDurationSec,
      });
    }
  }

  onDestroy(() => {
    if (breathInterval) clearInterval(breathInterval);
    if (breathingActive) setMollyMood("curious");
  });
</script>

<section
  id="dech"
  class="breathing-sanctuary"
  aria-label="Dechové zastavení pro zklidnění"
>
  <div class="breath-copy-col">
    <span class="sec-kicker">CHVÍLE KLIDU · NÁVRAT K SOBĚ</span>
    <h2>
      Dechové zastavení, když <span class="serif-accent"
        >potřebuješ nabrat sílu</span
      >
    </h2>
    <p class="breath-lead">
      Pomáhat druhým jde snáz, když máš i ty z čeho brát. Vyber si rytmus a nech
      dech na minutu zklidnit.
    </p>

    <div
      class="pattern-pills"
      role="radiogroup"
      aria-label="Zvolit dechový rytmus"
    >
      {#each BREATH_PATTERNS as pat}
        <button
          type="button"
          role="radio"
          aria-checked={selectedBreathId === pat.id}
          class="pattern-card"
          class:active={selectedBreathId === pat.id}
          onclick={() => {
            selectedBreathId = pat.id;
            if (breathingActive) startBreathing();
          }}
        >
          <AppIcon name={resolveIconKey(pat.icon)} size={14} strokeWidth={2} />
          <span>{pat.short}</span>
        </button>
      {/each}
    </div>

    <p class="pattern-active-desc">{activePattern.desc}</p>

    <div class="duration-row" role="group" aria-label="Délka dechového cvičení">
      <span class="dur-lbl">Délka:</span>
      <button
        type="button"
        class="dur-chip"
        class:active={breathingDurationSec === 60}
        aria-pressed={breathingDurationSec === 60}
        onclick={() => (breathingDurationSec = 60)}
      >
        1 min
      </button>
      <button
        type="button"
        class="dur-chip"
        class:active={breathingDurationSec === 120}
        aria-pressed={breathingDurationSec === 120}
        onclick={() => (breathingDurationSec = 120)}
      >
        2 min
      </button>
    </div>
  </div>

  <div class="breath-visual-col">
    <div class="lotus-stage">
      <div
        class="lotus-halo aura"
        class:inhale={breathPhase === "inhale" || breathPhase === "hold"}
        class:exhale={breathPhase === "exhale"}
        style={`transition-duration: ${
          breathPhase === "inhale"
            ? activePattern.inhale
            : breathPhase === "exhale"
              ? activePattern.exhale
              : 0.6
        }s;`}
      ></div>
      <div
        class="lotus-halo outer"
        class:inhale={breathPhase === "inhale" || breathPhase === "hold"}
        class:exhale={breathPhase === "exhale"}
        style={`transition-duration: ${
          breathPhase === "inhale"
            ? activePattern.inhale
            : breathPhase === "exhale"
              ? activePattern.exhale
              : 0.6
        }s;`}
      ></div>
      <div
        class="lotus-halo middle"
        class:inhale={breathPhase === "inhale" || breathPhase === "hold"}
        class:exhale={breathPhase === "exhale"}
        style={`transition-duration: ${
          breathPhase === "inhale"
            ? activePattern.inhale
            : breathPhase === "exhale"
              ? activePattern.exhale
              : 0.6
        }s;`}
      ></div>
      <div
        class="lotus-core"
        class:inhale={breathPhase === "inhale" || breathPhase === "hold"}
        class:exhale={breathPhase === "exhale"}
        style={`transition-duration: ${
          breathPhase === "inhale"
            ? activePattern.inhale
            : breathPhase === "exhale"
              ? activePattern.exhale
              : 0.6
        }s;`}
      >
        {#if breathingActive}
          <span class="phase-sec">{breathPhaseSecLeft} s</span>
        {:else}
          <span class="phase-leaf">
            <AppIcon name="leaf" size={28} strokeWidth={1.85} />
          </span>
        {/if}
        <div
          class="molly-lotus-guardian"
          class:is-inhale={breathPhase === "inhale" || breathPhase === "hold"}
          class:is-exhale={breathPhase === "exhale"}
          aria-hidden="true"
          title="Patronka Molly dýchá a přede v rytmu s tebou"
        >
          <svg
            viewBox="0 0 64 42"
            width="46"
            height="30"
            class="molly-lotus-svg"
          >
            <!-- Schoulené želvovinové tělíčko Molly -->
            <ellipse
              cx="32"
              cy="25"
              rx="19"
              ry="12"
              fill="#1e1714"
              stroke="#fde68a"
              stroke-width="0.9"
              stroke-opacity="0.55"
            />
            <ellipse
              cx="38"
              cy="22"
              rx="8.5"
              ry="6"
              fill="#ea580c"
              opacity="0.9"
            />
            <ellipse
              cx="25"
              cy="27"
              rx="7"
              ry="5"
              fill="#f59e0b"
              opacity="0.9"
            />
            <ellipse
              cx="31"
              cy="21"
              rx="4.5"
              ry="3.5"
              fill="#fde68a"
              opacity="0.85"
            />
            <!-- Hlava s komínovou kresbou a spokojeně zavřenýma očima ^ ^ -->
            <circle cx="19" cy="21" r="8.5" fill="#1e1714" />
            <path
              d="M19 12.5 A8.5 8.5 0 0 1 27.5 21 A8.5 8.5 0 0 1 19 29.5 Z"
              fill="#f59e0b"
            />
            <polygon points="12,16 10,8 17,13" fill="#1e1714" />
            <polygon points="21,13 27,8 25,16" fill="#ea580c" />
            <path
              d="M14.5 20.5 Q16.2 18.2 18 20.5"
              fill="none"
              stroke="#bef264"
              stroke-width="1.6"
              stroke-linecap="round"
            />
            <path
              d="M20.2 20.5 Q22 18.2 23.7 20.5"
              fill="none"
              stroke="#bef264"
              stroke-width="1.6"
              stroke-linecap="round"
            />
            <!-- Obtočený ocas s medovou špičkou -->
            <path
              d="M48 27 Q55 33 41 35 Q30 36 22 32"
              fill="none"
              stroke="#1e1714"
              stroke-width="4.5"
              stroke-linecap="round"
            />
            <path
              d="M36 35 Q28 36 22 32"
              fill="none"
              stroke="#fbbf24"
              stroke-width="3.2"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="breath-instruction" aria-live="polite">
      {#if breathPhase === "inhale"}
        <strong>Klidný nádech nosem…</strong>
        <span>{breathSecondsLeft} s do konce</span>
      {:else if breathPhase === "hold"}
        <strong>Krátké spočinutí v tichu…</strong>
        <span>{breathSecondsLeft} s do konce</span>
      {:else if breathPhase === "exhale"}
        <strong>Dlouhý, pomalý výdech…</strong>
        <span>{breathSecondsLeft} s do konce</span>
      {:else if breathPhase === "done"}
        <strong>Hotovo. Zůstaň ještě vteřinu v klidu.</strong>
        <span>Všimni si, o kolik volněji teď dýcháš.</span>
      {:else}
        <strong>Dopřej si minutu klidného dechu</strong>
        <span>Hladina tůně dýchá v klidném rytmu s tebou.</span>
      {/if}
    </div>

    {#if breathingActive}
      <button
        type="button"
        class="breath-cta stop"
        onclick={() => stopBreathing(false)}
      >
        Zastavit cvičení
      </button>
    {:else}
      <button
        type="button"
        class="breath-cta start"
        data-molly-guide="true"
        onclick={startBreathing}
      >
        <AppIcon name="wind" size={16} strokeWidth={2} />
        <span>
          Spustit klidný dech ({breathingDurationSec === 60
            ? "1 min"
            : "2 min"})
        </span>
      </button>
    {/if}
  </div>
</section>

<style>
  .breathing-sanctuary {
    background: var(--bg-surface);
    border-radius: 24px;
    padding: 2rem 2.15rem;
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-sm);
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 2rem;
    align-items: center;
  }

  .sec-kicker {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #8f4b0e;
    margin-bottom: 0.35rem;
  }

  .breathing-sanctuary h2 {
    margin: 0 0 0.55rem 0;
    font-size: clamp(1.5rem, 2.5vw, 2.05rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.16;
    color: var(--ink-primary);
  }

  .breathing-sanctuary h2 .serif-accent {
    color: var(--accent-primary);
  }

  .breath-lead {
    margin: 0 0 1.15rem 0;
    color: var(--ink-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .pattern-pills {
    display: inline-flex;
    gap: 0.32rem;
    padding: 0.28rem;
    border-radius: 16px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .pattern-card {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    min-width: 44px;
    border: none;
    border-radius: 12px;
    padding: 0.45rem 0.9rem;
    background: transparent;
    color: var(--ink-secondary);
    font-family: inherit;
    font-size: 0.83rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.18s ease, color 0.18s ease;
  }

  .pattern-card:hover {
    color: var(--ink-primary);
  }

  .pattern-card.active {
    background: var(--accent-primary);
    color: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  .pattern-active-desc {
    margin: 0 0 1.15rem 0;
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--ink-secondary);
  }

  .duration-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .dur-lbl {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--ink-muted);
  }

  .dur-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 44px;
    padding: 0.45rem 0.92rem;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--bg-surface);
    color: var(--ink-secondary);
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  }

  .dur-chip:hover {
    border-color: var(--accent-primary);
    color: var(--ink-primary);
  }

  .dur-chip.active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
  }

  .breath-visual-col {
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    padding: 1.85rem 1.4rem;
    color: var(--ink-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.1rem;
  }

  .lotus-stage {
    position: relative;
    width: 196px;
    height: 196px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lotus-halo {
    position: absolute;
    border-radius: 50%;
    transition-property: transform, opacity;
    transition-timing-function: ease-in-out;
  }

  .lotus-halo.aura {
    width: 192px;
    height: 192px;
    background: rgba(27, 94, 66, 0.06);
    transform: scale(0.84);
    opacity: 0.65;
  }

  .lotus-halo.outer {
    width: 158px;
    height: 158px;
    background: rgba(27, 94, 66, 0.1);
    border: 1px solid rgba(27, 94, 66, 0.2);
    transform: scale(0.88);
    opacity: 0.78;
  }

  .lotus-halo.middle {
    width: 120px;
    height: 120px;
    background: rgba(27, 94, 66, 0.15);
    border: 1px solid rgba(27, 94, 66, 0.28);
    transform: scale(0.92);
    opacity: 0.88;
  }

  .lotus-core {
    position: relative;
    z-index: 2;
    width: 82px;
    height: 82px;
    border-radius: 50%;
    background: var(--accent-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    box-shadow: var(--shadow-md);
    transition-property: transform;
    transition-timing-function: ease-in-out;
  }

  .lotus-halo.aura.inhale {
    transform: scale(1.22);
    opacity: 0.95;
  }
  .lotus-halo.outer.inhale {
    transform: scale(1.18);
    opacity: 0.95;
  }
  .lotus-halo.middle.inhale {
    transform: scale(1.18);
    opacity: 0.95;
  }
  .lotus-core.inhale {
    transform: scale(1.18);
  }

  .lotus-halo.aura.exhale,
  .lotus-halo.outer.exhale,
  .lotus-halo.middle.exhale {
    transform: scale(0.76);
    opacity: 0.5;
  }
  .lotus-core.exhale {
    transform: scale(0.82);
  }

  .phase-sec {
    font-size: 1.2rem;
    font-weight: 800;
  }

  .phase-leaf {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  }

  .breath-instruction {
    min-height: 2.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .breath-instruction strong {
    font-size: 1.02rem;
    color: var(--ink-primary);
  }

  .breath-instruction span {
    font-size: 0.84rem;
    color: var(--ink-secondary);
  }

  .breath-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 44px;
    min-width: 44px;
    border: none;
    border-radius: 999px;
    padding: 0.72rem 1.45rem;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.18s ease;
  }

  .breath-cta.start {
    background: var(--accent-primary);
    color: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  .breath-cta.start:hover {
    background: var(--accent-primary-hover);
  }

  .breath-cta.stop {
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    color: var(--ink-primary);
  }

  .breath-cta.stop:hover {
    background: var(--bg-canvas);
  }

  .molly-lotus-guardian {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%) scale(1);
    transition: transform 1.2s ease-in-out;
    pointer-events: none;
    filter: drop-shadow(0 2px 6px rgba(18, 42, 30, 0.25));
  }

  .molly-lotus-guardian.is-inhale {
    transform: translateX(-50%) scale(1.12);
  }

  .molly-lotus-guardian.is-exhale {
    transform: translateX(-50%) scale(0.94);
  }

  @media (max-width: 900px) {
    .breathing-sanctuary {
      grid-template-columns: 1fr;
      padding: 1.5rem 1.2rem;
    }
  }
</style>
