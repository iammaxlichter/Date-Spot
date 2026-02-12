import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { styles } from "../styles";
import type { TaggedUser } from "../../../services/api/spotTags";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

type Props = {
  visible: boolean;
  loading: boolean;
  users: TaggedUser[];
  selectedIds: string[];
  onClose: () => void;
  onToggleSelect: (user: TaggedUser) => void;
};

export function TagPeoplePicker(props: Props) {
  const { visible, loading, users, selectedIds, onClose, onToggleSelect } = props;
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebouncedValue(q, 200).trim().toLowerCase();

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = React.useMemo(() => {
    if (!debouncedQ) return users;
    return users.filter((u) => {
      const username = (u.username ?? "").toLowerCase();
      const name = (u.name ?? "").toLowerCase();
      return username.includes(debouncedQ) || name.includes(debouncedQ);
    });
  }, [debouncedQ, users]);

  React.useEffect(() => {
    if (!visible) setQ("");
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.tagPickerBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.tagPickerCard}>
          <View style={styles.tagPickerHeaderRow}>
            <Text style={styles.tagPickerTitle}>Tag people</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.tagPickerClose}>Done</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            value={q}
            onChangeText={setQ}
            placeholder="Start typing a username or name..."
            placeholderTextColor="#8a8a8a"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {loading ? (
            <View style={styles.tagPickerLoading}>
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filtered}
              keyExtractor={(item) => item.id}
              style={styles.tagPickerList}
              ListEmptyComponent={
                <Text style={styles.tagPickerEmpty}>No eligible users found.</Text>
              }
              renderItem={({ item }) => {
                const selected = selectedSet.has(item.id);
                const avatar = item.avatar_url
                  ? { uri: item.avatar_url }
                  : require("../../../../assets/default-avatar.png");

                return (
                  <Pressable
                    style={[styles.tagPickerRow, selected ? styles.tagPickerRowSelected : null]}
                    onPress={() => onToggleSelect(item)}
                  >
                    <Image source={avatar} style={styles.tagPickerAvatar} />
                    <View style={styles.tagPickerTextWrap}>
                      <Text style={styles.tagPickerUsername}>
                        @{item.username ?? "unknown"}
                      </Text>
                      {item.name ? (
                        <Text style={styles.tagPickerName}>{item.name}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.tagPickerCheck}>{selected ? "Selected" : "Select"}</Text>
                  </Pressable>
                );
              }}
            />
          )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
