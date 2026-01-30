// src/screens/SpotDetails/components/SpotTags.tsx
import React from "react";
import { View, Text } from "react-native";
import { s } from "../styles";

export function SpotTags(props: {
  vibe: string | null;
  price: string | null;
  bestFor: string | null;
}) {
  const { vibe, price, bestFor } = props;

  return (
    <View style={s.section}>
      <Text style={s.label}>Tags</Text>
      <View style={s.metaRow}>
        {vibe ? <Text style={s.pill}>{vibe}</Text> : null}
        {price ? <Text style={s.pill}>{price}</Text> : null}
        {bestFor ? <Text style={s.pill}>{bestFor}</Text> : null}
      </View>
    </View>
  );
}
