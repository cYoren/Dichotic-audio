import { useState, useEffect, useRef, useCallback, type FC } from 'react';
import { DATDifficulty } from './DATDifficulty';
import { DATPanel } from './DATPanel';
import { DATSessionSummary } from './DATSessionSummary';
import type { DATSettings, DATState, DATRound } from './types';
import { DATRounds } from './DATRounds';
import { DATScheduler } from './DATScheduler';
import { TTSLeftEngine } from './TTSLeftEngine';
import { TTSRightEngine } from './TTSRightEngine';
import { DATScoring } from './DATScoring';
import { TTSLoader } from './TTSLoader';
import { DAT_INSTRUCTIONS } from './DATInstructions';
import type { SessionMetrics } from '../../utils/reporting';

interface DATSessionProps {
    onSessionComplete?: (metrics: SessionMetrics) => void;
}

export const DATSession: FC<DATSessionProps> = ({ onSessionComplete }) => {
  // Settings State
  const [settings, setSettings] = useState<DATSettings>({
    mode: 'sync',
    pace: 1.0,
    noiseLevel: 0,
    targetEarMode: 'alternate',
    totalTrials: 20
  });

  // Game State
  const [state, setState] = useState<DATState>({
    isPlaying: false,
    currentRoundIndex: 0,
    currentTrialIndex: 0,
    totalRounds: 0,
    correctCount: 0,
    wrongCount: 0,
    score: 0,
    lastAnswerCorrect: null,
    phase: 'idle',
    targetEar: 'left',
    // Advanced Metrics
    roundStartTime: null,
    reactionTimes: [],
    leftEarStats: { correct: 0, total: 0, avgTime: 0 },
    rightEarStats: { correct: 0, total: 0, avgTime: 0 }
  });

  const [currentRound, setCurrentRound] = useState<DATRound | null>(null);
  const [step1Open, setStep1Open] = useState(true);

  // Audio Engine Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftEngineRef = useRef<TTSLeftEngine | null>(null);
  const rightEngineRef = useRef<TTSRightEngine | null>(null);
  const schedulerRef = useRef<DATScheduler | null>(null);

  // Initialize Audio Engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        
        await TTSLoader.init(ctx);
        await TTSLoader.loadDigits(); 

        leftEngineRef.current = new TTSLeftEngine(ctx);
        rightEngineRef.current = new TTSRightEngine(ctx);
        schedulerRef.current = new DATScheduler(ctx, leftEngineRef.current, rightEngineRef.current);
      } catch (e) {
        console.error("Failed to initialize audio engine", e);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRound = useCallback(() => {
    if (!schedulerRef.current) return;

    // Check if session is finished
    if (state.totalRounds >= settings.totalTrials) {
        finishSession();
        return;
    }

    // Generate Round
    const round = DATRounds.generateRound(settings.targetEarMode, currentRound?.targetEar || null);
    setCurrentRound(round);
    setState(prev => ({ 
      ...prev, 
      phase: 'playing', 
      targetEar: round.targetEar,
      lastAnswerCorrect: null,
      roundStartTime: null // Reset timer
    }));

    // Play Round
    schedulerRef.current.playRound(round, settings, () => {
      setState(prev => ({ 
          ...prev, 
          phase: 'input',
          roundStartTime: Date.now() // Start reaction timer
      }));
    });
  }, [settings, currentRound, state.totalRounds]);

  const handlePlay = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setStep1Open(false);
    
    // Reset State if starting fresh
    if (state.phase === 'idle' || state.phase === 'summary') {
        setState(prev => ({ 
            ...prev, 
            isPlaying: true, 
            totalRounds: 0, 
            correctCount: 0,
            wrongCount: 0,
            reactionTimes: [],
            leftEarStats: { correct: 0, total: 0, avgTime: 0 },
            rightEarStats: { correct: 0, total: 0, avgTime: 0 }
        }));
        setTimeout(() => startRound(), 100);
    } else {
        setState(prev => ({ ...prev, isPlaying: true }));
        if (state.phase === 'feedback') {
             startRound();
        }
    }
  };

  const handlePause = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
    schedulerRef.current?.stop();
  };

  const handleStop = () => {
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      phase: 'idle', 
      totalRounds: 0,
      correctCount: 0,
      wrongCount: 0,
      reactionTimes: [],
      leftEarStats: { correct: 0, total: 0, avgTime: 0 },
      rightEarStats: { correct: 0, total: 0, avgTime: 0 }
    }));
    schedulerRef.current?.stop();
    setStep1Open(true);
  };

  const finishSession = () => {
      setState(prev => {
          const finalState = { 
            ...prev, 
            isPlaying: false, 
            phase: 'summary' as const
          };
          
          if (onSessionComplete) {
              onSessionComplete({
                  accuracy: prev.totalRounds > 0 ? (prev.correctCount / prev.totalRounds) * 100 : 0,
                  correctCount: prev.correctCount,
                  totalCount: prev.totalRounds,
                  leftEarAccuracy: prev.leftEarStats.total > 0 ? (prev.leftEarStats.correct / prev.leftEarStats.total) * 100 : 0,
                  rightEarAccuracy: prev.rightEarStats.total > 0 ? (prev.rightEarStats.correct / prev.rightEarStats.total) * 100 : 0,
                  averageReactionTime: prev.reactionTimes.length > 0 
                    ? prev.reactionTimes.reduce((a, b) => a + b, 0) / prev.reactionTimes.length 
                    : 0
              });
          }
          
          return finalState;
      });
      schedulerRef.current?.stop();
  };

  const handleSubmitAnswer = (digit: number) => {
    if (!currentRound) return;

    const reactionTime = state.roundStartTime ? (Date.now() - state.roundStartTime) / 1000 : 0;
    const isCorrect = DATScoring.checkAnswer(currentRound, digit);
    const ear = currentRound.targetEar;
    
    setState(prev => {
        const leftStats = { ...prev.leftEarStats };
        const rightStats = { ...prev.rightEarStats };

        if (ear === 'left') {
            leftStats.total += 1;
            if (isCorrect) leftStats.correct += 1;
            // Update running average for reaction time
            leftStats.avgTime = ((leftStats.avgTime * (leftStats.total - 1)) + reactionTime) / leftStats.total;
        } else {
            rightStats.total += 1;
            if (isCorrect) rightStats.correct += 1;
            rightStats.avgTime = ((rightStats.avgTime * (rightStats.total - 1)) + reactionTime) / rightStats.total;
        }

        return {
            ...prev,
            correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
            wrongCount: isCorrect ? prev.wrongCount : prev.wrongCount + 1,
            lastAnswerCorrect: isCorrect,
            phase: 'feedback',
            totalRounds: prev.totalRounds + 1,
            reactionTimes: [...prev.reactionTimes, reactionTime],
            leftEarStats: leftStats,
            rightEarStats: rightStats
        };
    });

    // Wait for feedback then start next round
    setTimeout(() => {
      if (state.totalRounds < settings.totalTrials - 1) { 
        startRound();
      } else {
        finishSession();
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Settings */}
      <div className="lg:w-1/3 order-2 lg:order-1">
          <div className="sticky top-24">
            <DATDifficulty
                settings={settings}
                onSettingsChange={setSettings}
                isOpen={step1Open}
                onToggle={() => setStep1Open(!step1Open)}
            />
            
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-900 mb-1">Instructions</h3>
                <p className="text-xs text-indigo-700 leading-relaxed">
                    {DAT_INSTRUCTIONS.description} {DAT_INSTRUCTIONS.steps[0]}
                </p>
            </div>
          </div>
      </div>

      {/* Main Game Panel */}
      <div className="lg:w-2/3 order-1 lg:order-2">
        {state.phase === 'summary' ? (
            <DATSessionSummary 
                state={state}
                onRetry={handlePlay}
                onClose={handleStop}
            />
        ) : (
            <DATPanel
                state={state}
                currentRound={currentRound}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
                onSubmitAnswer={handleSubmitAnswer}
                totalTrials={settings.totalTrials}
            />
        )}
      </div>
    </div>
  );
};
