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
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.menuCard} onPress={() => {}}>
          <Text style={s.menuSheetTitle}>Date Spot Partner</Text>

          <Pressable
            onPress={onRemove}
            disabled={removing}
            style={[s.menuDangerBtn, removing && { opacity: 0.6 }]}
          >
            <Text style={s.menuDangerBtnText}>
              {removing ? "Removing..." : "Remove Date Spot Partner"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={s.menuCancelBtn}>
            <Text style={s.menuCancelBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
