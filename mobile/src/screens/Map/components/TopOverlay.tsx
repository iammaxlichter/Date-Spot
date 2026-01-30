// src/screens/components/TopOverlay.tsx
import React from "react";
import { View, Text, TouchableOpacity, TextInput, Keyboard } from "react-native";
import type { Spot } from "../../../services/api/spots";
import type { GooglePrediction } from "../types";
import { styles } from "../styles";
import { SuggestionsDropdown } from "./SuggestionsDropdown";

export function TopOverlay(props: {
  searchQuery: string;
  onChangeSearch: (text: string) => void;
  onSubmitSearch: () => void;
  showSuggestions: boolean;
  localMatches: Spot[];
  googleResults: GooglePrediction[];
  searching: boolean;
  onSelectSaved: (spot: Spot) => void;
  onSelectGoogle: (prediction: GooglePrediction) => void;
  onAddSpot: () => void;
}) {
  const {
    searchQuery,
    onChangeSearch,
    onSubmitSearch,
    showSuggestions,
    localMatches,
    googleResults,
    searching,
    onSelectSaved,
    onSelectGoogle,
    onAddSpot,
  } = props;

  return (
    <View style={[styles.topOverlay, { top: 10 }]}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places or date spots…"
          value={searchQuery}
          onChangeText={onChangeSearch}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            onSubmitSearch();
          }}
        />
      </View>

      <SuggestionsDropdown
        visible={
          showSuggestions &&
          (localMatches.length > 0 || googleResults.length > 0 || searching)
        }
        localMatches={localMatches}
        googleResults={googleResults}
        searching={searching}
        onSelectSaved={onSelectSaved}
        onSelectGoogle={onSelectGoogle}
      />

      <TouchableOpacity style={styles.addPinButton} onPress={onAddSpot}>
        <Text style={styles.addPinText}>Add Date Spot</Text>
      </TouchableOpacity>
    </View>
  );
}
