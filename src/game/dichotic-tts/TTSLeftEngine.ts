import { TTSLoader } from './TTSLoader';

export class TTSLeftEngine {
  private context: AudioContext;
  private panner: StereoPannerNode;
  private gain: GainNode;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(context: AudioContext) {
    this.context = context;
    this.panner = this.context.createStereoPanner();
    this.panner.pan.value = -1; // Hard Left
    this.gain = this.context.createGain();
    
    this.panner.connect(this.gain);
    this.gain.connect(this.context.destination);
  }

  setVolume(value: number) {
    this.gain.gain.value = value;
  }

  scheduleDigit(digit: number, time: number, playbackRate: number = 1.0) {
    const buffer = TTSLoader.getBuffer(digit);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    source.connect(this.panner);
    source.start(time);
    
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
    
    this.activeSources.push(source);
  }

  stop() {
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.activeSources = [];
  }
}
