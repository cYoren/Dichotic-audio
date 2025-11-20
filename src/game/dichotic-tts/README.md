# Dichotic Attention Task (DAT) - Audio Assets

## Important Note on Audio Playback

This module currently uses **generated synthesized tones** for the digits 0-9. This is to ensure the application runs immediately without requiring external assets or complex server setups.

### How to Enable Real Voice Audio

To use real human voice recordings (which is recommended for clinical efficacy), you need to:

1.  **Obtain Audio Files**: Get MP3 or WAV files for digits "0" through "9".
    *   Ideally, get two sets: `VoiceA` (Left) and `VoiceB` (Right) if you want distinct voices.
    *   Or just one set if you want identical voices.

2.  **Place Files**: Put them in your `public/assets/digits/` folder (create it if it doesn't exist).
    *   Example: `public/assets/digits/0.mp3`, `public/assets/digits/1.mp3`, etc.

3.  **Update `TTSLoader.ts`**:
    Modify the `loadDigits` function to fetch these files instead of generating tones.

```typescript
// Example implementation for TTSLoader.ts

static async loadDigits(): Promise<void> {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  for (const digit of digits) {
    const response = await fetch(`/assets/digits/${digit}.mp3`);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffers.set(digit.toString(), audioBuffer);
  }
}
```

## Why not use `window.speechSynthesis`?

Standard Browser TTS (`speechSynthesis`) does **not** support stereo panning (Left/Right separation). It always plays in the center or follows system defaults. 

For Dichotic training, **strict lateralization** (100% Left or 100% Right) is required. This can only be achieved reliably using the Web Audio API (`AudioContext` + `StereoPannerNode`) with pre-recorded audio buffers.

