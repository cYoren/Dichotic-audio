export const DAT_INSTRUCTIONS = {
  title: "Dichotic Attention Task (DAT)",
  description: "This mode trains selective auditory attention. You will hear two streams of numbers simultaneously.",
  steps: [
    "Focus ONLY on the ear indicated for each round.",
    "Ignore the digits in the other ear.",
    "When the audio stops, enter the LAST digit you heard in the TARGET ear.",
    "The target ear may change between rounds."
  ],
  modes: {
    sync: "Digits play at the exact same time.",
    asyncRhythmic: "Right ear is delayed by a fixed amount.",
    asyncJitter: "Both ears have random timing variations."
  }
};

