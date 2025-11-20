import { createWhiteNoiseBuffer, createPinkNoiseBuffer } from './noiseGenerators';

type NoiseType = 'none' | 'white' | 'pink' | 'file';

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Buffers
  private leftBuffer: AudioBuffer | null = null;
  private rightBuffer: AudioBuffer | null = null;
  private noiseBuffer: AudioBuffer | null = null; // Generated noise
  private customNoiseBuffer: AudioBuffer | null = null; // User uploaded noise

  // Active Nodes
  private leftSource: AudioBufferSourceNode | null = null;
  private rightSource: AudioBufferSourceNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;

  private merger: ChannelMergerNode | null = null;
  private noisePanner: StereoPannerNode | null = null;

  // State
  private _isPlaying: boolean = false;
  private startTime: number = 0;
  private pausedOffset: number = 0;

  // Configuration
  private volLeft: number = 1;
  private volRight: number = 1;
  private volNoise: number = 1;
  private volMaster: number = 1;
  private imbalance: number = 0;
  private currentNoiseType: NoiseType = 'none';

  // Callbacks
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onEnded: (() => void) | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    // Defer context creation
  }

  async init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      
      // Try to force stereo output if supported
      if (this.context.destination.maxChannelCount >= 2) {
        this.context.destination.channelCount = 2;
        this.context.destination.channelCountMode = 'explicit';
      }

      // Initialize channel nodes
      this.setupChannelNodes();
      
      this.applyVolumes();
    }
    
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  private setupChannelNodes() {
    if (!this.context || !this.masterGain) return;

    // Create Merger for strict separation (Left Track -> Left Ear, Right Track -> Right Ear)
    this.merger = this.context.createChannelMerger(2);
    this.merger.connect(this.masterGain);

    // Left Channel
    this.leftGain = this.context.createGain();
    // Connect Left Gain to Merger Input 0 (Left Channel)
    // ChannelMerger automatically downmixes input to mono if it's stereo
    this.leftGain.connect(this.merger, 0, 0);

    // Right Channel
    this.rightGain = this.context.createGain();
    // Connect Right Gain to Merger Input 1 (Right Channel)
    this.rightGain.connect(this.merger, 0, 1);

    // Noise Channel (Keep Panner for noise to allow centering or panning if needed)
    this.noiseGain = this.context.createGain();
    this.noisePanner = this.context.createStereoPanner();
    this.noisePanner.pan.value = 0; // Center default
    this.noiseGain.connect(this.noisePanner);
    this.noisePanner.connect(this.masterGain);
  }

  get isPlaying() {
    return this._isPlaying;
  }

  // --- Loading ---

  async loadLeftTrackFromFile(file: File): Promise<void> {
    const buffer = await this.loadFile(file);
    this.leftBuffer = buffer;
  }

  async loadLeftTrackFromUrl(url: string): Promise<void> {
    const buffer = await this.loadUrl(url);
    this.leftBuffer = buffer;
  }

  async loadRightTrackFromFile(file: File): Promise<void> {
    const buffer = await this.loadFile(file);
    this.rightBuffer = buffer;
  }

  async loadRightTrackFromUrl(url: string): Promise<void> {
    const buffer = await this.loadUrl(url);
    this.rightBuffer = buffer;
  }

  async loadNoiseFromFile(file: File): Promise<void> {
    const buffer = await this.loadFile(file);
    this.customNoiseBuffer = buffer;
    if (this.currentNoiseType === 'file') {
        // If currently playing file noise, we might need to update, but usually load happens before play
    }
  }

  private async loadFile(file: File): Promise<AudioBuffer> {
    await this.init();
    if (!this.context) throw new Error("AudioContext not initialized");
    const arrayBuffer = await file.arrayBuffer();
    return await this.context.decodeAudioData(arrayBuffer);
  }

  private async loadUrl(url: string): Promise<AudioBuffer> {
    await this.init();
    if (!this.context) throw new Error("AudioContext not initialized");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return await this.context.decodeAudioData(arrayBuffer);
  }

  // --- Playback ---

  private generateNoiseIfNeeded() {
    if (!this.context) return;
    // Generate 60s of noise if not exists
    if (!this.noiseBuffer) {
       // We generate both white and pink on demand or pre-generate?
       // Actually noiseBuffer will hold the *current* generated noise.
    }
  }
  
  private getActiveNoiseBuffer(): AudioBuffer | null {
      if (!this.context) return null;
      if (this.currentNoiseType === 'none') return null;
      if (this.currentNoiseType === 'file') return this.customNoiseBuffer;
      
      // Generated
      const duration = 10; // 10 seconds looped is usually enough for noise
      if (this.currentNoiseType === 'white') {
          return createWhiteNoiseBuffer(this.context, duration);
      }
      if (this.currentNoiseType === 'pink') {
          return createPinkNoiseBuffer(this.context, duration);
      }
      return null;
  }

  get duration(): number {
      const l = this.leftBuffer?.duration || 0;
      const r = this.rightBuffer?.duration || 0;
      if (l && r) return Math.min(l, r);
      return l || r;
  }

  play() {
    if (this._isPlaying) return;
    if (!this.context) return; // Should have been inited by user interaction

    // Ensure context is running
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    // Stop any existing (shouldn't happen if logic is correct)
    this.stopSources();

    const startOffset = this.pausedOffset;
    this.startTime = this.context.currentTime - startOffset;

    // Create sources
    if (this.leftBuffer) {
        this.leftSource = this.context.createBufferSource();
        this.leftSource.buffer = this.leftBuffer;
        this.leftSource.connect(this.leftGain!);
        this.leftSource.start(0, startOffset);
    }

    if (this.rightBuffer) {
        this.rightSource = this.context.createBufferSource();
        this.rightSource.buffer = this.rightBuffer;
        this.rightSource.connect(this.rightGain!);
        this.rightSource.start(0, startOffset);
    }

    // Noise
    const noiseBuf = this.getActiveNoiseBuffer();
    if (noiseBuf) {
        this.noiseSource = this.context.createBufferSource();
        this.noiseSource.buffer = noiseBuf;
        this.noiseSource.loop = true;
        this.noiseSource.connect(this.noiseGain!);
        // Noise starts at random or 0? 0 is fine.
        // Should we offset noise? Doesn't matter for noise, but "Background noise is also aligned to start"
        // If it's looped, we just start it.
        // If it's a file, maybe we want it aligned? "Background noise is also aligned to start with them (or looped seamlessly if needed)"
        // If file, start at offset (modulo duration if looping)
        let noiseOffset = startOffset;
        if (noiseBuf.duration > 0) {
            noiseOffset = startOffset % noiseBuf.duration;
        }
        this.noiseSource.start(0, noiseOffset);
    }

    this._isPlaying = true;
    this.startTimer();
    
    // Schedule end
    const sessionDuration = this.duration;
    if (sessionDuration > 0 && this.onEnded) {
        // We can use a timeout or check in the loop
    }
  }

  pause() {
    if (!this._isPlaying) return;
    if (!this.context) return;

    this.stopSources();
    this.pausedOffset = this.context.currentTime - this.startTime;
    this._isPlaying = false;
    this.stopTimer();
  }

  stop() {
    this.stopSources();
    this.pausedOffset = 0;
    this._isPlaying = false;
    this.stopTimer();
    if (this.onTimeUpdate) this.onTimeUpdate(0);
  }

  private stopSources() {
    try { this.leftSource?.stop(); } catch (e) {}
    try { this.rightSource?.stop(); } catch (e) {}
    try { this.noiseSource?.stop(); } catch (e) {}

    this.leftSource?.disconnect();
    this.rightSource?.disconnect();
    this.noiseSource?.disconnect();
    
    this.leftSource = null;
    this.rightSource = null;
    this.noiseSource = null;
  }

  // --- Controls ---

  setLeftVolume(val: number) {
    this.volLeft = val;
    this.applyVolumes();
  }

  setRightVolume(val: number) {
    this.volRight = val;
    this.applyVolumes();
  }

  setNoiseVolume(val: number) {
    this.volNoise = val;
    this.applyVolumes();
  }

  setMasterVolume(val: number) {
    this.volMaster = val;
    this.applyVolumes();
  }
  
  setEarImbalance(val: number) {
      this.imbalance = val;
      this.applyVolumes();
  }

  setNoiseType(type: NoiseType) {
      this.currentNoiseType = type;
      // If playing, we might need to restart noise source? 
      // For simplicity, if playing, restart the engine or just the noise. 
      // Restarting noise is smoother.
      if (this._isPlaying) {
          // Stop old noise
          try { this.noiseSource?.stop(); } catch(e) {}
          this.noiseSource?.disconnect();
          
          // Start new noise
          const noiseBuf = this.getActiveNoiseBuffer();
          if (noiseBuf && this.context && this.noiseGain) {
              this.noiseSource = this.context.createBufferSource();
              this.noiseSource.buffer = noiseBuf;
              this.noiseSource.loop = true;
              this.noiseSource.connect(this.noiseGain);
              // Align time
              const currentOffset = this.context.currentTime - this.startTime;
              let noiseOffset = currentOffset % noiseBuf.duration;
              this.noiseSource.start(0, noiseOffset);
          }
      }
  }

  private applyVolumes() {
    if (!this.context) return;
    
    // Imbalance logic:
    // -1: Left 100%, Right reduced
    // 0: Both 100% (relative to their vol)
    // 1: Right 100%, Left reduced
    
    let leftMod = 1;
    let rightMod = 1;
    
    if (this.imbalance < 0) {
        // Lean left: Right reduced
        // 0 -> 1, -1 -> 0
        rightMod = 1 + this.imbalance; // e.g. 1 + (-0.5) = 0.5
    } else if (this.imbalance > 0) {
        // Lean right: Left reduced
        // 0 -> 1, 1 -> 0
        leftMod = 1 - this.imbalance;
    }

    const now = this.context.currentTime;
    // Use exponential ramp for smooth transitions? Or setTargetAtTime.
    // setTargetAtTime is good.
    
    // Helper for safe gain setting
    const setGain = (node: GainNode | null, val: number) => {
        if (!node) return;
        // Clamp minimal value to avoid errors with exponentialRamp
        // But linear is fine for simple volume sliders usually, unless requested exponential.
        // User req: "internally converted to sensible gain values (for example exponential curve)"
        // We can map the 0-1 input to exponential gain here.
        // A simple way: val^2 or val^3.
        const expVal = val * val; 
        node.gain.setTargetAtTime(expVal, now, 0.01); // fast smoothing
    };

    setGain(this.leftGain, this.volLeft * leftMod);
    setGain(this.rightGain, this.volRight * rightMod);
    setGain(this.noiseGain, this.volNoise);
    setGain(this.masterGain, this.volMaster);
  }

  // --- Timer ---

  setCallback(cb: (time: number) => void) {
      this.onTimeUpdate = cb;
  }
  
  setEndCallback(cb: () => void) {
      this.onEnded = cb;
  }

  private startTimer() {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      const loop = () => {
          if (!this._isPlaying) return;
          if (this.onTimeUpdate) {
              let t = this.context!.currentTime - this.startTime;
              const d = this.duration;
              if (d > 0 && t >= d) {
                  t = d;
                  this.stop();
                  if (this.onEnded) this.onEnded();
              }
              this.onTimeUpdate(t);
          }
          this.animationFrameId = requestAnimationFrame(loop);
      };
      this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopTimer() {
      if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
      }
  }
  
  // Query State
  getTrackStatus() {
      return {
          left: !!this.leftBuffer,
          right: !!this.rightBuffer,
          noise: !!this.customNoiseBuffer || this.currentNoiseType !== 'file'
      };
  }
}

export const audioEngine = new AudioEngine();

