class MetadataService {
  private baseUrl = 'https://musicbrainz.org/ws/2';

  /**
   * Fetches enriched metadata (Release date, Label, Genre) from MusicBrainz using ISRC.
   */
  async getAdvancedMetadata(isrc: string) {
    try {
      console.log(`[MetadataService] Fetching MusicBrainz data for ISRC: ${isrc}`);
      const response = await fetch(`${this.baseUrl}/recording?query=isrc:${isrc}&fmt=json`);
      
      if (!response.ok) {
        throw new Error(`MusicBrainz error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.recordings || data.recordings.length === 0) {
        return null;
      }

      // Return the most relevant recording
      const recording = data.recordings[0];
      
      return {
        mbid: recording.id,
        title: recording.title,
        firstReleaseDate: recording['first-release-date'],
        releases: recording.releases?.map((r: any) => ({
          title: r.title,
          date: r.date,
          label: r['label-info']?.[0]?.label?.name,
        })),
        tags: recording.tags?.map((t: any) => t.name),
      };
    } catch (e) {
      console.error('[MetadataService] MusicBrainz lookup failed:', e);
      return null;
    }
  }
}

export const metadataService = new MetadataService();
