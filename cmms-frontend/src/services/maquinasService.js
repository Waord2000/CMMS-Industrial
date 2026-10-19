import api from "./api";

export async function getMaquinas() {
  const response = await api.get("/Maquinas");
  return response.data;
}

export async function crearMaquina(datos) {
  const response = await api.post("/Maquinas", datos);
  return response.data;
}

export async function actualizarMaquina(id, datos) {
  await api.put(`/Maquinas/${id}`, datos);
}

export async function eliminarMaquina(id) {
  await api.delete(`/Maquinas/${id}`);
}

export async function getRepuestosCompatibles(maquinaId) {
  const response = await api.get(`/Maquinas/${maquinaId}/repuestos`);
  return response.data;
}

export async function asignarRepuesto(maquinaId, repuestoId) {
  await api.post(`/Maquinas/${maquinaId}/repuestos/${repuestoId}`);
}

export async function quitarRepuesto(maquinaId, repuestoId) {
  await api.delete(`/Maquinas/${maquinaId}/repuestos/${repuestoId}`);
}