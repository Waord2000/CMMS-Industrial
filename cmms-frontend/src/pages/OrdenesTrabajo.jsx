import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Play, Check, X, Boxes, ClipboardCheck, FileDown } from "lucide-react";
import autoTable from "jspdf-autotable";
import { useAuth } from "../context/AuthContext";
import { getMaquinas } from "../services/maquinasService";
import { getTiposMantenimiento } from "../services/tiposMantenimientoService";
import { getUsuarios } from "../services/usuariosService";
import { getRepuestos } from "../services/repuestosService";
import { getPlanes } from "../services/planesMantenimientoService";
import { useLocation, useNavigate } from "react-router-dom";
import { abreviar } from "../Utils/unidades";
import { mensajeError } from "../Utils/errores";
import {
  getOrdenes, crearOrden, actualizarOrden, iniciarOrden, completarOrden, cancelarOrden, eliminarOrden, registrarMantenimiento,
} from "../services/ordenesTrabajoService";
import { getConsumosPorOrden, crearConsumo, eliminarConsumo } from "../services/consumoRepuestosService";
import { crearDocumento, agregarPiePagina } from "../Utils/pdf";

const VACIO = { maquinaId: "", planId: "", tipoMantenimientoId: "", usuarioAsignadoId: "", fechaProgramada: "", descripcion: "", observaciones: "" };
const VACIO_INSUMO = { repuestoId: "", cantidad: "" };

function hoyISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function ahoraHora() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const VACIO_REGISTRO = { maquinaId: "", planId: "", tipoMantenimientoId: "", fechaProgramada: hoyISO(), horaInicio: "", horaFin: ahoraHora(), descripcion: "", observaciones: "", registrarParo: true };

const ESTADO_PILL = {
  Pendiente: "bg-gray-400/15 text-gray-300 border-gray-400/30",
  "En Proceso": "bg-amber/15 text-amber border-amber/30",
  Completada: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  Cancelada: "bg-red-400/15 text-red-300 border-red-400/30",
};

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnDanger = `${btnBase} border border-red-500/50 text-red-300 hover:bg-red-500/10`;
const btnSuccess = `${btnBase} border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";

function EstadoPill({ estado }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_PILL[estado]}`}>{estado}</span>;
}

export default function OrdenesTrabajo() {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const puedeModificar = usuario?.nombreRol === "Administrador" || usuario?.nombreRol === "Supervisor";
  const esAdmin = usuario?.nombreRol === "Administrador";
  const esTecnico = usuario?.nombreRol === "Técnico";

  const [ordenes, setOrdenes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [modalRegistro, setModalRegistro] = useState(false);
  const [formRegistro, setFormRegistro] = useState(VACIO_REGISTRO);
  const [guardandoRegistro, setGuardandoRegistro] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState("");

  const [insumosOrden, setInsumosOrden] = useState(null);
  const [listaInsumos, setListaInsumos] = useState([]);
  const [formInsumo, setFormInsumo] = useState(VACIO_INSUMO);
  const [guardandoInsumo, setGuardandoInsumo] = useState(false);
  const [errorInsumo, setErrorInsumo] = useState("");

  useEffect(() => { cargarTodo(); }, []);
  // Si llegas desde el Calendario con un plan seleccionado, abre el registro ya prellenado
  useEffect(() => {
    const pre = location.state?.registrar;
    if (!pre || cargando) return;
    const preventivo = tipos.find((t) => t.nombre === "Preventivo");
    setFormRegistro({
      ...VACIO_REGISTRO,
      maquinaId: String(pre.maquinaId),
      planId: String(pre.planId),
      tipoMantenimientoId: preventivo ? String(preventivo.tipoMantenimientoId) : "",
      fechaProgramada: hoyISO(),
      horaFin: ahoraHora(),
    });
    setErrorRegistro("");
    setModalRegistro(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, cargando]);

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const [datosOrdenes, datosMaquinas, datosTipos, datosUsuarios, datosRepuestos, datosPlanes] = await Promise.all([
        getOrdenes(), getMaquinas(), getTiposMantenimiento(), getUsuarios(), getRepuestos(), getPlanes(),
      ]);
      setOrdenes(datosOrdenes);
      setMaquinas(datosMaquinas);
      setTipos(datosTipos);
      setTecnicos(datosUsuarios);
      setRepuestos(datosRepuestos);
      setPlanes(datosPlanes);
    } catch {
      setError("No se pudieron cargar las órdenes de trabajo.");
    } finally {
      setCargando(false);
    }
  }

  function esMia(o) {
    return usuario?.usuarioId && o.usuarioAsignadoId === usuario.usuarioId;
  }

  function abrirCrear() {
    setEditandoId(null);
    setForm(VACIO);
    setErrorForm("");
    setModalAbierto(true);
  }

  function abrirEditar(o) {
    setEditandoId(o.ordenId);
    setForm({
      maquinaId: o.maquinaId,
      planId: o.planId || "",
      tipoMantenimientoId: o.tipoMantenimientoId,
      usuarioAsignadoId: o.usuarioAsignadoId || "",
      fechaProgramada: o.fechaProgramada || "",
      descripcion: o.descripcion || "",
      observaciones: o.observaciones || "",
    });
    setErrorForm("");
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      const datos = {
        maquinaId: Number(form.maquinaId),
        planId: form.planId ? Number(form.planId) : null,
        tipoMantenimientoId: Number(form.tipoMantenimientoId),
        usuarioAsignadoId: form.usuarioAsignadoId ? Number(form.usuarioAsignadoId) : null,
        fechaProgramada: form.fechaProgramada || null,
        descripcion: form.descripcion || null,
        observaciones: form.observaciones || null,
      };
      if (editandoId) await actualizarOrden(editandoId, datos);
      else await crearOrden(datos);
      setModalAbierto(false);
      await cargarTodo();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo guardar la orden.");
    } finally {
      setGuardando(false);
    }
  }

  function abrirRegistro() {
    setFormRegistro(VACIO_REGISTRO);
    setErrorRegistro("");
    setModalRegistro(true);
  }

  async function handleRegistrar(e) {
    e.preventDefault();
    setErrorRegistro("");
    setGuardandoRegistro(true);
    try {
      const nueva = await registrarMantenimiento({
        maquinaId: Number(formRegistro.maquinaId),
        planId: formRegistro.planId ? Number(formRegistro.planId) : null,
        tipoMantenimientoId: Number(formRegistro.tipoMantenimientoId),
        fechaProgramada: formRegistro.fechaProgramada || null,
        horaInicio: formRegistro.horaInicio,
        horaFin: formRegistro.horaFin,
        registrarParo: formRegistro.registrarParo,
        descripcion: formRegistro.descripcion,
        observaciones: formRegistro.observaciones || null,
      });
      setModalRegistro(false);
      await cargarTodo();
      abrirInsumos(nueva);
    } catch (err) {
      setErrorRegistro(err.response?.data || "No se pudo registrar el mantenimiento.");
    } finally {
      setGuardandoRegistro(false);
    }
  }

  async function handleIniciar(id) {
    try { await iniciarOrden(id); await cargarTodo(); }
    catch { alert("No se pudo iniciar la orden."); }
  }
  async function handleCompletar(id) {
    if (!confirm("¿Marcar esta orden como completada?")) return;
    try { await completarOrden(id); await cargarTodo(); }
    catch { alert("No se pudo completar la orden."); }
  }
  async function handleCancelar(id) {
    if (!confirm("¿Cancelar esta orden?")) return;
    try { await cancelarOrden(id); await cargarTodo(); }
    catch { alert("No se pudo cancelar la orden."); }
  }
  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta orden? Los repuestos usados en ella volverán al inventario. Esta acción no se puede deshacer.")) return;
    try { await eliminarOrden(id); await cargarTodo(); }
    catch (err) { alert(mensajeError(err, "No se pudo eliminar la orden.")); }
  }

  async function abrirInsumos(orden) {
    setInsumosOrden(orden);
    setFormInsumo(VACIO_INSUMO);
    setErrorInsumo("");
    try {
      const data = await getConsumosPorOrden(orden.ordenId);
      setListaInsumos(data);
    } catch {
      setListaInsumos([]);
    }
  }

  async function handleAgregarInsumo(e) {
    e.preventDefault();
    setErrorInsumo("");
    setGuardandoInsumo(true);
    try {
      await crearConsumo({
        ordenId: insumosOrden.ordenId,
        repuestoId: Number(formInsumo.repuestoId),
        cantidad: Number(formInsumo.cantidad),
      });
      const data = await getConsumosPorOrden(insumosOrden.ordenId);
      setListaInsumos(data);
      setFormInsumo(VACIO_INSUMO);
      await cargarTodo();
    } catch (err) {
      setErrorInsumo(err.response?.data || "No se pudo registrar el insumo.");
    } finally {
      setGuardandoInsumo(false);
    }
  }

  async function handleEliminarInsumo(id) {
    if (!confirm("¿Quitar este insumo? Se devolverá el stock del repuesto.")) return;
    try {
      await eliminarConsumo(id);
      const data = await getConsumosPorOrden(insumosOrden.ordenId);
      setListaInsumos(data);
    } catch {
      alert("No se pudo eliminar el insumo.");
    }
  }

  async function handleExportarPDF(orden) {
    let insumos = [];
    try {
      insumos = await getConsumosPorOrden(orden.ordenId);
    } catch {
      // si falla, se exporta igual sin la tabla de insumos
    }

    const doc = crearDocumento("Orden de Trabajo", `Orden #${orden.ordenId}`);

    autoTable(doc, {
      startY: 34,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 1.5 },
      body: [
        ["Máquina", orden.nombreMaquina],
        ["Tipo de mantenimiento", orden.nombreTipoMantenimiento],
        ["Plan", orden.nombrePlan || "Correctivo (sin plan)"],
        ["Asignado a", orden.nombreUsuarioAsignado || "—"],
        ["Fecha", orden.fechaProgramada || "—"],
        ["Hora inicio", orden.horaInicio || "—"],
        ["Hora fin", orden.horaFin || "—"],
        ["Duración", orden.duracionMinutos != null ? `${orden.duracionMinutos} min` : "—"],
        ["Estado", orden.estado],
      ],
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    });

    let y = doc.lastAutoTable.finalY + 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Descripción del trabajo realizado", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const descripcion = doc.splitTextToSize(orden.descripcion || "Sin descripción.", 180);
    doc.text(descripcion, 14, y + 6);
    y += 6 + descripcion.length * 5;

    if (orden.observaciones) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Observaciones", 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const obs = doc.splitTextToSize(orden.observaciones, 180);
      doc.text(obs, 14, y + 6);
      y += 6 + obs.length * 5;
    }

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Insumos utilizados", 14, y);

    autoTable(doc, {
      startY: y + 3,
      head: [["Repuesto", "Cantidad", "Costo unitario", "Costo total"]],
      body: insumos.length > 0
        ? insumos.map((i) => [i.nombreRepuesto, i.cantidad, `Q ${Number(i.costoUnitario).toFixed(2)}`, `Q ${Number(i.costoTotal).toFixed(2)}`])
        : [["No se registraron insumos", "", "", ""]],
      headStyles: { fillColor: [232, 163, 61], textColor: [36, 26, 6] },
      styles: { fontSize: 9 },
    });

    agregarPiePagina(doc);
    doc.save(`Orden_${orden.ordenId}.pdf`);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Órdenes de Trabajo</h2>
        <div className="flex gap-2">
          <button onClick={abrirRegistro} className={btnPrimary}>
            <ClipboardCheck size={16} />
            Registrar mantenimiento realizado
          </button>
          {puedeModificar && (
            <button onClick={abrirCrear} className={btnSecondary}>
              <Plus size={14} />
              Programar orden futura
            </button>
          )}
        </div>
      </div>

      {cargando && <p className="text-steel-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <div className="overflow-x-auto rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-steel-600 text-left">
                <th className="p-3 font-medium text-steel-400">Máquina</th>
                <th className="p-3 font-medium text-steel-400">Tipo</th>
                <th className="p-3 font-medium text-steel-400">Fecha</th>
                <th className="p-3 font-medium text-steel-400">Asignado a</th>
                <th className="p-3 font-medium text-steel-400">Estado</th>
                <th className="p-3 font-medium text-steel-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => {
                const puedeOperarla = puedeModificar || (esTecnico && esMia(o));
                return (
                  <tr key={o.ordenId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                    <td className="p-3">{o.nombreMaquina}</td>
                    <td className="p-3">{o.nombreTipoMantenimiento}</td>
                    <td className="p-3">{o.fechaProgramada || "—"}</td>
                    <td className="p-3">{o.nombreUsuarioAsignado || "—"}</td>
                    <td className="p-3"><EstadoPill estado={o.estado} /></td>
                    <td className="space-x-2 whitespace-nowrap p-3">
                      {puedeModificar && o.estado === "Pendiente" && (
                        <button onClick={() => abrirEditar(o)} className={btnSecondary}><Pencil size={13} />Editar</button>
                      )}
                      {o.estado === "Pendiente" && puedeOperarla && (
                        <button onClick={() => handleIniciar(o.ordenId)} className={btnSuccess}><Play size={13} />Iniciar</button>
                      )}
                      {o.estado === "En Proceso" && puedeOperarla && (
                        <>
                          <button onClick={() => abrirInsumos(o)} className={btnSecondary}><Boxes size={13} />Insumos</button>
                          <button onClick={() => handleCompletar(o.ordenId)} className={btnSuccess}><Check size={13} />Completar</button>
                        </>
                      )}
                      {o.estado === "Completada" && puedeOperarla && (
                        <button onClick={() => abrirInsumos(o)} className={btnSecondary}><Boxes size={13} />Insumos</button>
                      )}
                      {puedeModificar && (o.estado === "Pendiente" || o.estado === "En Proceso") && (
                        <button onClick={() => handleCancelar(o.ordenId)} className={btnDanger}><X size={13} />Cancelar</button>
                      )}
                      <button onClick={() => handleExportarPDF(o)} className={btnSecondary}>
                        <FileDown size={13} />
                        PDF
                      </button>
                      {esAdmin && (
                        <button onClick={() => handleEliminar(o.ordenId)} className={btnDanger}><Trash2 size={13} />Eliminar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {ordenes.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-steel-400">No hay órdenes registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalRegistro && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleRegistrar} className="max-h-[90vh] overflow-y-auto w-96 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-1">Registrar mantenimiento realizado</h3>
            <p className="mb-4 text-xs text-steel-400">Quedará documentado a tu nombre: {usuario?.nombreCompleto}</p>
            {errorRegistro && <p className="mb-3 text-sm text-red-400">{errorRegistro}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Máquina</label>
              <select value={formRegistro.maquinaId} onChange={(e) => setFormRegistro({ ...formRegistro, maquinaId: e.target.value, planId: "" })} required className={inputClasses}>
                <option value="">Selecciona una máquina</option>
                {maquinas.map((m) => <option key={m.maquinaId} value={m.maquinaId}>{m.nombre}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Plan de mantenimiento (opcional)</label>
              <select value={formRegistro.planId} onChange={(e) => setFormRegistro({ ...formRegistro, planId: e.target.value })} className={inputClasses}>
                <option value="">Ninguno (correctivo)</option>
                {planes.filter((p) => String(p.maquinaId) === String(formRegistro.maquinaId)).map((p) => (
                  <option key={p.planId} value={p.planId}>{p.nombrePlan}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Tipo de mantenimiento</label>
              <select value={formRegistro.tipoMantenimientoId} onChange={(e) => setFormRegistro({ ...formRegistro, tipoMantenimientoId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona un tipo</option>
                {tipos.map((t) => <option key={t.tipoMantenimientoId} value={t.tipoMantenimientoId}>{t.nombre}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Fecha en que se realizó</label>
              <input type="date" value={formRegistro.fechaProgramada} onChange={(e) => setFormRegistro({ ...formRegistro, fechaProgramada: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className={labelClasses}>Hora de inicio</label>
                <input type="time" value={formRegistro.horaInicio} onChange={(e) => setFormRegistro({ ...formRegistro, horaInicio: e.target.value })} required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Hora de fin</label>
                <input type="time" value={formRegistro.horaFin} onChange={(e) => setFormRegistro({ ...formRegistro, horaFin: e.target.value })} required className={inputClasses} />
              </div>
            </div>

            <div className="mb-3 flex items-start gap-2 rounded border border-steel-600 p-3">
              <input
                type="checkbox"
                id="registrarParo"
                checked={formRegistro.registrarParo}
                onChange={(e) => setFormRegistro({ ...formRegistro, registrarParo: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-amber"
              />
              <label htmlFor="registrarParo" className="text-sm text-steel-400">
                La máquina estuvo detenida durante este mantenimiento
                <span className="block text-xs">Se registrará como paro con el mismo horario.</span>
              </label>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Descripción de lo realizado</label>
              <textarea maxLength={300} value={formRegistro.descripcion} onChange={(e) => setFormRegistro({ ...formRegistro, descripcion: e.target.value })} rows={3} required className={inputClasses} />
            </div>

            <div className="mb-5">
              <label className={labelClasses}>Observaciones (opcional)</label>
              <textarea maxLength={500} value={formRegistro.observaciones} onChange={(e) => setFormRegistro({ ...formRegistro, observaciones: e.target.value })} rows={2} className={inputClasses} />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={guardandoRegistro} className={`${btnPrimary} flex-1 justify-center`}>
                {guardandoRegistro ? "Guardando..." : "Guardar y continuar a insumos"}
              </button>
              <button type="button" onClick={() => setModalRegistro(false)} className={`${btnSecondary} flex-1 justify-center`}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="max-h-[90vh] overflow-y-auto w-96 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">{editandoId ? "Editar orden programada" : "Programar orden futura"}</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Máquina</label>
              <select value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona una máquina</option>
                {maquinas.map((m) => <option key={m.maquinaId} value={m.maquinaId}>{m.nombre}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Plan de mantenimiento (opcional)</label>
              <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className={inputClasses}>
                <option value="">Ninguno (correctivo)</option>
                {planes.filter((p) => String(p.maquinaId) === String(form.maquinaId)).map((p) => (
                  <option key={p.planId} value={p.planId}>{p.nombrePlan}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Tipo de mantenimiento</label>
              <select value={form.tipoMantenimientoId} onChange={(e) => setForm({ ...form, tipoMantenimientoId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona un tipo</option>
                {tipos.map((t) => <option key={t.tipoMantenimientoId} value={t.tipoMantenimientoId}>{t.nombre}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Asignar a (opcional)</label>
              <select value={form.usuarioAsignadoId} onChange={(e) => setForm({ ...form, usuarioAsignadoId: e.target.value })} className={inputClasses}>
                <option value="">Sin asignar</option>
                {tecnicos.map((u) => <option key={u.usuarioId} value={u.usuarioId}>{u.nombreCompleto}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Fecha programada</label>
              <input type="date" value={form.fechaProgramada} onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })} className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Descripción</label>
              <textarea maxLength={300} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className={inputClasses} />
            </div>

            <div className="mb-5">
              <label className={labelClasses}>Observaciones</label>
              <textarea maxLength={500} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={2} className={inputClasses} />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={guardando} className={`${btnPrimary} flex-1 justify-center`}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => setModalAbierto(false)} className={`${btnSecondary} flex-1 justify-center`}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: insumos usados */}
      {insumosOrden && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="w-104 max-h-[90vh] overflow-y-auto rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-1">Insumos usados</h3>
            <p className="mb-4 text-sm text-steel-400">{insumosOrden.nombreMaquina} — {insumosOrden.nombreTipoMantenimiento}</p>

            <div className="mb-4 max-h-48 overflow-y-auto rounded border border-steel-600">
              {listaInsumos.length === 0 && (
                <p className="p-3 text-sm text-steel-400">Aún no se ha registrado ningún insumo.</p>
              )}
              {listaInsumos.map((i) => (
                <div key={i.consumoId} className="flex items-center justify-between border-b border-graphite-700 p-2.5 text-sm last:border-0">
                  <div>
                    <strong>{i.nombreRepuesto}</strong>
                    <br />
                    <small className="text-steel-400">
                      {i.cantidad} {abreviar(i.unidadMedida)} × Q{Number(i.costoUnitario).toFixed(2)} = Q{Number(i.costoTotal).toFixed(2)}
                    </small>
                  </div>
                  {esAdmin && (
                    <button onClick={() => handleEliminarInsumo(i.consumoId)} className="text-red-300 hover:text-red-200">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {insumosOrden.estado !== "Cancelada" && (
              <form onSubmit={handleAgregarInsumo} className="mb-4 rounded border border-steel-600 p-3">
                {errorInsumo && <p className="mb-2 text-xs text-red-400">{errorInsumo}</p>}
                <div className="mb-2">
                  <label className={labelClasses}>Repuesto</label>
                  <select value={formInsumo.repuestoId} onChange={(e) => setFormInsumo({ ...formInsumo, repuestoId: e.target.value })} required className={inputClasses}>
                    <option value="">Selecciona un repuesto</option>
                    {repuestos.map((r) => (
                      <option key={r.repuestoId} value={r.repuestoId}>
                        {r.nombre} (stock: {r.stockActual} {abreviar(r.unidadMedida)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className={labelClasses}>
                    Cantidad
                    {formInsumo.repuestoId &&
                      ` (${abreviar(repuestos.find((r) => String(r.repuestoId) === String(formInsumo.repuestoId))?.unidadMedida)})`}
                  </label>
                  <input type="number" min="0.01" step="0.01" value={formInsumo.cantidad} onChange={(e) => setFormInsumo({ ...formInsumo, cantidad: e.target.value })} required className={inputClasses} />
                </div>
                <button type="submit" disabled={guardandoInsumo} className={`${btnPrimary} w-full justify-center`}>
                  {guardandoInsumo ? "Agregando..." : "Agregar insumo"}
                </button>
              </form>
            )}

            <button onClick={() => setInsumosOrden(null)} className={`${btnSecondary} w-full justify-center`}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}