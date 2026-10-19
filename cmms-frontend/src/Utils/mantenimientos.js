const MS_DIA = 24 * 60 * 60 * 1000;

export function aFecha(iso) {
  return new Date(iso + "T00:00:00");
}

export function inicioDelDia(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Suma meses sin desbordar (31 de enero + 1 mes = 28 de febrero), igual que el backend.
export function sumarMeses(fecha, n) {
  const d = new Date(fecha.getFullYear(), fecha.getMonth() + n, 1);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(fecha.getDate(), ultimoDia));
  return d;
}

// Un plan ya se puede registrar a partir del primer día del mes de su próxima ejecución.
// Antes de eso, el mantenimiento de este periodo ya se hizo.
export function cicloAbierto(plan, hoy = inicioDelDia()) {
  if (!plan.proximaEjecucion) return true;
  const prox = aFecha(plan.proximaEjecucion);
  const inicioVentana = new Date(prox.getFullYear(), prox.getMonth(), 1);
  return hoy >= inicioVentana;
}

export function textoAtraso(dias) {
  if (dias <= 0) return "Para hoy";
  if (dias === 1) return "Vencido hace 1 día";
  return `Vencido hace ${dias} días`;
}

// Mantenimientos que ya debieron hacerse (hoy o antes) y nadie ha registrado.
export function calcularPendientes(planes, ordenes, hoy = inicioDelDia()) {
  const abiertas = ordenes.filter((o) => o.estado === "Pendiente" || o.estado === "En Proceso");
  const lista = [];

  planes
    .filter((p) => p.activo && p.proximaEjecucion)
    .forEach((plan) => {
      const fecha = aFecha(plan.proximaEjecucion);
      if (fecha > hoy) return;
      // Si ya hay una orden abierta de este plan, se avisa por esa orden, no por el plan
      if (abiertas.some((o) => o.planId === plan.planId)) return;
      lista.push({
        clave: `plan-${plan.planId}`,
        tipo: "plan",
        planId: plan.planId,
        maquinaId: plan.maquinaId,
        maquina: plan.nombreMaquina,
        detalle: plan.nombrePlan,
        fecha,
        diasAtraso: Math.round((hoy - fecha) / MS_DIA),
      });
    });

  abiertas
    .filter((o) => o.fechaProgramada)
    .forEach((o) => {
      const fecha = aFecha(o.fechaProgramada);
      if (fecha > hoy) return;
      lista.push({
        clave: `orden-${o.ordenId}`,
        tipo: "orden",
        planId: o.planId,
        maquinaId: o.maquinaId,
        maquina: o.nombreMaquina,
        detalle: o.nombreTipoMantenimiento,
        fecha,
        diasAtraso: Math.round((hoy - fecha) / MS_DIA),
      });
    });

  return lista.sort((a, b) => a.fecha - b.fecha);
}