import { Platform } from 'react-native';
import { tidalApi } from './tidalApi';

class AudioEngine {
  private currentAudio: any = null;

  async play(trackId: string) {
    try {
      const url = await tidalApi.getStreamUrl(trackId);
      console.log(`[AudioEngine] Resolved stream URL for ${trackId}: ${url}`);

      if (Platform.OS === 'web') {
        if (this.currentAudio) {
          this.currentAudio.pause();
        }
        this.currentAudio = new Audio(url);
        this.currentAudio.play();
      } else {
        // Send command string to native media player layer
        console.log(`[Native Audio] Playing ${url}`);
      }
    } catch (error) {
      console.error('[AudioEngine] Playback failed:', error);
    }
  }

  pause() {
    if (Platform.OS === 'web') {
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
    } else {
      console.log(`[Native Audio] Paused`);
    }
  }
}

export const audioEngine = new AudioEngine();