import type { DATRound, DATTrial, DATEar } from './types';

export class DATRounds {
  static generateRound(targetEarMode: 'alternate' | 'random' | 'fixed-left' | 'fixed-right', previousEar: DATEar | null): DATRound {
    let targetEar: DATEar;

    if (targetEarMode === 'fixed-left') {
      targetEar = 'left';
    } else if (targetEarMode === 'fixed-right') {
      targetEar = 'right';
    } else if (targetEarMode === 'alternate') {
      targetEar = previousEar === 'left' ? 'right' : 'left';
    } else {
      targetEar = Math.random() < 0.5 ? 'left' : 'right';
    }

    // Random trials 2-9
    const trialCount = Math.floor(Math.random() * 8) + 2;
    const trials: DATTrial[] = [];

    for (let i = 0; i < trialCount; i++) {
      trials.push({
        leftDigit: Math.floor(Math.random() * 10),
        rightDigit: Math.floor(Math.random() * 10),
      });
    }

    return {
      targetEar,
      trials,
    };
  }
}

