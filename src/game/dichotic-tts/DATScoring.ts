import type { DATRound } from './types';

export class DATScoring {
  static checkAnswer(round: DATRound, inputDigit: number): boolean {
    const lastTrial = round.trials[round.trials.length - 1];
    const correctDigit = round.targetEar === 'left' ? lastTrial.leftDigit : lastTrial.rightDigit;
    return inputDigit === correctDigit;
  }

  static getCorrectAnswer(round: DATRound): number {
    const lastTrial = round.trials[round.trials.length - 1];
    return round.targetEar === 'left' ? lastTrial.leftDigit : lastTrial.rightDigit;
  }
}

