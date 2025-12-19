// src/screens/Home/types.ts
export type GooglePrediction = {
  description: string;
  place_id: string;
};

export type Coords = {
  latitude: number;
  longitude: number;
};

export type Vibe = "Chill" | "Romantic" | "Energetic" | "Intimate" | "Social";
export type Price = "$" | "$$" | "$$$" | "$$$$" | "$$$$$";
export type BestFor = "Day" | "Night" | "Sunset" | "Any";

export type NewSpotDraft = {
  coords: Coords | null;
  name: string;
  atmosphere: string;
  dateScore: string;
  notes: string;
  vibe: Vibe | null;
  price: Price | null;
  bestFor: BestFor | null;
  wouldReturn: boolean;
};
