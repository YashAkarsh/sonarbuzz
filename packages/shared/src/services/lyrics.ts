export interface SyncedLyrics {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string; // The LRC format string
}

class LyricsService {
  private baseUrl = 'https://lrclib.net/api';

  async getLyrics(title: string, artist: string, album?: string, duration?: number): Promise<SyncedLyrics | null> {
    try {
      const params = new URLSearchParams({
        track_name: title,
        artist_name: artist,
      });

      if (album) params.append('album_name', album);
      if (duration) params.append('duration', Math.round(duration).toString());

      const response = await fetch(`${this.baseUrl}/get?${params.toString()}`);

      if (!response.ok) {
        // If exact match fails, try searching
        const searchResponse = await fetch(`${this.baseUrl}/search?${params.toString()}`);
        if (searchResponse.ok) {
          const results = await searchResponse.json();
          return results.length > 0 ? results[0] : null;
        }
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('[LyricsService] Failed to fetch lyrics:', error);
      return null;
    }
  }
}

export const lyricsService = new LyricsService();
