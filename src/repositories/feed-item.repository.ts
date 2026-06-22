import { FeedItemType } from '@prisma/client';
import { prisma } from '../config/prisma.js';

interface CreateAlbumRatedFeedItemData {
  albumId: string;
  userId: string;
  rating: number;
  review?: string | null;
  occurredAt: Date;
  message: string;
}

interface CreateUserFollowedFeedItemData {
  followerId: string;
  followedId: string;
  occurredAt: Date;
  message: string;
}

export class FeedItemRepository {
  list(limit: number) {
    return prisma.feedItem.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  listByUserId(userId: string, limit: number) {
    return prisma.feedItem.findMany({
      where: {
        userId,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  listByAlbumId(albumId: string, limit: number) {
    return prisma.feedItem.findMany({
      where: {
        albumId,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAlbumRatedFeedItem(data: CreateAlbumRatedFeedItemData) {
    const current = await prisma.feedItem.findFirst({
      where: {
        type: FeedItemType.ALBUM_RATED,
        userId: data.userId,
        albumId: data.albumId,
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });

    if (current) {
      return prisma.feedItem.update({
        where: {
          id: current.id,
        },
        data: {
          rating: data.rating,
          review: data.review,
          message: data.message,
          occurredAt: data.occurredAt,
        },
      });
    }

    return prisma.feedItem.create({
      data: {
        type: FeedItemType.ALBUM_RATED,
        userId: data.userId,
        albumId: data.albumId,
        rating: data.rating,
        review: data.review,
        occurredAt: data.occurredAt,
        message: data.message,
      },
    });
  }

  createUserFollowedFeedItem(data: CreateUserFollowedFeedItemData) {
    return prisma.feedItem.upsert({
      where: {
        type_userId_targetUserId_occurredAt: {
          type: FeedItemType.USER_FOLLOWED,
          userId: data.followerId,
          targetUserId: data.followedId,
          occurredAt: data.occurredAt,
        },
      },
      create: {
        type: FeedItemType.USER_FOLLOWED,
        userId: data.followerId,
        targetUserId: data.followedId,
        occurredAt: data.occurredAt,
        message: data.message,
      },
      update: {
        message: data.message,
      },
    });
  }
}
