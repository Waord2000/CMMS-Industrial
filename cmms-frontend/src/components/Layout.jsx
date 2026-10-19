import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home, Calendar, Factory, Package, ClipboardList, CalendarClock, AlertTriangle,
  BarChart3, Settings, Users, ArrowLeftRight, LogOut, HardHat,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import usePendientes from "../hooks/usePendientes";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/calendario", label: "Calendario", icon: Calendar },
  { to: "/maquinas", label: "Máquinas", icon: Factory },
  { to: "/repuestos", label: "Repuestos", icon: Package },
  { to: "/movimientos-inventario", label: "Movimientos de Inventario", icon: ArrowLeftRight },
  { to: "/planes-mantenimiento", label: "Planes de Mantenimiento", icon: CalendarClock },
  { to: "/ordenes-trabajo", label: "Órdenes de Trabajo", icon: ClipboardList },
  { to: "/paros-maquina", label: "Paros de Máquina", icon: AlertTriangle },
  { to: "/indicadores", label: "Indicadores", icon: BarChart3 },
  { to: "/catalogos", label: "Catálogos", icon: Settings, roles: ["Administrador"] },
  { to: "/usuarios", label: "Usuarios", icon: Users, roles: ["Administrador"] },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const pendientes = usePendientes();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-graphite-900 text-paper font-sans">
      <aside className="w-56 shrink-0 border-r border-steel-600 p-4">
        <div className="mb-8 flex items-center gap-2 px-1">
          <HardHat size={22} className="text-amber" />
          <h3 className="font-display text-xl font-semibold">CMMS</h3>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(usuario?.nombreRol)).map(
            ({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-r px-3 py-2.5 text-sm border-l-4 transition-colors ${
                    isActive
                      ? "border-amber bg-graphite-700 text-paper"
                      : "border-transparent text-steel-400 hover:text-paper hover:bg-graphite-800"
                  }`
                }
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {to === "/calendario" && pendientes.length > 0 && (
                  <span
                    title="Mantenimientos pendientes de realizar"
                    className="rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-semibold text-[#241a06]"
                  >
                    {pendientes.length}
                  </span>
                )}
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-steel-600 px-6 py-3">
          <div className="text-sm">
            <strong className="font-medium">{usuario?.nombreCompleto}</strong>
            <span className="ml-2 text-steel-400">({usuario?.nombreRol})</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded border border-steel-600 px-3 py-1.5 text-sm text-steel-400 transition-colors hover:border-amber hover:text-amber"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}