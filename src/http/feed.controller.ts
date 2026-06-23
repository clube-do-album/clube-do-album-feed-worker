import { Router } from 'express';
import { FeedItemType } from '@prisma/client';
import { FeedService } from '../services/feed.service.js';

const feedService = new FeedService();

export const feedRouter = Router();

feedRouter.get('/feed', async (request, response, next) => {
  try {
    const limit = normalizeLimit(request.query.limit);
    const page = normalizePage(request.query.page);
    const type = normalizeFeedType(request.query.type);
    const items = await feedService.list({ page, limit, type });

    response.json(items);
  } catch (error) {
    next(error);
  }
});

feedRouter.get('/feed/users/:userId', async (request, response, next) => {
  try {
    const limit = normalizeLimit(request.query.limit);
    const page = normalizePage(request.query.page);
    const items = await feedService.listByUserId(request.params.userId, { page, limit });

    response.json(items);
  } catch (error) {
    next(error);
  }
});

feedRouter.get('/feed/albums/:albumId', async (request, response, next) => {
  try {
    const limit = normalizeLimit(request.query.limit);
    const page = normalizePage(request.query.page);
    const items = await feedService.listByAlbumId(request.params.albumId, { page, limit });

    response.json(items);
  } catch (error) {
    next(error);
  }
});

function normalizeLimit(value: unknown): number {
  if (typeof value !== 'string') {
    return 20;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 20;
  }

  return Math.min(parsed, 100);
}

function normalizePage(value: unknown): number {
  if (typeof value !== 'string') {
    return 1;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function normalizeFeedType(value: unknown): FeedItemType | undefined {
  if (value === FeedItemType.ALBUM_RATED || value === FeedItemType.USER_FOLLOWED) {
    return value;
  }

  return undefined;
}
