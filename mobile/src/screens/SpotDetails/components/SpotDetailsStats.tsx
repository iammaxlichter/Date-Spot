// src/screens/SpotDetails/components/SpotStats.tsx
import React from "react";
import { View, Text } from "react-native";
import { s } from "../styles";

export function SpotStats(props: {
  atmosphere: string | null;
  dateScore: number | null;
  wouldReturn: boolean;
}) {
  const { atmosphere, dateScore, wouldReturn } = props;

  return (
    <View style={s.section}>
      <Text style={s.label}>Details</Text>

      <View style={s.statsGrid}>
        {dateScore != null ? (
          <View style={s.chipDate}>
            <Text style={s.chipDateText}>{dateScore}/10 Date Score</Text>
          </View>
        ) : null}

        {atmosphere != null ? (
          <View style={s.chipAtmo}>
            <Text style={s.chipAtmoText}>Atmosphere {atmosphere}/10</Text>
          </View>
        ) : null}

        <View style={[s.chipReturn, wouldReturn ? s.chipReturnYes : s.chipReturnNo]}>
          <Text style={[s.chipReturnText, wouldReturn ? s.chipReturnYesText : s.chipReturnNoText]}>
            {wouldReturn ? "Would Return" : "Wouldn't Return"}
          </Text>
        </View>
      </View>
    </View>
  );
}
