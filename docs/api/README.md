# SonarBuzz Core API Documentation

Welcome to the SonarBuzz headless service layer. The application is divided into specialized services and persistent stores that handle everything from high-fidelity streaming to offline storage.

## 📚 Documentation Index

### 1. [Audio Player & Playback](AUDIO_PLAYER.md)
Everything related to playing music, managing the queue, shuffle, repeat, and playback events.
*   **Store**: `useAudioStore`
*   **Engine**: `audioEngine`

### 2. [Tidal API Client](TIDAL_API.md)
Direct interaction with Tidal for searching, metadata, and stream resolution.
*   **Service**: `tidalApi`

### 3. [Local Storage & Library](LOCAL_STORAGE.md)
Persistent user data, favorites, playlists, and offline music management.
*   **Stores**: `useLocalStore`, `useOfflineStore`

### 4. [Lyrics & Advanced Metadata](LYRICS_METADATA.md)
Synced lyrics via LRCLIB and enriched recording data via MusicBrainz.
*   **Services**: `lyricsService`, `metadataService`

### 5. [Settings & Last.fm](SETTINGS_LASTFM.md)
User preferences, audio quality settings, and scrobbling integration.
*   **Service**: `lastfmService`

---

## 🛠 Project Structure Reference

```text
packages/shared/src/
├── services/
│   ├── tidalApi.ts        # Tidal HTTP Client
│   ├── audioEngine.ts     # Platform-agnostic player
│   ├── database.ts         # Persistent Library (Favorites/Playlists)
│   ├── offlineManager.ts   # Offline File Manager
│   ├── lyrics.ts           # Synced Lyrics Client
│   └── metadataService.ts  # MusicBrainz Client
└── store/
    ├── audioContext.tsx    # Playback State & Queue
    └── localContext.tsx    # Library State Hook
```

## 🚀 Quick Start for UI Developers

To initialize the core, call `initDb()` at the root of your application (e.g., in `App.tsx` or `index.js`).

```tsx
import { initDb } from '@shared/services/database';

const App = () => {
  useEffect(() => {
    initDb();
  }, []);

  return <YourUI />;
};
```
