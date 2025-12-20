// src/screens/components/TopOverlay.tsx
import React from "react";
import { View, Text, TouchableOpacity, TextInput, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Place } from "../../../lib/api/places";
import type { GooglePrediction } from "../../../screens/Home/types";
import { styles } from "../../../screens/styles";
import { SuggestionsDropdown } from "./SuggestionsDropdown";

export function TopOverlay(props: {
  searchQuery: string;
  onChangeSearch: (text: string) => void;
  onSubmitSearch: () => void;
  showSuggestions: boolean;
  localMatches: Place[];
  googleResults: GooglePrediction[];
  searching: boolean;
  onSelectSaved: (spot: Place) => void;
  onSelectGoogle: (prediction: GooglePrediction) => void;
  onLogout: () => void;
  onAddSpot: () => void;
}) {
  const insets = useSafeAreaInsets();

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
    onLogout,
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

      <TouchableOpacity
        style={[styles.addPinButton, { marginTop: 8 }]}
        onPress={onLogout}
      >
        <Text style={styles.addPinText}>Logout</Text>
      </TouchableOpacity>

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
