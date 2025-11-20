import { useEffect } from 'react';
import type { DATState, DATRound } from './types';
import { Play, Pause, Square, CheckCircle, XCircle } from 'lucide-react';

interface DATPanelProps {
  state: DATState;
  currentRound: DATRound | null;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSubmitAnswer: (digit: number) => void;
  totalTrials: number;
}

export function DATPanel({
  state,
  currentRound,
  onPlay,
  onPause,
  onStop,
  onSubmitAnswer,
  totalTrials
}: DATPanelProps) {
  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.phase !== 'input') return;
      
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        onSubmitAnswer(parseInt(key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, onSubmitAnswer]);

  // Helper to render the Score Bar
  const ScoreBar = () => (
    <div className="flex gap-6 text-sm font-bold mb-4">
       <div className="flex items-center text-blue-600">
          <span className="mr-2">Correct:</span>
          <span className="text-xl">{state.correctCount}</span>
       </div>
       <div className="flex items-center text-red-600">
          <span className="mr-2">Wrong:</span>
          <span className="text-xl">{state.wrongCount}</span>
       </div>
       <div className="flex items-center text-gray-500">
          <span className="mr-2">Trial:</span>
          <span className="text-xl">{state.totalRounds} / {totalTrials}</span>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        {/* Header / Score */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Session Progress</h2>
          <ScoreBar />
        </div>

        {/* Main Game Area */}
        <div className="relative min-h-[350px] flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 p-8 transition-all">
          
          {state.phase === 'idle' && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Play className="w-10 h-10 text-indigo-600 ml-1" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Ready to Start?</h3>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Focus on the indicated ear. <br/>
                When the audio stops, select the <strong>LAST digit</strong> you heard.
              </p>
              <button
                onClick={onPlay}
                className="mt-4 px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Session
              </button>
            </div>
          )}

          {state.phase === 'playing' && currentRound && (
            <div className="text-center w-full animate-fade-in">
              <div className={`text-5xl font-black mb-12 transition-colors duration-500 ${
                currentRound.targetEar === 'left' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {currentRound.targetEar === 'left' ? 'LEFT' : 'RIGHT'} EAR
              </div>
              
              <div className="flex justify-center gap-16 mb-8 opacity-80">
                <div className={`flex flex-col items-center transition-all duration-300 ${
                  currentRound.targetEar === 'left' ? 'scale-110 opacity-100' : 'opacity-30 grayscale'
                }`}>
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-3 shadow-sm">
                    <span className="text-4xl">👂</span>
                  </div>
                  <span className="font-bold text-blue-900 uppercase tracking-wider text-sm">Target</span>
                </div>

                <div className={`flex flex-col items-center transition-all duration-300 ${
                  currentRound.targetEar === 'right' ? 'scale-110 opacity-100' : 'opacity-30 grayscale'
                }`}>
                  <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-3 shadow-sm">
                    <span className="text-4xl">👂</span>
                  </div>
                  <span className="font-bold text-red-900 uppercase tracking-wider text-sm">Target</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-400 font-mono mt-8">
                <span className="animate-pulse">Playing sequence...</span>
              </div>
            </div>
          )}

          {state.phase === 'input' && (
            <div className="w-full max-w-2xl mx-auto text-center animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Last digit on the <span className={state.targetEar === 'left' ? 'text-blue-600' : 'text-red-600'}>{state.targetEar.toUpperCase()}</span> ear?
              </h3>
              
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => onSubmitAnswer(num)}
                    className="h-16 text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 hover:scale-105 transition-all shadow-sm active:scale-95"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-6">
                Press number on keyboard or click above
              </p>
            </div>
          )}

          {state.phase === 'feedback' && (
            <div className="text-center animate-fade-in scale-110">
              {state.lastAnswerCorrect ? (
                <div className="flex flex-col items-center text-blue-600">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Correct!</h3>
                </div>
              ) : (
                <div className="flex flex-col items-center text-red-500">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Incorrect</h3>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 pt-4">
          {state.isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </button>
          ) : (
            state.phase !== 'idle' && (
              <button
                onClick={onPlay}
                className="flex items-center px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-200 transition-colors"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </button>
            )
          )}
          
          {state.phase !== 'idle' && (
            <button
              onClick={onStop}
              className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <Square className="w-5 h-5 mr-2" />
              End Session
            </button>
          )}
        </div>
    </div>
  );
}
