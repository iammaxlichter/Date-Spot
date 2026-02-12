// src/screens/NewSpotSheet/components/SpotPhotosPicker.tsx
import * as React from "react";
import { Alert, Image, Modal, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import type { SpotPhotoItem, LocalSpotPhoto } from "../../../types/spotPhotos";

export type SpotPhotosPickerValue = {
    photos: SpotPhotoItem[];
    setPhotos: React.Dispatch<React.SetStateAction<SpotPhotoItem[]>>;
    editable?: boolean;
    enableFullscreenPreview?: boolean;
    debugLabel?: string;
};

const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
]);

function randomId() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function inferMimeType(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".heic")) return "image/heic";
    if (lower.endsWith(".heif")) return "image/heif";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    return "image/jpeg";
}

async function compressIfNeeded(
    uri: string,
    mimeType: string
): Promise<{ uri: string; mimeType: string }> {
    // Convert everything to JPEG for consistency / smaller uploads
    const format: ImageManipulator.SaveFormat = ImageManipulator.SaveFormat.JPEG;

    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.82, format }
    );

    return { uri: result.uri, mimeType: "image/jpeg" };
}

export function SpotPhotosPicker(props: SpotPhotosPickerValue) {
    const {
    photos: rawPhotos,
    setPhotos,
    editable = true,
    enableFullscreenPreview = false,
    debugLabel,
  } = props;
    const photos = rawPhotos ?? [];
    const [openUri, setOpenUri] = React.useState<string | null>(null);

    const onAddPhotos = React.useCallback(async () => {
        if (!editable) return;

        if (photos.length >= MAX_PHOTOS) {
            Alert.alert("Photo limit", `You can add up to ${MAX_PHOTOS} photos.`);
            return;
        }

        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert(
                "Permission needed",
                "Please allow photo library access to add pictures."
            );
            return;
        }

        const remaining = MAX_PHOTOS - photos.length;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 1,
        });

        if (result.canceled) return;

        const picked = result.assets ?? [];
        const next: LocalSpotPhoto[] = [];

        for (const a of picked) {
            const mime = ((a.mimeType ?? "") || inferMimeType(a.uri)).toLowerCase();

            if (!ALLOWED.has(mime)) {
                Alert.alert(
                    "Unsupported file type",
                    "Please choose a JPEG, PNG, or WebP image."
                );
                continue;
            }

            let finalUri = a.uri;
            let finalMime = mime;

            try {
                const compressed = await compressIfNeeded(a.uri, mime);
                finalUri = compressed.uri;
                finalMime = compressed.mimeType;
            } catch {
                finalUri = a.uri;
                finalMime = mime;
            }

            if (typeof a.fileSize === "number" && a.fileSize > MAX_BYTES) {
                Alert.alert(
                    "File too large",
                    "That photo is too large. Try a different one or crop it."
                );
                continue;
            }

            next.push({
                kind: "local",
                id: randomId(),
                uri: finalUri,
                mimeType: finalMime,
                fileSize: a.fileSize,
            });
        }

        if (next.length) {
            setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
        }
    }, [editable, photos.length, setPhotos]);

    const onRemove = React.useCallback(
        (id: string) => {
            if (!editable) return;
            setPhotos((prev) => prev.filter((p) => p.id !== id));
        },
        [editable, setPhotos]
    );

    return (
        <View style={{ marginTop: 10, marginBottom: 12 }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                }}
            >
                <Text style={{ fontWeight: "700", fontSize: 14 }}>Photos</Text>

                <Pressable
                    onPress={onAddPhotos}
                    disabled={!editable}
                    style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0.12)",
                        backgroundColor: "#fff",
                        opacity: editable ? 1 : 0.45,
                    }}
                >
                    <Text style={{ fontWeight: "700" }}>+ Add</Text>
                </Pressable>
            </View>

            {photos.length === 0 ? (
                <Text style={{ opacity: 0.65 }}>Add up to {MAX_PHOTOS} photos!.</Text>
            ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {photos.map((p) => {
                        // Existing photos display using signedUrl (private bucket),
                        // local photos display using file:// uri
                        const uri = p.kind === "existing" ? p.signedUrl : p.uri;

                        return (
                            <View key={p.id} style={{ position: "relative" }}>
                                {enableFullscreenPreview ? (
                                    <Pressable onPress={() => setOpenUri(uri)}>
                                        <Image
                                            source={{ uri }}
                                            style={{
                                                width: 92,
                                                height: 92,
                                                borderRadius: 12,
                                                backgroundColor: "rgba(0,0,0,0.06)",
                                            }}
                                        />
                                    </Pressable>
                                ) : (
                                    <Image
                                        source={{ uri }}
                                        style={{
                                            width: 92,
                                            height: 92,
                                            borderRadius: 12,
                                            backgroundColor: "rgba(0,0,0,0.06)",
                                        }}
                                    />
                                )}

                                {editable && (
                                    <Pressable
                                        onPress={() => onRemove(p.id)}
                                        hitSlop={10}
                                        style={{
                                            position: "absolute",
                                            top: -6,
                                            right: -6,
                                            width: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "rgba(0,0,0,0.8)",
                                        }}
                                    >
                                        <Text style={{ color: "#fff", fontWeight: "800" }}>×</Text>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            <Modal
                visible={!!openUri}
                transparent
                animationType="fade"
                onRequestClose={() => setOpenUri(null)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.95)",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 16,
                    }}
                >
                    <Pressable
                        onPress={() => setOpenUri(null)}
                        style={{
                            position: "absolute",
                            top: 56,
                            right: 18,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.35)",
                            borderRadius: 999,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            backgroundColor: "rgba(0,0,0,0.45)",
                        }}
                    >
                        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Close</Text>
                    </Pressable>

                    {openUri ? (
                        <Image
                            source={{ uri: openUri }}
                            resizeMode="contain"
                            style={{ width: "100%", height: "80%" }}
                        />
                    ) : null}
                </View>
            </Modal>
        </View>
    );
}
