import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { upsertReview } from "../../../services/api/spotReviews";
import { s } from "../styles";
import type { SpotReview } from "../../../services/api/spotReviews";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIBES = ["Chill", "Romantic", "Energetic", "Intimate", "Social", "Aesthetic"] as const;
const PRICES = ["No $", "$1-10", "$10-20", "$20-30", "$30-50", "$50-100", "$100+"] as const;
const BEST_FORS = ["Day", "Night", "Sunrise", "Sunset", "Any"] as const;
const MAX_PHOTOS = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function compressPhoto(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.reviewModalLabel}>{children}</Text>;
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  return (
    <View style={s.reviewChipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(value === opt ? null : opt)}
          style={[s.reviewChip, value === opt && s.reviewChipActive]}
        >
          <Text style={[s.reviewChipText, value === opt && s.reviewChipTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function NumberSelector({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <View style={s.reviewNumRow}>
      {nums.map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(value === n ? null : n)}
          style={[s.reviewNumBtn, value === n && s.reviewNumBtnActive]}
        >
          <Text style={[s.reviewNumText, value === n && s.reviewNumTextActive]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  spotId: string;
  existingReview: SpotReview | null;
  onClose: () => void;
  onSaved: () => void;
};

export function AddReviewModal({ visible, spotId, existingReview, onClose, onSaved }: Props) {
  const [rating, setRating] = React.useState<number>(0);
  const [reviewText, setReviewText] = React.useState("");
  const [atmosphere, setAtmosphere] = React.useState<number | null>(null);
  const [dateScore, setDateScore] = React.useState<number | null>(null);
  const [wouldReturn, setWouldReturn] = React.useState<boolean | null>(null);
  const [vibe, setVibe] = React.useState<string | null>(null);
  const [price, setPrice] = React.useState<string | null>(null);
  const [bestFor, setBestFor] = React.useState<string | null>(null);
  const [photoUris, setPhotoUris] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync form to existingReview whenever the modal opens
  React.useEffect(() => {
    if (!visible) return;
    const r = existingReview;
    setRating(r?.rating ?? 0);
    setReviewText(r?.review_text ?? "");
    setAtmosphere(r?.atmosphere ? Number(r.atmosphere) : null);
    setDateScore(r?.date_score ?? null);
    setWouldReturn(r?.would_return ?? null);
    setVibe(r?.vibe ?? null);
    setPrice(r?.price ?? null);
    setBestFor(r?.best_for ?? null);
    // Pre-populate existing signed URLs so they display; only local:// URIs get re-uploaded
    setPhotoUris(r?.photos.map((p) => p.signed_url).filter(Boolean) ?? []);
    setError(null);
  }, [visible, existingReview]);

  const pickPhotos = React.useCallback(async () => {
    if (photoUris.length >= MAX_PHOTOS) {
      Alert.alert("Photo limit", `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photoUris.length,
      quality: 1,
    });
    if (result.canceled) return;
    const compressed = await Promise.all((result.assets ?? []).map((a) => compressPhoto(a.uri)));
    setPhotoUris((prev) => [...prev, ...compressed].slice(0, MAX_PHOTOS));
  }, [photoUris.length]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      // Only upload URIs that are local (file://). Signed URLs from existing photos
      // are preserved server-side when photoUris isn't passed to upsertReview.
      const localUris = photoUris.filter(
        (u) => u.startsWith("file://") || u.startsWith("/var/") || u.startsWith("/data/")
      );
      const hasPhotoChanges =
        localUris.length > 0 ||
        photoUris.length !== (existingReview?.photos.length ?? 0);

      const saved = await upsertReview({
        reviewId: existingReview?.id,
        spotId,
        rating,
        reviewText: reviewText.trim() || null,
        atmosphere: atmosphere !== null ? String(atmosphere) : null,
        dateScore,
        wouldReturn,
        vibe,
        price,
        bestFor,
        photoUris: hasPhotoChanges ? localUris : undefined,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? "Failed to save review.";
      console.error("[AddReviewModal] upsertReview error:", e);
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!existingReview;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={s.reviewModalBackdrop} onPress={onClose}>
          <Pressable onPress={() => {}} style={s.reviewModalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
            >
              <Text style={s.reviewModalTitle}>
                {isEditing ? "Edit your review" : "Add a review"}
              </Text>

              {/* ── Overall rating ── */}
              <SectionLabel>Overall Rating *</SectionLabel>
              <View style={s.reviewStarRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setRating(star)} hitSlop={6} style={s.reviewStarBtn}>
                    <Text style={[s.reviewStarIcon, star <= rating && s.reviewStarIconActive]}>
                      {star <= rating ? "★" : "☆"}
                    </Text>
                  </Pressable>
                ))}
                {rating > 0 && <Text style={s.reviewStarLabel}>{rating} / 5</Text>}
              </View>

              {/* ── Atmosphere ── */}
              <SectionLabel>Atmosphere (1–10)</SectionLabel>
              <NumberSelector min={1} max={10} value={atmosphere} onChange={setAtmosphere} />

              {/* ── Date Score ── */}
              <SectionLabel>Date Score (0–10)</SectionLabel>
              <NumberSelector min={0} max={10} value={dateScore} onChange={setDateScore} />

              {/* ── Would Return ── */}
              <SectionLabel>Would Return?</SectionLabel>
              <View style={s.reviewToggleRow}>
                {([true, false] as const).map((val) => (
                  <Pressable
                    key={String(val)}
                    onPress={() => setWouldReturn(wouldReturn === val ? null : val)}
                    style={[s.reviewToggleBtn, wouldReturn === val && s.reviewToggleBtnActive]}
                  >
                    <Text style={[s.reviewToggleText, wouldReturn === val && s.reviewToggleTextActive]}>
                      {val ? "Yes ✓" : "No"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ── Vibe ── */}
              <SectionLabel>Vibe</SectionLabel>
              <ChipRow options={VIBES} value={vibe as any} onChange={setVibe} />

              {/* ── Price ── */}
              <SectionLabel>Price</SectionLabel>
              <ChipRow options={PRICES} value={price as any} onChange={setPrice} />

              {/* ── Best For ── */}
              <SectionLabel>Best For</SectionLabel>
              <ChipRow options={BEST_FORS} value={bestFor as any} onChange={setBestFor} />

              {/* ── Photos ── */}
              <View style={s.reviewPhotoHeader}>
                <SectionLabel>Photos</SectionLabel>
                {photoUris.length < MAX_PHOTOS && (
                  <Pressable onPress={pickPhotos} style={s.reviewPhotoAddBtn}>
                    <Text style={s.reviewPhotoAddBtnText}>+ Add</Text>
                  </Pressable>
                )}
              </View>
              {photoUris.length > 0 && (
                <View style={s.reviewPhotoRow}>
                  {photoUris.map((uri, idx) => (
                    <View key={`${uri}-${idx}`} style={{ position: "relative" }}>
                      <Image source={{ uri }} style={s.reviewPhotoThumb} />
                      <Pressable
                        onPress={() => setPhotoUris((prev) => prev.filter((_, i) => i !== idx))}
                        hitSlop={6}
                        style={s.reviewPhotoRemoveBtn}
                      >
                        <Text style={s.reviewPhotoRemoveBtnText}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Review text ── */}
              <SectionLabel>Notes (optional)</SectionLabel>
              <TextInput
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share your experience…"
                multiline
                numberOfLines={3}
                style={s.reviewTextInput}
                placeholderTextColor="#aaa"
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={s.reviewCharCount}>{reviewText.length} / 500</Text>

              {error ? <Text style={s.reviewModalError}>{error}</Text> : null}

              <View style={s.reviewModalButtons}>
                <Pressable
                  onPress={onClose}
                  disabled={saving}
                  style={[s.reviewModalBtn, s.reviewModalBtnSecondary, saving && { opacity: 0.5 }]}
                >
                  <Text style={s.reviewModalBtnTextSecondary}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={saving}
                  style={[s.reviewModalBtn, s.reviewModalBtnPrimary, saving && { opacity: 0.5 }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.reviewModalBtnTextPrimary}>
                      {isEditing ? "Save changes" : "Submit"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
