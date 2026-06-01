import type { AlbumRatedEvent } from '../dtos/album-rated-event.dto.js';
import { FeedItemRepository } from '../repositories/feed-item.repository.js';

const feedItemRepository = new FeedItemRepository();

export class FeedService {
  async list(limit: number) {
    return feedItemRepository.list(limit);
  }

  async listByUserId(userId: string, limit: number) {
    return feedItemRepository.listByUserId(userId, limit);
  }

  async listByAlbumId(albumId: string, limit: number) {
    return feedItemRepository.listByAlbumId(albumId, limit);
  }

  async handleAlbumRated(event: AlbumRatedEvent): Promise<void> {
    const occurredAt = new Date(event.occurredAt);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new Error('Invalid occurredAt received in ALBUM_RATED event.');
    }

    const message = `${event.userId} avaliou o album ${event.albumId} com nota ${event.rating}`;

    const feedItem = await feedItemRepository.createAlbumRatedFeedItem({
      albumId: event.albumId,
      userId: event.userId,
      rating: event.rating,
      occurredAt,
      message,
    });

    console.log(`Feed item created for ALBUM_RATED: ${feedItem.id}`);
  }
}
