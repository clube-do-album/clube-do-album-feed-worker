import { Router } from 'express';
import { FeedService } from '../services/feed.service.js';

const feedService = new FeedService();

export const feedRouter = Router();

feedRouter.get('/feed', async (request, response, next) => {
  try {
    const limit = normalizeLimit(request.query.limit);
    const items = await feedService.list(limit);

    response.json(items);
  } catch (error) {
    next(error);
  }
});

feedRouter.get('/feed/users/:userId', async (request, response, next) => {
  try {
    const limit = normalizeLimit(request.query.limit);
    const items = await feedService.listByUserId(request.params.userId, limit);

    response.json(items);
  } catch (error) {
    next(error);
  }
});

feedRouter.get('/feed/albums/:albumId', async (request, response, next) => {
  try {
    const limit = normalizeLimit(request.query.limit);
    const items = await feedService.listByAlbumId(request.params.albumId, limit);

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
