import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Simple AsyncStorage mock for web/persistence
const storageShim = typeof window !== 'undefined' ? window.localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface Playlist {
  id: string;
  name: string;
  tracks: string[]; // Track IDs
  description?: string;
  createdAt: number;
}

export interface LocalData {
  favorites: string[];
  playlists: Playlist[];
  savedAlbums: string[]; // Album IDs
  recentSearches: string[];
}

interface LocalStore extends LocalData {
  // Favorites
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  
  // Albums
  toggleSavedAlbum: (id: string) => void;
  isAlbumSaved: (id: string) => boolean;

  // Playlists
  createPlaylist: (name: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;

  // History
  addRecentSearch: (query: string) => void;
}

export const useLocalStore = create<LocalStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      playlists: [],
      savedAlbums: [],
      recentSearches: [],

      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((f) => f !== id)
          : [...state.favorites, id]
      })),
      isFavorite: (id) => get().favorites.includes(id),

      toggleSavedAlbum: (id) => set((state) => ({
        savedAlbums: state.savedAlbums.includes(id)
          ? state.savedAlbums.filter((a) => a !== id)
          : [...state.savedAlbums, id]
      })),
      isAlbumSaved: (id) => get().savedAlbums.includes(id),

      createPlaylist: (name, description) => set((state) => ({
        playlists: [
          ...state.playlists,
          {
            id: Math.random().toString(36).substring(7),
            name,
            description,
            tracks: [],
            createdAt: Date.now(),
          }
        ]
      })),

      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== id)
      })),

      addTrackToPlaylist: (playlistId, trackId) => set((state) => ({
        playlists: state.playlists.map((p) => 
          p.id === playlistId && !p.tracks.includes(trackId)
            ? { ...p, tracks: [...p.tracks, trackId] }
            : p
        )
      })),

      removeTrackFromPlaylist: (playlistId, trackId) => set((state) => ({
        playlists: state.playlists.map((p) => 
          p.id === playlistId
            ? { ...p, tracks: p.tracks.filter((t) => t !== trackId) }
            : p
        )
      })),

      addRecentSearch: (query) => set((state) => ({
        recentSearches: [query, ...state.recentSearches.filter(s => s !== query)].slice(0, 20)
      })),
    }),
    {
      name: 'sonarbuzz-local-storage',
      storage: createJSONStorage(() => storageShim as any),
    }
  )
);

export const initDb = () => {
  console.log('[Database] Local storage initialized');
};
