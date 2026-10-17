import { HEIGHT, WIDTH, lerp } from './pixel-math.js';

export function createLayer() {
  const layer = document.createElement('canvas');
  layer.width = WIDTH;
  layer.height = HEIGHT;
  const context = layer.getContext('2d');
  context.imageSmoothingEnabled = false;
  return { canvas: layer, ctx: context };
}

// Rows are strings; each character maps to a palette color, '.' is transparent.
export function makeSprite(rows, palette) {
  const w = Math.max(...rows.map(row => row.length));
  const h = rows.length;
  const sprite = document.createElement('canvas');
  sprite.width = w;
  sprite.height = h;
  const context = sprite.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((symbol, x) => {
    const color = palette[symbol];
    if (!color) return;
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  }));
  return { canvas: sprite, w, h };
}

export function drawSprite(g, sprite, x, y, flip = false) {
  if (!flip) {
    g.drawImage(sprite.canvas, x, y);
    return;
  }
  g.save();
  g.translate(x + sprite.w, y);
  g.scale(-1, 1);
  g.drawImage(sprite.canvas, 0, 0);
  g.restore();
}

export function plot(g, x, y, color, size = 1) {
  g.fillStyle = color;
  g.fillRect(x, y, size, size);
}

export function drawLimb(g, from, to, color) {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
  for (let step = 0; step <= steps; step++) {
    const fraction = step / steps;
    plot(g, Math.round(lerp(from.x, to.x, fraction)), Math.round(lerp(from.y, to.y, fraction)), color, 2);
  }
}
