import { bayer, hash } from './pixel-math.js';
import {
  FAR_SHOULDER, GAUCHO_ORIGIN, HAND_REST, KETTLE_ON_FIRE, KETTLE_POURING, NEAR_SHOULDER, at, cuiaOrigin,
} from './ritual.js';
import { drawLimb, drawSprite, makeSprite, plot } from './sprite.js';

export const FIRE = at(25, 31);
const DOG_POSITION = at(35, 26);
const EYE = at(11, 5);
const SKIN = '#c68a5e';
const SKIN_SHADE = '#9f6a44';
const SLEEVE = '#e8e1cf';
const FAR_SLEEVE = '#b9b29e';

const GAUCHO = makeSprite([
  '.......KKKKK',
  '......KKKKKKK',
  '......KkkkkkK',
  '...KKKKKKKKKKKKK',
  '.......HHSSSS',
  '.......HSSSESS',
  '.......HSSSSSSS',
  '.......HSSmmmSs',
  '........sSSSSs',
  '.........sSS',
  '........RRRRRR',
  '.......VRRrRRR',
  '......VVVVWRrW',
  '......VVVVVWWWV',
  '......VVVVVWWWV',
  '......vVVVVWWWV',
  '......vVVVVVWWV',
  '......vVVVVVVVV',
  '......BBBBBBCBB',
  '......gGGGGGGGGGGGGG',
  '......gGGGGGGGGGGGGGGG',
  '.......ggGGGGGGGGGGGGGG',
  '................GGGGGGGG',
  '................gGGGGGGG',
  '................gGGGGGGG',
  '................gGGGGGG',
  '................ggGGGG',
  '.................OOOOO',
  '.................OOOOO',
  '.................OOOOO',
  '................COOOOOOO',
  '.................ooooooo',
], {
  K: '#1b1714', k: '#4a3a2c', H: '#2a1d16', S: SKIN, s: SKIN_SHADE, E: '#1a1210', m: '#2a1d16',
  R: '#b3262b', r: '#7e1a1e', V: '#2f2a24', v: '#1f1b17', W: SLEEVE, B: '#5a3a22', C: '#d8d6c8',
  G: '#4a4a44', g: '#33332f', O: '#2a1c14', o: '#140d09',
});

const CUIA = makeSprite(['b....', '.b...', '.AeeA', '.UUUU', 'UUUUU', 'UUUUu', '.uUu.'], {
  b: '#d8d6c8', A: '#cfcab8', e: '#6f9a32', U: '#7a6a34', u: '#56491f',
});

const KETTLE_PALETTE = { K: '#2b2b2e', L: '#55555c', h: '#1a1a1c', s: '#2b2b2e' };
const KETTLE_UPRIGHT = makeSprite(['..hhh..', '.h...h.', '..LKK..', 'sKLKKK.', '.KKKKK.', '..KKK..'], KETTLE_PALETTE);
const KETTLE_TILTED = makeSprite(['...hhh.', '..h...h', '..LKKK.', '.KLKKKK', 'sKKKKK.', '.KKKK..'], KETTLE_PALETTE);

const DOG = makeSprite(['.ee.........', 'dddd........', 'dEddddddddd.', 'nddddddddddd', 'pppdddddddd.'], {
  d: '#b07a3a', e: '#7a4e22', E: '#2a1a10', n: '#1a1210', p: '#c79458',
});

function drawStump(g) {
  const x = GAUCHO_ORIGIN.x + 5;
  const y = GAUCHO_ORIGIN.y + 20;
  g.fillStyle = '#6f4a2e';
  g.fillRect(x, y, 11, 13);
  g.fillStyle = '#4f331f';
  g.fillRect(x, y, 1, 13);
  for (let offset = 3; offset < 11; offset += 4) g.fillRect(x + offset, y + 2, 1, 10);
}

export function drawStones(g) {
  for (let offset = -1; offset <= 6; offset++) plot(g, FIRE.x + offset, FIRE.y + 1, offset % 2 ? '#77736a' : '#5a564e');
  plot(g, FIRE.x - 1, FIRE.y, '#77736a');
  plot(g, FIRE.x + 6, FIRE.y, '#5a564e');
}

// The cusco sleeps by the fire and wags its tail now and then.
export function drawDog(g, time) {
  drawSprite(g, DOG, DOG_POSITION.x, DOG_POSITION.y);
  const tailUp = time % 7 < 1.5 && Math.floor(time * 8) % 2 === 0;
  g.fillStyle = '#8a5a28';
  g.fillRect(DOG_POSITION.x + 12, DOG_POSITION.y + (tailUp ? 1 : 3), 2, 1);
}

function drawWater(g, time) {
  for (let y = KETTLE_POURING.y + 5; y <= HAND_REST.y - 3; y++) {
    plot(g, KETTLE_POURING.x, y, (y + Math.floor(time * 12)) % 2 ? '#bfe3f0' : '#e6f6fb');
  }
}

function drawNearArm(g, pose) {
  drawLimb(g, NEAR_SHOULDER, pose.elbow, SLEEVE);
  drawLimb(g, pose.elbow, { x: pose.hand.x - 1, y: pose.hand.y }, SLEEVE);
  plot(g, pose.hand.x, pose.hand.y, SKIN, 2);
}

export function drawGaucho(g, pose, time) {
  drawStump(g);
  if (pose.farHand) drawLimb(g, FAR_SHOULDER, pose.farHand, FAR_SLEEVE);
  drawSprite(g, GAUCHO, GAUCHO_ORIGIN.x, GAUCHO_ORIGIN.y);
  if (pose.eyesClosed || time % 4.7 < 0.13) plot(g, EYE.x, EYE.y, SKIN_SHADE);
  drawSprite(g, pose.tilted ? KETTLE_TILTED : KETTLE_UPRIGHT, pose.kettle.x, pose.kettle.y);
  if (pose.farHand) plot(g, pose.farHand.x, pose.farHand.y, SKIN_SHADE, 2);
  if (pose.pouring) drawWater(g, time);
  const cuia = cuiaOrigin(pose.hand);
  drawSprite(g, CUIA, cuia.x, cuia.y);
  drawNearArm(g, pose);
}

const FLAME_COLORS = ['#fff0a0', '#ffa733', '#e2482a'];

function drawFlame(ctx, column, frame, kettleOnFire) {
  const center = 1 - Math.abs(column - 2.5) / 3;
  const tall = Math.round(1 + center * 3 + hash(column, frame) * 2);
  const height = kettleOnFire ? Math.min(tall, 4) : tall;
  for (let row = 0; row < height; row++) {
    plot(ctx, FIRE.x + column, FIRE.y - 1 - row, FLAME_COLORS[Math.min(2, Math.floor((row / height) * 3))]);
  }
}

export function drawFire(ctx, time, kettleOnFire) {
  const frame = Math.floor(time * 12);
  for (let column = 0; column < 6; column++) {
    drawFlame(ctx, column, frame, kettleOnFire);
    plot(ctx, FIRE.x + column, FIRE.y, hash(column + 40, Math.floor(time * 4)) > 0.5 ? '#ff7a2a' : '#a8321c');
  }
}

const GLOW_RADIUS = 32;

export function drawFireGlow(ctx, light) {
  if (light.night < 0.05) return;
  const centerX = FIRE.x + 3;
  const centerY = FIRE.y - 3;
  ctx.fillStyle = 'rgba(255,150,70,0.2)';
  for (let y = -GLOW_RADIUS; y <= GLOW_RADIUS; y++) {
    for (let x = -GLOW_RADIUS; x <= GLOW_RADIUS; x++) {
      const falloff = 1 - Math.hypot(x, y) / GLOW_RADIUS;
      if (falloff * light.night * 1.1 <= bayer(centerX + x, centerY + y)) continue;
      ctx.fillRect(centerX + x, centerY + y, 1, 1);
    }
  }
}

export const isKettleOnFire = pose => pose.kettle === KETTLE_ON_FIRE;
