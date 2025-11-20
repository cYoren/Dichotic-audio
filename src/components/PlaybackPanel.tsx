import React from 'react';
import ReactPlayer from 'react-player';
import { Accordion } from './ui/Accordion/Accordion';
import { formatTime } from '../utils/formatTime';

interface PlaybackPanelProps {
  mode: 'user' | 'clinical';
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  disabled: boolean;
  masterVolume?: number; // For safety warning
  instruction?: string; // For User Mode instructions
  isOpen?: boolean;
  onToggle?: () => void;
  youtubeLeft: string | null;
  youtubeRight: string | null;
}

export const PlaybackPanel: React.FC<PlaybackPanelProps> = ({
  mode,
  isPlaying,
  onPlayPause,
  onStop,
  currentTime,
  duration,
  disabled,
  masterVolume = 1,
  instruction,
  isOpen,
  onToggle,
  youtubeLeft,
  youtubeRight
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasYoutube = youtubeLeft || youtubeRight;

  return (
    <Accordion 
      title={mode === 'user' ? "Step 3: Play Session" : "Step 4: Playback Controls"} 
      defaultOpen={true}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-6">
        {/* Instructions (User Mode) */}
        {mode === 'user' && instruction && (
          <div className="text-center p-4 bg-indigo-50 rounded-lg text-indigo-800 font-medium">
            {instruction}
          </div>
        )}

        {/* YouTube Players */}
        {hasYoutube && (
          <div className={`grid ${youtubeLeft && youtubeRight ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
            {youtubeLeft && (
              <div className="rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
                <ReactPlayer 
                  url={youtubeLeft}
                  width="100%"
                  height="100%"
                  controls={true}
                  playing={isPlaying} // Optional: Try to sync with global play state? No, let them control it.
                />
              </div>
            )}
            {youtubeRight && (
              <div className="rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
                <ReactPlayer 
                  url={youtubeRight}
                  width="100%"
                  height="100%"
                  controls={true}
                  playing={isPlaying}
                />
              </div>
            )}
          </div>
        )}

        {/* Standard Controls (only if audio engine is relevant or mixed mode) */}
        {/* If purely YouTube, we might want to hide these or disable them. 
            But the user might have noise loaded in the engine. 
            So we keep them but maybe clarify their purpose if YouTube is active. */}
            
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onStop}
            disabled={disabled}
            className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
            aria-label="Stop"
            title="Stop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth={2} />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            disabled={disabled}
            className={`
              p-6 rounded-full text-white shadow-lg transform transition-all active:scale-95
              ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'}
            `}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
            <span className="w-12 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-200 ease-linear rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-12">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Safety Warning (Clinical Mode) */}
        {mode === 'clinical' && masterVolume > 0.9 && (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>High volume warning: Prolonged exposure may damage hearing.</span>
          </div>
        )}
      </div>
    </Accordion>
  );
};
