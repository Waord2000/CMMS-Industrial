import api from "./api";

export async function getOrdenes() {
  const response = await api.get("/OrdenesTrabajo");
  return response.data;
}

export async function crearOrden(datos) {
  const response = await api.post("/OrdenesTrabajo", datos);
  return response.data;
}

export async function actualizarOrden(id, datos) {
  await api.put(`/OrdenesTrabajo/${id}`, datos);
}

export async function iniciarOrden(id) {
  const response = await api.put(`/OrdenesTrabajo/${id}/iniciar`);
  return response.data;
}

export async function completarOrden(id, observaciones) {
  const response = await api.put(`/OrdenesTrabajo/${id}/completar`, { observaciones });
  return response.data;
}

export async function cancelarOrden(id, observaciones) {
  await api.put(`/OrdenesTrabajo/${id}/cancelar`, { observaciones });
}

export async function eliminarOrden(id) {
  await api.delete(`/OrdenesTrabajo/${id}`);
}

export async function registrarMantenimiento(datos) {
  const response = await api.post("/OrdenesTrabajo/registrar", datos);
  return response.data;
}