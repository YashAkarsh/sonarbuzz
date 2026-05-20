# Settings & Last.fm Integration

The app's behavior and external integrations are managed through the `settings` object in `useLocalStore`.

## ⚙️ Settings Menu Implementation

### Bare Minimum Options (Already Implemented in Store)
The following options should be exposed in your Settings UI:

1.  **Audio Quality**:
    *   `settings.streamingQuality`: (Low, High, Lossless, Hi-Res)
    *   `settings.downloadQuality`: (Low, High, Lossless, Hi-Res)
2.  **Appearance**:
    *   `settings.theme`: (Light, Dark, System)
3.  **Playback**:
    *   `settings.playback.gapless`: (Toggle)
    *   `settings.playback.crossfade`: (Slider: 0-12s)
    *   `settings.playback.showExplicit`: (Toggle)
4.  **Integration**:
    *   `settings.lastfmSession`: (Login/Logout button)

---

## 🎵 Last.fm Authentication Flow

To implement the "Sign in with Last.fm" button:

```typescript
import { lastfmService } from '@shared/services/lastfm';

const handleLogin = async () => {
  // 1. Get the auth URL
  const { token, url } = await lastfmService.getAuthUrl();
  
  // 2. Open the URL in a browser for the user to click "Authorize"
  Linking.openURL(url); 
  
  // 3. After the user returns to the app, complete the session
  const username = await lastfmService.completeAuth(token);
  console.log(`Signed in as ${username}`);
};
```

**Note**: Scrobbling is **automatic**. Once a session exists, the `AudioEngine` will report tracks to Last.fm without any extra UI code.

---