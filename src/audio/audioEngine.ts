import { createWhiteNoiseBuffer, createPinkNoiseBuffer } from './noiseGenerators';

type NoiseType = 'none' | 'white' | 'pink' | 'file';

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Buffers
  private leftBuffer: AudioBuffer | null = null;
  private rightBuffer: AudioBuffer | null = null;
  // private noiseBuffer: AudioBuffer | null = null; // Generated noise (unused)
  private customNoiseBuffer: AudioBuffer | null = null; // User uploaded noise

  // Active Nodes
  private leftSource: AudioBufferSourceNode | null = null;
  private rightSource: AudioBufferSourceNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;

  public leftAnalyser: AnalyserNode | null = null;
  public rightAnalyser: AnalyserNode | null = null;

  private merger: ChannelMergerNode | null = null;
  private noisePanner: StereoPannerNode | null = null;

  // State
  private _isPlaying: boolean = false;
  private startTime: number = 0;
  private pausedOffset: number = 0;
  private stopTimeout: any = null; // For fade out handling

  // Configuration
  private volLeft: number = 1;
  private volRight: number = 1;
  private volNoise: number = 1;
  private volMaster: number = 1;
  private imbalance: number = 0;
  private currentNoiseType: NoiseType = 'none';
  private fadeDuration: number = 0.1;
  
  private calibration = {
      centerBalance: 0 // -1 to 1
  };

  // Callbacks
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onEnded: (() => void) | null = null;
  private animationFrameId: number | null = null;

  // Calibration Tone State
  private calibrationOsc: OscillatorNode | null = null;
  private calibrationGain: GainNode | null = null;

  constructor() {
    // Defer context creation
  }

  startCalibrationTone(type: 'left'|'right'|'both' = 'both', freq: number = 440) {
      this.stopCalibrationTone();
      if (!this.context) this.init();
      if (!this.context) return;
      
      this.calibrationOsc = this.context.createOscillator();
      this.calibrationOsc.type = 'sine';
      this.calibrationOsc.frequency.value = freq;
      
      this.calibrationGain = this.context.createGain();
      this.calibrationGain.gain.value = 0.5; 
      
      this.calibrationOsc.connect(this.calibrationGain);
      
      // Connect to Channel Gains
      if (type === 'left' || type === 'both') {
          this.calibrationGain.connect(this.leftGain!);
      }
      if (type === 'right' || type === 'both') {
          this.calibrationGain.connect(this.rightGain!);
      }
      
      this.calibrationOsc.start();
  }

  setCalibrationToneVolume(vol: number) {
      if (this.calibrationGain && this.context) {
          this.calibrationGain.gain.setTargetAtTime(vol, this.context.currentTime, 0.05);
      }
  }

  stopCalibrationTone() {
      try { this.calibrationOsc?.stop(); } catch {}
      this.calibrationOsc?.disconnect();
      this.calibrationGain?.disconnect();
      this.calibrationOsc = null;
      this.calibrationGain = null;
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
    this.leftAnalyser = this.context.createAnalyser();
    this.leftAnalyser.fftSize = 256;
    this.leftGain.connect(this.leftAnalyser);
    this.leftAnalyser.connect(this.merger, 0, 0);

    // Right Channel
    this.rightGain = this.context.createGain();
    this.rightAnalyser = this.context.createAnalyser();
    this.rightAnalyser.fftSize = 256;
    this.rightGain.connect(this.rightAnalyser);
    this.rightAnalyser.connect(this.merger, 0, 1);

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

    // Cancel any pending stop actions
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    // Ensure context is running
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    // Stop any existing (shouldn't happen if logic is correct, but safe guard)
    // We don't want fade out here, just immediate cut if we are restarting improperly
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
        
        let noiseOffset = startOffset;
        if (noiseBuf.duration > 0) {
            noiseOffset = startOffset % noiseBuf.duration;
        }
        this.noiseSource.start(0, noiseOffset);
    }

    this._isPlaying = true;
    this.startTimer();

    // --- Fade In ---
    // Reset channel volumes (in case they were modified, though play shouldn't modify them)
    this.applyVolumes(false); // Apply without touching master gain yet?
    // Actually applyVolumes touches master gain.
    // So we let applyVolumes set the base, then we override masterGain for the fade.
    
    const now = this.context.currentTime;
    // Force master gain to 0 immediately
    this.masterGain!.gain.cancelScheduledValues(now);
    this.masterGain!.gain.setValueAtTime(0, now);
    // Ramp to target volume
    // Use same volume mapping as applyVolumes (squared)
    const targetVol = this.volMaster * this.volMaster;
    this.masterGain!.gain.linearRampToValueAtTime(targetVol, now + this.fadeDuration);
  }

  pause() {
    this.performGracefulStop(true);
  }

  stop() {
    this.performGracefulStop(false);
  }

  private performGracefulStop(isPause: boolean) {
    if (!this._isPlaying) return;
    if (!this.context || !this.masterGain) return;

    // 1. Fade Out
    const now = this.context.currentTime;
    // Cancel any ongoing ramps
    this.masterGain.gain.cancelScheduledValues(now);
    // Set current value to ensure smooth start of ramp
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + this.fadeDuration);

    // 2. Schedule Stop
    // We wait for fadeDuration before actually stopping the sources
    this.stopTimeout = setTimeout(() => {
        if (isPause) {
            this.pausedOffset = this.context!.currentTime - this.startTime;
        } else {
            this.pausedOffset = 0;
            if (this.onTimeUpdate) this.onTimeUpdate(0);
        }

        this.stopSources();
        this._isPlaying = false;
        this.stopTimer();
        this.stopTimeout = null;
        
        // Reset Master Gain to normal (optional, but good practice so next play isn't silent if we skip fade logic)
        // But play() handles the fade in, so it's fine.
        // However, if we want to be safe:
        // this.masterGain!.gain.value = this.volMaster; 
        // (Don't do this immediately or it will pop if context is still running)
        
    }, this.fadeDuration * 1000);
  }

  private stopSources() {
    try { this.leftSource?.stop(); } catch {}
    try { this.rightSource?.stop(); } catch {}
    try { this.noiseSource?.stop(); } catch {}

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
  
  setCalibration(balance: number) {
      this.calibration.centerBalance = balance;
      this.applyVolumes();
  }

  setNoiseType(type: NoiseType) {
      this.currentNoiseType = type;
      if (this._isPlaying) {
          // Stop old noise
          try { this.noiseSource?.stop(); } catch {}
          this.noiseSource?.disconnect();
          
          // Start new noise
          const noiseBuf = this.getActiveNoiseBuffer();
          if (noiseBuf && this.context && this.noiseGain) {
              this.noiseSource = this.context.createBufferSource();
              this.noiseSource.buffer = noiseBuf;
              this.noiseSource.loop = true;
              this.noiseSource.connect(this.noiseGain);
              
              const currentOffset = this.context.currentTime - this.startTime;
              let noiseOffset = currentOffset % noiseBuf.duration;
              this.noiseSource.start(0, noiseOffset);
          }
      }
  }

  private applyVolumes(updateMaster: boolean = true) {
    if (!this.context) return;
    
    // Imbalance logic (Game Difficulty):
    let leftMod = 1;
    let rightMod = 1;
    
    if (this.imbalance < 0) {
        rightMod = 1 + this.imbalance; 
    } else if (this.imbalance > 0) {
        leftMod = 1 - this.imbalance;
    }
    
    // Calibration Logic (Hardware/Hearing Compensation):
    // If balance > 0 (Right bias needed), attenuate Left.
    // If balance < 0 (Left bias needed), attenuate Right.
    let calLeft = 1;
    let calRight = 1;
    if (this.calibration.centerBalance > 0) {
        calLeft = 1 - this.calibration.centerBalance;
    } else if (this.calibration.centerBalance < 0) {
        calRight = 1 + this.calibration.centerBalance; // + neg value = subtraction
    }

    const now = this.context.currentTime;
    
    const setGain = (node: GainNode | null, val: number) => {
        if (!node) return;
        const expVal = val * val; 
        node.gain.setTargetAtTime(expVal, now, 0.01); 
    };

    setGain(this.leftGain, this.volLeft * leftMod * calLeft);
    setGain(this.rightGain, this.volRight * rightMod * calRight);
    setGain(this.noiseGain, this.volNoise);
    
    if (updateMaster) {
        setGain(this.masterGain, this.volMaster);
    }
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
          if (!this._isPlaying && !this.stopTimeout) return; // Stop updating if stopped and not fading out
          
          // Even during fade out, we might want to update UI, but typically UI reflects "playing" state.
          // If we want UI to stop *after* fade out, we keep _isPlaying true until fade finishes.
          // But performGracefulStop sets _isPlaying = false AFTER timeout? No, current implementation of performGracefulStop:
          // It sets _isPlaying = false inside the timeout. 
          // So existing loop works fine.
          
          if (this.onTimeUpdate && this._isPlaying) {
              let t = this.context!.currentTime - this.startTime;
              const d = this.duration;
              if (d > 0 && t >= d) {
                  t = d;
                  this.stop(); // stop() calls performGracefulStop
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
