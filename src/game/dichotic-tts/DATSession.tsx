import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DATDifficulty } from './DATDifficulty';
import { DATPanel } from './DATPanel';
import type { DATSettings, DATState, DATRound } from './types';
import { DATRounds } from './DATRounds';
import { DATScheduler } from './DATScheduler';
import { TTSLeftEngine } from './TTSLeftEngine';
import { TTSRightEngine } from './TTSRightEngine';
import { DATScoring } from './DATScoring';
import { TTSLoader } from './TTSLoader';
import { DAT_INSTRUCTIONS } from './DATInstructions';

export const DATSession: React.FC = () => {
  // Settings State
  const [settings, setSettings] = useState<DATSettings>({
    mode: 'sync',
    pace: 1.0,
    noiseLevel: 0,
    targetEarMode: 'alternate',
    totalTrials: 20, // Defaults to 20 rounds
    sessionDuration: 0 // Not used in trial mode
  });

  // Game State
  const [state, setState] = useState<DATState>({
    isPlaying: false,
    currentRoundIndex: 0,
    currentTrialIndex: 0,
    totalRounds: 0,
    correctCount: 0,
    wrongCount: 0,
    score: 0, // Legacy support
    lastAnswerCorrect: null,
    sessionTimeRemaining: 0,
    phase: 'idle',
    targetEar: 'left',
  });

  const [currentRound, setCurrentRound] = useState<DATRound | null>(null);
  const [step1Open, setStep1Open] = useState(true);
  // In the new design, we always show the panel if playing, but we can toggle settings
  // Actually, user requested: "settings for the task only appear as a collapsable sidebar"
  // For now, let's keep the accordion flow but ensure logic matches "Trials" not "Time".

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
        await TTSLoader.loadDigits(); // Start loading assets

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
        handleStop();
        return;
    }

    // Generate Round
    const round = DATRounds.generateRound(settings.targetEarMode, currentRound?.targetEar || null);
    setCurrentRound(round);
    setState(prev => ({ 
      ...prev, 
      phase: 'playing', 
      targetEar: round.targetEar,
      lastAnswerCorrect: null 
    }));

    // Play Round
    schedulerRef.current.playRound(round, settings, () => {
      setState(prev => ({ ...prev, phase: 'input' }));
    });
  }, [settings, currentRound, state.totalRounds]);

  const handlePlay = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setStep1Open(false);
    
    // Reset State if starting fresh
    if (state.phase === 'idle') {
        setState(prev => ({ 
            ...prev, 
            isPlaying: true, 
            totalRounds: 0, 
            correctCount: 0,
            wrongCount: 0
        }));
        // Small delay to allow UI update
        setTimeout(() => startRound(), 100);
    } else {
        // Resume
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
      wrongCount: 0
    }));
    schedulerRef.current?.stop();
    setStep1Open(true);
  };

  const handleSubmitAnswer = (digit: number) => {
    if (!currentRound) return;

    const isCorrect = DATScoring.checkAnswer(currentRound, digit);
    
    setState(prev => ({
      ...prev,
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
      wrongCount: isCorrect ? prev.wrongCount : prev.wrongCount + 1,
      lastAnswerCorrect: isCorrect,
      phase: 'feedback',
      totalRounds: prev.totalRounds + 1
    }));

    // Wait for feedback then start next round
    setTimeout(() => {
      if (state.totalRounds < settings.totalTrials - 1) { // -1 because we just added one
        startRound();
      } else {
        // Session Complete
        handleStop();
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
        <DATPanel
            state={state}
            currentRound={currentRound}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSubmitAnswer={handleSubmitAnswer}
            totalTrials={settings.totalTrials}
        />
      </div>
    </div>
  );
};
