// src/navigation/types.ts
import type { NavigatorScreenParams } from "@react-navigation/native";

export type SearchTabParamList = {
  Map: undefined;
  Users: undefined;
};

export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Search: NavigatorScreenParams<SearchTabParamList> | undefined;
  Followers: { userId: string };
  Following: { userId: string };
  UserProfile: { userId: string };
  SpotDetails: { spotId: string };
  EditSpot: { spotId: string };
};
