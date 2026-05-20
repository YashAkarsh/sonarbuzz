import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { audioEngine } from '../services/audioEngine';
import { useLocalStore } from '../services/database';

const storageShim = typeof window !== 'undefined' ? window.localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  duration: number; // In seconds
  isrc?: string;
  replayGain?: {
    gain: number;
    peak: number;
  };
}

export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: Track | null;
  progress: number;
  queue: Track[];
  originalQueue: Track[]; // Used to restore order when un-shuffling
  repeatMode: RepeatMode;
  isShuffle: boolean;
}
export interface AudioController {
  playTrack: (track: Track) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleFavorite: (trackId: string) => void;
  setSleepTimer: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
}

export type AudioStore = PlaybackState & AudioController & {
  sleepTimerEnd: number | null;
};

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      currentTrack: null,
      progress: 0,
      queue: [],
      originalQueue: [],
      repeatMode: 'OFF',
      isShuffle: false,
      sleepTimerEnd: null,

      playTrack: async (track) => {
        set({ currentTrack: track, isPlaying: true, progress: 0 });
        useLocalStore.getState().addToHistory(track.id);
        await audioEngine.play(track.id);
      },
...
      setRepeatMode: (mode) => set({ repeatMode: mode }),

      setSleepTimer: (minutes) => {
        if (minutes === 0) {
          set({ sleepTimerEnd: null });
          return;
        }
        const endTime = Date.now() + minutes * 60 * 1000;
        set({ sleepTimerEnd: endTime });

        setTimeout(() => {
          const currentEnd = get().sleepTimerEnd;
          if (currentEnd && Date.now() >= currentEnd) {
            get().pause();
            set({ sleepTimerEnd: null });
          }
        }, minutes * 60 * 1000);
      },

      toggleFavorite: (trackId) => {

        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        const newQueue = [...queue];
        // Remove track if already in queue, then insert after current
        const filteredQueue = newQueue.filter(t => t.id !== track.id);
        filteredQueue.splice(currentIndex + 1, 0, track);
        set({ queue: filteredQueue });
      },

      addToQueue: (track) => {
        const { queue } = get();
        if (queue.some(t => t.id === track.id)) return;
        set({ queue: [...queue, track] });
      },

      setQueue: (tracks) => {
        set({ queue: tracks, originalQueue: [...tracks] });
      },

      skipNext: () => {
        const { queue, currentTrack, repeatMode } = get();
        if (repeatMode === 'ONE' && currentTrack) {
          get().playTrack(currentTrack);
          return;
        }

        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        let nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeatMode === 'ALL') {
            nextIndex = 0;
          } else {
            set({ isPlaying: false, progress: 0 });
            return;
          }
        }

        const nextTrack = queue[nextIndex];
        if (nextTrack) get().playTrack(nextTrack);
      },

      skipPrevious: () => {
        const { queue, currentTrack, progress } = get();
        
        // If we are more than 3 seconds in, restart the track
        if (progress > 0.05 && currentTrack) {
          get().playTrack(currentTrack);
          return;
        }

        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        let prevIndex = currentIndex - 1;

        if (prevIndex < 0) {
          prevIndex = queue.length - 1; // Loop to end
        }

        const prevTrack = queue[prevIndex];
        if (prevTrack) get().playTrack(prevTrack);
      },

      toggleShuffle: () => {
        const { isShuffle, queue, originalQueue, currentTrack } = get();
        const newShuffle = !isShuffle;
        
        if (newShuffle) {
          // Shuffle everything EXCEPT the current track
          const otherTracks = queue.filter(t => t.id !== currentTrack?.id);
          const shuffled = [...otherTracks].sort(() => Math.random() - 0.5);
          set({ 
            isShuffle: true, 
            queue: currentTrack ? [currentTrack, ...shuffled] : shuffled 
          });
        } else {
          // Restore original order
          set({ isShuffle: false, queue: originalQueue });
        }
      },

      setRepeatMode: (mode) => set({ repeatMode: mode }),

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
    }),
    {
      name: 'sonarbuzz-audio-session',
      storage: createJSONStorage(() => storageShim as any),
      // Ensure we don't start playing automatically when rehydrating
      onRehydrateStorage: () => (state) => {
        if (state) state.isPlaying = false;
      }
    }
  )
);
