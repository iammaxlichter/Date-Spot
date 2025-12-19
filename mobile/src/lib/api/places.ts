// src/lib/api/places.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:3000";

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  atmosphereAverage: number | null;
  dateAverage: number | null;
  totalRatings: number;
};

export async function getNearbyPlaces(lat: number, lng: number, radiusKm = 10) {
  const res = await client.get<Place[]>("/places", {
    params: { latitude: lat, longitude: lng, radiusKm },
  });
  return res.data;
}

export async function createPlace(input: {
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  googlePlaceId?: string | null;
}) {
  const res = await client.post("/places", {
    address: null,
    googlePlaceId: null,
    ...input,
  });
  return res.data;
}

export async function createSpotRating(
  placeId: string,
  input: {
    atmosphereScore: number;
    dateScore: number;
    wouldReturn: boolean;
    notes?: string;
    vibe?: "Chill" | "Romantic" | "Energetic" | "Intimate" | "Social";
    price?: "$" | "$$" | "$$$" | "$$$$" | "$$$$$";
    bestFor?: "Day" | "Night" | "Sunset" | "Any";
  }
) {
  const res = await client.post(`/places/${placeId}/ratings`, {
    ...input,
  });
  return res.data;
}
