import api from "./api";

export async function getConsumosPorOrden(ordenId) {
  const response = await api.get(`/ConsumoRepuestos/por-orden/${ordenId}`);
  return response.data;
}

export async function crearConsumo(datos) {
  const response = await api.post("/ConsumoRepuestos", datos);
  return response.data;
}

export async function eliminarConsumo(id) {
  await api.delete(`/ConsumoRepuestos/${id}`);
}