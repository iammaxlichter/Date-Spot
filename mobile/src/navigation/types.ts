// src/navigation/types.ts
export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Feed: undefined;
  Home: undefined;
  Profile: undefined;
  Search: undefined;
  Followers: { userId: string };
  Following: { userId: string };
  UserProfile: { userId: string };
  SpotDetails: { spotId: string };
  EditSpot: { spotId: string };
};
