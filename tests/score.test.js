import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  STEPS_PER_BAR, STEPS_PER_LOOP, barLengths, eventsForStep, noteToFrequency, parseMelody,
} from '../site/scripts/music/score.js';

const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.01, `${actual} != ${expected}`);

describe('noteToFrequency', () => {
  test('tunes A4 to 440 Hz', () => {
    assert.equal(noteToFrequency('A4'), 440);
  });

  test('handles octaves and sharps', () => {
    closeTo(noteToFrequency('A2'), 110);
    closeTo(noteToFrequency('C4'), 261.63);
    closeTo(noteToFrequency('G#4'), 415.3);
  });
});

describe('score', () => {
  test('every bar of the melody fills exactly one 2/4 bar', () => {
    barLengths().forEach((length, bar) => assert.equal(length, STEPS_PER_BAR, `bar ${bar + 1}`));
  });

  test('parseMelody places notes one after another', () => {
    assert.deepEqual(parseMelody('A4:3 r:2 E5:3'), [
      { note: 'A4', start: 0, steps: 3 },
      { note: 'r', start: 3, steps: 2 },
      { note: 'E5', start: 5, steps: 3 },
    ]);
  });

  test('bass follows the 3-3-2 milonga pattern in every bar', () => {
    for (let bar = 0; bar < STEPS_PER_LOOP / STEPS_PER_BAR; bar++) {
      const bassSteps = [];
      for (let step = 0; step < STEPS_PER_BAR; step++) {
        const hasBass = eventsForStep(bar * STEPS_PER_BAR + step).some(event => event.voice === 'bass');
        if (hasBass) bassSteps.push(step);
      }
      assert.deepEqual(bassSteps, [0, 3, 6], `bar ${bar + 1}`);
    }
  });

  test('opens on A with the kick and loops seamlessly', () => {
    const first = eventsForStep(0);

    closeTo(first.find(event => event.voice === 'lead').frequency, 440);
    assert.ok(first.some(event => event.voice === 'kick'));
    assert.deepEqual(eventsForStep(STEPS_PER_LOOP), first);
  });

  test('rests produce no lead note', () => {
    const lastStepOfFourthBar = 3 * STEPS_PER_BAR + 6;

    assert.equal(eventsForStep(lastStepOfFourthBar).filter(event => event.voice === 'lead').length, 0);
  });
});
