import { FIRE, isKettleOnFire } from './camp.js';
import { KETTLE_ON_FIRE, cuiaOrigin } from './ritual.js';
import { plot } from './sprite.js';

const MAX_PARTICLES = 180;
const particles = [];
const emitterClock = { smoke: 0, steam: 0, spout: 0 };

function emit(x, y, kind) {
  if (particles.length >= MAX_PARTICLES) return;
  const isSmoke = kind === 'smoke';
  particles.push({
    x,
    y,
    kind,
    vx: (Math.random() - 0.5) * 1.5 + (isSmoke ? 2 : 0.6),
    vy: isSmoke ? -7 : -5,
    life: 0,
    max: isSmoke ? 3.2 : 1.4,
  });
}

function runEmitter(name, dt, interval, spawn) {
  emitterClock[name] += dt;
  while (emitterClock[name] > interval) {
    emitterClock[name] -= interval;
    spawn();
  }
}

function spawn(dt, pose) {
  runEmitter('smoke', dt, 0.18, () => emit(FIRE.x + Math.random() * 6, FIRE.y - 6, 'smoke'));
  const cuia = cuiaOrigin(pose.hand);
  runEmitter('steam', dt, pose.pouring ? 0.06 : 0.5, () => emit(cuia.x + 2 + Math.random() * 2, cuia.y + 1, 'steam'));
  if (!isKettleOnFire(pose)) return;
  runEmitter('spout', dt, 0.7, () => emit(KETTLE_ON_FIRE.x, KETTLE_ON_FIRE.y + 2, 'steam'));
}

export function updateParticles(dt, pose) {
  spawn(dt, pose);
  particles.forEach(particle => {
    particle.life += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  });
  for (let index = particles.length - 1; index >= 0; index--) {
    if (particles[index].life > particles[index].max) particles.splice(index, 1);
  }
}

export function drawParticles(g) {
  particles.forEach(particle => {
    const fade = 1 - particle.life / particle.max;
    const isSmoke = particle.kind === 'smoke';
    const size = isSmoke && particle.life > 1.2 ? 2 : 1;
    const color = isSmoke ? `rgba(180,175,165,${fade * 0.5})` : `rgba(242,242,236,${fade * 0.7})`;
    plot(g, Math.round(particle.x), Math.round(particle.y), color, size);
  });
}
