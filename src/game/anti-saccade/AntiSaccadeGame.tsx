import React, { useState, useEffect, useCallback } from 'react';

interface TrialResult {
  correct: boolean;
  reactionTime: number;
  direction: 'left' | 'right';
}

import type { SessionMetrics } from '../../utils/reporting';

interface AntiSaccadeGameProps {
  onExit: () => void;
  onSessionComplete?: (metrics: SessionMetrics) => void;
}

export const AntiSaccadeGame: React.FC<AntiSaccadeGameProps> = ({ onExit, onSessionComplete }) => {
  const [state, setState] = useState<'instructions' | 'fixation' | 'stimulus' | 'feedback' | 'finished'>('instructions');
  const [trialCount, setTrialCount] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [stimulusSide, setStimulusSide] = useState<'left' | 'right' | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  
  const TOTAL_TRIALS = 20;

  const startTrial = useCallback(() => {
    if (trialCount >= TOTAL_TRIALS) {
      setState('finished');
      return;
    }
    
    setState('fixation');
    
    // Random fixation duration 1000-2000ms
    const fixationTime = 1000 + Math.random() * 1000;
    
    setTimeout(() => {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      setStimulusSide(side);
      setStartTime(performance.now());
      setState('stimulus');
    }, fixationTime);
  }, [trialCount]);

  const handleResponse = useCallback((direction: 'left' | 'right') => {
    if (state !== 'stimulus') return;
    
    const endTime = performance.now();
    const reactionTime = endTime - startTime;
    const correct = (stimulusSide === 'left' && direction === 'right') || 
                   (stimulusSide === 'right' && direction === 'left');
    
    const result: TrialResult = { correct, reactionTime, direction: stimulusSide! };
    setResults(prev => [...prev, result]);
    setTrialCount(prev => prev + 1);
    
    // Short feedback? Or immediate next trial?
    // Let's do a very short feedback (blink green/red) then next
    // Actually, standard anti-saccade tasks often don't give immediate feedback to maintain pace, 
    // but gamified ones do. Let's show simple feedback.
    
    // setState('feedback'); // Optional
    // setTimeout(startTrial, 500);
    
    startTrial();
    
  }, [state, stimulusSide, startTime, startTrial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleResponse('left');
      if (e.key === 'ArrowRight') handleResponse('right');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse]);

  if (state === 'instructions') {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-6 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Anti-Saccade Task</h2>
        <div className="max-w-md text-gray-600 space-y-4">
          <p>1. Stare at the cross in the center.</p>
          <p>2. A dot will appear on the Left or Right.</p>
          <p className="font-bold text-indigo-600 text-lg">3. Look AWAY from the dot!</p>
          <p>If the dot is on the <span className="font-bold">LEFT</span>, press <span className="font-bold">RIGHT</span>.</p>
          <p>If the dot is on the <span className="font-bold">RIGHT</span>, press <span className="font-bold">LEFT</span>.</p>
        </div>
        <button 
          onClick={() => {
            setTrialCount(0);
            setResults([]);
            startTrial();
          }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
        >
          Start Game
        </button>
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600">Back</button>
      </div>
    );
  }

  if (state === 'finished') {
    const correctCount = results.filter(r => r.correct).length;
    const avgRT = results.length > 0 
      ? results.reduce((acc, r) => acc + r.reactionTime, 0) / results.length 
      : 0;
    const accuracy = (correctCount / TOTAL_TRIALS) * 100;

    useEffect(() => {
        if (onSessionComplete) {
            onSessionComplete({
                accuracy,
                correctCount,
                totalCount: TOTAL_TRIALS,
                averageReactionTime: avgRT / 1000 // convert to seconds
            });
        }
    }, []); // Run once on mount of finished state

    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-6 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Task Complete!</h2>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-indigo-600">{Math.round((correctCount / TOTAL_TRIALS) * 100)}%</p>
          <p className="text-gray-500">Accuracy</p>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-gray-800">{Math.round(avgRT)}ms</p>
          <p className="text-gray-500">Average Reaction Time</p>
        </div>
        <div className="flex gap-4">
            <button 
            onClick={() => {
                setTrialCount(0);
                setResults([]);
                startTrial();
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
            >
            Play Again
            </button>
            <button onClick={onExit} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-all">
            Exit
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
       {/* Fixation Cross */}
       {(state === 'fixation' || state === 'stimulus') && (
         <div className="absolute text-white text-4xl font-light">+</div>
       )}

       {/* Stimulus */}
       {state === 'stimulus' && stimulusSide && (
         <div 
            className={`absolute w-6 h-6 rounded-full bg-yellow-400 transition-none`}
            style={{ 
                left: stimulusSide === 'left' ? '20%' : 'auto', 
                right: stimulusSide === 'right' ? '20%' : 'auto' 
            }} 
         />
       )}

       <div className="absolute top-4 right-4 text-gray-500 text-sm font-mono">
         Trial: {trialCount + 1}/{TOTAL_TRIALS}
       </div>
       
       <div className="absolute bottom-4 text-gray-500 text-xs">
         Press Opposite Arrow Key
       </div>
    </div>
  );
};


