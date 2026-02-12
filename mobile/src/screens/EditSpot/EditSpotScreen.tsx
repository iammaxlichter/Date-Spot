// src/screens/EditSpot/EditSpotScreen.tsx
import React from "react";
import { View, Keyboard, TouchableWithoutFeedback, Alert } from "react-native";

import { NewSpotSheetScreen } from "../NewSpotSheet/NewSpotSheetScreen";
import { sanitizeOneToTenInput } from "../../app/utils/numberInputValidation";
import { useSpotCreation } from "../../contexts/SpotCreationContext";
import { styles } from "./styles";
import { useEditSpot } from "./hooks/useEditSpot";
import { EditSpotLoading } from "./components/EditSpotLoading";
import { EditSpotSavingOverlay } from "./components/EditSpotSavingOverlay";

import type { SpotPhotoItem } from "../../types/spotPhotos";
import { fetchSpotPhotosWithSignedUrls } from "../../services/api/spotPhotosService";

export default function EditSpotScreen({ route, navigation }: any) {
  const spotId: string = route.params.spotId;
  const { setIsEditingSpot } = useSpotCreation();

  const [photos, setPhotos] = React.useState<SpotPhotoItem[]>([]);
  const initialPhotosRef = React.useRef<SpotPhotoItem[] | null>(null);

  React.useEffect(() => {
    setIsEditingSpot(true);
    return () => setIsEditingSpot(false);
  }, [setIsEditingSpot]);

  const edit = useEditSpot({ spotId, navigation });

  // Load existing photos + signed urls
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const existing = await fetchSpotPhotosWithSignedUrls({ spotId });
        if (cancelled) return;

        setPhotos(existing);

        // Snapshot the initial state ONCE (used for diffing removals)
        if (!initialPhotosRef.current) {
          initialPhotosRef.current = existing;
        }
      } catch (e: any) {
        if (cancelled) return;
        Alert.alert("Photos failed to load", e?.message ?? "Unknown error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [spotId]);

  if (edit.loading) {
    return <EditSpotLoading />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.bottomSheet}>
        <EditSpotSavingOverlay visible={edit.saving} />

        <NewSpotSheetScreen
          name={edit.name}
          atmosphere={edit.atmosphere}
          dateScore={edit.dateScore}
          notes={edit.notes}
          vibe={edit.vibe}
          price={edit.price}
          bestFor={edit.bestFor}
          wouldReturn={edit.wouldReturn}
          title="Edit Date Spot"
          photos={photos}
          debugLabel="(EDIT)"
          enableFullscreenPreview
          setPhotos={setPhotos}
          onChangeName={edit.setName}
          onChangeAtmosphere={(v) => edit.setAtmosphere(sanitizeOneToTenInput(v))}
          onChangeDateScore={(v) => edit.setDateScore(sanitizeOneToTenInput(v))}
          onChangeNotes={edit.setNotes}
          onChangeVibe={edit.setVibe}
          onChangePrice={edit.setPrice}
          onChangeBestFor={edit.setBestFor}
          onChangeWouldReturn={edit.setWouldReturn}
          onCancel={() => {
            setPhotos([]);
            initialPhotosRef.current = null;
            edit.onCancel();
          }}
          onSave={() => {
            const initial = initialPhotosRef.current ?? [];
            return edit.onSave(photos, initial);
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
