import api from "./api";

export async function getMovimientos() {
  const response = await api.get("/MovimientosInventario");
  return response.data;
}

export async function registrarEntrada(datos) {
  const response = await api.post("/MovimientosInventario/entrada", datos);
  return response.data;
}