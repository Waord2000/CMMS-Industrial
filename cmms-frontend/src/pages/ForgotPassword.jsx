import { useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { olvideContrasena } from "../services/authService";

export default function ForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await olvideContrasena(correo);
      setMensaje(data.mensaje);
    } catch {
      setError("No se pudo procesar la solicitud. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthCard titulo="Recuperar contraseña" subtitulo="Escribe tu correo y te enviaremos un enlace para crear una nueva.">
      {mensaje ? (
        <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
          {mensaje}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{error}</div>
          )}
          <div className="mb-5">
            <label htmlFor="correo" className="mb-1.5 block text-sm text-steel-400">Correo electrónico</label>
            <input
              id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required
              className="w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2.5 text-sm text-paper outline-none transition-colors focus:border-amber"
            />
          </div>
          <button
            type="submit" disabled={cargando}
            className="w-full rounded bg-amber py-3 text-sm font-semibold text-[#241a06] transition-colors hover:bg-[#f2b655] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cargando ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}
      <Link to="/login" className="mt-6 block text-center text-sm text-steel-400 hover:text-amber">
        ← Volver a iniciar sesión
      </Link>
    </AuthCard>
  );
}