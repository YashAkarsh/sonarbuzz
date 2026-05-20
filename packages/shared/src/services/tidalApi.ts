import { ConfigSync } from './configSync';

export interface TidalTrack {
  id: string;
  title: string;
  duration: number;
  trackNumber: number;
  volumeNumber: number;
  uri: string;
  album: {
    id: string;
    title: string;
    cover: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
}

export type AudioQuality = 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES' | 'HI_RES_LOSSLESS';

class TidalAPI {
  private baseUrlV1 = 'https://api.tidal.com/v1';
  private baseUrlV2 = 'https://openapi.tidal.com/v2';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private countryCode = 'US';

  /**
   * NOTE ON CORS:
   * - In Native Mobile (React Native Android/iOS): fetch() bypasses CORS.
   * - In Web Browsers: This will hit CORS unless running through a proxy or 
   *   using Tauri's native fetch plugin (which bypasses the browser's sandbox).
   */
  private async getValidToken(): Promise<string> {
    // Check if token exists and is not about to expire (buffer of 60 seconds)
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const token = await ConfigSync.fetchToken();
    this.accessToken = token.toString();
    // Set expiry to 24h
    this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    return this.accessToken;
  }

  private async fetchTidal(
    endpoint: string,
    version: 'v1' | 'v2' = 'v1',
    params: Record<string, string | number> = {}
  ): Promise<any> {
    const token = await this.getValidToken();
    const baseUrl = version === 'v1' ? this.baseUrlV1 : this.baseUrlV2;
    
    const url = new URL(`${baseUrl}${endpoint}`);
    url.searchParams.set('countryCode', this.countryCode);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString());
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TIDAL/2.44.1 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.status === 401) {
      // Force token refresh on 401
      this.accessToken = null;
      return this.fetchTidal(endpoint, version, params);
    }

    if (!response.ok) {
      throw new Error(`Tidal API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  getCoverUrl(id: string, size: string = '1280') {
    if (!id) return '';
    const formattedId = id.replace(/-/g, '/');
    return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
  }

  async search(query: string, limit: number = 20) {
    // Using v2 for search as it provides better results and related objects
    const data = await this.fetchTidal('/searchResults', 'v2', {
      query,
      include: 'tracks,tracks.artists,tracks.albums,tracks.albums.coverArt',
      limit,
    });
    return data;
  }

  async getTrack(id: string) {
    return this.fetchTidal(`/tracks/${id}`);
  }

  /**
   * Resolves the direct playback URL and Replay Gain metadata.
   * @param quality - Use 'HI_RES_LOSSLESS' for 24-bit quality (requires compatible Client ID).
   */
  async getStreamUrl(id: string, quality: AudioQuality = 'HI_RES_LOSSLESS') {
    const data = await this.fetchTidal(`/tracks/${id}/playbackinfo`, 'v1', {
      audioquality: quality,
      playbackmode: 'STREAM',
      assetpresentation: 'FULL',
    });

    const replayGain = {
      gain: data.trackReplayGain || 0,
      peak: data.trackPeakAmplitude || 1,
    };

    if (data.url || data.streamUrl) {
      return { url: data.url || data.streamUrl, replayGain };
    }

    if (data.manifest) {
      return { url: this.extractStreamUrlFromManifest(data.manifest), replayGain };
    }

    throw new Error('Could not resolve stream URL from Tidal response');
  }

  private extractStreamUrlFromManifest(manifest: string): string {
    try {
      // Manifests are usually Base64 encoded JSON
      const decoded = atob(manifest);
      const parsed = JSON.parse(decoded);

      if (parsed.urls && Array.isArray(parsed.urls) && parsed.urls.length > 0) {
        // Return the first URL (usually the highest quality matching the request)
        return parsed.urls[0];
      }

      if (parsed.url) return parsed.url;
      
      throw new Error('Manifest does not contain valid URLs');
    } catch (e) {
      console.error('[TidalAPI] Manifest parsing failed:', e);
      // If it's not JSON, it might be the URL itself (unlikely but possible)
      return manifest;
    }
  }

  async getAlbum(id: string) {
    return this.fetchTidal(`/albums/${id}`);
  }

  async getAlbumTracks(id: string) {
    return this.fetchTidal(`/albums/${id}/tracks`);
  }

  async getArtist(id: string) {
    return this.fetchTidal(`/artists/${id}`);
  }

  async getArtistTopTracks(id: string) {
    return this.fetchTidal(`/artists/${id}/toptracks`);
  }

  async getPlaylist(id: string) {
    return this.fetchTidal(`/playlists/${id}`);
  }

  async getPlaylistTracks(id: string) {
    return this.fetchTidal(`/playlists/${id}/tracks`);
  }

  async getRecommendations(id: string) {
    return this.fetchTidal(`/tracks/${id}/recommendations`);
  }

  async getMixes() {
    // Fetches the user's home page mixes
    return this.fetchTidal('/pages/mymusic', 'v1', {
      deviceType: 'BROWSER',
    });
  }

  /**
   * Transforms raw Tidal track data into the format used by useAudioStore.
   */
  mapTrack(raw: any) {
    return {
      id: raw.id.toString(),
      title: raw.title,
      artist: raw.artists?.[0]?.name || raw.artist?.name || 'Unknown Artist',
      artworkUrl: raw.album ? this.getCoverUrl(raw.album.cover || raw.album.id) : undefined,
      duration: raw.duration,
      isrc: raw.isrc,
    };
  }
}

export const tidalApi = new TidalAPI();
