import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileDown } from "lucide-react";
import autoTable from "jspdf-autotable";
import { getTendencia } from "../services/indicadoresService";
import { crearDocumento, agregarPiePagina } from "../Utils/pdf";
import { mensajeError } from "../Utils/errores";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const tooltipStyle = { backgroundColor: "#1c2025", border: "1px solid #3a414a", borderRadius: "6px", fontSize: "13px" };
const tickStyle = { fill: "#6b7480", fontSize: 11 };
const inputMes = "rounded border border-steel-600 bg-graphite-900 px-3 py-1.5 text-sm text-paper outline-none focus:border-amber [color-scheme:dark]";
const btnSecondary = "flex items-center gap-1.5 rounded border border-steel-600 px-3 py-1.5 text-xs transition-colors hover:border-amber hover:text-amber";

function valorMes(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function etiqueta(valor) {
  const [anio, mes] = valor.split("-").map(Number);
  return `${MESES[mes - 1]} ${anio}`;
}

function dinero(n) {
  return `Q ${Number(n).toFixed(2)}`;
}

export default function TendenciaIndicadores() {
  const hoy = new Date();
  const [desde, setDesde] = useState(valorMes(hoy));
  const [hasta, setHasta] = useState(valorMes(new Date(hoy.getFullYear(), hoy.getMonth() + 2, 1)));
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!desde || !hasta) {
      setDatos([]);
      setCargando(false);
      return;
    }
    if (hasta < desde) {
      setError("El mes final no puede ser anterior al inicial.");
      setDatos([]);
      setCargando(false);
      return;
    }
    cargar();
  }, [desde, hasta]);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const respuesta = await getTendencia(desde, hasta);
      setDatos(
        respuesta.map((t) => ({
          ...t,
          etiqueta: `${MESES[t.mes - 1]} ${t.anio}`,
          mttrHoras: t.mttrHoras == null ? null : Number(Number(t.mttrHoras).toFixed(1)),
          mtbfHoras: t.mtbfHoras == null ? null : Number(Number(t.mtbfHoras).toFixed(1)),
          inversionPreventivo: Number(Number(t.inversionPreventivo).toFixed(2)),
          consumoTotal: Number(Number(t.consumoTotal).toFixed(2)),
        }))
      );
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar la tendencia."));
      setDatos([]);
    } finally {
      setCargando(false);
    }
  }

  function handleExportarPDF() {
    const doc = crearDocumento("Tendencia mensual de indicadores", `${etiqueta(desde)} a ${etiqueta(hasta)}`, "landscape");

    autoTable(doc, {
      startY: 34,
      head: [["Mes", "Paros", "MTBF (h)", "MTTR (h)", "Inversión preventiva", "Consumo total"]],
      body: datos.map((d) => [
        d.etiqueta,
        d.totalParos,
        d.mtbfHoras ?? "—",
        d.mttrHoras ?? "—",
        dinero(d.inversionPreventivo),
        dinero(d.consumoTotal),
      ]),
      headStyles: { fillColor: [232, 163, 61], textColor: [36, 26, 6] },
      styles: { fontSize: 10 },
    });

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "MTBF y MTTR son promedios de todas las máquinas. La inversión usa el costo actual de cada repuesto.",
      14,
      doc.lastAutoTable.finalY + 8
    );

    agregarPiePagina(doc);
    doc.save(`Tendencia_${desde}_${hasta}.pdf`);
  }

  const hayMtbf = datos.some((d) => d.mtbfHoras != null);
  const hayMttr = datos.some((d) => d.mttrHoras != null);

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold">Tendencia mensual</h3>
          <p className="text-xs text-steel-400">Compara varios meses lado a lado. MTBF y MTTR son promedios de todas las máquinas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-steel-400">Desde</label>
          <input type="month" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputMes} />
          <label className="text-steel-400">Hasta</label>
          <input type="month" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputMes} />
          <button onClick={handleExportarPDF} disabled={datos.length === 0} className={`${btnSecondary} disabled:opacity-50`}>
            <FileDown size={14} />
            Exportar PDF
          </button>
        </div>
      </div>

      {cargando && <p className="text-steel-400">Cargando tendencia...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && datos.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
              <h4 className="font-display text-lg font-semibold mb-1">MTBF por mes</h4>
              <p className="mb-4 text-xs text-steel-400">Horas promedio entre intervenciones preventivas de un mismo plan. Lo ideal es que se acerque al intervalo programado.</p>
              {!hayMtbf ? (
                <p className="py-10 text-center text-sm text-steel-400">Sin datos suficientes en este rango.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={datos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262b31" />
                    <XAxis dataKey="etiqueta" tick={tickStyle} />
                    <YAxis tick={tickStyle} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#eef1f3" }} formatter={(v) => [`${v} h`, "MTBF"]} />
                    <Bar dataKey="mtbfHoras" fill="#e8a33d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
              <h4 className="font-display text-lg font-semibold mb-1">MTTR por mes</h4>
              <p className="mb-4 text-xs text-steel-400">Horas promedio de reparación — mientras más bajo, mejor.</p>
              {!hayMttr ? (
                <p className="py-10 text-center text-sm text-steel-400">Sin paros cerrados en este rango.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={datos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262b31" />
                    <XAxis dataKey="etiqueta" tick={tickStyle} />
                    <YAxis tick={tickStyle} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#eef1f3" }}
                      formatter={(v, nombre, item) => [`${v} h (${item.payload.totalParos} paros en el mes)`, "MTTR"]}
                    />
                    <Bar dataKey="mttrHoras" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
            <h4 className="font-display text-lg font-semibold mb-1">Inversión en repuestos preventivos por mes</h4>
            <p className="mb-4 text-xs text-steel-400">Costo = cantidad usada × costo actual del repuesto.</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262b31" />
                <XAxis dataKey="etiqueta" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={(v) => `Q${v}`} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#eef1f3" }} formatter={(v) => [dinero(v), "Inversión preventiva"]} />
                <Bar dataKey="inversionPreventivo" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-steel-600 bg-graphite-800 shadow-sm shadow-black/30">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-steel-600 text-left">
                  <th className="p-3 font-medium text-steel-400">Mes</th>
                  <th className="p-3 font-medium text-steel-400">Paros</th>
                  <th className="p-3 font-medium text-steel-400">MTBF (h)</th>
                  <th className="p-3 font-medium text-steel-400">MTTR (h)</th>
                  <th className="p-3 font-medium text-steel-400">Inversión preventiva</th>
                  <th className="p-3 font-medium text-steel-400">Consumo total</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d) => (
                  <tr key={`${d.anio}-${d.mes}`} className="border-b border-graphite-700 last:border-0">
                    <td className="p-3 font-medium">{d.etiqueta}</td>
                    <td className="p-3">{d.totalParos}</td>
                    <td className="p-3">{d.mtbfHoras ?? "—"}</td>
                    <td className="p-3">{d.mttrHoras ?? "—"}</td>
                    <td className="p-3">{dinero(d.inversionPreventivo)}</td>
                    <td className="p-3">{dinero(d.consumoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}