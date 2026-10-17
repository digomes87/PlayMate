import { HEIGHT, WIDTH, bayer, clamp, hash, mix, rgb, rgba, seededRandom } from './pixel-math.js';
import { SUNSET_AT } from './light.js';
import { plot } from './sprite.js';

const SKY_BANDS = 9;
const SKY_DEPTH = 88;
const random = seededRandom(1835);

let skyImage = null;

export function paintSky(ctx, light) {
  skyImage = skyImage || ctx.createImageData(WIDTH, HEIGHT);
  const bands = Array.from({ length: SKY_BANDS + 1 }, (_, index) => mix(light.top, light.horizon, index / SKY_BANDS));
  const data = skyImage.data;
  for (let y = 0; y < HEIGHT; y++) {
    const depth = Math.pow(clamp(y / SKY_DEPTH, 0, 1), 1.5) * SKY_BANDS;
    const lower = Math.floor(depth);
    const fraction = depth - lower;
    for (let x = 0; x < WIDTH; x++) {
      const color = bands[Math.min(fraction > bayer(x, y) ? lower + 1 : lower, SKY_BANDS)];
      const offset = (y * WIDTH + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }
  ctx.putImageData(skyImage, 0, 0);
}

const STARS = Array.from({ length: 70 }, () => ({
  x: Math.floor(random() * WIDTH),
  y: Math.floor(random() * 62),
  seed: Math.floor(random() * 1000),
}));

export function drawStars(ctx, time, light) {
  const visibility = clamp((light.night - 0.25) / 0.75, 0, 1);
  if (visibility === 0) return;
  const tick = Math.floor(time * 3);
  STARS.forEach(star => {
    if (hash(star.seed, tick) > 0.92) return;
    plot(ctx, star.x, star.y, `rgba(255,248,225,${visibility})`);
  });
}

function drawDisc(ctx, center, radius, color) {
  ctx.fillStyle = color;
  for (let y = -radius; y <= radius; y++) {
    const span = Math.floor(Math.sqrt(radius * radius - y * y) + 0.3);
    ctx.fillRect(center.x - span, center.y + y, span * 2 + 1, 1);
  }
}

function drawHalo(ctx, center, radius, color) {
  ctx.fillStyle = color;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const distance = Math.hypot(x, y);
      if (distance > radius || distance < radius - 3 || bayer(center.x + x, center.y + y) > 0.5) continue;
      ctx.fillRect(center.x + x, center.y + y, 1, 1);
    }
  }
}

const arcPosition = progress => ({
  x: Math.round(10 + progress * 236),
  y: Math.round(84 - Math.sin(progress * Math.PI) * 66),
});

function drawSun(ctx, dayTime) {
  const progress = dayTime / SUNSET_AT;
  const center = arcPosition(progress);
  const core = mix([255, 150, 70], [255, 246, 200], clamp(Math.sin(progress * Math.PI) * 1.6, 0, 1));
  drawHalo(ctx, center, 9, rgba(core, 0.35));
  drawDisc(ctx, center, 5, rgb(core));
}

function drawMoon(ctx, dayTime) {
  const center = arcPosition((dayTime - SUNSET_AT) / (1 - SUNSET_AT));
  drawHalo(ctx, center, 7, 'rgba(230,226,205,0.18)');
  drawDisc(ctx, center, 4, '#efe9d2');
  [[-1, -1], [2, 1], [0, 2]].forEach(([x, y]) => plot(ctx, center.x + x, center.y + y, '#cfc8ae'));
}

export function drawCelestial(ctx, dayTime) {
  if (dayTime < SUNSET_AT) {
    drawSun(ctx, dayTime);
    return;
  }
  drawMoon(ctx, dayTime);
}

function makeCloud() {
  const blobs = [];
  let cursor = 0;
  const puffs = 3 + Math.floor(random() * 3);
  for (let index = 0; index < puffs; index++) {
    const radius = 3 + Math.floor(random() * 4);
    blobs.push({ x: cursor + radius, y: -radius * 0.6, radius });
    cursor += radius + 1 + Math.floor(random() * 3);
  }
  const pixels = [];
  for (let y = -10; y <= 0; y++) {
    for (let x = 0; x < cursor + 6; x++) {
      if (!blobs.some(blob => Math.hypot(x - blob.x, y - blob.y) <= blob.radius)) continue;
      pixels.push([x, y, y >= -1]);
    }
  }
  return pixels;
}

const CLOUDS = Array.from({ length: 5 }, () => ({
  pixels: makeCloud(),
  start: random() * (WIDTH + 60),
  y: 14 + Math.floor(random() * 26),
  speed: 1.2 + random() * 2.2,
}));

export function drawClouds(ctx, time, light) {
  const daylight = mix([255, 255, 255], light.horizon, 0.3);
  const base = mix(daylight, light.top, light.night * 0.65);
  const shadow = rgb(mix(base, light.top, 0.35));
  const body = rgb(base);
  CLOUDS.forEach(cloud => {
    const left = Math.round(((cloud.start + cloud.speed * time) % (WIDTH + 60)) - 40);
    cloud.pixels.forEach(([x, y, isShadow]) => plot(ctx, left + x, cloud.y + y, isShadow ? shadow : body));
  });
}
