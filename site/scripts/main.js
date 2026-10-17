import { drawBirds, drawFireflies } from './ambient.js';
import { drawDog, drawFire, drawFireGlow, drawGaucho, drawStones, isKettleOnFire } from './camp.js';
import { drawHerd, updateHerd } from './herd.js';
import { TUFTS, buildLandscape, drawTuft } from './landscape.js';
import { lightAt } from './light.js';
import { drawParticles, updateParticles } from './particles.js';
import { HEIGHT, WIDTH, rgba } from './pixel-math.js';
import { ritualAt } from './ritual.js';
import { drawCelestial, drawClouds, drawStars, paintSky } from './sky.js';
import { createLayer } from './sprite.js';

const DAY_LENGTH_SECONDS = 120;
const FRONT_TUFT_LINE = 136;
const MAX_FRAME_SECONDS = 0.1;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const counter = document.getElementById('cuia-count');
const playButton = document.getElementById('toggle-play');
const timeButtons = [...document.querySelectorAll('[data-time]')];

const landscape = buildLandscape();
const scene = createLayer();
const backTufts = TUFTS.filter(tuft => tuft.y < FRONT_TUFT_LINE);
const frontTufts = TUFTS.filter(tuft => tuft.y >= FRONT_TUFT_LINE);

const state = {
  playing: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  cycle: true,
  dayTime: 0.42,
  animTime: 3,
  servedCount: -1,
  dirty: true,
};

// Everything on the ground goes through one layer so the time-of-day tint hits it but not the sky.
function drawGround(time, light, pose) {
  const g = scene.ctx;
  g.clearRect(0, 0, WIDTH, HEIGHT);
  g.drawImage(landscape, 0, 0);
  drawBirds(g, time, light);
  drawHerd(g, time);
  backTufts.forEach(tuft => drawTuft(g, tuft, time));
  drawStones(g);
  drawDog(g, time);
  drawGaucho(g, pose, time);
  frontTufts.forEach(tuft => drawTuft(g, tuft, time));
  drawParticles(g);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = rgba(light.tint, light.tint[3]);
  g.fillRect(0, 0, WIDTH, HEIGHT);
  g.globalCompositeOperation = 'source-over';
}

function render() {
  const light = lightAt(state.dayTime);
  const { pose } = ritualAt(state.animTime);
  paintSky(ctx, light);
  drawStars(ctx, state.animTime, light);
  drawCelestial(ctx, state.dayTime);
  drawClouds(ctx, state.animTime, light);
  drawGround(state.animTime, light, pose);
  ctx.drawImage(scene.canvas, 0, 0);
  drawFireGlow(ctx, light);
  drawFire(ctx, state.animTime, isKettleOnFire(pose));
  drawFireflies(ctx, state.animTime, light);
}

function update(dt) {
  state.animTime += dt;
  if (state.cycle) state.dayTime = (state.dayTime + dt / DAY_LENGTH_SECONDS) % 1;
  updateHerd(dt);
  const ritual = ritualAt(state.animTime);
  updateParticles(dt, ritual.pose);
  if (ritual.servedCount === state.servedCount) return;
  state.servedCount = ritual.servedCount;
  counter.textContent = String(ritual.servedCount);
}

let lastFrame = performance.now();

function frame(now) {
  const dt = Math.min(MAX_FRAME_SECONDS, (now - lastFrame) / 1000);
  lastFrame = now;
  if (state.playing) update(dt);
  if (state.playing || state.dirty) render();
  state.dirty = false;
  requestAnimationFrame(frame);
}

function isActive(button) {
  if (button.dataset.time === 'cycle') return state.cycle;
  return !state.cycle && Number(button.dataset.time) === state.dayTime;
}

function syncControls() {
  timeButtons.forEach(button => button.setAttribute('aria-pressed', String(isActive(button))));
  playButton.textContent = playButton.dataset[state.playing ? 'labelPause' : 'labelPlay'];
}

timeButtons.forEach(button => button.addEventListener('click', () => {
  state.cycle = button.dataset.time === 'cycle';
  if (!state.cycle) state.dayTime = Number(button.dataset.time);
  state.dirty = true;
  syncControls();
}));

playButton.addEventListener('click', () => {
  state.playing = !state.playing;
  state.dirty = true;
  syncControls();
});

update(0);
syncControls();
render();
requestAnimationFrame(frame);
