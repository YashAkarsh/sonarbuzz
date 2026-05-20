import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tidalApi } from './tidalApi';
import { Platform } from 'react-native';

const storageShim = typeof window !== 'undefined' ? window.localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

interface OfflineState {
  downloadedTracks: Record<string, string>; // trackId -> local URI
  isDownloading: Record<string, boolean>; // trackId -> progress status
}

interface OfflineActions {
  downloadTrack: (trackId: string) => Promise<void>;
  removeDownload: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;
  getLocalUri: (trackId: string) => string | null;
}

export type OfflineStore = OfflineState & OfflineActions;

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      downloadedTracks: {},
      isDownloading: {},

      downloadTrack: async (trackId: string) => {
        if (get().downloadedTracks[trackId]) return;
        
        set((state) => ({ isDownloading: { ...state.isDownloading, [trackId]: true } }));

        try {
          const streamUrl = await tidalApi.getStreamUrl(trackId, 'HI_RES_LOSSLESS');

          if (Platform.OS === 'web') {
            // Web: Mocking persistence for browser targets
            console.log(`[OfflineManager] Web download mocked for ${trackId}`);
            set((state) => ({
              downloadedTracks: { ...state.downloadedTracks, [trackId]: streamUrl },
            }));
          } else {
            // NATIVE IMPLEMENTATION
            // UI Developer: Bridge this to expo-file-system
            /*
            import * as FileSystem from 'expo-file-system';
            const fileUri = `${FileSystem.documentDirectory}tracks/${trackId}.flac`;
            await FileSystem.downloadAsync(streamUrl, fileUri);
            set((state) => ({
              downloadedTracks: { ...state.downloadedTracks, [trackId]: fileUri },
            }));
            */
            console.log(`[OfflineManager] Native download (Placeholder) for ${trackId}`);
            set((state) => ({
              downloadedTracks: { ...state.downloadedTracks, [trackId]: `file://internal/tracks/${trackId}.flac` },
            }));
          }
        } catch (error) {
          console.error(`[OfflineManager] Failed to download ${trackId}:`, error);
        } finally {
          set((state) => {
            const nextDownloading = { ...state.isDownloading };
            delete nextDownloading[trackId];
            return { isDownloading: nextDownloading };
          });
        }
      },

      removeDownload: async (trackId: string) => {
        set((state) => {
          const nextDownloaded = { ...state.downloadedTracks };
          delete nextDownloaded[trackId];
          return { downloadedTracks: nextDownloaded };
        });
      },

      isDownloaded: (trackId: string) => !!get().downloadedTracks[trackId],
      getLocalUri: (trackId: string) => get().downloadedTracks[trackId] || null,
    }),
    {
      name: 'sonarbuzz-offline-storage',
      storage: createJSONStorage(() => storageShim as any),
    }
  )
);
