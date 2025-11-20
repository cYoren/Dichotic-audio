import type { NumberStreamTask } from './types';

interface ScoreResult {
  correctCount: number;
  total: number;
  isPerfect: boolean;
  nextLength: number;
  xpEarned: number;
  streakContinues: boolean;
  feedbackMessage: string;
}

export function scoreResponse(
  userInput: string,
  correctSequence: number[],
  task: NumberStreamTask,
  currentLength: number
): ScoreResult {
  const userDigits = userInput.replace(/\D/g, '').split('').map(Number);
  let correctCount = 0;
  let total = 0;
  let isPerfect = false;
  let nextLength = currentLength;
  let xpEarned = 0;
  let streakContinues = false;
  let feedbackMessage = '';

  if (task === 'repeat') {
    total = correctSequence.length;
    // Compare digit by digit
    correctCount = 0;
    for (let i = 0; i < Math.min(userDigits.length, correctSequence.length); i++) {
      if (userDigits[i] === correctSequence[i]) {
        correctCount++;
      }
    }
    isPerfect = correctCount === total && userDigits.length === total;
    
    if (isPerfect) {
        xpEarned = 10 * total;
        streakContinues = true;
        feedbackMessage = "Perfect!";
    } else {
        streakContinues = false;
        feedbackMessage = `You got ${correctCount} out of ${total}`;
    }

  } else if (task === 'last3') {
    const target = correctSequence.slice(-3);
    total = target.length;
    
    correctCount = 0;
    // Compare user input to the last 3 digits
    // User might type more or less, but we expect exactly 3
    for (let i = 0; i < Math.min(userDigits.length, target.length); i++) {
        if (userDigits[i] === target[i]) {
            correctCount++;
        }
    }

    isPerfect = correctCount === total && userDigits.length === total;
    
    if (isPerfect) {
        xpEarned = 50;
        streakContinues = true;
        feedbackMessage = "Perfect!";
    } else {
        streakContinues = false;
        feedbackMessage = `Correct sequence: ${target.join('')}`;
    }

  } else if (task === 'span') {
    total = correctSequence.length;
    correctCount = 0;
    for (let i = 0; i < Math.min(userDigits.length, correctSequence.length); i++) {
      if (userDigits[i] === correctSequence[i]) {
        correctCount++;
      }
    }
    
    const accuracy = correctCount / total;
    isPerfect = accuracy === 1;
    
    if (accuracy >= 0.8) {
        nextLength = Math.min(currentLength + 1, 15); // Cap at 15
        streakContinues = true;
        xpEarned = 20 * currentLength;
        feedbackMessage = "Span Increased!";
    } else {
        nextLength = Math.max(currentLength - 1, 3); // Floor at 3
        streakContinues = false;
        feedbackMessage = "Span Decreased";
    }
  }

  return {
    correctCount,
    total,
    isPerfect,
    nextLength,
    xpEarned,
    streakContinues,
    feedbackMessage
  };
}
