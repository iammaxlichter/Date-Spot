// src/screens/NewSpotSheet/NewSpotSheetScreen.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { styles } from "./styles";
import { sanitizeOneToTenInput } from "../../app/utils/numberInputValidation";
import type { Price, BestFor, VibePreset } from "../../types/datespot";
import type { TaggedUser } from "../../services/api/spotTags";

import type { Props } from "./types";
import { Chip } from "./components/Chip";
import { SpotPhotosPicker } from "./components/SpotPhotosPicker";
import { TagPeoplePicker } from "./components/TagPeoplePicker";

export function NewSpotSheetScreen({
  name,
  atmosphere,
  dateScore,
  notes,
  vibe,
  price,
  bestFor,
  wouldReturn,
  title,
  photos,
  debugLabel,
  setPhotos,
  enableFullscreenPreview,
  selectedTaggedUsers,
  eligibleTagUsers,
  tagUsersLoading,
  activePartner,
  partnerAnswer,
  onChangeName,
  onChangeAtmosphere,
  onChangeDateScore,
  onChangeNotes,
  onChangeVibe,
  onChangePrice,
  onChangeBestFor,
  onChangeWouldReturn,
  onChangeTaggedUsers,
  onChangePartnerAnswer,
  onCancel,
  onSave,
  isSaving = false,
}: Props) {
  const vibePresets: VibePreset[] = [
    "Chill",
    "Romantic",
    "Energetic",
    "Intimate",
    "Social",
    "Aesthetic",
  ];
  const prices: Price[] = [
    "$1-10",
    "$10-20",
    "$20-30",
    "$30-50",
    "$50-100",
    "$100+",
    "No $",
  ];
  const bestFors: BestFor[] = ["Day", "Night", "Sunrise", "Sunset", "Any"];

  const isPresetVibe = (v: string | null) =>
    !!v && vibePresets.includes(v as VibePreset);

  const [customVibe, setCustomVibe] = React.useState<string>(
    vibe && !isPresetVibe(vibe) ? vibe : ""
  );

  const [isCustomVibe, setIsCustomVibe] = React.useState<boolean>(
    !!vibe && !isPresetVibe(vibe)
  );
  const [tagPickerOpen, setTagPickerOpen] = React.useState(false);
  const partnerTagged = !!activePartner && selectedTaggedUsers.some((u) => u.id === activePartner.id);
  const showPartnerQuestion = !!activePartner;
  const showStandardTagging = !activePartner || partnerAnswer === "no";
  const showPartnerConfirmation = !!activePartner && partnerAnswer === "yes" && partnerTagged;
  const tagPickerUsers = React.useMemo(() => {
    if (partnerAnswer === "no" && activePartner) {
      return eligibleTagUsers.filter((u) => u.id !== activePartner.id);
    }
    return eligibleTagUsers;
  }, [activePartner, eligibleTagUsers, partnerAnswer]);

  const removeTaggedUser = (userId: string) => {
    if (activePartner && partnerAnswer === "yes" && userId === activePartner.id) {
      return;
    }
    onChangeTaggedUsers(selectedTaggedUsers.filter((user) => user.id !== userId));
  };

  const toggleTaggedUser = (user: TaggedUser) => {
    const exists = selectedTaggedUsers.some((u) => u.id === user.id);
    if (exists) {
      onChangeTaggedUsers(selectedTaggedUsers.filter((u) => u.id !== user.id));
    } else {
      onChangeTaggedUsers([...selectedTaggedUsers, user]);
    }
  };

  return (
    <View style={styles.bottomSheet}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
          <Text style={styles.sheetTitle}>{title ?? "New Date Spot"}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Restaurant, café, park…"
            value={name}
            onChangeText={onChangeName}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <SpotPhotosPicker
            photos={photos}
            setPhotos={setPhotos}
            debugLabel={debugLabel}
            enableFullscreenPreview={enableFullscreenPreview}
          />

          <View style={styles.tagPeopleSection}>
            {showPartnerQuestion ? (
              <View style={styles.partnerPromptCard}>
                <Text style={styles.partnerPromptTitle}>
                  Did you go with your DateSpot partner @{activePartner?.username ?? "your-partner"}?
                </Text>
                <View style={styles.partnerPromptButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.partnerPromptButton,
                      partnerAnswer === "yes" ? styles.partnerPromptButtonYes : null,
                    ]}
                    onPress={() => onChangePartnerAnswer("yes")}
                  >
                    <Text
                      style={[
                        styles.partnerPromptButtonText,
                        partnerAnswer === "yes" ? styles.partnerPromptButtonTextSelected : null,
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.partnerPromptButton,
                      partnerAnswer === "no" ? styles.partnerPromptButtonNo : null,
                    ]}
                    onPress={() => onChangePartnerAnswer("no")}
                  >
                    <Text
                      style={[
                        styles.partnerPromptButtonText,
                        partnerAnswer === "no" ? styles.partnerPromptButtonTextSelected : null,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>

                {showPartnerConfirmation ? (
                  <View style={styles.partnerConfirmRow}>
                    <Text style={styles.partnerConfirmText}>
                      With: @{activePartner?.username ?? "partner"} ✓
                    </Text>
                    <TouchableOpacity
                      style={styles.partnerAddOthersBtn}
                      onPress={() => setTagPickerOpen(true)}
                    >
                      <Text style={styles.partnerAddOthersBtnText}>Add others</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}

            {showStandardTagging ? (
              <View style={styles.tagPeopleHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tagPeopleTitle}>Went with</Text>
                  <Text style={styles.tagPeopleSubtext}>Tag people you follow</Text>
                </View>
                <TouchableOpacity
                  style={styles.tagPeopleAddBtn}
                  onPress={() => setTagPickerOpen(true)}
                >
                  <Text style={styles.tagPeopleAddBtnText}>Add people</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {selectedTaggedUsers.length > 0 ? (
              <View style={styles.tagPeopleChipsWrap}>
                {selectedTaggedUsers.map((user) => (
                  <View key={user.id} style={styles.taggedChip}>
                    <Text style={styles.taggedChipText}>@{user.username ?? "unknown"}</Text>
                    {activePartner && partnerAnswer === "yes" && user.id === activePartner.id ? null : (
                      <TouchableOpacity
                        onPress={() => removeTaggedUser(user.id)}
                        hitSlop={8}
                        style={styles.taggedChipRemoveBtn}
                      >
                        <Text style={styles.taggedChipRemoveText}>x</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.tagPeopleEmpty}>
                {showStandardTagging ? "No people tagged yet." : "No additional people tagged."}
              </Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.label}>Atmosphere (1 - 10)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={atmosphere}
                onChangeText={(text) =>
                  onChangeAtmosphere(sanitizeOneToTenInput(text))
                }
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.label}>Date Score (1 - 10)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={dateScore}
                onChangeText={(text) =>
                  onChangeDateScore(sanitizeOneToTenInput(text))
                }
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            placeholder="Anything to remember…"
            value={notes}
            onChangeText={onChangeNotes}
            multiline
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Vibe</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {vibePresets.map((v) => (
              <Chip
                key={v}
                label={v}
                selected={vibe === v}
                onPress={() => {
                  setIsCustomVibe(false);
                  setCustomVibe("");
                  onChangeVibe(vibe === v ? null : v);
                }}
              />
            ))}

            <Chip
              label="Other"
              selected={!!vibe && !isPresetVibe(vibe)}
              onPress={() => {
                Keyboard.dismiss();
                setIsCustomVibe((prev) => !prev);

                // If turning OFF custom mode, clear vibe
                if (isCustomVibe) {
                  setCustomVibe("");
                  onChangeVibe(null);
                } else {
                  // Turning ON custom mode: keep current customVibe (or empty)
                  onChangeVibe(customVibe.trim() ? customVibe.trim() : null);
                }
              }}
            />
          </View>

          {isCustomVibe && (
            <TextInput
              style={styles.input}
              placeholder="Type a custom vibe…"
              value={customVibe}
              onChangeText={(text) => {
                setCustomVibe(text);
                const trimmed = text.trim();
                onChangeVibe(trimmed.length ? trimmed : null);
              }}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          )}

          <Text style={styles.label}>Price</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {prices.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={price === p}
                onPress={() => onChangePrice(price === p ? null : p)}
              />
            ))}
          </View>

          <Text style={styles.label}>Best for</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {bestFors.map((b) => (
              <Chip
                key={b}
                label={b}
                selected={bestFor === b}
                onPress={() => onChangeBestFor(bestFor === b ? null : b)}
              />
            ))}
          </View>

          <Text style={styles.label}>Would return?</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Chip
              label="Yes"
              selected={wouldReturn === true}
              onPress={() => onChangeWouldReturn(true)}
            />
            <Chip
              label="No"
              selected={wouldReturn === false}
              onPress={() => onChangeWouldReturn(false)}
            />
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, isSaving && { opacity: 0.4 }]}
              onPress={onCancel}
              disabled={isSaving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, isSaving && { opacity: 0.7 }]}
              onPress={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.saveText}>Saving…</Text>
                </View>
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
      </ScrollView>

      <TagPeoplePicker
        visible={tagPickerOpen}
        loading={tagUsersLoading}
        users={tagPickerUsers}
        selectedIds={selectedTaggedUsers.map((u) => u.id)}
        onClose={() => setTagPickerOpen(false)}
        onToggleSelect={toggleTaggedUser}
      />
    </View>
  );
}
