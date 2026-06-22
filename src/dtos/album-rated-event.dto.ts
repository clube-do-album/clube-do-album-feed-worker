export interface AlbumRatedEvent {
  event: 'ALBUM_RATED';
  albumId: string;
  userId: string;
  rating: number;
  review?: string | null;
  occurredAt: string;
}
