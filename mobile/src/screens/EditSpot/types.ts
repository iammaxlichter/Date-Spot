// src/screens/EditSpot/types.ts
import type { Price, BestFor } from "../../lib/types/datespot";

export type SpotEditRow = {
  id: string;
  user_id: string;
  name: string;
  atmosphere: string | null;
  date_score: number | null;
  notes: string | null;
  vibe: string | null;
  price: Price | null;
  best_for: BestFor | null;
  would_return: boolean;
};
