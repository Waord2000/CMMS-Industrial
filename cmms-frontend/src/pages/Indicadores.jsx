import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileDown } from "lucide-react";
import autoTable from "jspdf-autotable";
import { getMtbfPeriodo, getMttrPeriodo, getConsumoDetalle } from "../services/indicadoresService";
import { crearDocumento, agregarPiePagina } from "../Utils/pdf";
import { abreviar } from "../Utils/unidades";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const btnSecondary = "flex items-center gap-1.5 rounded border border-steel-600 px-3 py-1.5 text-xs hover:border-amber hover:text-amber transition-colors";
const tooltipStyle = { backgroundColor: "#1c2025", border: "1px solid #3a414a", borderRadius: "6px", fontSize: "13px" };
const tickStyle = { fill: "#6b7480", fontSize: 11 };

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function aPeriodo(valor) {
  if (!valor) return null;
  const [anio, mes] = valor.split("-").map(Number);
  return { anio, mes };
}

function etiquetaPeriodo(valor) {
  const p = aPeriodo(valor);
  return p ? `${MESES[p.mes - 1]} ${p.anio}` : "Todo el periodo";
}

function dinero(n) {
  return `Q ${Number(n).toFixed(2)}`;
}

// Dibuja una gráfica de barras horizontal directamente en el PDF
function dibujarBarras(doc, startY, titulo, datos, valorKey, colorRGB, formato, mensajeVacio) {
  const altoPagina = doc.internal.pageSize.getHeight();
  const anchoPagina = doc.internal.pageSize.getWidth();
  let y = startY;

  if (y > altoPagina - 40) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(titulo, 14, y);
  y += 8;

  if (datos.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(mensajeVacio, 14, y);
    return y + 12;
  }

  const margenIzq = 50;
  const anchoMax = anchoPagina - margenIzq - 40;
  const maxValor = Math.max(...datos.map((d) => d[valorKey]), 1);
  const altoBarra = 6;

  datos.forEach((d) => {
    if (y + altoBarra + 3 > altoPagina - 20) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const nombreCorto = doc.splitTextToSize(d.nombre, margenIzq - 4)[0] || d.nombre;
    doc.text(nombreCorto, 14, y + altoBarra - 1.5);

    const anchoBarra = (d[valorKey] / maxValor) * anchoMax;
    doc.setFillColor(...colorRGB);
    doc.rect(margenIzq, y, Math.max(anchoBarra, 1), altoBarra, "F");

    doc.setTextColor(60, 60, 60);
    doc.text(formato(d[valorKey]), margenIzq + anchoBarra + 3, y + altoBarra - 1.5);

    y += altoBarra + 3;
  });

  return y + 8;
}

export default function Indicadores() {
  const [periodo, setPeriodo] = useState(mesActual());
  const [mtbf, setMtbf] = useState([]);
  const [mttr, setMttr] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { cargarTodo(); }, [periodo]);

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const p = aPeriodo(periodo);
      const [datosMtbf, datosMttr, datosConsumos] = await Promise.all([
        getMtbfPeriodo(p),
        getMttrPeriodo(p),
        getConsumoDetalle(p),
      ]);
      setMtbf(datosMtbf.map((d) => ({ ...d, mtbfHoras: Number(Number(d.mtbfHoras ?? 0).toFixed(1)) })));
      setMttr(datosMttr.map((d) => ({ ...d, mttrHoras: Number(Number(d.mttrHoras ?? 0).toFixed(1)) })));
      setConsumos(datosConsumos);
    } catch {
      setError("No se pudieron cargar los indicadores.");
    } finally {
      setCargando(false);
    }
  }

  // Inversión en repuestos por área, solo mantenimientos preventivos
  const inversionPorArea = Object.values(
    consumos
      .filter((c) => c.tipoMantenimiento === "Preventivo")
      .reduce((acc, c) => {
        if (!acc[c.area]) acc[c.area] = { nombre: c.area, total: 0 };
        acc[c.area].total += Number(c.costoTotal);
        return acc;
      }, {})
  )
    .map((a) => ({ ...a, total: Number(a.total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

  const totalPreventivo = inversionPorArea.reduce((suma, a) => suma + a.total, 0);
  const totalConsumo = consumos.reduce((suma, c) => suma + Number(c.costoTotal), 0);

  function handleExportarPDF() {
    const doc = crearDocumento("Indicadores de Confiabilidad", `Periodo: ${etiquetaPeriodo(periodo)}`, "portrait");
    let y = 36;

    y = dibujarBarras(doc, y, "MTBF por máquina (horas — mientras más alto, mejor)", mtbf, "mtbfHoras",
      [232, 163, 61], (v) => `${v} h`, "No hay suficientes paros para calcular el MTBF en este periodo.");

    y = dibujarBarras(doc, y, "MTTR por máquina (horas — mientras más bajo, mejor)", mttr, "mttrHoras",
      [248, 113, 113], (v) => `${v} h`, "No hay paros cerrados para calcular el MTTR en este periodo.");

    y = dibujarBarras(doc, y, `Inversión en repuestos por área, preventivo — ${dinero(totalPreventivo)}`, inversionPorArea, "total",
      [52, 211, 153], (v) => dinero(v), "No hay consumos de repuestos en mantenimientos preventivos en este periodo.");

    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("Consumo de repuestos del periodo", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Fecha", "Repuesto", "Cantidad", "Máquina", "Área", "Tipo", "Costo total"]],
      body: consumos.length > 0
        ? consumos.map((c) => [
            new Date(c.fecha).toLocaleDateString(),
            c.repuesto,
            `${c.cantidad} ${abreviar(c.unidadMedida)}`,
            c.maquina,
            c.area,
            c.tipoMantenimiento,
            dinero(c.costoTotal),
          ])
        : [["Sin consumos registrados en este periodo", "", "", "", "", "", ""]],
      ...(consumos.length > 0 ? { foot: [["", "", "", "", "", "Total", dinero(totalConsumo)]] } : {}),
      headStyles: { fillColor: [232, 163, 61], textColor: [36, 26, 6] },
      footStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold" },
      styles: { fontSize: 8 },
    });

    agregarPiePagina(doc);
    doc.save(`Indicadores_${periodo || "todo-el-periodo"}.pdf`);
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">Indicadores de Confiabilidad</h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded border border-steel-600 bg-graphite-900 px-3 py-1.5 text-sm text-paper outline-none focus:border-amber [color-scheme:dark]"
          />
          <button
            onClick={() => setPeriodo("")}
            className={`${btnSecondary} ${periodo === "" ? "border-amber text-amber" : ""}`}
          >
            Todo el periodo
          </button>
          <button onClick={handleExportarPDF} className={btnSecondary}>
            <FileDown size={14} />
            Exportar PDF
          </button>
        </div>
      </div>
      <p className="mb-6 text-steel-400">
        Periodo: <strong className="text-paper">{etiquetaPeriodo(periodo)}</strong>
      </p>

      {cargando && <p className="text-steel-400">Cargando indicadores...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
              <h3 className="font-display text-lg font-semibold mb-1">MTBF por máquina</h3>
              <p className="mb-4 text-xs text-steel-400">Horas promedio entre paros consecutivos — mientras más alto, mejor.</p>
              {mtbf.length === 0 ? (
                <p className="py-10 text-center text-sm text-steel-400">
                  Se necesitan al menos 2 paros de la misma máquina para calcularlo. Registra otro paro y aparecerá.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mtbf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262b31" />
                    <XAxis dataKey="nombre" tick={tickStyle} />
                    <YAxis tick={tickStyle} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#eef1f3" }} formatter={(v) => [`${v} h`, "MTBF"]} />
                    <Bar dataKey="mtbfHoras" fill="#e8a33d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
              <h3 className="font-display text-lg font-semibold mb-1">MTTR por máquina</h3>
              <p className="mb-4 text-xs text-steel-400">Horas promedio de reparación — mientras más bajo, mejor.</p>
              {mttr.length === 0 ? (
                <p className="py-10 text-center text-sm text-steel-400">No hay paros cerrados en este periodo.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mttr}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262b31" />
                    <XAxis dataKey="nombre" tick={tickStyle} />
                    <YAxis tick={tickStyle} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#eef1f3" }}
                      formatter={(v, nombre, item) => [`${v} h (${item.payload.totalParos} ${item.payload.totalParos === 1 ? "paro" : "paros"})`, "MTTR"]}
                    />
                    <Bar dataKey="mttrHoras" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
            <div className="mb-1 flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-semibold">Inversión en repuestos por área</h3>
              <div className="text-right">
                <p className="text-xs text-steel-400">Total preventivo</p>
                <p className="font-display text-xl font-semibold text-emerald-300">{dinero(totalPreventivo)}</p>
              </div>
            </div>
            <p className="mb-4 text-xs text-steel-400">
              Solo mantenimientos preventivos. Costo = cantidad usada × costo actual del repuesto.
            </p>
            {inversionPorArea.length === 0 ? (
              <p className="py-8 text-center text-sm text-steel-400">
                No hay consumos de repuestos en mantenimientos preventivos en este periodo.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, inversionPorArea.length * 52)}>
                <BarChart data={inversionPorArea} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262b31" horizontal={false} />
                  <XAxis type="number" tick={tickStyle} tickFormatter={(v) => `Q${v}`} />
                  <YAxis type="category" dataKey="nombre" width={120} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#eef1f3" }} formatter={(v) => [dinero(v), "Inversión"]} />
                  <Bar dataKey="total" fill="#34d399" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Consumo de repuestos</h3>
              <span className="text-sm text-steel-400">
                {consumos.length} {consumos.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            {consumos.length === 0 ? (
              <p className="text-sm text-steel-400">No hay consumos registrados en este periodo.</p>
            ) : (
              <>
                <div className="max-h-96 overflow-auto rounded border border-graphite-700">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-graphite-800">
                      <tr className="border-b border-steel-600 text-left">
                        <th className="p-2 font-medium text-steel-400">Fecha</th>
                        <th className="p-2 font-medium text-steel-400">Repuesto</th>
                        <th className="p-2 font-medium text-steel-400">Cantidad</th>
                        <th className="p-2 font-medium text-steel-400">Máquina</th>
                        <th className="p-2 font-medium text-steel-400">Área</th>
                        <th className="p-2 font-medium text-steel-400">Tipo</th>
                        <th className="p-2 font-medium text-steel-400">Costo total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumos.map((c) => (
                        <tr key={c.consumoId} className="border-b border-graphite-700 last:border-0">
                          <td className="whitespace-nowrap p-2">{new Date(c.fecha).toLocaleDateString()}</td>
                          <td className="p-2">
                            {c.repuesto}
                            <span className="block text-xs text-steel-400">{c.categoria}</span>
                          </td>
                          <td className="whitespace-nowrap p-2">{c.cantidad} {abreviar(c.unidadMedida)}</td>
                          <td className="p-2">{c.maquina}</td>
                          <td className="p-2">{c.area}</td>
                          <td className="p-2">{c.tipoMantenimiento}</td>
                          <td className="whitespace-nowrap p-2">{dinero(c.costoTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-right text-sm text-steel-400">
                  Total del periodo: <strong className="text-paper">{dinero(totalConsumo)}</strong>
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}