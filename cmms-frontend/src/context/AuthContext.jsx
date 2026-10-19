import { createContext, useContext, useState } from "react";
import { login as loginService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("usuario");
    return guardado ? JSON.parse(guardado) : null;
  });

  async function login(correoElectronico, contrasena) {
    const data = await loginService(correoElectronico, contrasena);
    const datosUsuario = {
      usuarioId: data.usuarioId,
      nombreCompleto: data.nombreCompleto,
      nombreRol: data.nombreRol,
    };
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}