import { createAudioSession } from './audio-session.js';
import { createInstruments } from './instruments.js';
import { STEPS_PER_LOOP, STEP_SECONDS, eventsForStep } from './score.js';

const LOOKAHEAD_SECONDS = 0.15;
const TICK_MILLISECONDS = 25;
const START_DELAY_SECONDS = 0.05;

function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser');
  return new AudioContextClass();
}

// Schedules the score slightly ahead of the audio clock, the usual Web Audio
// pattern for steady timing even when the main thread is busy drawing.
export function createMusicPlayer() {
  const session = createAudioSession();
  let audio = null;
  let instruments = null;
  let timer = null;
  let nextStep = 0;
  let nextTime = 0;

  function schedule() {
    while (nextTime < audio.currentTime + LOOKAHEAD_SECONDS) {
      eventsForStep(nextStep).forEach(event => instruments.play(event, nextTime));
      nextStep = (nextStep + 1) % STEPS_PER_LOOP;
      nextTime += STEP_SECONDS;
    }
  }

  // Must be called from a click: the context and the session are unlocked synchronously,
  // before the first await, while the browser still counts it as a user gesture.
  async function start() {
    if (timer) return;
    audio = audio || createAudioContext();
    const resuming = audio.resume();
    const engaging = session.engage();
    await Promise.all([resuming, engaging]);
    if (audio.state !== 'running') throw new Error(`Audio context is ${audio.state}`);
    instruments = createInstruments(audio);
    nextTime = audio.currentTime + START_DELAY_SECONDS;
    timer = setInterval(schedule, TICK_MILLISECONDS);
    schedule();
  }

  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    instruments.fadeOut();
    session.release();
  }

  return { start, stop, isPlaying: () => timer !== null };
}
