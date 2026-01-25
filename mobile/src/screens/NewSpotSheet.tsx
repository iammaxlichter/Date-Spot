// src/screens/NewSpotSheet.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { styles } from "./styles";
import { sanitizeOneToTenInput } from "../lib/utils/numberInputValidation";
import type { Price, BestFor, VibePreset } from "../lib/types/datespot";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  name: string;
  atmosphere: string;
  dateScore: string;

  notes: string;
  vibe: string | null;
  price: Price | null;
  bestFor: BestFor | null;
  wouldReturn: boolean;

  onChangeName: (v: string) => void;
  onChangeAtmosphere: (v: string) => void;
  onChangeDateScore: (v: string) => void;

  onChangeNotes: (v: string) => void;
  onChangeVibe: (v: string | null) => void;
  onChangePrice: (v: Price | null) => void;
  onChangeBestFor: (v: BestFor | null) => void;
  onChangeWouldReturn: (v: boolean) => void;

  onCancel: () => void;
  onSave: () => void;
};

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          marginRight: 8,
          marginBottom: 8,
        },
        selected
          ? { backgroundColor: "#111", borderColor: "#111" }
          : { backgroundColor: "transparent", borderColor: "#ccc" },
      ]}
    >
      <Text style={selected ? { color: "#fff", fontWeight: "700" } : { color: "#111" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function NewSpotSheet({
  name,
  atmosphere,
  dateScore,
  notes,
  vibe,
  price,
  bestFor,
  wouldReturn,
  onChangeName,
  onChangeAtmosphere,
  onChangeDateScore,
  onChangeNotes,
  onChangeVibe,
  onChangePrice,
  onChangeBestFor,
  onChangeWouldReturn,
  onCancel,
  onSave,
}: Props) {
  const vibePresets: VibePreset[] = [
    "Chill",
    "Romantic",
    "Energetic",
    "Intimate",
    "Social",
    "Aesthetic",
  ];
  const prices: Price[] = ["$1-10", "$10-20", "$20-30", "$30-50", "$50-100", "$100+", "No $"];
  const bestFors: BestFor[] = ["Day", "Night", "Sunrise", "Sunset", "Any"];
  const insets = useSafeAreaInsets();

  const isPresetVibe = (v: string | null) =>
    !!v && vibePresets.includes(v as VibePreset);

  const [customVibe, setCustomVibe] = React.useState<string>(
    vibe && !isPresetVibe(vibe) ? vibe : ""
  );

  const [isCustomVibe, setIsCustomVibe] = React.useState<boolean>(
  !!vibe && !isPresetVibe(vibe)
  );


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.bottomSheet, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.sheetTitle}>New Date Spot</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Restaurant, café, park…"
          value={name}
          onChangeText={onChangeName}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.label}>Atmosphere (1 - 10)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={atmosphere}
              onChangeText={(text) => onChangeAtmosphere(sanitizeOneToTenInput(text))}
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
              onChangeText={(text) => onChangeDateScore(sanitizeOneToTenInput(text))}
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
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
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={onSave}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
