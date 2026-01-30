// src/screens/FollowersList/types.ts
export type Row = {
  id: string;
  username: string | null;
  avatar_url: string | null;

  // for button UI
  isFollowing?: boolean;
  updating?: boolean;

  // for remove-follower (X)
  removing?: boolean;
};

export type FollowJoinRow = {
  created_at: string;
  follower: Row | null;
};
