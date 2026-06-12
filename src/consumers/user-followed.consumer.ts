import type { ConsumeMessage } from 'amqplib';
import type { UserFollowedEvent } from '../dtos/user-followed-event.dto.js';
import {
  getRabbitChannel,
  getUserFollowedQueue,
  getUserFollowedRoutingKey,
  setupConsumerQueue,
} from '../messaging/rabbitmq.connection.js';
import { FeedService } from '../services/feed.service.js';

const feedService = new FeedService();

export async function startUserFollowedConsumer() {
  const channel = await getRabbitChannel();
  const queue = getUserFollowedQueue();
  const routingKey = getUserFollowedRoutingKey();

  await setupConsumerQueue(channel, queue, routingKey);

  console.log(`Waiting for ${routingKey} events...`);

  await channel.consume(queue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = parseUserFollowedEvent(message);

      console.log(`USER_FOLLOWED received for feed: followerId=${event.followerId}, followedId=${event.followedId}`);

      await feedService.handleUserFollowed(event);
      channel.ack(message);
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Unexpected user followed feed consumer error.');
      channel.nack(message, false, false);
    }
  });
}

function parseUserFollowedEvent(message: ConsumeMessage): UserFollowedEvent {
  let payload: unknown;

  try {
    payload = JSON.parse(message.content.toString('utf8'));
  } catch {
    throw new Error('Invalid JSON message received.');
  }

  if (!isUserFollowedEvent(payload)) {
    throw new Error('Unexpected event received.');
  }

  return payload;
}

function isUserFollowedEvent(payload: unknown): payload is UserFollowedEvent {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const event = payload as Partial<UserFollowedEvent>;

  return (
    event.event === 'USER_FOLLOWED' &&
    typeof event.followerId === 'string' &&
    typeof event.followedId === 'string' &&
    typeof event.occurredAt === 'string'
  );
}
