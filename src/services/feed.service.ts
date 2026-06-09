import type { AlbumRatedEvent } from '../dtos/album-rated-event.dto.js';
import type { UserFollowedEvent } from '../dtos/user-followed-event.dto.js';
import { FeedItemRepository } from '../repositories/feed-item.repository.js';
import { CatalogClientService } from './catalog-client.service.js';
import { IdentityClientService } from './identity-client.service.js';

const feedItemRepository = new FeedItemRepository();
const catalogClientService = new CatalogClientService();
const identityClientService = new IdentityClientService();

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

    const [user, album] = await Promise.all([
      identityClientService.findUserById(event.userId),
      catalogClientService.findAlbumById(event.albumId),
    ]);

    const userName = user?.name ?? shortId(event.userId);
    const albumName = album?.name ?? shortId(event.albumId);
    const artistName = album?.artistName ? ` de ${album.artistName}` : '';
    const message = `${userName} avaliou ${albumName}${artistName} com nota ${event.rating}`;

    const feedItem = await feedItemRepository.createAlbumRatedFeedItem({
      albumId: event.albumId,
      userId: event.userId,
      rating: event.rating,
      occurredAt,
      message,
    });

    console.log(`Feed item created for ALBUM_RATED: ${feedItem.id}`);
  }

  async handleUserFollowed(event: UserFollowedEvent): Promise<void> {
    const occurredAt = new Date(event.occurredAt);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new Error('Invalid occurredAt received in USER_FOLLOWED event.');
    }

    const [follower, followed] = await Promise.all([
      identityClientService.findUserById(event.followerId),
      identityClientService.findUserById(event.followedId),
    ]);

    const followerName = follower?.name ?? shortId(event.followerId);
    const followedName = followed?.name ?? shortId(event.followedId);
    const message = `${followerName} comecou a seguir ${followedName}`;

    const feedItem = await feedItemRepository.createUserFollowedFeedItem({
      followerId: event.followerId,
      followedId: event.followedId,
      occurredAt,
      message,
    });

    console.log(`Feed item created for USER_FOLLOWED: ${feedItem.id}`);
  }
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}
