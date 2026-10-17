import { HEIGHT, WIDTH, hash, lerp, seededRandom } from './pixel-math.js';
import { createLayer, plot } from './sprite.js';

const random = seededRandom(1923);

const farHill = x => 63 + 4 * Math.sin(x * 0.031 + 1.2) + 3 * Math.sin(x * 0.077 + 0.4) + 1.5 * Math.sin(x * 0.19);
const nearHill = x => 80 + 3.5 * Math.sin(x * 0.022 + 2.1) + 2 * Math.sin(x * 0.061 + 0.7);

const FIELD_TONES = [
  ['#7cae5e', '#86b766'],
  ['#62a046', '#6cab4e', '#77b456'],
  ['#4c8836', '#56953f', '#62a249', '#477d31'],
];

function fieldTones(y) {
  if (y < 90) return FIELD_TONES[0];
  if (y < 106) return FIELD_TONES[1];
  return FIELD_TONES[2];
}

function fieldColor(x, y) {
  const tones = fieldTones(y);
  const noise = hash(x >> 1, y) * 0.6 + hash(x >> 2, y >> 1) * 0.4;
  return tones[Math.min(tones.length - 1, Math.floor(noise * tones.length))];
}

function paintFarHills(g) {
  for (let x = 0; x < WIDTH; x++) {
    const top = Math.round(farHill(x));
    plot(g, x, top, '#93b48a');
    g.fillStyle = '#7fa27a';
    g.fillRect(x, top + 1, 1, Math.round(nearHill(x)) - top);
  }
  for (let index = 0; index < 7; index++) {
    const x = 8 + Math.floor(random() * 240);
    const top = Math.round(farHill(x));
    g.fillStyle = '#5d8460';
    g.fillRect(x, top - 2, 3, 3);
    g.fillRect(x + 1, top - 3, 1, 1);
  }
}

function paintField(g) {
  for (let x = 0; x < WIDTH; x++) {
    const top = Math.round(nearHill(x));
    plot(g, x, top, '#93c06e');
    for (let y = top + 1; y < HEIGHT; y++) plot(g, x, y, fieldColor(x, y));
  }
  for (let index = 0; index < 46; index++) {
    const x = Math.floor(random() * WIDTH);
    const y = 98 + Math.floor(random() * 44);
    plot(g, x, y, index % 3 === 0 ? '#f0ece0' : '#e6c84a');
  }
}

const UMBU_CANOPY = [[0, 0, 11], [-9, 3, 7], [9, 2, 8], [-4, -6, 7], [5, -6, 7]];

function canopyColor(x, y) {
  if (y < -3 && hash(x + 300, y + 300) > 0.45) return '#4f8a3e';
  if (y > 4 || hash(x + 90, y) > 0.82) return '#2f5a2a';
  return '#3c6e33';
}

function paintUmbu(g) {
  const trunkX = 214;
  const base = Math.round(nearHill(trunkX)) + 1;
  for (let row = 0; row < 14; row++) {
    const half = Math.round(lerp(2, 4, row / 13));
    g.fillStyle = '#5a4030';
    g.fillRect(trunkX - half, base - 13 + row, half * 2, 1);
    plot(g, trunkX - half, base - 13 + row, '#43301f');
  }
  const centerY = base - 21;
  for (let y = -14; y <= 10; y++) {
    for (let x = -17; x <= 17; x++) {
      if (!UMBU_CANOPY.some(([bx, by, radius]) => Math.hypot(x - bx, y - by) <= radius)) continue;
      plot(g, trunkX + x, centerY + y, canopyColor(x, y));
    }
  }
}

function paintFence(g) {
  g.fillStyle = '#7d7a6e';
  g.fillRect(66, 88, WIDTH - 66, 1);
  g.fillRect(66, 91, WIDTH - 66, 1);
  for (let x = 66; x < WIDTH; x += 13) {
    g.fillStyle = '#6b4a30';
    g.fillRect(x, 86, 2, 8);
    g.fillStyle = '#8a6640';
    g.fillRect(x, 86, 2, 1);
  }
}

// Painted once: hills, umbu, field and fence never change.
export function buildLandscape() {
  const layer = createLayer();
  paintFarHills(layer.ctx);
  paintUmbu(layer.ctx);
  paintField(layer.ctx);
  paintFence(layer.ctx);
  return layer.canvas;
}

export const TUFTS = Array.from({ length: 80 }, () => ({
  x: Math.floor(random() * WIDTH),
  y: 118 + Math.floor(random() * 26),
  h: 3 + Math.floor(random() * 3),
})).sort((a, b) => a.y - b.y);

const BLADES = [[-1, 0.7], [0, 1], [1, 0.8]];

export function drawTuft(g, tuft, time) {
  const sway = Math.round(Math.sin(time * 1.6 + tuft.x * 0.15));
  BLADES.forEach(([side, scale]) => {
    const height = Math.round(tuft.h * scale);
    for (let index = 0; index < height; index++) {
      const bend = index >= height - 2 ? sway + side : 0;
      plot(g, tuft.x + side + bend, tuft.y - index, index === height - 1 ? '#8cc263' : '#3f7a2e');
    }
  });
}
