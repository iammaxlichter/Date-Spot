import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Callout, Marker, type MarkerPressEvent } from "react-native-maps";
import type { MapSpot } from "../../../services/api/spots";

const MARKER_ANCHOR = { x: 0.5, y: 0.5 };
const DEFAULT_AVATAR = require("../../../../assets/default-avatar.png");

type Props = {
  spot: MapSpot;
  onPress?: (spot: MapSpot, event: MarkerPressEvent) => void;
};

function pickName(input: { name?: string | null; username?: string | null }) {
  const fromName = (input.name ?? "").trim();
  if (fromName) return fromName;
  const fromUsername = (input.username ?? "").trim();
  if (fromUsername) return fromUsername;
  return "";
}

function buildCompanionText(spot: MapSpot) {
  const tagged = (spot.tagged_users ?? [])
    .map((u) => (u.name ?? "").trim() || (u.username ?? "").trim())
    .filter((v) => !!v);
  const firstThree = tagged.slice(0, 3);
  const overflow = tagged.length - firstThree.length;
  if (!firstThree.length) return "";
  const names = firstThree.join(", ");
  return overflow > 0 ? `${names} +${overflow}` : names;
}

function buildHeaderLine(spot: MapSpot) {
  const spotName = (spot.name ?? "").trim() || "Date Spot";
  const authorName = pickName(spot.author);
  const companions = buildCompanionText(spot);

  if (authorName && companions) return `${authorName} went with ${companions} to ${spotName}`;
  if (authorName && !companions) return `${authorName} went to ${spotName}`;
  if (!authorName && companions) return `Went with ${companions} to ${spotName}`;
  return spotName;
}

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

  const headerLine = React.useMemo(() => buildHeaderLine(spot), [spot]);
  const hasRatings =
    spot.atmosphere != null || spot.date_score != null || spot.would_return != null;
  const hasDetails = spot.vibe || spot.price || spot.best_for;
  const notes = (spot.notes ?? "").trim();

  return (
    <Marker
      coordinate={coordinate}
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

      <Callout tooltip>
        <View style={styles.calloutCard}>
          <Text style={styles.calloutHeader} numberOfLines={3} ellipsizeMode="tail">
            {headerLine}
          </Text>

          {hasRatings ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ratings</Text>

              {spot.atmosphere != null ? (
                <View style={styles.row}>
                  <Text style={styles.k}>Atmosphere</Text>
                  <Text style={styles.v}>{spot.atmosphere}</Text>
                </View>
              ) : null}

              {spot.date_score != null ? (
                <View style={styles.row}>
                  <Text style={styles.k}>Date score</Text>
                  <Text style={styles.v}>{spot.date_score}</Text>
                </View>
              ) : null}

              {spot.would_return != null ? (
                <View style={styles.row}>
                  <Text style={styles.k}>Would return</Text>
                  <Text style={styles.v}>{spot.would_return ? "Yes" : "No"}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {hasDetails ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.pillRow}>
                {spot.vibe ? <Text style={styles.pill}>{spot.vibe}</Text> : null}
                {spot.price ? <Text style={styles.pill}>{spot.price}</Text> : null}
                {spot.best_for ? <Text style={styles.pill}>{spot.best_for}</Text> : null}
              </View>
            </View>
          ) : null}

          {notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes} numberOfLines={4} ellipsizeMode="tail">
                {notes}
              </Text>
            </View>
          ) : null}
        </View>
      </Callout>
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
    prev.spot.date_score === next.spot.date_score &&
    prev.spot.notes === next.spot.notes &&
    prev.spot.vibe === next.spot.vibe &&
    prev.spot.price === next.spot.price &&
    prev.spot.best_for === next.spot.best_for &&
    prev.spot.would_return === next.spot.would_return &&
    prev.spot.tagged_users === next.spot.tagged_users
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
  calloutCard: {
    width: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    backgroundColor: "#fff",
    padding: 12,
  },
  calloutHeader: {
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
});
