import { type FC } from 'react';
import { Accordion } from './ui/Accordion/Accordion';

interface VolumePanelProps {
  leftVolume: number;
  rightVolume: number;
  noiseVolume: number;
  masterVolume: number;
  onLeftVolumeChange: (v: number) => void;
  onRightVolumeChange: (v: number) => void;
  onNoiseVolumeChange: (v: number) => void;
  onMasterVolumeChange: (v: number) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const VolumeSlider: FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  tooltip?: string;
  colorClass?: string;
}> = ({ label, value, onChange, tooltip, colorClass = "accent-indigo-600" }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {tooltip && (
          <span className="text-gray-400 cursor-help text-xs border border-gray-200 rounded-full w-4 h-4 flex items-center justify-center" title={tooltip}>?</span>
        )}
      </div>
      <span className="text-xs text-gray-500">{Math.round(value * 100)}%</span>
    </div>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colorClass}`}
    />
  </div>
);

export const VolumePanel: FC<VolumePanelProps> = ({
  leftVolume,
  rightVolume,
  noiseVolume,
  masterVolume,
  onLeftVolumeChange,
  onRightVolumeChange,
  onNoiseVolumeChange,
  onMasterVolumeChange,
  isOpen,
  onToggle
}) => {
  return (
    <Accordion 
      title="Step 2: Volume & Mixing" 
      defaultOpen={false}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <VolumeSlider 
            label="Left Ear Loudness" 
            value={leftVolume} 
            onChange={onLeftVolumeChange}
            tooltip="Controls intensity of sound played into the left ear."
            colorClass="accent-blue-600"
          />
          <VolumeSlider 
            label="Right Ear Loudness" 
            value={rightVolume} 
            onChange={onRightVolumeChange}
            tooltip="Controls intensity of sound played into the right ear."
            colorClass="accent-red-600"
          />
        </div>
        <div className="space-y-6">
          <VolumeSlider 
            label="Background Noise" 
            value={noiseVolume} 
            onChange={onNoiseVolumeChange}
            tooltip="Volume of the distraction noise."
            colorClass="accent-gray-600"
          />
          <VolumeSlider 
            label="Master Volume" 
            value={masterVolume} 
            onChange={onMasterVolumeChange}
            tooltip="Overall output volume."
            colorClass="accent-indigo-600"
          />
        </div>
      </div>
    </Accordion>
  );
};
