// src/screens/Register/RegisterScreen.tsx
import React from "react";
import { RegisterForm } from "./components/RegisterForm";
import { useRegister } from "./hooks/useRegister";

export default function RegisterScreen({ navigation }: any) {
  const register = useRegister();

  return (
    <RegisterForm
      email={register.email}
      name={register.name}
      username={register.username}
      password={register.password}
      loading={register.loading}
      googleLoading={register.googleLoading}
      passwordError={register.passwordError}
      onChangeEmail={register.setEmail}
      onChangeName={register.setName}
      onChangeUsername={register.setUsername}
      onChangePassword={register.setPassword}
      onRegister={register.onRegister}
      onGoogleRegister={register.onGoogleRegister}
      onGoLogin={() => navigation.navigate("Login")}
    />
  );
}
