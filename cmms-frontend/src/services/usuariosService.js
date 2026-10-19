import api from "./api";

export async function getUsuarios() {
  const response = await api.get("/Usuarios");
  return response.data;
}

export async function crearUsuario(datos) {
  const response = await api.post("/Usuarios", datos);
  return response.data;
}

export async function actualizarUsuario(id, datos) {
  await api.put(`/Usuarios/${id}`, datos);
}

export async function eliminarUsuario(id) {
  await api.delete(`/Usuarios/${id}`);
}