import React, { useState, useEffect } from 'react';
import { LayoutContainer } from './components/LayoutContainer';
import { AudioInputsPanel } from './components/AudioInputsPanel';
import { VolumePanel } from './components/VolumePanel';
import { DifficultyPanel } from './components/DifficultyPanel';
import { PlaybackPanel } from './components/PlaybackPanel';
import { InfoPanel } from './components/InfoPanel';
import { NumberStreamPanel } from './game/number-stream/NumberStreamPanel';
import { DATSession } from './game/dichotic-tts/DATSession';
import { useAudioEngine } from './hooks/useAudioEngine';

import { Footer } from './components/Footer';

function App() {
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    trackStatus, 
    updateStatus, 
    play, 
    pause, 
    stop, 
    audioEngine 
  } = useAudioEngine();

  // Mode State
  const [mode, setMode] = useState<'user' | 'clinical'>('user');
  const [userModeType, setUserModeType] = useState<'audio' | 'number' | 'dat'>('audio');

  // YouTube State
  const [youtubeLeft, setYoutubeLeft] = useState<string | null>(null);
  const [youtubeRight, setYoutubeRight] = useState<string | null>(null);

  // UI State (synced with engine)
  const [leftVolume, setLeftVol] = useState(1);
  const [rightVolume, setRightVol] = useState(1);
  const [noiseVolume, setNoiseVol] = useState(0);
  const [masterVolume, setMasterVol] = useState(1);
  const [imbalance, setImbalance] = useState(0);
  const [noiseType, setNoiseType] = useState<'none' | 'white' | 'pink' | 'file'>('none');

  // Accordion State
  const [step1Open, setStep1Open] = useState(true);
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false); // Difficulty (Clinical) or Play (User)
  const [step4Open, setStep4Open] = useState(false); // Playback (Clinical)

  // Initialize engine with defaults
  useEffect(() => {
    audioEngine.setLeftVolume(leftVolume);
    audioEngine.setRightVolume(rightVolume);
    audioEngine.setNoiseVolume(noiseVolume);
    audioEngine.setMasterVolume(masterVolume);
    audioEngine.setEarImbalance(imbalance);
    audioEngine.setNoiseType(noiseType);
  }, []);

  // Auto-collapse Step 1 when both tracks loaded
  useEffect(() => {
    if (trackStatus.left && trackStatus.right) {
      setStep1Open(false);
      setStep2Open(true);
    }
  }, [trackStatus.left, trackStatus.right]);

  const handleFileLoad = async (side: 'left' | 'right' | 'noise', file: File) => {
    try {
      if (side === 'left') await audioEngine.loadLeftTrackFromFile(file);
      if (side === 'right') await audioEngine.loadRightTrackFromFile(file);
      if (side === 'noise') {
          await audioEngine.loadNoiseFromFile(file);
          setNoiseType('file');
          audioEngine.setNoiseType('file');
      }
      updateStatus();
    } catch (e) {
      console.error(e);
      alert(`Error loading file: ${(e as Error).message}`);
    }
  };

  const handleUrlLoad = async (side: 'left' | 'right', url: string) => {
    // Check for YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (youtubeRegex.test(url)) {
      if (side === 'left') setYoutubeLeft(url);
      if (side === 'right') setYoutubeRight(url);
      // We mark track as "loaded" in the engine loosely or just handle it in UI?
      // Since we can't easily mix YouTube with WebAudio without raw data,
      // we might just treat it as a separate playback mode.
      // But to satisfy "allLoaded" check in AudioInputsPanel, we might need to fake it or update AudioInputsPanel logic.
      // For now, let's just set the state.
      return;
    }

    // If not YouTube, try loading as audio file
    try {
      if (side === 'left') {
          await audioEngine.loadLeftTrackFromUrl(url);
          setYoutubeLeft(null);
      }
      if (side === 'right') {
          await audioEngine.loadRightTrackFromUrl(url);
          setYoutubeRight(null);
      }
      updateStatus();
    } catch (e) {
      console.error(e);
      alert(`Error loading URL: ${(e as Error).message}`);
    }
  };

  // Volume Handlers
  const handleLeftVol = (v: number) => { setLeftVol(v); audioEngine.setLeftVolume(v); };
  const handleRightVol = (v: number) => { setRightVol(v); audioEngine.setRightVolume(v); };
  const handleNoiseVol = (v: number) => { setNoiseVol(v); audioEngine.setNoiseVolume(v); };
  const handleMasterVol = (v: number) => { setMasterVol(v); audioEngine.setMasterVolume(v); };
  
  // Difficulty Handlers
  const handleImbalance = (v: number) => { setImbalance(v); audioEngine.setEarImbalance(v); };
  const handleNoiseType = (t: 'none' | 'white' | 'pink' | 'file') => { 
      setNoiseType(t); 
      audioEngine.setNoiseType(t); 
      if (t !== 'none' && noiseVolume === 0) {
          handleNoiseVol(0.3);
      }
  };

  const handlePreset = (preset: 'beginner' | 'intermediate' | 'advanced') => {
      if (preset === 'beginner') {
          handleNoiseType('none');
          handleNoiseVol(0);
          handleImbalance(0);
      } else if (preset === 'intermediate') {
          handleNoiseType('white');
          handleNoiseVol(0.2);
          handleImbalance(0.3);
      } else if (preset === 'advanced') {
          handleNoiseType('pink');
          handleNoiseVol(0.5);
          handleImbalance(0.6);
      }
      
      // Auto-collapse Step 2 (Difficulty) in User Mode
      if (mode === 'user') {
        setStep2Open(false);
        setStep3Open(true); // Open Play Session
      }
  };

  const handleNoiseLevel = (level: 'none' | 'low' | 'medium' | 'high') => {
    const volumes = { none: 0, low: 0.2, medium: 0.5, high: 0.8 };
    handleNoiseVol(volumes[level]);
    if (level === 'none') handleNoiseType('none');
    else if (noiseType === 'none') handleNoiseType('white');
  };

  const handleResetDifficulty = () => {
    handlePreset('beginner');
  };

  const canPlay = trackStatus.left || trackStatus.right;

  const showAudioTraining = mode === 'clinical' || (mode === 'user' && userModeType === 'audio');

  return (
    <LayoutContainer>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dichotic Trainer</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Auditory processing therapy tool</p>
          </div>
          
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('user')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'user' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              User Mode
            </button>
            <button
              onClick={() => setMode('clinical')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'clinical' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Clinical Mode
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className={`grid grid-cols-1 ${mode === 'clinical' ? 'lg:grid-cols-12 gap-8' : 'gap-6'}`}>
          
          {/* Main Content Area */}
          <div className={`${mode === 'clinical' ? 'lg:col-span-8' : ''} space-y-6`}>
            
            {/* User Mode Sub-Navigation */}
            {mode === 'user' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={() => setUserModeType('audio')}
                        className={`p-6 rounded-xl border-2 text-left transition-all group ${
                            userModeType === 'audio'
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-bold text-lg ${userModeType === 'audio' ? 'text-indigo-900' : 'text-gray-900'}`}>Custom Mode</h3>
                            {userModeType === 'audio' && <span className="text-indigo-600">●</span>}
                        </div>
                        <p className={`text-sm ${userModeType === 'audio' ? 'text-indigo-700' : 'text-gray-500'}`}>Standard L/R & YouTube</p>
                    </button>
                    
                    <button
                        onClick={() => setUserModeType('number')}
                        className={`p-6 rounded-xl border-2 text-left transition-all group ${
                            userModeType === 'number'
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-bold text-lg ${userModeType === 'number' ? 'text-indigo-900' : 'text-gray-900'}`}>Other Tasks</h3>
                            {userModeType === 'number' && <span className="text-indigo-600">●</span>}
                        </div>
                        <p className={`text-sm ${userModeType === 'number' ? 'text-indigo-700' : 'text-gray-500'}`}>Memory, Attention & More</p>
                    </button>

                    <button
                        onClick={() => setUserModeType('dat')}
                        className={`p-6 rounded-xl border-2 text-left transition-all group ${
                            userModeType === 'dat'
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-bold text-lg ${userModeType === 'dat' ? 'text-indigo-900' : 'text-gray-900'}`}>DAT / SAS</h3>
                            {userModeType === 'dat' && <span className="text-indigo-600">●</span>}
                        </div>
                        <p className={`text-sm ${userModeType === 'dat' ? 'text-indigo-700' : 'text-gray-500'}`}>Dichotic Attention Task</p>
                    </button>
                </div>
            )}

            {/* Existing Audio Training Panels */}
            {showAudioTraining && (
              <>
                {/* Step 1: Audio Inputs */}
                <AudioInputsPanel 
                  mode={mode}
                  trackStatus={trackStatus}
                  onFileLoad={handleFileLoad}
                  onUrlLoad={handleUrlLoad}
                  isOpen={step1Open}
                  onToggle={() => setStep1Open(!step1Open)}
                  youtubeLeft={youtubeLeft}
                  youtubeRight={youtubeRight}
                />

                {/* Step 2: Volume & Mixing (Clinical Only) */}
                {mode === 'clinical' && (
                  <VolumePanel 
                    leftVolume={leftVolume} onLeftVolumeChange={handleLeftVol}
                    rightVolume={rightVolume} onRightVolumeChange={handleRightVol}
                    noiseVolume={noiseVolume} onNoiseVolumeChange={handleNoiseVol}
                    masterVolume={masterVolume} onMasterVolumeChange={handleMasterVol}
                    isOpen={step2Open}
                    onToggle={() => setStep2Open(!step2Open)}
                  />
                )}

                {/* Step 2 (User) / Step 3 (Clinical): Difficulty */}
                <DifficultyPanel 
                  mode={mode}
                  imbalance={imbalance}
                  onImbalanceChange={handleImbalance}
                  noiseType={noiseType}
                  onNoiseTypeChange={handleNoiseType}
                  onPresetSelect={handlePreset}
                  onNoiseLevelChange={handleNoiseLevel}
                  noiseVolume={noiseVolume}
                  onReset={handleResetDifficulty}
                  isOpen={mode === 'user' ? step2Open : step3Open}
                  onToggle={() => mode === 'user' ? setStep2Open(!step2Open) : setStep3Open(!step3Open)}
                />

                {/* Step 3 (User) / Step 4 (Clinical): Playback */}
                <PlaybackPanel 
                  mode={mode}
                  isPlaying={isPlaying}
                  onPlayPause={isPlaying ? pause : play}
                  onStop={stop}
                  currentTime={currentTime}
                  duration={duration}
                  disabled={!canPlay}
                  masterVolume={masterVolume}
                  instruction={imbalance < 0 ? "Focus on your LEFT ear" : imbalance > 0 ? "Focus on your RIGHT ear" : "Focus on BOTH ears"}
                  isOpen={mode === 'user' ? step3Open : step4Open}
                  onToggle={() => mode === 'user' ? setStep3Open(!step3Open) : setStep4Open(!step4Open)}
                  youtubeLeft={youtubeLeft}
                  youtubeRight={youtubeRight}
                />

                {/* Custom Noise File Loader (Clinical Only) */}
                {mode === 'clinical' && noiseType === 'file' && (
                  <div className="bg-gray-50 p-4 border rounded-xl border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Custom Noise File</h4>
                    <input 
                      type="file" 
                      accept="audio/*"
                      onChange={(e) => e.target.files?.[0] && handleFileLoad('noise', e.target.files[0])}
                      className="block w-full text-sm text-gray-500"
                    />
                  </div>
                )}
              </>
            )}

            {/* New Number Stream Panel */}
            {mode === 'user' && userModeType === 'number' && (
                <NumberStreamPanel />
            )}

            {/* New DAT/SAS Panel */}
            {mode === 'user' && userModeType === 'dat' && (
                <DATSession />
            )}
          </div>

          {/* Sidebar (Clinical Only) */}
          {mode === 'clinical' && (
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-24">
                <InfoPanel />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </LayoutContainer>
  );
}

export default App;
