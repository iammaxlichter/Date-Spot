// src/types/spotPhotos.ts

export type ExistingSpotPhoto = {
  kind: "existing";
  id: string;        
  path: string;      
  position: number; 
  signedUrl: string;
};

export type LocalSpotPhoto = {
  kind: "local";
  id: string;
  uri: string;
  mimeType: string;
  fileSize?: number;
};

export type SpotPhotoItem = ExistingSpotPhoto | LocalSpotPhoto;
