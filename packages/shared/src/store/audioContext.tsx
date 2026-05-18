import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  streamUrl: string;
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

export const useAudioStore = create<AudioStore>((set) => ({
  isPlaying: false,
  currentTrack: null,
  progress: 0,
  queue: [],
  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  skipNext: () => set((state) => {
    // Mock logic for skipNext
    return { currentTrack: state.queue[0] || null };
  }),
  toggleFavorite: (trackId) => {
    // Mock logic for toggleFavorite
  },
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true })
}));