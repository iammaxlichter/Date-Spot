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
      <View style={s.row}>
        <Text style={s.k}>Atmosphere</Text>
        <Text style={s.v}>{atmosphere ?? "—"}</Text>
      </View>

      <View style={s.row}>
        <Text style={s.k}>Date score</Text>
        <Text style={s.v}>{dateScore ?? "—"}</Text>
      </View>

      <View style={s.row}>
        <Text style={s.k}>Would return</Text>
        <Text style={s.v}>{wouldReturn ? "Yes" : "No"}</Text>
      </View>
    </View>
  );
}
