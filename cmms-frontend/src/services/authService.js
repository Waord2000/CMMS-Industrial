import api from "./api";

export async function login(correoElectronico, contrasena) {
  const response = await api.post("/Auth/login", { correoElectronico, contrasena });
  return response.data;
}

export async function olvideContrasena(correoElectronico) {
  const response = await api.post("/Auth/olvide-contrasena", { correoElectronico });
  return response.data;
}

export async function restablecerContrasena(token, nuevaContrasena) {
  const response = await api.post("/Auth/restablecer-contrasena", { token, nuevaContrasena });
  return response.data;
}