export function mensajeError(err, porDefecto) {
  const data = err.response?.data;
  if (typeof data === "string" && data) return data;
  if (data?.mensaje) return data.mensaje;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  return porDefecto;
}