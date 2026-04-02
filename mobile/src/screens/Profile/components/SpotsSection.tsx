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
  activePartnerId: string | null;
}) {
  const { spots, spotsLoading, onPressSpot, onPressTaggedUser, timeAgo, activePartnerId } = props;

  return (
    <View style={s.spotsSectionWrapper}>
      <View style={s.spotsSectionHero}>
        <Text style={s.spotsSectionEyebrow}>Memories</Text>
        <Text style={s.spotsSectionTitle}>Your Date Spots</Text>
        {!spotsLoading && spots.length > 0 ? (
          <Text style={s.spotsSectionSubtitle}>{spots.length} {spots.length === 1 ? "spot" : "spots"} saved</Text>
        ) : null}
      </View>

      {spotsLoading ? (
        <View style={s.spotsLoadingContainer}>
          <ActivityIndicator size="large" color="#E21E4D" />
          <Text style={s.spotsLoadingText}>Loading spots…</Text>
        </View>
      ) : spots.length > 0 ? (
        spots.map((spot) => (
          <Pressable key={spot.id} onPress={() => onPressSpot(spot.id)} style={({ pressed }) => pressed && { opacity: 0.85 }}>
            <SpotCard
              spot={spot}
              timeAgo={timeAgo}
              onPressTaggedUser={onPressTaggedUser}
              activePartnerId={activePartnerId}
            />
          </Pressable>
        ))
      ) : (
        <View style={s.emptySpots}>
          <Text style={s.emptySpotsTitle}>No spots yet</Text>
          <Text style={s.emptySpotsText}>Start adding date spots to see them here.</Text>
        </View>
      )}
    </View>
  );
}
