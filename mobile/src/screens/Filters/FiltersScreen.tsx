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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { getMapSpotVibes, getPeopleOnMyMap } from "../../services/api/spots";
import { FilterChip } from "./components/FilterChip";
import { FilterCheckboxRow } from "./components/FilterCheckboxRow";
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
        if (!cancelled) {
          setLoadingPeople(false);
        }
      }
    };

    void loadFilterData();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleString = (items: string[], value: string) => {
    return items.includes(value) ? items.filter((v) => v !== value) : [...items, value];
  };

  const toggleNumber = (items: number[], value: number) => {
    return items.includes(value) ? items.filter((v) => v !== value) : [...items, value];
  };

  const toggleBoolean = (items: boolean[], value: boolean) => {
    return items.includes(value) ? items.filter((v) => v !== value) : [...items, value];
  };

  const togglePrice = (items: Price[], value: Price) => {
    return items.includes(value) ? items.filter((v) => v !== value) : [...items, value];
  };

  const toggleBestFor = (items: BestFor[], value: BestFor) => {
    return items.includes(value) ? items.filter((v) => v !== value) : [...items, value];
  };

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Sort</Text>
        {sortOptions.map((option) => (
          <FilterCheckboxRow
            key={option.value}
            label={option.label}
            checked={draft.sortOption === option.value}
            onPress={() => setDraft((prev) => ({ ...prev, sortOption: option.value }))}
          />
        ))}

        <Text style={styles.sectionTitle}>Spot Attributes</Text>

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

        <Text style={styles.label}>Atmosphere (1 - 10)</Text>
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

        <Text style={styles.label}>Date score (1 - 10)</Text>
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

        <Text style={styles.sectionTitle}>People</Text>
        <TextInput
          value={peopleSearch}
          onChangeText={setPeopleSearch}
          placeholder="Search people on my map"
          style={styles.searchInput}
        />

        {loadingPeople ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  label: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#222",
    marginTop: 4,
    marginBottom: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#ececec",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 10,
  },
  resetBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  resetText: {
    color: "#222",
    fontSize: 15,
    fontWeight: "600",
  },
  applyBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#111",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  applyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
