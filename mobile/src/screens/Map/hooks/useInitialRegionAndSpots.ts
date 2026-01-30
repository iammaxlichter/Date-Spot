import { useEffect, useState } from "react";
import type { Region } from "react-native-maps";
import { Alert } from "react-native";
import { getNearbySpots, type Spot } from "../../../services/api/spots";
import { DEFAULT_INITIAL_REGION } from "../constants";

export function useInitialRegionAndSpots() {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // TEMP: hard-code to Richardson / your default area
        const initialRegion: Region = { ...DEFAULT_INITIAL_REGION };
        setRegion(initialRegion);

        const data = await getNearbySpots(
          initialRegion.latitude,
          initialRegion.longitude,
          10
        );

        console.log("Loaded spots:", data.length);
        setSpots(data);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load nearby date spots.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return {
    region,
    setRegion,
    loading,
    permissionDenied,
    setPermissionDenied,
    spots,
    setSpots,
  };
}
