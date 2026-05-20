# SonarBuzz Service Layer Integration Guide

This document provides a detailed overview of the headless service layer implemented in `@packages/shared/src/services` and `@packages/shared/src/store`. UI developers should use these hooks and services to interact with the Tidal API and local playback engine.

## 1. Playback Engine (`useAudioStore`)
Located at: `packages/shared/src/store/audioContext.tsx`

The primary store for controlling playback and managing the current player state.

### State Properties
- `isPlaying`: `boolean` - Whether audio is currently playing.
- `currentTrack`: `Track | null` - The track currently loaded in the player.
- `currentTrack.duration`: `number` - Track length in seconds. **Use this for the time-left slider.**
- `currentTrack.replayGain`: `{ gain: number, peak: number }` - dB adjustment and peak amplitude.
- `queue`: `Track[]` - The current list of tracks to be played.
- `progress`: `number` - Current playback progress (**0.0 to 1.0**).
- `sleepTimerEnd`: `number | null` - Timestamp (ms) when the player will automatically stop.
- `repeatMode`: `'OFF' | 'ALL' | 'ONE'` - Current loop setting.
- `isShuffle`: `boolean` - Whether the queue is randomized.

### Actions
- `playTrack(track: Track)`: Resolves the Tidal stream URL and starts playback.
- `pause()`: Pauses the current stream.
- `resume()`: Resumes playback. On app start, this restarts the `currentTrack` from the session.
- `skipNext()` / `skipPrevious()`: Navigation through the queue.
- `playNext(track)`: Inserts a track immediately after the current one.
- `addToQueue(track)`: Appends a track to the end of the queue.
- `toggleShuffle()`: Randomizes the queue order.
- `setRepeatMode(mode)`: Sets the loop behavior.
- `setSleepTimer(minutes)`: Stops playback after X minutes. Set to `0` to cancel.

---

## 2. Offline Manager (`useOfflineStore`)
Located at: `packages/shared/src/services/offlineManager.ts`

Manages local file downloads. The `AudioEngine` automatically prioritizes these local files to save data.

### Actions
- `downloadTrack(trackId)`: Triggers a background download.
- `removeDownload(trackId)`: Deletes the local file.
- `isDownloaded(trackId)`: UI check for the download badge.

---

## 3. Local Library & Persistence (`useLocalStore`)
Located at: `packages/shared/src/services/database.ts`

Manages user data locally (Favorites, Playlists, Saved Albums, History).

### Actions
- `toggleFavorite(id)` / `isFavorite(id)`: Manage favorite tracks.
- `toggleSavedAlbum(id)` / `isAlbumSaved(id)`: Manage saved albums.
- `createPlaylist(name, description)`: Creates a new local playlist.
- `addToHistory(trackId)`: Manually add a track to history (done automatically by player).
- `setQuality(type, quality)`: Set global `AudioQuality` (`LOW` to `HI_RES_LOSSLESS`).

---

## 4. Tidal API & Discovery (`tidalApi`)
Located at: `packages/shared/src/services/tidalApi.ts`

### Endpoints
- `search(query: string, limit?: number)`: Returns rich results (Tracks, Albums, Artists).
- `getRecommendations(trackId)`: Returns similar tracks based on a given ID.
- `getMixes()`: Returns the user's generated mixes (Daily Mix, Discovery, etc).
- `mapTrack(rawApiData)`: Transforms Tidal API JSON into the player-ready `Track` format.

---

## 5. Advanced Metadata (`metadataService`)
Located at: `packages/shared/src/services/metadataService.ts`

Uses the **MusicBrainz Picard API** to fetch enriched track data.
- `getAdvancedMetadata(isrc)`: Returns original release dates, record labels, and high-fidelity genre tags.

---

## 6. Playback Behavior
The `AudioEngine` handles several automated behaviors:
- **Progress Tracking**: `useAudioStore.progress` is updated automatically (0.0 to 1.0).
- **Auto-Advance**: When a track finishes, the engine calls `skipNext()`.
- **Pre-warming**: The engine proactively resolves the next track's URL when the current track is >90% complete for faster transitions.
- **History**: Played tracks are automatically pushed to `useLocalStore.listeningHistory`.
- **Replay Gain**: The engine automatically extracts and logs Replay Gain metadata for each track.

---

## 7. Synced Lyrics (`lyricsService`)
Located at: `packages/shared/src/services/lyrics.ts`

### Actions
- `getLyrics(title, artist, album?, duration?)`: Returns a `SyncedLyrics` object.
- The `syncedLyrics` property contains the LRC string (e.g., `[00:12.34] Line of text`).

---

## 8. Platform Specifics (iOS & Android)
The core logic is 100% compatible with native mobile via the `apps/mobile` Expo project.

- **Background Audio**: Link `AudioEngine.play(url)` to `react-native-track-player` for background support.
- **Persistence**: Pass `@react-native-async-storage/async-storage` to the `createJSONStorage` in `database.ts` and `audioContext.tsx` to ensure data survives app restarts.
