import { WIDTH, clamp } from './pixel-math.js';
import { drawSprite, makeSprite, plot } from './sprite.js';

const BIRD_PALETTE = { g: '#8f8a7e', k: '#1a1a1a', w: '#f0efe8' };
const BIRD_FRAMES = [
  makeSprite(['g.....g', '.g...g.', '..wkkk.', '...ww..'], BIRD_PALETTE),
  makeSprite(['.......', '..wkkk.', '.g.w.g.', 'g.....g'], BIRD_PALETTE),
];
const BIRD_PERIOD = 26;
const BIRD_CROSSING = 9;

// A pair of quero-queros crosses the sky during the day.
export function drawBirds(g, time, light) {
  if (light.night > 0.3) return;
  const progress = (time % BIRD_PERIOD) / BIRD_CROSSING;
  if (progress > 1) return;
  const wing = Math.floor(time * 6);
  const x = Math.round(WIDTH + 10 - progress * (WIDTH + 40));
  const y = Math.round(34 + Math.sin(progress * 6) * 3);
  drawSprite(g, BIRD_FRAMES[wing % 2], x, y, true);
  drawSprite(g, BIRD_FRAMES[(wing + 1) % 2], x + 11, y + 5, true);
}

export function drawFireflies(ctx, time, light) {
  const visibility = clamp((light.night - 0.4) / 0.6, 0, 1);
  if (visibility === 0) return;
  for (let index = 0; index < 18; index++) {
    if (Math.sin(time * 2 + index * 1.7) < 0.55) continue;
    const x = Math.round(70 + ((index * 53) % 180) + Math.sin(time * 0.4 + index) * 8);
    const y = Math.round(96 + ((index * 29) % 30) + Math.sin(time * 0.7 + index * 2) * 4);
    plot(ctx, x, y, `rgba(222,255,120,${visibility})`);
  }
}
