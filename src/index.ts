import 'dotenv/config';
import { startAlbumRatedConsumer } from './consumers/album-rated.consumer.js';
import { startHttpServer } from './http/server.js';

async function bootstrap() {
  console.log('clube-do-album-feed-worker initialized');
  console.log('Feed worker started');

  startHttpServer();
  await startAlbumRatedConsumer();
}

bootstrap().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Failed to start feed worker.');
  process.exit(1);
});
