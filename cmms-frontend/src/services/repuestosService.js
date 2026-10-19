import api from "./api";

export async function getRepuestos() {
  const response = await api.get("/Repuestos");
  return response.data;
}

export async function getRepuestosStockBajo() {
  const response = await api.get("/Repuestos/stock-bajo");
  return response.data;
}

export async function crearRepuesto(datos) {
  const response = await api.post("/Repuestos", datos);
  return response.data;
}

export async function actualizarRepuesto(id, datos) {
  await api.put(`/Repuestos/${id}`, datos);
}

export async function eliminarRepuesto(id) {
  await api.delete(`/Repuestos/${id}`);
}