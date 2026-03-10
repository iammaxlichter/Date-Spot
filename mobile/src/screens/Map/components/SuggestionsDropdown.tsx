// src/screens/components/SuggestionsDropdown.tsx
import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { MapSpot } from "../../../services/api/spots";
import type { GooglePrediction } from "../types";
import { styles } from "../styles";

function getSpotCategoryLabel(spot: MapSpot): string {
  const raw = (spot.vibe ?? "").trim();
  if (!raw) return "Misc";
  return raw;
}

function getSpotCategoryIcon(spot: MapSpot): keyof typeof MaterialIcons.glyphMap {
  const category = `${spot.vibe ?? ""} ${spot.name}`.toLowerCase();

  if (
    category.includes("food") ||
    category.includes("restaurant") ||
    category.includes("dinner") ||
    category.includes("brunch") ||
    category.includes("lunch")
  ) {
    return "restaurant";
  }

  if (category.includes("coffee") || category.includes("cafe") || category.includes("tea")) {
    return "local-cafe";
  }

  if (category.includes("bar") || category.includes("drink") || category.includes("night")) {
    return "local-bar";
  }

  if (
    category.includes("park") ||
    category.includes("trail") ||
    category.includes("nature") ||
    category.includes("hike")
  ) {
    return "park";
  }

  if (category.includes("movie") || category.includes("cinema")) {
    return "local-movies";
  }

  if (category.includes("activity") || category.includes("fun") || category.includes("arcade")) {
    return "sports-esports";
  }

  return "category";
}

function getGoogleCategoryFromTypes(prediction: GooglePrediction): {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
} {
  const types = prediction.types ?? [];
  const haystack = `${types.join(" ")} ${prediction.description}`.toLowerCase();

  if (
    haystack.includes("restaurant") ||
    haystack.includes("food") ||
    haystack.includes("cafe") ||
    haystack.includes("coffee") ||
    haystack.includes("bakery") ||
    haystack.includes("bar") ||
    haystack.includes("meal")
  ) {
    return { label: "Food & Drink", icon: "restaurant" };
  }

  if (
    haystack.includes("park") ||
    haystack.includes("tourist_attraction") ||
    haystack.includes("museum") ||
    haystack.includes("movie_theater") ||
    haystack.includes("bowling") ||
    haystack.includes("amusement_park") ||
    haystack.includes("zoo") ||
    haystack.includes("aquarium")
  ) {
    return { label: "Activity", icon: "attractions" };
  }

  if (haystack.includes("shopping_mall") || haystack.includes("store")) {
    return { label: "Shopping", icon: "local-mall" };
  }

  if (haystack.includes("lodging") || haystack.includes("hotel")) {
    return { label: "Stay", icon: "hotel" };
  }

  if (haystack.includes("gym") || haystack.includes("spa")) {
    return { label: "Wellness", icon: "spa" };
  }

  return { label: "Google place", icon: "place" };
}

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
            <View style={styles.suggestionTextWrap}>
              <Text style={styles.suggestionText} numberOfLines={1}>
                {spot.name}
              </Text>
              <Text style={styles.suggestionSubText} numberOfLines={1}>
                Saved spot · {getSpotCategoryLabel(spot)}
              </Text>
            </View>
            <View style={styles.suggestionIconPill}>
              <MaterialIcons
                name={getSpotCategoryIcon(spot)}
                size={17}
                color="#D91B46"
              />
            </View>
          </TouchableOpacity>
        ))}

        {googleResults.map((prediction) => {
          const googleCategory = getGoogleCategoryFromTypes(prediction);
          return (
          <TouchableOpacity
            key={`google-${prediction.place_id}`}
            style={styles.suggestionItem}
            onPress={() => onSelectGoogle(prediction)}
          >
            <View style={styles.suggestionTextWrap}>
              <Text style={styles.suggestionText}>{prediction.description}</Text>
              <Text style={styles.suggestionSubText}>{googleCategory.label}</Text>
            </View>
            <View style={styles.suggestionIconPill}>
              <MaterialIcons name={googleCategory.icon} size={17} color="#D91B46" />
            </View>
          </TouchableOpacity>
          );
        })}

        {searching && (
          <View style={styles.suggestionItem}>
            <Text style={styles.searchingText}>Searching…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
