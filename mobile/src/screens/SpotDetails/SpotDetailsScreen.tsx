// src/screens/SpotDetails/SpotDetailsScreen.tsx
import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { s } from "./styles";
import { useSpotDetails } from "./hooks/useSpotDetails";
import { SpotDetailsLoading } from "./components/SpotDetailsLoading";
import { SpotHeader } from "./components/SpotDetailsHeader";
import { SpotStats } from "./components/SpotDetailsStats";
import { SpotTags } from "./components/SpotDetailsTags";
import { SpotNotes } from "./components/SpotDetailsNotes";

export default function SpotDetailsScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const spotId: string = route.params.spotId;

  const d = useSpotDetails({ spotId, navigation });

  if (d.loading) return <SpotDetailsLoading />;
  if (!d.spot) return null;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
      <View style={s.card}>
        {/* ✅ top-right edit button (only for owner) */}
        {d.isOwner ? (
          <Pressable onPress={d.onEdit} hitSlop={10} style={s.editBtn}>
            <Text style={s.editBtnText}>Edit</Text>
          </Pressable>
        ) : null}

        <SpotHeader
          avatarSource={d.avatarSource}
          username={d.username}
          timeAgoText={d.timeAgoText}
          onProfilePress={d.onProfilePress}
        />

        <Text style={s.title}>{d.spot.name}</Text>

        <SpotStats
          atmosphere={d.spot.atmosphere}
          dateScore={d.spot.date_score}
          wouldReturn={d.spot.would_return}
        />

        <SpotTags vibe={d.spot.vibe} price={d.spot.price} bestFor={d.spot.best_for} />

        <SpotNotes
          notes={d.notes}
          shortNotes={d.shortNotes}
          expanded={d.expandedNotes}
          onToggle={() => d.setExpandedNotes((x) => !x)}
        />
      </View>
    </ScrollView>
  );
}
