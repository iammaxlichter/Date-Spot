import { supabase } from "../supabase/client";

const BUCKET = "review-photos";

export type ReviewPhoto = {
  id: string;
  review_id: string;
  storage_path: string;
  display_order: number;
  signed_url: string;
};

function extFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes(".png")) return "png";
  if (lower.includes(".heic")) return "heic";
  if (lower.includes(".webp")) return "webp";
  return "jpg";
}

function guessContentType(ext: string): string {
  switch (ext) {
    case "png":  return "image/png";
    case "webp": return "image/webp";
    case "heic": return "image/heic";
    default:     return "image/jpeg";
  }
}

async function uriToUint8Array(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to read image. status=${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function fetchReviewPhotos(reviewId: string): Promise<ReviewPhoto[]> {
  const { data, error } = await supabase
    .from("spot_review_photos")
    .select("id, review_id, storage_path, display_order")
    .eq("review_id", reviewId)
    .order("display_order", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string; review_id: string; storage_path: string; display_order: number;
  }>;

  if (rows.length === 0) return [];

  const { data: signedData, error: signedErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.storage_path), 3600);

  if (signedErr) throw signedErr;

  const signedByPath = new Map<string, string>();
  for (const item of signedData ?? []) {
    if (item?.path && item?.signedUrl) signedByPath.set(item.path, item.signedUrl);
  }

  return rows.map((r) => ({
    ...r,
    signed_url: signedByPath.get(r.storage_path) ?? "",
  }));
}

/**
 * Upload local photo URIs and insert DB rows for a review.
 * Call after upsertReview returns the reviewId.
 */
export async function uploadReviewPhotos(
  reviewId: string,
  userId: string,
  localUris: string[]
): Promise<void> {
  for (let idx = 0; idx < localUris.length; idx++) {
    const uri = localUris[idx];
    const ext = extFromUri(uri);
    const storagePath = `${userId}/${reviewId}/${Date.now()}-${idx}.${ext}`;
    const bytes = await uriToUint8Array(uri);

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { upsert: false, contentType: guessContentType(ext) });

    if (uploadErr) throw uploadErr;

    const { error: insertErr } = await supabase
      .from("spot_review_photos")
      .insert({ review_id: reviewId, user_id: userId, storage_path: storagePath, display_order: idx });

    if (insertErr) throw insertErr;
  }
}

/**
 * Delete all photos for a review (storage + DB rows).
 * Call before re-uploading when editing a review.
 */
export async function deleteAllReviewPhotos(reviewId: string): Promise<void> {
  const { data, error: fetchErr } = await supabase
    .from("spot_review_photos")
    .select("storage_path")
    .eq("review_id", reviewId);

  if (fetchErr) throw fetchErr;

  const paths = ((data ?? []) as Array<{ storage_path: string }>).map((r) => r.storage_path);

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  await supabase.from("spot_review_photos").delete().eq("review_id", reviewId);
}
