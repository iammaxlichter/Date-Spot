// src/screens/NewSpotSheet/types.ts
import type { Price, BestFor } from "../../types/datespot";

export type Props = {
  name: string;
  atmosphere: string;
  dateScore: string;

  notes: string;
  vibe: string | null;
  price: Price | null;
  bestFor: BestFor | null;
  wouldReturn: boolean;

  title?: string;

  onChangeName: (v: string) => void;
  onChangeAtmosphere: (v: string) => void;
  onChangeDateScore: (v: string) => void;

  onChangeNotes: (v: string) => void;
  onChangeVibe: (v: string | null) => void;
  onChangePrice: (v: Price | null) => void;
  onChangeBestFor: (v: BestFor | null) => void;
  onChangeWouldReturn: (v: boolean) => void;

  onCancel: () => void;
  onSave: () => void;
};
