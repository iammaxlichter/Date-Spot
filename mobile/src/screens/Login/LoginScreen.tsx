// src/screens/Login/LoginScreen.tsx
import React from "react";
import { LoginForm } from "./components/LoginForm";
import { useLogin } from "./hooks/useLogin";

export default function LoginScreen({ navigation }: any) {
  const login = useLogin();

  return (
    <LoginForm
      email={login.email}
      password={login.password}
      loading={login.loading}
      onChangeEmail={login.setEmail}
      onChangePassword={login.setPassword}
      onLogin={login.onLogin}
      onGoRegister={() => navigation.navigate("Register")}
    />
  );
}
