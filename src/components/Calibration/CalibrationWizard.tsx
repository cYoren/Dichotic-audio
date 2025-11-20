import { useState, useEffect, type FC } from 'react';
import { audioEngine } from '../../audio/audioEngine';
import type { AppSettings } from '../../utils/persistence';

interface CalibrationWizardProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: Partial<AppSettings>) => void;
}

export const CalibrationWizard: FC<CalibrationWizardProps> = ({ settings, onClose, onSave }) => {
  const [step, setStep] = useState(0);
  const [masterVol, setMasterVol] = useState(settings.masterVolume);
  const [balance, setBalance] = useState(settings.calibration?.centerBalance || 0);
  const [leftThresh, setLeftThresh] = useState(settings.calibration?.leftThreshold || 0.05);
  const [rightThresh, setRightThresh] = useState(settings.calibration?.rightThreshold || 0.05);

  // Ensure audio context is ready
  useEffect(() => {
      audioEngine.init();
      return () => {
          audioEngine.stopCalibrationTone();
      };
  }, []);

  const steps = [
    {
      title: "Audio Calibration",
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎧</div>
          <p>To ensure effective therapy, we need to calibrate your audio device.</p>
          <p className="text-sm text-gray-500">This takes about 1 minute.</p>
        </div>
      )
    },
    {
      title: "Step 1: Master Volume",
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">Adjust the volume until the tone is <b>comfortable</b> (not too loud, not too quiet).</p>
          <div className="flex justify-center">
              <button 
                onClick={() => audioEngine.startCalibrationTone('both', 440)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
              >
                  ▶ Play Tone
              </button>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Master Volume</label>
             <input 
               type="range" min="0" max="1" step="0.05"
               value={masterVol}
               onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setMasterVol(val);
                   audioEngine.setMasterVolume(val);
               }}
               className="w-full accent-indigo-600"
             />
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Center Balance",
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
              Close your eyes. Move the slider until the sound feels perfectly <b>centered</b> in your head.
              <br/><span className="text-xs text-gray-500">This compensates for headphone or hearing imbalances.</span>
          </p>
          <div className="flex justify-center">
              <button 
                onClick={() => audioEngine.startCalibrationTone('both', 440)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
              >
                  ▶ Play Center Tone
              </button>
          </div>
          <div>
             <div className="flex justify-between text-xs text-gray-500 mb-1">
                 <span>Left</span>
                 <span>Center</span>
                 <span>Right</span>
             </div>
             <input 
               type="range" min="-0.5" max="0.5" step="0.05"
               value={balance}
               onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setBalance(val);
                   audioEngine.setCalibration(val);
               }}
               className="w-full accent-indigo-600"
             />
             <p className="text-xs text-center text-gray-400 mt-2">Value: {balance.toFixed(2)}</p>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Left Threshold",
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
              We will play a tone in your <b>LEFT</b> ear.
              <br/>Lower the slider until you can <b>barely</b> hear it.
          </p>
          <div className="flex justify-center">
              <button 
                onClick={() => audioEngine.startCalibrationTone('left', 440)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
              >
                  ▶ Play Left Tone
              </button>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Tone Volume</label>
             <input 
               type="range" min="0" max="0.5" step="0.001"
               value={leftThresh}
               onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setLeftThresh(val);
                   audioEngine.setCalibrationToneVolume(val);
               }}
               className="w-full accent-indigo-600"
             />
          </div>
        </div>
      )
    },
    {
      title: "Step 4: Right Threshold",
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
              Now for your <b>RIGHT</b> ear.
              <br/>Lower the slider until you can <b>barely</b> hear it.
          </p>
          <div className="flex justify-center">
              <button 
                onClick={() => audioEngine.startCalibrationTone('right', 440)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
              >
                  ▶ Play Right Tone
              </button>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Tone Volume</label>
             <input 
               type="range" min="0" max="0.5" step="0.001"
               value={rightThresh}
               onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setRightThresh(val);
                   audioEngine.setCalibrationToneVolume(val);
               }}
               className="w-full accent-indigo-600"
             />
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
      audioEngine.stopCalibrationTone();
      if (step < steps.length - 1) {
          setStep(step + 1);
      } else {
          // Finish
          onSave({
              masterVolume: masterVol,
              calibration: {
                  centerBalance: balance,
                  leftThreshold: leftThresh,
                  rightThreshold: rightThresh
              }
          });
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">{steps[step].title}</h3>
          <div className="flex gap-1">
             {steps.map((_, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-white' : 'bg-indigo-400'}`} />
             ))}
          </div>
        </div>
        
        <div className="p-8 min-h-[300px] flex flex-col justify-between">
           <div className="flex-1 flex flex-col justify-center">
               {steps[step].content}
           </div>
           
           <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
               <button 
                 onClick={onClose}
                 className="px-4 py-2 text-gray-500 hover:text-gray-700"
               >
                   Cancel
               </button>
               <button 
                 onClick={handleNext}
                 className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
               >
                   {step === steps.length - 1 ? "Finish" : "Next"}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};

