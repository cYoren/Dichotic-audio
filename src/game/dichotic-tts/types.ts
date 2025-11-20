export type DATMode = 'sync' | 'async-rhythmic' | 'async-jitter';
export type DATEar = 'left' | 'right';

export interface DATRound {
  targetEar: DATEar;
  trials: DATTrial[];
}

export interface DATTrial {
  leftDigit: number;
  rightDigit: number;
}

export interface DATSettings {
  mode: DATMode;
  pace: number; // seconds between digits
  noiseLevel: number; // 0-1
  targetEarMode: 'alternate' | 'random' | 'fixed-left' | 'fixed-right';
  totalTrials: number; // Number of trials (rounds) instead of time
}

export interface DATState {
  isPlaying: boolean;
  currentRoundIndex: number;
  currentTrialIndex: number; // within the round
  totalRounds: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  lastAnswerCorrect: boolean | null;
  phase: 'idle' | 'playing' | 'input' | 'feedback' | 'summary';
  targetEar: DATEar;
  
  // Advanced Metrics
  roundStartTime: number | null; // Timestamp when input phase started
  reactionTimes: number[]; // Store individual reaction times
  leftEarStats: { correct: number; total: number; avgTime: number };
  rightEarStats: { correct: number; total: number; avgTime: number };
}
