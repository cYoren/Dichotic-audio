export class TTSLoader {
  private static buffers: Map<string, AudioBuffer> = new Map();
  private static context: AudioContext;

  static async init(context: AudioContext) {
    this.context = context;
  }

  static async loadDigits(): Promise<void> {
    if (this.buffers.size === 10) return;

    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // 1. First priority: Check for local files in public/assets/digits
    // This is the "Senior Developer" fix: serve from own origin to avoid CORS.
    const loadPromises = digits.map(async (digit) => {
        try {
            // Attempt to fetch from local public folder
            // Note: Vite serves /public at root /
            const response = await fetch(`/assets/digits/${digit}.mp3`);
            
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.buffers.set(digit.toString(), audioBuffer);
                return;
            }
            
            // If local file is missing (404), fallback to generated tone
            throw new Error("Local asset missing");

        } catch (e) {
            console.warn(`Local TTS file missing for ${digit}, using fallback.`, e);
            this.generateTone(digit);
        }
    });

    await Promise.all(loadPromises);
  }

  private static generateTone(digit: number) {
    // Fallback: Musical Tones (Pentatonic)
    // This ensures the app NEVER crashes even if downloads fail.
    const duration = 0.3; 
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    const scale = [
        261.63, 293.66, 329.63, 392.00, 440.00, 
        523.25, 587.33, 659.25, 783.99, 880.00 
    ];
    const freq = scale[digit];

    for (let i = 0; i < data.length; i++) {
      const t = i / this.context.sampleRate;
      let envelope = 1;
      if (t < 0.02) envelope = t / 0.02;
      else if (t > duration - 0.05) envelope = (duration - t) / 0.05;
      else envelope = Math.exp(-2 * (t - 0.02));

      const val = 
        0.5 * Math.sin(2 * Math.PI * freq * t) + 
        0.3 * Math.sin(2 * Math.PI * freq * 2 * t) + 
        0.1 * Math.sin(2 * Math.PI * freq * 4 * t);

      data[i] = val * envelope * 0.3; 
    }
    
    this.buffers.set(digit.toString(), buffer);
  }

  static getBuffer(digit: number): AudioBuffer | undefined {
    return this.buffers.get(digit.toString());
  }
}
