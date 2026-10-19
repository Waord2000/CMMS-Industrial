import api from "./api";

export async function getParos() {
  const response = await api.get("/ParosMaquina");
  return response.data;
}

export async function getParosActivos() {
  const response = await api.get("/ParosMaquina/activos");
  return response.data;
}

export async function crearParo(datos) {
  const response = await api.post("/ParosMaquina", datos);
  return response.data;
}

export async function cerrarParo(id, datos) {
  const response = await api.put(`/ParosMaquina/${id}/cerrar`, datos);
  return response.data;
}

export async function eliminarParo(id) {
  await api.delete(`/ParosMaquina/${id}`);
}