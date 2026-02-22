import React from "react";
import { Keyboard } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import type { MapSpot } from "../../../services/api/spots";
import { GREY_MAP_STYLE } from "../constants";
import { AvatarMarker } from "./AvatarMarker";

export function SpotsMap(props: {
  mapRef: React.RefObject<MapView | null>;
  region: Region;
  onRegionChangeComplete: (r: Region) => void;
  spots: MapSpot[];
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
        <AvatarMarker key={spot.id} spot={spot} />
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
