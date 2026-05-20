import { Platform } from 'react-native';
import { tidalApi } from './tidalApi';
import { useAudioStore } from '../store/audioContext';
import { useOfflineStore } from './offlineManager';
class AudioEngine {
  private currentAudio: any = null;
  private progressInterval: any = null;
  private preWarmedTrackId: string | null = null;
  private preWarmedUrl: string | null = null;

  async play(trackId: string) {
    try {
      // 1. Check if we already pre-warmed this track
      let audioInfo = this.preWarmedTrackId === trackId ? { url: this.preWarmedUrl, replayGain: null } : null;

      if (!audioInfo?.url) {
        const local = useOfflineStore.getState().getLocalUri(trackId);
        if (local) {
          audioInfo = { url: local, replayGain: null };
        } else {
          const result = await tidalApi.getStreamUrl(trackId);
          audioInfo = result;
        }
      }

      const { url, replayGain } = audioInfo!;
      if (replayGain) {
        console.log(`[AudioEngine] Applying Replay Gain: ${replayGain.gain}dB (Peak: ${replayGain.peak})`);
        // Note: Real gain adjustment happens at the player level (Web GainNode or Native volume)
        useAudioStore.setState((state) => ({
          currentTrack: state.currentTrack ? { ...state.currentTrack, replayGain } : null
        }));
      }

      console.log(`[AudioEngine] Playback source: ${url}`);

        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.src = '';
        }

        this.currentAudio = new Audio(url!);

        // Handle Progress, Auto-advance, and Pre-warming
        this.currentAudio.ontimeupdate = () => {
          if (this.currentAudio) {
            const progress = this.currentAudio.currentTime / this.currentAudio.duration;
            useAudioStore.setState({ progress });

            // Pre-warm the next track at 90% completion
            if (progress > 0.9 && !this.preWarmedTrackId) {
              this.preWarmNext();
            }
          }
        };
...
  private async preWarmNext() {
    const { queue, currentTrack } = useAudioStore.getState();
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const nextTrack = queue[currentIndex + 1];

    if (nextTrack) {
      console.log(`[AudioEngine] Pre-warming next track: ${nextTrack.id}`);
      this.preWarmedTrackId = nextTrack.id;
      try {
        const local = useOfflineStore.getState().getLocalUri(nextTrack.id);
        this.preWarmedUrl = local || await tidalApi.getStreamUrl(nextTrack.id);
      } catch (e) {
        this.preWarmedTrackId = null; // Reset on failure
      }
    }
  }

  pause() {

        this.currentAudio.onended = () => {
          console.log('[AudioEngine] Track ended, skipping next...');
          useAudioStore.getState().skipNext();
        };

        this.currentAudio.play();
      } else {
        // NATIVE IMPLEMENTATION (iOS/Android)
        // Here, the UI developer should bridge to react-native-track-player or expo-av
        console.log(`[Native Audio] Playing ${url}`);

        // Mocking progress for native dev visibility
        if (this.progressInterval) clearInterval(this.progressInterval);
        let mockProgress = 0;
        this.progressInterval = setInterval(() => {
          mockProgress += 0.01;
          if (mockProgress >= 1) {
            clearInterval(this.progressInterval);
            useAudioStore.getState().skipNext();
          }
          useAudioStore.setState({ progress: mockProgress });
        }, 1000);
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
      if (this.progressInterval) clearInterval(this.progressInterval);
      console.log(`[Native Audio] Paused`);
    }
  }
}

export const audioEngine = new AudioEngine();