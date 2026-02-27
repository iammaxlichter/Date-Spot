import React from "react";
import { Dimensions, Keyboard, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import MapView, { Callout, Marker, Region, type MarkerPressEvent } from "react-native-maps";
import type { MapSpot } from "../../../services/api/spots";
import { GREY_MAP_STYLE } from "../constants";
import { AvatarMarker } from "./AvatarMarker";

/* ─── popup positioning constants ─── */
const POPUP_WIDTH = 280;
const MARKER_RADIUS = 21; // matches shell height/2 in AvatarMarker
const POPUP_GAP = 8;

/* ─── build the one-line summary shown at the top of the popup ─── */
function buildPopupHeader(spot: MapSpot): string {
  const spotName = (spot.name ?? "").trim() || "Date Spot";
  const authorName = (spot.author.name ?? "").trim() || (spot.author.username ?? "").trim();
  const tagged = (spot.tagged_users ?? [])
    .map((u) => (u.name ?? "").trim() || (u.username ?? "").trim())
    .filter(Boolean);
  const firstThree = tagged.slice(0, 3);
  const overflow = tagged.length - firstThree.length;
  const companions = firstThree.length
    ? firstThree.join(", ") + (overflow > 0 ? ` +${overflow}` : "")
    : "";

  if (authorName && companions) return `${authorName} went with ${companions} to ${spotName}`;
  if (authorName) return `${authorName} went to ${spotName}`;
  if (companions) return `Went with ${companions} to ${spotName}`;
  return spotName;
}

/* ─── the popup card rendered as a plain JS overlay ─── */
function SpotPopup({ spot }: { spot: MapSpot }) {
  const headerLine = buildPopupHeader(spot);
  const hasRatings =
    spot.atmosphere != null || spot.date_score != null || spot.would_return != null;
  const hasDetails = spot.vibe || spot.price || spot.best_for;
  const notes = (spot.notes ?? "").trim();

  return (
    <View style={s.popupCard}>
      <Text style={s.popupHeader} numberOfLines={3} ellipsizeMode="tail">
        {headerLine}
      </Text>

      {hasRatings ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ratings</Text>
          {spot.atmosphere != null ? (
            <View style={s.row}>
              <Text style={s.k}>Atmosphere</Text>
              <Text style={s.v}>{spot.atmosphere}</Text>
            </View>
          ) : null}
          {spot.date_score != null ? (
            <View style={s.row}>
              <Text style={s.k}>Date score</Text>
              <Text style={s.v}>{spot.date_score}</Text>
            </View>
          ) : null}
          {spot.would_return != null ? (
            <View style={s.row}>
              <Text style={s.k}>Would return</Text>
              <Text style={s.v}>{spot.would_return ? "Yes" : "No"}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {hasDetails ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Details</Text>
          <View style={s.pillRow}>
            {spot.vibe ? <Text style={s.pill}>{spot.vibe}</Text> : null}
            {spot.price ? <Text style={s.pill}>{spot.price}</Text> : null}
            {spot.best_for ? <Text style={s.pill}>{spot.best_for}</Text> : null}
          </View>
        </View>
      ) : null}

      {notes ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notes</Text>
          <Text style={s.notes} numberOfLines={4} ellipsizeMode="tail">
            {notes}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* ─── main component ─── */
type ActivePopup = {
  spot: MapSpot;
  anchorX: number;
  anchorY: number;
};

export function SpotsMap(props: {
  mapRef: React.RefObject<MapView | null>;
  region: Region;
  onRegionChangeComplete: (r: Region) => void;
  spots: MapSpot[];
  isPlacingPin: boolean;
  newSpotCoords: { latitude: number; longitude: number } | null;
  onDragEnd: (coords: { latitude: number; longitude: number }) => void;
  onPressMap: () => void;
  savingPin?: { latitude: number; longitude: number; name: string } | null;
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
    savingPin,
  } = props;

  const [activePopup, setActivePopup] = React.useState<ActivePopup | null>(null);
  // Prevent the map's onPress from immediately dismissing a just-opened popup.
  // On Android, tapping a marker fires both the marker's onPress and the map's onPress.
  const justOpenedRef = React.useRef(false);

  // Track the rendered container size for accurate popup positioning.
  const windowDims = Dimensions.get("window");
  const [containerSize, setContainerSize] = React.useState({
    width: windowDims.width,
    height: windowDims.height,
  });

  const handleMarkerPress = React.useCallback(
    (spot: MapSpot, event: MarkerPressEvent) => {
      justOpenedRef.current = true;
      setActivePopup({
        spot,
        anchorX: event.nativeEvent.position.x,
        anchorY: event.nativeEvent.position.y,
      });
      // Reset after the map's onPress has had a chance to fire
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 100);
    },
    []
  );

  const dismissPopup = React.useCallback(() => {
    if (justOpenedRef.current) return;
    setActivePopup(null);
  }, []);

  // Compute popup position: centered on the marker, appearing above it.
  const popupStyle = React.useMemo(() => {
    if (!activePopup) return null;
    const { anchorX, anchorY } = activePopup;
    const left = Math.min(
      Math.max(8, anchorX - POPUP_WIDTH / 2),
      containerSize.width - POPUP_WIDTH - 8
    );
    // `bottom` measured from the container's bottom edge so the popup sits above the marker.
    const bottom = containerSize.height - anchorY + MARKER_RADIUS + POPUP_GAP;
    return { left, bottom, width: POPUP_WIDTH };
  }, [activePopup, containerSize]);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) =>
        setContainerSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={isPlacingPin ? GREY_MAP_STYLE : []}
        onPress={() => {
          dismissPopup();
          Keyboard.dismiss();
          onPressMap();
        }}
      >
        {spots.map((spot) => (
          <AvatarMarker
            key={spot.id}
            spot={spot}
            onPress={handleMarkerPress}
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

        {savingPin && (
          <Marker
            coordinate={{ latitude: savingPin.latitude, longitude: savingPin.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={s.savingShell}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
            <Callout tooltip>
              <View style={s.savingCallout}>
                <ActivityIndicator size="small" color="#007bff" style={{ marginRight: 6 }} />
                <Text style={s.savingCalloutText}>Saving "{savingPin.name}"…</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* JS overlay popup — dismissed instantly by setState, no native animation */}
      {activePopup && popupStyle ? (
        <View style={[s.popupAnchor, popupStyle]} pointerEvents="box-none">
          <SpotPopup spot={activePopup.spot} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  /* ── popup overlay ── */
  popupAnchor: {
    position: "absolute",
    // left, bottom, width set dynamically
  },
  popupCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    backgroundColor: "#fff",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  popupHeader: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#111",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "800",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 2,
  },
  k: {
    fontSize: 12,
    color: "#666",
  },
  v: {
    fontSize: 12,
    color: "#111",
    fontWeight: "700",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#fafafa",
    color: "#111",
    fontSize: 12,
  },
  notes: {
    fontSize: 12,
    color: "#222",
    lineHeight: 18,
  },

  /* ── saving pin ── */
  savingShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  savingCallout: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 220,
  },
  savingCalloutText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    flexShrink: 1,
  },
});
