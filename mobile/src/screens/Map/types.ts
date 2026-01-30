// src/screens/Home/types.ts
import type { Price, BestFor } from "../../types/datespot";

export type GooglePrediction = {
  description: string;
  place_id: string;
};

export type Coords = {
  latitude: number;
  longitude: number;
};

export type NewSpotDraft = {
  coords: Coords | null;
  name: string;
  atmosphere: string;
  dateScore: string;
  notes: string;

  vibe: string | null; 
  price: Price | null;
  bestFor: BestFor | null;
  wouldReturn: boolean;
};
