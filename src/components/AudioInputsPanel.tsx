import React, { useState, useRef } from 'react';
import { Accordion } from './ui/Accordion/Accordion';

interface AudioInputsPanelProps {
  mode: 'user' | 'clinical';
  trackStatus: { left: boolean; right: boolean };
  onFileLoad: (side: 'left' | 'right', file: File) => Promise<void>;
  onUrlLoad: (side: 'left' | 'right', url: string) => Promise<void>;
  isOpen?: boolean;
  onToggle?: () => void;
  youtubeLeft: string | null;
  youtubeRight: string | null;
}

const SingleInput: React.FC<{
  side: 'left' | 'right';
  mode: 'user' | 'clinical';
  isLoaded: boolean;
  youtubeUrl: string | null;
  onFileSelect: (file: File) => void;
  onUrlSubmit: (url: string) => void;
}> = ({ side, mode, isLoaded, youtubeUrl, onFileSelect, onUrlSubmit }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        await onFileSelect(file);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUrlClick = async () => {
    if (url) {
      setIsLoading(true);
      try {
        await onUrlSubmit(url);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const label = side === 'left' ? 'Left Ear Audio' : 'Right Ear Audio';
  const accentColor = side === 'left' ? 'text-blue-600' : 'text-red-600';
  const buttonColor = side === 'left' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-red-50 text-red-700 hover:bg-red-100';

  const status = youtubeUrl 
    ? { text: 'YouTube Loaded ✔', color: 'bg-red-100 text-red-700' }
    : isLoaded 
      ? { text: 'Loaded ✔', color: 'bg-green-100 text-green-700' }
      : { text: 'Not Loaded', color: 'bg-gray-100 text-gray-500' };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <h4 className={`font-medium ${accentColor}`}>{label}</h4>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
          {status.text}
        </span>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${buttonColor}`}
      >
        {isLoading ? 'Loading...' : `Upload ${side === 'left' ? 'Left' : 'Right'} Audio`}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {(mode === 'clinical' || (mode === 'user' && !isLoaded)) && (
        <div className="mt-2">
           {mode === 'clinical' ? (
             <div className="flex gap-2">
               <input
                 type="text"
                 placeholder="Load from URL"
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
                 className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-2"
               />
               <button 
                 onClick={handleUrlClick}
                 disabled={!url || isLoading}
                 className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200"
               >
                 Load
               </button>
             </div>
           ) : (
             <details className="text-sm">
               <summary className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors list-none">
                 Load from URL (optional)
               </summary>
               <div className="mt-2 flex gap-2">
                 <input
                   type="text"
                   placeholder="https://..."
                   value={url}
                   onChange={(e) => setUrl(e.target.value)}
                   className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-2"
                 />
                 <button 
                   onClick={handleUrlClick}
                   disabled={!url || isLoading}
                   className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200"
                 >
                   Load
                 </button>
               </div>
             </details>
           )}
        </div>
      )}
    </div>
  );
};

export const AudioInputsPanel: React.FC<AudioInputsPanelProps> = ({
  mode,
  trackStatus,
  onFileLoad,
  onUrlLoad,
  isOpen,
  onToggle,
  youtubeLeft,
  youtubeRight
}) => {
  const allLoaded = (trackStatus.left || youtubeLeft) && (trackStatus.right || youtubeRight);
  
  return (
    <Accordion 
      title="Step 1: Audio Inputs" 
      defaultOpen={true}
      isOpen={isOpen}
      onToggle={onToggle}
      rightElement={
        allLoaded ? <span className="text-green-600 text-sm font-medium">Ready ✔</span> : null
      }
    >
      <div className="space-y-4">
        {mode === 'clinical' && (
          <p className="text-sm text-gray-500 mb-4">
            Load both or just one ear. Both is recommended for effective training.
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleInput 
            side="left" 
            mode={mode} 
            isLoaded={trackStatus.left} 
            youtubeUrl={youtubeLeft}
            onFileSelect={(f) => onFileLoad('left', f)}
            onUrlSubmit={(u) => onUrlLoad('left', u)}
          />
          <SingleInput 
            side="right" 
            mode={mode} 
            isLoaded={trackStatus.right} 
            youtubeUrl={youtubeRight}
            onFileSelect={(f) => onFileLoad('right', f)}
            onUrlSubmit={(u) => onUrlLoad('right', u)}
          />
        </div>
      </div>
    </Accordion>
  );
};
