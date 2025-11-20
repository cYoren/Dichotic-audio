import { useState, useEffect, type FC } from 'react';
import type { NumberStreamConfig, NumberStreamTask } from './types';
import { NumberStreamDifficulty } from './NumberStreamDifficulty';
import { NumberStreamPlayback } from './NumberStreamPlayback';
import { AntiSaccadeGame } from '../anti-saccade/AntiSaccadeGame';
import { audioEngine } from '../../audio/audioEngine';
import { INSTRUCTIONS } from './instructions';
import type { SessionMetrics } from '../../utils/reporting';

interface NumberStreamPanelProps {
  onSessionComplete?: (metrics: SessionMetrics) => void;
}

export const NumberStreamPanel: FC<NumberStreamPanelProps> = ({ onSessionComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<NumberStreamConfig>({
    task: 'repeat',
    pace: 1.0,
    noiseLevel: 0,
    sequenceLength: 4,
    voice: null
  });

  // Handle Noise Lifecycle
  useEffect(() => {
    if (step === 3 && config.noiseLevel > 0) {
      // Start Noise
      const startNoise = async () => {
        try {
          await audioEngine.init();
          audioEngine.setNoiseType('white'); // Default to white for now, or add selector
          audioEngine.setNoiseVolume(config.noiseLevel);
          audioEngine.play();
        } catch (e) {
          console.error("Failed to start noise", e);
        }
      };
      startNoise();
    } else {
      // Stop Noise
      audioEngine.stop();
    }

    return () => {
      audioEngine.stop();
    };
  }, [step, config.noiseLevel]);

  const handleTaskSelect = (task: NumberStreamTask) => {
    setConfig(prev => ({ ...prev, task }));
    setStep(2);
  };

  const handleStart = () => {
    setStep(3);
  };

  const handleExit = () => {
    setStep(2);
  };

  return (
    <div className="space-y-8">
      
      {/* Step 1: Choose Task */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(INSTRUCTIONS) as NumberStreamTask[]).map((taskKey) => (
            <button
              key={taskKey}
              onClick={() => handleTaskSelect(taskKey)}
              className="flex flex-col items-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all border border-gray-100 text-center group"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <span className="text-2xl font-bold">
                    {taskKey === 'repeat' ? '123' 
                      : taskKey === 'last3' ? '..3' 
                      : taskKey === 'span' ? '📈'
                      : '👁️'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{INSTRUCTIONS[taskKey].title}</h3>
              <p className="text-sm text-gray-500">{INSTRUCTIONS[taskKey].description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Difficulty or Anti-Saccade Game */}
      {step === 2 && (
        config.task === 'anti-saccade' ? (
           <AntiSaccadeGame onExit={() => setStep(1)} onSessionComplete={onSessionComplete} />
        ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Difficulty Settings</h2>
            <button 
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700"
            >
                Change Task
            </button>
          </div>
          
          <NumberStreamDifficulty 
            config={config}
            onChange={setConfig}
            onStart={handleStart}
          />
        </div>
        )
      )}

      {/* Step 3: Playback */}
      {step === 3 && (
        <NumberStreamPlayback 
          config={config}
          onExit={handleExit}
          onUpdateConfig={setConfig}
        />
      )}
    </div>
  );
};

