// src/screens/components/PinPlacementOverlay.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../styles";

export function PinPlacementOverlay(props: {
  visible: boolean;
  onCancel: () => void;
  onNext: () => void;
}) {
  const { visible, onCancel, onNext } = props;

  if (!visible) return null;

  return (
    <View style={styles.pinGuideOverlay} pointerEvents="box-none">
      <View style={styles.pinGuideCard} pointerEvents="none">
        <Text style={styles.pinGuideTitle}>Place your pin</Text>
        <Text style={styles.pinGuideText}>
          Drag the red pin to the exact spot. When it's right, tap Next.
        </Text>
      </View>

      <View style={styles.pinGuideActions} pointerEvents="box-none">
        <TouchableOpacity style={styles.pinGuideCancel} onPress={onCancel}>
          <Text style={styles.pinGuideCancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pinGuideNext} onPress={onNext}>
          <Text style={styles.pinGuideNextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
