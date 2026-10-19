import api from "./api";

export async function getCategoriasRepuesto() {
  const response = await api.get("/CategoriasRepuesto");
  return response.data;
}

export async function crearCategoriaRepuesto(datos) {
  const response = await api.post("/CategoriasRepuesto", datos);
  return response.data;
}

export async function actualizarCategoriaRepuesto(id, datos) {
  await api.put(`/CategoriasRepuesto/${id}`, datos);
}

export async function eliminarCategoriaRepuesto(id) {
  await api.delete(`/CategoriasRepuesto/${id}`);
}