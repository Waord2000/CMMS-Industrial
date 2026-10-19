import api from "./api";

export async function getAreas() {
  const response = await api.get("/Areas");
  return response.data;
}

export async function crearArea(datos) {
  const response = await api.post("/Areas", datos);
  return response.data;
}

export async function actualizarArea(id, datos) {
  await api.put(`/Areas/${id}`, datos);
}

export async function eliminarArea(id) {
  await api.delete(`/Areas/${id}`);
}