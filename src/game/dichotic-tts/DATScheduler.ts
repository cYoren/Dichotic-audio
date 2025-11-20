import { TTSLeftEngine } from './TTSLeftEngine';
import { TTSRightEngine } from './TTSRightEngine';
import type { DATRound, DATSettings } from './types';

export class DATScheduler {
  private context: AudioContext;
  private leftEngine: TTSLeftEngine;
  private rightEngine: TTSRightEngine;
  private isPlaying = false;
  private timeoutId: number | null = null;

  constructor(context: AudioContext, leftEngine: TTSLeftEngine, rightEngine: TTSRightEngine) {
    this.context = context;
    this.leftEngine = leftEngine;
    this.rightEngine = rightEngine;
  }

  playRound(round: DATRound, settings: DATSettings, onComplete: () => void) {
    this.isPlaying = true;
    const startTime = this.context.currentTime + 0.5; // Start after 0.5s delay

    let maxDuration = 0;

    round.trials.forEach((trial, index) => {
      const baseTime = startTime + index * settings.pace;
      
      // Left Ear Logic
      let leftTime = baseTime;
      if (settings.mode === 'async-jitter') {
        leftTime += (Math.random() * 0.4 - 0.2); // +/- 200ms
      }
      
      // Right Ear Logic
      let rightTime = baseTime;
      if (settings.mode === 'async-rhythmic') {
        rightTime += 0.2; // Fixed offset 200ms
      } else if (settings.mode === 'async-jitter') {
        rightTime += (Math.random() * 0.4 - 0.2);
      }

      this.leftEngine.scheduleDigit(trial.leftDigit, leftTime);
      this.rightEngine.scheduleDigit(trial.rightDigit, rightTime);

      // Track max duration to know when to finish
      // Assuming digit duration is ~0.5s
      maxDuration = Math.max(maxDuration, leftTime + 0.6, rightTime + 0.6);
    });

    // Schedule completion
    // We use setTimeout because we need to trigger a JS callback, not just audio
    const duration = (maxDuration - this.context.currentTime) * 1000;
    
    // Safety check
    const safeDuration = Math.max(0, duration);

    this.timeoutId = window.setTimeout(() => {
      if (this.isPlaying) {
        onComplete();
      }
    }, safeDuration);
  }

  stop() {
    this.isPlaying = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.leftEngine.stop();
    this.rightEngine.stop();
  }
}

