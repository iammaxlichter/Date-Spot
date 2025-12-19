// src/screens/HomeScreen.tsx (UPDATED)
import React, { useRef } from "react";
import { View, ActivityIndicator, Alert, Text, Keyboard } from "react-native";
import MapView, { Region } from "react-native-maps";
import { styles } from "../styles";
import { clearToken } from "../../lib/api/session";
import { NewSpotSheet } from "../NewSpotSheet";

import { useInitialRegionAndSpots } from "./hooks/useInitialRegionAndSpots";
import { useSpotSearch } from "./hooks/useSpotSearch";
import { usePlacesAutocomplete } from "./hooks/usePlacesAutocomplete";
import { useSpotCreation } from "./hooks/useSpotCreation";

import { fetchPlaceDetails } from "../../lib/google/places";
import { ZOOM_TO_GOOGLE_PLACE, ZOOM_TO_SAVED_SPOT } from "./constants";
import type { GooglePrediction } from "./types";

import { TopOverlay } from "./components/TopOverlay";
import { PinPlacementOverlay } from "./components/PinPlacementOverlay";
import { SpotsMap } from "./components/SpotsMap";
import type { Place } from "../../lib/api/places";

export default function HomeScreen({ navigation }: any) {
  const mapRef = useRef<MapView | null>(null);

  const { region, setRegion, loading, permissionDenied, spots, setSpots } =
    useInitialRegionAndSpots();

  const {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    setShowSuggestions,
    localMatches,
  } = useSpotSearch(spots);

  const { googleResults, searching, clearGoogleResults } = usePlacesAutocomplete({
    region,
    searchQuery,
    showSuggestions,
  });

  const spotCreation = useSpotCreation({
    onSaved: (place) => setSpots((prev) => [...prev, place]),
  });

  const handleSelectSavedSpot = (spot: Place) => {
    Keyboard.dismiss();

    const targetRegion: Region = {
      latitude: spot.latitude,
      longitude: spot.longitude,
      ...ZOOM_TO_SAVED_SPOT,
    };

    setRegion(targetRegion);
    mapRef.current?.animateToRegion(targetRegion, 250);

    setSearchQuery(spot.name);
    setShowSuggestions(false);
    clearGoogleResults();
  };

  const handleSelectGooglePlace = async (prediction: GooglePrediction) => {
    if (!region) return;

    try {
      const json = await fetchPlaceDetails(prediction.place_id);
      const result = json.result;

      if (!result?.geometry?.location) {
        throw new Error("No geometry in place details");
      }

      const latitude = result.geometry.location.lat;
      const longitude = result.geometry.location.lng;

      const targetRegion: Region = {
        latitude,
        longitude,
        ...ZOOM_TO_GOOGLE_PLACE,
      };

      setRegion(targetRegion);
      mapRef.current?.animateToRegion(targetRegion, 500);

      setSearchQuery(result.name || prediction.description);
      setShowSuggestions(false);
      clearGoogleResults();
      Keyboard.dismiss();
    } catch (err) {
      console.error("Place details error", err);
      Alert.alert("Error", "Failed to load place details from Google.");
    }
  };

  if (loading || !region) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading map…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {!spotCreation.isPlacingPin && (
        <TopOverlay
          searchQuery={searchQuery}
          onChangeSearch={(text) => {
            setSearchQuery(text);
            setShowSuggestions(text.length > 0);
          }}
          onSubmitSearch={() => {
            setShowSuggestions(false);
          }}
          showSuggestions={showSuggestions}
          localMatches={localMatches}
          googleResults={googleResults}
          searching={searching}
          onSelectSaved={handleSelectSavedSpot}
          onSelectGoogle={handleSelectGooglePlace}
          onLogout={async () => {
            await clearToken();
            Alert.alert("Logged out", "Token cleared. Please log in again.");
            navigation.replace("Login");
          }}
          onAddSpot={() => spotCreation.startNewSpot(region)}
        />
      )}

      <PinPlacementOverlay
        visible={spotCreation.isPlacingPin}
        onCancel={spotCreation.cancelNewSpot}
        onNext={spotCreation.goToDetails}
      />

      {permissionDenied && (
        <View style={{ padding: 8, backgroundColor: "#fee" }}>
          <Text>Location permission denied. Showing a default area instead.</Text>
        </View>
      )}

      <SpotsMap
        mapRef={mapRef}
        region={region}
        onRegionChangeComplete={setRegion}
        spots={spots}
        isPlacingPin={spotCreation.isPlacingPin}
        newSpotCoords={spotCreation.newSpotCoords}
        onDragEnd={spotCreation.updateCoords}
        onPressMap={() => setShowSuggestions(false)}
      />

      {spotCreation.showNewSpotSheet && spotCreation.newSpotCoords && (
        <NewSpotSheet
          name={spotCreation.draft.name}
          atmosphere={spotCreation.draft.atmosphere}
          dateScore={spotCreation.draft.dateScore}
          notes={spotCreation.draft.notes}
          vibe={spotCreation.draft.vibe}
          price={spotCreation.draft.price}
          bestFor={spotCreation.draft.bestFor}
          wouldReturn={spotCreation.draft.wouldReturn}
          onChangeName={(v) => spotCreation.setField("name", v)}
          onChangeAtmosphere={(v) => spotCreation.setField("atmosphere", v)}
          onChangeDateScore={(v) => spotCreation.setField("dateScore", v)}
          onChangeNotes={(v) => spotCreation.setField("notes", v)}
          onChangeVibe={(v) => spotCreation.setField("vibe", v)}
          onChangePrice={(v) => spotCreation.setField("price", v)}
          onChangeBestFor={(v) => spotCreation.setField("bestFor", v)}
          onChangeWouldReturn={(v) => spotCreation.setField("wouldReturn", v)}
          onCancel={spotCreation.cancelNewSpot}
          onSave={spotCreation.saveNewSpot}
        />
      )}
    </View>
  );
}
