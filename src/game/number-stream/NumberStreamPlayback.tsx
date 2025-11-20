import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import type { NumberStreamConfig, NumberStreamState } from './types';
import { generateDigitSequence } from './numberGenerator';
import { ttsScheduler } from './ttsScheduler';
import { scoreResponse } from './scoringEngine';
import { INSTRUCTIONS } from './instructions';
import { ScoreBar } from '../common/ScoreBar';

interface Props {
  config: NumberStreamConfig;
  onExit: () => void;
  onUpdateConfig: (newConfig: NumberStreamConfig) => void;
}

export function NumberStreamPlayback({ config, onExit, onUpdateConfig }: Props) {
  const [state, setState] = useState<NumberStreamState>({
    sequence: [],
    isPlaying: false,
    currentDigitIndex: -1,
    userResponse: '',
    score: 0,
    streak: 0,
    xp: 0,
    roundActive: false,
    feedback: 'none'
  });

  const [autoContinue, setAutoContinue] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Start a new round
  const startRound = () => {
    const sequence = generateDigitSequence({
      length: config.sequenceLength
    });

    setState(prev => ({
      ...prev,
      sequence,
      isPlaying: true,
      currentDigitIndex: -1,
      userResponse: '',
      roundActive: true,
      feedback: 'none'
    }));
    setFeedbackMessage('');

    ttsScheduler.playDigitSequence(
      sequence,
      config.pace,
      config.voice,
      (index) => {
        setState(prev => ({ ...prev, currentDigitIndex: index }));
      },
      () => {
        // Optional: clear highlight?
      },
      () => {
        setState(prev => ({ ...prev, isPlaying: false, currentDigitIndex: -1 }));
        // Focus input after a short delay
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
      }
    );
  };

  const handleStop = () => {
    ttsScheduler.cancel();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      roundActive: false,
      currentDigitIndex: -1
    }));
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!state.roundActive || state.isPlaying) return;

    const result = scoreResponse(state.userResponse, state.sequence, config.task, config.sequenceLength);

    setState(prev => ({
      ...prev,
      score: prev.score + result.correctCount,
      streak: result.streakContinues ? prev.streak + 1 : 0,
      xp: prev.xp + result.xpEarned,
      roundActive: false,
      feedback: result.isPerfect ? 'correct' : 'incorrect'
    }));

    setFeedbackMessage(result.feedbackMessage);

    // Update config if span changed
    if (result.nextLength !== config.sequenceLength) {
        onUpdateConfig({ ...config, sequenceLength: result.nextLength });
    }

    if (autoContinue) {
      setTimeout(() => {
        startRound();
      }, 2000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsScheduler.cancel();
    };
  }, []);

  const instruction = INSTRUCTIONS[config.task];

  return (
    <div className="space-y-6">
      {/* Score Bar */}
      <ScoreBar score={state.score} streak={state.streak} xp={state.xp} />

      {/* Instruction Box */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
        <h3 className="text-blue-900 font-semibold">{instruction.title}</h3>
        <p className="text-blue-700 text-sm mt-1">{instruction.short}</p>
        {config.task === 'span' && (
            <p className="text-xs text-blue-500 mt-2">Current Length: {config.sequenceLength}</p>
        )}
      </div>

      {/* Playback Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center space-y-8 min-h-[300px] justify-center relative">
        
        {/* Progress Bar */}
        {state.isPlaying && (
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Playing...</span>
              <span>{state.currentDigitIndex + 1} / {state.sequence.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${((state.currentDigitIndex + 1) / state.sequence.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls / Input */}
        {!state.roundActive ? (
          <div className="text-center space-y-4">
             {state.feedback !== 'none' && (
                <div className={`text-lg font-bold ${state.feedback === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                    {feedbackMessage}
                </div>
             )}
             
             <button
              onClick={startRound}
              className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
            <p className="text-gray-500 text-sm">Press Play to Start</p>
          </div>
        ) : state.isPlaying ? (
          <div className="text-center">
             <div className="text-4xl font-mono font-bold text-gray-300 tracking-widest mb-8">
                {Array(config.sequenceLength).fill('•').join(' ')}
             </div>
             <button
              onClick={handleStop}
              className="px-6 py-2 border-2 border-red-100 text-red-600 rounded-full hover:bg-red-50 font-medium transition-colors"
            >
              Stop
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6">
            <div className="relative">
                <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={state.userResponse}
                onChange={(e) => setState(prev => ({ ...prev, userResponse: e.target.value }))}
                className="w-full text-center text-3xl tracking-widest py-4 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none bg-transparent"
                placeholder="Type numbers..."
                autoComplete="off"
                />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md"
            >
              Submit Answer
            </button>
          </form>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between px-4">
        <button 
            onClick={onExit}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium"
        >
            ← Back to Settings
        </button>

        <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Auto-continue</span>
            <button 
                onClick={() => setAutoContinue(!autoContinue)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoContinue ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoContinue ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
      </div>
    </div>
  );
}

