import { create } from 'zustand';
import { audioEngine } from '../services/audioEngine';
import { useLocalStore } from '../services/database';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  // streamUrl is resolved on the fly in audioEngine
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: Track | null;
  progress: number;
  queue: Track[];
}

export interface AudioController {
  playTrack: (track: Track) => void;
  skipNext: () => void;
  toggleFavorite: (trackId: string) => void;
  pause: () => void;
  resume: () => void;
}

export type AudioStore = PlaybackState & AudioController;

export const useAudioStore = create<AudioStore>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  progress: 0,
  queue: [],
  playTrack: async (track) => {
    set({ currentTrack: track, isPlaying: true });
    await audioEngine.play(track.id);
  },
  skipNext: () => {
    const { queue, currentTrack } = get();
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const nextTrack = queue[currentIndex + 1] || queue[0];
    if (nextTrack) {
      get().playTrack(nextTrack);
    }
  },
  toggleFavorite: (trackId) => {
    const { toggleFavorite } = useLocalStore.getState();
    toggleFavorite(trackId);
  },
  pause: () => {
    audioEngine.pause();
    set({ isPlaying: false });
  },
  resume: () => {
    const { currentTrack } = get();
    if (currentTrack) {
      audioEngine.play(currentTrack.id);
      set({ isPlaying: true });
    }
  }
}));
