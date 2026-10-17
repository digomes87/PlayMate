import { createInstruments } from './instruments.js';
import { STEPS_PER_LOOP, STEP_SECONDS, eventsForStep } from './score.js';

const LOOKAHEAD_SECONDS = 0.15;
const TICK_MILLISECONDS = 25;
const START_DELAY_SECONDS = 0.05;

// Schedules the score slightly ahead of the audio clock, the usual Web Audio
// pattern for steady timing even when the main thread is busy drawing.
export function createMusicPlayer() {
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

  async function start() {
    if (timer) return;
    audio = audio || new AudioContext();
    await audio.resume();
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
  }

  return { start, stop, isPlaying: () => timer !== null };
}
