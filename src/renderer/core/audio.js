import { EA } from './bindings';

let audioContext = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Normalise whatever GET_AUDIO returns (Buffer over IPC, Uint8Array, ArrayBuffer)
// into a standalone ArrayBuffer.
const toArrayBuffer = (data) => {
  if (!data) {
    return null;
  }
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  // IPC may serialise a Node Buffer as { type: 'Buffer', data: [...] }
  if (Array.isArray(data?.data)) {
    return new Uint8Array(data.data).buffer;
  }
  return null;
};

const bufferCache = {};

// Fetch + decode an audio source into an AudioBuffer (cached per project/src).
export const loadAudioBuffer = async (projectId, src) => {
  const key = `${projectId}/${src}`;
  if (!bufferCache[key]) {
    bufferCache[key] = (async () => {
      const raw = await EA('GET_AUDIO', { project_id: projectId, src });
      const arrayBuffer = toArrayBuffer(raw);
      if (!arrayBuffer) {
        return null;
      }
      return getAudioContext().decodeAudioData(arrayBuffer);
    })().catch(() => null);
  }
  return bufferCache[key];
};

// Decode just enough to read the duration of a freshly-imported file.
// decodeAudioData detaches the buffer, so we always work on a copy.
export const getAudioDurationFromArrayBuffer = async (arrayBuffer) => {
  const decoded = await getAudioContext().decodeAudioData(arrayBuffer.slice(0));
  return decoded.duration;
};

// Extract `buckets` peak amplitudes (0..1) over the [startSec, startSec+durationSec]
// window of an AudioBuffer — used to draw a clip's waveform.
export const getPeaks = (audioBuffer, startSec, durationSec, buckets) => {
  if (!audioBuffer || buckets <= 0) {
    return [];
  }
  const { sampleRate, length } = audioBuffer;
  const channel = audioBuffer.getChannelData(0);
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(length, Math.floor((startSec + durationSec) * sampleRate));
  const totalSamples = Math.max(1, endSample - startSample);
  const per = totalSamples / buckets;
  const peaks = new Array(buckets).fill(0);
  for (let b = 0; b < buckets; b++) {
    const from = startSample + Math.floor(b * per);
    const to = Math.min(endSample, startSample + Math.floor((b + 1) * per));
    let peak = 0;
    for (let i = from; i < to; i++) {
      const v = Math.abs(channel[i]);
      if (v > peak) {
        peak = v;
      }
    }
    peaks[b] = peak;
  }
  return peaks;
};
