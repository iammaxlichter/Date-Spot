// src/screens/SpotDetails/SpotDetailsScreen.tsx
import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { s } from "./styles";
import { useSpotDetails } from "./hooks/useSpotDetails";
import { SpotDetailsLoading } from "./components/SpotDetailsLoading";
import { SpotHeader } from "./components/SpotDetailsHeader";
import { SpotDetailsPhotos } from "./components/SpotDetailsPhotos";
import { SpotStats } from "./components/SpotDetailsStats";
import { SpotTags } from "./components/SpotDetailsTags";
import { SpotNotes } from "./components/SpotDetailsNotes";
import { buildTagPresentation } from "../../features/tags/tagPresentation";

export default function SpotDetailsScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const spotId: string = route.params.spotId;

  const d = useSpotDetails({ spotId, navigation });

  if (d.loading) return <SpotDetailsLoading />;
  if (!d.spot) return null;

  const taggedUsers = d.spot.tagged_users ?? [];
  const presentation = buildTagPresentation(taggedUsers, d.activePartnerId);
  const hasTags = !!(d.spot.vibe || d.spot.price || d.spot.best_for);
  const hasNotes = d.notes.length > 0;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.card}>
        <View style={s.accentBar} />

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

        <Text style={s.eyebrow}>Date Spot</Text>
        <Text style={s.title}>{d.spot.name}</Text>
        <SpotDetailsPhotos photos={d.photos} enableFullscreen />
      </View>

      <View style={s.card}>
        <SpotStats
          atmosphere={d.spot.atmosphere}
          dateScore={d.spot.date_score}
          wouldReturn={d.spot.would_return}
        />
      </View>

      {hasTags ? (
        <View style={s.card}>
          <SpotTags vibe={d.spot.vibe} price={d.spot.price} bestFor={d.spot.best_for} />
        </View>
      ) : null}

      {presentation.kind !== "none" ? (
        <View style={s.card}>
          <View style={s.section}>
            {presentation.kind === "regular" ? (
              <>
                <Text style={s.label}>Went with</Text>
                <View style={s.wentWithRow}>
                  {presentation.users.map((user, idx) => (
                    <Pressable key={user.id} onPress={() => d.onTaggedUserPress(user.id)} hitSlop={8}>
                      <Text style={s.wentWithUser}>
                        @{user.username ?? "unknown"}
                        {idx < presentation.users.length - 1 ? ", " : ""}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : presentation.kind === "partner_only" ? (
              <Text style={s.partnerWithLine}>With @{presentation.partner.username ?? "unknown"} {"\u2764"}</Text>
            ) : (
              <Text style={s.partnerWithLine}>
                With @{presentation.partner.username ?? "unknown"} and {presentation.otherCount}{" "}
                {presentation.otherCount === 1 ? "other" : "others"}
              </Text>
            )}
          </View>
        </View>
      ) : null}

      {hasNotes ? (
        <View style={s.card}>
          <SpotNotes
            notes={d.notes}
            shortNotes={d.shortNotes}
            expanded={d.expandedNotes}
            onToggle={() => d.setExpandedNotes((x) => !x)}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
