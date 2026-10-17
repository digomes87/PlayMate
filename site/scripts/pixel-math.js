export const WIDTH = 256;
export const HEIGHT = 144;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const smooth = fraction => fraction * fraction * (3 - 2 * fraction);
export const lerp = (from, to, fraction) => from + (to - from) * fraction;
export const lerpPoint = (from, to, fraction) => ({
  x: Math.round(lerp(from.x, to.x, fraction)),
  y: Math.round(lerp(from.y, to.y, fraction)),
});
export const hexToRgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
export const mix = (from, to, fraction) => from.map((value, index) => value + (to[index] - value) * fraction);
export const rgb = color => `rgb(${color[0] | 0},${color[1] | 0},${color[2] | 0})`;
export const rgba = (color, alpha) => `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${alpha})`;

export function hash(x, y) {
  let value = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
