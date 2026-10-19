import { useEffect, useState } from "react";
import { Factory, ClipboardList, AlertTriangle, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMaquinas } from "../services/maquinasService";
import { getOrdenes } from "../services/ordenesTrabajoService";
import { getRepuestosStockBajo } from "../services/repuestosService";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-lg border border-steel-600 bg-graphite-800 p-5 shadow-sm shadow-black/30 transition-transform hover:-translate-y-0.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-steel-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${accent}`}>
          <Icon size={17} className="text-graphite-900" />
        </span>
      </div>
      <p className="font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({ maquinas: 0, ordenesActivas: 0, stockBajo: 0, intervencionesMes: 0 });

  useEffect(() => {
    cargarResumen();
  }, []);

  async function cargarResumen() {
    setCargando(true);
    try {
      const [maquinas, ordenes, stockBajo] = await Promise.all([
        getMaquinas(),
        getOrdenes(),
        getRepuestosStockBajo(),
      ]);

      const hoy = new Date();
      const ordenesActivas = ordenes.filter((o) => o.estado === "Pendiente" || o.estado === "En Proceso").length;
      const intervencionesMes = ordenes.filter((o) => {
        if (!o.fechaProgramada) return false;
        const fecha = new Date(o.fechaProgramada + "T00:00:00");
        return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth();
      }).length;

      setStats({ maquinas: maquinas.length, ordenesActivas, stockBajo: stockBajo.length, intervencionesMes });
    } catch {
      // si algo falla, se quedan los contadores en 0
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Bienvenido, {usuario?.nombreCompleto}</h1>
      <p className="mb-6 text-steel-400">Resumen general del sistema.</p>

      {cargando ? (
        <p className="text-steel-400">Cargando resumen...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Factory} label="Máquinas registradas" value={stats.maquinas} accent="bg-amber" />
          <StatCard icon={ClipboardList} label="Órdenes activas" value={stats.ordenesActivas} accent="bg-sky-400" />
          <StatCard icon={AlertTriangle} label="Repuestos con stock bajo" value={stats.stockBajo} accent="bg-red-400" />
          <StatCard icon={CalendarDays} label="Intervenciones este mes" value={stats.intervencionesMes} accent="bg-emerald-400" />
        </div>
      )}
    </div>
  );
}