import React from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Callout, Marker, Region, type MarkerPressEvent } from "react-native-maps";
import type { MapSpot } from "../../../services/api/spots";
import { GREY_MAP_STYLE } from "../constants";
import { AvatarMarker } from "./AvatarMarker";

/* ─── popup positioning constants ─── */
const POPUP_WIDTH = 280;
const MARKER_RADIUS = 21; // matches shell height/2 in AvatarMarker
const POPUP_GAP = 18;
const POPUP_TAIL_SIZE = 12;
const POPUP_TAIL_EDGE_INSET = 12;

function latToMercatorY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

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
  const [popupAnchorPoint, setPopupAnchorPoint] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const [gestureLock, setGestureLock] = React.useState(false);
  const popupAnim = React.useRef(new Animated.Value(0)).current;
  // Prevent the map's onPress from immediately dismissing a just-opened popup.
  // On Android, tapping a marker fires both the marker's onPress and the map's onPress.
  const justOpenedRef = React.useRef(false);
  const isClosingPopupRef = React.useRef(false);
  const gestureLockTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the rendered container size for accurate popup positioning.
  const windowDims = Dimensions.get("window");
  const [containerSize, setContainerSize] = React.useState({
    width: windowDims.width,
    height: windowDims.height,
  });
  const regionRef = React.useRef(region);

  const projectSpotAnchorFromRegion = React.useCallback(
    (spot: MapSpot, nextRegion: Region): { x: number; y: number } => {
      const width = containerSize.width || 1;
      const height = containerSize.height || 1;

      const west = nextRegion.longitude - nextRegion.longitudeDelta / 2;
      const x = ((spot.longitude - west) / nextRegion.longitudeDelta) * width;

      const north = nextRegion.latitude + nextRegion.latitudeDelta / 2;
      const south = nextRegion.latitude - nextRegion.latitudeDelta / 2;
      const mercNorth = latToMercatorY(north);
      const mercSouth = latToMercatorY(south);
      const mercSpot = latToMercatorY(spot.latitude);
      const mercSpan = mercNorth - mercSouth;
      const y = mercSpan === 0 ? height / 2 : ((mercNorth - mercSpot) / mercSpan) * height;

      return {
        x: Number.isFinite(x) ? x : width / 2,
        y: Number.isFinite(y) ? y : height / 2,
      };
    },
    [containerSize.height, containerSize.width]
  );

  const handleMarkerPress = React.useCallback(
    (spot: MapSpot, _event: MarkerPressEvent) => {
      if (gestureLockTimerRef.current) {
        clearTimeout(gestureLockTimerRef.current);
      }
      setGestureLock(true);
      gestureLockTimerRef.current = setTimeout(() => {
        setGestureLock(false);
        gestureLockTimerRef.current = null;
      }, 120);

      isClosingPopupRef.current = false;
      popupAnim.stopAnimation();
      justOpenedRef.current = true;
      setActivePopup({ spot });
      setPopupAnchorPoint(projectSpotAnchorFromRegion(spot, regionRef.current));
      // Reset after the map's onPress has had a chance to fire
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 100);
    },
    [popupAnim, projectSpotAnchorFromRegion]
  );

  const dismissPopup = React.useCallback(() => {
    if (justOpenedRef.current) return;
    isClosingPopupRef.current = false;
    setActivePopup(null);
    setPopupAnchorPoint(null);
  }, []);

  const dismissPopupWithFade = React.useCallback(() => {
    if (justOpenedRef.current || !activePopup || isClosingPopupRef.current) return;
    isClosingPopupRef.current = true;
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 130,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      isClosingPopupRef.current = false;
      if (!finished) return;
      setActivePopup(null);
      setPopupAnchorPoint(null);
    });
  }, [activePopup, popupAnim]);

  React.useEffect(() => {
    if (!activePopup) return;

    popupAnim.setValue(0);
    Animated.timing(popupAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activePopup, popupAnim]);

  React.useEffect(() => {
    return () => {
      if (gestureLockTimerRef.current) {
        clearTimeout(gestureLockTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    regionRef.current = region;
    if (!activePopup) return;
    setPopupAnchorPoint(projectSpotAnchorFromRegion(activePopup.spot, region));
  }, [activePopup, projectSpotAnchorFromRegion, region]);

  React.useEffect(() => {
    if (!activePopup) return;
    setPopupAnchorPoint(projectSpotAnchorFromRegion(activePopup.spot, regionRef.current));
  }, [activePopup, containerSize, projectSpotAnchorFromRegion]);

  // Compute popup position: centered on the marker, appearing above it.
  const popupStyle = React.useMemo(() => {
    if (!activePopup || !popupAnchorPoint) return null;
    const { x: anchorX, y: anchorY } = popupAnchorPoint;
    const left = Math.min(
      Math.max(8, anchorX - POPUP_WIDTH / 2),
      containerSize.width - POPUP_WIDTH - 8
    );
    // `bottom` measured from the container's bottom edge so the popup sits above the marker.
    const bottom = containerSize.height - anchorY + MARKER_RADIUS + POPUP_GAP;
    return { left, bottom, width: POPUP_WIDTH };
  }, [activePopup, containerSize, popupAnchorPoint]);

  const popupTailStyle = React.useMemo(() => {
    if (!popupStyle || !popupAnchorPoint) return null;
    const markerXWithinPopup = popupAnchorPoint.x - popupStyle.left;
    const left = Math.min(
      Math.max(POPUP_TAIL_EDGE_INSET, markerXWithinPopup - POPUP_TAIL_SIZE / 2),
      POPUP_WIDTH - POPUP_TAIL_SIZE - POPUP_TAIL_EDGE_INSET
    );
    return { marginLeft: left };
  }, [popupAnchorPoint, popupStyle]);

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
        moveOnMarkerPress={false}
        zoomEnabled={!gestureLock}
        pitchEnabled={!gestureLock}
        rotateEnabled={!gestureLock}
        onPanDrag={dismissPopupWithFade}
        onRegionChange={(nextRegion) => {
          regionRef.current = nextRegion;
          if (!activePopup) return;
          setPopupAnchorPoint(projectSpotAnchorFromRegion(activePopup.spot, nextRegion));
        }}
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
        <Animated.View
          style={[
            s.popupAnchor,
            popupStyle,
            {
              opacity: popupAnim,
              transform: [
                { translateY: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                { scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <SpotPopup spot={activePopup.spot} />
          <View style={[s.popupTail, popupTailStyle]} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  /* ── popup overlay ── */
  popupAnchor: {
    position: "absolute",
    alignItems: "center",
    // left, bottom, width set dynamically
  },
  popupCard: {
    width: "100%",
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
  popupTail: {
    width: POPUP_TAIL_SIZE,
    height: POPUP_TAIL_SIZE,
    alignSelf: "flex-start",
    marginTop: -1,
    transform: [{ rotate: "45deg" }],
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: "#e8e8e8",
    borderBottomColor: "#e8e8e8",
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
