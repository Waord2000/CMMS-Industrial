import api from "./api";

function parametros(periodo) {
  return periodo ? { anio: periodo.anio, mes: periodo.mes } : {};
}

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

export async function getMtbfPeriodo(periodo) {
  const response = await api.get("/Indicadores/mtbf-periodo", { params: parametros(periodo) });
  return response.data;
}

export async function getMttrPeriodo(periodo) {
  const response = await api.get("/Indicadores/mttr-periodo", { params: parametros(periodo) });
  return response.data;
}

export async function getConsumoDetalle(periodo) {
  const response = await api.get("/Indicadores/consumo-detalle", { params: parametros(periodo) });
  return response.data;
}

export async function getTendencia(desde, hasta) {
  const response = await api.get("/Indicadores/tendencia", { params: { desde, hasta } });
  return response.data;
}