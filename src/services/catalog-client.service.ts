type CatalogAlbumResponse = {
  id: string;
  name?: string;
  albumName?: string;
  artists?: Array<{
    name?: string;
  }>;
};

export type AlbumSummary = {
  id: string;
  name: string;
  artistName?: string;
};

export class CatalogClientService {
  private readonly baseUrl = process.env.CATALOG_API_URL?.trim() || 'http://localhost:3001';

  async findAlbumById(albumId: string): Promise<AlbumSummary | null> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/albums/${albumId}`);

      if (!response.ok) {
        return null;
      }

      const album = await response.json() as CatalogAlbumResponse;

      return {
        id: album.id,
        name: album.name ?? album.albumName ?? albumId,
        artistName: album.artists?.[0]?.name,
      };
    } catch {
      return null;
    }
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 2000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
