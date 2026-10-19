import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, Link2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAreas } from "../services/areasService";
import { getRepuestos } from "../services/repuestosService";
import {
  getMaquinas, crearMaquina, actualizarMaquina, eliminarMaquina,
  getRepuestosCompatibles, asignarRepuesto, quitarRepuesto,
} from "../services/maquinasService";

const ESTADOS = ["Operativa", "En Mantenimiento", "Fuera de Servicio"];
const VACIO = { nombre: "", areaId: "", marca: "", estado: "Operativa" };

const ESTADO_PILL = {
  Operativa: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  "En Mantenimiento": "bg-amber/15 text-amber border-amber/30",
  "Fuera de Servicio": "bg-red-400/15 text-red-300 border-red-400/30",
};

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnDanger = `${btnBase} border border-red-500/50 text-red-300 hover:bg-red-500/10`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";

function EstadoPill({ estado }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_PILL[estado] || "border-steel-600 text-steel-400"}`}>
      {estado}
    </span>
  );
}

export default function Maquinas() {
  const { usuario } = useAuth();
  const puedeModificar = usuario?.nombreRol === "Administrador" || usuario?.nombreRol === "Supervisor";
  const esAdmin = usuario?.nombreRol === "Administrador";

  const [maquinas, setMaquinas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [maquinaCompat, setMaquinaCompat] = useState(null);
  const [compatibles, setCompatibles] = useState([]);
  const [repuestoAAgregar, setRepuestoAAgregar] = useState("");
  const [guardandoCompat, setGuardandoCompat] = useState(false);
  const [errorCompat, setErrorCompat] = useState("");

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const [datosMaquinas, datosAreas, datosRepuestos] = await Promise.all([getMaquinas(), getAreas(), getRepuestos()]);
      setMaquinas(datosMaquinas);
      setAreas(datosAreas);
      setRepuestos(datosRepuestos);
    } catch {
      setError("No se pudieron cargar las máquinas.");
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

  function abrirEditar(maquina) {
    setEditandoId(maquina.maquinaId);
    setForm({ nombre: maquina.nombre, areaId: maquina.areaId, marca: maquina.marca || "", estado: maquina.estado });
    setErrorForm("");
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      const datos = { ...form, areaId: Number(form.areaId) };
      if (editandoId) await actualizarMaquina(editandoId, datos);
      else await crearMaquina(datos);
      setModalAbierto(false);
      await cargarTodo();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo guardar la máquina.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta máquina? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarMaquina(id);
      await cargarTodo();
    } catch {
      alert("No se pudo eliminar la máquina.");
    }
  }

  async function abrirCompatibilidad(maquina) {
    setMaquinaCompat(maquina);
    setRepuestoAAgregar("");
    setErrorCompat("");
    try {
      setCompatibles(await getRepuestosCompatibles(maquina.maquinaId));
    } catch {
      setCompatibles([]);
    }
  }

  async function handleAsignarRepuesto() {
    if (!repuestoAAgregar) return;
    setErrorCompat("");
    setGuardandoCompat(true);
    try {
      await asignarRepuesto(maquinaCompat.maquinaId, Number(repuestoAAgregar));
      setCompatibles(await getRepuestosCompatibles(maquinaCompat.maquinaId));
      setRepuestoAAgregar("");
    } catch (err) {
      setErrorCompat(err.response?.data || "No se pudo asignar el repuesto.");
    } finally {
      setGuardandoCompat(false);
    }
  }

  async function handleQuitarRepuesto(repuestoId) {
    try {
      await quitarRepuesto(maquinaCompat.maquinaId, repuestoId);
      setCompatibles(await getRepuestosCompatibles(maquinaCompat.maquinaId));
    } catch {
      alert("No se pudo quitar el repuesto.");
    }
  }

  const repuestosDisponibles = repuestos.filter((r) => !compatibles.some((c) => c.repuestoId === r.repuestoId));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Máquinas</h2>
        {puedeModificar && (
          <button onClick={abrirCrear} className={btnPrimary}>
            <Plus size={16} />
            Nueva máquina
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
                <th className="p-3 font-medium text-steel-400">Nombre</th>
                <th className="p-3 font-medium text-steel-400">Área</th>
                <th className="p-3 font-medium text-steel-400">Marca</th>
                <th className="p-3 font-medium text-steel-400">Estado</th>
                <th className="p-3 font-medium text-steel-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {maquinas.map((m) => (
                <tr key={m.maquinaId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                  <td className="p-3">{m.nombre}</td>
                  <td className="p-3">{m.nombreArea}</td>
                  <td className="p-3">{m.marca || "—"}</td>
                  <td className="p-3"><EstadoPill estado={m.estado} /></td>
                  <td className="space-x-2 p-3">
                    <button onClick={() => abrirCompatibilidad(m)} className={btnSecondary}>
                      <Link2 size={13} />
                      Repuestos
                    </button>
                    {puedeModificar && (
                      <button onClick={() => abrirEditar(m)} className={btnSecondary}><Pencil size={13} />Editar</button>
                    )}
                    {esAdmin && (
                      <button onClick={() => handleEliminar(m.maquinaId)} className={btnDanger}><Trash2 size={13} />Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
              {maquinas.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-steel-400">No hay máquinas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">{editandoId ? "Editar máquina" : "Nueva máquina"}</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Área</label>
              <select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona un área</option>
                {areas.map((a) => <option key={a.areaId} value={a.areaId}>{a.nombreArea}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Marca</label>
              <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className={inputClasses} />
            </div>

            <div className="mb-5">
              <label className={labelClasses}>Estado</label>
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={inputClasses}>
                {ESTADOS.map((est) => <option key={est} value={est}>{est}</option>)}
              </select>
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

      {/* Modal compatibilidad de repuestos */}
      {maquinaCompat && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="w-96 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-1">Repuestos compatibles</h3>
            <p className="mb-4 text-sm text-steel-400">{maquinaCompat.nombre}</p>

            <div className="mb-4 max-h-48 overflow-y-auto rounded border border-steel-600">
              {compatibles.length === 0 && (
                <p className="p-3 text-sm text-steel-400">Aún no se ha asignado ningún repuesto a esta máquina.</p>
              )}
              {compatibles.map((r) => (
                <div key={r.repuestoId} className="flex items-center justify-between border-b border-graphite-700 p-2.5 text-sm last:border-0">
                  <span>{r.nombre} <span className="text-steel-400">({r.codigo})</span></span>
                  {puedeModificar && (
                    <button onClick={() => handleQuitarRepuesto(r.repuestoId)} className="text-red-300 hover:text-red-200">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {puedeModificar && (
              <div className="mb-4">
                {errorCompat && <p className="mb-2 text-xs text-red-400">{errorCompat}</p>}
                <div className="flex gap-2">
                  <select value={repuestoAAgregar} onChange={(e) => setRepuestoAAgregar(e.target.value)} className={inputClasses}>
                    <option value="">Selecciona un repuesto</option>
                    {repuestosDisponibles.map((r) => <option key={r.repuestoId} value={r.repuestoId}>{r.nombre}</option>)}
                  </select>
                  <button onClick={handleAsignarRepuesto} disabled={guardandoCompat || !repuestoAAgregar} className={`${btnPrimary} shrink-0`}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => setMaquinaCompat(null)} className={`${btnSecondary} w-full justify-center`}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}