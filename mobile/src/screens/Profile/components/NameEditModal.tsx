import React from "react";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
import { s } from "../styles";

export function NameEditModal(props: {
  visible: boolean;
  nameDraft: string;
  savingName: boolean;
  onChangeName: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { visible, nameDraft, savingName, onChangeName, onClose, onSave } = props;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>Edit name</Text>

          <TextInput
            value={nameDraft}
            onChangeText={onChangeName}
            placeholder="Your name"
            style={s.modalInput}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
          />

          <View style={s.modalButtons}>
            <Pressable
              onPress={onClose}
              disabled={savingName}
              style={[s.modalBtn, s.modalBtnSecondary, savingName && { opacity: 0.6 }]}
            >
              <Text style={s.modalBtnTextSecondary}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onSave}
              disabled={savingName}
              style={[s.modalBtn, s.modalBtnPrimary, savingName && { opacity: 0.6 }]}
            >
              <Text style={s.modalBtnTextPrimary}>{savingName ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
