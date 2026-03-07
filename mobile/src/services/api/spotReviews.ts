import { supabase } from "../supabase/client";
import { fetchReviewPhotos, uploadReviewPhotos, deleteAllReviewPhotos } from "./reviewPhotos";
import type { ReviewPhoto } from "./reviewPhotos";

// ─── Types ───────────────────────────────────────────────────────────────────

export type { ReviewPhoto };

export type SpotReview = {
  id: string;
  spot_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  // Extended rating fields (mirrors the spot's own rating fields)
  atmosphere: string | null;   // "1"–"10"
  date_score: number | null;   // 0–10
  vibe: string | null;
  price: string | null;
  best_for: string | null;
  would_return: boolean | null;
  photos: ReviewPhoto[];
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

export type UpsertReviewInput = {
  /** If provided, UPDATE the existing review with this id. Otherwise INSERT a new one. */
  reviewId?: string;
  spotId: string;
  rating: number;
  reviewText?: string | null;
  atmosphere?: string | null;
  dateScore?: number | null;
  vibe?: string | null;
  price?: string | null;
  bestFor?: string | null;
  wouldReturn?: boolean | null;
  /** Local file URIs to upload as photos for this review. Replaces any existing photos. */
  photoUris?: string[];
};

export type SpotReviewStats = {
  spot_id: string;
  average_rating: number;
  total_reviews: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch all reviews for a given spot, newest first.
 * Joins the author's profile so the UI can display name/avatar.
 */
export async function getReviewsForSpot(spotId: string): Promise<SpotReview[]> {
  const { data, error } = await supabase
    .from("spot_reviews")
    .select(
      `
      id, spot_id, user_id, rating, review_text,
      atmosphere, date_score, vibe, price, best_for, would_return,
      created_at, updated_at,
      profiles:profiles!spot_reviews_user_id_fkey(id, name, username, avatar_url),
      spot_review_photos(id, storage_path, display_order)
      `
    )
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as Array<Record<string, unknown>>;

  // Batch sign all photo paths in one request
  const allPhotoPaths: string[] = [];
  for (const row of rows) {
    const photoRows = (row.spot_review_photos as Array<Record<string, unknown>> | null) ?? [];
    for (const p of photoRows) allPhotoPaths.push(p.storage_path as string);
  }

  const signedByPath = new Map<string, string>();
  if (allPhotoPaths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from("review-photos")
      .createSignedUrls(allPhotoPaths, 3600);
    for (const item of signedData ?? []) {
      if (item?.path && item?.signedUrl) signedByPath.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => {
    const profile = Array.isArray(row.profiles)
      ? (row.profiles[0] as Record<string, unknown> | undefined)
      : (row.profiles as Record<string, unknown> | null);

    const photoRows = (row.spot_review_photos as Array<Record<string, unknown>> | null) ?? [];
    const photos: ReviewPhoto[] = photoRows
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
      .map((p) => ({
        id: p.id as string,
        review_id: row.id as string,
        storage_path: p.storage_path as string,
        display_order: p.display_order as number,
        signed_url: signedByPath.get(p.storage_path as string) ?? "",
      }));

    return {
      id: row.id as string,
      spot_id: row.spot_id as string,
      user_id: row.user_id as string,
      rating: row.rating as number,
      review_text: (row.review_text as string | null) ?? null,
      atmosphere: (row.atmosphere as string | null) ?? null,
      date_score: (row.date_score as number | null) ?? null,
      vibe: (row.vibe as string | null) ?? null,
      price: (row.price as string | null) ?? null,
      best_for: (row.best_for as string | null) ?? null,
      would_return: (row.would_return as boolean | null) ?? null,
      photos,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      author: profile
        ? {
            id: profile.id as string,
            name: (profile.name as string | null) ?? null,
            username: (profile.username as string | null) ?? null,
            avatar_url: (profile.avatar_url as string | null) ?? null,
          }
        : undefined,
    };
  });
}

/**
 * Fetch the current user's review for a specific spot.
 * Returns null if the user has not reviewed the spot yet.
 */
export async function getMyReviewForSpot(spotId: string): Promise<SpotReview | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("spot_reviews")
    .select(
      "id, spot_id, user_id, rating, review_text, atmosphere, date_score, vibe, price, best_for, would_return, created_at, updated_at"
    )
    .eq("spot_id", spotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Record<string, unknown>;

  // Fetch this review's photos
  let photos: ReviewPhoto[] = [];
  try {
    photos = await fetchReviewPhotos(row.id as string);
  } catch {
    photos = [];
  }

  return {
    id: row.id as string,
    spot_id: row.spot_id as string,
    user_id: row.user_id as string,
    rating: row.rating as number,
    review_text: (row.review_text as string | null) ?? null,
    atmosphere: (row.atmosphere as string | null) ?? null,
    date_score: (row.date_score as number | null) ?? null,
    vibe: (row.vibe as string | null) ?? null,
    price: (row.price as string | null) ?? null,
    best_for: (row.best_for as string | null) ?? null,
    would_return: (row.would_return as boolean | null) ?? null,
    photos,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * Create or update a review.
 * - If input.reviewId is provided: UPDATE that specific review.
 * - Otherwise: INSERT a new review row.
 */
export async function upsertReview(input: UpsertReviewInput): Promise<SpotReview> {
  const userId = await requireUserId();

  const fields = {
    rating: input.rating,
    review_text: input.reviewText ?? null,
    atmosphere: input.atmosphere ?? null,
    date_score: input.dateScore ?? null,
    vibe: input.vibe ?? null,
    price: input.price ?? null,
    best_for: input.bestFor ?? null,
    would_return: input.wouldReturn ?? null,
  };

  const selectCols =
    "id, spot_id, user_id, rating, review_text, atmosphere, date_score, vibe, price, best_for, would_return, created_at, updated_at";

  let data: Record<string, unknown> | null = null;
  let error: unknown = null;

  if (input.reviewId) {
    ({ data, error } = await supabase
      .from("spot_reviews")
      .update(fields)
      .eq("id", input.reviewId)
      .eq("user_id", userId)
      .select(selectCols)
      .single() as any);
  } else {
    ({ data, error } = await supabase
      .from("spot_reviews")
      .insert({ spot_id: input.spotId, user_id: userId, ...fields })
      .select(selectCols)
      .single() as any);
  }

  if (error) throw error;
  if (!data) throw new Error("Failed to save review");

  const row = data as Record<string, unknown>;
  const reviewId = row.id as string;

  // Sync photos: delete existing ones then upload new local URIs
  if (input.photoUris !== undefined) {
    await deleteAllReviewPhotos(reviewId);
    if (input.photoUris.length > 0) {
      await uploadReviewPhotos(reviewId, userId, input.photoUris);
    }
  }

  // Fetch the final signed photos to return
  let photos: ReviewPhoto[] = [];
  try {
    photos = await fetchReviewPhotos(reviewId);
  } catch {
    photos = [];
  }

  return {
    id: reviewId,
    spot_id: row.spot_id as string,
    user_id: row.user_id as string,
    rating: row.rating as number,
    review_text: (row.review_text as string | null) ?? null,
    atmosphere: (row.atmosphere as string | null) ?? null,
    date_score: (row.date_score as number | null) ?? null,
    vibe: (row.vibe as string | null) ?? null,
    price: (row.price as string | null) ?? null,
    best_for: (row.best_for as string | null) ?? null,
    would_return: (row.would_return as boolean | null) ?? null,
    photos,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * Fetch aggregate stats for a spot from the spot_review_stats view.
 * Returns null if the spot has no reviews yet.
 */
export async function getSpotReviewStats(spotId: string): Promise<SpotReviewStats | null> {
  const { data, error } = await supabase
    .from("spot_review_stats")
    .select("spot_id, average_rating, total_reviews")
    .eq("spot_id", spotId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    spot_id: row.spot_id as string,
    average_rating: Number(row.average_rating),
    total_reviews: row.total_reviews as number,
  };
}

/**
 * Delete the current user's review for a spot.
 */
export async function deleteReview(reviewId: string): Promise<void> {
  await requireUserId(); // ensures the caller is authenticated before the RLS check

  const { error } = await supabase
    .from("spot_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) throw error;
}
