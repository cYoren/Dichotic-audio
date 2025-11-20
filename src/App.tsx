import { useState, useEffect } from 'react';
import { LayoutContainer } from './components/LayoutContainer';
import { AudioInputsPanel } from './components/AudioInputsPanel';
import { VolumePanel } from './components/VolumePanel';
import { DifficultyPanel } from './components/DifficultyPanel';
import { PlaybackPanel } from './components/PlaybackPanel';
import { InfoPanel } from './components/InfoPanel';
import { NumberStreamPanel } from './game/number-stream/NumberStreamPanel';
import { DATSession } from './game/dichotic-tts/DATSession';
import { useAudioEngine } from './hooks/useAudioEngine';
import type { StockItem } from './data/stockLibrary';
import { Dashboard } from './components/Dashboard';
import { CalibrationWizard } from './components/Calibration';
import { getSessions, saveSession, saveSettings, getSettings, generateShareUrl, type AppSettings } from './utils/persistence';
import type { SessionLog, SessionMetrics } from './utils/reporting';
import { SessionHistory } from './components/SessionHistory';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Footer } from './components/Footer';

function App() {
  const defaults = getSettings();
  const { supportsPWA, install } = usePWAInstall();

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
  const [mode, setMode] = useState<'user' | 'clinical'>(defaults.mode);
  const [userModeType, setUserModeType] = useState<'audio' | 'number' | 'dat' | 'dashboard'>(defaults.userModeType as any); // Cast for legacy settings

  // Session Logging
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);

  // Calibration
  const [showCalibration, setShowCalibration] = useState(false);

  // Text State (for Stock Library)
  const [leftText, setLeftText] = useState<string | null>(null);
  const [rightText, setRightText] = useState<string | null>(null);

  // UI State (synced with engine)
  const [leftVolume, setLeftVol] = useState(defaults.leftVolume);
  const [rightVolume, setRightVol] = useState(defaults.rightVolume);
  const [noiseVolume, setNoiseVol] = useState(defaults.noiseVolume);
  const [masterVolume, setMasterVol] = useState(defaults.masterVolume);
  const [imbalance, setImbalance] = useState(defaults.imbalance);
  const [noiseType, setNoiseType] = useState<'none' | 'white' | 'pink' | 'file'>(defaults.noiseType);
  const [calibration, setCalibration] = useState(defaults.calibration);

  // Accordion State
  const [step1Open, setStep1Open] = useState(true);
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false); // Difficulty (Clinical) or Play (User)
  const [step4Open, setStep4Open] = useState(false); // Playback (Clinical)

  // Load Sessions on Mount
  useEffect(() => {
      const sessions = getSessions();
      setSessionLogs(sessions);
  }, []);

  // Persistence Effect
  useEffect(() => {
    saveSettings({
      mode,
      userModeType: userModeType as any,
      leftVolume,
      rightVolume,
      noiseVolume,
      masterVolume,
      imbalance,
      noiseType,
      calibration // Use state
    });
  }, [mode, userModeType, leftVolume, rightVolume, noiseVolume, masterVolume, imbalance, noiseType, calibration]);

  const handleCalibrationSave = (newSettings: Partial<AppSettings>) => {
      const updated = { ...defaults, ...newSettings };
      
      // Update local state if needed
      if (newSettings.masterVolume !== undefined) {
          setMasterVol(newSettings.masterVolume);
          audioEngine.setMasterVolume(newSettings.masterVolume);
      }
      
      // Save to persistence
      saveSettings(updated);
      
      // Apply calibration to engine
      if (newSettings.calibration) {
          setCalibration(newSettings.calibration);
          audioEngine.setCalibration(newSettings.calibration.centerBalance);
      }
  };

  const handleSessionComplete = (metrics: SessionMetrics) => {
      const newLog: SessionLog = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString(),
          startTime: new Date().toLocaleTimeString(), // Approximate end time as start for now, or track separate start
          endTime: new Date().toLocaleTimeString(),
          duration: 0, // TODO: Pass duration from game
          mode: userModeType,
          settings: { imbalance, noiseType, noiseVolume, leftVolume, rightVolume },
          metrics
      };
      
      // Save
      saveSession(newLog);
      setSessionLogs(prev => [...prev, newLog]);
  };

  // Session Tracking Effect (Audio Mode)
  useEffect(() => {
    if (isPlaying && !currentSessionStart) {
        setCurrentSessionStart(new Date());
    } else if (!isPlaying && currentSessionStart) {
        const end = new Date();
        const duration = (end.getTime() - currentSessionStart.getTime()) / 1000;
        
        if (duration > 5) { // Only log sessions > 5s
            const newLog: SessionLog = {
                id: Date.now().toString(),
                date: end.toLocaleDateString(),
                startTime: currentSessionStart.toLocaleTimeString(),
                endTime: end.toLocaleTimeString(),
                duration,
                mode,
                settings: { imbalance, noiseType, noiseVolume, leftVolume, rightVolume }
            };
            setSessionLogs(prev => [...prev, newLog]);
        }
        setCurrentSessionStart(null);
    }
  }, [isPlaying]); // Dependencies must strictly be isPlaying to trigger start/stop logic correctly, but we need access to current settings.
  // React guarantees that the effect callback sees the state from the render where it was created.
  // So when isPlaying becomes false, this effect runs, and it sees the LATEST mode/settings from that render.
  // So we don't need to list them in dependencies to access them, BUT if they change while isPlaying is true, the effect won't re-run (which is good, we don't want to stop session).
  // However, wait. If mode changes while playing, we want the log to reflect the *final* mode? Yes.
  // But the effect function defined when isPlaying became true *closed over* the old state?
  // NO. When isPlaying changes to false, a NEW effect runs (cleanup of old, then new setup? No, just new setup if dependencies change).
  // Actually, if we only list [isPlaying], the effect ONLY re-runs when isPlaying changes.
  // So when isPlaying -> false, the effect that runs is the one created in the render where isPlaying -> false.
  // That render has the LATEST state variables. So it works.

  // Initialize engine with defaults
  useEffect(() => {
    audioEngine.setLeftVolume(leftVolume);
    audioEngine.setRightVolume(rightVolume);
    audioEngine.setNoiseVolume(noiseVolume);
    audioEngine.setMasterVolume(masterVolume);
    audioEngine.setEarImbalance(imbalance);
    audioEngine.setNoiseType(noiseType);
    
    if (defaults.calibration) {
        audioEngine.setCalibration(defaults.calibration.centerBalance);
    }
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
      if (side === 'left') {
          await audioEngine.loadLeftTrackFromFile(file);
          setLeftText(null); // Clear text on file load
      }
      if (side === 'right') {
          await audioEngine.loadRightTrackFromFile(file);
          setRightText(null);
      }
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
    // Standard URL load (used for Stock items or manual URL)
    try {
      if (side === 'left') {
          await audioEngine.loadLeftTrackFromUrl(url);
      }
      if (side === 'right') {
          await audioEngine.loadRightTrackFromUrl(url);
      }
      updateStatus();
    } catch (e) {
      console.error(e);
      alert(`Error loading URL: ${(e as Error).message}`);
    }
  };

  const handleStockSelect = async (side: 'left' | 'right', item: StockItem) => {
    if (side === 'left') setLeftText(item.text);
    if (side === 'right') setRightText(item.text);
    
    // If item has an audioUrl, load it.
    // For now, we assume stock items always have a URL (or we generate one, but that's harder).
    if (item.audioUrl) {
        await handleUrlLoad(side, item.audioUrl);
    }
  };

  const handleTextLoad = async (side: 'left' | 'right', text: string) => {
      if (side === 'left') setLeftText(text);
      if (side === 'right') setRightText(text);
      
      // Use StreamElements TTS API (Unofficial but reliable for free usage)
      // Using Brian voice as it's clear.
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(text)}`;
      await handleUrlLoad(side, url);
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
            {supportsPWA && (
                <button
                    onClick={install}
                    className="mr-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1"
                >
                    <span>📲</span> Install
                </button>
            )}
            <button
                onClick={() => {
                    audioEngine.init();
                    setShowCalibration(true);
                }}
                className="mr-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1"
            >
                <span>🎧</span> Calibrate
            </button>
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

          <button
            onClick={() => {
              const url = generateShareUrl({
                mode, userModeType, leftVolume, rightVolume, noiseVolume, masterVolume, imbalance, noiseType
              });
              navigator.clipboard.writeText(url);
              alert("Configuration URL copied to clipboard!");
            }}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Share Configuration"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className={`grid grid-cols-1 ${mode === 'clinical' ? 'lg:grid-cols-12 gap-8' : 'gap-6'}`}>
          
          {/* Main Content Area */}
          <div className={`${mode === 'clinical' ? 'lg:col-span-8' : ''} space-y-6`}>
            
            {/* User Mode Sub-Navigation */}
            {mode === 'user' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <button
                        onClick={() => setUserModeType('audio')}
                        className={`p-4 rounded-xl border-2 text-left transition-all group ${
                            userModeType === 'audio'
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-bold text-base ${userModeType === 'audio' ? 'text-indigo-900' : 'text-gray-900'}`}>Standard</h3>
                            {userModeType === 'audio' && <span className="text-indigo-600 text-xs">●</span>}
                        </div>
                        <p className={`text-xs ${userModeType === 'audio' ? 'text-indigo-700' : 'text-gray-500'}`}>Dichotic Listening</p>
                    </button>
                    
                    <button
                        onClick={() => setUserModeType('number')}
                        className={`p-4 rounded-xl border-2 text-left transition-all group ${
                            userModeType === 'number'
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-bold text-base ${userModeType === 'number' ? 'text-indigo-900' : 'text-gray-900'}`}>Memory</h3>
                            {userModeType === 'number' && <span className="text-indigo-600 text-xs">●</span>}
                        </div>
                        <p className={`text-xs ${userModeType === 'number' ? 'text-indigo-700' : 'text-gray-500'}`}>Number Stream</p>
                    </button>

                    <button
                        onClick={() => setUserModeType('dat')}
                        className={`p-4 rounded-xl border-2 text-left transition-all group ${
                            userModeType === 'dat'
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-bold text-base ${userModeType === 'dat' ? 'text-indigo-900' : 'text-gray-900'}`}>Attention</h3>
                            {userModeType === 'dat' && <span className="text-indigo-600 text-xs">●</span>}
                        </div>
                        <p className={`text-xs ${userModeType === 'dat' ? 'text-indigo-700' : 'text-gray-500'}`}>DAT / SAS</p>
                    </button>

                    <button
                        onClick={() => setUserModeType('dashboard')}
                        className={`p-4 rounded-xl border-2 text-left transition-all group ${
                            userModeType === 'dashboard'
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-bold text-base ${userModeType === 'dashboard' ? 'text-indigo-900' : 'text-gray-900'}`}>Progress</h3>
                            {userModeType === 'dashboard' && <span className="text-indigo-600 text-xs">●</span>}
                        </div>
                        <p className={`text-xs ${userModeType === 'dashboard' ? 'text-indigo-700' : 'text-gray-500'}`}>Stats & Trends</p>
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
                  onStockSelect={handleStockSelect}
                  onTextSubmit={handleTextLoad}
                  isOpen={step1Open}
                  onToggle={() => setStep1Open(!step1Open)}
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
                  leftText={leftText}
                  rightText={rightText}
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
                <NumberStreamPanel onSessionComplete={handleSessionComplete} />
            )}

            {/* New DAT/SAS Panel */}
            {mode === 'user' && userModeType === 'dat' && (
                <DATSession onSessionComplete={handleSessionComplete} />
            )}

            {/* Dashboard Panel */}
            {mode === 'user' && userModeType === 'dashboard' && (
                <Dashboard sessions={sessionLogs} />
            )}

            {/* Session History (Only show in Audio mode or Clinical mode, or if explicitly asked? Dashboard replaces history for user) */}
            {(mode === 'clinical' || userModeType === 'audio') && (
                <SessionHistory sessions={sessionLogs} />
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
      
      {showCalibration && (
        <CalibrationWizard 
            settings={{...defaults, masterVolume, calibration}} // Pass current state
            onClose={() => setShowCalibration(false)}
            onSave={handleCalibrationSave}
        />
      )}
    </LayoutContainer>
  );
}

export default App;
