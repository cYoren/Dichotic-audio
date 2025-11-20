import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../audio/audioEngine';

export function useAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackStatus, setTrackStatus] = useState(audioEngine.getTrackStatus());

  useEffect(() => {
    audioEngine.setCallback((time) => {
      setCurrentTime(time);
    });

    audioEngine.setEndCallback(() => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
  }, []);

  const updateStatus = useCallback(() => {
    setTrackStatus(audioEngine.getTrackStatus());
    setDuration(audioEngine.duration);
  }, []);

  const play = async () => {
    try {
      await audioEngine.init();
      audioEngine.play();
      setIsPlaying(audioEngine.isPlaying);
    } catch (e) {
      console.error("Failed to play", e);
    }
  };

  const pause = () => {
    audioEngine.pause();
    setIsPlaying(audioEngine.isPlaying);
  };

  const stop = () => {
    audioEngine.stop();
    setIsPlaying(audioEngine.isPlaying);
    setCurrentTime(0);
  };

  return {
    isPlaying,
    currentTime,
    duration,
    trackStatus,
    updateStatus,
    play,
    pause,
    stop,
    audioEngine
  };
}

