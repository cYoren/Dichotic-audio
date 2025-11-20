import React from 'react';
import { Accordion } from '../../components/ui/Accordion/Accordion';
import type { DATSettings, DATMode } from './types';

interface DATDifficultyProps {
  settings: DATSettings;
  onSettingsChange: (settings: DATSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const DATDifficulty: React.FC<DATDifficultyProps> = ({
  settings,
  onSettingsChange,
  isOpen,
  onToggle,
}) => {
  const handleChange = (key: keyof DATSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Accordion title="Step 1: Difficulty & Settings" isOpen={isOpen} onToggle={onToggle}>
      <div className="space-y-6">
        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
          <div className="flex flex-col gap-2">
            {(['sync', 'async-rhythmic', 'async-jitter'] as DATMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleChange('mode', mode)}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium border transition-all text-center ${
                  settings.mode === mode
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode === 'sync' && 'Synchronous'}
                {mode === 'async-rhythmic' && 'Async (Rhythmic)'}
                {mode === 'async-jitter' && 'Async (Jitter)'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {settings.mode === 'sync' && 'Digits play at the exact same time.'}
            {settings.mode === 'async-rhythmic' && 'Right ear is delayed by a fixed amount.'}
            {settings.mode === 'async-jitter' && 'Both ears have random timing variations.'}
          </p>
        </div>

        {/* Pace Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pace: {settings.pace.toFixed(1)}s
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.pace}
            onChange={(e) => handleChange('pace', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Fast (0.5s)</span>
            <span>Slow (2.0s)</span>
          </div>
        </div>

        {/* Noise Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Noise Level: {Math.round(settings.noiseLevel * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.noiseLevel}
            onChange={(e) => handleChange('noiseLevel', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Target Ear Logic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Ear Logic</label>
          <select
            value={settings.targetEarMode}
            onChange={(e) => handleChange('targetEarMode', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            <option value="alternate">Alternate (L/R)</option>
            <option value="random">Random</option>
            <option value="fixed-left">Fixed Left</option>
            <option value="fixed-right">Fixed Right</option>
          </select>
        </div>

        {/* Trials (Rounds) */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Trials (Rounds)</label>
            <select
                value={settings.totalTrials}
                onChange={(e) => handleChange('totalTrials', parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
                <option value="5">5 Trials</option>
                <option value="10">10 Trials</option>
                <option value="20">20 Trials</option>
                <option value="50">50 Trials</option>
            </select>
        </div>
      </div>
    </Accordion>
  );
};

