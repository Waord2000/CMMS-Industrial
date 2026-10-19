import api from "./api";

export async function getMtbf() {
  const response = await api.get("/Indicadores/mtbf");
  return response.data;
}

export async function getMttr() {
  const response = await api.get("/Indicadores/mttr");
  return response.data;
}

export async function getConsumoRepuestos() {
  const response = await api.get("/Indicadores/consumo-repuestos");
  return response.data;
}