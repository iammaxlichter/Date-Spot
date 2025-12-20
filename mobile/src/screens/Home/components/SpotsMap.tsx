// src/screens/components/SpotsMap.tsx
import React from "react";
import { Keyboard } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import type { Place } from "../../../lib/api/places";
import { GREY_MAP_STYLE } from "../constants";

export function SpotsMap(props: {
  mapRef: React.RefObject<MapView | null>;
  region: Region;
  onRegionChangeComplete: (r: Region) => void;
  spots: Place[];
  isPlacingPin: boolean;
  newSpotCoords: { latitude: number; longitude: number } | null;
  onDragEnd: (coords: { latitude: number; longitude: number }) => void;
  onPressMap: () => void;
}) {
  const {
    mapRef,
    region,
    onRegionChangeComplete,
    spots,
    isPlacingPin,
    newSpotCoords,
    onDragEnd,
    onPressMap,
  } = props;

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={region}
      onRegionChangeComplete={onRegionChangeComplete}
      customMapStyle={isPlacingPin ? GREY_MAP_STYLE : []}
      onPress={() => {
        Keyboard.dismiss();
        onPressMap();
      }}
    >
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
          title={spot.name}
          description={
            spot.date_score || spot.atmosphere
              ? `Atmosphere: ${spot.atmosphere ?? "—"} · Date: ${spot.date_score ?? "—"}`
              : "No ratings yet"
          }
        />
      ))}

      {isPlacingPin && newSpotCoords && (
        <Marker
          coordinate={newSpotCoords}
          draggable
          pinColor="red"
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            onDragEnd({ latitude, longitude });
          }}
        />
      )}
    </MapView>
  );
}
