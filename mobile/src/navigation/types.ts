// src/navigation/types.ts
import type { NavigatorScreenParams } from "@react-navigation/native";

export type SearchTabParamList = {
  Map: undefined;
  Users: undefined;
};

export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  EditProfile: undefined;
  Search: NavigatorScreenParams<SearchTabParamList> | undefined;
  Filters: undefined;
  Followers: { userId: string; initialTab?: "followers" | "following" };
  UserProfile: { userId: string };
  SpotDetails: { spotId: string };
  EditSpot: { spotId: string };
};



