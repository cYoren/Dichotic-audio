export type NumberStreamTask = 'repeat' | 'last3' | 'span' | 'anti-saccade';

export interface NumberStreamConfig {
  task: NumberStreamTask;
  pace: number; // seconds per digit
  noiseLevel: number; // 0 to 1
  sequenceLength: number;
  voice: SpeechSynthesisVoice | null;
}

export interface NumberStreamState {
  sequence: number[];
  isPlaying: boolean;
  currentDigitIndex: number;
  userResponse: string;
  score: number;
  streak: number;
  xp: number;
  roundActive: boolean;
  feedback: 'none' | 'correct' | 'incorrect';
}
