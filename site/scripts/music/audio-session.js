// iPhone and iPad mute Web Audio while the ring/silent switch is on. Declaring a
// "playback" audio session (Safari 16.4+) or, on older versions, playing a silent
// <audio> loop moves the page into the media category so the milonga is heard.

const SAMPLE_RATE = 8000;
const SILENCE_SECONDS = 0.5;
const WAV_HEADER_BYTES = 44;
const SILENT_SAMPLE = 128;

function writeText(view, offset, text) {
  [...text].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
}

// Mono 8-bit PCM WAV filled with silence.
export function silentWav(seconds = SILENCE_SECONDS, sampleRate = SAMPLE_RATE) {
  const sampleCount = Math.round(seconds * sampleRate);
  const bytes = new Uint8Array(WAV_HEADER_BYTES + sampleCount).fill(SILENT_SAMPLE, WAV_HEADER_BYTES);
  const view = new DataView(bytes.buffer);
  writeText(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount, true);
  writeText(view, 8, 'WAVE');
  writeText(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeText(view, 36, 'data');
  view.setUint32(40, sampleCount, true);
  return bytes;
}

function createSilentLoop() {
  const element = new Audio(URL.createObjectURL(new Blob([silentWav()], { type: 'audio/wav' })));
  element.loop = true;
  element.setAttribute('playsinline', '');
  return element;
}

export function createAudioSession() {
  let silentLoop = null;
  return {
    engage() {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
      silentLoop = silentLoop || createSilentLoop();
      // Only a fallback for older iOS; Web Audio still plays where this is refused.
      return silentLoop.play().catch(() => undefined);
    },
    release() {
      if (silentLoop) silentLoop.pause();
    },
  };
}
