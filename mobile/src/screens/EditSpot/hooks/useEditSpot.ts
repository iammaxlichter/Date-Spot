// src/screens/EditSpot/hooks/useEditSpot.ts
import * as React from "react";
import { Alert } from "react-native";
import { supabase } from "../../../services/supabase/client";
import { sanitizeOneToTenInput } from "../../../app/utils/numberInputValidation";
import type { Price, BestFor } from "../../../types/datespot";
import type { SpotEditRow } from "../types";
import {
  fetchEligibleTagUsers,
  fetchSpotTags,
  upsertSpotTags,
  type TaggedUser,
} from "../../../services/api/spotTags";
import { getActivePartner } from "../../../services/api/partnerships";
import {
  type PartnerAnswer,
  inferPartnerAnswer,
  withPartnerTag,
  withoutPartnerTag,
} from "../../../features/tags/partnerTagging";

import type { SpotPhotoItem } from "../../../types/spotPhotos";
import { syncSpotPhotosOnEdit } from "../../../services/api/spotPhotosService";

export function useEditSpot(args: { spotId: string; navigation: any }) {
  const { spotId, navigation } = args;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Form state (match NewSpotSheet props)
  const [name, setName] = React.useState("");
  const [atmosphere, setAtmosphere] = React.useState(""); // 1-10 string
  const [dateScore, setDateScore] = React.useState(""); // 1-10 string
  const [notes, setNotes] = React.useState("");
  const [vibe, setVibe] = React.useState<string | null>(null);
  const [price, setPrice] = React.useState<Price | null>(null);
  const [bestFor, setBestFor] = React.useState<BestFor | null>(null);
  const [wouldReturn, setWouldReturn] = React.useState<boolean>(true);
  const [selectedTaggedUsers, setSelectedTaggedUsers] = React.useState<TaggedUser[]>([]);
  const [eligibleTagUsers, setEligibleTagUsers] = React.useState<TaggedUser[]>([]);
  const [tagUsersLoading, setTagUsersLoading] = React.useState(false);
  const [activePartner, setActivePartner] = React.useState<TaggedUser | null>(null);
  const [partnerAnswer, setPartnerAnswer] = React.useState<PartnerAnswer>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        setCurrentUserId(userRes.user?.id ?? null);
      } catch {
        setCurrentUserId(null);
      }
    })();
  }, []);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("spots")
        .select(
          `
          id, user_id,
          name, atmosphere, date_score, notes, vibe, price, best_for, would_return
        `
        )
        .eq("id", spotId)
        .single();

      if (error) throw error;

      const row = data as unknown as SpotEditRow;

      // UI-level guard (RLS should still enforce server-side)
      if (currentUserId && row.user_id !== currentUserId) {
        Alert.alert("Not allowed", "You can only edit your own DateSpots.");
        navigation.goBack();
        return;
      }

      // Prefill (match NewSpotSheet types/shape)
      setName(row.name ?? "");
      setAtmosphere(
        row.atmosphere == null ? "" : sanitizeOneToTenInput(String(row.atmosphere))
      );
      setDateScore(
        row.date_score == null ? "" : sanitizeOneToTenInput(String(row.date_score))
      );
      setNotes(row.notes ?? "");
      setVibe(row.vibe ?? null);
      setPrice((row.price as Price | null) ?? null);
      setBestFor((row.best_for as BestFor | null) ?? null);
      setWouldReturn(!!row.would_return);

      if (currentUserId) {
        setTagUsersLoading(true);
        const [existingTags, partner, eligible] = await Promise.all([
          fetchSpotTags(spotId),
          getActivePartner(currentUserId),
          fetchEligibleTagUsers(currentUserId),
        ]);
        setSelectedTaggedUsers(existingTags);
        setEligibleTagUsers(eligible);
        setActivePartner(partner);
        setPartnerAnswer(inferPartnerAnswer(existingTags, partner));
        setTagUsersLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to load DateSpot.");
      navigation.goBack();
    } finally {
      setTagUsersLoading(false);
      setLoading(false);
    }
  }, [currentUserId, navigation, spotId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /**
   * Updated: onSave now accepts currentPhotos + initialPhotos
   * so we can diff deletes + upload new + reorder positions.
   */
  const onSave = React.useCallback(
    async (currentPhotos: SpotPhotoItem[], initialPhotos: SpotPhotoItem[]) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        Alert.alert("Missing name", "Please enter a spot name.");
        return;
      }

      // Convert form strings -> DB values
      const atmosphereNum =
        atmosphere.trim() === "" ? null : Number(atmosphere.trim());
      const dateScoreNum =
        dateScore.trim() === "" ? null : Number(dateScore.trim());

      if (
        atmosphereNum !== null &&
        (Number.isNaN(atmosphereNum) || atmosphereNum < 1 || atmosphereNum > 10)
      ) {
        Alert.alert(
          "Invalid atmosphere",
          "Use a number from 1 to 10 (or leave blank)."
        );
        return;
      }

      if (
        dateScoreNum !== null &&
        (Number.isNaN(dateScoreNum) || dateScoreNum < 1 || dateScoreNum > 10)
      ) {
        Alert.alert(
          "Invalid date score",
          "Use a number from 1 to 10 (or leave blank)."
        );
        return;
      }

      try {
        setSaving(true);

        // 1) Sync photos FIRST (delete removed, upload new, reorder positions)
        await syncSpotPhotosOnEdit({
          spotId,
          currentPhotos,
          initialPhotos,
        });

        // 2) Save spot details (existing behavior)
        const payload = {
          name: trimmedName,
          atmosphere: atmosphereNum === null ? null : String(atmosphereNum), // keep if your DB column is text
          date_score: dateScoreNum,
          notes: notes.trim() || null,
          vibe: vibe ?? null,
          price: price ?? null,
          best_for: bestFor ?? null,
          would_return: !!wouldReturn,
        };

        const { error } = await supabase.from("spots").update(payload).eq("id", spotId);
        if (error) throw error;

        await upsertSpotTags(
          spotId,
          selectedTaggedUsers.map((u) => u.id)
        );

        Alert.alert("Saved", "Your DateSpot was updated.");
        navigation.goBack();
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "Failed to save changes.");
      } finally {
        setSaving(false);
      }
    },
    [
      atmosphere,
      bestFor,
      dateScore,
      name,
      navigation,
      notes,
      price,
      spotId,
      vibe,
      wouldReturn,
      selectedTaggedUsers,
    ]
  );

  const onCancel = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    // state
    loading,
    saving,

    // form state
    name,
    atmosphere,
    dateScore,
    notes,
    vibe,
    price,
    bestFor,
    wouldReturn,
    selectedTaggedUsers,
    eligibleTagUsers,
    tagUsersLoading,

    // setters (match NewSpotSheet)
    setName,
    setAtmosphere,
    setDateScore,
    setNotes,
    setVibe,
    setPrice,
    setBestFor,
    setWouldReturn,
    setSelectedTaggedUsers,
    setPartnerAnswer: (answer: PartnerAnswer) => {
      setPartnerAnswer(answer);
      if (answer === "yes") {
        setSelectedTaggedUsers((prev) => withPartnerTag(prev, activePartner));
        return;
      }
      if (answer === "no") {
        setSelectedTaggedUsers((prev) => withoutPartnerTag(prev, activePartner));
      }
    },

    // actions
    onSave,
    onCancel,
    activePartner,
    partnerAnswer,
  };
}
