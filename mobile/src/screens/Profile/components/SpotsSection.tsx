import React from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { s } from "../styles";
import type { SpotRow } from "../api/profileApi";
import { SpotCard } from "./SpotCard";

export function SpotsSection(props: {
  spots: SpotRow[];
  spotsLoading: boolean;
  onPressSpot: (spotId: string) => void;
  onPressTaggedUser: (userId: string) => void;
  timeAgo: (iso: string) => string;
}) {
  const { spots, spotsLoading, onPressSpot, onPressTaggedUser, timeAgo } = props;

  return (
    <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 12 }}>
      <Text style={s.sectionTitle}>Your Date Spots</Text>

      {(() => {
        return null;
      })()}

      {spotsLoading ? (
        <View style={s.spotsLoadingContainer}>
          <ActivityIndicator size="small" />
          <Text style={s.spotsLoadingText}>Loading spots…</Text>
        </View>
      ) : spots.length > 0 ? (
        spots.map((spot) => (
          <Pressable key={spot.id} onPress={() => onPressSpot(spot.id)}>
            <SpotCard
              spot={spot}
              timeAgo={timeAgo}
              onPressTaggedUser={onPressTaggedUser}
            />
          </Pressable>
        ))
      ) : (
        <View style={s.emptySpots}>
          <Text style={s.emptySpotsText}>You haven't created any date spots yet.</Text>
        </View>
      )}
    </View>
  );
}
