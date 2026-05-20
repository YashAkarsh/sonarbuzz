import { Platform } from 'react-native';
import { tidalApi } from './tidalApi';
import { useAudioStore } from '../store/audioContext';
import { useOfflineStore } from './offlineManager';
import { lastfmService } from './lastfm';

class AudioEngine {
  private currentAudio: any = null;
  private progressInterval: any = null;
  private preWarmedTrackId: string | null = null;
  private preWarmedUrl: string | null = null;
  private hasScrobbled = false;

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
      
      // Update store and notify Last.fm
      const track = useAudioStore.getState().currentTrack;
      if (track) {
        lastfmService.updateNowPlaying(track);
        this.hasScrobbled = false;
      }

      if (replayGain) {
        console.log(`[AudioEngine] Applying Replay Gain: ${replayGain.gain}dB (Peak: ${replayGain.peak})`);
        useAudioStore.setState((state) => ({
          currentTrack: state.currentTrack ? { ...state.currentTrack, replayGain } : null
        }));
      }

      console.log(`[AudioEngine] Playback source: ${url}`);

      // Reset pre-warm cache
      this.preWarmedTrackId = null;
      this.preWarmedUrl = null;

      if (Platform.OS === 'web') {
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

            // Scrobble at 50%
            if (progress > 0.5 && !this.hasScrobbled && track) {
              lastfmService.scrobble(track);
              this.hasScrobbled = true;
            }

            // Pre-warm the next track at 90% completion
            if (progress > 0.9 && !this.preWarmedTrackId) {
              this.preWarmNext();
            }
          }
        };

        this.currentAudio.onended = () => {
          console.log('[AudioEngine] Track ended, skipping next...');
          useAudioStore.getState().skipNext();
        };

        this.currentAudio.play();
      } else {
        // NATIVE IMPLEMENTATION (iOS/Android)
        console.log(`[Native Audio] Playing ${url}`);
        
        if (this.progressInterval) clearInterval(this.progressInterval);
        let mockProgress = 0;
        this.progressInterval = setInterval(() => {
          mockProgress += 0.01;
          useAudioStore.setState({ progress: mockProgress });

          if (mockProgress > 0.5 && !this.hasScrobbled && track) {
            lastfmService.scrobble(track);
            this.hasScrobbled = true;
          }

          if (mockProgress >= 1) {
            clearInterval(this.progressInterval);
            useAudioStore.getState().skipNext();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('[AudioEngine] Playback failed:', error);
    }
  }

  private async preWarmNext() {
    const { queue, currentTrack } = useAudioStore.getState();
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    const nextTrack = queue[currentIndex + 1];

    if (nextTrack) {
      console.log(`[AudioEngine] Pre-warming next track: ${nextTrack.id}`);
      this.preWarmedTrackId = nextTrack.id;
      try {
        const local = useOfflineStore.getState().getLocalUri(nextTrack.id);
        const result = local ? { url: local } : await tidalApi.getStreamUrl(nextTrack.id);
        this.preWarmedUrl = result.url;
      } catch (e) {
        this.preWarmedTrackId = null;
      }
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
