import { useEffect, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRepuestos } from "../services/repuestosService";
import { getMovimientos, registrarEntrada } from "../services/movimientosInventarioService";
import { abreviar } from "../Utils/unidades";

const VACIO = { repuestoId: "", cantidad: "", observaciones: "" };

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";

export default function MovimientosInventario() {
  const { usuario } = useAuth();
  const puedeModificar = usuario?.nombreRol === "Administrador" || usuario?.nombreRol === "Supervisor";

  const [movimientos, setMovimientos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const [datosMovimientos, datosRepuestos] = await Promise.all([getMovimientos(), getRepuestos()]);
      setMovimientos(datosMovimientos);
      setRepuestos(datosRepuestos);
    } catch {
      setError("No se pudieron cargar los movimientos de inventario.");
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setForm(VACIO);
    setErrorForm("");
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      await registrarEntrada({
        repuestoId: Number(form.repuestoId),
        cantidad: Number(form.cantidad),
        observaciones: form.observaciones || null,
      });
      setModalAbierto(false);
      await cargarTodo();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo registrar la entrada.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Movimientos de Inventario</h2>
        {puedeModificar && (
          <button onClick={abrirCrear} className={btnPrimary}>
            <Plus size={16} />
            Registrar entrada
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
                <th className="p-3 font-medium text-steel-400">Repuesto</th>
                <th className="p-3 font-medium text-steel-400">Tipo</th>
                <th className="p-3 font-medium text-steel-400">Cantidad</th>
                <th className="p-3 font-medium text-steel-400">Fecha</th>
                <th className="p-3 font-medium text-steel-400">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.movimientoId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                  <td className="p-3">{m.nombreRepuesto}</td>
                  <td className="p-3">
                    {m.tipoMovimiento === "Entrada" ? (
                      <span className="flex items-center gap-1.5 text-emerald-300"><ArrowDownCircle size={14} /> Entrada</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-300"><ArrowUpCircle size={14} /> Salida</span>
                    )}
                  </td>
                  <td className="p-3">{m.cantidad}</td>
                  <td className="p-3">{new Date(m.fecha).toLocaleString()}</td>
                  <td className="p-3 text-steel-400">{m.observaciones || "—"}</td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-steel-400">No hay movimientos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">Registrar entrada de stock</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Repuesto</label>
              <select value={form.repuestoId} onChange={(e) => setForm({ ...form, repuestoId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona un repuesto</option>
                {repuestos.map((r) => <option key={r.repuestoId} value={r.repuestoId}>{r.nombre} (stock: {r.stockActual} {abreviar(r.unidadMedida)}))</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Cantidad</label>
              <input type="number" min="0.01" step="0.01" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-5">
              <label className={labelClasses}>Observaciones (opcional)</label>
              <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={2} className={inputClasses} />
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
    </div>
  );
}