// src/screens/SpotDetails/components/SpotNotes.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { s } from "../styles";

export function SpotNotes(props: {
  notes: string;
  shortNotes: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { notes, shortNotes, expanded, onToggle } = props;

  return (
    <View style={s.section}>
      <Text style={s.label}>Notes</Text>

      <Text style={s.notes}>
        {expanded ? notes || "—" : shortNotes || "—"}
      </Text>

      {notes.length > 180 ? (
        <Pressable onPress={onToggle} hitSlop={8}>
          <Text style={s.link}>{expanded ? "Show less" : "Show more"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
