// src/screens/NewSpotSheet/types.ts
import type { Price, BestFor } from "../../types/datespot";
import type { SpotPhotoItem } from "../../types/spotPhotos";
import type { TaggedUser } from "../../services/api/spotTags";
import type { PartnerAnswer } from "../../features/tags/partnerTagging";

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
  
  photos: SpotPhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<SpotPhotoItem[]>>;
  enableFullscreenPreview?: boolean;

  debugLabel?: string;

  selectedTaggedUsers: TaggedUser[];
  eligibleTagUsers: TaggedUser[];
  tagUsersLoading: boolean;
  activePartner: TaggedUser | null;
  partnerAnswer: PartnerAnswer;
  
  onChangeName: (v: string) => void;
  onChangeAtmosphere: (v: string) => void;
  onChangeDateScore: (v: string) => void;

  onChangeNotes: (v: string) => void;
  onChangeVibe: (v: string | null) => void;
  onChangePrice: (v: Price | null) => void;
  onChangeBestFor: (v: BestFor | null) => void;
  onChangeWouldReturn: (v: boolean) => void;
  onChangeTaggedUsers: (users: TaggedUser[]) => void;
  onChangePartnerAnswer: (answer: PartnerAnswer) => void;

  onCancel: () => void;
  onSave: () => void;

};
