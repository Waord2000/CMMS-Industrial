import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, CalendarClock, FileDown, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import autoTable from "jspdf-autotable";
import { useAuth } from "../context/AuthContext";
import { getOrdenes } from "../services/ordenesTrabajoService";
import { getPlanes } from "../services/planesMantenimientoService";
import { crearDocumento, agregarPiePagina } from "../Utils/pdf";
import {
  aFecha, inicioDelDia, sumarMeses, cicloAbierto, calcularPendientes, textoAtraso,
} from "../Utils/mantenimientos";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_DOT = {
  Pendiente: "bg-gray-400",
  "En Proceso": "bg-amber",
  Completada: "bg-emerald-400",
  Cancelada: "bg-red-400",
};

const ESTADO_COLOR_PDF = {
  Pendiente: [120, 120, 120],
  "En Proceso": [200, 140, 40],
  Completada: [30, 150, 100],
  Cancelada: [200, 60, 60],
};

const CHIP_PLAN = {
  vencido: "border-red-400 text-red-300",
  hoy: "border-amber text-amber",
  programado: "border-steel-400 text-steel-300",
};

export default function Calendario() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const puedeModificar = usuario?.nombreRol === "Administrador" || usuario?.nombreRol === "Supervisor";

  const hoy = new Date();
  const hoyInicio = inicioDelDia(hoy);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [ordenes, setOrdenes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setCargando(true);
    setError("");
    try {
      const [datosOrdenes, datosPlanes] = await Promise.all([getOrdenes(), getPlanes()]);
      setOrdenes(datosOrdenes);
      setPlanes(datosPlanes);
    } catch {
      setError("No se pudieron cargar los datos del calendario.");
    } finally {
      setCargando(false);
    }
  }

  const pendientes = calcularPendientes(planes, ordenes, hoyInicio);
  const planesConOrdenAbierta = new Set(
    ordenes.filter((o) => o.estado === "Pendiente" || o.estado === "En Proceso").map((o) => o.planId)
  );

  const ordenesPorDia = {};
  ordenes.forEach((o) => {
    if (!o.fechaProgramada) return;
    const fecha = aFecha(o.fechaProgramada);
    if (fecha.getFullYear() === anio && fecha.getMonth() === mes) {
      const dia = fecha.getDate();
      if (!ordenesPorDia[dia]) ordenesPorDia[dia] = [];
      ordenesPorDia[dia].push(o);
    }
  });

  // Proyección de cada plan activo: desde su próxima ejecución (ciclo 0) hacia adelante.
  // Los ciclos anteriores ya son historial y se ven como órdenes reales.
  const planesPorDia = {};
  planes.filter((p) => p.activo && p.proximaEjecucion).forEach((plan) => {
    const base = aFecha(plan.proximaEjecucion);
    for (let i = 0; i <= 60; i++) {
      const f = sumarMeses(base, plan.frecuenciaMeses * i);
      // Ciclos futuros que ya quedaron en el pasado no tienen sentido: se agrupan en el vencido
      if (i > 0 && f < hoyInicio) continue;
      if (f.getFullYear() === anio && f.getMonth() === mes) {
        const dia = f.getDate();
        const yaExisteOrdenReal = (ordenesPorDia[dia] || []).some(
          (o) => o.planId === plan.planId && o.estado !== "Cancelada"
        );
        if (!yaExisteOrdenReal) {
          if (!planesPorDia[dia]) planesPorDia[dia] = [];
          planesPorDia[dia].push({ ...plan, ciclo: i, fechaOcurrencia: f });
        }
      }
    }
  });

  function estadoPlan(p) {
    if (p.ciclo !== 0) return "programado";
    if (p.fechaOcurrencia < hoyInicio) return "vencido";
    if (p.fechaOcurrencia.getTime() === hoyInicio.getTime()) return "hoy";
    return "programado";
  }

  function irARegistrar(item) {
    navigate("/ordenes-trabajo", {
      state: { registrar: { maquinaId: item.maquinaId, planId: item.planId } },
    });
  }

  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth();

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAnio(anio - 1); } else setMes(mes - 1);
    setDiaSeleccionado(null);
  }
  function mesSiguiente() {
    if (mes === 11) { setMes(0); setAnio(anio + 1); } else setMes(mes + 1);
    setDiaSeleccionado(null);
  }

  const ordenesDelDia = diaSeleccionado ? (ordenesPorDia[diaSeleccionado] || []) : [];
  const planesDelDia = diaSeleccionado ? (planesPorDia[diaSeleccionado] || []) : [];

  function handleExportarPDF() {
    const doc = crearDocumento("Calendario de Mantenimiento", `${MESES[mes]} ${anio}`, "landscape");

    const margenX = 10;
    const inicioY = 34;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const anchoDisponible = anchoPagina - margenX * 2;
    const anchoCelda = anchoDisponible / 7;
    const altoCelda = 24;
    const filas = Math.ceil(celdas.length / 7);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    DIAS_SEMANA.forEach((d, i) => {
      doc.text(d, margenX + i * anchoCelda + anchoCelda / 2, inicioY, { align: "center" });
    });

    doc.setDrawColor(200, 200, 200);

    celdas.forEach((dia, idx) => {
      const col = idx % 7;
      const fila = Math.floor(idx / 7);
      const x = margenX + col * anchoCelda;
      const y = inicioY + 4 + fila * altoCelda;

      doc.rect(x, y, anchoCelda, altoCelda);
      if (!dia) return;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(String(dia), x + 2, y + 5);

      let textY = y + 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      (ordenesPorDia[dia] || []).slice(0, 2).forEach((o) => {
        const color = ESTADO_COLOR_PDF[o.estado] || [100, 100, 100];
        doc.setTextColor(...color);
        const linea = doc.splitTextToSize(o.nombreMaquina, anchoCelda - 4)[0] || "";
        doc.text(linea, x + 2, textY);
        textY += 3.4;
      });

      doc.setTextColor(140, 140, 140);
      (planesPorDia[dia] || []).slice(0, 2).forEach((p) => {
        const linea = doc.splitTextToSize(`(plan) ${p.nombreMaquina}`, anchoCelda - 4)[0] || "";
        doc.text(linea, x + 2, textY);
        textY += 3.4;
      });
    });

    let leyendaY = inicioY + 4 + filas * altoCelda + 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...ESTADO_COLOR_PDF.Pendiente);
    doc.text("● Pendiente", margenX, leyendaY);
    doc.setTextColor(...ESTADO_COLOR_PDF["En Proceso"]);
    doc.text("● En Proceso", margenX + 32, leyendaY);
    doc.setTextColor(...ESTADO_COLOR_PDF.Completada);
    doc.text("● Completada", margenX + 66, leyendaY);
    doc.setTextColor(...ESTADO_COLOR_PDF.Cancelada);
    doc.text("● Cancelada", margenX + 102, leyendaY);
    doc.setTextColor(140, 140, 140);
    doc.text("(plan) = programado por el plan de mantenimiento, orden aún no creada", margenX + 136, leyendaY);

    const detalle = [];
    Object.keys(ordenesPorDia).forEach((dia) => {
      ordenesPorDia[dia].forEach((o) => {
        detalle.push([dia, "Orden creada", o.nombreMaquina, o.nombreTipoMantenimiento, o.estado]);
      });
    });
    Object.keys(planesPorDia).forEach((dia) => {
      planesPorDia[dia].forEach((p) => {
        detalle.push([dia, "Plan (proyectado)", p.nombreMaquina, p.nombrePlan, "Sin orden aún"]);
      });
    });
    detalle.sort((a, b) => Number(a[0]) - Number(b[0]));

    if (detalle.length > 0) {
      autoTable(doc, {
        startY: leyendaY + 6,
        head: [["Día", "Origen", "Máquina", "Detalle", "Estado"]],
        body: detalle,
        headStyles: { fillColor: [232, 163, 61], textColor: [36, 26, 6] },
        styles: { fontSize: 8 },
      });
    }

    agregarPiePagina(doc);
    doc.save(`Calendario_${MESES[mes]}_${anio}.pdf`);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={mesAnterior} className="flex items-center justify-center rounded border border-steel-600 p-1.5 hover:border-amber hover:text-amber">
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-display text-2xl font-semibold">{MESES[mes]} {anio}</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleExportarPDF} className="flex items-center gap-1.5 rounded border border-steel-600 px-3 py-1.5 text-xs hover:border-amber hover:text-amber">
            <FileDown size={14} />
            Exportar PDF
          </button>
          <button onClick={mesSiguiente} className="flex items-center justify-center rounded border border-steel-600 p-1.5 hover:border-amber hover:text-amber">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!cargando && !error && pendientes.length > 0 && (
        <div role="alert" className="mb-4 rounded-lg border border-amber/40 bg-amber/10 p-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-amber">
            <BellRing size={16} />
            {pendientes.length === 1
              ? "Hay 1 mantenimiento pendiente de realizar"
              : `Hay ${pendientes.length} mantenimientos pendientes de realizar`}
          </div>
          <ul className="space-y-1.5">
            {pendientes.map((p) => (
              <li key={p.clave} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <strong>{p.maquina}</strong> — {p.detalle}
                  <span className={`ml-2 text-xs ${p.diasAtraso > 0 ? "text-red-300" : "text-amber"}`}>
                    {textoAtraso(p.diasAtraso)}
                  </span>
                </span>
                <button
                  onClick={() => (p.tipo === "plan" ? irARegistrar(p) : navigate("/ordenes-trabajo"))}
                  className="shrink-0 rounded border border-amber/50 px-3 py-1 text-xs text-amber hover:bg-amber/10"
                >
                  {p.tipo === "plan" ? "Registrar" : "Ver orden"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-steel-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber" /> Orden ya creada</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded border border-dashed border-steel-400" /> Plan programado</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded border border-dashed border-amber" /> Para hoy</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded border border-dashed border-red-400" /> Vencido sin registrar</span>
      </div>

      {cargando && <p className="text-steel-400">Cargando calendario...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="rounded-lg border border-steel-600 bg-graphite-800 p-3 shadow-sm shadow-black/30">
            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="p-1 text-center text-xs font-semibold text-steel-400">{d}</div>
              ))}
              {celdas.map((dia, idx) => {
                const esHoy = esMesActual && dia === hoy.getDate();
                return (
                  <div
                    key={idx}
                    onClick={() => dia && setDiaSeleccionado(dia)}
                    className={`min-h-20 rounded border p-1 transition-colors ${dia ? "cursor-pointer hover:border-steel-400" : "border-transparent"} ${
                      diaSeleccionado === dia ? "bg-graphite-700 border-steel-400" : "border-graphite-700"
                    } ${esHoy ? "ring-1 ring-amber" : ""}`}
                  >
                    {dia && (
                      <div className={`mb-1 text-xs ${esHoy ? "font-semibold text-amber" : "text-steel-400"}`}>{dia}</div>
                    )}
                    {dia && (ordenesPorDia[dia] || []).slice(0, 2).map((o) => (
                      <div
                        key={o.ordenId}
                        title={`${o.nombreMaquina} - ${o.estado}`}
                        className="mb-0.5 flex items-center gap-1 truncate rounded bg-graphite-900 px-1.5 py-0.5 text-[10px]"
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ESTADO_DOT[o.estado] || "bg-steel-400"}`} />
                        <span className="truncate">{o.nombreMaquina}</span>
                      </div>
                    ))}
                    {dia && (planesPorDia[dia] || []).slice(0, 2).map((p) => (
                      <div
                        key={`plan-${p.planId}`}
                        title={`${p.nombreMaquina} - ${p.nombrePlan} (programado)`}
                        className={`mb-0.5 truncate rounded border border-dashed px-1.5 py-0.5 text-[10px] ${CHIP_PLAN[estadoPlan(p)]}`}
                      >
                        {p.nombreMaquina}
                      </div>
                    ))}
                    {dia && ((ordenesPorDia[dia] || []).length + (planesPorDia[dia] || []).length) > 4 && (
                      <div className="text-[10px] text-steel-400">+ más</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {diaSeleccionado && (
            <div className="mt-4 rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
              <h3 className="font-display text-lg font-semibold mb-2">
                {MESES[mes]} {diaSeleccionado}, {anio}
              </h3>

              {ordenesDelDia.length === 0 && planesDelDia.length === 0 && (
                <p className="text-steel-400">No hay actividad programada este día.</p>
              )}

              {ordenesDelDia.map((o) => (
                <div key={o.ordenId} className="flex items-center justify-between border-b border-graphite-700 py-2.5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${ESTADO_DOT[o.estado] || "bg-steel-400"}`} />
                    <div>
                      <strong>{o.nombreMaquina}</strong> — {o.nombreTipoMantenimiento}
                      <br />
                      <small className="text-steel-400">
                        Estado: {o.estado}
                        {o.horaInicio ? ` · ${o.horaInicio}` : ""}
                        {o.nombreUsuarioAsignado ? ` · Asignado a ${o.nombreUsuarioAsignado}` : ""}
                      </small>
                    </div>
                  </div>
                  {puedeModificar && (
                    <button
                      onClick={() => navigate("/ordenes-trabajo")}
                      className="flex items-center gap-1.5 rounded border border-steel-600 px-3 py-1 text-xs hover:border-amber hover:text-amber"
                    >
                      <Pencil size={13} />
                      Editar
                    </button>
                  )}
                </div>
              ))}

              {planesDelDia.map((p) => {
                const estado = estadoPlan(p);
                const bloqueado = p.ciclo === 0 && planesConOrdenAbierta.has(p.planId);
                const yaRealizado = p.ciclo === 0 && !cicloAbierto(p, hoyInicio);
                const puedeRegistrar = p.ciclo === 0 && !yaRealizado && !bloqueado;

                let nota = "Programado según la frecuencia del plan";
                if (bloqueado) nota = "Ya tiene una orden pendiente o en proceso";
                else if (yaRealizado) nota = `Este mantenimiento ya se realizó. Se podrá registrar a partir de ${MESES[mes]} ${anio}`;
                else if (estado === "vencido") nota = "Vencido: aún no se ha registrado el mantenimiento";
                else if (estado === "hoy") nota = "Programado para hoy: aún no se ha registrado";
                else if (p.ciclo === 0) nota = "Programado por el plan: aún no se ha registrado";

                return (
                  <div key={`plan-${p.planId}`} className="flex items-center justify-between border-b border-dashed border-graphite-700 py-2.5 last:border-0">
                    <div className="flex items-center gap-2">
                      <CalendarClock size={14} className="shrink-0 text-steel-400" />
                      <div>
                        <strong>{p.nombreMaquina}</strong> — {p.nombrePlan}
                        <br />
                        <small className={estado === "vencido" && puedeRegistrar ? "text-red-300" : "text-steel-400"}>{nota}</small>
                      </div>
                    </div>
                    {puedeRegistrar && (
                      <button
                        onClick={() => irARegistrar(p)}
                        className="shrink-0 rounded border border-amber/50 px-3 py-1 text-xs text-amber hover:bg-amber/10"
                      >
                        Registrar mantenimiento
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}