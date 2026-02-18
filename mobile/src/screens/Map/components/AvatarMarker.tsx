import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Marker, type MarkerPressEvent } from "react-native-maps";
import type { MapSpot } from "../../../services/api/spots";

const MARKER_ANCHOR = { x: 0.5, y: 0.5 };
const DEFAULT_AVATAR = require("../../../../assets/default-avatar.png");

type Props = {
  spot: MapSpot;
  onPress?: (spot: MapSpot, event: MarkerPressEvent) => void;
};

function AvatarMarkerInner({ spot, onPress }: Props) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const [tracksViewChanges, setTracksViewChanges] = React.useState<boolean>(
    !!spot.author.avatar_url
  );

  React.useEffect(() => {
    setImageFailed(false);
    setTracksViewChanges(!!spot.author.avatar_url);
  }, [spot.author.avatar_url]);

  const coordinate = React.useMemo(
    () => ({ latitude: spot.latitude, longitude: spot.longitude }),
    [spot.latitude, spot.longitude]
  );

  const handlePress = React.useCallback(
    (event: MarkerPressEvent) => {
      onPress?.(spot, event);
    },
    [onPress, spot]
  );

  return (
    <Marker
      coordinate={coordinate}
      title={spot.name}
      description={
        spot.date_score || spot.atmosphere
          ? `Atmosphere: ${spot.atmosphere ?? "-"} | Date: ${spot.date_score ?? "-"}`
          : "No ratings yet"
      }
      tracksViewChanges={tracksViewChanges}
      anchor={MARKER_ANCHOR}
      onPress={handlePress}
    >
      <View style={styles.shell}>
        {spot.author.avatar_url && !imageFailed ? (
          <Image
            source={{ uri: spot.author.avatar_url }}
            style={styles.avatar}
            onLoadEnd={() => {
              setTracksViewChanges(false);
            }}
            onError={() => {
              setImageFailed(true);
              setTracksViewChanges(false);
            }}
          />
        ) : (
          <Image source={DEFAULT_AVATAR} style={styles.avatar} />
        )}
      </View>
    </Marker>
  );
}

function areEqual(prev: Props, next: Props) {
  return (
    prev.onPress === next.onPress &&
    prev.spot.id === next.spot.id &&
    prev.spot.latitude === next.spot.latitude &&
    prev.spot.longitude === next.spot.longitude &&
    prev.spot.author.avatar_url === next.spot.author.avatar_url &&
    prev.spot.author.username === next.spot.author.username &&
    prev.spot.author.name === next.spot.author.name &&
    prev.spot.name === next.spot.name &&
    prev.spot.atmosphere === next.spot.atmosphere &&
    prev.spot.date_score === next.spot.date_score
  );
}

export const AvatarMarker = React.memo(AvatarMarkerInner, areEqual);

const styles = StyleSheet.create({
  shell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#f4f4f5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 21,
  },
});
