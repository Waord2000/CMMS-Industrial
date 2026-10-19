import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Tags } from "lucide-react";
import { getAreas, crearArea, actualizarArea, eliminarArea } from "../services/areasService";
import {
  getCategoriasRepuesto, crearCategoriaRepuesto, actualizarCategoriaRepuesto, eliminarCategoriaRepuesto,
} from "../services/categoriasRepuestoService";

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnDanger = `${btnBase} border border-red-500/50 text-red-300 hover:bg-red-500/10`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";
const tabClasses = (activo) =>
  `flex items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors ${
    activo ? "border-amber text-paper" : "border-transparent text-steel-400 hover:text-paper"
  }`;

export default function Catalogos() {
  const [tab, setTab] = useState("areas");

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-4">Catálogos</h2>

      <div className="mb-4 flex border-b border-steel-600">
        <button onClick={() => setTab("areas")} className={tabClasses(tab === "areas")}>
          <MapPin size={15} /> Áreas
        </button>
        <button onClick={() => setTab("categorias")} className={tabClasses(tab === "categorias")}>
          <Tags size={15} /> Categorías de Repuestos
        </button>
      </div>

      {tab === "areas" ? <CatalogoAreas /> : <CatalogoCategorias />}
    </div>
  );
}

function CatalogoAreas() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      setItems(await getAreas());
    } catch {
      setError("No se pudieron cargar las áreas.");
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setEditandoId(null);
    setNombre("");
    setErrorForm("");
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setEditandoId(item.areaId);
    setNombre(item.nombreArea);
    setErrorForm("");
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      if (editandoId) await actualizarArea(editandoId, { nombreArea: nombre });
      else await crearArea({ nombreArea: nombre });
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo guardar el área.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta área?")) return;
    try {
      await eliminarArea(id);
      await cargar();
    } catch (err) {
      alert(err.response?.data || "No se pudo eliminar el área.");
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={abrirCrear} className={btnPrimary}><Plus size={16} />Nueva área</button>
      </div>

      {cargando && <p className="text-steel-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <div className="overflow-hidden rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-steel-600 text-left">
                <th className="p-3 font-medium text-steel-400">Nombre</th>
                <th className="p-3 font-medium text-steel-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.areaId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                  <td className="p-3">{a.nombreArea}</td>
                  <td className="space-x-2 p-3">
                    <button onClick={() => abrirEditar(a)} className={btnSecondary}><Pencil size={13} />Editar</button>
                    <button onClick={() => handleEliminar(a.areaId)} className={btnDanger}><Trash2 size={13} />Eliminar</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={2} className="p-6 text-center text-steel-400">No hay áreas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">{editandoId ? "Editar área" : "Nueva área"}</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}
            <div className="mb-5">
              <label className={labelClasses}>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClasses} />
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

function CatalogoCategorias() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      setItems(await getCategoriasRepuesto());
    } catch {
      setError("No se pudieron cargar las categorías.");
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setEditandoId(null);
    setNombre("");
    setErrorForm("");
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setEditandoId(item.categoriaId);
    setNombre(item.nombreCategoria);
    setErrorForm("");
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      if (editandoId) await actualizarCategoriaRepuesto(editandoId, { nombreCategoria: nombre });
      else await crearCategoriaRepuesto({ nombreCategoria: nombre });
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo guardar la categoría.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await eliminarCategoriaRepuesto(id);
      await cargar();
    } catch (err) {
      alert(err.response?.data || "No se pudo eliminar la categoría.");
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={abrirCrear} className={btnPrimary}><Plus size={16} />Nueva categoría</button>
      </div>

      {cargando && <p className="text-steel-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <div className="overflow-hidden rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-steel-600 text-left">
                <th className="p-3 font-medium text-steel-400">Nombre</th>
                <th className="p-3 font-medium text-steel-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.categoriaId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                  <td className="p-3">{c.nombreCategoria}</td>
                  <td className="space-x-2 p-3">
                    <button onClick={() => abrirEditar(c)} className={btnSecondary}><Pencil size={13} />Editar</button>
                    <button onClick={() => handleEliminar(c.categoriaId)} className={btnDanger}><Trash2 size={13} />Eliminar</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={2} className="p-6 text-center text-steel-400">No hay categorías registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">{editandoId ? "Editar categoría" : "Nueva categoría"}</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}
            <div className="mb-5">
              <label className={labelClasses}>Nombre (ej. Grasas, Aceites, Tornillería)</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClasses} />
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