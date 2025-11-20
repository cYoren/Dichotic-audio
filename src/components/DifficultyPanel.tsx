import { useState, type FC } from 'react';
import { Accordion } from './ui/Accordion/Accordion';

interface DifficultyPanelProps {
  mode: 'user' | 'clinical';
  imbalance: number;
  onImbalanceChange: (val: number) => void;
  noiseType: 'none' | 'white' | 'pink' | 'file';
  onNoiseTypeChange: (val: 'none' | 'white' | 'pink' | 'file') => void;
  onPresetSelect: (preset: 'beginner' | 'intermediate' | 'advanced') => void;
  onNoiseLevelChange: (level: 'none' | 'low' | 'medium' | 'high') => void;
  noiseVolume: number;
  onReset?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const DifficultyPanel: FC<DifficultyPanelProps> = ({
  mode,
  imbalance,
  onImbalanceChange,
  noiseType,
  onNoiseTypeChange,
  onPresetSelect,
  onNoiseLevelChange,
  onReset,
  isOpen,
  onToggle
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [noiseSliderVal, setNoiseSliderVal] = useState(0);

  const handlePresetClick = (preset: 'beginner' | 'intermediate' | 'advanced') => {
    setSelectedPreset(preset);
    onPresetSelect(preset);
    // Update local slider state based on preset
    if (preset === 'beginner') setNoiseSliderVal(0);
    if (preset === 'intermediate') setNoiseSliderVal(1);
    if (preset === 'advanced') setNoiseSliderVal(2);
  };

  const handleNoiseSliderChange = (val: number) => {
    setNoiseSliderVal(val);
    const levels: ('none' | 'low' | 'medium' | 'high')[] = ['none', 'low', 'medium', 'high'];
    // Map 0-100 to 0-3 roughly
    const index = Math.round((val / 100) * 3);
    onNoiseLevelChange(levels[index]);
  };

  return (
    <Accordion 
      title="Step 2: Difficulty" 
      defaultOpen={false}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-8">
        {/* Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Difficulty Presets</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['beginner', 'intermediate', 'advanced'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`
                  relative px-4 py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all
                  ${selectedPreset === preset 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                {preset}
                {preset === 'beginner' && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                    Recommended
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Noise Level Slider (User Mode) */}
        {mode === 'user' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Noise Level</label>
              <span className="text-xs text-gray-500">
                {noiseSliderVal === 0 ? 'None' : noiseSliderVal < 33 ? 'Low' : noiseSliderVal < 66 ? 'Medium' : 'Heavy'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={noiseSliderVal}
              onChange={(e) => handleNoiseSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>None</span>
              <span>Heavy</span>
            </div>
          </div>
        )}

        {/* Clinical Mode Extras */}
        {mode === 'clinical' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Noise Type
                  <span className="ml-2 text-gray-400 cursor-help" title="Type of background distraction noise">?</span>
                </label>
                <select
                  value={noiseType}
                  onChange={(e) => onNoiseTypeChange(e.target.value as any)}
                  className="block w-full rounded-lg border-gray-200 bg-gray-50 p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="white">White Noise</option>
                  <option value="pink">Pink Noise</option>
                  <option value="file">Custom File</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Ear Emphasis
                    <span className="text-gray-400 cursor-help text-xs border border-gray-200 rounded-full w-4 h-4 flex items-center justify-center" title="Adjusts the balance between left and right ears">?</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {imbalance === 0 ? 'Balanced' : imbalance < 0 ? `Left +${Math.abs(Math.round(imbalance * 100))}%` : `Right +${Math.round(imbalance * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={imbalance}
                  onChange={(e) => onImbalanceChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Left Focus</span>
                  <span>Balanced</span>
                  <span>Right Focus</span>
                </div>
              </div>
            </div>

            {onReset && (
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={onReset}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Reset Difficulty Settings
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Accordion>
  );
};
