export type LatLng = {
  lat: number;
  lng: number;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const earthRadiusMeters = 6_371_000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMeters * arc;
}

export function findNearbySpot<T extends Coordinate>(
  existingSpots: T[],
  newCoord: Coordinate,
  thresholdMeters: number
): { spot: T; distance: number } | null {
  let best: { spot: T; distance: number } | null = null;

  for (const spot of existingSpots) {
    if (
      !Number.isFinite(spot.latitude) ||
      !Number.isFinite(spot.longitude) ||
      !Number.isFinite(newCoord.latitude) ||
      !Number.isFinite(newCoord.longitude)
    ) {
      continue;
    }

    const distance = distanceMeters(
      { lat: newCoord.latitude, lng: newCoord.longitude },
      { lat: spot.latitude, lng: spot.longitude }
    );

    if (distance > thresholdMeters) continue;
    if (!best || distance < best.distance) {
      best = { spot, distance };
    }
  }

  return best;
}
