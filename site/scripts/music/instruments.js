import { STEP_SECONDS } from './score.js';

const PULSE_HARMONICS = 32;
const PULSE_DUTY = 0.25;
const BUS_VOLUME = 0.5;

// 25% pulse wave, the thin "NES" timbre used for the chord stabs.
function createPulseWave(audio) {
  const real = new Float32Array(PULSE_HARMONICS);
  const imag = new Float32Array(PULSE_HARMONICS);
  for (let harmonic = 1; harmonic < PULSE_HARMONICS; harmonic++) {
    real[harmonic] = (2 / (harmonic * Math.PI)) * Math.sin(harmonic * Math.PI * PULSE_DUTY);
  }
  return audio.createPeriodicWave(real, imag);
}

function createNoiseBuffer(audio) {
  const buffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
  return buffer;
}

function envelope(audio, output, { start, seconds, volume, release }) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.005);
  gain.gain.setTargetAtTime(volume * 0.6, start + 0.01, 0.08);
  gain.gain.setTargetAtTime(0, start + seconds, release / 3);
  gain.connect(output);
  return gain;
}

function tone(audio, output, { shape, frequency, start, seconds, volume, release }) {
  const oscillator = audio.createOscillator();
  if (typeof shape === 'string') oscillator.type = shape;
  if (typeof shape !== 'string') oscillator.setPeriodicWave(shape);
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.connect(envelope(audio, output, { start, seconds, volume, release }));
  oscillator.start(start);
  oscillator.stop(start + seconds + release);
}

function kick(audio, output, start) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(150, start);
  oscillator.frequency.exponentialRampToValueAtTime(45, start + 0.12);
  gain.gain.setValueAtTime(0.55, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
  oscillator.connect(gain).connect(output);
  oscillator.start(start);
  oscillator.stop(start + 0.2);
}

function noiseHit(audio, output, noise, { start, cutoff, volume, decay }) {
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  source.buffer = noise;
  filter.type = 'highpass';
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + decay);
  source.connect(filter).connect(gain).connect(output);
  source.start(start, Math.random() * 0.5);
  source.stop(start + decay + 0.02);
}

// One set of instruments plays into its own bus so a stop can fade it out
// without touching notes that a later start schedules.
export function createInstruments(audio) {
  const bus = audio.createGain();
  bus.gain.value = BUS_VOLUME;
  bus.connect(audio.destination);
  const pulse = createPulseWave(audio);
  const noise = createNoiseBuffer(audio);

  const voices = {
    lead: (event, start) => tone(audio, bus, { shape: 'square', frequency: event.frequency, start, seconds: event.steps * STEP_SECONDS * 0.9, volume: 0.09, release: 0.08 }),
    bass: (event, start) => tone(audio, bus, { shape: 'triangle', frequency: event.frequency, start, seconds: event.steps * STEP_SECONDS * 0.8, volume: 0.3, release: 0.05 }),
    stab: (event, start) => tone(audio, bus, { shape: pulse, frequency: event.frequency, start, seconds: STEP_SECONDS * 0.6, volume: 0.035, release: 0.06 }),
    kick: (event, start) => kick(audio, bus, start),
    tap: (event, start) => noiseHit(audio, bus, noise, { start, cutoff: 1800, volume: 0.12, decay: 0.07 }),
    shaker: (event, start) => noiseHit(audio, bus, noise, { start, cutoff: 7000, volume: 0.05, decay: 0.03 }),
  };

  return {
    play: (event, start) => voices[event.voice](event, start),
    fadeOut: () => {
      bus.gain.setTargetAtTime(0, audio.currentTime, 0.05);
      setTimeout(() => bus.disconnect(), 400);
    },
  };
}
