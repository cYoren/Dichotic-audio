export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  leftVolume: number;
  rightVolume: number;
  noiseVolume: number;
  masterVolume: number;
  noiseType: 'none' | 'white' | 'pink' | 'file';
  noiseLevel: 'none' | 'low' | 'medium' | 'high';
  earImbalance: number; // -1 (left only) to 1 (right only)
}

export interface TrackInfo {
  name: string | null;
  duration: number;
  isLoaded: boolean;
}

