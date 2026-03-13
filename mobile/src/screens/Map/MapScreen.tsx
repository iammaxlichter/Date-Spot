// src/screens/Map/MapScreen.tsx
import React, { useRef, useEffect, useCallback } from "react";
import { View, ActivityIndicator, Alert, Text, Keyboard, Image } from "react-native";
import MapView from "react-native-maps";

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

import type { MapSpot } from "../../services/api/spots";
import { getFollowedMapSpots } from "../../services/api/spots";
import type { SpotPhotoItem } from "../../types/spotPhotos";
import { supabase } from "../../services/supabase/client";
import { fetchEligibleTagUsers, type TaggedUser } from "../../services/api/spotTags";
import { getActivePartner } from "../../services/api/partnerships";
import {
  applySpotFilters,
  getActiveSpotFilterCount,
  hasActiveSpotFilters,
} from "../../utils/filters";
import { useSpotFiltersStore } from "../../stores/spotFiltersStore";
import {
  type PartnerAnswer,
  withPartnerTag,
  withoutPartnerTag,
} from "../../features/tags/partnerTagging";

function isUserOnSpot(spot: MapSpot, userId: string): boolean {
  if (spot.user_id === userId) return true;
  return (spot.tagged_users ?? []).some((user) => user.id === userId);
}

export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView | null>(null);
  const searchAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setIsCreatingSpot } = useSpotCreationContext();
  const [photos, setPhotos] = React.useState<SpotPhotoItem[]>([]);
  const [selectedTaggedUsers, setSelectedTaggedUsers] = React.useState<TaggedUser[]>([]);
  const [eligibleTagUsers, setEligibleTagUsers] = React.useState<TaggedUser[]>([]);
  const [tagUsersLoading, setTagUsersLoading] = React.useState(false);
  const [activePartner, setActivePartner] = React.useState<TaggedUser | null>(null);
  const [partnerAnswer, setPartnerAnswer] = React.useState<PartnerAnswer>(null);
  const [viewerUserId, setViewerUserId] = React.useState<string | null>(null);
  const [mapPartnerId, setMapPartnerId] = React.useState<string | null>(null);
  const [showPartnerOnly, setShowPartnerOnly] = React.useState(false);
  const [savingPin, setSavingPin] = React.useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      // when MapScreen loses focus (back nav, switching stacks, etc.)
      return () => {
        setIsCreatingSpot(false);
      };
    }, [setIsCreatingSpot])
  );

  const filters = useSpotFiltersStore((state) => state.filters);
  const { region, setRegion, loading, permissionDenied, spots, setSpots } =
    useInitialRegionAndSpots(filters);
  const filteredSpots = React.useMemo(() => applySpotFilters(spots, filters), [spots, filters]);
  const hasPartnerForMap = React.useMemo(
    () => Boolean(viewerUserId && mapPartnerId),
    [viewerUserId, mapPartnerId]
  );
  const visibleSpots = React.useMemo(() => {
    if (!showPartnerOnly || !viewerUserId || !mapPartnerId) return filteredSpots;
    return filteredSpots.filter(
      (spot) => isUserOnSpot(spot, viewerUserId) || isUserOnSpot(spot, mapPartnerId)
    );
  }, [filteredSpots, showPartnerOnly, viewerUserId, mapPartnerId]);
  const activeFilterCount = React.useMemo(() => getActiveSpotFilterCount(filters), [filters]);
  const hasActiveFilters = React.useMemo(() => hasActiveSpotFilters(filters), [filters]);

  const { searchQuery, setSearchQuery, showSuggestions, setShowSuggestions, localMatches } =
    useSpotSearch(visibleSpots);

  const { googleResults, searching, clearGoogleResults } = usePlacesAutocomplete({
    region,
    searchQuery,
    showSuggestions,
  });

  useEffect(() => {
    const urls = Array.from(
      new Set(
        visibleSpots
          .map((spot) => spot.author.avatar_url)
          .filter((url): url is string => Boolean(url))
      )
    ).slice(0, 120);

    if (urls.length === 0) return;
    void Promise.allSettled(urls.map((url) => Image.prefetch(url)));
  }, [visibleSpots]);

  const refreshSpots = useCallback(async () => {
    const data = await getFollowedMapSpots(500, filters);
    setSpots(data);
  }, [filters, setSpots]);

  useFocusEffect(
    useCallback(() => {
      void refreshSpots().catch((err) => {
        console.error(err);
        Alert.alert("Error", "Failed to load date spots.");
      });
    }, [refreshSpots])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadMapPartnerContext = async () => {
        try {
          const { data: auth, error } = await supabase.auth.getUser();
          if (error) throw error;
          const myId = auth.user?.id ?? null;
          if (!cancelled) setViewerUserId(myId);

          if (!myId) {
            if (!cancelled) setMapPartnerId(null);
            return;
          }

          const partner = await getActivePartner(myId);
          if (!cancelled) setMapPartnerId(partner?.id ?? null);
        } catch (e) {
          console.error("[map] failed to load partner context:", e);
          if (!cancelled) {
            setViewerUserId(null);
            setMapPartnerId(null);
          }
        }
      };

      void loadMapPartnerContext();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (!hasPartnerForMap) {
      setShowPartnerOnly(false);
    }
  }, [hasPartnerForMap]);

  const spotCreation = useSpotCreation({
    onSavingStarted: (coords, name) => {
      setSavingPin({ latitude: coords.latitude, longitude: coords.longitude, name });
    },
    onSaved: async () => {
      try {
        await refreshSpots();
      } catch (err) {
        console.error(err);
      } finally {
        setSavingPin(null);
      }
    },
    onSaveFailed: () => {
      setSavingPin(null);
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadEligibleUsers = async () => {
      if (!spotCreation.isPlacingPin && !spotCreation.showNewSpotSheet) return;
      try {
        setTagUsersLoading(true);
        const { data: auth, error } = await supabase.auth.getUser();
        if (error) throw error;
        const myId = auth.user?.id;
        if (!myId) return;

        const [partner, users] = await Promise.all([
          getActivePartner(myId),
          fetchEligibleTagUsers(myId),
        ]);
        if (!cancelled) setEligibleTagUsers(users);
        if (!cancelled) setActivePartner(partner);
        if (!cancelled && !spotCreation.showNewSpotSheet) setPartnerAnswer(null);
      } catch (e) {
        console.error("[map] failed to load eligible tag users:", e);
        if (!cancelled) setEligibleTagUsers([]);
        if (!cancelled) setActivePartner(null);
      } finally {
        if (!cancelled) setTagUsersLoading(false);
      }
    };

    void loadEligibleUsers();

    return () => {
      cancelled = true;
    };
  }, [spotCreation.isPlacingPin, spotCreation.showNewSpotSheet]);

  // Update the context whenever spot creation state changes
  useEffect(() => {
    const isCreating = spotCreation.isPlacingPin || spotCreation.showNewSpotSheet;
    setIsCreatingSpot(isCreating);
  }, [spotCreation.isPlacingPin, spotCreation.showNewSpotSheet, setIsCreatingSpot]);

  useEffect(() => {
    return () => {
      if (searchAnimationTimerRef.current) {
        clearTimeout(searchAnimationTimerRef.current);
      }
    };
  }, []);

  const animateSearchSelection = useCallback(
    (latitude: number, longitude: number, zoom: { latitudeDelta: number; longitudeDelta: number }) => {
      const map = mapRef.current;
      if (!map || !region) {
        setRegion({ latitude, longitude, ...zoom });
        return;
      }

      if (searchAnimationTimerRef.current) {
        clearTimeout(searchAnimationTimerRef.current);
      }

      // Step 1: pan to the destination while keeping current zoom level.
      map.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        },
        450
      );

      // Step 2: gently zoom in after the pan starts.
      searchAnimationTimerRef.current = setTimeout(() => {
        map.animateToRegion(
          {
            latitude,
            longitude,
            ...zoom,
          },
          850
        );
        searchAnimationTimerRef.current = null;
      }, 220);
    },
    [region, setRegion]
  );

  const handleSelectSavedSpot = (spot: MapSpot) => {
    Keyboard.dismiss();
    animateSearchSelection(spot.latitude, spot.longitude, ZOOM_TO_SAVED_SPOT);
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
      const name = result.name || prediction.description;

      animateSearchSelection(latitude, longitude, ZOOM_TO_GOOGLE_PLACE);

      setSearchQuery(name);
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
        <ActivityIndicator size="large" color="#E21E4D" />
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
          onOpenFilters={() => {
            const parentNav = navigation.getParent();
            if (parentNav) {
              parentNav.navigate("Filters");
              return;
            }
            navigation.navigate("Filters");
          }}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          showPartnerSpotsToggle={hasPartnerForMap}
          partnerSpotsOnly={showPartnerOnly}
          onTogglePartnerSpots={() => setShowPartnerOnly((prev) => !prev)}
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
        spots={visibleSpots}
        isPlacingPin={spotCreation.isPlacingPin}
        newSpotCoords={spotCreation.newSpotCoords}
        onDragEnd={spotCreation.updateCoords}
        onPressMap={() => setShowSuggestions(false)}
        savingPin={savingPin}
        onPinRegionChange={spotCreation.updateCoords}
        onViewSpot={(spotId) => navigation.navigate("SpotDetails", { spotId })}
        onPoiPress={(coords) => {
          animateSearchSelection(coords.latitude, coords.longitude, ZOOM_TO_GOOGLE_PLACE);
          setShowSuggestions(false);
        }}
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
          selectedTaggedUsers={selectedTaggedUsers}
          eligibleTagUsers={eligibleTagUsers}
          tagUsersLoading={tagUsersLoading}
          debugLabel="(CREATE)"
          isSaving={spotCreation.isSaving}
          onChangeName={(v) => spotCreation.setField("name", v)}
          onChangeAtmosphere={(v) => spotCreation.setField("atmosphere", v)}
          onChangeDateScore={(v) => spotCreation.setField("dateScore", v)}
          onChangeNotes={(v) => spotCreation.setField("notes", v)}
          onChangeVibe={(v) => spotCreation.setField("vibe", v)}
          onChangePrice={(v) => spotCreation.setField("price", v)}
          onChangeBestFor={(v) => spotCreation.setField("bestFor", v)}
          onChangeWouldReturn={(v) => spotCreation.setField("wouldReturn", v)}
          onChangeTaggedUsers={setSelectedTaggedUsers}
          activePartner={activePartner}
          partnerAnswer={partnerAnswer}
          onChangePartnerAnswer={(answer) => {
            setPartnerAnswer(answer);
            if (answer === "yes") {
              setSelectedTaggedUsers((prev) => withPartnerTag(prev, activePartner));
              return;
            }
            if (answer === "no") {
              setSelectedTaggedUsers((prev) => withoutPartnerTag(prev, activePartner));
            }
          }}
          onCancel={() => {
            setPhotos([]);
            setSelectedTaggedUsers([]);
            setActivePartner(null);
            setPartnerAnswer(null);
            spotCreation.cancelNewSpot();
          }}
          onSave={() => {
            const localPhotos = photos.filter((p) => p.kind === "local");
            const tagIds = selectedTaggedUsers.map((u) => u.id);
            setPhotos([]);
            setSelectedTaggedUsers([]);
            setActivePartner(null);
            setPartnerAnswer(null);
            void spotCreation.saveNewSpot(localPhotos, tagIds);
          }}
        />
      )}
    </View>
  );
}
