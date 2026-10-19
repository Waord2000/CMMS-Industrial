import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileDown } from "lucide-react";
import autoTable from "jspdf-autotable";
import { getMtbf, getMttr, getConsumoRepuestos } from "../services/indicadoresService";
import { crearDocumento, agregarPiePagina } from "../Utils/pdf";

const btnSecondary = "flex items-center gap-1.5 rounded border border-steel-600 px-3 py-1.5 text-xs hover:border-amber hover:text-amber transition-colors";

function dibujarBarras(doc, startY, titulo, datos, valorKey, colorRGB, unidad) {
  const altoPagina = doc.internal.pageSize.getHeight();
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(titulo, 14, y);
  y += 8;

  const anchoPagina = doc.internal.pageSize.getWidth();
  const margenIzq = 50;
  const anchoMax = anchoPagina - margenIzq - 30;
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
    doc.text(`${d[valorKey]} ${unidad}`, margenIzq + anchoBarra + 3, y + altoBarra - 1.5);

    y += altoBarra + 3;
  });

  return y + 4;
}

export default function Indicadores() {
  const [mtbf, setMtbf] = useState([]);
  const [mttr, setMttr] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    setCargando(true);
    setError("");
    try {
      const [datosMtbf, datosMttr, datosConsumos] = await Promise.all([getMtbf(), getMttr(), getConsumoRepuestos()]);
      setMtbf(datosMtbf.map((d) => ({ ...d, mtbfHoras: Number(d.mtbfHoras?.toFixed(1) ?? 0) })));
      setMttr(datosMttr.map((d) => ({ ...d, mttrHoras: Number(d.mttrHoras?.toFixed(1) ?? 0) })));
      setConsumos(datosConsumos.slice(0, 10));
    } catch {
      setError("No se pudieron cargar los indicadores.");
    } finally {
      setCargando(false);
    }
  }

  function handleExportarPDF() {
    const doc = crearDocumento("Indicadores de Confiabilidad", "MTBF, MTTR y consumo de repuestos", "portrait");
    let y = 36;

    if (mtbf.length > 0) {
      y = dibujarBarras(doc, y, "MTBF por máquina (horas — mientras más alto, mejor)", mtbf, "mtbfHoras", [232, 163, 61], "h");
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("No hay suficientes paros registrados para calcular MTBF.", 14, y);
      y += 10;
    }

    y += 6;

    if (mttr.length > 0) {
      y = dibujarBarras(doc, y, "MTTR por máquina (horas — mientras más bajo, mejor)", mttr, "mttrHoras", [248, 113, 113], "h");
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("No hay paros cerrados para calcular MTTR.", 14, y);
      y += 10;
    }

    y += 6;
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("Consumo de repuestos reciente", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Repuesto", "Cantidad", "Costo total", "Fecha"]],
      body: consumos.length > 0
        ? consumos.map((c) => [c.nombreRepuesto, c.cantidad, `Q ${Number(c.costoTotal).toFixed(2)}`, new Date(c.fechaConsumo).toLocaleDateString()])
        : [["Sin datos registrados", "", "", ""]],
      headStyles: { fillColor: [232, 163, 61], textColor: [36, 26, 6] },
      styles: { fontSize: 9 },
    });

    agregarPiePagina(doc);
    doc.save(`Indicadores_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const tooltipStyle = { backgroundColor: "#1c2025", border: "1px solid #3a414a", borderRadius: "6px", fontSize: "13px" };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Indicadores de Confiabilidad</h2>
        <button onClick={handleExportarPDF} className={btnSecondary}>
          <FileDown size={14} />
          Exportar PDF
        </button>
      </div>
      <p className="mb-6 text-steel-400">MTBF (tiempo medio entre fallas) y MTTR (tiempo medio de reparación) por máquina.</p>

      {cargando && <p className="text-steel-400">Cargando indicadores...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
              <h3 className="font-display text-lg font-semibold mb-1">MTBF por máquina</h3>
              <p className="mb-4 text-xs text-steel-400">Horas promedio entre fallas — mientras más alto, mejor.</p>
              {mtbf.length === 0 ? (
                <p className="py-10 text-center text-sm text-steel-400">Aún no hay suficientes paros registrados para calcularlo.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mtbf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262b31" />
                    <XAxis dataKey="nombre" tick={{ fill: "#6b7480", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#6b7480", fontSize: 11 }} />
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
                <p className="py-10 text-center text-sm text-steel-400">Aún no hay paros cerrados para calcularlo.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mttr}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262b31" />
                    <XAxis dataKey="nombre" tick={{ fill: "#6b7480", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#6b7480", fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#eef1f3" }} formatter={(v) => [`${v} h`, "MTTR"]} />
                    <Bar dataKey="mttrHoras" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-steel-600 bg-graphite-800 p-4 shadow-sm shadow-black/30">
            <h3 className="font-display text-lg font-semibold mb-3">Consumo de repuestos reciente</h3>
            {consumos.length === 0 ? (
              <p className="text-sm text-steel-400">Aún no hay consumos registrados.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-steel-600 text-left">
                    <th className="p-2 font-medium text-steel-400">Repuesto</th>
                    <th className="p-2 font-medium text-steel-400">Cantidad</th>
                    <th className="p-2 font-medium text-steel-400">Costo total</th>
                    <th className="p-2 font-medium text-steel-400">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((c) => (
                    <tr key={c.consumoId} className="border-b border-graphite-700 last:border-0">
                      <td className="p-2">{c.nombreRepuesto}</td>
                      <td className="p-2">{c.cantidad}</td>
                      <td className="p-2">Q {Number(c.costoTotal).toFixed(2)}</td>
                      <td className="p-2">{new Date(c.fechaConsumo).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}