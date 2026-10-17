import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  HAND_RAISED, HAND_REST, KETTLE_ON_FIRE, KETTLE_POURING, RITUAL, RITUAL_LENGTH, cuiaOrigin, ritualAt,
} from '../site/scripts/ritual.js';

const startOf = stepName => {
  const index = RITUAL.findIndex(([name]) => name === stepName);
  return RITUAL.slice(0, index).reduce((total, [, duration]) => total + duration, 0);
};

describe('ritualAt', () => {
  test('starts at rest with the kettle on the fire and nothing served', () => {
    const { step, pose, servedCount } = ritualAt(0);

    assert.equal(step, 'rest');
    assert.deepEqual(pose.hand, HAND_REST);
    assert.equal(pose.kettle, KETTLE_ON_FIRE);
    assert.equal(servedCount, 0);
  });

  test('pours water over the cuia while the kettle is tilted', () => {
    const { pose } = ritualAt(startOf('pour') + 0.5);

    assert.equal(pose.pouring, true);
    assert.equal(pose.tilted, true);
    assert.deepEqual(pose.kettle, KETTLE_POURING);
  });

  test('counts a cuia as served once the pour finishes', () => {
    const afterPour = startOf('putBack') + 0.01;

    assert.equal(ritualAt(afterPour - 0.02).servedCount, 0);
    assert.equal(ritualAt(afterPour).servedCount, 1);
  });

  test('brings the bomba to the mouth with eyes closed while sipping', () => {
    const { pose } = ritualAt(startOf('sip') + 1);
    const bombaTip = cuiaOrigin(pose.hand);

    assert.equal(pose.eyesClosed, true);
    assert.deepEqual(pose.hand, HAND_RAISED);
    assert.deepEqual(bombaTip, { x: 25, y: 111 });
  });

  test('repeats the round and keeps counting served cuias', () => {
    const { servedCount, step } = ritualAt(RITUAL_LENGTH * 3 + 0.1);

    assert.equal(step, 'rest');
    assert.equal(servedCount, 3);
  });

  test('moves the hand through whole pixels only', () => {
    for (let time = 0; time < RITUAL_LENGTH; time += 0.05) {
      const { pose } = ritualAt(time);
      assert.ok(Number.isInteger(pose.hand.x) && Number.isInteger(pose.hand.y), `fractional hand at ${time}`);
    }
  });
});
