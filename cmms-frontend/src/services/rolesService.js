import api from "./api";

export async function getRoles() {
  const response = await api.get("/Roles");
  return response.data;
}