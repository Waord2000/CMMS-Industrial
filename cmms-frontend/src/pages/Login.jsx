import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const [correoElectronico, setCorreoElectronico] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(correoElectronico, contrasena);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-graphite-900 text-paper font-sans">
      <div className="relative flex flex-col items-center justify-center text-center overflow-hidden border-b md:border-b-0 md:border-r border-steel-600 bg-linear-to-b from-graphite-800 to-graphite-900 px-8 py-12 md:flex-[1.1] md:justify-end md:px-14 md:py-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(100deg, transparent 0px, transparent 38px, rgba(232,163,61,0.05) 38px, rgba(232,163,61,0.05) 40px), repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 14px)",
          }}
        />
        <div
          className="pointer-events-none absolute left-[-10%] top-[-10%] h-1 w-[60%] bg-amber"
          style={{ transform: "rotate(-32deg)" }}
        />

        <div className="relative z-10 mb-6">
          <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
            <polygon points="56,32 44,52.78 20,52.78 8,32 20,11.22 44,11.22" stroke="#e8a33d" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 34 Q20 26 26 34 T38 34 T50 34" stroke="#e8a33d" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
            <circle cx="46" cy="18" r="2" fill="#e8a33d" />
          </svg>
        </div>

        <h1 className="relative z-10 font-display text-4xl md:text-6xl font-bold leading-[1.02] mb-4">
          Mantenimiento<br />bajo control.
        </h1>
        <p className="relative z-10 max-w-sm text-sm leading-relaxed text-steel-400 hidden md:block">
          Planifica el mantenimiento preventivo, da seguimiento a las órdenes
          de trabajo y controla el consumo de repuestos de cada máquina desde
          un solo lugar.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-graphite-800 px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-1">Iniciar sesión</h2>
          <p className="text-sm text-steel-400 mb-8">Ingresa tus credenciales para continuar.</p>

          {error && (
            <div role="alert" className="mb-5 rounded border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="correo" className="mb-1.5 block text-sm text-steel-400">Correo electrónico</label>
            <input
              id="correo" type="email" value={correoElectronico}
              onChange={(e) => setCorreoElectronico(e.target.value)} required
              className="w-full rounded border border-steel-600 bg-graphite-900 px-3 py-2.5 text-sm text-paper outline-none transition-colors focus:border-amber"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="contrasena" className="mb-1.5 block text-sm text-steel-400">Contraseña</label>
            <PasswordInput id="contrasena" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </div>

          <div className="mb-5 text-right">
            <Link to="/olvide-contrasena" className="text-xs text-steel-400 transition-colors hover:text-amber">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit" disabled={cargando}
            className="w-full rounded bg-amber py-3 text-sm font-semibold text-[#241a06] transition-colors hover:bg-[#f2b655] disabled:cursor-not-allowed disabled:bg-amber-dim disabled:opacity-70"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>

          <p className="mt-7 text-xs text-steel-600">Sistema de Gestión de Mantenimiento Preventivo</p>
        </form>
      </div>
    </div>
  );
}