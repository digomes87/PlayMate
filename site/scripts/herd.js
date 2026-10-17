import { clamp, seededRandom } from './pixel-math.js';
import { drawSprite, makeSprite, plot } from './sprite.js';

const FIELD_MIN = 64;
const FIELD_MAX = 252;
const random = seededRandom(1752);
const SPECIES = {};

function defineSpecies(name, spec) {
  const width = Math.max(spec.body.w, spec.headIdle.x + spec.head.w, spec.headGraze.x + spec.head.w);
  SPECIES[name] = { ...spec, width };
}

const COW_PALETTE = { C: '#6e2e18', c: '#8c3f22', w: '#efe7d6', t: '#6e2e18', T: '#2a1a12', h: '#e2d6b2', E: '#1a1410', n: '#c98a7a' };
defineSpecies('cow', {
  body: makeSprite([
    '..CCCCCCCCCC',
    '.Cccccccccccc',
    'tccccccccccccc',
    'tccccccccccccc',
    't.cccccccccccw',
    'T.ccwwccccccw',
    '...cwwwccccc',
  ], COW_PALETTE),
  head: makeSprite(['h...h', 'cwwwc', 'wwwEw', '.wwww', '.wwn.'], COW_PALETTE),
  headIdle: { x: 12, y: -2 },
  headGraze: { x: 13, y: 3 },
  legs: [3, 5, 10, 12],
  legHeight: 3,
  legColor: '#6e2e18',
  hoof: '#2a1a12',
  speed: 4,
});

const HORSE_BODY = [
  '..............MM',
  '.............MBBb',
  '............MBBB',
  '...BBBBBBBBBBBBB',
  'TBBBBBBBBBBBBBB',
  'TBBBBBBBBBBBBBb',
  'T.bBBBBBBBBBBb',
  'T..bbbbbbbbbb',
];
const HORSE_HEAD = ['BB....', 'BBBBB.', 'BEBBBB', '...BBn'];

function defineHorse(name, palette) {
  defineSpecies(name, {
    body: makeSprite(HORSE_BODY, palette),
    head: makeSprite(HORSE_HEAD, palette),
    headIdle: { x: 15, y: -2 },
    headGraze: { x: 14, y: 7 },
    legs: [3, 5, 12, 14],
    legHeight: 6,
    legColor: palette.b,
    hoof: '#1a120c',
    speed: 6,
  });
}

defineHorse('horseDark', { B: '#6b3f22', b: '#4e2c17', M: '#1e1410', T: '#1e1410', E: '#120c08', n: '#3a2418' });
defineHorse('horseBay', { B: '#c9a25a', b: '#a8823f', M: '#3a2a1a', T: '#3a2a1a', E: '#1a120c', n: '#6a4a2a' });

const SHEEP_PALETTE = { w: '#e9e4d6', v: '#c9c2b0', f: '#2b2420' };
defineSpecies('sheep', {
  body: makeSprite(['.wwwwwww', 'wwwwwwwww', 'wwwwwwwwwv', 'vwwwwwwwwv', '.vvwwwwvv'], SHEEP_PALETTE),
  head: makeSprite(['ff.', 'fff', '.ff'], SHEEP_PALETTE),
  headIdle: { x: 8, y: -1 },
  headGraze: { x: 9, y: 3 },
  legs: [2, 3, 6, 7],
  legHeight: 2,
  legColor: '#2b2420',
  hoof: '#2b2420',
  speed: 3,
});

export const HERD = [
  ['cow', 96, 99], ['cow', 150, 106], ['cow', 204, 113], ['cow', 120, 121],
  ['horseDark', 180, 101], ['horseBay', 84, 116],
  ['sheep', 140, 110], ['sheep', 152, 112], ['sheep', 163, 109], ['sheep', 228, 104], ['sheep', 218, 121],
].map(([kind, x, y], index) => ({
  kind,
  x,
  y,
  dir: index % 2 ? 1 : -1,
  state: index % 3 ? 'graze' : 'walk',
  timer: 1 + random() * 6,
  stride: 0,
  seed: index,
}));

function walk(animal, species, dt) {
  animal.x += animal.dir * species.speed * dt;
  animal.stride += dt * species.speed * 0.5;
  const limit = FIELD_MAX - species.width;
  if (animal.x >= FIELD_MIN && animal.x <= limit) return;
  animal.dir *= -1;
  animal.x = clamp(animal.x, FIELD_MIN, limit);
}

function switchActivity(animal) {
  if (animal.state === 'walk') {
    animal.state = 'graze';
    animal.timer = 3 + Math.random() * 7;
    return;
  }
  animal.state = 'walk';
  animal.timer = 2 + Math.random() * 5;
  if (Math.random() < 0.4) animal.dir *= -1;
}

export function updateHerd(dt) {
  HERD.forEach(animal => {
    const species = SPECIES[animal.kind];
    animal.timer -= dt;
    if (animal.state === 'walk') walk(animal, species, dt);
    if (animal.timer <= 0) switchActivity(animal);
  });
}

function drawLegs(g, species, top, place, stride) {
  species.legs.forEach((legX, index) => {
    const lifted = index % 2 === stride;
    const height = species.legHeight - (lifted ? 1 : 0);
    const x = place(legX + (lifted ? 1 : 0), 1);
    g.fillStyle = species.legColor;
    g.fillRect(x, top + species.body.h, 1, height - 1);
    plot(g, x, top + species.body.h + height - 1, species.hoof);
  });
}

function drawAnimal(g, animal, time) {
  const species = SPECIES[animal.kind];
  const grazing = animal.state === 'graze';
  const head = grazing ? species.headGraze : species.headIdle;
  const chew = grazing ? Math.floor(time * 2 + animal.seed) % 2 : 0;
  const top = Math.round(animal.y) - species.body.h - species.legHeight;
  const left = Math.round(animal.x);
  const flip = animal.dir < 0;
  const place = (localX, width) => (flip ? left + species.width - localX - width : left + localX);
  drawLegs(g, species, top, place, grazing ? -1 : Math.floor(animal.stride) % 2);
  drawSprite(g, species.body, place(0, species.body.w), top, flip);
  drawSprite(g, species.head, place(head.x, species.head.w), top + head.y + chew, flip);
}

export function drawHerd(g, time) {
  [...HERD].sort((a, b) => a.y - b.y).forEach(animal => drawAnimal(g, animal, time));
}
