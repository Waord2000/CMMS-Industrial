import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMaquinas } from "../services/maquinasService";
import { getPlanes, crearPlan, actualizarPlan, eliminarPlan } from "../services/planesMantenimientoService";

const VACIO = { maquinaId: "", nombrePlan: "", frecuenciaMeses: 1, ultimaEjecucion: "", proximaEjecucion: "", activo: true };

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnDanger = `${btnBase} border border-red-500/50 text-red-300 hover:bg-red-500/10`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";

export default function PlanesMantenimiento() {
  const { usuario } = useAuth();
  const puedeModificar = usuario?.nombreRol === "Administrador" || usuario?.nombreRol === "Supervisor";
  const esAdmin = usuario?.nombreRol === "Administrador";

  const [planes, setPlanes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const [datosPlanes, datosMaquinas] = await Promise.all([getPlanes(), getMaquinas()]);
      setPlanes(datosPlanes);
      setMaquinas(datosMaquinas);
    } catch {
      setError("No se pudieron cargar los planes de mantenimiento.");
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setEditandoId(null);
    setForm(VACIO);
    setErrorForm("");
    setModalAbierto(true);
  }

  function abrirEditar(p) {
    setEditandoId(p.planId);
    setForm({
      maquinaId: p.maquinaId,
      nombrePlan: p.nombrePlan,
      frecuenciaMeses: p.frecuenciaMeses,
      ultimaEjecucion: p.ultimaEjecucion || "",
      proximaEjecucion: p.proximaEjecucion || "",
      activo: p.activo,
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
        nombrePlan: form.nombrePlan,
        frecuenciaMeses: Number(form.frecuenciaMeses),
        ultimaEjecucion: form.ultimaEjecucion || null,
        proximaEjecucion: form.proximaEjecucion || null,
        activo: form.activo,
      };
      if (editandoId) await actualizarPlan(editandoId, datos);
      else await crearPlan(datos);
      setModalAbierto(false);
      await cargarTodo();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo guardar el plan.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este plan? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarPlan(id);
      await cargarTodo();
    } catch {
      alert("No se pudo eliminar el plan.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Planes de Mantenimiento</h2>
        {puedeModificar && (
          <button onClick={abrirCrear} className={btnPrimary}>
            <Plus size={16} />
            Nuevo plan
          </button>
        )}
      </div>

      {cargando && <p className="text-steel-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <div className="overflow-hidden rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-steel-600 text-left">
                <th className="p-3 font-medium text-steel-400">Plan</th>
                <th className="p-3 font-medium text-steel-400">Máquina</th>
                <th className="p-3 font-medium text-steel-400">Frecuencia</th>
                <th className="p-3 font-medium text-steel-400">Última ejecución</th>
                <th className="p-3 font-medium text-steel-400">Próxima ejecución</th>
                <th className="p-3 font-medium text-steel-400">Activo</th>
                {puedeModificar && <th className="p-3 font-medium text-steel-400">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {planes.map((p) => (
                <tr key={p.planId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                  <td className="p-3">{p.nombrePlan}</td>
                  <td className="p-3">{p.nombreMaquina}</td>
                  <td className="p-3">{p.frecuenciaMeses} {p.frecuenciaMeses === 1 ? "mes" : "meses"}</td>
                  <td className="p-3">{p.ultimaEjecucion || "—"}</td>
                  <td className="p-3">{p.proximaEjecucion || <span className="text-amber">Sin definir</span>}</td>
                  <td className="p-3">{p.activo ? "Sí" : "No"}</td>
                  {puedeModificar && (
                    <td className="space-x-2 p-3">
                      <button onClick={() => abrirEditar(p)} className={btnSecondary}><Pencil size={13} />Editar</button>
                      {esAdmin && (
                        <button onClick={() => handleEliminar(p.planId)} className={btnDanger}><Trash2 size={13} />Eliminar</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {planes.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-steel-400">No hay planes registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">{editandoId ? "Editar plan" : "Nuevo plan"}</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Máquina</label>
              <select value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona una máquina</option>
                {maquinas.map((m) => <option key={m.maquinaId} value={m.maquinaId}>{m.nombre}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Nombre del plan</label>
              <input value={form.nombrePlan} onChange={(e) => setForm({ ...form, nombrePlan: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Frecuencia (en meses, 1–12)</label>
              <input type="number" min="1" max="12" value={form.frecuenciaMeses} onChange={(e) => setForm({ ...form, frecuenciaMeses: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Próxima ejecución</label>
              <input type="date" value={form.proximaEjecucion} onChange={(e) => setForm({ ...form, proximaEjecucion: e.target.value })} className={inputClasses} />
              <p className="mt-1 text-xs text-steel-400">Necesaria para que el plan se proyecte en el Calendario. Indícala aunque el plan sea nuevo.</p>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Última ejecución (opcional, si ya se hizo antes)</label>
              <input type="date" value={form.ultimaEjecucion} onChange={(e) => setForm({ ...form, ultimaEjecucion: e.target.value })} className={inputClasses} />
            </div>

            <div className="mb-5 flex items-center gap-2">
              <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="h-4 w-4 accent-amber" />
              <label htmlFor="activo" className="text-sm text-steel-400">Plan activo</label>
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
    </div>
  );
}