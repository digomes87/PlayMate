import { lerpPoint, smooth } from './pixel-math.js';

// Positions are relative to the top-left pixel of the seated gaucho.
export const GAUCHO_ORIGIN = { x: 12, y: 103 };
export const at = (x, y) => ({ x: GAUCHO_ORIGIN.x + x, y: GAUCHO_ORIGIN.y + y });

export const NEAR_SHOULDER = at(10, 12);
export const FAR_SHOULDER = at(8, 12);
export const HAND_REST = at(16, 17);
export const HAND_RAISED = at(14, 12);
export const KETTLE_ON_FIRE = at(25, 21);
export const KETTLE_POURING = at(18, 7);
const ELBOW_REST = at(10, 17);
const ELBOW_RAISED = at(12, 17);

export const handleOf = (position, tilted) => ({ x: position.x + (tilted ? 4 : 3), y: position.y });
export const cuiaOrigin = hand => ({ x: hand.x - 1, y: hand.y - 4 });

const RESTING = {
  hand: HAND_REST,
  elbow: ELBOW_REST,
  kettle: KETTLE_ON_FIRE,
  tilted: false,
  farHand: null,
  eyesClosed: false,
  pouring: false,
};

const carryKettle = (from, to, fraction) => {
  const kettle = lerpPoint(from, to, fraction);
  return { ...RESTING, kettle, farHand: handleOf(kettle, false) };
};

const POSES = {
  rest: () => RESTING,
  raise: f => ({ ...RESTING, hand: lerpPoint(HAND_REST, HAND_RAISED, f), elbow: lerpPoint(ELBOW_REST, ELBOW_RAISED, f) }),
  sip: () => ({ ...RESTING, hand: HAND_RAISED, elbow: ELBOW_RAISED, eyesClosed: true }),
  lower: f => ({ ...RESTING, hand: lerpPoint(HAND_RAISED, HAND_REST, f), elbow: lerpPoint(ELBOW_RAISED, ELBOW_REST, f) }),
  reach: f => ({ ...RESTING, farHand: lerpPoint(FAR_SHOULDER, handleOf(KETTLE_ON_FIRE, false), f) }),
  lift: f => carryKettle(KETTLE_ON_FIRE, KETTLE_POURING, f),
  pour: () => ({ ...RESTING, kettle: KETTLE_POURING, tilted: true, farHand: handleOf(KETTLE_POURING, true), pouring: true }),
  putBack: f => carryKettle(KETTLE_POURING, KETTLE_ON_FIRE, f),
  release: f => ({ ...RESTING, farHand: lerpPoint(handleOf(KETTLE_ON_FIRE, false), FAR_SHOULDER, f) }),
};

// One round: serve the mate, then drink it in two sips.
export const RITUAL = [
  ['rest', 2.5], ['reach', 0.9], ['lift', 1.1], ['pour', 2.0], ['putBack', 1.1], ['release', 0.8],
  ['rest', 2.5], ['raise', 0.9], ['sip', 2.4], ['lower', 0.9],
  ['rest', 3.0], ['raise', 0.9], ['sip', 2.4], ['lower', 0.9],
];

const sumDurations = steps => steps.reduce((total, [, duration]) => total + duration, 0);

export const RITUAL_LENGTH = sumDurations(RITUAL);
const POUR_ENDS_AT = sumDurations(RITUAL.slice(0, RITUAL.findIndex(([name]) => name === 'pour') + 1));

export function ritualAt(time) {
  const round = Math.floor(time / RITUAL_LENGTH);
  const elapsed = time - round * RITUAL_LENGTH;
  const servedCount = round + (elapsed >= POUR_ENDS_AT ? 1 : 0);
  let remaining = elapsed;
  for (const [name, duration] of RITUAL) {
    if (remaining < duration) return { step: name, pose: POSES[name](smooth(remaining / duration)), servedCount };
    remaining -= duration;
  }
  return { step: 'rest', pose: RESTING, servedCount };
}
