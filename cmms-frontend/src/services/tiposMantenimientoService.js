import api from "./api";

export async function getTiposMantenimiento() {
  const response = await api.get("/TiposMantenimiento");
  return response.data;
}