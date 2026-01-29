// src/screens/SpotDetails/types.ts

export type ProfileMini = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export type SpotFull = {
  id: string;
  created_at: string;
  user_id: string;

  name: string;
  atmosphere: string | null;
  date_score: number | null;
  notes: string | null;
  vibe: string | null;
  price: string | null;
  best_for: string | null;
  would_return: boolean;

  profiles: ProfileMini | null;
};
