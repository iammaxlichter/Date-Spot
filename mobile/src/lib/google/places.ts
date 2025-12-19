// src/lib/google/places.ts
const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY!;

export async function fetchAutocomplete(params: {
  input: string;
  location: { latitude: number; longitude: number };
  radius?: number;
}) {
  const { input, location, radius = 20000 } = params;

  const url =
    "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
    `?input=${encodeURIComponent(input)}` +
    `&location=${location.latitude},${location.longitude}` +
    `&radius=${radius}` +
    `&types=establishment` +
    `&key=${KEY}`;

  const res = await fetch(url);
  const json = await res.json();
  return json;
}

export async function fetchPlaceDetails(placeId: string) {
  const url =
    "https://maps.googleapis.com/maps/api/place/details/json" +
    `?place_id=${placeId}` +
    `&fields=geometry,formatted_address,name` +
    `&key=${KEY}`;

  const res = await fetch(url);
  const json = await res.json();
  return json;
}
