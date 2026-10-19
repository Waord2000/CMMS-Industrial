import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import PasswordInput from "../components/PasswordInput";
import { restablecerContrasena } from "../services/authService";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (nueva.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    try {
      const data = await restablecerContrasena(token, nueva);
      setMensaje(data.mensaje);
    } catch (err) {
      setError(err.response?.data || "No se pudo restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  if (!token) {
    return (
      <AuthCard titulo="Enlace no válido" subtitulo="Este enlace está incompleto. Solicita uno nuevo desde la pantalla de inicio de sesión.">
        <Link to="/olvide-contrasena" className="block text-center text-sm text-amber hover:underline">
          Solicitar un enlace nuevo
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard titulo="Nueva contraseña" subtitulo="Elige una contraseña de al menos 8 caracteres.">
      {mensaje ? (
        <>
          <div className="mb-5 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
            {mensaje}
          </div>
          <Link to="/login" className="block w-full rounded bg-amber py-3 text-center text-sm font-semibold text-[#241a06] hover:bg-[#f2b655]">
            Ir a iniciar sesión
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div role="alert" className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="nueva" className="mb-1.5 block text-sm text-steel-400">Nueva contraseña</label>
            <PasswordInput id="nueva" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          </div>
          <div className="mb-5">
            <label htmlFor="confirmar" className="mb-1.5 block text-sm text-steel-400">Confirmar contraseña</label>
            <PasswordInput id="confirmar" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </div>
          <button
            type="submit" disabled={cargando}
            className="w-full rounded bg-amber py-3 text-sm font-semibold text-[#241a06] transition-colors hover:bg-[#f2b655] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}