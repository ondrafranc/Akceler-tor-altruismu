/**
 * High-level procedural Web Audio presets and ASMR auditory payoffs.
 * Includes Molly purring/crunching/meowing, sanctuary chimes, and 18 distinct civic payoffs.
 */

import { getAudioContext, isSoundMuted } from './audioContext.js';
import { tone, noiseBurst } from './synthesizer.js';

let lastAsmrTs = 0;

/** @type {((action: any) => { asmr?: string }) | null} */
let actionSpecResolver = null;

/**
 * Registers an action-effect spec resolver to resolve rich action objects into ASMR audio profiles.
 * @param {(action: any) => { asmr?: string }} fn
 */
export function registerActionSpecResolver(fn) {
  actionSpecResolver = typeof fn === 'function' ? fn : null;
}

/**
 * Shared chime generator for /svet so the entire app shares a single AudioContext
 * and honors the global mute setting `isSoundMuted()`.
 * @param {number} [freq=528]
 * @param {number} [dur=1.4]
 * @param {OscillatorType} [wave='sine']
 * @param {number} [delay=0]
 * @returns {GainNode | null}
 */
export function playSanctuaryChime(freq = 528, dur = 1.4, wave = 'sine', delay = 0) {
  return tone(freq, dur, wave, delay, 0.045);
}

/**
 * Hřejivé procedurální předení želvovinové kočky Molly (27 Hz -> 31 Hz AM modulace 4.2 Hz + nízkopropustný filtr 145 Hz).
 * @param {number} [dur=1.1]
 * @param {number} [intensity=0.8]
 */
export function playMollyPurr(dur = 1.1, intensity = 0.8) {
  if (isSoundMuted()) return;
  const c = getAudioContext();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const flt = c.createBiquadFilter();
    const env = c.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(27.2, t);
    osc1.frequency.linearRampToValueAtTime(30.8, t + dur * 0.55);
    osc1.frequency.linearRampToValueAtTime(26.5, t + dur);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(54.4, t);
    osc2.frequency.linearRampToValueAtTime(61.2, t + dur * 0.55);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.2, t);
    lfoGain.gain.setValueAtTime(0.018 * intensity, t);

    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(145, t);
    flt.Q.setValueAtTime(1.6, t);

    const pk = Math.max(0.008, Math.min(0.045, 0.028 * intensity));
    env.gain.setValueAtTime(0.0005, t);
    env.gain.linearRampToValueAtTime(pk, t + 0.14);
    env.gain.setValueAtTime(pk * 0.92, Math.max(t + 0.15, t + dur - 0.18));
    env.gain.linearRampToValueAtTime(0.0001, t + dur);

    lfo.connect(lfoGain);
    lfoGain.connect(env.gain);
    osc1.connect(flt);
    osc2.connect(flt);
    flt.connect(env);
    env.connect(c.destination);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);
    osc1.stop(t + dur + 0.04);
    osc2.stop(t + dur + 0.04);
    lfo.stop(t + dur + 0.04);

    // Jemný dechový třpyt
    tone(528, Math.min(0.45, dur * 0.4), 'sine', 0.05, 0.012 * intensity, 660);
  } catch {}
}

/**
 * Křupnutí pamlsku pro Molly (3 křupavé mikro-impulsy + spokojené vrknutí).
 */
export function playMollyCrunch() {
  if (isSoundMuted()) return;
  try {
    [0, 0.075, 0.155].forEach((d, i) => {
      noiseBurst(0.022, 1280 + i * 240, 6.2, d, 0.042);
      tone(380 + i * 90, 0.06, 'triangle', d, 0.02);
    });
    tone(587.33, 0.18, 'sine', 0.21, 0.024, 783.99);
  } catch {}
}

/**
 * Melodické mňouknutí Molly (formantová kontura 440 Hz -> 690 Hz -> 590 Hz).
 */
export function playMollyMeow() {
  if (isSoundMuted()) return;
  const c = getAudioContext();
  if (!c) return;
  try {
    const t = c.currentTime;
    const dur = 0.36;
    const osc = c.createOscillator();
    const flt = c.createBiquadFilter();
    const g = c.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(690, t + 0.13);
    osc.frequency.exponentialRampToValueAtTime(590, t + dur);

    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(1150, t);
    flt.Q.setValueAtTime(2.4, t);

    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.032, t + 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);

    osc.connect(flt);
    flt.connect(g);
    g.connect(c.destination);

    osc.start(t);
    osc.stop(t + dur + 0.03);
  } catch {}
}

/**
 * Procedurální Web Audio ASMR syntéza přizpůsobená každému z 18 zvukových profilů.
 * @param {any} [actionOrMode='kibble']
 */
export function playPayoffAsmr(actionOrMode = 'kibble') {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - lastAsmrTs < 80) return;
  lastAsmrTs = now;

  let kind = 'light';
  if (typeof actionOrMode === 'string') {
    kind = actionOrMode;
  } else if (typeof actionOrMode === 'object' && actionOrMode !== null) {
    if (actionSpecResolver) {
      const resolved = actionSpecResolver(actionOrMode);
      kind = resolved?.asmr || 'light';
    } else {
      kind = actionOrMode.asmr || actionOrMode.mode || 'light';
    }
  }

  if (kind === 'kibble') {
    for (let k = 0; k < 12; k++) {
      noiseBurst(0.018, 950 + ((k * 137) % 700), 6.5, k * 0.038, 0.05);
    }
    tone(523.25, 0.35, 'sine', 0.38);
    tone(659.25, 0.35, 'triangle', 0.43);
    tone(783.99, 0.42, 'sine', 0.48);
    return;
  }

  if (kind === 'rice') {
    for (let k = 0; k < 16; k++) {
      noiseBurst(0.012, 1850 + ((k * 193) % 1100), 8.0, k * 0.026, 0.035);
    }
    [587.33, 739.99, 880, 1174.66].forEach((f, i) =>
      tone(f, 0.28, 'sine', 0.34 + i * 0.05, 0.03)
    );
    return;
  }

  if (kind === 'strnad') {
    [1760, 1760, 1760].forEach((f, i) =>
      tone(f, 0.09, 'sine', i * 0.11, 0.03, f * 1.06)
    );
    tone(1480, 0.42, 'triangle', 0.36, 0.035, 1318.5);
    return;
  }

  if (kind === 'birds') {
    tone(1318.5, 0.14, 'sine', 0.02, 0.03, 1760);
    tone(1567.98, 0.16, 'sine', 0.16, 0.03, 2093);
    tone(1760, 0.26, 'triangle', 0.32, 0.028, 1567.98);
    return;
  }

  if (kind === 'heartbeat') {
    tone(68, 0.14, 'sine', 0.02, 0.06, 52);
    tone(86, 0.16, 'sine', 0.18, 0.055, 60);
    tone(523.25, 0.36, 'sine', 0.36, 0.03);
    tone(659.25, 0.4, 'triangle', 0.42, 0.028);
    return;
  }

  if (kind === 'typewriter') {
    for (let k = 0; k < 5; k++) {
      noiseBurst(0.014, 1400 + k * 180, 7.0, k * 0.052, 0.04);
    }
    tone(659.25, 0.28, 'triangle', 0.28, 0.032);
    tone(987.77, 0.36, 'sine', 0.34, 0.032);
    return;
  }

  if (kind === 'sonar') {
    tone(880, 0.14, 'sine', 0.0, 0.03);
    tone(1318.5, 0.18, 'sine', 0.14, 0.03);
    tone(1760, 0.32, 'triangle', 0.28, 0.028);
    return;
  }

  if (kind === 'musicbox') {
    [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((f, i) =>
      tone(f, 0.34, 'triangle', i * 0.07, 0.03)
    );
    return;
  }

  if (kind === 'pages') {
    for (let k = 0; k < 4; k++) {
      noiseBurst(0.04, 800 + k * 240, 3.2, k * 0.068, 0.032);
    }
    tone(523.25, 0.3, 'sine', 0.26, 0.03);
    tone(659.25, 0.36, 'triangle', 0.32, 0.03);
    return;
  }

  if (kind === 'water') {
    tone(580, 0.12, 'sine', 0.02, 0.038, 1240);
    tone(720, 0.14, 'sine', 0.16, 0.035, 1480);
    tone(880, 0.32, 'triangle', 0.32, 0.028, 1568);
    return;
  }

  if (kind === 'forest') {
    noiseBurst(0.22, 620, 1.8, 0.01, 0.026);
    [392, 440, 523.25, 659.25].forEach((f, i) =>
      tone(f, 0.36, 'triangle', 0.06 + i * 0.062, 0.03)
    );
    return;
  }

  if (kind === 'campfire') {
    noiseBurst(0.24, 380, 1.5, 0.0, 0.024);
    for (let k = 0; k < 6; k++) {
      noiseBurst(0.011, 1750 + ((k * 230) % 950), 7.5, 0.03 + k * 0.052, 0.035);
    }
    [329.63, 493.88, 659.25].forEach((f, i) =>
      tone(f, 0.38, 'triangle', 0.1 + i * 0.075, 0.028)
    );
    return;
  }

  if (kind === 'bicycle') {
    for (let k = 0; k < 6; k++) {
      noiseBurst(0.01, 2200, 9.0, k * 0.038, 0.03);
    }
    tone(1046.5, 0.38, 'sine', 0.24, 0.04);
    tone(1567.98, 0.42, 'triangle', 0.3, 0.035);
    return;
  }

  if (kind === 'bowl') {
    tone(432, 0.65, 'sine', 0.0, 0.038);
    tone(648, 0.6, 'triangle', 0.06, 0.025);
    tone(864, 0.5, 'sine', 0.12, 0.016);
    return;
  }

  if (kind === 'harp') {
    [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach((f, i) =>
      tone(f, 0.38, i % 2 ? 'triangle' : 'sine', i * 0.048, 0.03)
    );
    return;
  }

  if (kind === 'warmth') {
    noiseBurst(0.16, 480, 2.0, 0.02, 0.022);
    [349.23, 440, 523.25, 659.25].forEach((f, i) =>
      tone(f, 0.38, 'sine', 0.04 + i * 0.062, 0.032)
    );
    return;
  }

  if (kind === 'crystal') {
    [1046.5, 1318.5, 1567.98, 2093].forEach((f, i) =>
      tone(f, 0.36, 'sine', i * 0.055, 0.026)
    );
    tone(783.99, 0.42, 'triangle', 0.02, 0.022);
    return;
  }

  if (kind === 'pop_bloom') {
    [320, 440, 587.33].forEach((f, i) => {
      noiseBurst(0.012, 1600 + i * 300, 6.0, i * 0.08, 0.03);
      tone(f, 0.16, 'sine', i * 0.08, 0.034, f * 2);
    });
    tone(880, 0.3, 'triangle', 0.26, 0.028);
    return;
  }

  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.32, 'sine', i * 0.055));
}
