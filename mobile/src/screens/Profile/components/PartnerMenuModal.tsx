import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { s } from "../styles";

export function PartnerMenuModal(props: {
  visible: boolean;
  hasPartner: boolean;
  removingPartner: boolean;
  onRemovePartner: () => void;
  onClose: () => void;
}) {
  const { visible, hasPartner, removingPartner, onRemovePartner, onClose } = props;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <View style={s.menuCard}>
          {hasPartner ? (
            <Pressable
              onPress={onRemovePartner}
              disabled={removingPartner}
              style={[s.menuItem, removingPartner && { opacity: 0.6 }]}
            >
              <Text style={s.menuDanger}>
                {removingPartner ? "Removing..." : "Remove DateSpot partner"}
              </Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} style={s.menuItem}>
            <Text style={s.menuCancel}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
