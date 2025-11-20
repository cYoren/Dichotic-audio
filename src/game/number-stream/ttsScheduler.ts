export class TTSScheduler {
  private timeouts: number[] = [];
  private isPlaying = false;

  playDigitSequence(
    sequence: number[],
    pace: number, // seconds per digit
    voice: SpeechSynthesisVoice | null,
    onDigitStart: (index: number) => void,
    onDigitEnd: (index: number) => void,
    onComplete: () => void
  ) {
    this.cancel();
    this.isPlaying = true;

    // Ensure we start with a clean slate
    window.speechSynthesis.cancel();

    sequence.forEach((digit, index) => {
      const timeoutId = window.setTimeout(() => {
        if (!this.isPlaying) return;

        onDigitStart(index);
        
        const utter = new SpeechSynthesisUtterance(digit.toString());
        if (voice) utter.voice = voice;
        
        // Map pace to rate to ensure the digit is spoken quickly enough for the interval
        // pace 0.4s -> rate ~1.5
        // pace 2.0s -> rate ~0.8
        let rate = 1.675 - 0.4375 * pace;
        rate = Math.max(0.5, Math.min(2.0, rate));
        utter.rate = rate;

        utter.onend = () => {
          if (!this.isPlaying) return;
          onDigitEnd(index);
          if (index === sequence.length - 1) {
            // Small delay before completing to let the last digit "sink in"
            setTimeout(() => {
                if (this.isPlaying) onComplete();
            }, 500);
          }
        };

        utter.onerror = (e) => {
            console.error("TTS Error:", e);
            // Continue anyway?
            if (index === sequence.length - 1) {
                onComplete();
            }
        };

        window.speechSynthesis.speak(utter);

      }, index * pace * 1000);

      this.timeouts.push(timeoutId);
    });
  }

  cancel() {
    this.isPlaying = false;
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    window.speechSynthesis.cancel();
  }
}

export const ttsScheduler = new TTSScheduler();
