// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert, Text } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";

const API_URL = "http://10.0.2.2:3000"; // <-- put YOUR machine's LAN IP here

type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  atmosphereAverage: number | null;
  dateAverage: number | null;
  totalRatings: number;
};

export default function HomeScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [spots, setSpots] = useState<Place[]>([]);

  useEffect(() => {
  (async () => {
    try {
      // You can still request permission if you want, but it's optional now
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // if (status !== "granted") { ... }

      // TEMP: hard-code to Richardson / your Seoul place
      const latitude = 32.977;
      const longitude = -96.735;

      const initialRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(initialRegion);

      const res = await axios.get<Place[]>(`${API_URL}/places`, {
        params: {
          latitude,
          longitude,
          radiusKm: 10,
        },
      });

      console.log("Loaded spots:", res.data.length);
      setSpots(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load nearby date spots.");
    } finally {
      setLoading(false);
    }
  })();
}, []);


  if (!region) {
    // only while we don't even have a fallback region
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
        <Text>Loading map…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {permissionDenied && (
        <View
          style={{
            padding: 8,
            backgroundColor: "#fee",
          }}
        >
          <Text>
            Location permission denied. Showing a default area instead.
          </Text>
        </View>
      )}

      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: spot.latitude,
              longitude: spot.longitude,
            }}
            title={spot.name}
            description={
              spot.totalRatings > 0
                ? `Atmosphere: ${spot.atmosphereAverage?.toFixed(
                    1,
                  )} · Date: ${spot.dateAverage?.toFixed(1)}`
                : "No ratings yet"
            }
          />
        ))}
      </MapView>
    </View>
  );
}
