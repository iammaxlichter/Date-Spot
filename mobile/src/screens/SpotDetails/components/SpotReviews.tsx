import React from "react";
import { View, Text, Pressable, ActivityIndicator, Image, ScrollView } from "react-native";
import { s } from "../styles";
import type { SpotReview, SpotReviewStats } from "../../../services/api/spotReviews";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function starString(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review, isOwn, onEdit }: { review: SpotReview; isOwn: boolean; onEdit: (r: SpotReview) => void }) {
  const displayName =
    review.author?.name?.trim() ||
    (review.author?.username ? `@${review.author.username}` : null);

  const hasTags = review.vibe || review.price || review.best_for || review.would_return !== null;

  return (
    <View style={s.reviewCard}>
      {/* Header: stars + date + edit button */}
      <View style={s.reviewCardHeader}>
        <Text style={s.reviewStars}>{starString(review.rating)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={s.reviewDate}>{formatDate(review.created_at)}</Text>
          {isOwn && (
            <Pressable onPress={() => onEdit(review)} hitSlop={8} style={s.reviewEditBtn}>
              <Text style={s.reviewEditBtnText}>Edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Author */}
      {displayName ? <Text style={s.reviewAuthor}>{displayName}</Text> : null}

      {/* Photos */}
      {review.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.reviewCardPhotoScroll}
          contentContainerStyle={{ gap: 8 }}
        >
          {review.photos.map((p) => (
            <Image key={p.id} source={{ uri: p.signed_url }} style={s.reviewCardPhoto} />
          ))}
        </ScrollView>
      )}

      {/* Scores */}
      {(review.atmosphere || review.date_score !== null) && (
        <View style={s.reviewScoreRow}>
          {review.atmosphere ? (
            <View style={s.reviewScorePill}>
              <Text style={s.reviewScoreLabel}>Atmosphere</Text>
              <Text style={s.reviewScoreValue}>{review.atmosphere}/10</Text>
            </View>
          ) : null}
          {review.date_score !== null ? (
            <View style={s.reviewScorePill}>
              <Text style={s.reviewScoreLabel}>Date Score</Text>
              <Text style={s.reviewScoreValue}>{review.date_score}/10</Text>
            </View>
          ) : null}
          {review.would_return !== null ? (
            <View style={[s.reviewScorePill, review.would_return ? s.reviewScorePillYes : s.reviewScorePillNo]}>
              <Text style={s.reviewScoreValue}>
                {review.would_return ? "Would return ✓" : "Wouldn't return"}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Tags */}
      {hasTags && (
        <View style={s.reviewTagRow}>
          {review.vibe ? <Text style={s.reviewTag}>{review.vibe}</Text> : null}
          {review.price ? <Text style={s.reviewTag}>{review.price}</Text> : null}
          {review.best_for ? <Text style={s.reviewTag}>{review.best_for}</Text> : null}
        </View>
      )}

      {/* Review text / notes */}
      {review.review_text ? (
        <View style={s.reviewNotesBox}>
          <Text style={s.reviewNotesLabel}>Notes</Text>
          <Text style={s.reviewText}>{review.review_text}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReviewsLoading() {
  return (
    <View style={s.reviewLoadingRow}>
      <ActivityIndicator size="small" color="#ccc" />
      <Text style={s.reviewLoadingText}>Loading reviews…</Text>
    </View>
  );
}

function ReviewsEmpty() {
  return (
    <View style={s.reviewEmpty}>
      <Text style={s.reviewEmptyTitle}>No reviews yet</Text>
      <Text style={s.reviewEmptySubtitle}>Be the first to review this date spot.</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  reviews: SpotReview[];
  currentUserId: string | null;
  stats: SpotReviewStats | null;
  loading: boolean;
  onAddReview: () => void;
  onEditMyReview: (review: SpotReview) => void;
};

export function SpotReviews({ reviews, currentUserId, stats, loading, onAddReview, onEditMyReview }: Props) {
  return (
    <View style={s.reviewsSection}>
      <View style={s.reviewsHeader}>
        <View style={s.reviewsHeaderLeft}>
          <Text style={s.label}>Reviews</Text>
          {stats !== null ? (
            <Text style={s.reviewStatsBadge}>
              {"⭐"} {stats.average_rating.toFixed(1)}{" "}
              <Text style={s.reviewStatsCount}>
                ({stats.total_reviews} {stats.total_reviews === 1 ? "review" : "reviews"})
              </Text>
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onAddReview} hitSlop={8} style={s.addReviewBtn}>
          <Text style={s.addReviewBtnText}>Add Review</Text>
        </Pressable>
      </View>

      {loading ? (
        <ReviewsLoading />
      ) : reviews.length === 0 ? (
        <ReviewsEmpty />
      ) : (
        reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isOwn={!!currentUserId && review.user_id === currentUserId}
            onEdit={onEditMyReview}
          />
        ))
      )}
    </View>
  );
}
