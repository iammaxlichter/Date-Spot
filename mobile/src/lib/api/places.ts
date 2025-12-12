// src/lib/api/places.ts
import axios from "axios";

const API_URL = "http://10.0.2.2:3000";

const client = axios.create({
  baseURL: API_URL,
});

// TEMP until proper auth
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTcxYzMwNS0wYjI3LTQ2ZjUtYjE1OC0yYTUyZTEwNDc5YTIiLCJlbWFpbCI6InRlc3QyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1NDE1MTc2LCJleHAiOjE3NjYwMTk5NzZ9.kdw46OgDPmj5rlCT6nRp_CvE1let0Tbsv69drfQCrIc";

client.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
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

export async function createSpotRating(placeId: string, input: {
  atmosphereScore: number;
  dateScore: number;
  recommend: boolean;
  notes?: string;
}) {
  const res = await client.post(`/places/${placeId}/ratings`, {
    notes: "",
    ...input,
  });
  return res.data;
}
