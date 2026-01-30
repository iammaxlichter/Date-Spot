// src/screens/EditSpot/EditSpotScreen.tsx
import React from "react";
import { View, Keyboard, TouchableWithoutFeedback } from "react-native";
import { NewSpotSheetScreen } from "../NewSpotSheet/NewSpotSheetScreen";
import { sanitizeOneToTenInput } from "../../app/utils/numberInputValidation";
import { useSpotCreation } from "../../contexts/SpotCreationContext";
import { styles } from "./styles";
import { useEditSpot } from "./hooks/useEditSpot";
import { EditSpotLoading } from "./components/EditSpotLoading";
import { EditSpotSavingOverlay } from "./components/EditSpotSavingOverlay";

export default function EditSpotScreen({ route, navigation }: any) {
  const spotId: string = route.params.spotId;

  const { setIsEditingSpot } = useSpotCreation();

  React.useEffect(() => {
    setIsEditingSpot(true);
    return () => setIsEditingSpot(false);
  }, [setIsEditingSpot]);

  const edit = useEditSpot({ spotId, navigation });

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
          onChangeName={edit.setName}
          onChangeAtmosphere={(v) => edit.setAtmosphere(sanitizeOneToTenInput(v))}
          onChangeDateScore={(v) => edit.setDateScore(sanitizeOneToTenInput(v))}
          onChangeNotes={edit.setNotes}
          onChangeVibe={edit.setVibe}
          onChangePrice={edit.setPrice}
          onChangeBestFor={edit.setBestFor}
          onChangeWouldReturn={edit.setWouldReturn}
          onCancel={edit.onCancel}
          onSave={edit.onSave}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}
