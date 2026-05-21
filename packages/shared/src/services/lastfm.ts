import { md5 } from '../utils/md5';
import { useLocalStore } from './database';
import { Track } from '../store/audioContext';

class LastFMService {
  private API_KEY = 'f462b4586d91c4ed6e23cabb5fbcb7c1';
  private API_SECRET = '5ea42b6b0605a9537ca0d860194b3af1';
  private API_URL = 'https://ws.audioscrobbler.com/2.0/';

  private generateSignature(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    let signatureString = sortedKeys.map((key) => `${key}${params[key]}`).join('');
    signatureString += this.API_SECRET;
    return md5(signatureString);
  }

  private async makeRequest(method: string, params: Record<string, string>, requiresAuth = false) {
    const requestParams: Record<string, string> = {
      method,
      api_key: this.API_KEY,
      ...params,
    };

    const session = useLocalStore.getState().settings.lastfmSession;
    if (requiresAuth && session) {
      requestParams.sk = session.key;
    }

    const signature = this.generateSignature(requestParams);
    const formData = new URLSearchParams({
      ...requestParams,
      api_sig: signature,
      format: 'json',
    });

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('[LastFM] Request failed:', error);
      return null;
    }
  }

  /**
   * Step 1: Get token and return the URL for user to authorize in browser
   */
  async getAuthUrl() {
    const data = await this.makeRequest('auth.getToken', {});
    const token = data?.token;
    if (!token) return null;

    return {
      token,
      url: `https://www.last.fm/api/auth/?api_key=${this.API_KEY}&token=${token}`,
    };
  }

  /**
   * Step 2: After user authorizes, call this to get the persistent session key
   */
  async completeAuth(token: string) {
    const data = await this.makeRequest('auth.getSession', { token });
    if (data?.session) {
      useLocalStore.getState().setLastfmSession({
        key: data.session.key,
        name: data.session.name,
      });
      return data.session.name;
    }
    return null;
  }

  /**
   * Update "Now Playing" status
   */
  async updateNowPlaying(track: Track) {
    const session = useLocalStore.getState().settings.lastfmSession;
    if (!session) return;

    await this.makeRequest('track.updateNowPlaying', {
      artist: track.artist,
      track: track.title,
      duration: Math.round(track.duration).toString(),
    }, true);
    console.log(`[LastFM] Updated now playing: ${track.title}`);
  }

  /**
   * Scrobble the track (permanent play count)
   */
  async scrobble(track: Track) {
    const session = useLocalStore.getState().settings.lastfmSession;
    if (!session) return;

    await this.makeRequest('track.scrobble', {
      artist: track.artist,
      track: track.title,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      album: track.artworkUrl ? '' : '', // Optional: could fetch album title if available
    }, true);
    console.log(`[LastFM] Scrobbled: ${track.title}`);
  }

  logout() {
    useLocalStore.getState().setLastfmSession(null);
  }
}

export const lastfmService = new LastFMService();
