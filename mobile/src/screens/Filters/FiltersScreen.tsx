import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { getMapSpotVibes, getPeopleOnMyMap } from "../../services/api/spots";
import { FilterChip } from "./components/FilterChip";
import { FilterCheckboxRow } from "./components/FilterCheckboxRow";
import { AppBackButton } from "../../components/navigation/AppBackButton";
import type { SpotSortOption } from "../../features/filters/types";
import type { BestFor, Price } from "../../types/datespot";
import {
  BEST_FOR_OPTIONS,
  DEFAULT_SPOT_FILTERS,
  PRICE_BUCKETS,
  VIBE_PRESETS,
  type SpotFilters,
} from "../../features/filters/types";
import { useSpotFiltersStore } from "../../stores/spotFiltersStore";

type Props = NativeStackScreenProps<RootStackParamList, "Filters">;

export default function FiltersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const filters = useSpotFiltersStore((state) => state.filters);
  const setFilters = useSpotFiltersStore((state) => state.setFilters);
  const resetFilters = useSpotFiltersStore((state) => state.resetFilters);

  const [draft, setDraft] = React.useState<SpotFilters>(filters);
  const [loadingPeople, setLoadingPeople] = React.useState(false);
  const [peopleSearch, setPeopleSearch] = React.useState("");
  const [availableVibes, setAvailableVibes] = React.useState<string[]>(VIBE_PRESETS);
  const [peopleOnMap, setPeopleOnMap] = React.useState<
    Array<{ user_id: string; display_name: string; avatar_url: string | null }>
  >([]);

  useFocusEffect(
    React.useCallback(() => {
      setDraft(filters);
    }, [filters])
  );

  React.useEffect(() => {
    let cancelled = false;

    const loadFilterData = async () => {
      setLoadingPeople(true);
      try {
        const [vibes, people] = await Promise.all([getMapSpotVibes(500), getPeopleOnMyMap(500)]);
        if (cancelled) return;

        const extraVibes = vibes.filter((vibe) => !VIBE_PRESETS.includes(vibe));
        setAvailableVibes([...VIBE_PRESETS, ...extraVibes]);
        setPeopleOnMap(people);
      } catch (error) {
        console.error("[filters] failed loading people/options:", error);
      } finally {
        if (!cancelled) setLoadingPeople(false);
      }
    };

    void loadFilterData();
    return () => { cancelled = true; };
  }, []);

  const toggleString = (items: string[], value: string) =>
    items.includes(value) ? items.filter((v) => v !== value) : [...items, value];

  const toggleNumber = (items: number[], value: number) =>
    items.includes(value) ? items.filter((v) => v !== value) : [...items, value];

  const toggleBoolean = (items: boolean[], value: boolean) =>
    items.includes(value) ? items.filter((v) => v !== value) : [...items, value];

  const togglePrice = (items: Price[], value: Price) =>
    items.includes(value) ? items.filter((v) => v !== value) : [...items, value];

  const toggleBestFor = (items: BestFor[], value: BestFor) =>
    items.includes(value) ? items.filter((v) => v !== value) : [...items, value];

  const filteredPeople = React.useMemo(() => {
    const query = peopleSearch.trim().toLowerCase();
    if (!query) return peopleOnMap;
    return peopleOnMap.filter((person) => person.display_name.toLowerCase().includes(query));
  }, [peopleOnMap, peopleSearch]);

  const sortOptions: Array<{ value: SpotSortOption; label: string }> = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "highestDateScore", label: "Highest date score" },
    { value: "highestAtmosphere", label: "Highest atmosphere" },
  ];

  const onReset = () => {
    resetFilters();
    setDraft(DEFAULT_SPOT_FILTERS);
  };

  const onApply = () => {
    setFilters(draft);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.backButton}>
          <AppBackButton onPress={() => navigation.goBack()} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Spots</Text>
          <Text style={styles.title}>Filters</Text>
          <Text style={styles.subtitle}>Narrow down your map to spots that match your vibe.</Text>
        </View>

        {/* Sort */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sort by</Text>
          {sortOptions.map((option, index) => (
            <View
              key={option.value}
              style={index === sortOptions.length - 1 ? styles.lastRow : undefined}
            >
              <FilterCheckboxRow
                label={option.label}
                checked={draft.sortOption === option.value}
                onPress={() => setDraft((prev) => ({ ...prev, sortOption: option.value }))}
              />
            </View>
          ))}
        </View>

        {/* Spot Attributes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spot attributes</Text>

          <Text style={styles.label}>Vibe</Text>
          <View style={styles.chipsWrap}>
            {availableVibes.map((value) => (
              <FilterChip
                key={value}
                label={value}
                selected={draft.selectedVibes.includes(value)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    selectedVibes: toggleString(prev.selectedVibes, value),
                  }))
                }
              />
            ))}
          </View>

          <Text style={styles.label}>Atmosphere (1–10)</Text>
          <View style={styles.chipsWrap}>
            {Array.from({ length: 10 }).map((_, index) => {
              const value = index + 1;
              return (
                <FilterChip
                  key={`atmosphere-${value}`}
                  label={`${value}`}
                  selected={draft.selectedAtmospheres.includes(value)}
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      selectedAtmospheres: toggleNumber(prev.selectedAtmospheres, value),
                    }))
                  }
                />
              );
            })}
          </View>

          <Text style={styles.label}>Date score (1–10)</Text>
          <View style={styles.chipsWrap}>
            {Array.from({ length: 10 }).map((_, index) => {
              const value = index + 1;
              return (
                <FilterChip
                  key={`date-score-${value}`}
                  label={`${value}`}
                  selected={draft.selectedDateScores.includes(value)}
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      selectedDateScores: toggleNumber(prev.selectedDateScores, value),
                    }))
                  }
                />
              );
            })}
          </View>

          <Text style={styles.label}>Price</Text>
          <View style={styles.chipsWrap}>
            {PRICE_BUCKETS.map((bucket) => (
              <FilterChip
                key={bucket}
                label={bucket}
                selected={draft.selectedPriceBuckets.includes(bucket)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    selectedPriceBuckets: togglePrice(prev.selectedPriceBuckets, bucket),
                  }))
                }
              />
            ))}
          </View>

          <Text style={styles.label}>Best for</Text>
          <View style={styles.chipsWrap}>
            {BEST_FOR_OPTIONS.map((bestFor) => (
              <FilterChip
                key={bestFor}
                label={bestFor}
                selected={draft.selectedBestFors.includes(bestFor)}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    selectedBestFors: toggleBestFor(prev.selectedBestFors, bestFor),
                  }))
                }
              />
            ))}
          </View>

          <Text style={styles.label}>Would return</Text>
          <View style={styles.chipsWrap}>
            <FilterChip
              label="Yes"
              selected={draft.selectedWouldReturn.includes(true)}
              onPress={() =>
                setDraft((prev) => ({
                  ...prev,
                  selectedWouldReturn: toggleBoolean(prev.selectedWouldReturn, true),
                }))
              }
            />
            <FilterChip
              label="No"
              selected={draft.selectedWouldReturn.includes(false)}
              onPress={() =>
                setDraft((prev) => ({
                  ...prev,
                  selectedWouldReturn: toggleBoolean(prev.selectedWouldReturn, false),
                }))
              }
            />
          </View>
        </View>

        {/* People */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>People</Text>
          <TextInput
            value={peopleSearch}
            onChangeText={setPeopleSearch}
            placeholder="Search people on my map..."
            placeholderTextColor="#9A9A9A"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {loadingPeople ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="large" color="#E21E4D"  />
              <Text style={styles.loadingText}>Loading people...</Text>
            </View>
          ) : filteredPeople.length === 0 ? (
            <Text style={styles.emptyText}>No people found.</Text>
          ) : (
            filteredPeople.map((person) => (
              <FilterCheckboxRow
                key={person.user_id}
                label={person.display_name}
                checked={draft.selectedUserIds.includes(person.user_id)}
                avatarUrl={person.avatar_url}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    selectedUserIds: toggleString(prev.selectedUserIds, person.user_id),
                  }))
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <TouchableOpacity style={styles.resetBtn} onPress={onReset} activeOpacity={0.75}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <Text style={styles.applyText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 32,
  },
  hero: {
    marginBottom: 20,
  },
  eyebrow: {
    color: "#D91B46",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "800",
    color: "#1D1D1D",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#616161",
  },
  card: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#232323",
    marginBottom: 4,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3C3C3C",
    marginTop: 14,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#191919",
    backgroundColor: "#FFFFFF",
    marginTop: 4,
    marginBottom: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    color: "#9A9A9A",
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: "#9A9A9A",
    marginTop: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  resetBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  resetText: {
    color: "#4A4A4A",
    fontSize: 15,
    fontWeight: "600",
  },
  applyBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E21E4D",
  },
  applyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
