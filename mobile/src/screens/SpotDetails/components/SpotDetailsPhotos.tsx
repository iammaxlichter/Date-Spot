import React from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { ExistingSpotPhoto } from "../../../types/spotPhotos";
import { s } from "../styles";

export function SpotDetailsPhotos(props: {
  photos: ExistingSpotPhoto[];
  enableFullscreen?: boolean;
}) {
  const { photos, enableFullscreen = false } = props;
  const [openPhotoUrl, setOpenPhotoUrl] = React.useState<string | null>(null);

  if (!photos.length) return null;

  return (
    <>
      <View style={s.photoSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.photoRow}
        >
          {photos.map((p) => {
            if (!enableFullscreen) {
              return <Image key={p.id} source={{ uri: p.signedUrl }} style={s.photoThumb} />;
            }

            return (
              <Pressable key={p.id} onPress={() => setOpenPhotoUrl(p.signedUrl)}>
                <Image source={{ uri: p.signedUrl }} style={s.photoThumb} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Modal
        visible={!!openPhotoUrl}
        animationType="fade"
        transparent
        onRequestClose={() => setOpenPhotoUrl(null)}
      >
        <View style={s.photoModalBackdrop}>
          <Pressable style={s.photoModalClose} onPress={() => setOpenPhotoUrl(null)}>
            <Text style={s.photoModalCloseText}>Close</Text>
          </Pressable>

          {openPhotoUrl ? (
            <Image source={{ uri: openPhotoUrl }} style={s.photoModalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </>
  );
}
