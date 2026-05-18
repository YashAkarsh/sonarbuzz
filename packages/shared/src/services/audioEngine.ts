import { Platform } from 'react-native';

class AudioEngine {
  play(url: string) {
    if (Platform.OS === 'web') {
      const audio = new Audio(url);
      audio.play();
    } else {
      // Send command string to native media player layer
      console.log(`[Native Audio] Playing ${url}`);
    }
  }

  pause() {
    if (Platform.OS === 'web') {
      // Pause HTML5 audio
    } else {
      console.log(`[Native Audio] Paused`);
    }
  }
}

export const audioEngine = new AudioEngine();