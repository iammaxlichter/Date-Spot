// src/screens/SpotDetails/SpotDetailsScreen.tsx
import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { s } from "./styles";
import { useSpotDetails } from "./hooks/useSpotDetails";
import { useSpotReviews } from "./hooks/useSpotReviews";
import { SpotDetailsLoading } from "./components/SpotDetailsLoading";
import { SpotHeader } from "./components/SpotDetailsHeader";
import { SpotDetailsPhotos } from "./components/SpotDetailsPhotos";
import { SpotStats } from "./components/SpotDetailsStats";
import { SpotTags } from "./components/SpotDetailsTags";
import { SpotNotes } from "./components/SpotDetailsNotes";
import { SpotReviews } from "./components/SpotReviews";
import { AddReviewModal } from "./components/AddReviewModal";
import { buildTagPresentation } from "../../features/tags/tagPresentation";

export default function SpotDetailsScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const spotId: string = route.params.spotId;

  const d = useSpotDetails({ spotId, navigation });
  const reviews = useSpotReviews(spotId);
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewModalExisting, setReviewModalExisting] = React.useState<import("../../services/api/spotReviews").SpotReview | null>(null);

  if (d.loading) return <SpotDetailsLoading />;
  if (!d.spot) return null;
  const taggedUsers = d.spot.tagged_users ?? [];
  const presentation = buildTagPresentation(taggedUsers, d.activePartnerId);

  return (
    <>
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
      <View style={s.card}>
        {/* top-right edit button (only for owner) */}
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
        <SpotDetailsPhotos photos={d.photos} enableFullscreen />

        <SpotStats
          atmosphere={d.spot.atmosphere}
          dateScore={d.spot.date_score}
          wouldReturn={d.spot.would_return}
        />

        <SpotTags vibe={d.spot.vibe} price={d.spot.price} bestFor={d.spot.best_for} />

        {presentation.kind !== "none" ? (
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
        ) : null}

        <SpotNotes
          notes={d.notes}
          shortNotes={d.shortNotes}
          expanded={d.expandedNotes}
          onToggle={() => d.setExpandedNotes((x) => !x)}
        />
      </View>

      <SpotReviews
        reviews={reviews.reviews}
        currentUserId={reviews.currentUserId}
        stats={reviews.stats}
        loading={reviews.loading}
        onAddReview={() => { setReviewModalExisting(null); setReviewModalOpen(true); }}
        onEditMyReview={(review) => { setReviewModalExisting(review); setReviewModalOpen(true); }}
      />
    </ScrollView>

    <AddReviewModal
      visible={reviewModalOpen}
      spotId={spotId}
      existingReview={reviewModalExisting}
      onClose={() => setReviewModalOpen(false)}
      onSaved={() => {
        setReviewModalOpen(false);
        void reviews.refresh();
      }}
    />
    </>
  );
}
