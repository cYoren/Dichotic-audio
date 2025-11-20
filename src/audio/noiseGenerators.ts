/**
 * Creates a white noise buffer.
 * White noise has equal power across all frequencies.
 */
export function createWhiteNoiseBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const sampleRate = context.sampleRate;
  const bufferSize = sampleRate * durationSeconds;
  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Math.random() is [0, 1), transform to [-1, 1)
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

/**
 * Creates a pink noise buffer.
 * Pink noise decreases in power by 3dB per octave (1/f).
 * Uses the Voss-McCartney algorithm for approximation.
 */
export function createPinkNoiseBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const sampleRate = context.sampleRate;
  const bufferSize = sampleRate * durationSeconds;
  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;

    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;

    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // (roughly) compensate for gain
    b6 = white * 0.115926;
  }

  return buffer;
}

