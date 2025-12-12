// src/screens/NewSpotSheet.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "./styles";

type Props = {
  name: string;
  atmosphere: string;
  dateScore: string;
  onChangeName: (v: string) => void;
  onChangeAtmosphere: (v: string) => void;
  onChangeDateScore: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function NewSpotSheet({
  name,
  atmosphere,
  dateScore,
  onChangeName,
  onChangeAtmosphere,
  onChangeDateScore,
  onCancel,
  onSave,
}: Props) {
  return (
    <View style={styles.bottomSheet}>
      <Text style={styles.sheetTitle}>New Date Spot</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Restaurant, café, park…"
        value={name}
        onChangeText={onChangeName}
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={styles.label}>Atmosphere (1–10)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={atmosphere}
            onChangeText={onChangeAtmosphere}
          />
        </View>

        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={styles.label}>Date Score (1–10)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={dateScore}
            onChangeText={onChangeDateScore}
          />
        </View>
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
  );
}
