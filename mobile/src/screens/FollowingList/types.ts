// src/screens/FollowingList/types.ts
export type Row = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  isFollowing?: boolean;
  updating?: boolean;
};

export type FollowJoinRow = {
  created_at: string;
  following: Row | null;
};
