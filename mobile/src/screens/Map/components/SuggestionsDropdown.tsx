// src/screens/components/SuggestionsDropdown.tsx
import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { MapSpot } from "../../../services/api/spots";
import type { GooglePrediction } from "../types";
import { styles } from "../styles";

export function SuggestionsDropdown(props: {
  visible: boolean;
  localMatches: MapSpot[];
  googleResults: GooglePrediction[];
  searching: boolean;
  onSelectSaved: (spot: MapSpot) => void;
  onSelectGoogle: (prediction: GooglePrediction) => void;
}) {
  const {
    visible,
    localMatches,
    googleResults,
    searching,
    onSelectSaved,
    onSelectGoogle,
  } = props;

  if (!visible) return null;

  return (
    <View style={styles.suggestionsWrapper}>
      <ScrollView style={styles.suggestions} keyboardShouldPersistTaps="handled">
        {localMatches.map((spot) => (
          <TouchableOpacity
            key={`saved-${spot.id}`}
            style={styles.suggestionItem}
            onPress={() => onSelectSaved(spot)}
          >
            <Text style={styles.suggestionText}>{spot.name}</Text>
            <Text style={styles.suggestionSubText}>Saved spot</Text>
          </TouchableOpacity>
        ))}

        {googleResults.map((prediction) => (
          <TouchableOpacity
            key={`google-${prediction.place_id}`}
            style={styles.suggestionItem}
            onPress={() => onSelectGoogle(prediction)}
          >
            <Text style={styles.suggestionText}>{prediction.description}</Text>
          </TouchableOpacity>
        ))}

        {searching && (
          <View style={styles.suggestionItem}>
            <Text style={styles.searchingText}>Searching…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
