// src/screens/components/TopOverlay.tsx
import React from "react";
import { View, Text, TouchableOpacity, TextInput, Keyboard } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { MapSpot } from "../../../services/api/spots";
import type { GooglePrediction } from "../types";
import { styles } from "../styles";
import { SuggestionsDropdown } from "./SuggestionsDropdown";

export function TopOverlay(props: {
  searchQuery: string;
  onChangeSearch: (text: string) => void;
  onSubmitSearch: () => void;
  showSuggestions: boolean;
  localMatches: MapSpot[];
  googleResults: GooglePrediction[];
  searching: boolean;
  onSelectSaved: (spot: MapSpot) => void;
  onSelectGoogle: (prediction: GooglePrediction) => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
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
    onOpenFilters,
    hasActiveFilters,
    activeFilterCount,
    onAddSpot,
  } = props;

  return (
    <View style={[styles.topOverlay, { top: 10 }]}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places or date spots"
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

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addPinButton} onPress={onAddSpot}>
          <Text style={styles.addPinText}>Add Date Spot</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filtersButton} onPress={onOpenFilters}>
          <MaterialIcons name="filter-list" size={20} color="#333" style={styles.filtersButtonIcon} />
          <Text style={styles.filtersButtonText}>Filters</Text>
          {hasActiveFilters ? <View style={styles.filtersActiveDot} /> : null}
        </TouchableOpacity>
      </View>

      {hasActiveFilters ? (
        <Text style={styles.activeFiltersLabel}>Filters: {activeFilterCount} active</Text>
      ) : null}
    </View>
  );
}
