import api from "./api";

export async function getPlanes() {
  const response = await api.get("/PlanesMantenimiento");
  return response.data;
}

export async function crearPlan(datos) {
  const response = await api.post("/PlanesMantenimiento", datos);
  return response.data;
}

export async function actualizarPlan(id, datos) {
  await api.put(`/PlanesMantenimiento/${id}`, datos);
}

export async function eliminarPlan(id) {
  await api.delete(`/PlanesMantenimiento/${id}`);
}