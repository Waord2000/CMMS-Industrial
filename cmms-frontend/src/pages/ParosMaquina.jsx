import { useEffect, useState } from "react";
import { Plus, CheckCircle2, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMaquinas } from "../services/maquinasService";
import { getParos, crearParo, cerrarParo, eliminarParo } from "../services/parosMaquinaService";

function ahoraLocalInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnDanger = `${btnBase} border border-red-500/50 text-red-300 hover:bg-red-500/10`;
const btnSuccess = `${btnBase} border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";

function formatearDuracion(minutos) {
  if (minutos == null) return "—";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas}h ${resto}m` : `${resto}m`;
}

export default function ParosMaquina() {
  const { usuario } = useAuth();
  const puedeModificar = usuario?.nombreRol === "Administrador" || usuario?.nombreRol === "Supervisor" || usuario?.nombreRol === "Técnico";
  const esAdmin = usuario?.nombreRol === "Administrador";

  const [paros, setParos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({ maquinaId: "", fechaInicio: "", causa: "" });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [paroACerrar, setParoACerrar] = useState(null);
  const [formCerrar, setFormCerrar] = useState({ fechaFin: "", causa: "" });
  const [cerrando, setCerrando] = useState(false);
  const [errorCerrar, setErrorCerrar] = useState("");

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const [datosParos, datosMaquinas] = await Promise.all([getParos(), getMaquinas()]);
      setParos(datosParos);
      setMaquinas(datosMaquinas);
    } catch {
      setError("No se pudieron cargar los paros de máquina.");
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setForm({ maquinaId: "", fechaInicio: ahoraLocalInput(), causa: "" });
    setErrorForm("");
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      await crearParo({
        maquinaId: Number(form.maquinaId),
        fechaInicio: form.fechaInicio || null,
        causa: form.causa || null,
      });
      setModalAbierto(false);
      await cargarTodo();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo registrar el paro.");
    } finally {
      setGuardando(false);
    }
  }

  function abrirCerrar(paro) {
    setParoACerrar(paro);
    setFormCerrar({ fechaFin: ahoraLocalInput(), causa: paro.causa || "" });
    setErrorCerrar("");
  }

  async function handleCerrar(e) {
    e.preventDefault();
    setErrorCerrar("");
    setCerrando(true);
    try {
      await cerrarParo(paroACerrar.paroId, {
        fechaFin: formCerrar.fechaFin || null,
        causa: formCerrar.causa || null,
      });
      setParoACerrar(null);
      await cargarTodo();
    } catch (err) {
      setErrorCerrar(err.response?.data || "No se pudo cerrar el paro.");
    } finally {
      setCerrando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este registro de paro? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarParo(id);
      await cargarTodo();
    } catch {
      alert("No se pudo eliminar el paro.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Paros de Máquina</h2>
        {puedeModificar && (
          <button onClick={abrirCrear} className={btnPrimary}>
            <Plus size={16} />
            Registrar paro
          </button>
        )}
      </div>

      {cargando && <p className="text-steel-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <div className="overflow-x-auto rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-steel-600 text-left">
                <th className="p-3 font-medium text-steel-400">Máquina</th>
                <th className="p-3 font-medium text-steel-400">Causa</th>
                <th className="p-3 font-medium text-steel-400">Inicio</th>
                <th className="p-3 font-medium text-steel-400">Fin</th>
                <th className="p-3 font-medium text-steel-400">Duración</th>
                {puedeModificar && <th className="p-3 font-medium text-steel-400">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {paros.map((p) => {
                const activo = !p.fechaFin;
                return (
                  <tr key={p.paroId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                    <td className="p-3">{p.nombreMaquina}</td>
                    <td className="p-3">
                      {p.causa || "—"}
                      {p.ordenId && (
                        <span className="ml-2 rounded-full border border-steel-600 px-2 py-0.5 text-[10px] text-steel-400">
                          Orden #{p.ordenId}
                        </span>
                      )}
                    </td>
                    <td className="p-3">{new Date(p.fechaInicio).toLocaleString()}</td>
                    <td className="p-3">
                      {activo ? (
                        <span className="flex items-center gap-1.5 text-amber">
                          <AlertCircle size={13} />
                          En curso
                        </span>
                      ) : (
                        new Date(p.fechaFin).toLocaleString()
                      )}
                    </td>
                    <td className="p-3">{formatearDuracion(p.duracionMinutos)}</td>
                    {puedeModificar && (
                      <td className="space-x-2 whitespace-nowrap p-3">
                        {activo && (
                          <button onClick={() => abrirCerrar(p)} className={btnSuccess}>
                            <CheckCircle2 size={13} />
                            Cerrar
                          </button>
                        )}
                        {esAdmin && (
                          <button onClick={() => handleEliminar(p.paroId)} className={btnDanger}>
                            <Trash2 size={13} />
                            Eliminar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {paros.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-steel-400">No hay paros registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">Registrar paro</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Máquina</label>
              <select value={form.maquinaId} onChange={(e) => setForm({ ...form, maquinaId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona una máquina</option>
                {maquinas.map((m) => <option key={m.maquinaId} value={m.maquinaId}>{m.nombre}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Hora de inicio</label>
              <input type="datetime-local" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-5">
              <label className={labelClasses}>Causa (opcional)</label>
              <textarea value={form.causa} onChange={(e) => setForm({ ...form, causa: e.target.value })} rows={3} className={inputClasses} />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={guardando} className={`${btnPrimary} flex-1 justify-center`}>
                {guardando ? "Registrando..." : "Registrar"}
              </button>
              <button type="button" onClick={() => setModalAbierto(false)} className={`${btnSecondary} flex-1 justify-center`}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {paroACerrar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleCerrar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-1">Cerrar paro</h3>
            <p className="mb-4 text-sm text-steel-400">{paroACerrar.nombreMaquina}</p>
            {errorCerrar && <p className="mb-3 text-sm text-red-400">{errorCerrar}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Hora de finalización</label>
              <input type="datetime-local" value={formCerrar.fechaFin} onChange={(e) => setFormCerrar({ ...formCerrar, fechaFin: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-5">
              <label className={labelClasses}>Causa</label>
              <textarea value={formCerrar.causa} onChange={(e) => setFormCerrar({ ...formCerrar, causa: e.target.value })} rows={3} className={inputClasses} />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={cerrando} className={`${btnPrimary} flex-1 justify-center`}>
                {cerrando ? "Cerrando..." : "Cerrar paro"}
              </button>
              <button type="button" onClick={() => setParoACerrar(null)} className={`${btnSecondary} flex-1 justify-center`}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}