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
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.menuCard} onPress={() => {}}>
          <Text style={s.menuSheetTitle}>Date Spot Partner</Text>

          {hasPartner ? (
            <Pressable
              onPress={onRemovePartner}
              disabled={removingPartner}
              style={[s.menuDangerBtn, removingPartner && { opacity: 0.6 }]}
            >
              <Text style={s.menuDangerBtnText}>
                {removingPartner ? "Removing..." : "Remove Date Spot Partner"}
              </Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} style={s.menuCancelBtn}>
            <Text style={s.menuCancelBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
