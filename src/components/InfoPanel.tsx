import { type FC } from 'react';

export const InfoPanel: FC = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        About this Tool
      </h4>
      <p>
        This dichotic listening training tool allows you to play different audio tracks in each ear, optionally with background noise.
        It is designed to help train auditory processing skills by challenging the brain to separate competing stimuli.
      </p>
      
      <div className="border-t border-blue-200 pt-2">
        <h5 className="font-semibold mb-1">Recommendations:</h5>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>Use stereo headphones (check L/R orientation).</li>
          <li>Start with short sessions (5-10 minutes).</li>
          <li>Begin with "Beginner" difficulty (no noise, balanced).</li>
          <li>Gradually increase noise or imbalance as you improve.</li>
        </ul>
      </div>

      <div className="bg-white bg-opacity-50 p-2 rounded text-xs border border-blue-200 mt-2">
        <strong>Disclaimer:</strong> This application is for educational and training purposes only. 
        It is not a medical device and does not diagnose or treat any medical condition. 
        Please consult with a qualified audiologist or speech-language therapist for professional advice.
        <br/><br/>
        <em>Privacy Note: All audio processing happens locally in your browser. No audio is uploaded to any server.</em>
      </div>
    </div>
  );
};

