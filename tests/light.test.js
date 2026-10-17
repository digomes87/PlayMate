import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { lightAt } from '../site/scripts/light.js';

describe('lightAt', () => {
  test('midday has no night and a blue sky top', () => {
    const light = lightAt(0.24);

    assert.equal(light.night, 0);
    assert.ok(light.top[2] > light.top[0], 'sky top should be blue');
  });

  test('deep night is fully dark', () => {
    assert.equal(lightAt(0.76).night, 1);
  });

  test('wraps around so the day loops without a jump', () => {
    assert.deepEqual(lightAt(1.0), lightAt(0));
    assert.deepEqual(lightAt(1.25), lightAt(0.25));
  });

  test('keeps every channel inside the 0..255 range all day', () => {
    for (let dayTime = 0; dayTime < 1; dayTime += 0.01) {
      const { top, horizon } = lightAt(dayTime);
      [...top, ...horizon].forEach(channel => assert.ok(channel >= 0 && channel <= 255, `channel ${channel} at ${dayTime}`));
    }
  });
});
