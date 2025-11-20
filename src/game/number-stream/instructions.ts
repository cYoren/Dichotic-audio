import type { NumberStreamTask } from './types';

export const INSTRUCTIONS: Record<NumberStreamTask, { title: string; description: string; short: string }> = {
  repeat: {
    title: "Repeat Exactly",
    description: "Listen and type the numbers in the same order.",
    short: "Type the numbers you hear."
  },
  last3: {
    title: "Last 3 Digits",
    description: "Only type the last three numbers you hear.",
    short: "Only type the last 3 digits."
  },
  span: {
    title: "Span Increase",
    description: "Each correct round increases the sequence length.",
    short: "Your span increases if you succeed."
  },
  'anti-saccade': {
    title: "Anti-Saccade",
    description: "Look AWAY from the visual target.",
    short: "Press the opposite direction arrow."
  }
};
