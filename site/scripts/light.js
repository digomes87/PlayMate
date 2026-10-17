import { hexToRgb, lerp, mix, smooth } from './pixel-math.js';

export const SUNSET_AT = 0.64;

const SKY_KEYS = [
  { at: 0.00, top: '#34406e', horizon: '#f0a060', tint: [255, 170, 120, 0.14], night: 0.15 },
  { at: 0.10, top: '#4d8ccc', horizon: '#cfe6ee', tint: [255, 240, 220, 0.04], night: 0 },
  { at: 0.36, top: '#3f7cc2', horizon: '#f1e3a8', tint: [255, 210, 140, 0.07], night: 0 },
  { at: 0.54, top: '#3b4180', horizon: '#f27a3c', tint: [240, 110, 50, 0.2], night: 0.05 },
  { at: SUNSET_AT, top: '#1c1d46', horizon: '#8c4a68', tint: [70, 40, 110, 0.38], night: 0.55 },
  { at: 0.76, top: '#090c22', horizon: '#1d2a52', tint: [14, 22, 64, 0.58], night: 1 },
  { at: 0.90, top: '#141a3e', horizon: '#4e4478', tint: [40, 40, 100, 0.42], night: 0.8 },
  { at: 1.00, top: '#34406e', horizon: '#f0a060', tint: [255, 170, 120, 0.14], night: 0.15 },
].map(key => ({ ...key, top: hexToRgb(key.top), horizon: hexToRgb(key.horizon) }));

// dayTime runs from 0 (dawn) to 1 (next dawn).
export function lightAt(dayTime) {
  const wrapped = ((dayTime % 1) + 1) % 1;
  const index = SKY_KEYS.findIndex(key => key.at > wrapped);
  const from = SKY_KEYS[index - 1];
  const to = SKY_KEYS[index];
  const fraction = smooth((wrapped - from.at) / (to.at - from.at));
  return {
    top: mix(from.top, to.top, fraction),
    horizon: mix(from.horizon, to.horizon, fraction),
    tint: mix(from.tint, to.tint, fraction),
    night: lerp(from.night, to.night, fraction),
  };
}
