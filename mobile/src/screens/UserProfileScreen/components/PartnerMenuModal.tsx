import React from "react";
import { Modal, View, Pressable, Text } from "react-native";
import { s } from "../styles";

export function PartnerMenuModal(props: {
  visible: boolean;
  onClose: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const { visible, onClose, onRemove, removing } = props;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.modalBackdrop}>
        <View style={s.menuCard}>
          <Pressable
            onPress={onRemove}
            disabled={removing}
            style={[s.menuItem, removing && { opacity: 0.6 }]}
          >
            <Text style={s.menuDanger}>
              {removing ? "Removing..." : "Remove DateSpot partner"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={s.menuItem}>
            <Text style={s.menuCancel}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
