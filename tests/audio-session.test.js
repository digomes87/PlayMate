import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { silentWav } from '../site/scripts/music/audio-session.js';

const text = (bytes, start, length) => String.fromCharCode(...bytes.slice(start, start + length));

describe('silentWav', () => {
  test('writes a valid mono 8-bit PCM header', () => {
    const bytes = silentWav(0.5, 8000);
    const view = new DataView(bytes.buffer);

    assert.equal(text(bytes, 0, 4), 'RIFF');
    assert.equal(text(bytes, 8, 4), 'WAVE');
    assert.equal(text(bytes, 36, 4), 'data');
    assert.equal(view.getUint16(22, true), 1);
    assert.equal(view.getUint32(24, true), 8000);
    assert.equal(view.getUint16(34, true), 8);
    assert.equal(view.getUint32(40, true), 4000);
    assert.equal(view.getUint32(4, true), bytes.length - 8);
  });

  test('contains only silence after the header', () => {
    const samples = silentWav(0.1, 8000).slice(44);

    assert.equal(samples.length, 800);
    assert.ok(samples.every(sample => sample === 128));
  });
});
