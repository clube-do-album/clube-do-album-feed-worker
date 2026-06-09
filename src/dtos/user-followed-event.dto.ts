export interface UserFollowedEvent {
  event: 'USER_FOLLOWED';
  followerId: string;
  followedId: string;
  occurredAt: string;
}
