import { useEffect, useState, type FC, type ChangeEvent } from 'react';
import type { NumberStreamConfig } from './types';

interface Props {
  config: NumberStreamConfig;
  onChange: (config: NumberStreamConfig) => void;
  onStart: () => void;
}

export const NumberStreamDifficulty: FC<Props> = ({ config, onChange, onStart }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      // Set default voice if not set
      if (!config.voice && available.length > 0) {
        onChange({ ...config, voice: available[0] });
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handlePaceChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, pace: parseFloat(e.target.value) });
  };

  const handleNoiseChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, noiseLevel: parseFloat(e.target.value) });
  };

  const handleLengthPreset = (preset: 'beginner' | 'intermediate' | 'advanced') => {
    const lengths = { beginner: 4, intermediate: 6, advanced: 8 };
    onChange({ ...config, sequenceLength: lengths[preset] });
  };

  const handleCustomLength = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, sequenceLength: parseInt(e.target.value) });
  };

  const handleVoiceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = voices.find(v => v.name === e.target.value);
    onChange({ ...config, voice: selected || null });
  };

  return (
    <div className="space-y-8">
      {/* Pace */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Speed (Pace)</label>
          <span className="text-sm text-gray-500">{config.pace}s / digit</span>
        </div>
        <input
          type="range"
          min="0.4"
          max="2.0"
          step="0.1"
          value={config.pace}
          onChange={handlePaceChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Fast (0.4s)</span>
          <span>Medium (1.2s)</span>
          <span>Slow (2.0s)</span>
        </div>
      </div>

      {/* Noise Level */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Background Noise</label>
          <span className="text-sm text-gray-500">{Math.round(config.noiseLevel * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.noiseLevel}
          onChange={handleNoiseChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>None</span>
          <span>Heavy</span>
        </div>
      </div>

      {/* Sequence Length */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Sequence Length</label>
        <div className="flex space-x-2 mb-2">
          {(['beginner', 'intermediate', 'advanced'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handleLengthPreset(preset)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                (preset === 'beginner' && config.sequenceLength === 4) ||
                (preset === 'intermediate' && config.sequenceLength === 6) ||
                (preset === 'advanced' && config.sequenceLength === 8)
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500">Custom:</span>
            <input
            type="range"
            min="3"
            max="15"
            step="1"
            value={config.sequenceLength}
            onChange={handleCustomLength}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-sm font-bold w-6 text-center">{config.sequenceLength}</span>
        </div>
      </div>

      {/* Voice Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Voice</label>
        <select
          value={config.voice?.name || ''}
          onChange={handleVoiceChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
        >
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Start Button */}
      <div className="pt-4">
        <button
          onClick={onStart}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02]"
        >
          Start Training
        </button>
      </div>
    </div>
  );
};

