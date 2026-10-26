import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getCategoriasRepuesto } from "../services/categoriasRepuestoService";
import {
  getRepuestos,
  crearRepuesto,
  actualizarRepuesto,
  eliminarRepuesto,
} from "../services/repuestosService";
import { UNIDADES, abreviar } from "../Utils/unidades";
import { mensajeError } from "../Utils/errores";

const VACIO = { codigo: "", nombre: "", categoriaId: "", unidadMedida: "Unidad", stockMinimo: 0, stockActual: 0, costoUnitario: 0 };

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnDanger = `${btnBase} border border-red-500/50 text-red-300 hover:bg-red-500/10`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";

export default function Repuestos() {
  const { usuario } = useAuth();
  const puedeModificar = usuario?.nombreRol === "Administrador" || usuario?.nombreRol === "Supervisor";
  const esAdmin = usuario?.nombreRol === "Administrador";

  const [repuestos, setRepuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [colapsadas, setColapsadas] = useState(new Set());

  useEffect(() => { cargarTodo(); }, []);

  // Agrupa los repuestos por categoría. Las categorías van en orden alfabético
  // y dentro de cada una se conserva el orden en que vienen (el de creación).
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const r of repuestos) {
      const clave = r.categoriaId ?? "sin-categoria";
      if (!mapa.has(clave)) {
        mapa.set(clave, { clave, nombre: r.nombreCategoria || "Sin categoría", items: [] });
      }
      mapa.get(clave).items.push(r);
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [repuestos]);

  function alternarCategoria(clave) {
    setColapsadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(clave)) nuevo.delete(clave);
      else nuevo.add(clave);
      return nuevo;
    });
  }

  function expandirTodo() { setColapsadas(new Set()); }
  function contraerTodo() { setColapsadas(new Set(grupos.map((g) => g.clave))); }

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const [datosRepuestos, datosCategorias] = await Promise.all([getRepuestos(), getCategoriasRepuesto()]);
      setRepuestos(datosRepuestos);
      setCategorias(datosCategorias);
    } catch {
      setError("No se pudieron cargar los repuestos.");
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

  function abrirEditar(r) {
    setEditandoId(r.repuestoId);
    setForm({
      codigo: r.codigo,
      nombre: r.nombre,
      categoriaId: r.categoriaId,
      unidadMedida: r.unidadMedida || "Unidad",
      stockMinimo: r.stockMinimo,
      stockActual: r.stockActual,
      costoUnitario: r.costoUnitario,
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
        ...form,
        categoriaId: Number(form.categoriaId),
        stockMinimo: Number(form.stockMinimo),
        stockActual: Number(form.stockActual),
        costoUnitario: Number(form.costoUnitario),
      };
      if (editandoId) await actualizarRepuesto(editandoId, datos);
      else await crearRepuesto(datos);
      setModalAbierto(false);
      await cargarTodo();
    } catch (err) {
      setErrorForm(mensajeError(err, "No se pudo guardar el repuesto."));
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este repuesto? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarRepuesto(id);
      await cargarTodo();
    } catch (err) {
      alert(mensajeError(err, "No se pudo eliminar el repuesto."));
    }
  }

  const unidadForm = abreviar(form.unidadMedida);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Repuestos</h2>
        {puedeModificar && (
          <button onClick={abrirCrear} className={btnPrimary}>
            <Plus size={16} />
            Nuevo repuesto
          </button>
        )}
      </div>

      {cargando && <p className="text-steel-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && grupos.length > 1 && (
        <div className="mb-3 flex gap-2 text-xs">
          <button type="button" onClick={expandirTodo} className={btnSecondary}>Expandir todo</button>
          <button type="button" onClick={contraerTodo} className={btnSecondary}>Contraer todo</button>
        </div>
      )}

      {!cargando && !error && (
        <div className="space-y-4">
          {grupos.map((g) => {
            const abierta = !colapsadas.has(g.clave);
            const bajos = g.items.filter((r) => r.stockActual <= r.stockMinimo).length;
            return (
              <section key={g.clave} className="overflow-hidden rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
                <button
                  type="button"
                  onClick={() => alternarCategoria(g.clave)}
                  aria-expanded={abierta}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-graphite-700/40"
                >
                  <span className="flex items-center gap-2">
                    {abierta ? <ChevronDown size={16} className="text-amber" /> : <ChevronRight size={16} className="text-amber" />}
                    <span className="font-display text-base font-semibold">{g.nombre}</span>
                    <span className="rounded-full bg-graphite-900 px-2 py-0.5 text-xs text-steel-400">{g.items.length}</span>
                  </span>
                  {bajos > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-red-300">
                      <AlertTriangle size={13} />
                      {bajos} con stock bajo
                    </span>
                  )}
                </button>

                {abierta && (
                  <table className="w-full table-fixed border-collapse border-t border-steel-600 text-sm">
                    <thead>
                      <tr className="border-b border-steel-600 text-left">
                        <th className="w-28 p-3 font-medium text-steel-400">Código</th>
                        <th className="p-3 font-medium text-steel-400">Nombre</th>
                        <th className="w-64 p-3 font-medium text-steel-400">Stock</th>
                        <th className="w-40 p-3 font-medium text-steel-400">Costo unitario</th>
                        {puedeModificar && <th className="w-52 p-3 font-medium text-steel-400">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((r) => {
                        const stockBajo = r.stockActual <= r.stockMinimo;
                        const unidad = abreviar(r.unidadMedida);
                        return (
                          <tr key={r.repuestoId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                            <td className="p-3 font-mono text-xs text-steel-400">{r.codigo}</td>
                            <td className="p-3">{r.nombre}</td>
                            <td className="p-3">
                              <span className={`flex items-center gap-1.5 ${stockBajo ? "text-red-300" : ""}`}>
                                {stockBajo && <AlertTriangle size={13} />}
                                {r.stockActual} {unidad} (mín. {r.stockMinimo} {unidad})
                              </span>
                            </td>
                            <td className="p-3">Q {Number(r.costoUnitario).toFixed(2)} / {unidad}</td>
                            {puedeModificar && (
                              <td className="space-x-2 p-3">
                                <button onClick={() => abrirEditar(r)} className={btnSecondary}>
                                  <Pencil size={13} />
                                  Editar
                                </button>
                                {esAdmin && (
                                  <button onClick={() => handleEliminar(r.repuestoId)} className={btnDanger}>
                                    <Trash2 size={13} />
                                    Eliminar
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })}
          {grupos.length === 0 && (
            <p className="rounded-lg border border-steel-600 bg-graphite-800 p-6 text-center text-steel-400">No hay repuestos registrados.</p>
          )}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-96 max-h-[90vh] overflow-y-auto rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">{editandoId ? "Editar repuesto" : "Nuevo repuesto"}</h3>
            {errorForm && (
              <div role="alert" className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {errorForm}
              </div>
            )}

            <div className="mb-3">
              <label className={labelClasses}>Código</label>
              <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Categoría</label>
              <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => <option key={c.categoriaId} value={c.categoriaId}>{c.nombreCategoria}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Unidad de medida</label>
              <select value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })} className={inputClasses}>
                {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.valor} ({u.abreviatura})</option>)}
              </select>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className={labelClasses}>Stock mínimo ({unidadForm})</label>
                <input type="number" min="0" step="0.01" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Stock actual ({unidadForm})</label>
                <input type="number" min="0" step="0.01" value={form.stockActual} onChange={(e) => setForm({ ...form, stockActual: e.target.value })} required className={inputClasses} />
              </div>
            </div>

            <div className="mb-5">
              <label className={labelClasses}>Costo por {form.unidadMedida.toLowerCase()} (Q)</label>
              <input type="number" min="0" step="0.01" value={form.costoUnitario} onChange={(e) => setForm({ ...form, costoUnitario: e.target.value })} required className={inputClasses} />
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