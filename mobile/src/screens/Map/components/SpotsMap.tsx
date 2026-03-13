import React from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region, type MarkerPressEvent } from "react-native-maps";
import type { MapSpot } from "../../../services/api/spots";
import { supabase } from "../../../services/supabase/client";
import { GREY_MAP_STYLE } from "../constants";
import { AvatarMarker } from "./AvatarMarker";
import { CenterPin } from "./CenterPin";

const DEFAULT_AVATAR = require("../../../../assets/default-avatar.png");

/* popup positioning constants */
const POPUP_WIDTH = 290;
const MARKER_RADIUS = 21; // matches shell height/2 in AvatarMarker
const POPUP_GAP = 18;
const POPUP_TAIL_SIZE = 12;
const POPUP_TAIL_EDGE_INSET = 12;

function latToMercatorY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

/* the popup card rendered as a plain JS overlay */
function SpotPopup({ spot, onView }: { spot: MapSpot; onView: () => void }) {
  const [photoUrls, setPhotoUrls] = React.useState<string[]>([]);
  const [photoLoading, setPhotoLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setPhotoUrls([]);
    setPhotoLoading(false);

    (async () => {
      try {
        const { data } = await supabase
          .from("spot_photos")
          .select("path")
          .eq("spot_id", spot.id)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(2);

        if (cancelled) return;
        const paths = (data ?? []).map((r: any) => r.path as string).filter(Boolean);
        if (paths.length === 0) return; // no photos — strip stays hidden

        setPhotoLoading(true); // only show spinner once we know photos exist

        const { data: signed } = await supabase.storage
          .from("spot-photos")
          .createSignedUrls(paths, 3600);

        if (!cancelled) {
          setPhotoUrls((signed ?? []).map((item: any) => item?.signedUrl).filter(Boolean));
          setPhotoLoading(false);
        }
      } catch {
        if (!cancelled) setPhotoLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [spot.id]);

  const spotName = (spot.name ?? "").trim() || "Date Spot";
  const authorName =
    (spot.author.name ?? "").trim() ||
    (spot.author.username ? `@${spot.author.username}` : "Someone");

  const tagged = (spot.tagged_users ?? [])
    .map((u) => (u.name ?? "").trim() || (u.username ?? "").trim())
    .filter(Boolean);
  const companionText =
    tagged.length === 1
      ? `with ${tagged[0]}`
      : tagged.length === 2
      ? `with ${tagged[0]} & ${tagged[1]}`
      : tagged.length > 2
      ? `with ${tagged[0]} +${tagged.length - 1}`
      : null;

  const notes = (spot.notes ?? "").trim();
  const hasScores =
    spot.date_score != null || spot.atmosphere != null || spot.would_return != null;
  const hasTags = spot.vibe || spot.price || spot.best_for;

  return (
    <View style={s.popupCard} pointerEvents="box-none">
      {/* All non-interactive content — passes touches through to the map */}
      <View pointerEvents="none">
        {/* Photo strip */}
        {(photoLoading || photoUrls.length > 0) ? (
          <View style={[s.photoStrip, photoLoading && s.photoStripLoading]}>
            {photoLoading ? (
              <ActivityIndicator size="small" color="#E21E4D" />
            ) : (
              <View style={s.photoStripContent}>
                {photoUrls.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={s.photoThumb} resizeMode="cover" />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Author row */}
        <View style={s.popupAuthorRow}>
          <Image
            source={
              spot.author.avatar_url ? { uri: spot.author.avatar_url } : DEFAULT_AVATAR
            }
            style={s.popupAvatar}
          />
          <View style={s.popupAuthorInfo}>
            <Text style={s.popupAuthorName} numberOfLines={1}>
              {authorName}
            </Text>
            {companionText ? (
              <Text style={s.popupCompanion} numberOfLines={1}>
                {companionText}
              </Text>
            ) : null}
          </View>
          {/* spacer so author text doesn't overlap the absolutely-positioned button */}
          <View style={s.viewBtnSpacer} />
        </View>

        {/* Spot name */}
        <Text style={s.popupSpotName} numberOfLines={2} ellipsizeMode="tail">
          {spotName}
        </Text>

        {/* Score chips */}
        {hasScores ? (
          <View style={s.popupScoreRow}>
            {spot.date_score != null ? (
              <View style={s.chipDate}>
                <Text style={s.chipDateText}>★ Date Score: {spot.date_score}/10</Text>
              </View>
            ) : null}
            {spot.atmosphere != null ? (
              <View style={s.chipAtmo}>
                <Text style={s.chipAtmoText}>✦ Atmosphere: {spot.atmosphere}/10</Text>
              </View>
            ) : null}
            {spot.would_return != null ? (
              <View style={[s.chipReturn, spot.would_return ? s.chipReturnYes : s.chipReturnNo]}>
                <Text style={[s.chipReturnText, spot.would_return ? s.chipReturnYesText : s.chipReturnNoText]}>
                  {spot.would_return ? "Return!" : "✕ Skip"}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Tag pills */}
        {hasTags ? (
          <View style={s.popupPillRow}>
            {spot.vibe ? <Text style={s.popupPill}>{spot.vibe}</Text> : null}
            {spot.price ? <Text style={s.popupPill}>{spot.price}</Text> : null}
            {spot.best_for ? <Text style={s.popupPill}>{spot.best_for}</Text> : null}
          </View>
        ) : null}

        {/* Notes */}
        {notes ? (
          <Text style={s.popupNotes} numberOfLines={2} ellipsizeMode="tail">
            "{notes}"
          </Text>
        ) : null}
      </View>

      {/* View button — only interactive element, absolutely positioned */}
      <TouchableOpacity style={s.viewBtn} onPress={onView} activeOpacity={0.75}>
        <Text style={s.viewBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

/* main component */
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
  onPoiPress?: (coords: { latitude: number; longitude: number }) => void;
  onPinRegionChange?: (coords: { latitude: number; longitude: number }) => void;
  onViewSpot?: (spotId: string) => void;
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
    onPoiPress,
    onPinRegionChange,
    onViewSpot,
  } = props;

  const [mapDragging, setMapDragging] = React.useState(false);

  // Only update after pan ends so the spots array doesn't thrash on every frame
  const [stableRegion, setStableRegion] = React.useState(region);
  const renderedSpots = React.useMemo(() => {
    const PAD = 1.8;
    const latBuf = (stableRegion.latitudeDelta / 2) * PAD;
    const lngBuf = (stableRegion.longitudeDelta / 2) * PAD;
    return spots.filter(
      (s) =>
        s.latitude  >= stableRegion.latitude  - latBuf &&
        s.latitude  <= stableRegion.latitude  + latBuf &&
        s.longitude >= stableRegion.longitude - lngBuf &&
        s.longitude <= stableRegion.longitude + lngBuf
    );
  }, [spots, stableRegion]);

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
      onTouchStart={() => {
        Keyboard.dismiss();
      }}
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
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsPointsOfInterest
        showsBuildings
        showsIndoors
        moveOnMarkerPress={false}
        zoomEnabled={!gestureLock}
        pitchEnabled={!gestureLock}
        rotateEnabled={!gestureLock}
        onPanDrag={dismissPopupWithFade}
        onRegionChange={(nextRegion) => {
          regionRef.current = nextRegion;
          if (isPlacingPin) setMapDragging(true);
          if (!activePopup) return;
          setPopupAnchorPoint(projectSpotAnchorFromRegion(activePopup.spot, nextRegion));
        }}
        onRegionChangeComplete={(r) => {
          setMapDragging(false);
          setStableRegion(r);
          if (isPlacingPin) {
            onPinRegionChange?.({ latitude: r.latitude, longitude: r.longitude });
          }
          onRegionChangeComplete(r);
        }}
        customMapStyle={isPlacingPin ? GREY_MAP_STYLE : []}
        onPress={() => {
          dismissPopup();
          Keyboard.dismiss();
          onPressMap();
        }}
        onPoiClick={(e) => {
          const { coordinate } = e.nativeEvent;
          onPoiPress?.({ latitude: coordinate.latitude, longitude: coordinate.longitude });
        }}
      >
        {renderedSpots.map((spot) => (
          <AvatarMarker
            key={spot.id}
            spot={spot}
            onPress={handleMarkerPress}
          />
        ))}


        {savingPin && (
          <Marker
            coordinate={{ latitude: savingPin.latitude, longitude: savingPin.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={s.savingShell}>
              <ActivityIndicator size="large" color="#E21E4D"  />
            </View>
            <Callout tooltip>
              <View style={s.savingCallout}>
                <ActivityIndicator size="large" color="#E21E4D" style={{ marginRight: 6 }}  />
                <Text style={s.savingCalloutText}>Saving "{savingPin.name}"...</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* Center pin for spot placement */}
      {isPlacingPin && <CenterPin dragging={mapDragging} />}

      {/* JS overlay popup - dismissed instantly by setState, no native animation */}
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
          pointerEvents="box-none"
        >
          <SpotPopup spot={activePopup.spot} onView={() => { onViewSpot?.(activePopup.spot.id); dismissPopup(); }} />
          <View style={[s.popupTail, popupTailStyle]} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  /* popup overlay */
  popupAnchor: {
    position: "absolute",
    alignItems: "center",
  },
  popupCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  popupAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },
  popupAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E21E4D",
  },
  popupAuthorInfo: {
    flex: 1,
  },
  popupAuthorName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },
  popupCompanion: {
    fontSize: 11,
    color: "#888",
    marginTop: 1,
  },
  popupSpotName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
    lineHeight: 22,
    marginBottom: 10,
  },
  popupScoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 8,
  },
  chipDate: {
    backgroundColor: "#E21E4D",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipDateText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  chipAtmo: {
    backgroundColor: "#f5f5f5",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipAtmoText: {
    color: "#444",
    fontSize: 11,
    fontWeight: "700",
  },
  chipReturn: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipReturnYes: {
    backgroundColor: "#dcfce7",
  },
  chipReturnNo: {
    backgroundColor: "#f5f5f5",
  },
  chipReturnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipReturnYesText: {
    color: "#16a34a",
  },
  chipReturnNoText: {
    color: "#888",
  },
  popupPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 6,
  },
  popupPill: {
    borderWidth: 1,
    borderColor: "#fdd5de",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#fff0f3",
    color: "#E21E4D",
    fontSize: 11,
    fontWeight: "700",
  },
  popupNotes: {
    fontSize: 12,
    color: "#777",
    lineHeight: 17,
    fontStyle: "italic",
    marginTop: 2,
  },
  viewBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "#E21E4D",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  viewBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  viewBtnSpacer: {
    width: 70,
  },
  photoStrip: {
    height: 80,
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  photoStripLoading: {
    justifyContent: "center",
    alignItems: "center",
  },
  photoStripContent: {
    flexDirection: "row",
    gap: 6,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
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
    borderRightColor: "rgba(0,0,0,0.06)",
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  /* saving pin */
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