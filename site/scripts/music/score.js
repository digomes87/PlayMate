// Original 8-bit milonga for the scene: A minor, 2/4, sixteenth-note grid,
// bass in the 3-3-2 pattern typical of the milonga.

export const TEMPO_BPM = 92;
export const STEPS_PER_BAR = 8;
export const STEP_SECONDS = 60 / TEMPO_BPM / 4;

const NOTE_OFFSETS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

export function noteToFrequency(name) {
  const [, letter, accidental, octave] = name.match(/^([A-G])(#?)(\d)$/);
  const semitones = NOTE_OFFSETS[letter] + (accidental ? 1 : 0) + (Number(octave) - 4) * 12;
  return 440 * 2 ** (semitones / 12);
}

const CHORDS = {
  Am: { root: 'A2', fifth: 'E3', triad: ['A3', 'C4', 'E4'] },
  Dm: { root: 'D2', fifth: 'A2', triad: ['D4', 'F4', 'A4'] },
  E7: { root: 'E2', fifth: 'B2', triad: ['G#3', 'D4', 'E4'] },
  C: { root: 'C2', fifth: 'G2', triad: ['C4', 'E4', 'G4'] },
  G7: { root: 'G2', fifth: 'D3', triad: ['B3', 'D4', 'F4'] },
};

// Each melody token is NOTE:STEPS; "r" is a rest.
const BARS = [
  ['Am', 'A4:3 C5:3 E5:2'],
  ['Am', 'D5:2 C5:2 B4:2 A4:2'],
  ['E7', 'G#4:3 B4:3 D5:2'],
  ['E7', 'E5:6 r:2'],
  ['Dm', 'F5:3 E5:3 D5:2'],
  ['Am', 'C5:3 B4:3 A4:2'],
  ['E7', 'B4:2 G#4:2 B4:2 D5:2'],
  ['Am', 'A4:6 r:2'],
  ['C', 'E5:3 G5:3 E5:2'],
  ['G7', 'D5:3 F5:3 D5:2'],
  ['C', 'C5:2 E5:2 G5:2 E5:2'],
  ['E7', 'D5:3 B4:3 G#4:2'],
  ['Am', 'A4:3 C5:3 E5:2'],
  ['Dm', 'F5:2 E5:2 D5:2 F5:2'],
  ['E7', 'E5:3 D5:3 B4:2'],
  ['Am', 'A4:6 r:2'],
];

export const STEPS_PER_LOOP = BARS.length * STEPS_PER_BAR;

export function parseMelody(text) {
  let cursor = 0;
  return text.split(' ').map(token => {
    const [note, steps] = token.split(':');
    const event = { note, start: cursor, steps: Number(steps) };
    cursor += event.steps;
    return event;
  });
}

const BASS_PATTERN = [
  { step: 0, part: 'root', steps: 3, octave: 1 },
  { step: 3, part: 'fifth', steps: 3, octave: 1 },
  { step: 6, part: 'root', steps: 2, octave: 2 },
];
const STAB_STEPS = [3, 6];
const DRUMS = ['kick', null, 'shaker', 'tap', 'shaker', null, 'tap', 'shaker'];

function melodyEvents(melody, step) {
  return melody
    .filter(event => event.start === step && event.note !== 'r')
    .map(event => ({ voice: 'lead', frequency: noteToFrequency(event.note), steps: event.steps }));
}

function bassEvents(chord, step) {
  return BASS_PATTERN
    .filter(hit => hit.step === step)
    .map(hit => ({ voice: 'bass', frequency: noteToFrequency(chord[hit.part]) * hit.octave, steps: hit.steps }));
}

function stabEvents(chord, step) {
  if (!STAB_STEPS.includes(step)) return [];
  return chord.triad.map(note => ({ voice: 'stab', frequency: noteToFrequency(note), steps: 1 }));
}

function drumEvents(step) {
  const voice = DRUMS[step];
  return voice ? [{ voice, steps: 1 }] : [];
}

const TIMELINE = BARS.map(([chordName, melodyText]) => {
  const chord = CHORDS[chordName];
  const melody = parseMelody(melodyText);
  return Array.from({ length: STEPS_PER_BAR }, (_, step) => [
    ...melodyEvents(melody, step),
    ...bassEvents(chord, step),
    ...stabEvents(chord, step),
    ...drumEvents(step),
  ]);
});

export const barLengths = () => BARS.map(([, melodyText]) => parseMelody(melodyText)
  .reduce((total, event) => total + event.steps, 0));

export function eventsForStep(loopStep) {
  const step = ((loopStep % STEPS_PER_LOOP) + STEPS_PER_LOOP) % STEPS_PER_LOOP;
  return TIMELINE[Math.floor(step / STEPS_PER_BAR)][step % STEPS_PER_BAR];
}
