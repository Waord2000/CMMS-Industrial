import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getRoles } from "../services/rolesService";
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from "../services/usuariosService";


const VACIO = { nombreCompleto: "", correoElectronico: "", contrasena: "", rolId: "", activo: true };

const inputClasses = "w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber";
const labelClasses = "mb-1 block text-sm text-steel-400";
const btnBase = "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors";
const btnSecondary = `${btnBase} border border-steel-600 hover:border-amber hover:text-amber`;
const btnDanger = `${btnBase} border border-red-500/50 text-red-300 hover:bg-red-500/10`;
const btnPrimary = "flex items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-[#241a06] hover:bg-[#f2b655] disabled:opacity-60";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
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
      const [datosUsuarios, datosRoles] = await Promise.all([getUsuarios(), getRoles()]);
      setUsuarios(datosUsuarios);
      setRoles(datosRoles);
    } catch {
      setError("No se pudieron cargar los usuarios.");
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

  function abrirEditar(u) {
    setEditandoId(u.usuarioId);
    setForm({ nombreCompleto: u.nombreCompleto, correoElectronico: u.correoElectronico, contrasena: "", rolId: u.rolId, activo: u.activo });
    setErrorForm("");
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorForm("");
    setGuardando(true);
    try {
      const datos = { ...form, rolId: Number(form.rolId) };
      if (editandoId) await actualizarUsuario(editandoId, datos);
      else await crearUsuario(datos);
      setModalAbierto(false);
      await cargarTodo();
    } catch (err) {
      setErrorForm(err.response?.data || "No se pudo guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarUsuario(id);
      await cargarTodo();
    } catch {
      alert("No se pudo eliminar el usuario.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Usuarios</h2>
        <button onClick={abrirCrear} className={btnPrimary}>
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      {cargando && <p className="text-steel-400">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <div className="overflow-hidden rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-steel-600 text-left">
                <th className="p-3 font-medium text-steel-400">Nombre</th>
                <th className="p-3 font-medium text-steel-400">Correo</th>
                <th className="p-3 font-medium text-steel-400">Rol</th>
                <th className="p-3 font-medium text-steel-400">Activo</th>
                <th className="p-3 font-medium text-steel-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.usuarioId} className="border-b border-graphite-700 last:border-0 hover:bg-graphite-700/40">
                  <td className="p-3">{u.nombreCompleto}</td>
                  <td className="p-3">{u.correoElectronico}</td>
                  <td className="p-3">{u.nombreRol}</td>
                  <td className="p-3">{u.activo ? "Sí" : "No"}</td>
                  <td className="space-x-2 p-3">
                    <button onClick={() => abrirEditar(u)} className={btnSecondary}><Pencil size={13} />Editar</button>
                    <button onClick={() => handleEliminar(u.usuarioId)} className={btnDanger}><Trash2 size={13} />Eliminar</button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-steel-400">No hay usuarios registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <form onSubmit={handleGuardar} className="w-80 rounded-lg border border-steel-600 bg-graphite-800 p-6 shadow-xl shadow-black/50">
            <h3 className="font-display text-lg font-semibold mb-4">{editandoId ? "Editar usuario" : "Nuevo usuario"}</h3>
            {errorForm && <p className="mb-3 text-sm text-red-400">{errorForm}</p>}

            <div className="mb-3">
              <label className={labelClasses}>Nombre completo</label>
              <input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Correo electrónico</label>
              <input type="email" value={form.correoElectronico} onChange={(e) => setForm({ ...form, correoElectronico: e.target.value })} required className={inputClasses} />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>{editandoId ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
              <input
                type="password"
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                required={!editandoId}
                placeholder={editandoId ? "Dejar en blanco para no cambiarla" : ""}
                className={inputClasses}
              />
            </div>

            <div className="mb-3">
              <label className={labelClasses}>Rol</label>
              <select value={form.rolId} onChange={(e) => setForm({ ...form, rolId: e.target.value })} required className={inputClasses}>
                <option value="">Selecciona un rol</option>
                {roles.map((r) => <option key={r.rolId} value={r.rolId}>{r.nombreRol}</option>)}
              </select>
            </div>

            <div className="mb-5 flex items-center gap-2">
              <input type="checkbox" id="activo" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="h-4 w-4 accent-amber" />
              <label htmlFor="activo" className="text-sm text-steel-400">Usuario activo</label>
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