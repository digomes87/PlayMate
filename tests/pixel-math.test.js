import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { bayer, hash, hexToRgb, lerpPoint, seededRandom } from '../site/scripts/pixel-math.js';

describe('pixel-math', () => {
  test('hash is deterministic and stays in [0, 1)', () => {
    assert.equal(hash(12, 34), hash(12, 34));
    for (let x = -50; x < 50; x++) {
      const value = hash(x, x * 7);
      assert.ok(value >= 0 && value < 1);
    }
  });

  test('seededRandom repeats the same sequence for the same seed', () => {
    const first = seededRandom(42);
    const second = seededRandom(42);

    assert.deepEqual([first(), first(), first()], [second(), second(), second()]);
  });

  test('bayer thresholds cover 16 distinct levels', () => {
    const levels = new Set();
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) levels.add(bayer(x, y));

    assert.equal(levels.size, 16);
  });

  test('hexToRgb parses a palette color', () => {
    assert.deepEqual(hexToRgb('#b3262b'), [179, 38, 43]);
  });

  test('lerpPoint snaps to whole pixels', () => {
    assert.deepEqual(lerpPoint({ x: 0, y: 0 }, { x: 3, y: 5 }, 0.5), { x: 2, y: 3 });
  });
});
