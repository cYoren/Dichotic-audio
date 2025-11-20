import type { NumberStreamTask } from './types';

interface GeneratorOptions {
  length: number;
  allowRepeats?: boolean;
  task: NumberStreamTask;
}

export function generateDigitSequence({ length, allowRepeats = true, task }: GeneratorOptions): number[] {
  const digits: number[] = [];
  
  for (let i = 0; i < length; i++) {
    let digit: number;
    
    if (!allowRepeats && i > 0) {
      do {
        digit = Math.floor(Math.random() * 10);
      } while (digit === digits[i - 1]);
    } else {
      digit = Math.floor(Math.random() * 10);
    }
    
    digits.push(digit);
  }
  
  return digits;
}
