// Para agregar otra unidad, súmala aquí y en UnidadesPermitidas de RepuestosController.cs
export const UNIDADES = [
  { valor: "Unidad", abreviatura: "u" },
  { valor: "Litro", abreviatura: "L" },
  { valor: "Gramo", abreviatura: "g" },
  { valor: "Galón", abreviatura: "gal" },
  { valor: "Libra", abreviatura: "lb" },
];

export function abreviar(unidad) {
  return UNIDADES.find((u) => u.valor === unidad)?.abreviatura ?? unidad ?? "";
}