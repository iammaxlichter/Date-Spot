import React, { createContext, useContext, useState } from "react";

type SpotCreationContextType = {
  isCreatingSpot: boolean;
  setIsCreatingSpot: (value: boolean) => void;

  isEditingSpot: boolean;              
  setIsEditingSpot: (value: boolean) => void;
};

const SpotCreationContext = createContext<SpotCreationContextType | undefined>(
  undefined
);

export function SpotCreationProvider({ children }: { children: React.ReactNode }) {
  const [isCreatingSpot, setIsCreatingSpot] = useState(false);
  const [isEditingSpot, setIsEditingSpot] = useState(false);

  return (
    <SpotCreationContext.Provider
      value={{
        isCreatingSpot,
        setIsCreatingSpot,
        isEditingSpot,
        setIsEditingSpot,
      }}
    >
      {children}
    </SpotCreationContext.Provider>
  );
}

export function useSpotCreation() {
  const context = useContext(SpotCreationContext);
  if (!context) {
    throw new Error("useSpotCreation must be used within SpotCreationProvider");
  }
  return context;
}
