/**
 * Low-level Web Audio tone and noise synthesis with envelope shaping.
 */

import { getAudioContext, registerUnmuteFeedbackHook } from './audioContext.js';

/**
 * Synthesizes a dual-oscillator musical tone with ADSR envelope and optional frequency glide.
 * @param {number} f Fundamental frequency in Hz
 * @param {number} [dur=0.28] Duration in seconds
 * @param {OscillatorType} [tp='sine'] Oscillator waveform type
 * @param {number} [d=0] Start delay in seconds
 * @param {number} [pk=0.038] Peak gain volume
 * @param {number} [ef=0] Target end frequency for linear glide
 * @returns {GainNode | null}
 */
export function tone(f, dur = 0.28, tp = 'sine', d = 0, pk = 0.038, ef = 0) {
  const c = getAudioContext();
  if (!c) return null;
  try {
    const t = c.currentTime + d;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    const g2 = c.createGain();
    const r = (/** @type {AudioParam} */ p, /** @type {number} */ v, /** @type {number} */ x) =>
      p.linearRampToValueAtTime(v, x);

    o.type = tp;
    o.frequency.value = f;
    o2.type = 'sine';
    o2.frequency.value = f * 2;
    if (ef) {
      r(o.frequency, ef, t + dur * 0.85);
      r(o2.frequency, ef * 2, t + dur * 0.85);
    }
    g.gain.setValueAtTime(0.001, t);
    r(g.gain, pk, t + 0.018);
    r(g.gain, 0.0001, t + dur);
    g2.gain.setValueAtTime(0.0005, t);
    r(g2.gain, pk * 0.22, t + 0.025);
    r(g2.gain, 0.0001, t + dur * 0.9);
    o.connect(g);
    o2.connect(g2);
    g.connect(c.destination);
    g2.connect(c.destination);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.03);
    o2.stop(t + dur + 0.03);
    return g;
  } catch {
    return null;
  }
}

/**
 * Synthesizes a shaped bandpass filtered noise burst (kibble grains, page turns, campfire crunches).
 * @param {number} [dur=0.03] Duration in seconds
 * @param {number} [freq=1100] Filter center frequency in Hz
 * @param {number} [q=5.5] Filter resonance Q factor
 * @param {number} [delay=0] Start delay in seconds
 * @param {number} [gainPeak=0.04] Peak gain volume
 */
export function noiseBurst(dur = 0.03, freq = 1100, q = 5.5, delay = 0, gainPeak = 0.04) {
  const c = getAudioContext();
  if (!c) return;
  try {
    const sr = c.sampleRate;
    const len = Math.max(64, Math.floor(sr * dur));
    const buf = c.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    const flt = c.createBiquadFilter();
    const g = c.createGain();
    src.buffer = buf;
    flt.type = 'bandpass';
    flt.frequency.value = freq;
    flt.Q.value = q;
    g.gain.setValueAtTime(gainPeak, t);
    g.gain.linearRampToValueAtTime(0.0005, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(c.destination);
    src.start(t);
  } catch {}
}

// Hook unmute chime feedback
registerUnmuteFeedbackHook(() => {
  tone(523.25, 0.22, 'sine', 0, 0.03);
  tone(659.25, 0.28, 'triangle', 0.06, 0.028);
});
