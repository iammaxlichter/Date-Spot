// src/screens/Map/MapScreen.tsx
import React, { useRef, useEffect, useCallback } from "react";
import { View, ActivityIndicator, Alert, Text, Keyboard } from "react-native";
import MapView, { Region } from "react-native-maps";

import { useFocusEffect } from "@react-navigation/native";
import { NewSpotSheetScreen } from "../NewSpotSheet/NewSpotSheetScreen";

import { useInitialRegionAndSpots } from "./hooks/useInitialRegionAndSpots";
import { useSpotSearch } from "./hooks/useSpotSearch";
import { usePlacesAutocomplete } from "./hooks/usePlacesAutocomplete";
import { useSpotCreation } from "./hooks/useSpotCreation";
import { useSpotCreation as useSpotCreationContext } from "../../contexts/SpotCreationContext";

import { fetchPlaceDetails } from "../../services/google/places";
import { ZOOM_TO_GOOGLE_PLACE, ZOOM_TO_SAVED_SPOT } from "./constants";
import type { GooglePrediction } from "./types";

import { TopOverlay } from "./components/TopOverlay";
import { PinPlacementOverlay } from "./components/PinPlacementOverlay";
import { SpotsMap } from "./components/SpotsMap";

import type { Spot } from "../../services/api/spots";
import { getNearbySpots } from "../../services/api/spots";
import type { SpotPhotoItem } from "../../types/spotPhotos";


export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView | null>(null);
  const { setIsCreatingSpot } = useSpotCreationContext();
  const [photos, setPhotos] = React.useState<SpotPhotoItem[]>([]);


  useFocusEffect(
    useCallback(() => {
      // when MapScreen loses focus (back nav, switching stacks, etc.)
      return () => {
        setIsCreatingSpot(false);
      };
    }, [setIsCreatingSpot])
  );


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

  const refreshSpots = async () => {
    if (!region) return;
    const data = await getNearbySpots(region.latitude, region.longitude, 10);
    setSpots(data);
  };

  const spotCreation = useSpotCreation({
    onSaved: async () => {
      try {
        await refreshSpots();
      } catch (err) {
        console.error(err);
      }
    },
  });

  // ✅ Update the context whenever spot creation state changes
  useEffect(() => {
    const isCreating = spotCreation.isPlacingPin || spotCreation.showNewSpotSheet;
    setIsCreatingSpot(isCreating);
  }, [spotCreation.isPlacingPin, spotCreation.showNewSpotSheet, setIsCreatingSpot]);

  const handleSelectSavedSpot = (spot: Spot) => {
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
  };

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
        <NewSpotSheetScreen
          name={spotCreation.draft.name}
          atmosphere={spotCreation.draft.atmosphere}
          dateScore={spotCreation.draft.dateScore}
          notes={spotCreation.draft.notes}
          vibe={spotCreation.draft.vibe}
          price={spotCreation.draft.price}
          bestFor={spotCreation.draft.bestFor}
          wouldReturn={spotCreation.draft.wouldReturn}
          photos={photos}
          setPhotos={setPhotos}
          debugLabel="(CREATE)"
          onChangeName={(v) => spotCreation.setField("name", v)}
          onChangeAtmosphere={(v) => spotCreation.setField("atmosphere", v)}
          onChangeDateScore={(v) => spotCreation.setField("dateScore", v)}
          onChangeNotes={(v) => spotCreation.setField("notes", v)}
          onChangeVibe={(v) => spotCreation.setField("vibe", v)}
          onChangePrice={(v) => spotCreation.setField("price", v)}
          onChangeBestFor={(v) => spotCreation.setField("bestFor", v)}
          onChangeWouldReturn={(v) => spotCreation.setField("wouldReturn", v)}
          onCancel={() => {
            setPhotos([]);
            spotCreation.cancelNewSpot();
          }}
          onSave={async () => {
            await spotCreation.saveNewSpot(photos.filter((p) => p.kind === "local"));
            setPhotos([]);
          }}
        />
      )}
    </View>
  );
}