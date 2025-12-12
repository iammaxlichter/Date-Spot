// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import {
  Place,
  getNearbyPlaces,
  createPlace,
  createSpotRating,
} from "../lib/api/places";
import { styles } from "./styles";
import { NewSpotSheet } from "./NewSpotSheet";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY!;

type GooglePrediction = {
  description: string;
  place_id: string;
};

export default function HomeScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [spots, setSpots] = useState<Place[]>([]);

  const [newSpotCoords, setNewSpotCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [newSpotName, setNewSpotName] = useState("");
  const [newAtmosphere, setNewAtmosphere] = useState("8");
  const [newDateScore, setNewDateScore] = useState("8");

  const mapRef = useRef<MapView | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [googleResults, setGoogleResults] = useState<GooglePrediction[]>([]);
  const [searching, setSearching] = useState(false);

  // Load initial region + nearby saved spots
  useEffect(() => {
    (async () => {
      try {
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

        const data = await getNearbyPlaces(latitude, longitude, 10);
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

  // Google Places autocomplete when user types
  useEffect(() => {
    if (!region) return;

    if (searchQuery.length < 2) {
      setGoogleResults([]);
      return;
    }

    let cancelled = false;

    const fetchPlaces = async () => {
      try {
        setSearching(true);

        const url =
          "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
          `?input=${encodeURIComponent(searchQuery)}` +
          `&location=${region.latitude},${region.longitude}` +
          `&radius=20000` + // 20km
          `&types=establishment` +
          `&key=${GOOGLE_PLACES_API_KEY}`;

        const res = await fetch(url);
        const json = await res.json();
        console.log("Places autocomplete JSON:", json);

        if (!cancelled) {
          setGoogleResults((json.predictions ?? []) as GooglePrediction[]);
        }
      } catch (err) {
        console.error("Places autocomplete error", err);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, region]);

  const handleStartNewSpot = () => {
    if (!region) return;
    const { latitude, longitude } = region;
    setNewSpotCoords({ latitude, longitude });
    setNewSpotName("");
    setNewAtmosphere("8");
    setNewDateScore("8");
    Alert.alert("New Date Spot", "Drag the red pin to the exact date spot.");
  };

  const handleCancelNewSpot = () => {
    setNewSpotCoords(null);
  };

  const handleSaveNewSpot = async () => {
    if (!newSpotCoords) return;

    if (!newSpotName.trim()) {
      Alert.alert("Name required", "Please enter a name for the date spot.");
      return;
    }

    try {
      console.log("Creating place…");
      const place = await createPlace({
        name: newSpotName.trim(),
        latitude: newSpotCoords.latitude,
        longitude: newSpotCoords.longitude,
      });

      console.log("Place created → creating rating…");
      await createSpotRating(place.id, {
        atmosphereScore: Number(newAtmosphere),
        dateScore: Number(newDateScore),
        recommend: true,
      });

      setSpots((prev) => [...prev, place]);
      Alert.alert("Success!", "Your date spot has been saved.");

      setNewSpotCoords(null);
      setNewSpotName("");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save date spot.");
    }
  };

  const handleSelectSavedSpot = (spot: Place) => {
    const targetRegion: Region = {
      latitude: spot.latitude,
      longitude: spot.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    setRegion(targetRegion);
    mapRef.current?.animateToRegion(targetRegion, 500);
    setSearchQuery(spot.name);
  };

  const handleSelectGooglePlace = async (prediction: GooglePrediction) => {
    if (!region) return;

    try {
      const url =
        "https://maps.googleapis.com/maps/api/place/details/json" +
        `?place_id=${prediction.place_id}` +
        `&fields=geometry,formatted_address,name` +
        `&key=${GOOGLE_PLACES_API_KEY}`;

      const res = await fetch(url);
      const json = await res.json();

      const result = json.result;
      if (!result || !result.geometry || !result.geometry.location) {
        throw new Error("No geometry in place details");
      }

      const latitude = result.geometry.location.lat;
      const longitude = result.geometry.location.lng;

      const targetRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      // Move map there
      setRegion(targetRegion);
      mapRef.current?.animateToRegion(targetRegion, 500);

      // Prime a new date spot using this location + name
      setNewSpotCoords({ latitude, longitude });
      setNewSpotName(result.name || prediction.description);

      setSearchQuery(result.name || prediction.description);
    } catch (err) {
      console.error("Place details error", err);
      Alert.alert("Error", "Failed to load place details from Google.");
    }
  };

  if (loading || !region) {
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

  // Local matches from your own saved date spots
  const localMatches = searchQuery.length
    ? spots.filter((spot) =>
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <View style={{ flex: 1 }}>
      {/* Top overlay: search + Add Pin */}
      <View style={styles.topOverlay}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search places or date spots…"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Suggestions dropdown: saved spots + Google Places */}
        {(searchQuery.length > 0 ||
          localMatches.length > 0 ||
          googleResults.length > 0) && (
          <View style={styles.suggestionsWrapper}>
            <ScrollView
              style={styles.suggestions}
              keyboardShouldPersistTaps="handled"
            >
              {/* Saved spots section */}
              {localMatches.map((spot) => (
                <TouchableOpacity
                  key={`saved-${spot.id}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSavedSpot(spot)}
                >
                  <Text style={styles.suggestionText}>{spot.name}</Text>
                  <Text style={styles.suggestionSubText}>Saved spot</Text>
                </TouchableOpacity>
              ))}

              {/* Google Places section */}
              {googleResults.map((prediction) => (
                <TouchableOpacity
                  key={`google-${prediction.place_id}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectGooglePlace(prediction)}
                >
                  <Text style={styles.suggestionText}>
                    {prediction.description}
                  </Text>
                  <Text style={styles.suggestionSubText}>Google place</Text>
                </TouchableOpacity>
              ))}

              {searching && (
                <View style={styles.suggestionItem}>
                  <Text style={styles.searchingText}>Searching…</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.addPinButton}
          onPress={handleStartNewSpot}
        >
          <Text style={styles.addPinText}>📍 Add Date Spot</Text>
        </TouchableOpacity>
      </View>

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
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          console.log("Map pressed at:", latitude, longitude);
        }}
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

        {newSpotCoords && (
          <Marker
            coordinate={newSpotCoords}
            draggable
            pinColor="red"
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              console.log("Pin dropped at:", latitude, longitude);
              setNewSpotCoords({ latitude, longitude });
            }}
          />
        )}
      </MapView>

      {/* Bottom sheet for new spot details */}
      {newSpotCoords && (
        <NewSpotSheet
          name={newSpotName}
          atmosphere={newAtmosphere}
          dateScore={newDateScore}
          onChangeName={setNewSpotName}
          onChangeAtmosphere={setNewAtmosphere}
          onChangeDateScore={setNewDateScore}
          onCancel={handleCancelNewSpot}
          onSave={handleSaveNewSpot}
        />
      )}
    </View>
  );
}
